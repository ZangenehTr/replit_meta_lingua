import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users";

export const adminCopilotMessages = pgTable("admin_copilot_messages", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").references(() => users.id).notNull(),
  conversationId: varchar("conversation_id", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  toolName: varchar("tool_name", { length: 100 }),
  toolResult: jsonb("tool_result"),
  requiresConfirmation: boolean("requires_confirmation").default(false).notNull(),
  confirmed: boolean("confirmed").default(false).notNull(),
  pendingToolCall: jsonb("pending_tool_call"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminCopilotMessageSchema = z.object({
  adminUserId: z.number(),
  conversationId: z.string().max(100),
  role: z.enum(['user', 'assistant', 'tool']),
  content: z.string(),
  toolName: z.string().max(100).optional().nullable(),
  toolResult: z.any().optional().nullable(),
  requiresConfirmation: z.boolean().default(false),
  confirmed: z.boolean().default(false),
  pendingToolCall: z.any().optional().nullable(),
});

export type AdminCopilotMessage = typeof adminCopilotMessages.$inferSelect;
export type InsertAdminCopilotMessage = z.infer<typeof insertAdminCopilotMessageSchema>;
