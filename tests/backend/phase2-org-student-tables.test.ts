import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseStorage } from '../../server/database-storage';

describe('Phase 2: Organizational & Student Management Tables', () => {
  let storage: DatabaseStorage;
  let testUserId: number;
  let testTeacherId: number;
  let testMentorId: number;
  let testInstituteId: number;
  let testDepartmentId: number;
  let testRoleId: number;
  
  beforeEach(async () => {
    storage = new DatabaseStorage();
    
    // Create test users for relationships
    const adminUser = await storage.createUser({
      email: `admin-${Date.now()}@test.com`,
      password: 'password123',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Admin'
    });
    
    const studentUser = await storage.createUser({
      email: `student-${Date.now()}@test.com`,
      password: 'password123',
      role: 'student',
      firstName: 'Test',
      lastName: 'Student'
    });
    testUserId = studentUser.id;
    
    const teacherUser = await storage.createUser({
      email: `teacher-${Date.now()}@test.com`,
      password: 'password123',
      role: 'teacher',
      firstName: 'Test',
      lastName: 'Teacher'
    });
    testTeacherId = teacherUser.id;
    
    const mentorUser = await storage.createUser({
      email: `mentor-${Date.now()}@test.com`,
      password: 'password123',
      role: 'mentor',
      firstName: 'Test',
      lastName: 'Mentor'
    });
    testMentorId = mentorUser.id;
  });
  
  describe('Organizational Structure', () => {
    describe('Institutes Management', () => {
      it('should create an institute', async () => {
        const institute = await storage.createInstitute({
          name: 'Test Language Institute',
          code: `INST-${Date.now()}`,
          description: 'A test institute for language learning',
          address: '123 Test Street',
          phoneNumber: '+989121234567',
          email: 'test@institute.com',
          website: 'https://test-institute.com',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          timezone: 'Asia/Tehran'
        });
        
        expect(institute).toBeDefined();
        expect(institute.id).toBeDefined();
        expect(institute.name).toBe('Test Language Institute');
        expect(institute.code).toContain('INST-');
        expect(institute.isActive).toBe(true);
        
        testInstituteId = institute.id;
      });
      
      it('should retrieve institutes', async () => {
        const institute = await storage.createInstitute({
          name: 'Another Institute',
          code: `INST2-${Date.now()}`,
          email: 'another@institute.com'
        });
        
        const institutes = await storage.getInstitutes();
        expect(institutes).toBeInstanceOf(Array);
        expect(institutes.length).toBeGreaterThan(0);
        expect(institutes.some(i => i.id === institute.id)).toBe(true);
      });
      
      it('should update an institute', async () => {
        const institute = await storage.createInstitute({
          name: 'Original Institute',
          code: `ORIG-${Date.now()}`,
          email: 'original@institute.com'
        });
        
        const updated = await storage.updateInstitute(institute.id, {
          name: 'Updated Institute',
          description: 'Updated description'
        });
        
        expect(updated.name).toBe('Updated Institute');
        expect(updated.description).toBe('Updated description');
      });
      
      it('should soft delete an institute', async () => {
        const institute = await storage.createInstitute({
          name: 'To Delete Institute',
          code: `DEL-${Date.now()}`,
          email: 'delete@institute.com'
        });
        
        const deleted = await storage.deleteInstitute(institute.id);
        expect(deleted).toBe(true);
        
        const institutes = await storage.getInstitutes();
        expect(institutes.some(i => i.id === institute.id)).toBe(false);
      });
    });
    
    describe('Departments Management', () => {
      beforeEach(async () => {
        // Ensure we have an institute for departments
        if (!testInstituteId) {
          const institute = await storage.createInstitute({
            name: 'Department Test Institute',
            code: `DEPT-INST-${Date.now()}`,
            email: 'dept@institute.com'
          });
          testInstituteId = institute.id;
        }
      });
      
      it('should create a department', async () => {
        const department = await storage.createDepartment({
          instituteId: testInstituteId,
          name: 'Language Department',
          description: 'Teaching various languages',
          headTeacherId: testTeacherId
        });
        
        expect(department).toBeDefined();
        expect(department.id).toBeDefined();
        expect(department.name).toBe('Language Department');
        expect(department.instituteId).toBe(testInstituteId);
        
        testDepartmentId = department.id;
      });
      
      it('should retrieve departments by institute', async () => {
        const dept1 = await storage.createDepartment({
          instituteId: testInstituteId,
          name: 'English Department',
          headTeacherId: testTeacherId
        });
        
        const dept2 = await storage.createDepartment({
          instituteId: testInstituteId,
          name: 'Persian Department',
          headTeacherId: testTeacherId
        });
        
        const departments = await storage.getDepartments(testInstituteId);
        expect(departments).toBeInstanceOf(Array);
        expect(departments.length).toBeGreaterThanOrEqual(2);
        expect(departments.some(d => d.name === 'English Department')).toBe(true);
        expect(departments.some(d => d.name === 'Persian Department')).toBe(true);
      });
      
      it('should update a department', async () => {
        const department = await storage.createDepartment({
          instituteId: testInstituteId,
          name: 'Original Department',
          headTeacherId: testTeacherId
        });
        
        const updated = await storage.updateDepartment(department.id, {
          name: 'Updated Department',
          description: 'New description'
        });
        
        expect(updated.name).toBe('Updated Department');
        expect(updated.description).toBe('New description');
      });
    });
    
    describe('Custom Roles Management', () => {
      it('should create a custom role', async () => {
        const role = await storage.createCustomRole({
          name: 'Department Head',
          description: 'Head of a department with special permissions',
          permissions: ['manage_teachers', 'view_reports', 'approve_courses'],
          isSystemRole: false
        });
        
        expect(role).toBeDefined();
        expect(role.id).toBeDefined();
        expect(role.name).toBe('Department Head');
        expect(role.permissions).toContain('manage_teachers');
        expect(role.isSystemRole).toBe(false);
        
        testRoleId = role.id;
      });
      
      it('should retrieve custom roles', async () => {
        const role = await storage.createCustomRole({
          name: 'Teaching Assistant',
          description: 'Assistant to teachers',
          permissions: ['view_students', 'grade_homework']
        });
        
        const roles = await storage.getCustomRoles();
        expect(roles).toBeInstanceOf(Array);
        expect(roles.some(r => r.name === 'Teaching Assistant')).toBe(true);
      });
      
      it('should not delete system roles', async () => {
        const systemRole = await storage.createCustomRole({
          name: 'System Admin',
          description: 'System administrator',
          permissions: ['*'],
          isSystemRole: true
        });
        
        const deleted = await storage.deleteCustomRole(systemRole.id);
        expect(deleted).toBe(false);
        
        const role = await storage.getCustomRoleById(systemRole.id);
        expect(role).toBeDefined();
      });
    });
  });
  
  describe('Student Management', () => {
    describe('Mentor Assignments', () => {
      it('should create a mentor assignment', async () => {
        const assignment = await storage.createMentorAssignment({
          mentorId: testMentorId,
          studentId: testUserId,
          assignedBy: testTeacherId,
          status: 'active',
          startDate: new Date(),
          goals: 'Improve speaking and listening skills',
          notes: 'Student needs extra support in pronunciation'
        });
        
        expect(assignment).toBeDefined();
        expect(assignment.id).toBeDefined();
        expect(assignment.mentorId).toBe(testMentorId);
        expect(assignment.studentId).toBe(testUserId);
        expect(assignment.status).toBe('active');
      });
      
      it('should retrieve mentor assignments', async () => {
        const assignment = await storage.createMentorAssignment({
          mentorId: testMentorId,
          studentId: testUserId,
          assignedBy: testTeacherId,
          status: 'active'
        });
        
        const mentorAssignments = await storage.getMentorAssignments(testMentorId);
        expect(mentorAssignments).toBeInstanceOf(Array);
        expect(mentorAssignments.some(a => a.id === assignment.id)).toBe(true);
        
        const studentAssignments = await storage.getMentorAssignments(undefined, testUserId);
        expect(studentAssignments.some(a => a.id === assignment.id)).toBe(true);
      });
      
      it('should get active mentor assignments', async () => {
        await storage.createMentorAssignment({
          mentorId: testMentorId,
          studentId: testUserId,
          assignedBy: testTeacherId,
          status: 'active'
        });
        
        await storage.createMentorAssignment({
          mentorId: testMentorId,
          studentId: testUserId,
          assignedBy: testTeacherId,
          status: 'completed'
        });
        
        const activeAssignments = await storage.getActiveMentorAssignments(testMentorId);
        expect(activeAssignments).toBeInstanceOf(Array);
        expect(activeAssignments.every(a => a.status === 'active')).toBe(true);
      });
    });
    
    describe('Mentoring Sessions', () => {
      let testAssignmentId: number;
      
      beforeEach(async () => {
        const assignment = await storage.createMentorAssignment({
          mentorId: testMentorId,
          studentId: testUserId,
          assignedBy: testTeacherId,
          status: 'active'
        });
        testAssignmentId = assignment.id;
      });
      
      it('should create a mentoring session', async () => {
        const session = await storage.createMentoringSession({
          assignmentId: testAssignmentId,
          scheduledDate: new Date(),
          duration: 60,
          type: 'regular',
          status: 'scheduled',
          topics: ['Grammar review', 'Speaking practice'],
          notes: 'Focus on present perfect tense'
        });
        
        expect(session).toBeDefined();
        expect(session.id).toBeDefined();
        expect(session.assignmentId).toBe(testAssignmentId);
        expect(session.duration).toBe(60);
        expect(session.topics).toContain('Grammar review');
      });
      
      it('should complete a mentoring session', async () => {
        const session = await storage.createMentoringSession({
          assignmentId: testAssignmentId,
          scheduledDate: new Date(),
          type: 'regular'
        });
        
        const completed = await storage.completeMentoringSession(session.id, {
          outcome: 'Student showed good progress in grammar',
          nextSteps: 'Continue with advanced grammar topics',
          notes: 'Student is ready for B2 level'
        });
        
        expect(completed.status).toBe('completed');
        expect(completed.outcomes).toContain('good progress');
      });
    });
    
    describe('Parent/Guardian Management', () => {
      it('should create a parent guardian', async () => {
        const guardian = await storage.createParentGuardian({
          studentId: testUserId,
          name: 'John Parent',
          relationship: 'father',
          phoneNumber: '+989121234567',
          email: 'parent@test.com',
          address: '123 Parent Street',
          isPrimary: true,
          emergencyContact: true,
          canPickup: true,
          notes: 'Primary contact for all matters'
        });
        
        expect(guardian).toBeDefined();
        expect(guardian.id).toBeDefined();
        expect(guardian.name).toBe('John Parent');
        expect(guardian.relationship).toBe('father');
        expect(guardian.isPrimary).toBe(true);
      });
      
      it('should retrieve parent guardians for a student', async () => {
        await storage.createParentGuardian({
          studentId: testUserId,
          name: 'Mother Guardian',
          relationship: 'mother',
          isPrimary: true
        });
        
        await storage.createParentGuardian({
          studentId: testUserId,
          name: 'Uncle Guardian',
          relationship: 'guardian',
          isPrimary: false
        });
        
        const guardians = await storage.getParentGuardians(testUserId);
        expect(guardians).toBeInstanceOf(Array);
        expect(guardians.length).toBeGreaterThanOrEqual(2);
        expect(guardians[0].isPrimary).toBe(true); // Primary guardians come first
      });
    });
    
    describe('Student Notes', () => {
      it('should create a student note', async () => {
        const note = await storage.createStudentNote({
          studentId: testUserId,
          teacherId: testTeacherId,
          type: 'progress',
          title: 'Excellent Progress',
          content: 'Student has shown remarkable improvement in speaking skills',
          priority: 'high',
          isPrivate: false,
          tags: ['speaking', 'improvement']
        });
        
        expect(note).toBeDefined();
        expect(note.id).toBeDefined();
        expect(note.type).toBe('progress');
        expect(note.priority).toBe('high');
        expect(note.tags).toContain('speaking');
      });
      
      it('should retrieve student notes', async () => {
        await storage.createStudentNote({
          studentId: testUserId,
          teacherId: testTeacherId,
          type: 'behavioral',
          title: 'Class Participation',
          content: 'Very active in class discussions'
        });
        
        const notes = await storage.getStudentNotes(testUserId);
        expect(notes).toBeInstanceOf(Array);
        expect(notes.some(n => n.title === 'Class Participation')).toBe(true);
      });
      
      it('should filter notes by teacher', async () => {
        const anotherTeacher = await storage.createUser({
          email: `teacher2-${Date.now()}@test.com`,
          password: 'password123',
          role: 'teacher',
          firstName: 'Another',
          lastName: 'Teacher'
        });
        
        await storage.createStudentNote({
          studentId: testUserId,
          teacherId: testTeacherId,
          type: 'academic',
          title: 'Note from Teacher 1',
          content: 'Content 1'
        });
        
        await storage.createStudentNote({
          studentId: testUserId,
          teacherId: anotherTeacher.id,
          type: 'academic',
          title: 'Note from Teacher 2',
          content: 'Content 2'
        });
        
        const teacher1Notes = await storage.getStudentNotes(testUserId, testTeacherId);
        expect(teacher1Notes.every(n => n.teacherId === testTeacherId)).toBe(true);
      });
    });
  });
  
  describe('Placement & Assessment', () => {
    describe('Level Assessment Questions', () => {
      it('should create a level assessment question', async () => {
        const question = await storage.createLevelAssessmentQuestion({
          language: 'en',
          questionText: 'What is the past tense of "go"?',
          questionType: 'multiple_choice',
          difficulty: 'beginner',
          options: ['goed', 'went', 'gone', 'going'],
          correctAnswer: 'went',
          points: 2,
          createdBy: testTeacherId
        });
        
        expect(question).toBeDefined();
        expect(question.id).toBeDefined();
        expect(question.questionText).toContain('past tense');
        expect(question.correctAnswer).toBe('went');
      });
      
      it('should retrieve questions by language and difficulty', async () => {
        await storage.createLevelAssessmentQuestion({
          language: 'en',
          questionText: 'Easy question',
          questionType: 'multiple_choice',
          difficulty: 'beginner',
          correctAnswer: 'answer'
        });
        
        await storage.createLevelAssessmentQuestion({
          language: 'en',
          questionText: 'Hard question',
          questionType: 'essay',
          difficulty: 'advanced',
          correctAnswer: 'complex answer'
        });
        
        const beginnerQuestions = await storage.getLevelAssessmentQuestions('en', 'beginner');
        expect(beginnerQuestions).toBeInstanceOf(Array);
        expect(beginnerQuestions.every(q => q.difficulty === 'beginner')).toBe(true);
      });
    });
    
    describe('Level Assessment Results', () => {
      it('should create assessment results', async () => {
        const result = await storage.createLevelAssessmentResult({
          userId: testUserId,
          language: 'en',
          totalScore: 85,
          maxScore: 100,
          proficiencyLevel: 'B2',
          answers: {
            q1: { answer: 'went', correct: true },
            q2: { answer: 'have been', correct: true }
          },
          timeTaken: 1800 // 30 minutes in seconds
        });
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.proficiencyLevel).toBe('B2');
        expect(result.totalScore).toBe(85);
      });
      
      it('should get latest assessment result', async () => {
        // Create multiple results
        await storage.createLevelAssessmentResult({
          userId: testUserId,
          language: 'en',
          totalScore: 60,
          maxScore: 100,
          proficiencyLevel: 'A2',
          answers: {}
        });
        
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        
        await storage.createLevelAssessmentResult({
          userId: testUserId,
          language: 'en',
          totalScore: 85,
          maxScore: 100,
          proficiencyLevel: 'B2',
          answers: {}
        });
        
        const latest = await storage.getLatestAssessmentResult(testUserId, 'en');
        expect(latest).toBeDefined();
        expect(latest.proficiencyLevel).toBe('B2');
        expect(latest.totalScore).toBe(85);
      });
    });
    
    describe('Placement Tests', () => {
      it('should create a placement test', async () => {
        const test = await storage.createPlacementTest({
          title: 'English Placement Test',
          description: 'Comprehensive English level assessment',
          teacherId: testTeacherId,
          language: 'en',
          level: 'mixed',
          passingScore: 60,
          timeLimit: 60,
          maxAttempts: 2
        });
        
        expect(test).toBeDefined();
        expect(test.id).toBeDefined();
        expect(test.testType).toBe('placement');
        expect(test.title).toBe('English Placement Test');
      });
      
      it('should assign placement test to student', async () => {
        const test = await storage.createPlacementTest({
          title: 'Persian Placement Test',
          teacherId: testTeacherId,
          language: 'fa',
          level: 'mixed'
        });
        
        const attempt = await storage.assignPlacementTest(testUserId, test.id);
        expect(attempt).toBeDefined();
        expect(attempt.studentId).toBe(testUserId);
        expect(attempt.testId).toBe(test.id);
        expect(attempt.status).toBe('assigned');
      });
      
      it('should retrieve student placement results', async () => {
        const test = await storage.createPlacementTest({
          title: 'Arabic Placement Test',
          teacherId: testTeacherId,
          language: 'ar',
          level: 'mixed'
        });
        
        await storage.assignPlacementTest(testUserId, test.id);
        
        const results = await storage.getStudentPlacementResults(testUserId);
        expect(results).toBeInstanceOf(Array);
        expect(results.some(r => r.testTitle === 'Arabic Placement Test')).toBe(true);
      });
    });
  });
  
  describe('Cross-Table Integrations', () => {
    it('should create institute with departments and roles', async () => {
      // Create institute
      const institute = await storage.createInstitute({
        name: 'Complete Institute',
        code: `COMP-${Date.now()}`,
        email: 'complete@institute.com'
      });
      
      // Create departments for the institute
      const englishDept = await storage.createDepartment({
        instituteId: institute.id,
        name: 'English Department',
        headTeacherId: testTeacherId
      });
      
      const persianDept = await storage.createDepartment({
        instituteId: institute.id,
        name: 'Persian Department',
        headTeacherId: testTeacherId
      });
      
      // Create custom role for department heads
      const deptHeadRole = await storage.createCustomRole({
        name: `DeptHead-${institute.code}`,
        description: 'Department head for the institute',
        permissions: ['manage_teachers', 'approve_courses', 'view_reports']
      });
      
      // Verify the structure
      const departments = await storage.getDepartments(institute.id);
      expect(departments.length).toBe(2);
      expect(departments.some(d => d.name === 'English Department')).toBe(true);
      expect(departments.some(d => d.name === 'Persian Department')).toBe(true);
      
      const role = await storage.getCustomRoleById(deptHeadRole.id);
      expect(role).toBeDefined();
      expect(role.permissions).toContain('manage_teachers');
    });
    
    it('should track complete student journey with mentor and guardian', async () => {
      // Create parent guardian
      const guardian = await storage.createParentGuardian({
        studentId: testUserId,
        name: 'Parent Guardian',
        relationship: 'mother',
        phoneNumber: '+989121234567',
        email: 'parent@test.com',
        isPrimary: true,
        emergencyContact: true
      });
      
      // Assign mentor to student
      const mentorAssignment = await storage.createMentorAssignment({
        mentorId: testMentorId,
        studentId: testUserId,
        assignedBy: testTeacherId,
        status: 'active',
        goals: 'Improve overall language proficiency'
      });
      
      // Create mentoring session
      const session = await storage.createMentoringSession({
        assignmentId: mentorAssignment.id,
        scheduledDate: new Date(),
        duration: 45,
        type: 'assessment',
        topics: ['Initial assessment', 'Goal setting']
      });
      
      // Create teacher note about student
      const note = await storage.createStudentNote({
        studentId: testUserId,
        teacherId: testTeacherId,
        type: 'academic',
        title: 'Initial Assessment',
        content: 'Student shows potential, needs structured guidance',
        priority: 'normal',
        tags: ['assessment', 'new_student']
      });
      
      // Create placement test result
      const placementResult = await storage.createLevelAssessmentResult({
        userId: testUserId,
        language: 'en',
        totalScore: 75,
        maxScore: 100,
        proficiencyLevel: 'B1',
        answers: {},
        timeTaken: 2400
      });
      
      // Verify the complete student profile
      const guardians = await storage.getParentGuardians(testUserId);
      expect(guardians.length).toBeGreaterThan(0);
      expect(guardians[0].isPrimary).toBe(true);
      
      const assignments = await storage.getMentorAssignments(undefined, testUserId);
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments[0].status).toBe('active');
      
      const sessions = await storage.getMentoringSessions(undefined, testUserId);
      expect(sessions.length).toBeGreaterThan(0);
      
      const notes = await storage.getStudentNotes(testUserId);
      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0].type).toBe('academic');
      
      const assessmentResults = await storage.getLevelAssessmentResults(testUserId);
      expect(assessmentResults.length).toBeGreaterThan(0);
      expect(assessmentResults[0].proficiencyLevel).toBe('B1');
    });
  });
});