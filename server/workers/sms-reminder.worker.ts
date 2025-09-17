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
      
      // Get leads that need SMS reminders
      const pendingLeads = await this.getPendingSMSReminders(reminderWindowStart, now);
      
      if (pendingLeads.length === 0) {
        return; // No reminders to send
      }

      console.log(`Processing ${pendingLeads.length} SMS reminders...`);

      for (const lead of pendingLeads) {
        try {
          await this.sendFollowUpReminder(lead);
          await this.markReminderSent(lead.id);
        } catch (error) {
          console.error(`Failed to send SMS reminder for lead ${lead.id}:`, error);
          await this.logReminderError(lead.id, error);
        }
      }

      console.log(`Completed processing SMS reminders`);
    } catch (error) {
      console.error('Error processing SMS reminders:', error);
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