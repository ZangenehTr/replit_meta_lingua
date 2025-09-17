import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { WORKFLOW_STATUS } from '@shared/schema';

// Mock app for testing
const app = express();

// Mock Kavenegar service
vi.mock('@server/services/kavenegar.service', () => ({
  KavenegarService: {
    sendSMS: vi.fn().mockResolvedValue({
      success: true,
      messageId: 'test_message_id_123'
    })
  }
}));

describe('SMS Reminder Worker System', () => {
  let authToken: string;
  let testLeadIds: number[] = [];

  beforeEach(async () => {
    // Login as admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });
    
    authToken = loginResponse.body.accessToken || loginResponse.body.auth_token;
  });

  afterEach(async () => {
    // Cleanup all test leads
    for (const id of testLeadIds) {
      await request(app)
        .delete(`/api/leads/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .catch(() => {}); // Ignore cleanup errors
    }
    testLeadIds = [];
  });

  describe('SMS Reminder Scheduling', () => {
    it('should send SMS reminders for scheduled follow-ups', async () => {
      // Create lead with follow-up scheduled for "now" (within reminder window)
      const followUpTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
      
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'علی',
          lastName: 'رضایی',
          phoneNumber: '09301234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
          followUpStart: followUpTime.toISOString(),
          smsReminderEnabled: true
        });

      expect(createResponse.status).toBe(201);
      testLeadIds.push(createResponse.body.id);

      // Get leads that should receive SMS reminders
      const reminderCandidatesResponse = await request(app)
        .get('/api/leads/reminder-candidates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(reminderCandidatesResponse.status).toBe(200);
      
      const candidates = reminderCandidatesResponse.body;
      const ourLead = candidates.find((lead: any) => lead.id === createResponse.body.id);
      
      if (ourLead) {
        expect(ourLead.smsReminderEnabled).toBe(true);
        expect(ourLead.phoneNumber).toBe('09301234567');
      }
    });

    it('should respect SMS cooldown period (24 hours)', async () => {
      // Create lead that recently received SMS
      const recentSmsTime = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'فاطمه',
          lastName: 'محمدی',
          phoneNumber: '09311234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
          followUpStart: new Date().toISOString(),
          smsReminderEnabled: true,
          smsReminderSentAt: recentSmsTime.toISOString()
        });

      testLeadIds.push(createResponse.body.id);

      // Try to send SMS (should be blocked by cooldown)
      const smsResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'تست پیامک در دوره انتظار',
          type: 'reminder'
        });

      expect(smsResponse.status).toBe(429); // Rate limited
      expect(smsResponse.body.error).toContain('cooldown');
    });

    it('should only send reminders within 5-minute window', async () => {
      // Create lead with follow-up scheduled too far in future
      const futureTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'حسن',
          lastName: 'کریمی',
          phoneNumber: '09321234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
          followUpStart: futureTime.toISOString(),
          smsReminderEnabled: true
        });

      testLeadIds.push(createResponse.body.id);

      // Get reminder candidates (should not include future appointments)
      const reminderResponse = await request(app)
        .get('/api/leads/reminder-candidates')
        .set('Authorization', `Bearer ${authToken}`);

      const candidates = reminderResponse.body;
      const futureAppointment = candidates.find((lead: any) => lead.id === createResponse.body.id);
      
      expect(futureAppointment).toBeUndefined(); // Should not be in candidates
    });

    it('should handle level assessment reminders', async () => {
      // Create lead with level assessment scheduled
      const assessmentTime = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now
      
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'مریم',
          lastName: 'نوری',
          phoneNumber: '09331234567',
          workflowStatus: WORKFLOW_STATUS.LEVEL_ASSESSMENT,
          levelAssessmentStart: assessmentTime.toISOString(),
          smsReminderEnabled: true
        });

      testLeadIds.push(createResponse.body.id);

      // Send assessment reminder
      const smsResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'سلام مریم عزیز، جلسه تعیین سطح شما امروز برنامه‌ریزی شده است.',
          type: 'assessment_reminder'
        });

      expect(smsResponse.status).toBe(200);
      expect(smsResponse.body.success).toBe(true);
    });
  });

  describe('SMS Content Personalization', () => {
    it('should personalize SMS messages with lead information', async () => {
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'احمد',
          lastName: 'صادقی',
          phoneNumber: '09341234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
          interestedLanguage: 'English',
          courseTarget: 'IELTS'
        });

      testLeadIds.push(createResponse.body.id);

      // Send personalized SMS
      const smsResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'سلام احمد عزیز، مشاوره IELTS شما فردا ساعت 10 صبح برنامه‌ریزی شده است.',
          type: 'personalized_reminder'
        });

      expect(smsResponse.status).toBe(200);

      // Verify message was logged
      const updatedLead = await request(app)
        .get(`/api/leads/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(updatedLead.body.smsReminderSentAt).toBeTruthy();
    });

    it('should handle Persian/Farsi text correctly', async () => {
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'زینب',
          lastName: 'حسینی',
          phoneNumber: '09351234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP
        });

      testLeadIds.push(createResponse.body.id);

      // Send SMS with Persian text
      const persianMessage = 'سلام زینب عزیز، با تشکر از صبر و شکیبایی شما، جلسه مشاوره رایگان ما فردا ساعت ۱۰ صبح خواهد بود. منتظر حضور گرم شما هستیم. 🌟';
      
      const smsResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: persianMessage,
          type: 'persian_reminder'
        });

      expect(smsResponse.status).toBe(200);
    });
  });

  describe('SMS Worker Database Operations', () => {
    it('should update lastContactDate after SMS sending', async () => {
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'سارا',
          lastName: 'اکبری',
          phoneNumber: '09361234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP
        });

      testLeadIds.push(createResponse.body.id);
      const beforeSms = new Date();

      // Send SMS
      await request(app)
        .post(`/api/leads/${createResponse.body.id}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'تست به‌روزرسانی تاریخ تماس',
          type: 'test'
        });

      // Verify lastContactDate was updated
      const updatedLead = await request(app)
        .get(`/api/leads/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const lastContactDate = new Date(updatedLead.body.lastContactDate);
      expect(lastContactDate.getTime()).toBeGreaterThanOrEqual(beforeSms.getTime());
    });

    it('should log SMS communications', async () => {
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'کیوان',
          lastName: 'نصیری',
          phoneNumber: '09371234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP
        });

      testLeadIds.push(createResponse.body.id);

      // Send SMS
      const smsResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'تست لاگ ارتباطات',
          type: 'communication_log_test'
        });

      expect(smsResponse.status).toBe(200);

      // Check communication log
      const communicationsResponse = await request(app)
        .get(`/api/leads/${createResponse.body.id}/communications`)
        .set('Authorization', `Bearer ${authToken}`);

      if (communicationsResponse.status === 200) {
        const communications = communicationsResponse.body;
        expect(Array.isArray(communications)).toBe(true);
        
        const smsComm = communications.find((c: any) => c.type === 'sms');
        if (smsComm) {
          expect(smsComm.message).toContain('تست لاگ ارتباطات');
        }
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid phone numbers gracefully', async () => {
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'تست',
          lastName: 'شماره نامعتبر',
          phoneNumber: 'invalid_phone',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP
        });

      testLeadIds.push(createResponse.body.id);

      // Try to send SMS to invalid number
      const smsResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'تست شماره نامعتبر',
          type: 'error_test'
        });

      expect(smsResponse.status).toBeOneOf([400, 422, 500]);
    });

    it('should handle empty SMS messages', async () => {
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'تست',
          lastName: 'پیام خالی',
          phoneNumber: '09381234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP
        });

      testLeadIds.push(createResponse.body.id);

      const smsResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: '',
          type: 'empty_message_test'
        });

      expect(smsResponse.status).toBeOneOf([400, 422]);
    });

    it('should handle SMS service failures', async () => {
      // Mock SMS service failure
      const { KavenegarService } = await import('../../server/services/kavenegar.service');
      vi.mocked(KavenegarService.sendSMS).mockRejectedValueOnce(new Error('SMS service unavailable'));

      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'تست',
          lastName: 'خرابی سرویس',
          phoneNumber: '09391234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP
        });

      testLeadIds.push(createResponse.body.id);

      const smsResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'تست خرابی سرویس',
          type: 'service_failure_test'
        });

      expect(smsResponse.status).toBeOneOf([500, 503]);

      // Reset mock for other tests
      vi.mocked(KavenegarService.sendSMS).mockResolvedValue({
        success: true,
        messageId: 'test_message_id_123'
      });
    });
  });

  describe('SMS Worker Performance', () => {
    it('should handle multiple SMS reminders efficiently', async () => {
      const leadPromises = [];
      
      // Create multiple leads
      for (let i = 0; i < 5; i++) {
        const promise = request(app)
          .post('/api/leads')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: `تست${i}`,
            lastName: 'عملکرد',
            phoneNumber: `0934123456${i}`,
            workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
            followUpStart: new Date(Date.now() + 1 * 60 * 1000).toISOString(), // 1 minute from now
            smsReminderEnabled: true
          });
        leadPromises.push(promise);
      }

      const responses = await Promise.all(leadPromises);
      testLeadIds.push(...responses.map(r => r.body.id));

      // Get all reminder candidates
      const startTime = Date.now();
      const reminderResponse = await request(app)
        .get('/api/leads/reminder-candidates')
        .set('Authorization', `Bearer ${authToken}`);
      const endTime = Date.now();

      expect(reminderResponse.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(Array.isArray(reminderResponse.body)).toBe(true);
    });
  });
});

// Custom matcher
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace Vi {
    interface Assertion {
      toBeOneOf(expected: number[]): void;
    }
  }
}