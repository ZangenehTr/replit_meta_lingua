# Critical Issues Solution Plan
**MetaLingua Production Deployment Strategy**

---

## Overview

This document provides actionable solutions for the 7 most critical production issues identified in the MetaLingua system. Each solution includes root cause analysis, implementation steps, testing strategy, and monitoring requirements.

---

## Issue 1: JWT_SECRET Missing → App Crash on Startup

### 🔴 Severity: CRITICAL (System Crash)

### Current Behavior:
```typescript
// server/index.ts (Line 30-31)
if (!process.env.JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET not found in environment');
  // App continues with fallback, but this is insecure
}

// Line 36-39: Development fallback (INSECURE for production)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev-fallback-secret-key-change-in-production';
  console.log('⚠️  Using development fallback for JWT_SECRET');
}
```

### Root Cause:
- No enforcement of JWT_SECRET in production
- Fallback to predictable development secret is a major security vulnerability
- App continues running even without proper JWT_SECRET configuration

### Solution:

#### Step 1: Environment Variable Validation (Startup)
```typescript
// server/config/env-validator.ts (NEW FILE)
import { z } from 'zod';

const envSchema = z.object({
  // Required in all environments
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Required in production
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Optional but recommended
  OLLAMA_HOST: z.string().url().optional(),
  KAVENEGAR_API_KEY: z.string().optional(),
  SHETAB_MERCHANT_ID: z.string().optional(),
  SHETAB_TERMINAL_ID: z.string().optional(),
  SHETAB_SECRET_KEY: z.string().optional(),
});

export function validateEnvironment() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ CRITICAL: Environment validation failed');
    console.error(result.error.format());
    
    // In production, exit immediately
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot start in production without valid environment');
      process.exit(1);
    }
    
    // In development, warn but continue
    console.warn('⚠️  Continuing in development mode with validation errors');
  }
  
  return result;
}
```

#### Step 2: Update server/index.ts
```typescript
// server/index.ts (top of file)
import { validateEnvironment } from './config/env-validator';

// Validate BEFORE any other initialization
const envValidation = validateEnvironment();

// Only continue if valid in production
if (process.env.NODE_ENV === 'production' && !envValidation.success) {
  console.error('❌ Exiting due to environment validation failure');
  process.exit(1);
}

// Remove fallback logic entirely - if JWT_SECRET is missing, fail fast
if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET is required. Set it in your .env file.');
}
```

#### Step 3: Generate Secure JWT_SECRET for Production
```bash
# Generate cryptographically secure secret (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 4: Deployment Checklist
Create `.env.production.template`:
```bash
# REQUIRED - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=

# REQUIRED - PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:port/database

# REQUIRED - Server configuration
NODE_ENV=production
PORT=5000

# AI Services (Optional but recommended)
OLLAMA_HOST=http://45.89.239.250:11434

# Iranian Services (Required for full functionality)
KAVENEGAR_API_KEY=
SHETAB_MERCHANT_ID=
SHETAB_TERMINAL_ID=
SHETAB_SECRET_KEY=
ISABEL_VOIP_API_KEY=
```

### Testing Strategy:
1. **Local Test**: Remove JWT_SECRET from .env, verify app exits immediately
2. **Production Test**: Deploy with invalid JWT_SECRET, verify startup failure
3. **Security Test**: Attempt to forge JWT with known secret, verify rejection

### Monitoring:
- Alert on any "fallback JWT_SECRET" log messages
- Monitor for JWT verification failures (could indicate secret mismatch)

### Rollback Plan:
- Keep previous JWT_SECRET in secure vault
- If secret rotation needed, implement dual-secret verification period

---

## Issue 2: Shetab Payment Callback Issues → Double-Credit

### 🔴 Severity: CRITICAL (Financial Loss)

### Current Behavior:
```typescript
// server/routes.ts - Shetab callback handler
// Problem: No idempotency check, duplicate callbacks can credit wallet twice
app.post('/api/wallet/shetab-callback', async (req, res) => {
  const { paymentId, amount, signature } = req.body;
  
  // Verify signature (good)
  // Credit wallet (NO idempotency check - BAD)
  await db.update(wallets).set({ balance: sql`balance + ${amount}` });
});
```

### Root Cause:
- Shetab gateway may send duplicate callbacks (network retry, gateway bug)
- No idempotency mechanism to prevent duplicate processing
- No transaction ID tracking to detect duplicates

### Solution:

#### Step 1: Create Idempotency Tracking Table
```typescript
// shared/schema.ts
export const paymentIdempotency = pgTable('payment_idempotency', {
  id: serial('id').primaryKey(),
  paymentId: varchar('payment_id', { length: 255 }).notNull().unique(),
  transactionId: varchar('transaction_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'processing', 'completed', 'failed'
  requestHash: varchar('request_hash', { length: 64 }).notNull(), // SHA-256 of request body
  processedAt: timestamp('processed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Unique index to enforce idempotency
// CREATE UNIQUE INDEX idx_payment_idempotency ON payment_idempotency(payment_id, request_hash);
```

#### Step 2: Implement Idempotent Callback Handler
```typescript
// server/routes/payment-routes.ts
import crypto from 'crypto';

app.post('/api/wallet/shetab-callback', async (req, res) => {
  const { paymentId, amount, signature, transactionId } = req.body;
  
  // Step 1: Generate request hash for exact duplicate detection
  const requestHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  try {
    // Step 2: Check idempotency - use database constraint for race condition safety
    const existingRecord = await db
      .select()
      .from(paymentIdempotency)
      .where(eq(paymentIdempotency.paymentId, paymentId))
      .limit(1);
    
    if (existingRecord.length > 0) {
      const existing = existingRecord[0];
      
      // Exact duplicate (same request hash) - safe to return success
      if (existing.requestHash === requestHash && existing.status === 'completed') {
        console.log(`✅ Duplicate callback ignored: ${paymentId}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Payment already processed',
          isDuplicate: true 
        });
      }
      
      // Different request with same paymentId - potential fraud
      if (existing.requestHash !== requestHash) {
        console.error(`🚨 FRAUD ALERT: Different callback for same paymentId: ${paymentId}`);
        return res.status(400).json({ 
          success: false, 
          error: 'Payment ID already used with different data' 
        });
      }
      
      // Still processing - reject to prevent race conditions
      if (existing.status === 'processing') {
        console.warn(`⚠️  Payment still processing: ${paymentId}`);
        return res.status(409).json({ 
          success: false, 
          error: 'Payment processing in progress' 
        });
      }
    }
    
    // Step 3: Verify signature (CRITICAL for security)
    const isValidSignature = verifyShetabSignature(req.body, signature);
    if (!isValidSignature) {
      console.error(`🚨 SECURITY: Invalid signature for payment: ${paymentId}`);
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }
    
    // Step 4: Start database transaction (ACID guarantee)
    await db.transaction(async (tx) => {
      // Insert idempotency record FIRST (will fail if duplicate due to unique constraint)
      await tx.insert(paymentIdempotency).values({
        paymentId,
        transactionId,
        amount: amount.toString(),
        status: 'processing',
        requestHash,
      });
      
      // Fetch wallet
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, req.body.userId))
        .limit(1);
      
      if (!wallet) {
        throw new Error(`Wallet not found for user: ${req.body.userId}`);
      }
      
      // Credit wallet
      await tx
        .update(wallets)
        .set({ 
          balance: sql`balance + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, req.body.userId));
      
      // Insert transaction record
      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        type: 'deposit',
        amount: amount.toString(),
        status: 'completed',
        paymentId,
        transactionId,
        description: `Shetab deposit: ${paymentId}`,
      });
      
      // Update idempotency status to completed
      await tx
        .update(paymentIdempotency)
        .set({ status: 'completed' })
        .where(eq(paymentIdempotency.paymentId, paymentId));
      
      // Check member tier upgrade
      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
      const newTier = calculateMemberTier(newBalance);
      
      if (newTier !== wallet.memberTier) {
        await tx
          .update(wallets)
          .set({ memberTier: newTier })
          .where(eq(wallets.userId, req.body.userId));
      }
    });
    
    // Step 5: Send confirmation SMS (outside transaction - can retry if fails)
    try {
      await kavenegarService.sendSMS({
        phone: req.body.userPhone,
        message: `واریز موفق: ${amount.toLocaleString('fa-IR')} ریال`,
      });
    } catch (smsError) {
      console.error('SMS notification failed (non-fatal):', smsError);
    }
    
    console.log(`✅ Payment processed successfully: ${paymentId}`);
    return res.status(200).json({ success: true, paymentId, transactionId });
    
  } catch (error) {
    console.error('Payment callback error:', error);
    
    // If idempotency insert failed due to unique constraint, it's a duplicate
    if (error.code === '23505') { // PostgreSQL unique violation
      console.log(`✅ Duplicate callback detected via constraint: ${paymentId}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Payment already processed',
        isDuplicate: true 
      });
    }
    
    // Mark as failed in idempotency table
    try {
      await db
        .update(paymentIdempotency)
        .set({ status: 'failed' })
        .where(eq(paymentIdempotency.paymentId, paymentId));
    } catch (updateError) {
      console.error('Failed to update idempotency status:', updateError);
    }
    
    return res.status(500).json({ success: false, error: 'Payment processing failed' });
  }
});

function verifyShetabSignature(data: any, signature: string): boolean {
  const secretKey = process.env.SHETAB_SECRET_KEY;
  if (!secretKey) {
    console.error('SHETAB_SECRET_KEY not configured');
    return false;
  }
  
  // Shetab signature format: HMAC-SHA256 of sorted key-value pairs
  const sortedKeys = Object.keys(data).sort();
  const signatureString = sortedKeys
    .filter(key => key !== 'signature')
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(signatureString)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

#### Step 3: Add Reconciliation Endpoint
```typescript
// server/routes/payment-routes.ts
app.get('/api/admin/payment-reconciliation', requireRole(['Admin', 'Accountant']), async (req, res) => {
  // Daily reconciliation report
  const { date } = req.query; // YYYY-MM-DD
  
  const reconciliation = await db
    .select({
      paymentId: paymentIdempotency.paymentId,
      amount: paymentIdempotency.amount,
      status: paymentIdempotency.status,
      processedAt: paymentIdempotency.processedAt,
      duplicateCount: sql`COUNT(*)`.as('duplicateCount'),
    })
    .from(paymentIdempotency)
    .where(
      sql`DATE(${paymentIdempotency.processedAt}) = ${date}`
    )
    .groupBy(paymentIdempotency.paymentId);
  
  const duplicates = reconciliation.filter(r => r.duplicateCount > 1);
  
  return res.json({
    date,
    totalPayments: reconciliation.length,
    duplicatesDetected: duplicates.length,
    duplicates,
  });
});
```

### Testing Strategy:
1. **Duplicate Callback Test**: Send same callback twice, verify only one credit
2. **Race Condition Test**: Send 10 duplicate callbacks concurrently, verify single credit
3. **Signature Test**: Send callback with invalid signature, verify rejection
4. **Amount Tampering Test**: Send callback with different amount, verify detection

### Monitoring:
- Alert on any duplicate payment detection
- Daily reconciliation report comparing Shetab settlement vs. database
- Monitor for signature verification failures (security incidents)

---

## Issue 3: Wallet Race Conditions → Incorrect Balances

### 🔴 Severity: CRITICAL (Data Integrity)

### Current Behavior:
```typescript
// Multiple concurrent requests can read-then-write, causing lost updates
const wallet = await db.select().from(wallets).where(...); // Read balance: 1000
// Another request reads same balance: 1000
await db.update(wallets).set({ balance: wallet.balance - 500 }); // Write: 500
// Other request writes: 1000 - 300 = 700 (should be 200, but overwrites to 700)
```

### Root Cause:
- Read-modify-write pattern without locking
- No optimistic or pessimistic locking
- SQL `balance = balance - amount` is atomic, but code doesn't always use it

### Solution:

#### Step 1: Use Atomic SQL Updates (Immediate Fix)
```typescript
// WRONG (Race condition vulnerable)
const wallet = await db.select().from(wallets).where(eq(wallets.id, walletId));
await db.update(wallets).set({ balance: wallet.balance - amount });

// CORRECT (Atomic operation)
await db
  .update(wallets)
  .set({ balance: sql`balance - ${amount}` })
  .where(eq(wallets.id, walletId));
```

#### Step 2: Add Balance Check Constraint
```typescript
// shared/schema.ts
export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0'),
  // ... other fields
}, (table) => ({
  // Ensure balance never goes negative
  balanceCheck: check('balance_check', sql`${table.balance} >= 0`),
}));
```

#### Step 3: Implement Database-Level Row Locking
```typescript
// server/services/wallet-service.ts
export class WalletService {
  /**
   * Deduct amount from wallet with pessimistic locking
   * Prevents race conditions on concurrent transactions
   */
  async deductWithLock(walletId: number, amount: number, description: string) {
    return await db.transaction(async (tx) => {
      // SELECT FOR UPDATE - locks the row until transaction commits
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.id, walletId))
        .for('update') // PostgreSQL row-level lock
        .limit(1);
      
      if (!wallet) {
        throw new Error(`Wallet not found: ${walletId}`);
      }
      
      const currentBalance = parseFloat(wallet.balance);
      const deductAmount = parseFloat(amount.toString());
      
      if (currentBalance < deductAmount) {
        throw new Error(`Insufficient balance. Available: ${currentBalance}, Required: ${deductAmount}`);
      }
      
      // Atomic update
      await tx
        .update(wallets)
        .set({ 
          balance: sql`balance - ${deductAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, walletId));
      
      // Insert transaction record
      const [transaction] = await tx
        .insert(walletTransactions)
        .values({
          walletId,
          type: 'deduction',
          amount: (-deductAmount).toString(),
          status: 'completed',
          description,
        })
        .returning();
      
      return {
        success: true,
        transaction,
        newBalance: currentBalance - deductAmount,
      };
    });
  }

  /**
   * Credit amount to wallet (idempotent)
   */
  async creditWithIdempotency(
    walletId: number, 
    amount: number, 
    idempotencyKey: string,
    description: string
  ) {
    return await db.transaction(async (tx) => {
      // Check idempotency
      const existing = await tx
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.idempotencyKey, idempotencyKey))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`Duplicate credit ignored: ${idempotencyKey}`);
        return { success: true, isDuplicate: true, transaction: existing[0] };
      }
      
      // Atomic credit
      await tx
        .update(wallets)
        .set({ 
          balance: sql`balance + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, walletId));
      
      // Insert transaction
      const [transaction] = await tx
        .insert(walletTransactions)
        .values({
          walletId,
          type: 'credit',
          amount: amount.toString(),
          status: 'completed',
          description,
          idempotencyKey,
        })
        .returning();
      
      return { success: true, isDuplicate: false, transaction };
    });
  }
}
```

#### Step 4: Update All Wallet Operations
```typescript
// server/routes.ts - Course enrollment
app.post('/api/enrollments', async (req, res) => {
  const { studentId, courseId } = req.body;
  
  const course = await storage.getCourseById(courseId);
  const wallet = await storage.getWalletByUserId(studentId);
  
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  
  // Use WalletService for atomic deduction
  const walletService = new WalletService();
  
  try {
    const result = await walletService.deductWithLock(
      wallet.id,
      parseFloat(course.price),
      `Course enrollment: ${course.title}`
    );
    
    // Create enrollment after successful payment
    const enrollment = await storage.createEnrollment({
      studentId,
      courseId,
      status: 'active',
    });
    
    return res.json({ success: true, enrollment, newBalance: result.newBalance });
  } catch (error) {
    if (error.message.includes('Insufficient balance')) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    throw error;
  }
});
```

### Testing Strategy:
1. **Concurrent Deduction Test**: 100 concurrent requests to deduct from same wallet
2. **Negative Balance Test**: Attempt to deduct more than balance, verify constraint
3. **Idempotency Test**: Duplicate credit requests with same key
4. **Load Test**: 1000 concurrent wallet operations, verify balance integrity

### Monitoring:
- Track wallet balance mismatches (expected vs actual)
- Alert on negative balance constraint violations
- Monitor transaction rollback rate

---

## Issue 4: CallerN Room Memory Leaks → Server OOM Crash

### 🔴 Severity: CRITICAL (Server Crash)

### Current Behavior:
```typescript
// server/websocket-server.ts
private activeRooms: Map<string, CallRoom> = new Map();

// Rooms added but not always removed on disconnect
socket.on('disconnect', () => {
  // May not clean up room if disconnect happens during call
});
```

### Root Cause:
- Rooms added to `activeRooms` Map but not always cleaned up
- No timeout mechanism to auto-cleanup abandoned rooms
- Timers (`roomTimers`) may not be cleared, causing timer leaks

### Solution:

#### Step 1: Implement Auto-Cleanup with Timeouts
```typescript
// server/websocket-server.ts
export class CallernWebSocketServer {
  private activeRooms: Map<string, CallRoom> = new Map();
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();
  private roomCleanupTimers: Map<string, NodeJS.Timeout> = new Map(); // NEW
  
  private readonly ROOM_CLEANUP_TIMEOUT = 30 * 60 * 1000; // 30 minutes max call duration
  private readonly ABANDONED_ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes no activity
  
  /**
   * Create room with automatic cleanup safeguards
   */
  private createRoom(roomId: string, studentId: number, teacherId: number, packageId: number) {
    const room: CallRoom = {
      roomId,
      studentId,
      teacherId,
      packageId,
      startTime: new Date(),
      participants: new Set<string>(),
      minutesUsed: 0,
    };
    
    this.activeRooms.set(roomId, room);
    
    // Safeguard 1: Max duration timeout (30 minutes)
    const maxDurationTimer = setTimeout(() => {
      console.warn(`⚠️  Room ${roomId} exceeded max duration, forcing cleanup`);
      this.cleanupRoom(roomId, 'max_duration_exceeded');
    }, this.ROOM_CLEANUP_TIMEOUT);
    
    this.roomCleanupTimers.set(roomId, maxDurationTimer);
    
    // Safeguard 2: Activity tracking
    room.lastActivity = new Date();
    
    console.log(`✅ Room created: ${roomId} (Total active rooms: ${this.activeRooms.size})`);
    
    // Monitor room count
    if (this.activeRooms.size > 100) {
      console.error(`🚨 HIGH MEMORY: ${this.activeRooms.size} active rooms`);
    }
  }
  
  /**
   * Update room activity timestamp
   */
  private updateRoomActivity(roomId: string) {
    const room = this.activeRooms.get(roomId);
    if (room) {
      room.lastActivity = new Date();
    }
  }
  
  /**
   * Comprehensive room cleanup (ALWAYS succeeds)
   */
  private cleanupRoom(roomId: string, reason: string) {
    console.log(`🧹 Cleaning up room: ${roomId} (Reason: ${reason})`);
    
    try {
      // Step 1: Clear all timers
      const minuteTimer = this.roomTimers.get(roomId);
      if (minuteTimer) {
        clearInterval(minuteTimer);
        this.roomTimers.delete(roomId);
      }
      
      const cleanupTimer = this.roomCleanupTimers.get(roomId);
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        this.roomCleanupTimers.delete(roomId);
      }
      
      // Step 2: Get room data before deletion
      const room = this.activeRooms.get(roomId);
      
      // Step 3: Remove from active rooms
      this.activeRooms.delete(roomId);
      
      // Step 4: Update database (non-blocking, best effort)
      if (room) {
        this.updateCallHistoryOnEnd(roomId, room).catch(err => {
          console.error(`Failed to update call history for ${roomId}:`, err);
        });
      }
      
      // Step 5: Notify participants
      this.io.to(roomId).emit('call-ended', { reason });
      
      // Step 6: Force disconnect all sockets in room
      const socketsInRoom = this.io.sockets.adapter.rooms.get(roomId);
      if (socketsInRoom) {
        socketsInRoom.forEach(socketId => {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(roomId);
          }
        });
      }
      
      console.log(`✅ Room cleaned: ${roomId} (Active rooms: ${this.activeRooms.size})`);
    } catch (error) {
      console.error(`Error cleaning room ${roomId}:`, error);
      // Force cleanup even if error
      this.activeRooms.delete(roomId);
      this.roomTimers.delete(roomId);
      this.roomCleanupTimers.delete(roomId);
    }
  }
  
  /**
   * Periodic cleanup of abandoned rooms
   */
  private startAbandonedRoomMonitor() {
    setInterval(() => {
      const now = new Date();
      const abandonedRooms: string[] = [];
      
      this.activeRooms.forEach((room, roomId) => {
        const inactiveTime = now.getTime() - (room.lastActivity?.getTime() || room.startTime.getTime());
        
        // If no activity for 5 minutes, mark as abandoned
        if (inactiveTime > this.ABANDONED_ROOM_TIMEOUT) {
          abandonedRooms.push(roomId);
        }
      });
      
      if (abandonedRooms.length > 0) {
        console.warn(`⚠️  Cleaning ${abandonedRooms.length} abandoned rooms`);
        abandonedRooms.forEach(roomId => {
          this.cleanupRoom(roomId, 'abandoned_inactive');
        });
      }
      
      // Log stats
      console.log(`📊 Room stats: ${this.activeRooms.size} active, ${this.roomTimers.size} timers`);
    }, 60 * 1000); // Check every minute
  }
  
  constructor(httpServer: Server) {
    // ... existing code ...
    
    // Start abandoned room monitor
    this.startAbandonedRoomMonitor();
  }
  
  /**
   * Enhanced disconnect handler
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // ... existing code ...
      
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        // Find and cleanup any rooms this socket was in
        this.activeRooms.forEach((room, roomId) => {
          if (room.participants.has(socket.id)) {
            room.participants.delete(socket.id);
            
            // If room is now empty, cleanup
            if (room.participants.size === 0) {
              this.cleanupRoom(roomId, 'all_participants_disconnected');
            }
          }
        });
        
        // Clean up teacher/student sockets
        this.cleanupUserSocket(socket.id);
      });
      
      // Update activity on any room event
      socket.on('webrtc-offer', (data) => {
        this.updateRoomActivity(data.roomId);
        // ... existing code ...
      });
      
      socket.on('webrtc-answer', (data) => {
        this.updateRoomActivity(data.roomId);
        // ... existing code ...
      });
      
      socket.on('audio-chunk', (data) => {
        this.updateRoomActivity(data.roomId);
        // ... existing code ...
      });
    });
  }
}
```

#### Step 2: Add Memory Monitoring
```typescript
// server/monitoring/memory-monitor.ts
export class MemoryMonitor {
  private readonly MEMORY_WARNING_THRESHOLD = 0.8; // 80% of heap
  private readonly MEMORY_CRITICAL_THRESHOLD = 0.9; // 90% of heap
  
  startMonitoring() {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedPercent = usage.heapUsed / usage.heapTotal;
      
      if (heapUsedPercent > this.MEMORY_CRITICAL_THRESHOLD) {
        console.error(`🚨 CRITICAL MEMORY: ${(heapUsedPercent * 100).toFixed(1)}% heap used`);
        console.error(`   Heap: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        
        // Emergency: Force garbage collection if available
        if (global.gc) {
          console.log('🗑️  Forcing garbage collection');
          global.gc();
        }
      } else if (heapUsedPercent > this.MEMORY_WARNING_THRESHOLD) {
        console.warn(`⚠️  HIGH MEMORY: ${(heapUsedPercent * 100).toFixed(1)}% heap used`);
      }
      
      // Log memory stats
      console.log(`💾 Memory: Heap ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB, RSS ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
    }, 60 * 1000); // Check every minute
  }
}

// server/index.ts
const memoryMonitor = new MemoryMonitor();
memoryMonitor.startMonitoring();
```

#### Step 3: Add Health Check Endpoint
```typescript
// server/routes/health-routes.ts
app.get('/api/health/memory', requireRole(['Admin']), (req, res) => {
  const usage = process.memoryUsage();
  const activeRooms = callernWebSocketServer.activeRooms.size;
  const connectedTeachers = callernWebSocketServer.getConnectedTeachers().length;
  
  return res.json({
    memory: {
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapPercent: `${((usage.heapUsed / usage.heapTotal) * 100).toFixed(1)}%`,
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    },
    callern: {
      activeRooms,
      connectedTeachers,
    },
    uptime: process.uptime(),
  });
});
```

### Testing Strategy:
1. **Memory Leak Test**: Create 100 rooms, disconnect all, verify cleanup
2. **Abandoned Room Test**: Create room, simulate network drop, verify auto-cleanup after 5 min
3. **Max Duration Test**: Create room, wait 30 min, verify forced cleanup
4. **Load Test**: 1000 concurrent rooms, monitor memory growth

### Monitoring:
- Alert on >100 active rooms
- Alert on memory usage >80%
- Alert on abandoned rooms detected
- Daily cleanup stats report

---

## Issue 5: WebSocket State Desync → Teacher Availability Incorrect

### 🔴 Severity: CRITICAL (Feature Broken)

### Current Behavior:
```typescript
// In-memory state lost on server restart
private teacherSockets: Map<number, TeacherSocket> = new Map();

// No persistence, no state reconciliation
```

### Root Cause:
- Teacher online status stored only in memory (Map)
- Server restart = all teachers appear offline
- No mechanism to restore state after restart
- No heartbeat to detect zombie connections

### Solution:

#### Step 1: Add Database-Backed Teacher Status
```typescript
// shared/schema.ts
export const teacherOnlineStatus = pgTable('teacher_online_status', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  socketId: varchar('socket_id', { length: 255 }).notNull(),
  isAvailable: boolean('is_available').notNull().default(false),
  lastHeartbeat: timestamp('last_heartbeat').defaultNow(),
  connectedAt: timestamp('connected_at').defaultNow(),
  serverInstance: varchar('server_instance', { length: 255 }), // For multi-server setup
});

// Unique constraint: one active connection per teacher
// CREATE UNIQUE INDEX idx_teacher_online_unique ON teacher_online_status(teacher_id) WHERE is_available = true;
```

#### Step 2: Implement Hybrid Memory + Database State
```typescript
// server/websocket-server.ts
export class CallernWebSocketServer {
  private teacherSockets: Map<number, TeacherSocket> = new Map(); // Memory cache
  private readonly HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT = 60 * 1000; // 60 seconds (2x interval)
  
  /**
   * Register teacher with database persistence
   */
  private async registerTeacher(socket: Socket, userId: number, enableCallern: boolean) {
    try {
      // Update memory cache
      this.teacherSockets.set(userId, {
        socketId: socket.id,
        teacherId: userId,
        isAvailable: enableCallern,
      });
      
      // Persist to database
      await db.transaction(async (tx) => {
        // Remove any existing entries for this teacher
        await tx
          .delete(teacherOnlineStatus)
          .where(eq(teacherOnlineStatus.teacherId, userId));
        
        // Insert new status
        await tx.insert(teacherOnlineStatus).values({
          teacherId: userId,
          socketId: socket.id,
          isAvailable: enableCallern,
          lastHeartbeat: new Date(),
          serverInstance: process.env.SERVER_INSTANCE_ID || 'default',
        });
      });
      
      console.log(`✅ Teacher registered: ${userId} (Available: ${enableCallern})`);
      
      // Broadcast updated teacher list
      await this.broadcastOnlineTeachers();
      
    } catch (error) {
      console.error('Error registering teacher:', error);
    }
  }
  
  /**
   * Unregister teacher and cleanup
   */
  private async unregisterTeacher(teacherId: number) {
    try {
      // Remove from memory
      this.teacherSockets.delete(teacherId);
      
      // Remove from database
      await db
        .delete(teacherOnlineStatus)
        .where(eq(teacherOnlineStatus.teacherId, teacherId));
      
      console.log(`✅ Teacher unregistered: ${teacherId}`);
      
      // Broadcast updated teacher list
      await this.broadcastOnlineTeachers();
      
    } catch (error) {
      console.error('Error unregistering teacher:', error);
    }
  }
  
  /**
   * Get online teachers (hybrid memory + database)
   */
  async getOnlineTeachers(): Promise<number[]> {
    try {
      // Primary: Use memory cache for speed
      const memoryTeachers = Array.from(this.teacherSockets.keys()).filter(teacherId => {
        const teacher = this.teacherSockets.get(teacherId);
        return teacher?.isAvailable;
      });
      
      // Secondary: Verify with database and cleanup stale entries
      const dbTeachers = await db
        .select()
        .from(teacherOnlineStatus)
        .where(eq(teacherOnlineStatus.isAvailable, true));
      
      const now = new Date();
      const staleTeachers: number[] = [];
      
      dbTeachers.forEach(teacher => {
        const lastHeartbeat = new Date(teacher.lastHeartbeat);
        const timeSinceHeartbeat = now.getTime() - lastHeartbeat.getTime();
        
        // If no heartbeat for 60 seconds, mark as stale
        if (timeSinceHeartbeat > this.HEARTBEAT_TIMEOUT) {
          staleTeachers.push(teacher.teacherId);
        }
      });
      
      // Cleanup stale entries
      if (staleTeachers.length > 0) {
        console.warn(`⚠️  Cleaning ${staleTeachers.length} stale teacher connections`);
        await db
          .delete(teacherOnlineStatus)
          .where(
            sql`${teacherOnlineStatus.teacherId} IN (${staleTeachers.join(',')})`
          );
      }
      
      // Return union of memory and fresh database entries
      const dbFreshTeachers = dbTeachers
        .filter(t => !staleTeachers.includes(t.teacherId))
        .map(t => t.teacherId);
      
      const allTeachers = Array.from(new Set([...memoryTeachers, ...dbFreshTeachers]));
      
      return allTeachers;
      
    } catch (error) {
      console.error('Error getting online teachers:', error);
      // Fallback to memory only
      return Array.from(this.teacherSockets.keys());
    }
  }
  
  /**
   * Heartbeat mechanism to detect disconnects
   */
  private startHeartbeatMonitor() {
    setInterval(async () => {
      // Send heartbeat request to all connected teachers
      this.teacherSockets.forEach((teacher, teacherId) => {
        const socket = this.io.sockets.sockets.get(teacher.socketId);
        
        if (socket) {
          socket.emit('heartbeat-request');
          
          // Set timeout to mark as offline if no response
          setTimeout(async () => {
            const stillConnected = this.io.sockets.sockets.has(teacher.socketId);
            if (!stillConnected) {
              console.warn(`⚠️  Teacher ${teacherId} failed heartbeat, removing`);
              await this.unregisterTeacher(teacherId);
            }
          }, 5000); // 5 second timeout for heartbeat response
        } else {
          // Socket not found, cleanup
          console.warn(`⚠️  Teacher ${teacherId} socket not found, cleaning up`);
          this.unregisterTeacher(teacherId);
        }
      });
      
      // Update database heartbeats
      const teacherIds = Array.from(this.teacherSockets.keys());
      if (teacherIds.length > 0) {
        await db
          .update(teacherOnlineStatus)
          .set({ lastHeartbeat: new Date() })
          .where(
            sql`${teacherOnlineStatus.teacherId} IN (${teacherIds.join(',')})`
          );
      }
    }, this.HEARTBEAT_INTERVAL);
  }
  
  /**
   * Broadcast online teachers to all clients
   */
  private async broadcastOnlineTeachers() {
    const onlineTeachers = await this.getOnlineTeachers();
    this.io.emit('online-teachers-updated', { teacherIds: onlineTeachers });
  }
  
  /**
   * Setup heartbeat response handler
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // ... existing code ...
      
      // Heartbeat response
      socket.on('heartbeat-response', async () => {
        // Teacher responded, update heartbeat
        const teacher = Array.from(this.teacherSockets.entries()).find(
          ([_, t]) => t.socketId === socket.id
        );
        
        if (teacher) {
          const [teacherId] = teacher;
          await db
            .update(teacherOnlineStatus)
            .set({ lastHeartbeat: new Date() })
            .where(eq(teacherOnlineStatus.teacherId, teacherId));
        }
      });
      
      socket.on('disconnect', async () => {
        // Find teacher by socket ID
        const teacher = Array.from(this.teacherSockets.entries()).find(
          ([_, t]) => t.socketId === socket.id
        );
        
        if (teacher) {
          const [teacherId] = teacher;
          await this.unregisterTeacher(teacherId);
        }
      });
    });
  }
  
  constructor(httpServer: Server) {
    // ... existing code ...
    
    // Start heartbeat monitor
    this.startHeartbeatMonitor();
    
    // On server start, cleanup stale entries from previous instance
    this.cleanupStaleTeachers();
  }
  
  /**
   * Cleanup stale entries on server restart
   */
  private async cleanupStaleTeachers() {
    try {
      const deleted = await db
        .delete(teacherOnlineStatus)
        .where(
          sql`${teacherOnlineStatus.lastHeartbeat} < NOW() - INTERVAL '60 seconds'`
        );
      
      console.log(`🧹 Cleaned ${deleted.rowCount} stale teacher entries on startup`);
    } catch (error) {
      console.error('Error cleaning stale teachers:', error);
    }
  }
}
```

#### Step 3: Client-Side Heartbeat
```typescript
// client/src/hooks/useCallernConnection.ts
export function useCallernConnection() {
  const socket = useRef<Socket>();
  
  useEffect(() => {
    socket.current = io();
    
    // Respond to heartbeat requests
    socket.current.on('heartbeat-request', () => {
      socket.current?.emit('heartbeat-response');
    });
    
    return () => {
      socket.current?.disconnect();
    };
  }, []);
}
```

### Testing Strategy:
1. **Restart Test**: Register 10 teachers, restart server, verify cleanup
2. **Network Drop Test**: Disconnect teacher without disconnect event, verify heartbeat timeout
3. **Concurrent Registration Test**: Same teacher connects from 2 devices, verify single entry
4. **Database Sync Test**: Compare memory state vs database state

### Monitoring:
- Alert on teacher state desync (memory vs database)
- Alert on failed heartbeats
- Monitor stale teacher cleanup count

---

## Issue 6: Missing Comprehensive Telemetry

### ⚠️ Severity: HIGH (Blind Spots)

### Current State:
- No centralized logging
- No error tracking
- No performance metrics
- No analytics on system health

### Solution:

#### Step 1: Implement Structured Logging
```typescript
// server/monitoring/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'metalingua',
    instance: process.env.SERVER_INSTANCE_ID || 'default',
  },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 5,
    }),
    
    // Console for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Log categories
export const logEvent = {
  auth: (event: string, userId: number, metadata: any) => {
    logger.info('AUTH_EVENT', { event, userId, metadata });
  },
  
  payment: (event: string, amount: number, metadata: any) => {
    logger.info('PAYMENT_EVENT', { event, amount, metadata });
  },
  
  callern: (event: string, roomId: string, metadata: any) => {
    logger.info('CALLERN_EVENT', { event, roomId, metadata });
  },
  
  ai: (event: string, service: string, latency: number, metadata: any) => {
    logger.info('AI_EVENT', { event, service, latency, metadata });
  },
  
  error: (error: Error, context: any) => {
    logger.error('APPLICATION_ERROR', { 
      message: error.message,
      stack: error.stack,
      context,
    });
  },
};
```

#### Step 2: Add Performance Metrics
```typescript
// server/monitoring/metrics.ts
export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  
  recordLatency(operation: string, latency: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const values = this.metrics.get(operation)!;
    values.push(latency);
    
    // Keep last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  getStats(operation: string) {
    const values = this.metrics.get(operation) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
  
  getAllStats() {
    const allStats: any = {};
    this.metrics.forEach((_, operation) => {
      allStats[operation] = this.getStats(operation);
    });
    return allStats;
  }
}

export const metrics = new MetricsCollector();

// Middleware to track request latency
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const latency = Date.now() - start;
    const route = `${req.method} ${req.path}`;
    metrics.recordLatency(route, latency);
    
    if (latency > 1000) {
      logger.warn('SLOW_REQUEST', { route, latency, statusCode: res.statusCode });
    }
  });
  
  next();
}
```

#### Step 3: Add Health Dashboard
```typescript
// server/routes/telemetry-routes.ts
app.get('/api/admin/telemetry/metrics', requireRole(['Admin']), (req, res) => {
  const allStats = metrics.getAllStats();
  
  return res.json({
    timestamp: new Date().toISOString(),
    metrics: allStats,
    topSlowestRoutes: Object.entries(allStats)
      .sort(([, a]: any, [, b]: any) => b.p95 - a.p95)
      .slice(0, 10),
  });
});

app.get('/api/admin/telemetry/errors', requireRole(['Admin']), async (req, res) => {
  // Read error log file
  const fs = require('fs');
  const errorLog = fs.readFileSync('logs/error.log', 'utf-8');
  const errors = errorLog.split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
    .slice(-100); // Last 100 errors
  
  return res.json({
    totalErrors: errors.length,
    recentErrors: errors,
  });
});
```

### Implementation Steps:
1. Install winston: `npm install winston`
2. Create logger.ts and metrics.ts
3. Replace all console.log with logger calls
4. Add metricsMiddleware to Express
5. Create telemetry dashboard in admin panel

---

## Issue 7: Missing Disk Space Monitoring

### ⚠️ Severity: HIGH (Service Failure)

### Current State:
- No monitoring of disk usage
- Audio files accumulate in `/uploads/linguaquest-audio/`
- Video recordings in `/uploads/recordings/`
- No cleanup of orphaned files

### Solution:

#### Step 1: Disk Space Monitor
```typescript
// server/monitoring/disk-monitor.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DiskMonitor {
  private readonly WARNING_THRESHOLD = 0.8; // 80%
  private readonly CRITICAL_THRESHOLD = 0.9; // 90%
  
  async checkDiskSpace(): Promise<DiskSpaceInfo> {
    try {
      const { stdout } = await execAsync('df -h /');
      const lines = stdout.split('\n');
      const data = lines[1].split(/\s+/);
      
      const total = this.parseSize(data[1]);
      const used = this.parseSize(data[2]);
      const available = this.parseSize(data[3]);
      const usedPercent = parseInt(data[4].replace('%', '')) / 100;
      
      return {
        total,
        used,
        available,
        usedPercent,
        status: this.getStatus(usedPercent),
      };
    } catch (error) {
      logger.error('Error checking disk space:', error);
      return {
        total: 0,
        used: 0,
        available: 0,
        usedPercent: 0,
        status: 'unknown',
      };
    }
  }
  
  private parseSize(size: string): number {
    // Parse sizes like "50G", "1.5T"
    const unit = size.slice(-1);
    const value = parseFloat(size.slice(0, -1));
    
    const multipliers: any = {
      K: 1024,
      M: 1024 * 1024,
      G: 1024 * 1024 * 1024,
      T: 1024 * 1024 * 1024 * 1024,
    };
    
    return value * (multipliers[unit] || 1);
  }
  
  private getStatus(usedPercent: number): string {
    if (usedPercent >= this.CRITICAL_THRESHOLD) return 'critical';
    if (usedPercent >= this.WARNING_THRESHOLD) return 'warning';
    return 'ok';
  }
  
  async getDirectorySizes(): Promise<DirectorySize[]> {
    const directories = [
      '/uploads/linguaquest-audio',
      '/uploads/recordings',
      '/uploads/student-photos',
      '/uploads/teacher-photos',
      '/logs',
    ];
    
    const sizes = await Promise.all(
      directories.map(async (dir) => {
        try {
          const { stdout } = await execAsync(`du -sh ${dir}`);
          const size = stdout.split(/\s+/)[0];
          return { directory: dir, size, bytes: this.parseSize(size) };
        } catch {
          return { directory: dir, size: '0K', bytes: 0 };
        }
      })
    );
    
    return sizes.sort((a, b) => b.bytes - a.bytes);
  }
  
  startMonitoring() {
    setInterval(async () => {
      const diskSpace = await this.checkDiskSpace();
      
      if (diskSpace.status === 'critical') {
        logger.error('CRITICAL_DISK_SPACE', {
          usedPercent: (diskSpace.usedPercent * 100).toFixed(1),
          available: this.formatBytes(diskSpace.available),
        });
        
        // Trigger emergency cleanup
        await this.emergencyCleanup();
      } else if (diskSpace.status === 'warning') {
        logger.warn('HIGH_DISK_USAGE', {
          usedPercent: (diskSpace.usedPercent * 100).toFixed(1),
          available: this.formatBytes(diskSpace.available),
        });
      }
      
      logger.info('DISK_SPACE_CHECK', {
        used: this.formatBytes(diskSpace.used),
        available: this.formatBytes(diskSpace.available),
        usedPercent: (diskSpace.usedPercent * 100).toFixed(1) + '%',
      });
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
  
  private async emergencyCleanup() {
    logger.warn('Starting emergency disk cleanup');
    
    // Clean old logs
    await execAsync('find logs -name "*.log" -mtime +7 -delete');
    
    // Clean orphaned audio files (not referenced in database)
    // TODO: Implement orphaned file detection
    
    logger.info('Emergency cleanup completed');
  }
  
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + 'KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + 'GB';
  }
}

// server/index.ts
const diskMonitor = new DiskMonitor();
diskMonitor.startMonitoring();
```

#### Step 2: Orphaned File Cleanup
```typescript
// server/services/file-cleanup-service.ts
export class FileCleanupService {
  async cleanOrphanedAudioFiles() {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Get all audio files
    const audioDir = path.join(process.cwd(), 'uploads/linguaquest-audio');
    const files = await fs.readdir(audioDir);
    
    // Get all audio URLs from database
    const lessons = await db.select().from(linguaquestLessons);
    const referencedFiles = new Set<string>();
    
    lessons.forEach(lesson => {
      const audioUrls = lesson.audioUrls as any;
      if (audioUrls) {
        Object.values(audioUrls).forEach((url: any) => {
          const filename = path.basename(url);
          referencedFiles.add(filename);
        });
      }
    });
    
    // Delete orphaned files
    let deletedCount = 0;
    let freedSpace = 0;
    
    for (const file of files) {
      if (!referencedFiles.has(file)) {
        const filePath = path.join(audioDir, file);
        const stats = await fs.stat(filePath);
        await fs.unlink(filePath);
        deletedCount++;
        freedSpace += stats.size;
      }
    }
    
    logger.info('ORPHANED_FILE_CLEANUP', {
      deletedCount,
      freedSpace: this.formatBytes(freedSpace),
    });
    
    return { deletedCount, freedSpace };
  }
  
  async cleanOldRecordings(daysOld: number = 30) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const recordingsDir = path.join(process.cwd(), 'uploads/recordings');
    const files = await fs.readdir(recordingsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    let freedSpace = 0;
    
    for (const file of files) {
      const filePath = path.join(recordingsDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
        freedSpace += stats.size;
      }
    }
    
    logger.info('OLD_RECORDING_CLEANUP', {
      deletedCount,
      freedSpace: this.formatBytes(freedSpace),
      daysOld,
    });
    
    return { deletedCount, freedSpace };
  }
}
```

#### Step 3: Admin Dashboard
```typescript
// server/routes/disk-routes.ts
app.get('/api/admin/disk-status', requireRole(['Admin']), async (req, res) => {
  const diskMonitor = new DiskMonitor();
  
  const diskSpace = await diskMonitor.checkDiskSpace();
  const directorySizes = await diskMonitor.getDirectorySizes();
  
  return res.json({
    diskSpace,
    directories: directorySizes,
    recommendations: getCleanupRecommendations(diskSpace, directorySizes),
  });
});

app.post('/api/admin/cleanup/orphaned-files', requireRole(['Admin']), async (req, res) => {
  const cleanupService = new FileCleanupService();
  const result = await cleanupService.cleanOrphanedAudioFiles();
  
  return res.json({ success: true, result });
});
```

### Implementation Steps:
1. Create disk-monitor.ts
2. Create file-cleanup-service.ts
3. Add cleanup routes
4. Create admin UI for disk management
5. Schedule daily cleanup job

---

## Summary: Implementation Priority

### Phase 1 (Critical - Week 1):
1. ✅ JWT_SECRET validation (2 hours)
2. ✅ Shetab idempotency (1 day)
3. ✅ Wallet atomic operations (1 day)

### Phase 2 (High - Week 2):
4. ✅ CallerN memory leak fixes (2 days)
5. ✅ WebSocket state persistence (2 days)

### Phase 3 (Medium - Week 3):
6. ✅ Comprehensive telemetry (3 days)
7. ✅ Disk space monitoring (2 days)

### Total Estimated Time: 3 weeks (15 working days)

---

## Testing Checklist

- [ ] JWT_SECRET startup tests
- [ ] Payment duplicate callback tests
- [ ] Wallet race condition tests
- [ ] CallerN memory leak tests
- [ ] WebSocket reconnection tests
- [ ] Telemetry accuracy tests
- [ ] Disk cleanup tests
- [ ] Load tests (1000 concurrent users)
- [ ] Security penetration tests
- [ ] Production deployment dry-run

---

**Document Version:** 1.0  
**Created:** October 17, 2025  
**Last Updated:** October 17, 2025
