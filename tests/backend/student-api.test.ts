import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { registerRoutes } from '../../server/routes'
import { DatabaseStorage } from '../../server/database-storage'

describe('Student Management API', () => {
  let app: express.Application
  let server: any

  beforeAll(async () => {
    app = express()
    app.use(express.json())
    server = await registerRoutes(app)
  })

  afterAll(async () => {
    if (server) {
      server.close()
    }
  })

  describe('GET /api/students/list', () => {
    it('should return list of students', async () => {
      const response = await request(app)
        .get('/api/students/list')
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      
      if (response.body.length > 0) {
        const student = response.body[0]
        expect(student).toHaveProperty('id')
        expect(student).toHaveProperty('firstName')
        expect(student).toHaveProperty('lastName')
        expect(student).toHaveProperty('email')
        expect(student).toHaveProperty('status')
        expect(student).toHaveProperty('level')
        expect(student).toHaveProperty('courses')
        expect(student.courses).toBeInstanceOf(Array)
      }
    })

    it('should handle database errors gracefully', async () => {
      // This test verifies that the API doesn't crash on database errors
      const response = await request(app)
        .get('/api/students/list')

      expect([200, 500]).toContain(response.status)
      expect(response.body).toBeDefined()
    })
  })

  describe('POST /api/admin/students', () => {
    const validStudentData = {
      firstName: 'Test',
      lastName: 'Student',
      email: `test${Date.now()}@example.com`,
      phone: '+989123456789',
      level: 'beginner',
      status: 'active',
      guardianName: 'Test Guardian',
      guardianPhone: '+989123456790',
      notes: 'Test student notes',
      selectedCourses: [],
      totalFee: 0
    }

    it('should create a new student with valid data', async () => {
      const response = await request(app)
        .post('/api/admin/students')
        .send(validStudentData)

      expect([201, 200]).toContain(response.status)
      
      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('student')
        expect(response.body.student).toHaveProperty('id')
        expect(response.body.student.firstName).toBe(validStudentData.firstName)
        expect(response.body.student.email).toBe(validStudentData.email)
      }
    })

    it('should reject student creation with missing required fields', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        email: ''
      }

      const response = await request(app)
        .post('/api/admin/students')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('required')
    })

    it('should reject duplicate email addresses', async () => {
      const duplicateEmailData = {
        ...validStudentData,
        email: 'duplicate@example.com'
      }

      // First creation should succeed
      await request(app)
        .post('/api/admin/students')
        .send(duplicateEmailData)

      // Second creation with same email should fail
      const response = await request(app)
        .post('/api/admin/students')
        .send(duplicateEmailData)

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('Email already exists')
    })

    it('should handle course enrollment properly', async () => {
      // First get available courses
      const coursesResponse = await request(app)
        .get('/api/courses')

      if (coursesResponse.status === 200 && coursesResponse.body.length > 0) {
        const courseId = coursesResponse.body[0].id

        const studentWithCourse = {
          ...validStudentData,
          email: `course-test${Date.now()}@example.com`,
          selectedCourses: [courseId]
        }

        const response = await request(app)
          .post('/api/admin/students')
          .send(studentWithCourse)

        expect([200, 201]).toContain(response.status)
        
        if (response.status === 200 || response.status === 201) {
          expect(response.body.student.courseNames).toContain(coursesResponse.body[0].title)
        }
      }
    })
  })

  describe('GET /api/courses', () => {
    it('should return list of available courses', async () => {
      const response = await request(app)
        .get('/api/courses')
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      
      if (response.body.length > 0) {
        const course = response.body[0]
        expect(course).toHaveProperty('id')
        expect(course).toHaveProperty('title')
        expect(course).toHaveProperty('level')
      }
    })
  })

  describe('VoIP Integration', () => {
    it('should initiate VoIP call successfully', async () => {
      const voipData = {
        phoneNumber: '+989123456789',
        contactName: 'Test Contact',
        callType: 'outbound',
        recordCall: true
      }

      const response = await request(app)
        .post('/api/voip/initiate-call')
        .send(voipData)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('callId')
      expect(response.body).toHaveProperty('recordingEnabled', true)
    })

    it('should handle VoIP call errors gracefully', async () => {
      const invalidVoipData = {
        phoneNumber: '',
        contactName: '',
        callType: 'invalid'
      }

      const response = await request(app)
        .post('/api/voip/initiate-call')
        .send(invalidVoipData)

      expect([400, 500]).toContain(response.status)
      expect(response.body).toHaveProperty('success', false)
    })
  })
})