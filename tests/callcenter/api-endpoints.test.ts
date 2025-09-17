import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';
import { WORKFLOW_STATUS, LEAD_STATUS } from '../../shared/schema';

describe('Call Center API Endpoints', () => {
  let authToken: string;
  let testLeadId: number;

  beforeEach(async () => {
    // Login as admin to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });
    
    authToken = loginResponse.body.accessToken || loginResponse.body.auth_token;
  });

  afterEach(async () => {
    // Cleanup test data
    if (testLeadId) {
      await request(app)
        .delete(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  describe('Lead Management', () => {
    it('should create a new lead through new intake', async () => {
      const newLead = {
        firstName: 'احمد',
        lastName: 'محمدی',
        phoneNumber: '09123456789',
        interestedLanguage: 'English',
        courseTarget: 'IELTS',
        courseModule: 'Speaking',
        budget: 2000000,
        preferredFormat: 'Private',
        source: 'Website'
      };

      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newLead);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe(newLead.firstName);
      expect(response.body.workflowStatus).toBe(WORKFLOW_STATUS.NEW_INTAKE);
      
      testLeadId = response.body.id;
    });

    it('should search leads by phone number', async () => {
      // First create a lead
      const newLead = {
        firstName: 'فاطمه',
        lastName: 'احمدی',
        phoneNumber: '09187654321',
        interestedLanguage: 'German',
        workflowStatus: WORKFLOW_STATUS.CONTACT_DESK
      };

      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newLead);

      testLeadId = createResponse.body.id;

      // Search by phone number
      const searchResponse = await request(app)
        .get(`/api/leads/search-by-phone?phoneNumber=09187654321`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body).toHaveProperty('id');
      expect(searchResponse.body.phoneNumber).toBe('09187654321');
    });

    it('should update lead workflow status', async () => {
      // Create a lead first
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'علی',
          lastName: 'رضایی',
          phoneNumber: '09199876543',
          workflowStatus: WORKFLOW_STATUS.NEW_INTAKE
        });

      testLeadId = createResponse.body.id;

      // Update to follow-up status
      const updateResponse = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
          status: LEAD_STATUS.CONTACTED,
          followUpStart: new Date().toISOString(),
          followUpEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.workflowStatus).toBe(WORKFLOW_STATUS.FOLLOW_UP);
    });

    it('should get leads by workflow status', async () => {
      const response = await request(app)
        .get(`/api/leads?workflowStatus=${WORKFLOW_STATUS.FOLLOW_UP}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Call Attempts', () => {
    it('should record call attempt', async () => {
      // Create a lead first
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'مریم',
          lastName: 'کریمی',
          phoneNumber: '09121234567',
          workflowStatus: WORKFLOW_STATUS.NO_RESPONSE
        });

      testLeadId = createResponse.body.id;

      const callAttempt = {
        outcome: 'no_answer',
        notes: 'تماس بی‌پاسخ - تلاش مجدد فردا',
        duration: 30
      };

      const response = await request(app)
        .post(`/api/leads/${testLeadId}/call-attempt`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(callAttempt);

      expect(response.status).toBe(200);
      expect(response.body.callCount).toBeGreaterThan(0);
      expect(response.body.lastContactDate).toBeTruthy();
    });

    it('should implement progressive backoff for call attempts', async () => {
      // Create a lead with existing call attempts
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'حسن',
          lastName: 'موسوی',
          phoneNumber: '09131234567',
          workflowStatus: WORKFLOW_STATUS.NO_RESPONSE,
          callCount: 2
        });

      testLeadId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/leads/${testLeadId}/call-attempt`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          outcome: 'no_answer',
          notes: 'همچنان پاسخ نمی‌دهد'
        });

      expect(response.status).toBe(200);
      expect(response.body.callCount).toBe(3);
      expect(response.body.nextCallDate).toBeTruthy();
      
      // Verify next call date is scheduled with proper backoff (24 hours for 3rd attempt)
      const nextCallTime = new Date(response.body.nextCallDate).getTime();
      const expectedTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      expect(Math.abs(nextCallTime - expectedTime)).toBeLessThan(60000); // Within 1 minute
    });
  });

  describe('SMS Communication', () => {
    it('should send SMS to lead', async () => {
      // Create a lead first
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'زهرا',
          lastName: 'نوری',
          phoneNumber: '09141234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP
        });

      testLeadId = createResponse.body.id;

      const smsData = {
        message: 'سلام زهرا عزیز، زمان جلسه مشاوره شما فردا ساعت 10 صبح است.',
        type: 'reminder'
      };

      const response = await request(app)
        .post(`/api/leads/${testLeadId}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(smsData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.messageId).toBeTruthy();
    });

    it('should enforce SMS idempotency (24-hour cooldown)', async () => {
      // Create a lead and send first SMS
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'کیوان',
          lastName: 'صادقی',
          phoneNumber: '09151234567',
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
          smsReminderSentAt: new Date().toISOString() // Recently sent
        });

      testLeadId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/leads/${testLeadId}/sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'پیام تست',
          type: 'reminder'
        });

      expect(response.status).toBe(429); // Too Many Requests
      expect(response.body.error).toContain('cooldown');
    });
  });

  describe('Level Assessment', () => {
    it('should schedule level assessment', async () => {
      // Create a lead first
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'امیر',
          lastName: 'حسینی',
          phoneNumber: '09161234567',
          workflowStatus: WORKFLOW_STATUS.LEVEL_ASSESSMENT
        });

      testLeadId = createResponse.body.id;

      const assessmentDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const updateData = {
        levelAssessmentStart: assessmentDateTime.toISOString(),
        levelAssessmentEnd: new Date(assessmentDateTime.getTime() + 60 * 60 * 1000).toISOString(),
        status: LEAD_STATUS.ASSESSMENT_SCHEDULED
      };

      const response = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.levelAssessmentStart).toBeTruthy();
      expect(response.body.status).toBe(LEAD_STATUS.ASSESSMENT_SCHEDULED);
    });

    it('should complete assessment and convert lead', async () => {
      // Create a lead with scheduled assessment
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'نگار',
          lastName: 'کاظمی',
          phoneNumber: '09171234567',
          workflowStatus: WORKFLOW_STATUS.LEVEL_ASSESSMENT,
          status: LEAD_STATUS.ASSESSMENT_SCHEDULED
        });

      testLeadId = createResponse.body.id;

      const completionData = {
        workflowStatus: WORKFLOW_STATUS.LEVEL_ASSESSMENT_COMPLETE,
        status: LEAD_STATUS.CONVERTED,
        interestedLevel: 'intermediate',
        conversionDate: new Date().toISOString()
      };

      const response = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(completionData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(LEAD_STATUS.CONVERTED);
      expect(response.body.interestedLevel).toBe('intermediate');
    });
  });

  describe('Withdrawal Tracking', () => {
    it('should record withdrawal with reason', async () => {
      // Create a lead first
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'پوریا',
          lastName: 'رحمانی',
          phoneNumber: '09181234567',
          workflowStatus: WORKFLOW_STATUS.WITHDRAWAL
        });

      testLeadId = createResponse.body.id;

      const withdrawalData = {
        withdrawalReason: 'شرایط مالی',
        notes: 'متقاضی به دلیل مشکلات مالی امکان ثبت‌نام ندارد',
        withdrawalDate: new Date().toISOString()
      };

      const response = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(withdrawalData);

      expect(response.status).toBe(200);
      expect(response.body.withdrawalReason).toBe('شرایط مالی');
      expect(response.body.notes).toBeTruthy();
    });

    it('should reactivate withdrawn lead', async () => {
      // Create a withdrawn lead
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'سارا',
          lastName: 'اکبری',
          phoneNumber: '09191234567',
          workflowStatus: WORKFLOW_STATUS.WITHDRAWAL,
          withdrawalReason: 'مشکل زمانی'
        });

      testLeadId = createResponse.body.id;

      const reactivationData = {
        workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
        status: LEAD_STATUS.CONTACTED,
        withdrawalReason: null,
        withdrawalDate: null
      };

      const response = await request(app)
        .put(`/api/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reactivationData);

      expect(response.status).toBe(200);
      expect(response.body.workflowStatus).toBe(WORKFLOW_STATUS.FOLLOW_UP);
      expect(response.body.withdrawalReason).toBe(null);
    });
  });

  describe('Workflow Statistics', () => {
    it('should get workflow statistics', async () => {
      const response = await request(app)
        .get('/api/leads/workflow-stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contactDesk');
      expect(response.body).toHaveProperty('newIntake');
      expect(response.body).toHaveProperty('noResponse');
      expect(response.body).toHaveProperty('followUp');
      expect(response.body).toHaveProperty('levelAssessment');
      expect(response.body).toHaveProperty('withdrawal');
      expect(typeof response.body.contactDesk).toBe('number');
    });

    it('should get conversion metrics', async () => {
      const response = await request(app)
        .get('/api/leads/conversion-metrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalLeads');
      expect(response.body).toHaveProperty('convertedLeads');
      expect(response.body).toHaveProperty('conversionRate');
      expect(response.body).toHaveProperty('averageConversionTime');
    });
  });
});