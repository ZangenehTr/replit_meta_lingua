import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../../server/db';
import { DatabaseStorage } from '../../server/database-storage';
import { 
  users, messages, notifications, communicationLogs, leads, homework, 
  attendanceRecords, teacherAvailability, teacherAssignments, 
  teacherEvaluations, classObservations
} from '../../shared/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

describe('Phase 3: Communication & Teacher Management Tables', () => {
  let storage: DatabaseStorage;
  let testUserId: number;
  let testTeacherId: number;
  let testStudentId: number;
  let testCourseId: number;
  let testSessionId: number;

  beforeAll(async () => {
    storage = new DatabaseStorage();
    
    // Clean up any existing test data first - more thorough cleanup
    try {
      // First get user IDs if they exist
      const existingUsers = await db.select().from(users).where(
        eq(users.email, 'phase3_teacher@test.com')
      );
      
      // If teacher exists, delete courses they may have created
      for (const user of existingUsers) {
        // Use storage method to delete courses
        const instructorCourses = await storage.getCoursesByInstructor(user.id);
        for (const course of instructorCourses) {
          await storage.deleteCourse(course.id).catch(() => {});
        }
      }
      
      // Delete the test users
      await db.delete(users).where(eq(users.email, 'phase3_admin@test.com'));
      await db.delete(users).where(eq(users.email, 'phase3_teacher@test.com'));
      await db.delete(users).where(eq(users.email, 'phase3_student@test.com'));
    } catch (error) {
      // Silent cleanup - errors are expected if data doesn't exist
    }
    
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create admin user
    const [adminUser] = await db.insert(users).values({
      username: 'phase3_admin',
      email: 'phase3_admin@test.com',
      password: hashedPassword,
      firstName: 'Phase3',
      lastName: 'Admin',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    }).returning();
    testUserId = adminUser.id;
    
    // Create teacher user
    const [teacherUser] = await db.insert(users).values({
      username: 'phase3_teacher',
      email: 'phase3_teacher@test.com',
      password: hashedPassword,
      firstName: 'Phase3',
      lastName: 'Teacher',
      role: 'teacher',
      isActive: true,
      isEmailVerified: true
    }).returning();
    testTeacherId = teacherUser.id;
    
    // Create student user
    const [studentUser] = await db.insert(users).values({
      username: 'phase3_student',
      email: 'phase3_student@test.com',
      password: hashedPassword,
      firstName: 'Phase3',
      lastName: 'Student',
      role: 'student',
      isActive: true,
      isEmailVerified: true
    }).returning();
    testStudentId = studentUser.id;
    
    // Create a test course and session
    const course = await storage.createCourse({
      title: 'Phase 3 Test Course',
      description: 'Course for Phase 3 testing',
      instructorId: testTeacherId,
      level: 'intermediate',
      language: 'en',
      category: 'general',
      price: 100,
      duration: 30
    });
    testCourseId = course.id;
    
    const session = await storage.createSession({
      courseId: testCourseId,
      studentId: testStudentId,
      tutorId: testTeacherId,
      title: 'Test Session',
      scheduledAt: new Date(),
      duration: 60
    });
    testSessionId = session.id;
  });
  
  afterAll(async () => {
    // Cleanup test data - delete dependent data first to avoid foreign key constraints
    
    // Delete sessions, courses before users (foreign key dependencies)
    try {
      if (testSessionId) {
        await storage.deleteSession(testSessionId).catch(() => {});
      }
      if (testCourseId) {
        await storage.deleteCourse(testCourseId).catch(() => {});
      }
      
      // Delete users
      await db.delete(users).where(eq(users.email, 'phase3_admin@test.com'));
      await db.delete(users).where(eq(users.email, 'phase3_teacher@test.com'));
      await db.delete(users).where(eq(users.email, 'phase3_student@test.com'));
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
  
  describe('Communication Management', () => {
    describe('Messages', () => {
      it('should send a message between users', async () => {
        const message = await storage.createMessage({
          senderId: testTeacherId,
          receiverId: testStudentId,
          content: 'Hello student, how is your progress?'
        });
        
        expect(message).toBeDefined();
        expect(message.id).toBeDefined();
        expect(message.senderId).toBe(testTeacherId);
        expect(message.content).toContain('progress');
      });
      
      it('should retrieve messages for a user', async () => {
        await storage.createMessage({
          senderId: testTeacherId,
          receiverId: testStudentId,
          content: 'Another message'
        });
        
        const messages = await storage.getUserMessages(testStudentId);
        expect(messages).toBeDefined();
        expect(messages.length).toBeGreaterThan(0);
      });
      
      it('should mark message as read', async () => {
        const message = await storage.createMessage({
          senderId: testTeacherId,
          receiverId: testStudentId,
          content: 'Please read this'
        });
        
        const updated = await storage.markMessageAsRead(message.id);
        expect(updated.isRead).toBe(true);
      });
    });
    
    describe('Notifications', () => {
      it('should create a notification', async () => {
        const notification = await storage.createNotification({
          userId: testStudentId,
          type: 'homework',
          title: 'New Homework Assigned',
          message: 'You have new homework for the English course'
        });
        
        expect(notification).toBeDefined();
        expect(notification.id).toBeDefined();
        expect(notification.type).toBe('homework');
      });
      
      it('should get user notifications', async () => {
        await storage.createNotification({
          userId: testStudentId,
          type: 'reminder',
          title: 'Class Tomorrow',
          message: 'Remember your class at 10 AM'
        });
        
        const notifications = await storage.getUserNotifications(testStudentId);
        expect(notifications).toBeDefined();
        expect(notifications.length).toBeGreaterThan(0);
      });
      
      it('should mark notification as read', async () => {
        const notification = await storage.createNotification({
          userId: testStudentId,
          type: 'announcement',
          title: 'Important',
          message: 'Please check this'
        });
        
        const updated = await storage.markNotificationAsRead(notification.id);
        expect(updated.isRead).toBe(true);
      });
    });
    
    describe('Communication Logs', () => {
      it('should log a communication', async () => {
        const log = await storage.logCommunication({
          studentId: testStudentId,
          agentId: testTeacherId,
          type: 'call',
          direction: 'outbound',
          duration_minutes: 300,
          outcome: 'answered',
          notes: 'Follow-up call about course progress'
        });
        
        expect(log).toBeDefined();
        expect(log.id).toBeDefined();
        expect(log.type).toBe('call');
        expect(log.duration_minutes).toBe(300);
      });
      
      it('should retrieve communication logs', async () => {
        await storage.logCommunication({
          studentId: testStudentId,
          agentId: testTeacherId,
          type: 'sms',
          direction: 'outbound',
          outcome: 'answered',
          notes: 'Reminder SMS sent'
        });
        
        const logs = await storage.getCommunicationLogs(testStudentId);
        expect(logs).toBeDefined();
        expect(logs.length).toBeGreaterThan(0);
      });
    });
    
    describe('Leads Management', () => {
      it('should create a lead', async () => {
        const lead = await storage.createLead({
          firstName: 'John',
          lastName: 'Prospect',
          email: 'john.prospect@test.com',
          phoneNumber: '+989121234567',
          source: 'website',
          status: 'new',
          interestedLanguage: 'english',
          notes: 'Interested in business English'
        });
        
        expect(lead).toBeDefined();
        expect(lead.id).toBeDefined();
        expect(lead.firstName).toBe('John');
        expect(lead.status).toBe('new');
      });
      
      it('should update lead status', async () => {
        const lead = await storage.createLead({
          firstName: 'Jane',
          lastName: 'Lead',
          phoneNumber: '+989121234568',
          email: 'jane@test.com',
          source: 'website',
          status: 'new'
        });
        
        const updated = await storage.updateLeadStatus(lead.id, 'contacted');
        expect(updated.status).toBe('contacted');
      });
      
      it('should get leads by status', async () => {
        await storage.createLead({
          firstName: 'Active',
          lastName: 'Lead',
          phoneNumber: '+989121234569',
          email: 'active@test.com',
          source: 'website',
          status: 'qualified'
        });
        
        const leads = await storage.getLeadsByStatus('qualified');
        expect(leads).toBeDefined();
        expect(leads.length).toBeGreaterThan(0);
      });
    });
    
    describe('Homework Management', () => {
      it('should create homework', async () => {
        const homework = await storage.createHomework({
          studentId: testStudentId,
          teacherId: testTeacherId,
          courseId: testCourseId,
          title: 'Grammar Exercise',
          description: 'Complete the present perfect exercises',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        
        expect(homework).toBeDefined();
        expect(homework.id).toBeDefined();
        expect(homework.title).toBe('Grammar Exercise');
      });
      
      it('should submit homework', async () => {
        const homework = await storage.createHomework({
          studentId: testStudentId,
          teacherId: testTeacherId,
          courseId: testCourseId,
          title: 'Writing Task',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        });
        
        const submission = await storage.submitHomework(
          homework.id,
          'My essay about technology'
        );
        
        expect(submission).toBeDefined();
        expect(submission.status).toBe('submitted');
      });
      
      it('should grade homework', async () => {
        const homework = await storage.createHomework({
          studentId: testStudentId,
          teacherId: testTeacherId,
          courseId: testCourseId,
          title: 'Quiz'
        });
        
        const submission = await storage.submitHomework(
          homework.id,
          'My answers'
        );
        
        const graded = await storage.gradeHomework(
          homework.id,
          85,
          'Excellent work!'
        );
        
        expect(graded.grade).toBe(85);
        expect(graded.status).toBe('graded');
      });
    });
    
    describe('Attendance Records', () => {
      it('should record attendance', async () => {
        const attendance = await storage.recordAttendance(
          testStudentId,
          testSessionId,
          'present',
          new Date()
        );
        
        expect(attendance).toBeDefined();
        expect(attendance.id).toBeDefined();
        expect(attendance.status).toBe('present');
      });
      
      it('should get session attendance', async () => {
        await storage.recordAttendance(
          testStudentId,
          testSessionId,
          'absent',
          new Date()
        );
        
        const attendance = await storage.getSessionAttendance(testSessionId);
        expect(attendance).toBeDefined();
        expect(attendance.length).toBeGreaterThan(0);
      });
      
      it('should get student attendance history', async () => {
        const history = await storage.getStudentAttendance(testStudentId);
        expect(history).toBeDefined();
        expect(Array.isArray(history)).toBe(true);
      });
    });
  });
  
  describe('Teacher Management', () => {
    describe('Teacher Availability', () => {
      it('should set teacher availability', async () => {
        const availability = await storage.setTeacherAvailability(
          testTeacherId,
          'Monday',
          '09:00',
          '17:00'
        );
        
        expect(availability).toBeDefined();
        expect(availability.id).toBeDefined();
        expect(availability.dayOfWeek).toBe('Monday');
        expect(availability.isActive).toBe(true);
      });
      
      it('should get teacher availability', async () => {
        await storage.setTeacherAvailability(
          testTeacherId,
          'Tuesday',
          '10:00',
          '18:00'
        );
        
        const availability = await storage.getTeacherAvailability(testTeacherId);
        expect(availability).toBeDefined();
        expect(availability.length).toBeGreaterThan(0);
      });
      
      it('should update availability', async () => {
        const availability = await storage.setTeacherAvailability(
          testTeacherId,
          'Wednesday',
          '09:00',
          '17:00'
        );
        
        const updated = await storage.updateTeacherAvailability(availability.id, '19:00');
        
        expect(updated.endTime).toBe('19:00');
      });
    });
    
    describe('Teacher Assignments', () => {
      it('should assign teacher to course', async () => {
        const assignment = await storage.assignTeacherToCourse(
          testTeacherId,
          testCourseId
        );
        
        expect(assignment).toBeDefined();
        expect(assignment.id).toBeDefined();
        expect(assignment.teacherId).toBe(testTeacherId);
      });
      
      it('should get teacher assignments', async () => {
        const assignments = await storage.getTeacherAssignments(testTeacherId);
        expect(assignments).toBeDefined();
        expect(assignments.length).toBeGreaterThan(0);
      });
      
      it('should end teacher assignment', async () => {
        const assignment = await storage.assignTeacherToCourse(
          testTeacherId,
          testCourseId
        );
        
        const ended = await storage.endTeacherAssignment(assignment.id);
        expect(ended.endDate).toBeDefined();
        expect(ended.isActive).toBe(false);
      });
    });
    
    describe('Teacher Evaluations', () => {
      it('should create teacher evaluation', async () => {
        const evaluation = await storage.createTeacherEvaluation({
          teacherId: testTeacherId,
          supervisorId: testUserId,
          evaluationPeriod: '2025-Q1',
          teachingEffectiveness: 9,
          classroomManagement: 8,
          studentEngagement: 9,
          contentKnowledge: 9,
          communication: 8,
          professionalism: 9,
          overallScore: 87,
          comments: 'Excellent teacher with great communication skills',
          recommendations: 'Continue professional development'
        });
        
        expect(evaluation).toBeDefined();
        expect(evaluation.id).toBeDefined();
        expect(evaluation.overallScore).toBe(87);
      });
      
      it('should get teacher evaluations', async () => {
        const evaluations = await storage.getTeacherEvaluations(testTeacherId);
        expect(evaluations).toBeDefined();
        expect(evaluations.length).toBeGreaterThan(0);
      });
      
      it('should get latest evaluation', async () => {
        const latest = await storage.getLatestTeacherEvaluation(testTeacherId);
        expect(latest).toBeDefined();
        expect(latest.overallScore).toBeDefined();
      });
    });
    
    describe('Class Observations', () => {
      it('should create class observation', async () => {
        const observation = await storage.createClassObservation({
          teacherId: testTeacherId,
          supervisorId: testUserId,
          courseId: testCourseId,
          sessionId: testSessionId,
          observationDate: new Date(),
          duration_minutes: 45,
          preparedness: 4,
          delivery: 5,
          studentEngagement: 4,
          classroomManagement: 5,
          strengths: 'Good classroom management, Clear explanations',
          areasForImprovement: 'More student interaction',
          overallRating: 4,
          recommendations: 'Well-structured lesson'
        });
        
        expect(observation).toBeDefined();
        expect(observation.id).toBeDefined();
        expect(observation.overallRating).toBe(4);
      });
      
      it('should get teacher observations', async () => {
        const observations = await storage.getTeacherObservations(testTeacherId);
        expect(observations).toBeDefined();
        expect(observations.length).toBeGreaterThan(0);
      });
      
      it('should update observation feedback', async () => {
        const observation = await storage.createClassObservation({
          teacherId: testTeacherId,
          supervisorId: testUserId,
          courseId: testCourseId,
          sessionId: testSessionId,
          observationDate: new Date(),
          preparedness: 3,
          delivery: 4,
          studentEngagement: 3,
          classroomManagement: 4,
          overallRating: 3
        });
        
        const updated = await storage.updateObservationFeedback(
          observation.id,
          'Thank you for the feedback, will increase student participation',
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        );
        
        expect(updated.teacherFeedback).toBeDefined();
        expect(updated.followUpDate).toBeDefined();
      });
    });
  });
  
  describe('Cross-Table Integrations', () => {
    it('should handle complete communication workflow', async () => {
      // Create lead
      const lead = await storage.createLead({
        firstName: 'Integration',
        lastName: 'Test Lead',
        email: 'integration@test.com',
        phoneNumber: '+989121234567',
        source: 'website',
        status: 'new'
      });
      
      // Log communication
      const log = await storage.logCommunication({
        leadId: lead.id,
        agentId: testUserId,
        type: 'call',
        direction: 'outbound',
        outcome: 'answered',
        notes: 'Initial contact'
      });
      
      // Update lead status
      const updatedLead = await storage.updateLeadStatus(lead.id, 'contacted');
      
      // Create notification for follow-up
      const notification = await storage.createNotification({
        userId: testUserId,
        type: 'reminder',
        title: 'Follow up with lead',
        message: `Follow up with ${lead.firstName} ${lead.lastName}`
      });
      
      expect(lead).toBeDefined();
      expect(log).toBeDefined();
      expect(updatedLead.status).toBe('contacted');
      expect(notification).toBeDefined();
    });
    
    it('should handle complete teacher workflow', async () => {
      // Set availability
      const availability = await storage.setTeacherAvailability(
        testTeacherId,
        'Thursday',
        '09:00',
        '17:00'
      );
      
      // Assign to course
      const assignment = await storage.assignTeacherToCourse(
        testTeacherId,
        testCourseId
      );
      
      // Create observation
      const observation = await storage.createClassObservation({
        teacherId: testTeacherId,
        supervisorId: testUserId,
        courseId: testCourseId,
        sessionId: testSessionId,
        observationDate: new Date(),
        preparedness: 5,
        delivery: 5,
        studentEngagement: 5,
        classroomManagement: 5,
        overallRating: 5
      });
      
      // Create evaluation
      const evaluation = await storage.createTeacherEvaluation({
        teacherId: testTeacherId,
        supervisorId: testUserId,
        evaluationPeriod: '2025-Q1',
        teachingEffectiveness: 9,
        classroomManagement: 9,
        studentEngagement: 9,
        contentKnowledge: 9,
        communication: 9,
        professionalism: 9,
        overallScore: 90
      });
      
      expect(availability).toBeDefined();
      expect(assignment).toBeDefined();
      expect(observation).toBeDefined();
      expect(evaluation).toBeDefined();
    });
  });
});