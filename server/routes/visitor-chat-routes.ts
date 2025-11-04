import { Router } from 'express';
import { db } from '../db.js';
import { visitorChatSessions, visitorChatMessages, insertVisitorChatSessionSchema, insertVisitorChatMessageSchema } from '@shared/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const router = Router();

// Create a new visitor chat session
router.post('/sessions', async (req, res) => {
  try {
    const sessionId = nanoid(32); // Generate unique session ID
    const language = req.body.language || 'fa';
    const now = new Date();
    
    const [session] = await db
      .insert(visitorChatSessions)
      .values({
        sessionId,
        language,
        status: 'active',
        lastMessageAt: now,
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip
        }
      })
      .returning();

    res.json(session);
  } catch (error) {
    console.error('Error creating visitor chat session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// Get a visitor chat session by sessionId
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

    // Get messages for this session
    const messages = await db
      .select()
      .from(visitorChatMessages)
      .where(eq(visitorChatMessages.sessionId, session.id))
      .orderBy(visitorChatMessages.createdAt);

    res.json({ session, messages });
  } catch (error) {
    console.error('Error fetching visitor chat session:', error);
    res.status(500).json({ error: 'Failed to fetch chat session' });
  }
});

// Send a message in a visitor chat
router.post('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, senderType, senderName, senderId } = req.body;

    if (!message || !senderType) {
      return res.status(400).json({ error: 'Message and senderType are required' });
    }

    // Get the session
    const [session] = await db
      .select()
      .from(visitorChatSessions)
      .where(eq(visitorChatSessions.sessionId, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Insert the message
    const [newMessage] = await db
      .insert(visitorChatMessages)
      .values({
        sessionId: session.id,
        senderType,
        senderName: senderName || (senderType === 'visitor' ? 'Visitor' : 'Support'),
        senderId: senderId || null,
        message,
        messageType: 'text',
        isRead: false
      })
      .returning();

    // Update session last message timestamp
    await db
      .update(visitorChatSessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(visitorChatSessions.id, session.id));

    res.json(newMessage);
  } catch (error) {
    console.error('Error sending visitor chat message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update visitor contact information
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

    const [updatedSession] = await db
      .update(visitorChatSessions)
      .set(updates)
      .where(eq(visitorChatSessions.sessionId, sessionId))
      .returning();

    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Create a system message indicating contact info was captured
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
      });

    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating visitor contact info:', error);
    res.status(500).json({ error: 'Failed to update contact information' });
  }
});

// Admin: Get all active chat sessions
router.get('/sessions/all', async (req, res) => {
  try {
    const status = (req.query.status as string) || 'active';
    
    const sessions = await db
      .select()
      .from(visitorChatSessions)
      .where(eq(visitorChatSessions.status, status))
      .orderBy(desc(visitorChatSessions.lastMessageAt));

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching admin chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Admin: Assign a chat session to a staff member
router.patch('/admin/sessions/:sessionId/assign', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ error: 'assignedTo (user ID) is required' });
    }

    const [updatedSession] = await db
      .update(visitorChatSessions)
      .set({ assignedTo })
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

// Admin: Close a chat session
router.patch('/admin/sessions/:sessionId/close', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [updatedSession] = await db
      .update(visitorChatSessions)
      .set({ status: 'closed', closedAt: new Date() })
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

// Mark messages as read
router.patch('/sessions/:sessionId/messages/read', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get the session
    const [session] = await db
      .select()
      .from(visitorChatSessions)
      .where(eq(visitorChatSessions.sessionId, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Mark all messages as read
    await db
      .update(visitorChatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(visitorChatMessages.sessionId, session.id),
          eq(visitorChatMessages.isRead, false)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;
