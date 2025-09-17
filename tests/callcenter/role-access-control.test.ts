import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

describe('Call Center Role-Based Access Control', () => {
  const userCredentials = {
    admin: { email: 'admin@test.com', password: 'admin123' },
    supervisor: { email: 'supervisor@test.com', password: 'supervisor123' },
    callcenter: { email: 'agent@test.com', password: 'agent123' },
    mentor: { email: 'mentor@test.com', password: 'mentor123' },
    teacher: { email: 'teacher@test.com', password: 'teacher123' },
    student: { email: 'student@test.com', password: 'student123' }
  };

  const getAuthToken = async (role: keyof typeof userCredentials) => {
    const response = await request(app)
      .post('/api/auth/login')
      .send(userCredentials[role]);

    return response.body.accessToken || response.body.auth_token;
  };

  describe('Call Center Access - Allowed Roles', () => {
    it('should allow admin access to all callcenter endpoints', async () => {
      const token = await getAuthToken('admin');

      // Test unified workflow access
      const workflowResponse = await request(app)
        .get('/api/leads?workflowStatus=contact_desk')
        .set('Authorization', `Bearer ${token}`);

      expect(workflowResponse.status).toBe(200);

      // Test lead creation
      const leadResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'تست',
          lastName: 'مدیر',
          phoneNumber: '09120000001',
          workflowStatus: 'contact_desk'
        });

      expect(leadResponse.status).toBe(201);

      // Test SMS sending
      if (leadResponse.body.id) {
        const smsResponse = await request(app)
          .post(`/api/leads/${leadResponse.body.id}/sms`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            message: 'تست پیامک مدیر',
            type: 'test'
          });

        expect(smsResponse.status).toBe(200);

        // Cleanup
        await request(app)
          .delete(`/api/leads/${leadResponse.body.id}`)
          .set('Authorization', `Bearer ${token}`);
      }
    });

    it('should allow supervisor access to callcenter functions', async () => {
      const token = await getAuthToken('supervisor');

      // Test lead management
      const leadsResponse = await request(app)
        .get('/api/leads?workflowStatus=follow_up')
        .set('Authorization', `Bearer ${token}`);

      expect(leadsResponse.status).toBe(200);

      // Test workflow statistics
      const statsResponse = await request(app)
        .get('/api/leads/workflow-stats')
        .set('Authorization', `Bearer ${token}`);

      expect(statsResponse.status).toBe(200);
    });

    it('should allow call center agent full workflow access', async () => {
      const token = await getAuthToken('callcenter');

      // Test lead creation
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'تست',
          lastName: 'کارشناس',
          phoneNumber: '09120000002',
          workflowStatus: 'new_intake',
          interestedLanguage: 'English'
        });

      expect(createResponse.status).toBe(201);

      // Test call attempts
      const callResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/call-attempt`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          outcome: 'no_answer',
          notes: 'تست تماس کارشناس'
        });

      expect(callResponse.status).toBe(200);

      // Test lead updates
      const updateResponse = await request(app)
        .put(`/api/leads/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          workflowStatus: 'follow_up',
          status: 'contacted'
        });

      expect(updateResponse.status).toBe(200);

      // Cleanup
      await request(app)
        .delete(`/api/leads/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`);
    });

    it('should allow mentor limited access to follow-up leads', async () => {
      const token = await getAuthToken('mentor');

      // Test access to follow-up leads (mentors should have some access)
      const followUpResponse = await request(app)
        .get('/api/leads?workflowStatus=follow_up')
        .set('Authorization', `Bearer ${token}`);

      expect(followUpResponse.status).toBe(200);

      // Test limited update permissions
      // Create a test lead first with admin
      const adminToken = await getAuthToken('admin');
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'تست',
          lastName: 'مربی',
          phoneNumber: '09120000003',
          workflowStatus: 'follow_up'
        });

      // Try to update as mentor (should be allowed for follow-up related updates)
      const updateResponse = await request(app)
        .put(`/api/leads/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'یادداشت مربی',
          followUpStart: new Date().toISOString()
        });

      expect(updateResponse.status).toBe(200);

      // Cleanup
      await request(app)
        .delete(`/api/leads/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });

  describe('Call Center Access - Restricted Roles', () => {
    it('should deny teacher access to callcenter functions', async () => {
      const token = await getAuthToken('teacher');

      // Test lead access (should be denied or limited)
      const leadsResponse = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${token}`);

      expect(leadsResponse.status).toBeOneOf([401, 403, 404]);

      // Test lead creation (should be denied)
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'تست',
          lastName: 'استاد',
          phoneNumber: '09120000004'
        });

      expect(createResponse.status).toBeOneOf([401, 403]);
    });

    it('should deny student access to callcenter functions', async () => {
      const token = await getAuthToken('student');

      // Test lead access (should be completely denied)
      const leadsResponse = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${token}`);

      expect(leadsResponse.status).toBeOneOf([401, 403, 404]);

      // Test SMS endpoints (should be denied)
      const smsResponse = await request(app)
        .post('/api/leads/1/sms')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'تست غیرمجاز',
          type: 'test'
        });

      expect(smsResponse.status).toBeOneOf([401, 403, 404]);

      // Test workflow statistics (should be denied)
      const statsResponse = await request(app)
        .get('/api/leads/workflow-stats')
        .set('Authorization', `Bearer ${token}`);

      expect(statsResponse.status).toBeOneOf([401, 403, 404]);
    });
  });

  describe('Granular Permissions by Role', () => {
    it('should enforce supervisor permissions correctly', async () => {
      const token = await getAuthToken('supervisor');

      // Supervisors should access workflow stats
      const statsResponse = await request(app)
        .get('/api/leads/workflow-stats')
        .set('Authorization', `Bearer ${token}`);

      expect(statsResponse.status).toBe(200);

      // Supervisors should access conversion metrics
      const metricsResponse = await request(app)
        .get('/api/leads/conversion-metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(metricsResponse.status).toBe(200);
    });

    it('should enforce call center agent permissions correctly', async () => {
      const token = await getAuthToken('callcenter');

      // Agents should access search functions
      const searchResponse = await request(app)
        .get('/api/leads/search-by-phone?phoneNumber=09123456789')
        .set('Authorization', `Bearer ${token}`);

      expect(searchResponse.status).toBeOneOf([200, 404]); // 404 if not found is acceptable

      // Agents should record call attempts
      const adminToken = await getAuthToken('admin');
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'تست',
          lastName: 'کارشناس',
          phoneNumber: '09120000005'
        });

      const callResponse = await request(app)
        .post(`/api/leads/${createResponse.body.id}/call-attempt`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          outcome: 'answered',
          notes: 'تماس موفق',
          interested: true
        });

      expect(callResponse.status).toBe(200);

      // Cleanup
      await request(app)
        .delete(`/api/leads/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('should enforce mentor limited permissions correctly', async () => {
      const token = await getAuthToken('mentor');

      // Mentors should have limited lead access
      const leadsResponse = await request(app)
        .get('/api/leads?workflowStatus=follow_up')
        .set('Authorization', `Bearer ${token}`);

      expect(leadsResponse.status).toBe(200);

      // Mentors should NOT be able to delete leads
      const adminToken = await getAuthToken('admin');
      const createResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'تست',
          lastName: 'حذف',
          phoneNumber: '09120000006'
        });

      const deleteResponse = await request(app)
        .delete(`/api/leads/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBeOneOf([401, 403, 405]); // Not allowed

      // Cleanup with admin
      await request(app)
        .delete(`/api/leads/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });

  describe('API Endpoint Security', () => {
    it('should require authentication for all callcenter endpoints', async () => {
      // Test without token
      const noTokenResponse = await request(app)
        .get('/api/leads');

      expect(noTokenResponse.status).toBeOneOf([401, 403]);

      // Test with invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/leads')
        .set('Authorization', 'Bearer invalid_token_12345');

      expect(invalidTokenResponse.status).toBeOneOf([401, 403]);
    });

    it('should validate request payloads', async () => {
      const token = await getAuthToken('admin');

      // Test invalid lead creation
      const invalidLeadResponse = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: '', // Empty required field
          phoneNumber: 'invalid_phone' // Invalid format
        });

      expect(invalidLeadResponse.status).toBeOneOf([400, 422]);

      // Test invalid SMS payload
      const invalidSmsResponse = await request(app)
        .post('/api/leads/1/sms')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: '', // Empty message
          type: 'invalid_type'
        });

      expect(invalidSmsResponse.status).toBeOneOf([400, 422]);
    });
  });
});

// Custom matcher for multiple possible status codes
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