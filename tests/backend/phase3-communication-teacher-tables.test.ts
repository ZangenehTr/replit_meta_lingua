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
          recipientId: testStudentId,
          content: 'Hello student, how is your progress?',
          type: 'direct'
        });
        
        expect(message).toBeDefined();
        expect(message.id).toBeDefined();
        expect(message.senderId).toBe(testTeacherId);
        expect(message.content).toContain('progress');
      });
      
      it('should retrieve messages for a user', async () => {
        await storage.createMessage({
          senderId: testTeacherId,
          recipientId: testStudentId,
          content: 'Another message'
        });
        
        const messages = await storage.getUserMessages(testStudentId);
        expect(messages).toBeDefined();
        expect(messages.length).toBeGreaterThan(0);
      });
      
      it('should mark message as read', async () => {
        const message = await storage.createMessage({
          senderId: testTeacherId,
          recipientId: testStudentId,
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
          message: 'You have new homework for the English course',
          priority: 'high'
        });
        
        expect(notification).toBeDefined();
        expect(notification.id).toBeDefined();
        expect(notification.type).toBe('homework');
        expect(notification.priority).toBe('high');
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
          userId: testStudentId,
          type: 'call',
          direction: 'outbound',
          duration: 300,
          status: 'completed',
          notes: 'Follow-up call about course progress'
        });
        
        expect(log).toBeDefined();
        expect(log.id).toBeDefined();
        expect(log.type).toBe('call');
        expect(log.duration).toBe(300);
      });
      
      it('should retrieve communication logs', async () => {
        await storage.logCommunication({
          userId: testStudentId,
          type: 'sms',
          direction: 'outbound',
          status: 'sent',
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
          name: 'John Prospect',
          email: 'john.prospect@test.com',
          phone: '+989121234567',
          source: 'website',
          status: 'new',
          interestedIn: 'English Course',
          notes: 'Interested in business English'
        });
        
        expect(lead).toBeDefined();
        expect(lead.id).toBeDefined();
        expect(lead.name).toBe('John Prospect');
        expect(lead.status).toBe('new');
      });
      
      it('should update lead status', async () => {
        const lead = await storage.createLead({
          name: 'Jane Lead',
          email: 'jane@test.com',
          status: 'new'
        });
        
        const updated = await storage.updateLeadStatus(lead.id, 'contacted');
        expect(updated.status).toBe('contacted');
      });
      
      it('should get leads by status', async () => {
        await storage.createLead({
          name: 'Active Lead',
          email: 'active@test.com',
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
          courseId: testCourseId,
          sessionId: testSessionId,
          title: 'Grammar Exercise',
          description: 'Complete the present perfect exercises',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          points: 10
        });
        
        expect(homework).toBeDefined();
        expect(homework.id).toBeDefined();
        expect(homework.title).toBe('Grammar Exercise');
        expect(homework.points).toBe(10);
      });
      
      it('should submit homework', async () => {
        const homework = await storage.createHomework({
          courseId: testCourseId,
          title: 'Writing Task',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        });
        
        const submission = await storage.submitHomework({
          homeworkId: homework.id,
          studentId: testStudentId,
          submissionText: 'My essay about technology',
          submittedAt: new Date()
        });
        
        expect(submission).toBeDefined();
        expect(submission.status).toBe('submitted');
      });
      
      it('should grade homework', async () => {
        const homework = await storage.createHomework({
          courseId: testCourseId,
          title: 'Quiz',
          points: 20
        });
        
        const submission = await storage.submitHomework({
          homeworkId: homework.id,
          studentId: testStudentId,
          submissionText: 'My answers'
        });
        
        const graded = await storage.gradeHomework(submission.id, {
          grade: 18,
          feedback: 'Excellent work!',
          gradedBy: testTeacherId
        });
        
        expect(graded.grade).toBe(18);
        expect(graded.status).toBe('graded');
      });
    });
    
    describe('Attendance Records', () => {
      it('should record attendance', async () => {
        const attendance = await storage.recordAttendance({
          sessionId: testSessionId,
          studentId: testStudentId,
          status: 'present',
          checkInTime: new Date(),
          notes: 'On time'
        });
        
        expect(attendance).toBeDefined();
        expect(attendance.id).toBeDefined();
        expect(attendance.status).toBe('present');
      });
      
      it('should get session attendance', async () => {
        await storage.recordAttendance({
          sessionId: testSessionId,
          studentId: testUserId,
          status: 'absent',
          notes: 'Sick leave'
        });
        
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
        const availability = await storage.setTeacherAvailability({
          teacherId: testTeacherId,
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true,
          timezone: 'Asia/Tehran'
        });
        
        expect(availability).toBeDefined();
        expect(availability.id).toBeDefined();
        expect(availability.dayOfWeek).toBe('monday');
        expect(availability.isAvailable).toBe(true);
      });
      
      it('should get teacher availability', async () => {
        await storage.setTeacherAvailability({
          teacherId: testTeacherId,
          dayOfWeek: 'tuesday',
          startTime: '10:00',
          endTime: '18:00',
          isAvailable: true
        });
        
        const availability = await storage.getTeacherAvailability(testTeacherId);
        expect(availability).toBeDefined();
        expect(availability.length).toBeGreaterThan(0);
      });
      
      it('should update availability', async () => {
        const availability = await storage.setTeacherAvailability({
          teacherId: testTeacherId,
          dayOfWeek: 'wednesday',
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        });
        
        const updated = await storage.updateTeacherAvailability(availability.id, {
          endTime: '19:00'
        });
        
        expect(updated.endTime).toBe('19:00');
      });
    });
    
    describe('Teacher Assignments', () => {
      it('should assign teacher to course', async () => {
        const assignment = await storage.assignTeacherToCourse({
          teacherId: testTeacherId,
          courseId: testCourseId,
          role: 'primary',
          startDate: new Date(),
          assignedBy: testUserId
        });
        
        expect(assignment).toBeDefined();
        expect(assignment.id).toBeDefined();
        expect(assignment.role).toBe('primary');
      });
      
      it('should get teacher assignments', async () => {
        const assignments = await storage.getTeacherAssignments(testTeacherId);
        expect(assignments).toBeDefined();
        expect(assignments.length).toBeGreaterThan(0);
      });
      
      it('should end teacher assignment', async () => {
        const assignment = await storage.assignTeacherToCourse({
          teacherId: testTeacherId,
          courseId: testCourseId,
          role: 'substitute'
        });
        
        const ended = await storage.endTeacherAssignment(assignment.id);
        expect(ended.endDate).toBeDefined();
        expect(ended.isActive).toBe(false);
      });
    });
    
    describe('Teacher Evaluations', () => {
      it('should create teacher evaluation', async () => {
        const evaluation = await storage.createTeacherEvaluation({
          teacherId: testTeacherId,
          evaluatorId: testUserId,
          period: '2025-Q1',
          overallRating: 4.5,
          teachingSkills: 4.8,
          communication: 4.6,
          professionalism: 4.7,
          studentFeedback: 4.5,
          comments: 'Excellent teacher with great communication skills',
          recommendations: ['Continue professional development']
        });
        
        expect(evaluation).toBeDefined();
        expect(evaluation.id).toBeDefined();
        expect(evaluation.overallRating).toBe(4.5);
      });
      
      it('should get teacher evaluations', async () => {
        const evaluations = await storage.getTeacherEvaluations(testTeacherId);
        expect(evaluations).toBeDefined();
        expect(evaluations.length).toBeGreaterThan(0);
      });
      
      it('should get latest evaluation', async () => {
        const latest = await storage.getLatestTeacherEvaluation(testTeacherId);
        expect(latest).toBeDefined();
        expect(latest.overallRating).toBeDefined();
      });
    });
    
    describe('Class Observations', () => {
      it('should create class observation', async () => {
        const observation = await storage.createClassObservation({
          sessionId: testSessionId,
          teacherId: testTeacherId,
          observerId: testUserId,
          observationType: 'formal',
          date: new Date(),
          duration: 45,
          strengths: ['Good classroom management', 'Clear explanations'],
          areasForImprovement: ['More student interaction'],
          overallScore: 85,
          notes: 'Well-structured lesson'
        });
        
        expect(observation).toBeDefined();
        expect(observation.id).toBeDefined();
        expect(observation.overallScore).toBe(85);
      });
      
      it('should get teacher observations', async () => {
        const observations = await storage.getTeacherObservations(testTeacherId);
        expect(observations).toBeDefined();
        expect(observations.length).toBeGreaterThan(0);
      });
      
      it('should update observation feedback', async () => {
        const observation = await storage.createClassObservation({
          sessionId: testSessionId,
          teacherId: testTeacherId,
          observerId: testUserId,
          observationType: 'informal',
          date: new Date()
        });
        
        const updated = await storage.updateObservationFeedback(observation.id, {
          teacherResponse: 'Thank you for the feedback',
          actionPlan: ['Will increase student participation'],
          followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        
        expect(updated.teacherResponse).toBeDefined();
        expect(updated.followUpDate).toBeDefined();
      });
    });
  });
  
  describe('Cross-Table Integrations', () => {
    it('should handle complete communication workflow', async () => {
      // Create lead
      const lead = await storage.createLead({
        name: 'Integration Test Lead',
        email: 'integration@test.com',
        phone: '+989121234567',
        status: 'new'
      });
      
      // Log communication
      const log = await storage.logCommunication({
        userId: lead.id,
        type: 'call',
        direction: 'outbound',
        status: 'completed',
        notes: 'Initial contact'
      });
      
      // Update lead status
      const updatedLead = await storage.updateLeadStatus(lead.id, 'contacted');
      
      // Create notification for follow-up
      const notification = await storage.createNotification({
        userId: testUserId,
        type: 'reminder',
        title: 'Follow up with lead',
        message: `Follow up with ${lead.name}`
      });
      
      expect(lead).toBeDefined();
      expect(log).toBeDefined();
      expect(updatedLead.status).toBe('contacted');
      expect(notification).toBeDefined();
    });
    
    it('should handle complete teacher workflow', async () => {
      // Set availability
      const availability = await storage.setTeacherAvailability({
        teacherId: testTeacherId,
        dayOfWeek: 'thursday',
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true
      });
      
      // Assign to course
      const assignment = await storage.assignTeacherToCourse({
        teacherId: testTeacherId,
        courseId: testCourseId,
        role: 'primary'
      });
      
      // Create observation
      const observation = await storage.createClassObservation({
        sessionId: testSessionId,
        teacherId: testTeacherId,
        observerId: testUserId,
        observationType: 'formal',
        date: new Date(),
        overallScore: 90
      });
      
      // Create evaluation
      const evaluation = await storage.createTeacherEvaluation({
        teacherId: testTeacherId,
        evaluatorId: testUserId,
        period: '2025-Q1',
        overallRating: 4.7
      });
      
      expect(availability).toBeDefined();
      expect(assignment).toBeDefined();
      expect(observation).toBeDefined();
      expect(evaluation).toBeDefined();
    });
  });
});