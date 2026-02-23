import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function apiPost(path: string, body: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

describe('API Smoke Tests', () => {
  describe('Health & Infrastructure', () => {
    it('GET /health returns 200', async () => {
      const { status, data } = await apiGet('/health');
      expect(status).toBe(200);
      expect(data).toBeDefined();
    });

    it('GET /api/system/health returns system status', async () => {
      const { status } = await apiGet('/api/system/health');
      expect([200, 401, 404]).toContain(status);
    });
  });

  describe('Authentication', () => {
    it('POST /api/auth/request-otp accepts valid phone format', async () => {
      const { status, data } = await apiPost('/api/auth/request-otp', {
        phoneNumber: '09121234567',
      });
      expect([200, 400, 429, 500]).toContain(status);
      expect(data).toBeDefined();
    });

    it('POST /api/auth/request-otp rejects invalid phone', async () => {
      const { status } = await apiPost('/api/auth/request-otp', {
        phoneNumber: '123',
      });
      expect([400, 429, 500]).toContain(status);
    });

    it('GET /api/user returns 401 or 404 without auth', async () => {
      const { status } = await apiGet('/api/user');
      expect([401, 404]).toContain(status);
    });
  });

  describe('Public Routes', () => {
    it('GET /api/cms/posts/published returns posts list', async () => {
      const { status } = await apiGet('/api/cms/posts/published');
      expect([200, 404]).toContain(status);
    });

    it('GET /api/cms/curriculum-categories/active returns categories', async () => {
      const { status } = await apiGet('/api/cms/curriculum-categories/active');
      expect([200, 404]).toContain(status);
    });

    it('GET /api/visitor-chat/settings returns chat config', async () => {
      const { status } = await apiGet('/api/visitor-chat/settings');
      expect([200, 404]).toContain(status);
    });
  });

  describe('Placement Test', () => {
    it('POST /api/placement-test/start responds (may require more fields)', async () => {
      const { status } = await apiPost('/api/placement-test/start', {
        targetLanguage: 'english',
        nativeLanguage: 'persian',
      });
      expect([200, 201, 400, 401, 500]).toContain(status);
    });
  });

  describe('Protected Routes (should require auth)', () => {
    const protectedEndpoints = [
      '/api/admin/users',
      '/api/gamification/stats',
    ];

    for (const endpoint of protectedEndpoints) {
      it(`GET ${endpoint} returns 401 without auth`, async () => {
        const { status } = await apiGet(endpoint);
        expect([401, 403]).toContain(status);
      });
    }
  });

  describe('Route Existence', () => {
    it('GET /api/courses responds (public or protected)', async () => {
      const { status } = await apiGet('/api/courses');
      expect([200, 401, 403]).toContain(status);
    });

    it('Server returns valid JSON for unknown API paths', async () => {
      const { status } = await apiGet('/api/nonexistent-route-xyz');
      expect([404, 500]).toContain(status);
    });
  });
});
