import express from 'express';
import type { Request, Response } from 'express';
import { db, pool } from '../db';
import { adminCopilotMessages } from '@shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { AIProviderManager } from '../ai-providers/ai-provider-manager';
import { COPILOT_TOOLS, getToolsForOpenAI, isToolRequiresConfirmation, executeTool, getEnrolledUserIds } from '../services/copilot-tools';
import { authenticateToken, requireRole } from '../middleware/auth';
import type { IStorage } from '../storage';

const aiProvider = new AIProviderManager();
aiProvider.initialize().catch(err => console.error('Copilot AI provider init failed:', err));

async function callWithToolsFallback(
  messages: unknown[],
  tools: unknown[]
): Promise<{ choices: { message: { content: string | null; tool_calls?: unknown[] } }[] } | null> {
  const providers = aiProvider.getAllOpenAICompatibleProviders();
  for (const provider of providers) {
    try {
      const result = await provider.createChatCompletionWithTools(
        messages as Parameters<typeof provider.createChatCompletionWithTools>[0],
        tools as Parameters<typeof provider.createChatCompletionWithTools>[1]
      );
      return result as { choices: { message: { content: string | null; tool_calls?: unknown[] } }[] };
    } catch (err) {
      console.warn(`[AdminCopilot] Provider ${provider.name} failed, trying next:`, err instanceof Error ? err.message : String(err));
    }
  }
  console.error('[AdminCopilot] All OpenAI-compatible providers failed for tool call');
  return null;
}

async function ensureCopilotTable(): Promise<void> {
  const SQL = `
    CREATE TABLE IF NOT EXISTS admin_copilot_messages (
      id SERIAL PRIMARY KEY,
      admin_user_id INTEGER NOT NULL REFERENCES users(id),
      conversation_id VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      tool_name VARCHAR(100),
      tool_result JSONB,
      requires_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
      confirmed BOOLEAN NOT NULL DEFAULT FALSE,
      pending_tool_call JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_copilot_messages_user_conv 
      ON admin_copilot_messages(admin_user_id, conversation_id, created_at);
  `;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await pool.query(SQL);
      console.log('[AdminCopilot] Table verified/created');
      return;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 2000));
      } else {
        console.warn(`[AdminCopilot] Table migration failed after ${attempt} retries: ${errMsg}`);
      }
    }
  }
}

ensureCopilotTable().catch(err => {
  console.error('[AdminCopilot] Failed to ensure table:', err instanceof Error ? err.message : String(err));
});

function buildOllamaSystemPrompt(): string {
  const toolDescriptions = COPILOT_TOOLS.map(tool => {
    const params = Object.entries(tool.parameters.properties || {})
      .map(([key, val]) => {
        const v = val as Record<string, string>;
        const required = tool.parameters.required?.includes(key) ? ', required' : '';
        return `  - ${key} (${v.type}${required}): ${v.description}`;
      })
      .join('\n');
    return `Tool: ${tool.name}\nDescription: ${tool.description}\nParameters:\n${params}`;
  }).join('\n\n');

  return `You are an AI Copilot assistant for the MetaLingo admin panel. You help administrators manage the language learning platform.

When you need to call a tool, respond with ONLY a valid JSON object in this exact format:
{"tool": "tool_name_here", "params": {"param1": "value1", "param2": "value2"}}

If you don't need to call a tool, respond normally in plain text.

Available tools:
${toolDescriptions}

Important rules:
1. Always respond in the same language as the user (Persian or English).
2. For destructive or bulk operations, the system will ask for confirmation before executing.
3. If a user asks for something outside your tools, explain politely what you can and cannot do.
4. Be concise and professional.
5. If you need to call a tool, output ONLY the JSON with no extra text.`;
}

function extractToolCallFromOllamaResponse(content: string): { tool: string; params: Record<string, unknown> } | null {
  const jsonMatch = content.match(/\{[\s\S]*"tool"[\s\S]*"params"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { tool?: string; params?: unknown };
      if (parsed.tool && typeof parsed.params === 'object' && parsed.params !== null) {
        return { tool: parsed.tool, params: parsed.params as Record<string, unknown> };
      }
    } catch {
      // Not valid JSON - return null
    }
  }
  return null;
}

async function buildConfirmationMessage(
  toolName: string,
  params: Record<string, unknown>,
  storage: IStorage
): Promise<string> {
  switch (toolName) {
    case 'assign_teacher_to_course': {
      const course = await storage.getCourse(Number(params.courseId)).catch(() => null);
      const teacher = await storage.getUser(Number(params.teacherId)).catch(() => null);
      const courseName = course ? `"${course.title}"` : `ID: ${params.courseId}`;
      const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : `ID: ${params.teacherId}`;
      return `I'm about to assign teacher ${teacherName} to course ${courseName}. This will replace any existing instructor. Please confirm.`;
    }
    case 'create_class_sessions': {
      const course = await storage.getCourse(Number(params.courseId)).catch(() => null);
      const courseName = course ? `"${course.title}"` : `ID: ${params.courseId}`;
      const schedule = (params.schedule as Record<string, unknown>) || {};
      const sessionCount = schedule.sessionCount || params.sessionCount;
      const startDate = schedule.startDate || params.startDate;
      const startTime = schedule.startTime || params.startTime;
      const intervalDays = schedule.intervalDays || params.intervalDays || 7;
      return `I'm about to create ${sessionCount} sessions for course ${courseName} starting ${startDate} at ${startTime} (every ${intervalDays} days). This will create ${sessionCount} new records. Please confirm.`;
    }
    case 'create_sms_campaign': {
      const audienceFilter = (params.audienceFilter as Record<string, unknown>) || {};
      const targetRole = (audienceFilter.role as string) || 'Student';
      const enrolledOnly = Boolean(audienceFilter.enrolledOnly);
      const cefrLevelFilter = audienceFilter.cefrLevel as string | undefined;
      const allUsers = await storage.getAllUsers().catch(() => []);
      let targetUsers = allUsers.filter(u => u.role === targetRole);
      if (enrolledOnly) {
        const enrolledIds = await getEnrolledUserIds(storage).catch(() => new Set<number>());
        targetUsers = targetUsers.filter(u => enrolledIds.has(u.id));
      }
      if (cefrLevelFilter) {
        const lvl = cefrLevelFilter.toLowerCase();
        targetUsers = targetUsers.filter(u => {
          const userLevel = String((u as unknown as Record<string, unknown>).level || '').toLowerCase();
          return userLevel.includes(lvl);
        });
      }
      const recipientCount = targetUsers.length;
      const levelSuffix = cefrLevelFilter ? ` (level: ${cefrLevelFilter})` : '';
      return `I'm about to broadcast SMS campaign "${String(params.name)}" to ${recipientCount} ${targetRole.toLowerCase()}s${levelSuffix} with message: "${String(params.message).substring(0, 100)}". This will create exactly ${recipientCount} notification records in the database. Please confirm.`;
    }
    case 'enroll_student_in_course': {
      const student = await storage.getUser(Number(params.studentId)).catch(() => null);
      const course = await storage.getCourse(Number(params.courseId)).catch(() => null);
      const studentName = student ? `${student.firstName} ${student.lastName}` : `ID: ${params.studentId}`;
      const courseName = course ? `"${course.title}"` : `ID: ${params.courseId}`;
      return `I'm about to enroll student ${studentName} in course ${courseName} with payment method: ${params.paymentMethod}. This will create 1 enrollment record. Please confirm.`;
    }
    default:
      return `I need your confirmation to proceed with action: "${toolName}" with parameters: ${JSON.stringify(params, null, 2)}`;
  }
}

export function createAdminCopilotRoutes(storage: IStorage) {
  const router = express.Router();

  router.post('/api/admin/copilot/chat', authenticateToken, requireRole(['Admin', 'admin']), async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: number } }).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { message, conversationId, confirmPending } = req.body as {
        message?: string;
        conversationId?: string;
        confirmPending?: boolean;
      };

      if (!message && !confirmPending) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const convId = conversationId || `conv_${userId}_${new Date().toISOString().split('T')[0]}`;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const history = await db.select()
        .from(adminCopilotMessages)
        .where(and(
          eq(adminCopilotMessages.adminUserId, userId),
          eq(adminCopilotMessages.conversationId, convId),
          gte(adminCopilotMessages.createdAt, todayStart)
        ))
        .orderBy(desc(adminCopilotMessages.createdAt))
        .limit(20)
        .then(rows => rows.reverse())
        .catch(err => {
          console.warn('[AdminCopilot] Could not load history:', err instanceof Error ? err.message : String(err));
          return [] as typeof adminCopilotMessages.$inferSelect[];
        });

      if (confirmPending) {
        const lastPendingMsg = [...history].reverse().find(m => m.requiresConfirmation && !m.confirmed);
        if (!lastPendingMsg?.pendingToolCall) {
          return res.status(400).json({ error: 'No pending action to confirm' });
        }

        const toolCall = lastPendingMsg.pendingToolCall as { name: string; params: Record<string, unknown> };

        await db.update(adminCopilotMessages)
          .set({ confirmed: true })
          .where(eq(adminCopilotMessages.id, lastPendingMsg.id));

        const result = await executeTool(toolCall.name, toolCall.params, storage);
        const toolResultContent = result.success
          ? `✅ ${result.summary || 'Action completed successfully.'}`
          : `❌ Failed: ${result.error}`;

        await db.insert(adminCopilotMessages).values({
          adminUserId: userId,
          conversationId: convId,
          role: 'assistant',
          content: toolResultContent,
          toolName: toolCall.name,
          toolResult: result.data ?? null,
        }).catch(err => {
          console.error('[AdminCopilot] Failed to save tool result message:', err instanceof Error ? err.message : String(err));
        });

        if (!result.success) {
          return res.json({
            conversationId: convId,
            response: { role: 'assistant', content: toolResultContent, toolName: toolCall.name, toolResult: null, type: 'tool_result' }
          });
        }

        const completedStepSummary = `[Tool ${toolCall.name} executed: ${result.summary}]`;

        await db.insert(adminCopilotMessages).values({
          adminUserId: userId,
          conversationId: convId,
          role: 'user',
          content: `${completedStepSummary} Please continue with the next step or summarize what was accomplished.`,
        }).catch(() => undefined);

        const postConfirmHistory = await db.select()
          .from(adminCopilotMessages)
          .where(and(
            eq(adminCopilotMessages.adminUserId, userId),
            eq(adminCopilotMessages.conversationId, convId),
            gte(adminCopilotMessages.createdAt, todayStart)
          ))
          .orderBy(desc(adminCopilotMessages.createdAt))
          .limit(30)
          .then(rows => rows.reverse())
          .catch(() => [] as typeof adminCopilotMessages.$inferSelect[]);

        type ApiMsg =
          | { role: 'system' | 'user' | 'assistant'; content: string }
          | { role: 'tool'; tool_call_id: string; content: string };

        const resumeMessages: ApiMsg[] = [
          { role: 'system', content: `You are an AI Copilot for the MetaLingo admin panel. Help administrators manage the language learning platform efficiently. You may call multiple tools in sequence to complete complex admin tasks. Always respond in the same language the user writes in (Persian or English). Be concise and professional.` },
          ...postConfirmHistory.slice(-15).map(m => ({
            role: m.role === 'user' ? 'user' as const : 'assistant' as const,
            content: m.content
          }))
        ];

        const confirmToolResults: { toolName: string; summary: string; data: unknown }[] = [
          { toolName: toolCall.name, summary: result.summary || 'Action completed', data: result.data }
        ];
        const tools = getToolsForOpenAI();
        const MAX_RESUME_ITERATIONS = 4;

        for (let i = 0; i < MAX_RESUME_ITERATIONS; i++) {
          const resumeCompletion = await callWithToolsFallback(resumeMessages, tools);

          if (!resumeCompletion) break;

          const choice = resumeCompletion.choices?.[0];
          const toolCalls2 = choice?.message?.tool_calls;

          if (!toolCalls2 || toolCalls2.length === 0) {
            const textContent = choice?.message?.content || confirmToolResults.map(r => `✅ ${r.summary}`).join('\n');
            await db.insert(adminCopilotMessages).values({
              adminUserId: userId, conversationId: convId, role: 'assistant', content: textContent, toolResult: confirmToolResults,
            }).catch(() => undefined);
            return res.json({
              conversationId: convId,
              response: { role: 'assistant', content: textContent, type: 'tool_result', toolResults: confirmToolResults }
            });
          }

          const assistantMsg2: Record<string, unknown> = { role: 'assistant', content: choice?.message?.content || null, tool_calls: toolCalls2 };
          resumeMessages.push(assistantMsg2 as ApiMsg);

          let stopped = false;
          for (const tc of toolCalls2) {
            const tName = tc.function.name;
            let tParams: Record<string, unknown> = {};
            try { tParams = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>; } catch { /* ignore */ }

            if (isToolRequiresConfirmation(tName)) {
              const pendingTc = { name: tName, params: tParams };
              const confMsg = await buildConfirmationMessage(tName, tParams, storage);
              await db.insert(adminCopilotMessages).values({
                adminUserId: userId, conversationId: convId, role: 'assistant', content: confMsg,
                requiresConfirmation: true, confirmed: false, pendingToolCall: pendingTc,
              }).catch(() => undefined);
              return res.json({
                conversationId: convId,
                response: { role: 'assistant', content: confMsg, type: 'confirmation_required', pendingToolCall: pendingTc, completedSteps: confirmToolResults }
              });
            }

            const r2 = await executeTool(tName, tParams, storage);
            const r2Content = r2.success ? (r2.summary || 'Done.') : `Error: ${r2.error}`;
            confirmToolResults.push({ toolName: tName, summary: r2Content, data: r2.data ?? null });
            await db.insert(adminCopilotMessages).values({
              adminUserId: userId, conversationId: convId, role: 'assistant', content: `✅ ${r2Content}`, toolName: tName, toolResult: r2.data ?? null,
            }).catch(() => undefined);
            resumeMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ success: r2.success, summary: r2Content }) });
            if (!r2.success) { stopped = true; break; }
          }

          if (stopped) break;
        }

        const finalContent = confirmToolResults.map(r => `✅ ${r.summary}`).join('\n');
        return res.json({
          conversationId: convId,
          response: { role: 'assistant', content: finalContent, type: 'tool_result', toolResults: confirmToolResults }
        });
      }

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      await db.insert(adminCopilotMessages).values({
        adminUserId: userId,
        conversationId: convId,
        role: 'user',
        content: message,
      }).catch(err => {
        console.error('[AdminCopilot] Failed to save user message:', err instanceof Error ? err.message : String(err));
      });

      const hasOpenAICompatible = aiProvider.getAllOpenAICompatibleProviders().length > 0;

      if (hasOpenAICompatible) {
        type ApiMessage =
          | { role: 'system' | 'user' | 'assistant'; content: string }
          | { role: 'tool'; tool_call_id: string; content: string };

        const apiMessages: ApiMessage[] = [
          {
            role: 'system',
            content: `You are an AI Copilot for the MetaLingo admin panel. Help administrators manage the language learning platform efficiently. You may call multiple tools in sequence to complete complex admin tasks. Always respond in the same language the user writes in (Persian or English). Be concise and professional.`
          },
          ...history.map(m => ({
            role: m.role === 'user' ? 'user' as const : 'assistant' as const,
            content: m.content
          })),
          { role: 'user', content: message }
        ];

        const tools = getToolsForOpenAI();
        const MAX_TOOL_ITERATIONS = 6;
        const allToolResults: { toolName: string; summary: string; data: unknown }[] = [];
        let openAIProviderFailed = false;

        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const rawCompletion = await callWithToolsFallback(apiMessages, tools);

          if (!rawCompletion) {
            openAIProviderFailed = true;
            break;
          }

          const choice = rawCompletion.choices?.[0];
          const toolCalls = choice?.message?.tool_calls;

          if (!toolCalls || toolCalls.length === 0) {
            const textContent = choice?.message?.content || (allToolResults.length > 0
              ? allToolResults.map(r => `✅ ${r.summary}`).join('\n')
              : 'I could not process your request.');

            await db.insert(adminCopilotMessages).values({
              adminUserId: userId,
              conversationId: convId,
              role: 'assistant',
              content: textContent,
              toolResult: allToolResults.length > 0 ? allToolResults : null,
            }).catch(err => {
              console.error('[AdminCopilot] Failed to save text response:', err instanceof Error ? err.message : String(err));
            });

            return res.json({
              conversationId: convId,
              response: {
                role: 'assistant',
                content: textContent,
                type: allToolResults.length > 0 ? 'tool_result' : 'text',
                toolResults: allToolResults
              }
            });
          }

          const assistantMessage: Record<string, unknown> = {
            role: 'assistant',
            content: choice?.message?.content || null,
            tool_calls: toolCalls
          };
          apiMessages.push(assistantMessage as ApiMessage);

          let paused = false;
          for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            let toolParams: Record<string, unknown> = {};
            try {
              toolParams = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;
            } catch {
              console.warn('[AdminCopilot] Failed to parse tool arguments for:', toolName);
            }

            if (isToolRequiresConfirmation(toolName)) {
              const pendingToolCall = { name: toolName, params: toolParams };
              const confirmationMessage = await buildConfirmationMessage(toolName, toolParams, storage);

              await db.insert(adminCopilotMessages).values({
                adminUserId: userId,
                conversationId: convId,
                role: 'assistant',
                content: confirmationMessage,
                requiresConfirmation: true,
                confirmed: false,
                pendingToolCall,
              }).catch(err => {
                console.error('[AdminCopilot] Failed to save confirmation message:', err instanceof Error ? err.message : String(err));
              });

              return res.json({
                conversationId: convId,
                response: {
                  role: 'assistant',
                  content: confirmationMessage,
                  type: 'confirmation_required',
                  pendingToolCall,
                  completedSteps: allToolResults
                }
              });
            }

            const result = await executeTool(toolName, toolParams, storage);
            const toolResultContent = result.success
              ? (result.summary || 'Action completed.')
              : `Error: ${result.error}`;

            allToolResults.push({ toolName, summary: toolResultContent, data: result.data ?? null });

            await db.insert(adminCopilotMessages).values({
              adminUserId: userId,
              conversationId: convId,
              role: 'assistant',
              content: `✅ ${toolResultContent}`,
              toolName,
              toolResult: result.data ?? null,
            }).catch(err => {
              console.error('[AdminCopilot] Failed to save tool result:', err instanceof Error ? err.message : String(err));
            });

            apiMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ success: result.success, result: result.data, summary: toolResultContent })
            });

            if (!result.success) {
              paused = true;
              break;
            }
          }

          if (paused) {
            const errorSummary = allToolResults.map(r => `✅ ${r.summary}`).join('\n');
            return res.json({
              conversationId: convId,
              response: {
                role: 'assistant',
                content: errorSummary || 'An error occurred during tool execution.',
                type: 'tool_result',
                toolResults: allToolResults
              }
            });
          }
        }

        if (!openAIProviderFailed || allToolResults.length > 0) {
          const finalSummary = allToolResults.length > 0
            ? allToolResults.map(r => `✅ ${r.summary}`).join('\n')
            : 'Processing complete.';

          await db.insert(adminCopilotMessages).values({
            adminUserId: userId,
            conversationId: convId,
            role: 'assistant',
            content: finalSummary,
            toolResult: allToolResults,
          }).catch(err => {
            console.error('[AdminCopilot] Failed to save final summary:', err instanceof Error ? err.message : String(err));
          });

          return res.json({
            conversationId: convId,
            response: {
              role: 'assistant',
              content: finalSummary,
              type: 'tool_result',
              toolResults: allToolResults
            }
          });
        }

        console.warn('[AdminCopilot] All OpenAI-compatible providers failed, falling back to Ollama...');
      }

      const systemPrompt = buildOllamaSystemPrompt();
      const recentHistory = history.slice(-10);
      const ollamaMessages = [
        ...recentHistory.map(m => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content
        })),
        { role: 'user' as const, content: message }
      ];

      const completion = await aiProvider.createChatCompletion({
        messages: ollamaMessages,
        systemPrompt,
        maxTokens: 1000,
        temperature: 0.3,
      });

      const responseContent = completion.content;
      const toolCallFromOllama = extractToolCallFromOllamaResponse(responseContent);

      if (toolCallFromOllama) {
        const { tool: toolName, params: toolParams } = toolCallFromOllama;

        if (isToolRequiresConfirmation(toolName)) {
          const pendingToolCall = { name: toolName, params: toolParams };
          const confirmationMessage = await buildConfirmationMessage(toolName, toolParams, storage);

          await db.insert(adminCopilotMessages).values({
            adminUserId: userId,
            conversationId: convId,
            role: 'assistant',
            content: confirmationMessage,
            requiresConfirmation: true,
            confirmed: false,
            pendingToolCall,
          }).catch(err => {
            console.error('[AdminCopilot] Failed to save Ollama confirmation message:', err instanceof Error ? err.message : String(err));
          });

          return res.json({
            conversationId: convId,
            response: {
              role: 'assistant',
              content: confirmationMessage,
              type: 'confirmation_required',
              pendingToolCall,
            }
          });
        }

        const result = await executeTool(toolName, toolParams, storage);
        const toolResultContent = result.success
          ? `✅ ${result.summary || 'Action completed.'}`
          : `❌ Failed: ${result.error}`;

        await db.insert(adminCopilotMessages).values({
          adminUserId: userId,
          conversationId: convId,
          role: 'assistant',
          content: toolResultContent,
          toolName,
          toolResult: result.data ?? null,
        }).catch(err => {
          console.error('[AdminCopilot] Failed to save Ollama tool result:', err instanceof Error ? err.message : String(err));
        });

        return res.json({
          conversationId: convId,
          response: {
            role: 'assistant',
            content: toolResultContent,
            toolName,
            toolResult: result.data,
            type: 'tool_result'
          }
        });
      }

      await db.insert(adminCopilotMessages).values({
        adminUserId: userId,
        conversationId: convId,
        role: 'assistant',
        content: responseContent,
      }).catch(err => {
        console.error('[AdminCopilot] Failed to save Ollama text response:', err instanceof Error ? err.message : String(err));
      });

      return res.json({
        conversationId: convId,
        response: { role: 'assistant', content: responseContent, type: 'text' }
      });

    } catch (error) {
      console.error('[AdminCopilot] Chat error:', error);
      return res.status(500).json({ error: 'Failed to process copilot request' });
    }
  });

  router.post('/api/admin/copilot/cancel', authenticateToken, requireRole(['Admin', 'admin']), async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: number } }).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { conversationId } = req.body as { conversationId?: string };
      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId is required' });
      }

      await db.update(adminCopilotMessages)
        .set({ confirmed: true })
        .where(and(
          eq(adminCopilotMessages.adminUserId, userId),
          eq(adminCopilotMessages.conversationId, conversationId),
          eq(adminCopilotMessages.requiresConfirmation, true),
          eq(adminCopilotMessages.confirmed, false)
        ));

      return res.json({ success: true, message: 'Pending action cancelled.' });
    } catch (error) {
      console.error('[AdminCopilot] Cancel error:', error);
      return res.status(500).json({ error: 'Failed to cancel pending action' });
    }
  });

  router.get('/api/admin/copilot/history', authenticateToken, requireRole(['Admin', 'admin']), async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: number } }).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { conversationId } = req.query as { conversationId?: string };
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const conditions = [
        eq(adminCopilotMessages.adminUserId, userId),
        gte(adminCopilotMessages.createdAt, todayStart)
      ];

      if (conversationId) {
        conditions.push(eq(adminCopilotMessages.conversationId, conversationId));
      }

      const messages = await db.select()
        .from(adminCopilotMessages)
        .where(and(...conditions))
        .orderBy(adminCopilotMessages.createdAt)
        .limit(100)
        .catch(err => {
          console.warn('[AdminCopilot] Could not load history:', err instanceof Error ? err.message : String(err));
          return [] as typeof adminCopilotMessages.$inferSelect[];
        });

      return res.json({ messages });
    } catch (error) {
      console.error('[AdminCopilot] History error:', error);
      return res.status(500).json({ error: 'Failed to load history' });
    }
  });

  router.delete('/api/admin/copilot/history', authenticateToken, requireRole(['Admin', 'admin']), async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: number } }).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      await pool.query(
        'DELETE FROM admin_copilot_messages WHERE admin_user_id = $1',
        [userId]
      );

      return res.json({ success: true, message: 'Conversation history cleared.' });
    } catch (error) {
      console.error('[AdminCopilot] Delete history error:', error);
      return res.status(500).json({ error: 'Failed to clear history' });
    }
  });

  return router;
}
