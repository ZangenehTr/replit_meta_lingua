import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';
import { WORKFLOW_STATUS, LEAD_STATUS } from '../../shared/schema';

describe('Call Center Workflow Integration', () => {
  let authToken: string;
  let testLeadId: number;

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
    // Cleanup
    if (testLeadId) {
      await request(app)
        .delete(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  describe('Complete Workflow: Lead to Conversion', () => {
    it('should complete entire workflow from contact to conversion', async () => {
      // 1. Contact Desk - Create lead
      const contactResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'امیرحسین',
          lastName: 'کاظمی',
          phoneNumber: '09201234567',
          workflowStatus: WORKFLOW_STATUS.CONTACT_DESK
        });

      expect(contactResponse.status).toBe(201);
      testLeadId = contactResponse.body.id;
      expect(contactResponse.body.workflowStatus).toBe(WORKFLOW_STATUS.CONTACT_DESK);

      // 2. New Intake - Complete intake form
      const intakeResponse = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interestedLanguage: 'English',
          courseTarget: 'IELTS',
          courseModule: 'Speaking',
          budget: 3000000,
          preferredFormat: 'Private',
          source: 'Website',
          workflowStatus: WORKFLOW_STATUS.NEW_INTAKE,
          status: LEAD_STATUS.NEW
        });

      expect(intakeResponse.status).toBe(200);
      expect(intakeResponse.body.workflowStatus).toBe(WORKFLOW_STATUS.NEW_INTAKE);
      expect(intakeResponse.body.interestedLanguage).toBe('English');

      // 3. First Contact Attempt - No Response
      const callAttemptResponse = await request(app)
        .post(`/api/leads/${testLeadId}/call-attempt`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          outcome: 'no_answer',
          notes: 'تماس اول - پاسخ نداد'
        });

      expect(callAttemptResponse.status).toBe(200);
      expect(callAttemptResponse.body.callCount).toBe(1);
      expect(callAttemptResponse.body.workflowStatus).toBe(WORKFLOW_STATUS.NO_RESPONSE);

      // 4. Second Contact Attempt - Success
      const successCallResponse = await request(app)
        .post(`/api/leads/${testLeadId}/call-attempt`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          outcome: 'answered',
          notes: 'تماس موفق - علاقمند به ادامه',
          interested: true
        });

      expect(successCallResponse.status).toBe(200);
      expect(successCallResponse.body.workflowStatus).toBe(WORKFLOW_STATUS.FOLLOW_UP);
      expect(successCallResponse.body.status).toBe(LEAD_STATUS.CONTACTED);

      // 5. Follow-up Scheduling
      const followUpTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const followUpResponse = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          followUpStart: followUpTime.toISOString(),
          followUpEnd: new Date(followUpTime.getTime() + 30 * 60 * 1000).toISOString(),
          smsReminderEnabled: true,
          notes: 'مشاوره تلفنی برای بررسی نیازها'
        });

      expect(followUpResponse.status).toBe(200);
      expect(followUpResponse.body.followUpStart).toBeTruthy();
      expect(followUpResponse.body.smsReminderEnabled).toBe(true);

      // 6. SMS Reminder
      const smsResponse = await request(app)
        .post(`/api/leads/${testLeadId}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'سلام امیرحسین عزیز، جلسه مشاوره شما فردا برنامه‌ریزی شده است.',
          type: 'followup_reminder'
        });

      expect(smsResponse.status).toBe(200);

      // 7. Move to Level Assessment
      const assessmentMoveResponse = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          workflowStatus: WORKFLOW_STATUS.LEVEL_ASSESSMENT,
          status: LEAD_STATUS.QUALIFIED
        });

      expect(assessmentMoveResponse.status).toBe(200);
      expect(assessmentMoveResponse.body.workflowStatus).toBe(WORKFLOW_STATUS.LEVEL_ASSESSMENT);

      // 8. Schedule Level Assessment
      const assessmentDateTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const scheduleAssessmentResponse = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          levelAssessmentStart: assessmentDateTime.toISOString(),
          levelAssessmentEnd: new Date(assessmentDateTime.getTime() + 60 * 60 * 1000).toISOString(),
          status: LEAD_STATUS.ASSESSMENT_SCHEDULED
        });

      expect(scheduleAssessmentResponse.status).toBe(200);
      expect(scheduleAssessmentResponse.body.levelAssessmentStart).toBeTruthy();

      // 9. Complete Assessment and Convert
      const conversionResponse = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          workflowStatus: WORKFLOW_STATUS.LEVEL_ASSESSMENT_COMPLETE,
          status: LEAD_STATUS.CONVERTED,
          interestedLevel: 'intermediate',
          conversionDate: new Date().toISOString()
        });

      expect(conversionResponse.status).toBe(200);
      expect(conversionResponse.body.status).toBe(LEAD_STATUS.CONVERTED);
      expect(conversionResponse.body.interestedLevel).toBe('intermediate');
      expect(conversionResponse.body.conversionDate).toBeTruthy();

      // Verify final state
      const finalStateResponse = await request(app)
        .get(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalStateResponse.status).toBe(200);
      expect(finalStateResponse.body.status).toBe(LEAD_STATUS.CONVERTED);
      expect(finalStateResponse.body.workflowStatus).toBe(WORKFLOW_STATUS.LEVEL_ASSESSMENT_COMPLETE);
    });
  });

  describe('Complete Workflow: Lead to Withdrawal', () => {
    it('should handle withdrawal path with reason tracking', async () => {
      // 1. Create lead
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'سپیده',
          lastName: 'نوری',
          phoneNumber: '09211234567',
          interestedLanguage: 'German',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP
        });

      testLeadId = createResponse.body.id;

      // 2. Multiple call attempts with no interest
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post(`/api/leads/${testLeadId}/call-attempt`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            outcome: 'answered',
            notes: `تماس ${i} - عدم علاقه اعلام شده`,
            interested: false
          });
      }

      // 3. Move to withdrawal
      const withdrawalMoveResponse = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          workflowStatus: WORKFLOW_STATUS.WITHDRAWAL,
          status: LEAD_STATUS.NOT_INTERESTED
        });

      expect(withdrawalMoveResponse.status).toBe(200);

      // 4. Record withdrawal reason
      const withdrawalResponse = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          withdrawalReason: 'عدم علاقه به ادامه',
          notes: 'متقاضی پس از 3 تماس عدم علاقه قطعی اعلام کرد',
          withdrawalDate: new Date().toISOString()
        });

      expect(withdrawalResponse.status).toBe(200);
      expect(withdrawalResponse.body.withdrawalReason).toBe('عدم علاقه به ادامه');

      // Verify final state
      const finalResponse = await request(app)
        .get(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalResponse.body.workflowStatus).toBe(WORKFLOW_STATUS.WITHDRAWAL);
      expect(finalResponse.body.withdrawalReason).toBeTruthy();
      expect(finalResponse.body.callCount).toBe(3);
    });
  });

  describe('Progressive Call Backoff System', () => {
    it('should implement proper call scheduling intervals', async () => {
      // Create lead in no response state
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'رضا',
          lastName: 'صادقی',
          phoneNumber: '09221234567',
          workflowStatus: WORKFLOW_STATUS.NO_RESPONSE
        });

      testLeadId = createResponse.body.id;
      const intervals = [2, 24, 72, 168, 336]; // 2h, 24h, 3d, 7d, 14d in hours

      for (let attempt = 0; attempt < intervals.length; attempt++) {
        const callResponse = await request(app)
          .post(`/api/leads/${testLeadId}/call-attempt`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            outcome: 'no_answer',
            notes: `تلاش ${attempt + 1} - پاسخ نداد`
          });

        expect(callResponse.status).toBe(200);
        expect(callResponse.body.callCount).toBe(attempt + 1);

        if (attempt < intervals.length - 1) {
          const nextCallTime = new Date(callResponse.body.nextCallDate).getTime();
          const expectedTime = Date.now() + (intervals[attempt] * 60 * 60 * 1000);
          const tolerance = 60000; // 1 minute tolerance

          expect(Math.abs(nextCallTime - expectedTime)).toBeLessThan(tolerance);
        }
      }
    });
  });

  describe('SMS Reminder System Integration', () => {
    it('should handle SMS reminders with proper timing', async () => {
      // Create lead with follow-up scheduled
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'لیلا',
          lastName: 'احمدی',
          phoneNumber: '09231234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
          followUpStart: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
          smsReminderEnabled: true
        });

      testLeadId = createResponse.body.id;

      // Test immediate SMS sending
      const smsResponse = await request(app)
        .post(`/api/leads/${testLeadId}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'تست پیامک یادآوری',
          type: 'followup_reminder'
        });

      expect(smsResponse.status).toBe(200);

      // Verify cooldown period
      const cooldownResponse = await request(app)
        .post(`/api/leads/${testLeadId}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'پیامک دوم',
          type: 'reminder'
        });

      expect(cooldownResponse.status).toBe(429); // Rate limited
    });
  });

  describe('Workflow Statistics and Analytics', () => {
    it('should provide accurate workflow metrics', async () => {
      // Create leads in different stages
      const leadData = [
        { firstName: 'احمد', workflowStatus: WORKFLOW_STATUS.CONTACT_DESK },
        { firstName: 'فاطمه', workflowStatus: WORKFLOW_STATUS.NEW_INTAKE },
        { firstName: 'علی', workflowStatus: WORKFLOW_STATUS.NO_RESPONSE },
        { firstName: 'مریم', workflowStatus: WORKFLOW_STATUS.FOLLOW_UP },
        { firstName: 'حسن', workflowStatus: WORKFLOW_STATUS.LEVEL_ASSESSMENT },
        { firstName: 'زهرا', workflowStatus: WORKFLOW_STATUS.WITHDRAWAL }
      ];

      const leadIds: number[] = [];

      for (const lead of leadData) {
        const response = await request(app)
          .post('/api/leads')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...lead,
            lastName: 'تست',
            phoneNumber: `0912345${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
          });

        leadIds.push(response.body.id);
      }

      // Get workflow statistics
      const statsResponse = await request(app)
        .get('/api/leads/workflow-stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.contactDesk).toBeGreaterThanOrEqual(1);
      expect(statsResponse.body.newIntake).toBeGreaterThanOrEqual(1);
      expect(statsResponse.body.noResponse).toBeGreaterThanOrEqual(1);
      expect(statsResponse.body.followUp).toBeGreaterThanOrEqual(1);
      expect(statsResponse.body.levelAssessment).toBeGreaterThanOrEqual(1);
      expect(statsResponse.body.withdrawal).toBeGreaterThanOrEqual(1);

      // Cleanup
      for (const id of leadIds) {
        await request(app)
          .delete(`/api/leads/${id}`)
          .set('Authorization', `Bearer ${authToken}`);
      }
    });
  });
});