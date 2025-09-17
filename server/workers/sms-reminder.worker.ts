import { storage } from '../storage';
import { KavenegarService } from '../kavenegar-service';
import { Lead, WORKFLOW_STATUS } from '@shared/schema';

interface SMSReminderWorkerConfig {
  checkIntervalMs: number; // How often to check for pending reminders
  reminderWindowMs: number; // Time window for sending reminders (e.g., 5 minutes)
}

export class SMSReminderWorker {
  private kavenegarService: KavenegarService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private config: SMSReminderWorkerConfig;

  constructor(config: SMSReminderWorkerConfig = {
    checkIntervalMs: 60 * 1000, // Check every minute
    reminderWindowMs: 5 * 60 * 1000 // 5 minute window for sending
  }) {
    this.kavenegarService = new KavenegarService();
    this.config = config;
  }

  /**
   * Start the SMS reminder worker
   */
  start(): void {
    if (this.isRunning) {
      console.log('SMS Reminder Worker is already running');
      return;
    }

    console.log('Starting SMS Reminder Worker...');
    this.isRunning = true;
    
    // Run immediately, then set interval
    this.processReminders();
    
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, this.config.checkIntervalMs);

    console.log(`SMS Reminder Worker started with ${this.config.checkIntervalMs}ms interval`);
  }

  /**
   * Stop the SMS reminder worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('SMS Reminder Worker is not running');
      return;
    }

    console.log('Stopping SMS Reminder Worker...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('SMS Reminder Worker stopped');
  }

  /**
   * Process pending SMS reminders
   */
  private async processReminders(): Promise<void> {
    try {
      const now = new Date();
      const reminderWindowStart = new Date(now.getTime() - this.config.reminderWindowMs);
      
      // Process lead follow-up reminders
      await this.processLeadReminders(reminderWindowStart, now);
      
      // Process placement test reminders
      await this.processPlacementTestReminders();
      
    } catch (error) {
      console.error('Error processing SMS reminders:', error);
    }
  }

  /**
   * Process lead follow-up reminders (existing functionality)
   */
  private async processLeadReminders(reminderWindowStart: Date, now: Date): Promise<void> {
    try {
      // Get leads that need SMS reminders
      const pendingLeads = await this.getPendingSMSReminders(reminderWindowStart, now);
      
      if (pendingLeads.length === 0) {
        return; // No reminders to send
      }

      console.log(`Processing ${pendingLeads.length} lead SMS reminders...`);

      for (const lead of pendingLeads) {
        try {
          await this.sendFollowUpReminder(lead);
          await this.markReminderSent(lead.id);
        } catch (error) {
          console.error(`Failed to send SMS reminder for lead ${lead.id}:`, error);
          await this.logReminderError(lead.id, error);
        }
      }

      console.log(`Completed processing lead SMS reminders`);
    } catch (error) {
      console.error('Error processing lead reminders:', error);
    }
  }

  /**
   * Process placement test reminders for unpaid students
   */
  private async processPlacementTestReminders(): Promise<void> {
    try {
      // Get students who completed placement test but haven't enrolled (last 7 days)
      const unpaidStudents = await storage.getUnpaidStudentsAfterPlacementTest(7);
      
      if (unpaidStudents.length === 0) {
        return; // No placement test reminders to send
      }

      console.log(`Processing placement test reminders for ${unpaidStudents.length} students...`);

      for (const student of unpaidStudents) {
        try {
          // Check if SMS reminder was already sent
          if (await this.shouldSendPlacementTestReminder(student)) {
            await this.sendPlacementTestReminder(student);
            await this.markPlacementTestReminderSent(student.userId, student.placementSessionId);
          }
        } catch (error) {
          console.error(`Failed to send placement test reminder for student ${student.userId}:`, error);
        }
      }

      console.log(`Completed processing placement test reminders`);
    } catch (error) {
      console.error('Error processing placement test reminders:', error);
    }
  }

  /**
   * Get leads that need SMS reminders sent
   */
  private async getPendingSMSReminders(windowStart: Date, windowEnd: Date): Promise<any[]> {
    try {
      // CRITICAL FIX: Use focused query to avoid missing column errors
      const allLeads = await storage.getFollowUpReminderCandidates(WORKFLOW_STATUS.FOLLOW_UP);
      
      const now = new Date();
      const reminderCooldownMs = 24 * 60 * 60 * 1000; // 24 hours cooldown between reminders
      
      return allLeads.filter(lead => {
        // Must have SMS reminders enabled
        if (!lead.smsReminderEnabled) return false;
        
        // Must have a follow-up date scheduled
        if (!lead.nextFollowUpDate) return false;
        
        // CRITICAL FIX: Idempotency check - skip if reminder was sent recently
        if (lead.smsReminderSentAt) {
          const lastSentTime = new Date(lead.smsReminderSentAt);
          const timeSinceLastSent = now.getTime() - lastSentTime.getTime();
          if (timeSinceLastSent < reminderCooldownMs) {
            console.log(`Skipping lead ${lead.id} - SMS reminder sent ${Math.round(timeSinceLastSent / (60 * 1000))} minutes ago`);
            return false;
          }
        }
        
        const followUpTime = new Date(lead.nextFollowUpDate);
        
        // Must be within the reminder window (e.g., follow-up time is in the next 5 minutes)
        return followUpTime >= windowStart && followUpTime <= windowEnd;
      });
    } catch (error) {
      console.error('Error fetching pending SMS reminders:', error);
      return [];
    }
  }

  /**
   * Send follow-up reminder SMS to a lead
   */
  private async sendFollowUpReminder(lead: any): Promise<void> {
    if (!lead.phoneNumber) {
      throw new Error('Lead has no phone number');
    }

    const message = this.generateReminderMessage(lead);
    
    console.log(`Sending SMS reminder to ${lead.firstName} ${lead.lastName} (${lead.phoneNumber})`);
    
    const result = await this.kavenegarService.sendSimpleSMS(
      lead.phoneNumber,
      message
    );

    if (!result.success) {
      throw new Error(`SMS sending failed: ${result.error}`);
    }

    console.log(`SMS reminder sent successfully to ${lead.phoneNumber} (Message ID: ${result.messageId})`);

    // Log the communication
    await this.logCommunication(lead, message, result);
  }

  /**
   * Generate reminder message text
   */
  private generateReminderMessage(lead: any): string {
    const firstName = lead.firstName || 'عزیز';
    const currentTime = new Date();
    const timeStr = currentTime.toLocaleString('fa-IR');
    
    return `سلام ${firstName} عزیز، 
زمان پیگیری آموزش زبان شما فرا رسیده است. لطفاً با موسسه زبان متالینگوا تماس بگیرید تا روند ثبت‌نام شما ادامه یابد.
🕒 ${timeStr}`;
  }

  /**
   * Mark reminder as sent for a lead
   */
  private async markReminderSent(leadId: number): Promise<void> {
    try {
      // CRITICAL FIX: Set smsReminderSentAt for idempotency protection
      const now = new Date();
      await storage.updateLead(leadId, {
        lastContactDate: now,
        smsReminderSentAt: now, // Prevents duplicate sends
        notes: `SMS reminder sent at ${now.toISOString()}`
      });
    } catch (error) {
      console.error(`Failed to mark reminder as sent for lead ${leadId}:`, error);
    }
  }

  /**
   * Log successful SMS communication
   */
  private async logCommunication(lead: any, message: string, smsResult: any): Promise<void> {
    try {
      await storage.createCommunicationLog({
        fromUserId: 1, // System user
        toUserId: lead.studentId,
        type: 'sms',
        subject: 'Follow-up Reminder',
        content: message,
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          messageId: smsResult.messageId,
          cost: smsResult.cost,
          automated: true,
          leadId: lead.id
        }
      });
    } catch (error) {
      console.error(`Failed to log SMS communication for lead ${lead.id}:`, error);
    }
  }

  /**
   * Log SMS reminder error
   */
  private async logReminderError(leadId: number, error: any): Promise<void> {
    try {
      await storage.createCommunicationLog({
        fromUserId: 1, // System user
        toUserId: null,
        type: 'sms',
        subject: 'Follow-up Reminder Failed',
        content: `Failed to send SMS reminder: ${error.message || error}`,
        status: 'failed',
        metadata: {
          automated: true,
          leadId: leadId,
          error: error.message || String(error)
        }
      });
    } catch (logError) {
      console.error(`Failed to log SMS error for lead ${leadId}:`, logError);
    }
  }

  /**
   * Check if placement test reminder should be sent to student
   */
  private async shouldSendPlacementTestReminder(student: any): Promise<boolean> {
    try {
      // Check if phone number exists
      if (!student.phone || student.phone.length < 10) {
        return false;
      }

      // Check if reminder was already sent (24-hour cooldown)
      const reminderCooldownMs = 24 * 60 * 60 * 1000; // 24 hours
      const lastReminderSent = await this.getLastPlacementTestReminderSent(student.userId, student.placementSessionId);
      
      if (lastReminderSent) {
        const timeSinceLastReminder = new Date().getTime() - new Date(lastReminderSent).getTime();
        if (timeSinceLastReminder < reminderCooldownMs) {
          console.log(`Skipping placement test reminder for user ${student.userId} - sent ${Math.round(timeSinceLastReminder / (60 * 1000))} minutes ago`);
          return false;
        }
      }

      // Check if student hasn't been reminded too many times (max 3 reminders)
      const reminderCount = await this.getPlacementTestReminderCount(student.userId, student.placementSessionId);
      if (reminderCount >= 3) {
        console.log(`Skipping placement test reminder for user ${student.userId} - already sent ${reminderCount} reminders`);
        return false;
      }

      // Only send reminders for students who completed test 1+ days ago (avoid immediate spam)
      const daysSinceTest = student.daysSinceTest || 0;
      if (daysSinceTest < 1) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking if placement test reminder should be sent:', error);
      return false;
    }
  }

  /**
   * Send placement test enrollment reminder SMS
   */
  private async sendPlacementTestReminder(student: any): Promise<void> {
    try {
      const studentName = student.firstName || 'دانش‌آموز';
      const level = student.placementLevel || 'B1';
      const daysAgo = student.daysSinceTest || 1;
      
      // Create Persian SMS message
      const message = `سلام ${studentName} عزیز! 
${daysAgo} روز پیش تست تعیین سطح خود را در سطح ${level} تکمیل کردید. 
برای شروع دوره‌های آموزشی و استفاده از امکانات ویژه، در دوره‌ها ثبت‌نام کنید.
🎯 Meta Lingua - مسیر موفقیت شما`;

      const result = await this.kavenegarService.sendSimpleSMS(
        student.phone,
        message,
        '10008663' // Default Kavenegar sender number
      );

      if (result.success) {
        console.log(`✅ Placement test reminder sent to ${student.phone} (User: ${student.userId})`);
      } else {
        console.error(`❌ Failed to send placement test reminder to ${student.phone}:`, result.error);
        throw new Error(result.error || 'SMS sending failed');
      }
    } catch (error) {
      console.error('Error sending placement test reminder:', error);
      throw error;
    }
  }

  /**
   * Mark placement test reminder as sent
   */
  private async markPlacementTestReminderSent(userId: number, placementSessionId: number): Promise<void> {
    try {
      // Log the reminder in communication logs for tracking
      await storage.createCommunicationLog({
        userId,
        type: 'sms_placement_reminder',
        content: 'Placement test enrollment reminder SMS sent',
        metadata: {
          placementSessionId,
          sentAt: new Date().toISOString(),
          reminderType: 'placement_test_enrollment'
        },
        sentAt: new Date()
      });
      
      console.log(`📝 Marked placement test reminder as sent for user ${userId}, session ${placementSessionId}`);
    } catch (error) {
      console.error('Error marking placement test reminder as sent:', error);
    }
  }

  /**
   * Get last placement test reminder sent time
   */
  private async getLastPlacementTestReminderSent(userId: number, placementSessionId: number): Promise<Date | null> {
    try {
      // Query communication logs for the most recent placement test reminder
      const logs = await storage.getCommunicationLogs(userId, 'sms_placement_reminder');
      const placementReminders = logs.filter(log => 
        log.metadata?.placementSessionId === placementSessionId
      );
      
      if (placementReminders.length === 0) {
        return null;
      }
      
      // Return the most recent reminder time
      const mostRecent = placementReminders.sort((a, b) => 
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      )[0];
      
      return new Date(mostRecent.sentAt);
    } catch (error) {
      console.error('Error getting last placement test reminder sent time:', error);
      return null;
    }
  }

  /**
   * Get count of placement test reminders sent
   */
  private async getPlacementTestReminderCount(userId: number, placementSessionId: number): Promise<number> {
    try {
      const logs = await storage.getCommunicationLogs(userId, 'sms_placement_reminder');
      return logs.filter(log => 
        log.metadata?.placementSessionId === placementSessionId
      ).length;
    } catch (error) {
      console.error('Error getting placement test reminder count:', error);
      return 0;
    }
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; checkIntervalMs: number; reminderWindowMs: number } {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.config.checkIntervalMs,
      reminderWindowMs: this.config.reminderWindowMs
    };
  }
}

// Export singleton instance
export const smsReminderWorker = new SMSReminderWorker();