import { Router } from 'express';
import { db } from '../db.js';
import { 
  visitorChatSessions, visitorChatMessages, visitorChatSettings,
  visitorChatCannedResponses, users, guestLeads 
} from '@shared/schema.js';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { aiSalesAgent } from '../services/ai-sales-agent/sales-agent-service.js';

const router = Router();

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) cleaned = '+98' + cleaned.slice(1);
  if (cleaned.startsWith('98') && !cleaned.startsWith('+98')) cleaned = '+' + cleaned;
  return cleaned;
}

async function getChatSettings() {
  const [settings] = await db.select().from(visitorChatSettings).limit(1);
  return settings || { 
    chatMode: 'hybrid', collectContactFirst: true, 
    autoEscalateAfter: 3, aiPersonality: 'professional',
    businessHoursStart: '09:00', businessHoursEnd: '18:00',
    businessDays: [1,2,3,4,5,6], timezone: 'Asia/Tehran',
    aiGreeting: 'Welcome! How can I help you?',
    aiGreetingFa: 'خوش آمدید! چطور می‌توانم کمکتان کنم؟',
    aiGreetingAr: 'مرحباً! كيف يمكنني مساعدتك؟'
  };
}

function isWithinBusinessHours(settings: any): boolean {
  try {
    const now = new Date();
    const tz = settings.timezone || 'Asia/Tehran';
    const formatter = new Intl.DateTimeFormat('en-US', { 
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short'
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const dayName = parts.find(p => p.type === 'weekday')?.value;
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayNum = dayMap[dayName || 'Mon'] ?? 1;
    const days = Array.isArray(settings.businessDays) ? settings.businessDays : [1,2,3,4,5,6];
    if (!days.includes(dayNum)) return false;
    const [startH, startM] = (settings.businessHoursStart || '09:00').split(':').map(Number);
    const [endH, endM] = (settings.businessHoursEnd || '18:00').split(':').map(Number);
    const nowMin = hour * 60 + minute;
    return nowMin >= startH * 60 + startM && nowMin <= endH * 60 + endM;
  } catch { return true; }
}

async function shouldUseAI(settings: any, adminOnline: boolean): Promise<boolean> {
  if (settings.chatMode === 'ai') return true;
  if (settings.chatMode === 'human') return false;
  if (!adminOnline && !isWithinBusinessHours(settings)) return true;
  if (!adminOnline) return true;
  return false;
}

router.post('/sessions', async (req, res) => {
  try {
    const sessionId = nanoid(32);
    const language = req.body.language || 'fa';
    const settings = await getChatSettings();
    const now = new Date();
    
    const [session] = await db
      .insert(visitorChatSessions)
      .values({
        sessionId,
        language,
        status: 'active',
        chatMode: settings.chatMode,
        lastMessageAt: now,
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip
        }
      } as any)
      .returning();

    res.json({ 
      ...session, 
      collectContactFirst: settings.collectContactFirst,
      chatMode: settings.chatMode
    });
  } catch (error) {
    console.error('Error creating visitor chat session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const [session] = await db
      .select()
      .from(visitorChatSessions)
      .where(eq(visitorChatSessions.sessionId, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await db
      .select()
      .from(visitorChatMessages)
      .where(eq(visitorChatMessages.sessionId, session.id))
      .orderBy(visitorChatMessages.createdAt);

    let matchedUser = null;
    if (session.matchedUserId) {
      const [user] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phoneNumber,
        email: users.email,
        role: users.role
      }).from(users).where(eq(users.id, session.matchedUserId));
      matchedUser = user || null;
    }

    let matchedLead = null;
    if (session.matchedLeadId) {
      const [lead] = await db.select().from(guestLeads).where(eq(guestLeads.id, session.matchedLeadId));
      matchedLead = lead || null;
    }

    const settings = await getChatSettings();

    res.json({ 
      session, messages, matchedUser, matchedLead,
      collectContactFirst: settings.collectContactFirst,
      chatMode: settings.chatMode
    });
  } catch (error) {
    console.error('Error fetching visitor chat session:', error);
    res.status(500).json({ error: 'Failed to fetch chat session' });
  }
});

router.post('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, senderType, senderName, senderId } = req.body;

    if (!message || !senderType) {
      return res.status(400).json({ error: 'Message and senderType are required' });
    }

    const [session] = await db
      .select()
      .from(visitorChatSessions)
      .where(eq(visitorChatSessions.sessionId, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const [newMessage] = await db
      .insert(visitorChatMessages)
      .values({
        sessionId: session.id,
        senderType,
        senderName: senderName || (senderType === 'visitor' ? (session.visitorName || 'Visitor') : 'Support'),
        senderId: senderId || null,
        message,
        messageType: 'text',
        isRead: false
      } as any)
      .returning();

    await db
      .update(visitorChatSessions)
      .set({ lastMessageAt: new Date() } as any)
      .where(eq(visitorChatSessions.id, session.id));

    let aiResponse = null;
    if (senderType === 'visitor') {
      const settings = await getChatSettings();
      const useAI = await shouldUseAI(settings, false);
      
      if (useAI) {
        try {
          const agentResponse = await aiSalesAgent.processMessage(
            sessionId, message, 'web', sessionId,
            { language: session.language, visitorName: session.visitorName }
          );
          
          const [aiMsg] = await db
            .insert(visitorChatMessages)
            .values({
              sessionId: session.id,
              senderType: 'ai',
              senderName: 'Meta Lingua AI',
              message: agentResponse.message,
              messageType: 'text',
              isRead: false,
              metadata: { 
                leadScore: agentResponse.leadScore, 
                shouldEscalate: agentResponse.shouldEscalate,
                suggestedActions: agentResponse.suggestedActions 
              }
            } as any)
            .returning();

          aiResponse = aiMsg;

          if (agentResponse.shouldEscalate) {
            await db
              .update(visitorChatSessions)
              .set({ chatMode: 'human' } as any)
              .where(eq(visitorChatSessions.id, session.id));
          }
        } catch (aiError) {
          console.error('AI response error:', aiError);
        }
      }
    }

    res.json({ message: newMessage, aiResponse });
  } catch (error) {
    console.error('Error sending visitor chat message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.patch('/sessions/:sessionId/contact', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { visitorName, visitorEmail, visitorPhone } = req.body;

    const updates: any = {};
    if (visitorName) updates.visitorName = visitorName;
    if (visitorEmail) updates.visitorEmail = visitorEmail;
    if (visitorPhone) updates.visitorPhone = visitorPhone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one contact field is required' });
    }

    let matchedUser = null;
    let matchedLead = null;

    if (visitorPhone) {
      const normalizedPhone = normalizePhone(visitorPhone);
      const [user] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phoneNumber,
        email: users.email,
        role: users.role
      }).from(users).where(
        or(
          eq(users.phoneNumber, normalizedPhone),
          eq(users.phoneNumber, visitorPhone)
        )
      );
      if (user) {
        matchedUser = user;
        updates.matchedUserId = user.id;
        if (!visitorName && (user.firstName || user.lastName)) {
          updates.visitorName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        }
      }
    }

    if (visitorEmail && !matchedUser) {
      const [user] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phoneNumber,
        email: users.email,
        role: users.role
      }).from(users).where(eq(users.email, visitorEmail));
      if (user) {
        matchedUser = user;
        updates.matchedUserId = user.id;
        if (!visitorName && (user.firstName || user.lastName)) {
          updates.visitorName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        }
      }
    }

    if (!matchedUser) {
      const conditions = [];
      if (visitorPhone) conditions.push(eq(guestLeads.phone, visitorPhone));
      if (visitorEmail) conditions.push(ilike(guestLeads.email, visitorEmail));
      
      if (conditions.length > 0) {
        const [lead] = await db.select().from(guestLeads)
          .where(or(...conditions))
          .limit(1);
        if (lead) {
          matchedLead = lead;
          updates.matchedLeadId = lead.id;
          if (!visitorName && lead.name) {
            updates.visitorName = lead.name;
          }
        }
      }

      if (!matchedLead && (visitorPhone || visitorEmail)) {
        const [newLead] = await db.insert(guestLeads).values({
          name: visitorName || 'Visitor',
          email: visitorEmail || '',
          phone: visitorPhone || null,
          source: 'visitor_chat',
          status: 'new',
          notes: 'Auto-created from visitor chat contact submission'
        } as any).returning();
        
        if (newLead) {
          matchedLead = newLead;
          updates.matchedLeadId = newLead.id;
          console.log(`📋 Created guest lead #${newLead.id} from visitor chat`);
        }
      }
    }

    const [updatedSession] = await db
      .update(visitorChatSessions)
      .set(updates)
      .where(eq(visitorChatSessions.sessionId, sessionId))
      .returning();

    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const contactFields = [];
    if (visitorName) contactFields.push(`Name: ${visitorName}`);
    if (visitorEmail) contactFields.push(`Email: ${visitorEmail}`);
    if (visitorPhone) contactFields.push(`Phone: ${visitorPhone}`);

    await db
      .insert(visitorChatMessages)
      .values({
        sessionId: updatedSession.id,
        senderType: 'system',
        message: `Contact information received: ${contactFields.join(', ')}`,
        messageType: 'contact_capture',
        metadata: { visitorName, visitorEmail, visitorPhone },
        isRead: false
      } as any);

    res.json({ 
      session: updatedSession, 
      matchedUser, 
      matchedLead,
      identifiedName: updates.visitorName || visitorName
    });
  } catch (error) {
    console.error('Error updating visitor contact info:', error);
    res.status(500).json({ error: 'Failed to update contact information' });
  }
});

router.patch('/sessions/:sessionId/rate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, ratingComment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const [updatedSession] = await db
      .update(visitorChatSessions)
      .set({ rating, ratingComment, status: 'closed', closedAt: new Date() } as any)
      .where(eq(visitorChatSessions.sessionId, sessionId))
      .returning();

    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(updatedSession);
  } catch (error) {
    console.error('Error rating chat session:', error);
    res.status(500).json({ error: 'Failed to rate chat session' });
  }
});

router.get('/settings', async (_req, res) => {
  try {
    const settings = await getChatSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching chat settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const {
      chatMode, aiGreeting, aiGreetingFa, aiGreetingAr,
      businessHoursStart, businessHoursEnd, businessDays, timezone,
      autoEscalateAfter, collectContactFirst, aiPersonality, isActive
    } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (chatMode !== undefined) updateData.chatMode = chatMode;
    if (aiGreeting !== undefined) updateData.aiGreeting = aiGreeting;
    if (aiGreetingFa !== undefined) updateData.aiGreetingFa = aiGreetingFa;
    if (aiGreetingAr !== undefined) updateData.aiGreetingAr = aiGreetingAr;
    if (businessHoursStart !== undefined) updateData.businessHoursStart = businessHoursStart;
    if (businessHoursEnd !== undefined) updateData.businessHoursEnd = businessHoursEnd;
    if (businessDays !== undefined) updateData.businessDays = businessDays;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (autoEscalateAfter !== undefined) updateData.autoEscalateAfter = autoEscalateAfter;
    if (collectContactFirst !== undefined) updateData.collectContactFirst = collectContactFirst;
    if (aiPersonality !== undefined) updateData.aiPersonality = aiPersonality;
    if (isActive !== undefined) updateData.isActive = isActive;

    const existing = await db.select().from(visitorChatSettings).limit(1);
    let result;
    if (existing.length > 0) {
      [result] = await db.update(visitorChatSettings).set(updateData)
        .where(eq(visitorChatSettings.id, existing[0].id)).returning();
    } else {
      [result] = await db.insert(visitorChatSettings).values(updateData).returning();
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating chat settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/admin/sessions', async (req, res) => {
  try {
    const status = (req.query.status as string) || 'active';
    
    const sessions = await db
      .select()
      .from(visitorChatSessions)
      .where(eq(visitorChatSessions.status, status))
      .orderBy(desc(visitorChatSessions.lastMessageAt));

    const enrichedSessions = await Promise.all(sessions.map(async (session) => {
      const msgCount = await db.select({ count: sql<number>`count(*)` })
        .from(visitorChatMessages)
        .where(eq(visitorChatMessages.sessionId, session.id));
      
      const unreadCount = await db.select({ count: sql<number>`count(*)` })
        .from(visitorChatMessages)
        .where(and(
          eq(visitorChatMessages.sessionId, session.id),
          eq(visitorChatMessages.senderType, 'visitor'),
          eq(visitorChatMessages.isRead, false)
        ));

      let matchedUser = null;
      if (session.matchedUserId) {
        const [user] = await db.select({
          id: users.id, firstName: users.firstName, lastName: users.lastName,
          phone: users.phoneNumber, email: users.email, role: users.role
        }).from(users).where(eq(users.id, session.matchedUserId));
        matchedUser = user || null;
      }

      return {
        ...session,
        messageCount: Number(msgCount[0]?.count || 0),
        unreadCount: Number(unreadCount[0]?.count || 0),
        matchedUser
      };
    }));

    res.json(enrichedSessions);
  } catch (error) {
    console.error('Error fetching admin chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

router.get('/admin/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const [session] = await db.select().from(visitorChatSessions)
      .where(eq(visitorChatSessions.sessionId, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await db.select().from(visitorChatMessages)
      .where(eq(visitorChatMessages.sessionId, session.id))
      .orderBy(visitorChatMessages.createdAt);

    let matchedUser = null;
    if (session.matchedUserId) {
      const [user] = await db.select({
        id: users.id, firstName: users.firstName, lastName: users.lastName,
        phone: users.phoneNumber, email: users.email, role: users.role
      }).from(users).where(eq(users.id, session.matchedUserId));
      matchedUser = user || null;
    }

    let matchedLead = null;
    if (session.matchedLeadId) {
      const [lead] = await db.select().from(guestLeads).where(eq(guestLeads.id, session.matchedLeadId));
      matchedLead = lead || null;
    }

    await db.update(visitorChatMessages).set({ isRead: true } as any)
      .where(and(
        eq(visitorChatMessages.sessionId, session.id),
        eq(visitorChatMessages.isRead, false)
      ));

    res.json({ session, messages, matchedUser, matchedLead });
  } catch (error) {
    console.error('Error fetching admin session detail:', error);
    res.status(500).json({ error: 'Failed to fetch session detail' });
  }
});

router.patch('/admin/sessions/:sessionId/assign', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { assignedTo } = req.body;

    const [updatedSession] = await db
      .update(visitorChatSessions)
      .set({ assignedTo, chatMode: 'human' } as any)
      .where(eq(visitorChatSessions.sessionId, sessionId))
      .returning();

    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(updatedSession);
  } catch (error) {
    console.error('Error assigning chat session:', error);
    res.status(500).json({ error: 'Failed to assign chat session' });
  }
});

router.patch('/admin/sessions/:sessionId/close', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [updatedSession] = await db
      .update(visitorChatSessions)
      .set({ status: 'closed', closedAt: new Date() } as any)
      .where(eq(visitorChatSessions.sessionId, sessionId))
      .returning();

    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(updatedSession);
  } catch (error) {
    console.error('Error closing chat session:', error);
    res.status(500).json({ error: 'Failed to close chat session' });
  }
});

router.get('/canned-responses', async (req, res) => {
  try {
    const language = (req.query.language as string) || 'fa';
    const responses = await db.select().from(visitorChatCannedResponses)
      .where(and(
        eq(visitorChatCannedResponses.language, language),
        eq(visitorChatCannedResponses.isActive, true)
      ))
      .orderBy(visitorChatCannedResponses.category);

    res.json(responses);
  } catch (error) {
    console.error('Error fetching canned responses:', error);
    res.status(500).json({ error: 'Failed to fetch canned responses' });
  }
});

router.post('/canned-responses', async (req, res) => {
  try {
    const { category, language, shortcut, message } = req.body;
    if (!category || !language || !shortcut || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [response] = await db.insert(visitorChatCannedResponses)
      .values({ category, language, shortcut, message })
      .returning();

    res.json(response);
  } catch (error) {
    console.error('Error creating canned response:', error);
    res.status(500).json({ error: 'Failed to create canned response' });
  }
});

router.delete('/canned-responses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(visitorChatCannedResponses).where(eq(visitorChatCannedResponses.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting canned response:', error);
    res.status(500).json({ error: 'Failed to delete canned response' });
  }
});

router.get('/admin/stats', async (_req, res) => {
  try {
    const totalActive = await db.select({ count: sql<number>`count(*)` })
      .from(visitorChatSessions).where(eq(visitorChatSessions.status, 'active'));
    
    const totalClosed = await db.select({ count: sql<number>`count(*)` })
      .from(visitorChatSessions).where(eq(visitorChatSessions.status, 'closed'));
    
    const avgRating = await db.select({ avg: sql<number>`avg(rating)` })
      .from(visitorChatSessions).where(sql`rating IS NOT NULL`);
    
    const identifiedVisitors = await db.select({ count: sql<number>`count(*)` })
      .from(visitorChatSessions).where(sql`matched_user_id IS NOT NULL OR matched_lead_id IS NOT NULL`);

    res.json({
      activeSessions: Number(totalActive[0]?.count || 0),
      closedSessions: Number(totalClosed[0]?.count || 0),
      averageRating: Number(avgRating[0]?.avg || 0).toFixed(1),
      identifiedVisitors: Number(identifiedVisitors[0]?.count || 0)
    });
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
