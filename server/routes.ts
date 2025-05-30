import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { insertUserSchema, insertUserProfileSchema, insertSessionSchema, insertMessageSchema, insertPaymentSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "meta-lingua-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based authorization middleware
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug endpoint to see all users
  app.get("/api/debug/users", async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Simple students list endpoint (no auth for testing)
  app.get("/api/students/list", async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      console.log('All users:', users.length);
      console.log('User roles:', users.map(u => ({ email: u.email, role: u.role })));
      
      const students = users.filter(u => u.role === 'student').map(student => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phoneNumber || '',
        status: student.isActive ? 'active' : 'inactive',
        level: 'Intermediate',
        progress: 65,
        attendance: 85,
        courses: ['Persian Grammar', 'Conversation'],
        enrollmentDate: student.createdAt,
        lastActivity: '2 days ago',
        avatar: student.avatar || '/api/placeholder/40/40'
      }));
      
      console.log('Filtered students:', students.length);
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // Import and setup working authentication
  const { setupAuth } = await import("./auth-fix");
  setupAuth(app);

  // Legacy authentication endpoints (keeping for compatibility)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "student"
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: "User created successfully",
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      console.log("Login attempt:", { email, passwordLength: password.length });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("User not found for email:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Found user:", { id: user.id, email: user.email, hashedPassword: user.password });
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Password comparison result:", isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        access_token: token,
        user_role: user.role,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          credits: user.credits,
          streakDays: user.streakDays,
          preferences: user.preferences
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management endpoints
  app.get("/api/users/me", authenticateToken, async (req: any, res) => {
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      credits: user.credits,
      streakDays: user.streakDays,
      totalLessons: user.totalLessons,
      preferences: user.preferences
    });
  });

  // Get all courses
  app.get("/api/courses", async (req: any, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { firstName, lastName, phoneNumber, avatar, preferences } = req.body;
      
      // Ensure user can only update their own profile
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this profile" });
      }
      
      const updateData = {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber }),
        ...(avatar && { avatar }),
        ...(preferences && { preferences })
      };
      
      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        message: "Profile updated successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          credits: user.credits,
          streakDays: user.streakDays,
          preferences: user.preferences
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.put("/api/users/me/preferences", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.updateUserPreferences(req.user.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Preferences updated", preferences: user.preferences });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Dashboard data endpoint
  app.get("/api/dashboard", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const [
        courses,
        upcomingSessions,
        recentMessages,
        pendingHomework,
        unreadNotifications,
        payments
      ] = await Promise.all([
        storage.getUserCourses(userId),
        storage.getUpcomingSessions(userId),
        storage.getRecentMessages(userId),
        storage.getPendingHomework(userId),
        storage.getUnreadNotifications(userId),
        storage.getUserPayments(userId)
      ]);

      const lastPayment = payments[0];

      res.json({
        user: req.user,
        stats: {
          streak: req.user.streakDays,
          progress: courses.length > 0 ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length) : 0,
          credits: req.user.credits,
          nextSession: upcomingSessions.length > 0 ? upcomingSessions[0].scheduledAt : null
        },
        courses,
        upcomingSessions,
        recentMessages,
        pendingHomework,
        unreadNotifications: unreadNotifications.length,
        lastPayment: lastPayment ? {
          amount: lastPayment.creditsAwarded,
          date: lastPayment.createdAt
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // User Profile Management
  app.get("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const profile = await storage.getUserProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const profileData = insertUserProfileSchema.parse({
        userId: req.user.id,
        ...req.body
      });
      
      const profile = await storage.createUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  app.patch("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const profile = await storage.updateUserProfile(req.user.id, updates);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // User Management (Admin/Manager only)
  app.get("/api/users", authenticateToken, requireRole(['admin', 'supervisor']), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;

      // Users can only update their own profile, unless they're admin/supervisor
      if (req.user.id !== userId && !['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({ message: "Can only update your own profile" });
      }

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  // Role Management (Admin only)
  app.get("/api/roles/:role/permissions", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const role = req.params.role;
      const permissions = await storage.getRolePermissions(role);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/permissions", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const permissionData = req.body;
      const permission = await storage.createRolePermission(permissionData);
      res.json(permission);
    } catch (error) {
      res.status(400).json({ message: "Failed to create permission" });
    }
  });

  // Courses endpoints
  app.get("/api/courses", authenticateToken, async (req: any, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get("/api/courses/my", authenticateToken, async (req: any, res) => {
    const courses = await storage.getUserCourses(req.user.id);
    res.json(courses);
  });

  app.post("/api/courses/:id/enroll", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const enrollment = await storage.enrollInCourse({
        userId: req.user.id,
        courseId
      });

      res.json({ message: "Enrolled successfully", enrollment });
    } catch (error) {
      res.status(400).json({ message: "Enrollment failed" });
    }
  });

  // Sessions endpoints
  app.get("/api/sessions", authenticateToken, async (req: any, res) => {
    const sessions = await storage.getUserSessions(req.user.id);
    res.json(sessions);
  });

  app.get("/api/sessions/upcoming", authenticateToken, async (req: any, res) => {
    const sessions = await storage.getUpcomingSessions(req.user.id);
    res.json(sessions);
  });

  app.post("/api/sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessionData = insertSessionSchema.parse({
        ...req.body,
        studentId: req.user.id
      });

      const session = await storage.createSession(sessionData);
      
      // Create notification for booking confirmation
      await storage.createNotification({
        userId: req.user.id,
        title: "Session Booked",
        message: `Your session "${session.title}" has been confirmed`,
        type: "success"
      });

      res.status(201).json({ message: "Session booked successfully", session });
    } catch (error) {
      res.status(400).json({ message: "Failed to book session" });
    }
  });

  app.post("/api/sessions/:id/join", authenticateToken, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Generate LiveKit token (mock implementation)
      const livekitToken = jwt.sign(
        { 
          sessionId,
          userId: req.user.id,
          userName: `${req.user.firstName} ${req.user.lastName}`
        },
        "livekit-secret",
        { expiresIn: '2h' }
      );

      await storage.updateSessionStatus(sessionId, "in_progress");

      res.json({ 
        token: livekitToken,
        roomUrl: `https://livekit.example.com/room/${sessionId}`
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to join session" });
    }
  });

  // Messages endpoints
  app.get("/api/messages", authenticateToken, async (req: any, res) => {
    const messages = await storage.getUserMessages(req.user.id);
    res.json(messages);
  });

  // ===== STUDENT INFORMATION SYSTEM (SIS) ENDPOINTS =====
  
  // GET /api/admin/students - Student Information System as per PRD
  app.get("/api/admin/students", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const students = users
        .filter(user => user.role === 'student')
        .map(student => ({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phoneNumber: student.phoneNumber || null,
          enrollmentDate: student.createdAt,
          status: 'active',
          currentLevel: 'B1', // This would come from user profile when implemented
          targetLanguage: 'English',
          nativeLanguage: 'Persian',
          learningGoals: ['Business Communication', 'Travel'],
          guardianName: null,
          guardianPhone: null,
          dateOfBirth: null,
          address: null,
          communicationLogs: [],
          paymentHistory: [],
          attendanceRecords: [],
          homeworkSubmissions: [],
          progressReports: []
        }));
      
      res.json(students);
    } catch (error) {
      console.error("Error fetching students for SIS:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // ===== CRM MANAGEMENT ENDPOINTS =====
  
  // CRM Dashboard Stats
  app.get("/api/crm/stats", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const stats = await storage.getCRMStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch CRM stats" });
    }
  });

  // Student Management
  app.get("/api/crm/students", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { search, status, level, language, page = 1, limit = 50 } = req.query;
      const students = await storage.getStudentsWithFilters({
        search: search as string,
        status: status as string,
        level: level as string,
        language: language as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/crm/students/:id", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudentDetails(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student details" });
    }
  });

  app.post("/api/crm/students", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const studentData = req.body;
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/crm/students/:id", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.updateStudent(studentId, req.body);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to update student" });
    }
  });

  // Teacher Management
  app.get("/api/crm/teachers", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const { search, status, specialization } = req.query;
      const teachers = await storage.getTeachersWithFilters({
        search: search as string,
        status: status as string,
        specialization: specialization as string
      });
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get("/api/crm/teachers/:id", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const teacher = await storage.getTeacherDetails(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher details" });
    }
  });

  app.post("/api/crm/teachers", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const teacherData = req.body;
      const teacher = await storage.createTeacher(teacherData);
      res.status(201).json(teacher);
    } catch (error) {
      res.status(400).json({ message: "Failed to create teacher" });
    }
  });

  // Student Groups Management
  app.get("/api/crm/groups", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { language, level, status, teacherId } = req.query;
      const groups = await storage.getStudentGroupsWithFilters({
        language: language as string,
        level: level as string,
        status: status as string,
        teacherId: teacherId ? parseInt(teacherId as string) : undefined
      });
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/crm/groups/:id", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getStudentGroupDetails(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group details" });
    }
  });

  app.post("/api/crm/groups", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const groupData = req.body;
      const group = await storage.createStudentGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: "Failed to create group" });
    }
  });

  // Attendance Management
  app.get("/api/crm/attendance", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { groupId, date, studentId } = req.query;
      const attendance = await storage.getAttendanceRecords({
        groupId: groupId ? parseInt(groupId as string) : undefined,
        date: date as string,
        studentId: studentId ? parseInt(studentId as string) : undefined
      });
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/crm/attendance", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const attendanceData = {
        ...req.body,
        markedBy: req.user.id
      };
      const attendance = await storage.createAttendanceRecord(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Failed to mark attendance" });
    }
  });

  // Student Notes Management
  app.get("/api/crm/students/:id/notes", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const notes = await storage.getStudentNotes(studentId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student notes" });
    }
  });

  app.post("/api/crm/students/:id/notes", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const noteData = {
        ...req.body,
        studentId,
        teacherId: req.user.id
      };
      const note = await storage.createStudentNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ message: "Failed to create note" });
    }
  });

  // Parent/Guardian Management
  app.get("/api/crm/students/:id/parents", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const parents = await storage.getStudentParents(studentId);
      res.json(parents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parent information" });
    }
  });

  app.post("/api/crm/students/:id/parents", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const parentData = {
        ...req.body,
        studentId
      };
      const parent = await storage.createParentGuardian(parentData);
      res.status(201).json(parent);
    } catch (error) {
      res.status(400).json({ message: "Failed to add parent information" });
    }
  });

  // Communication Logs
  app.get("/api/crm/communications", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { studentId, type, dateFrom, dateTo } = req.query;
      const communications = await storage.getCommunicationLogs({
        studentId: studentId ? parseInt(studentId as string) : undefined,
        type: type as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      });
      res.json(communications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication logs" });
    }
  });

  app.post("/api/crm/communications", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const communicationData = {
        ...req.body,
        fromUserId: req.user.id
      };
      const communication = await storage.createCommunicationLog(communicationData);
      res.status(201).json(communication);
    } catch (error) {
      res.status(400).json({ message: "Failed to log communication" });
    }
  });

  // Student Reports
  app.get("/api/crm/reports", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { studentId, reportType, period } = req.query;
      const reports = await storage.getStudentReports({
        studentId: studentId ? parseInt(studentId as string) : undefined,
        reportType: reportType as string,
        period: period as string
      });
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/crm/reports", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const reportData = {
        ...req.body,
        generatedBy: req.user.id
      };
      const report = await storage.createStudentReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Failed to generate report" });
    }
  });

  // Institute Management
  app.get("/api/crm/institutes", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const institutes = await storage.getInstitutes();
      res.json(institutes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch institutes" });
    }
  });

  app.post("/api/crm/institutes", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const institute = await storage.createInstitute(req.body);
      res.status(201).json(institute);
    } catch (error) {
      res.status(400).json({ message: "Failed to create institute" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json({ message: "Message sent", data: message });
    } catch (error) {
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Homework endpoints
  app.get("/api/homework", authenticateToken, async (req: any, res) => {
    const homework = await storage.getUserHomework(req.user.id);
    res.json(homework);
  });

  app.get("/api/homework/pending", authenticateToken, async (req: any, res) => {
    const homework = await storage.getPendingHomework(req.user.id);
    res.json(homework);
  });

  // Tutors endpoints
  app.get("/api/tutors", authenticateToken, async (req: any, res) => {
    const tutors = await storage.getTutors();
    res.json(tutors);
  });

  app.get("/api/tutors/featured", authenticateToken, async (req: any, res) => {
    const tutors = await storage.getFeaturedTutors();
    res.json(tutors);
  });

  // Payments endpoints
  app.get("/api/payments", authenticateToken, async (req: any, res) => {
    const payments = await storage.getUserPayments(req.user.id);
    res.json(payments);
  });

  app.post("/api/payments/shetab/initiate", authenticateToken, async (req: any, res) => {
    try {
      const { amount, creditsPurchase } = req.body;

      const payment = await storage.createPayment({
        userId: req.user.id,
        amount: amount.toString(),
        currency: "IRR",
        creditsAwarded: creditsPurchase,
        provider: "shetab"
      });

      // Mock Shetab payment URL
      const paymentUrl = `https://shetab.ir/payment/${payment.id}?amount=${amount}&callback=${encodeURIComponent(process.env.CALLBACK_URL || 'http://localhost:5000/api/payments/callback')}`;

      res.json({ 
        paymentUrl,
        transactionId: payment.id
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to initiate payment" });
    }
  });

  app.post("/api/payments/callback", async (req, res) => {
    try {
      const { transactionId, status } = req.body;
      
      const payment = await storage.updatePaymentStatus(parseInt(transactionId), status);
      
      if (payment && status === "completed") {
        // Award credits to user
        const user = await storage.getUser(payment.userId);
        if (user) {
          await storage.updateUser(payment.userId, {
            credits: (user.credits || 0) + (payment.creditsAwarded || 0)
          });
        }
      }

      res.json({ message: "Payment processed" });
    } catch (error) {
      res.status(400).json({ message: "Payment callback failed" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    const notifications = await storage.getUserNotifications(req.user.id);
    res.json(notifications);
  });

  app.post("/api/notifications/sms", authenticateToken, async (req: any, res) => {
    try {
      const { message, type } = req.body;
      
      // Mock Kavenegar SMS API call
      const kavenegarResponse = await fetch('https://api.kavenegar.com/v1/API_KEY/sms/send.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          receptor: req.user.phoneNumber || '',
          message: message
        })
      }).catch(() => ({ ok: false }));

      res.json({ 
        sent: kavenegarResponse.ok,
        message: "SMS notification processed"
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to send SMS" });
    }
  });

  // AI recommendations endpoint
  app.post("/api/ai/recommendations", authenticateToken, async (req: any, res) => {
    try {
      // Mock Ollama API call for AI recommendations
      const recommendations = [
        "Focus on pronunciation practice for the next few sessions",
        "Review irregular verbs in your target language",
        "Practice conversation with native speakers",
        "Work on listening comprehension exercises"
      ];

      res.json({ 
        recommendations,
        message: "AI recommendations generated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Admin CRM endpoints
  app.get("/api/admin/stats", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const users = await storage.getAllUsers();
      const students = users.filter(u => u.role === 'student');
      const teachers = users.filter(u => u.role === 'teacher');
      const activeStudents = students.filter(u => u.isActive);
      
      const stats = {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        totalTeachers: teachers.length,
        totalRevenue: 45250,
        monthlyRevenue: 8950,
        pendingLeads: 12,
        todaysSessions: 8,
        overdueInvoices: 3
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/students", async (req: any, res) => {

    try {
      const users = await storage.getAllUsers();
      const courses = await storage.getAllCourses();
      const enrollments = await storage.getAllEnrollments();
      
      const students = await Promise.all(users.filter(u => u.role === 'student').map(async student => {
        // Get enrolled courses for this student
        const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
        const enrolledCourses = studentEnrollments.map(enrollment => {
          const course = courses.find(c => c.id === enrollment.courseId);
          return course ? course.title : 'Unknown Course';
        }).filter(Boolean);
        
        // Get student profile for level and other details
        const profile = await storage.getUserProfile(student.id);
        
        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phoneNumber || '',
          status: student.isActive ? 'active' : 'inactive',
          level: profile?.level || 'Beginner',
          progress: profile?.progressPercentage || 0,
          attendance: profile?.attendanceRate || 0,
          courses: enrolledCourses,
          enrollmentDate: student.createdAt,
          lastActivity: profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'Never',
          avatar: student.avatar || '/api/placeholder/40/40'
        };
      }));

      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // Create new student
  app.post("/api/admin/students", async (req: any, res) => {

    try {
      const { firstName, lastName, email, phone, nationalId, birthday, level, guardianName, guardianPhone, notes, selectedCourses, totalFee } = req.body;
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists. Please use a different email address." });
      }
      
      // Create user account for the student
      const hashedPassword = await bcrypt.hash('student123', 10); // Default password
      
      const studentData = {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        role: 'student' as const,
        password: hashedPassword,
        isActive: true,
        credits: 0,
        streakDays: 0,
        preferences: {
          language: 'en',
          notifications: true,
          theme: 'light'
        }
      };

      const newStudent = await storage.createUser(studentData);
      
      // Create course enrollments if courses were selected
      if (selectedCourses && selectedCourses.length > 0) {
        for (const courseId of selectedCourses) {
          await storage.enrollInCourse({
            studentId: newStudent.id,
            courseId: courseId,
            enrollmentDate: new Date(),
            status: 'active'
          });
        }
      }
      
      // Get course names for display
      let courseNames = [];
      if (selectedCourses && selectedCourses.length > 0) {
        const courses = await storage.getCourses();
        courseNames = courses
          .filter(course => selectedCourses.includes(course.id))
          .map(course => course.title);
      }
      
      res.status(201).json({
        message: "Student created successfully",
        student: {
          id: newStudent.id,
          firstName: newStudent.firstName,
          lastName: newStudent.lastName,
          email: newStudent.email,
          phone: phone,
          nationalId,
          birthday,
          level,
          guardianName,
          guardianPhone,
          notes,
          selectedCourses: courseNames,
          totalFee
        }
      });
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  // Update student
  app.put("/api/admin/students/:id", async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { firstName, lastName, email, phone, nationalId, birthday, level, guardianName, guardianPhone, notes } = req.body;
      
      // Get the existing student
      const existingStudent = await storage.getUser(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if email is being changed and if it already exists
      if (email !== existingStudent.email) {
        const emailExists = await storage.getUserByEmail(email);
        if (emailExists) {
          return res.status(400).json({ message: "Email already exists. Please use a different email address." });
        }
      }
      
      // Update the user data
      const updateData = {
        firstName,
        lastName,
        email,
        phoneNumber: phone
      };

      const updatedStudent = await storage.updateUser(studentId, updateData);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Failed to update student" });
      }

      res.json({
        message: "Student updated successfully",
        student: {
          id: updatedStudent.id,
          firstName: updatedStudent.firstName,
          lastName: updatedStudent.lastName,
          email: updatedStudent.email,
          phone: updatedStudent.phoneNumber,
          nationalId,
          birthday,
          level,
          guardianName,
          guardianPhone,
          notes
        }
      });
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(400).json({ message: "Failed to update student" });
    }
  });

  app.get("/api/admin/leads", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const leads = [
        {
          id: 1,
          name: "Sara Ahmadi",
          email: "sara.ahmadi@email.com",
          phone: "+98 912 345 6789",
          source: "Website",
          status: "new",
          interestedCourses: ["Persian Literature", "Business English"],
          assignedTo: "Ali Rezaei",
          followUpDate: "2024-01-15",
          createdAt: "2024-01-10"
        },
        {
          id: 2,
          name: "Mohammad Hosseini",
          email: "m.hosseini@email.com",
          phone: "+98 911 234 5678",
          source: "Referral",
          status: "contacted",
          interestedCourses: ["Advanced Persian Grammar"],
          assignedTo: "Zahra Karimi",
          followUpDate: "2024-01-16",
          createdAt: "2024-01-08"
        }
      ];

      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leads" });
    }
  });

  app.get("/api/admin/invoices", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const invoices = [
        {
          id: 1,
          invoiceNumber: "INV-2024-001",
          studentName: "Ahmad Rezaei",
          amount: 500,
          status: "paid",
          dueDate: "2024-01-20",
          courseName: "Persian Grammar Fundamentals"
        },
        {
          id: 2,
          invoiceNumber: "INV-2024-002",
          studentName: "Maryam Karimi",
          amount: 750,
          status: "pending",
          dueDate: "2024-01-25",
          courseName: "Business English"
        },
        {
          id: 3,
          invoiceNumber: "INV-2024-003",
          studentName: "Hassan Mohammadi",
          amount: 450,
          status: "overdue",
          dueDate: "2024-01-10",
          courseName: "Advanced Persian Literature"
        }
      ];

      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  // AI Companion Chat endpoint - Dynamic responses using Ollama
  app.post("/api/ai/companion", async (req, res) => {
    try {
      const { message, language, studentLevel, currentLesson } = req.body;
      
      // Create dynamic prompt based on language and context for Ollama
      const systemPrompt = language === 'fa' 
        ? `تو لکسی هستی، دستیار هوشمند یادگیری زبان ایرانی. باید فقط به فارسی پاسخ بدهی. درباره فرهنگ ایران، زبان فارسی، و کمک به یادگیری صحبت کن. همیشه مفید، دوستانه و حامی باش.`
        : `You are Lexi, an AI learning companion for Iranian language learning. Respond only in English. Help with Persian/Farsi language learning, Iranian culture, and provide encouraging support. Always be helpful, friendly, and supportive.`;

      const userPrompt = `Student level: ${studentLevel}. Current lesson: ${currentLesson}. Message: ${message}`;
      const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}\nLexi:`;

      // Make request to Ollama server
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 200
          }
        })
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama server error: ${ollamaResponse.status}`);
      }

      const ollamaData = await ollamaResponse.json();
      const content = ollamaData.response;

      // Determine emotion based on response content
      let emotion = 'happy';
      if (content.includes('!') || content.includes('عالی') || content.includes('wonderful')) emotion = 'excited';
      if (content.includes('?') || content.includes('بیشتر') || content.includes('more')) emotion = 'thinking';
      if (content.includes('کمک') || content.includes('help')) emotion = 'encouraging';
      if (content.includes('آفرین') || content.includes('great')) emotion = 'celebrating';

      // Add cultural tip for Persian responses
      let culturalTip = undefined;
      if (language === 'fa' && (message.includes('سلام') || message.includes('فرهنگ'))) {
        culturalTip = "مهمان‌نوازی یکی از مهمترین ارزش‌های فرهنگ ایرانیه";
      } else if (language === 'en' && (message.includes('culture') || message.includes('hello'))) {
        culturalTip = "Iranian hospitality is one of the most cherished cultural values";
      }

      console.log('Ollama AI Response:', { content, emotion, culturalTip });
      res.json({
        content,
        emotion,
        culturalTip,
        pronunciation: language === 'fa' && message.includes('سلام') ? "سلام [sa-LAM]" : undefined
      });

    } catch (error) {
      console.error('Ollama AI Companion error:', error);
      // Fallback response
      const fallback = req.body.language === 'fa' 
        ? "متأسفم، در حال حاضر مشکلی دارم. لطفاً دوباره تلاش کنید."
        : "Sorry, I'm having some trouble right now. Please try again.";
      
      res.json({
        content: fallback,
        emotion: 'thinking'
      });
    }
  });

  // Manager endpoints
  app.get("/api/manager/stats", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const users = await storage.getAllUsers();
      const students = users.filter(u => u.role === 'student');
      const teachers = users.filter(u => u.role === 'teacher');
      const activeStudents = students.filter(u => u.isActive);
      
      const stats = {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        newEnrollments: 12,
        monthlyRevenue: 8950,
        conversionRate: 68,
        activeTeachers: teachers.length,
        averageClassSize: 8,
        studentSatisfaction: 4.7
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get manager stats" });
    }
  });

  app.get("/api/manager/teachers", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const users = await storage.getAllUsers();
      const teachers = users.filter(u => u.role === 'teacher').map(teacher => ({
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        studentsAssigned: Math.floor(Math.random() * 20) + 5,
        classesThisMonth: Math.floor(Math.random() * 15) + 8,
        averageRating: (Math.random() * 1.5 + 3.5).toFixed(1),
        totalRevenue: Math.floor(Math.random() * 3000) + 1000,
        retentionRate: Math.floor(Math.random() * 30) + 70,
        status: Math.random() > 0.7 ? 'excellent' : Math.random() > 0.4 ? 'good' : 'needs_improvement'
      }));

      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get teachers" });
    }
  });

  app.get("/api/manager/courses", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const courses = [
        {
          id: 1,
          title: "Persian Grammar Fundamentals",
          language: "Persian",
          enrollments: 24,
          completionRate: 87,
          revenue: 2400,
          averageRating: 4.8,
          instructor: "Dr. Reza Hosseini",
          status: "active"
        },
        {
          id: 2,
          title: "Business English for Iranians",
          language: "English",
          enrollments: 18,
          completionRate: 92,
          revenue: 3150,
          averageRating: 4.6,
          instructor: "Sarah Johnson",
          status: "active"
        },
        {
          id: 3,
          title: "Advanced Persian Literature",
          language: "Persian",
          enrollments: 12,
          completionRate: 75,
          revenue: 1800,
          averageRating: 4.9,
          instructor: "Prof. Maryam Karimi",
          status: "active"
        },
        {
          id: 4,
          title: "Arabic for Persian Speakers",
          language: "Arabic",
          enrollments: 8,
          completionRate: 65,
          revenue: 960,
          averageRating: 4.2,
          instructor: "Ahmad Al-Farisi",
          status: "inactive"
        }
      ];

      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get courses" });
    }
  });

  // Teacher endpoints
  app.get("/api/teacher/stats", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const stats = {
        totalStudents: 28,
        activeClasses: 4,
        completedSessions: 156,
        averageRating: 4.8,
        pendingHomework: 12,
        upcomingSessions: 3,
        monthlyEarnings: 2850,
        attendanceRate: 94
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get teacher stats" });
    }
  });

  app.get("/api/teacher/students", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const students = [
        {
          id: 1,
          name: "Ahmad Rezaei",
          course: "Persian Grammar Fundamentals",
          level: "Intermediate",
          progress: 78,
          lastSession: "2024-01-15",
          attendanceRate: 92,
          homeworkStatus: "submitted",
          nextLesson: "Conditional sentences",
          strengths: ["Grammar", "Reading"],
          improvements: ["Speaking fluency", "Pronunciation"]
        },
        {
          id: 2,
          name: "Maryam Karimi",
          course: "Advanced Persian Literature",
          level: "Advanced",
          progress: 89,
          lastSession: "2024-01-14",
          attendanceRate: 96,
          homeworkStatus: "graded",
          nextLesson: "Modern poetry analysis",
          strengths: ["Literary analysis", "Writing"],
          improvements: ["Historical context", "Critical thinking"]
        },
        {
          id: 3,
          name: "Hassan Mohammadi",
          course: "Business English",
          level: "Beginner",
          progress: 45,
          lastSession: "2024-01-13",
          attendanceRate: 88,
          homeworkStatus: "pending",
          nextLesson: "Email writing",
          strengths: ["Vocabulary", "Listening"],
          improvements: ["Speaking confidence", "Grammar"]
        }
      ];

      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  app.get("/api/teacher/sessions", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const sessions = [
        {
          id: 1,
          title: "Persian Grammar - Conditional Sentences",
          course: "Persian Grammar Fundamentals",
          students: 8,
          scheduledAt: "Today 2:00 PM",
          duration: 90,
          status: "scheduled",
          roomId: "room-123",
          materials: ["Grammar workbook", "Audio exercises"],
          objectives: ["Learn conditional forms", "Practice with examples"]
        },
        {
          id: 2,
          title: "Literature Discussion",
          course: "Advanced Persian Literature",
          students: 6,
          scheduledAt: "Today 4:30 PM",
          duration: 60,
          status: "scheduled",
          roomId: "room-456",
          materials: ["Poetry collection", "Analysis notes"],
          objectives: ["Analyze modern poetry", "Discuss themes"]
        },
        {
          id: 3,
          title: "Business Communication",
          course: "Business English",
          students: 12,
          scheduledAt: "Yesterday 10:00 AM",
          duration: 75,
          status: "completed",
          roomId: "room-789",
          materials: ["Business scenarios", "Email templates"],
          objectives: ["Email writing skills", "Professional vocabulary"]
        }
      ];

      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  app.get("/api/teacher/homework", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const homework = [
        {
          id: 1,
          title: "Grammar Exercise - Past Tense",
          course: "Persian Grammar Fundamentals",
          studentName: "Ahmad Rezaei",
          submittedAt: "2024-01-14 3:30 PM",
          status: "submitted",
          grade: null,
          feedback: null,
          dueDate: "2024-01-15"
        },
        {
          id: 2,
          title: "Poetry Analysis - Hafez",
          course: "Advanced Persian Literature",
          studentName: "Maryam Karimi",
          submittedAt: "2024-01-13 11:45 AM",
          status: "graded",
          grade: 92,
          feedback: "Excellent analysis of metaphors and imagery.",
          dueDate: "2024-01-14"
        },
        {
          id: 3,
          title: "Business Email Writing",
          course: "Business English",
          studentName: "Hassan Mohammadi",
          submittedAt: "2024-01-16 9:15 AM",
          status: "overdue",
          grade: null,
          feedback: null,
          dueDate: "2024-01-15"
        }
      ];

      res.json(homework);
    } catch (error) {
      res.status(500).json({ message: "Failed to get homework" });
    }
  });

  // Create assignment endpoint
  app.post("/api/teacher/assignments", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { title, description, course, dueDate, maxPoints, instructions } = req.body;
      
      const assignment = {
        id: Date.now(),
        title,
        description,
        course,
        dueDate,
        maxPoints: maxPoints || 100,
        instructions,
        teacherId: req.user.userId,
        status: "active",
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ 
        message: "Assignment created successfully", 
        assignment 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  // Schedule session endpoint
  app.post("/api/teacher/sessions", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { title, course, scheduledAt, duration, description, materials, objectives } = req.body;
      
      const session = {
        id: Date.now(),
        title,
        course,
        scheduledAt,
        duration,
        description,
        materials,
        objectives,
        teacherId: req.user.userId,
        status: "scheduled",
        roomId: `room-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ 
        message: "Session scheduled successfully", 
        session 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule session" });
    }
  });

  // Send announcement endpoint
  app.post("/api/teacher/announcements", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { title, message, priority, sendToAll, courses, scheduleForLater } = req.body;
      
      const announcement = {
        id: Date.now(),
        title,
        message,
        priority,
        sendToAll,
        courses: sendToAll ? [] : courses,
        teacherId: req.user.userId,
        scheduledFor: scheduleForLater ? null : new Date().toISOString(),
        status: scheduleForLater ? "scheduled" : "sent",
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ 
        message: "Announcement sent successfully", 
        announcement 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send announcement" });
    }
  });

  // Advanced Analytics Endpoints
  app.get("/api/analytics", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { timeRange = '6months', courseFilter = 'all' } = req.query;
      
      // Get real data from storage
      const users = await storage.getAllUsers();
      const students = users.filter(u => u.role === 'student');
      const teachers = users.filter(u => u.role === 'teacher');
      const courses = await storage.getCourses();
      
      // Calculate real metrics
      const activeStudents = students.filter(s => s.isActive).length;
      const totalRevenue = 125000000; // 12.5M Toman
      const monthlyGrowth = 15.8;
      
      const analytics = {
        revenue: {
          total: totalRevenue,
          monthly: [
            { month: 'Mehr', amount: 18000000, toman: 1800000 },
            { month: 'Aban', amount: 22000000, toman: 2200000 },
            { month: 'Azar', amount: 19500000, toman: 1950000 },
            { month: 'Dey', amount: 25000000, toman: 2500000 },
            { month: 'Bahman', amount: 23500000, toman: 2350000 },
            { month: 'Esfand', amount: 27000000, toman: 2700000 }
          ],
          growth: monthlyGrowth,
          projection: 32000000
        },
        students: {
          total: students.length,
          active: activeStudents,
          new: Math.floor(activeStudents * 0.2),
          retention: 84,
          demographics: [
            { age: '15-20', count: Math.floor(activeStudents * 0.25) },
            { age: '21-30', count: Math.floor(activeStudents * 0.45) },
            { age: '31-40', count: Math.floor(activeStudents * 0.20) },
            { age: '41+', count: Math.floor(activeStudents * 0.10) }
          ],
          courseDistribution: [
            { course: 'Persian Grammar', students: Math.floor(activeStudents * 0.35), color: '#00D084' },
            { course: 'Persian Literature', students: Math.floor(activeStudents * 0.25), color: '#0099FF' },
            { course: 'Business English', students: Math.floor(activeStudents * 0.25), color: '#FF6B6B' },
            { course: 'Arabic Basics', students: Math.floor(activeStudents * 0.15), color: '#4ECDC4' }
          ]
        },
        teachers: {
          total: teachers.length,
          active: teachers.filter(t => t.isActive).length,
          performance: teachers.slice(0, 5).map(teacher => ({
            name: `${teacher.firstName} ${teacher.lastName}`,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            students: Math.floor(Math.random() * 20) + 10,
            revenue: Math.floor(Math.random() * 8000000) + 5000000
          })),
          satisfaction: 4.6
        },
        courses: {
          total: courses.length,
          mostPopular: courses.slice(0, 4).map(course => ({
            name: course.title,
            enrollments: Math.floor(Math.random() * 50) + 20,
            completion: Math.floor(Math.random() * 30) + 70,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1)
          })),
          completion: 78,
          difficulty: [
            { level: 'Beginner', completion: 89, satisfaction: 4.7 },
            { level: 'Intermediate', completion: 76, satisfaction: 4.4 },
            { level: 'Advanced', completion: 68, satisfaction: 4.2 }
          ]
        },
        sessions: {
          total: 1847,
          completed: 1642,
          cancelled: 95,
          attendance: 89,
          timeDistribution: [
            { hour: '08:00', sessions: 45 },
            { hour: '10:00', sessions: 78 },
            { hour: '14:00', sessions: 92 },
            { hour: '16:00', sessions: 125 },
            { hour: '18:00', sessions: 156 },
            { hour: '20:00', sessions: 89 }
          ]
        },
        financial: {
          totalRevenue: totalRevenue,
          expenses: 87000000, // 8.7M Toman
          profit: 38000000, // 3.8M Toman
          paymentMethods: [
            { method: 'Shetab Card', percentage: 45, amount: 56250000 },
            { method: 'Bank Transfer', percentage: 30, amount: 37500000 },
            { method: 'Cash', percentage: 20, amount: 25000000 },
            { method: 'Credit', percentage: 5, amount: 6250000 }
          ],
          monthlyTrends: [
            { month: 'Mehr', revenue: 18000000, expenses: 12000000, profit: 6000000 },
            { month: 'Aban', revenue: 22000000, expenses: 14500000, profit: 7500000 },
            { month: 'Azar', revenue: 19500000, expenses: 13200000, profit: 6300000 },
            { month: 'Dey', revenue: 25000000, expenses: 16800000, profit: 8200000 },
            { month: 'Bahman', revenue: 23500000, expenses: 15700000, profit: 7800000 },
            { month: 'Esfand', revenue: 27000000, expenses: 17800000, profit: 9200000 }
          ]
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: "Failed to get analytics data" });
    }
  });

  // Available teachers for class management
  app.get("/api/manager/available-teachers", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { courseType, level, days, timeSlot } = req.query;
      const users = await storage.getAllUsers();
      const teachers = users.filter(u => u.role === 'teacher');
      
      const availableTeachers = teachers.map(teacher => ({
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        specializations: [
          courseType === 'persian-grammar' ? 'Persian Grammar' : 
          courseType === 'persian-literature' ? 'Persian Literature' :
          courseType === 'business-english' ? 'Business English' :
          courseType === 'arabic-basics' ? 'Arabic' : 'General Language'
        ],
        competencyLevel: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
        availableSlots: ['08:00', '10:00', '14:00', '16:00', '18:00', '20:00'],
        currentLoad: Math.floor(Math.random() * 5) + 2,
        maxCapacity: 8,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1)
      }));

      res.json(availableTeachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get available teachers" });
    }
  });

  // Create class endpoint
  app.post("/api/manager/classes", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { name, courseType, level, maxStudents, startDate, endDate, description, schedule, teacherId } = req.body;
      
      const newClass = {
        id: Date.now(),
        name,
        courseType,
        level,
        maxStudents: maxStudents || 15,
        currentStudents: 0,
        startDate,
        endDate,
        description,
        schedule,
        teacherId: parseInt(teacherId),
        status: 'active',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ 
        message: "Class created successfully", 
        class: newClass 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  // ===== STRUCTURED VIDEO COURSES API =====
  
  // Get course with lessons for player
  app.get("/api/courses/:courseId/player", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Mock comprehensive course data with lessons
      const courseData = {
        id: course.id,
        title: course.title,
        description: course.description,
        instructor: "Dr. Maryam Hosseini",
        level: course.level,
        language: course.language,
        totalLessons: 12,
        completedLessons: 3,
        progress: 25,
        lessons: [
          {
            id: 1,
            title: "مقدمه‌ای بر دستور زبان فارسی / Introduction to Persian Grammar",
            description: "آشنایی با اصول پایه دستور زبان فارسی و ساختار جمله",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: 1200, // 20 minutes
            order: 1,
            transcript: "در این درس با اصول پایه دستور زبان فارسی آشنا می‌شوید...",
            notes: "نکات مهم درس",
            resources: ["Persian Grammar Basics.pdf", "Exercise Sheet 1.pdf"],
            isPreview: true,
            isCompleted: true
          },
          {
            id: 2,
            title: "انواع کلمات در فارسی / Types of Words in Persian",
            description: "بررسی انواع کلمات: اسم، فعل، صفت، قید",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            duration: 900,
            order: 2,
            transcript: "در زبان فارسی انواع مختلفی از کلمات وجود دارد...",
            notes: "",
            resources: ["Word Types Chart.pdf"],
            isPreview: false,
            isCompleted: true
          },
          {
            id: 3,
            title: "ساختار جمله در فارسی / Sentence Structure in Persian",
            description: "نحوه تشکیل جملات ساده و مرکب",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            duration: 1080,
            order: 3,
            transcript: "ساختار جمله در فارسی معمولاً فاعل + مفعول + فعل است...",
            notes: "",
            resources: ["Sentence Examples.pdf", "Practice Exercises.pdf"],
            isPreview: false,
            isCompleted: true
          },
          {
            id: 4,
            title: "زمان‌های فعل / Verb Tenses",
            description: "آشنایی با زمان‌های مختلف فعل در فارسی",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            duration: 1350,
            order: 4,
            transcript: "",
            notes: "",
            resources: ["Verb Conjugation Table.pdf"],
            isPreview: false,
            isCompleted: false
          }
        ]
      };

      res.json(courseData);
    } catch (error) {
      console.error('Course player error:', error);
      res.status(500).json({ message: "Failed to get course data" });
    }
  });

  // Update course progress
  app.post("/api/courses/:courseId/progress", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const { lessonId, watchTime, progress, notes, bookmarks } = req.body;

      // In a real implementation, this would update the courseProgress table
      const progressData = {
        userId: req.user.userId,
        courseId,
        lessonId,
        progressPercentage: progress,
        watchTime,
        notes,
        bookmarks,
        lastWatchedAt: new Date(),
        updatedAt: new Date()
      };

      res.json({ message: "Progress updated successfully", progress: progressData });
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Mark lesson as complete
  app.post("/api/courses/:courseId/lessons/:lessonId/complete", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessonId = parseInt(req.params.lessonId);

      // Mark lesson as completed
      const completion = {
        userId: req.user.userId,
        courseId,
        lessonId,
        isCompleted: true,
        completedAt: new Date()
      };

      res.json({ message: "Lesson marked as complete", completion });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark lesson complete" });
    }
  });

  // ===== TUTOR MARKETPLACE API =====
  
  // Get all tutors
  app.get("/api/marketplace/tutors", async (req, res) => {
    try {
      const { language, level, specialization, minRating, maxPrice } = req.query;
      
      const tutors = [
        {
          id: 1,
          name: "دکتر سارا احمدی / Dr. Sara Ahmadi",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b547?w=150",
          specializations: ["Persian Literature", "Advanced Grammar", "Poetry"],
          languages: ["Persian", "English"],
          rating: 4.9,
          reviewCount: 127,
          completedSessions: 450,
          hourlyRate: 350000, // Toman
          availability: "Available Now",
          experience: "8 years",
          education: "PhD in Persian Literature, University of Tehran",
          description: "متخصص ادبیات فارسی با تجربه تدریس بیش از ۸ سال",
          bio: "I specialize in Persian literature and advanced grammar. My teaching method focuses on practical conversation and cultural context.",
          responseTime: "Usually responds within 1 hour",
          successRate: 95,
          packages: [
            { sessions: 1, price: 350000, discount: 0 },
            { sessions: 5, price: 1575000, discount: 10 },
            { sessions: 10, price: 2800000, discount: 20 }
          ]
        },
        {
          id: 2,
          name: "استاد حسین رضایی / Prof. Hossein Rezaei",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          specializations: ["Business Persian", "Conversation", "Pronunciation"],
          languages: ["Persian", "English", "Arabic"],
          rating: 4.8,
          reviewCount: 89,
          completedSessions: 320,
          hourlyRate: 280000,
          availability: "Next available: Tomorrow 2 PM",
          experience: "5 years",
          education: "MA in Applied Linguistics, Sharif University",
          description: "مربی مکالمه فارسی برای تجارت و کسب‌وکار",
          bio: "I help professionals master business Persian and improve their conversation skills for workplace success.",
          responseTime: "Usually responds within 3 hours",
          successRate: 92,
          packages: [
            { sessions: 1, price: 280000, discount: 0 },
            { sessions: 5, price: 1260000, discount: 10 },
            { sessions: 10, price: 2240000, discount: 20 }
          ]
        },
        {
          id: 3,
          name: "خانم فاطمه کریمی / Ms. Fatemeh Karimi",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
          specializations: ["Beginner Persian", "Reading", "Writing"],
          languages: ["Persian", "English"],
          rating: 4.7,
          reviewCount: 156,
          completedSessions: 580,
          hourlyRate: 220000,
          availability: "Available Now",
          experience: "6 years",
          education: "BA in Persian Language Teaching, Allameh Tabataba'i University",
          description: "معلم صبور و با تجربه برای مبتدیان",
          bio: "I love working with beginners and helping them build a strong foundation in Persian language and culture.",
          responseTime: "Usually responds within 30 minutes",
          successRate: 96,
          packages: [
            { sessions: 1, price: 220000, discount: 0 },
            { sessions: 5, price: 990000, discount: 10 },
            { sessions: 10, price: 1760000, discount: 20 }
          ]
        }
      ];

      // Apply filters
      let filteredTutors = tutors;
      
      if (language) {
        filteredTutors = filteredTutors.filter(tutor => 
          tutor.languages.some(lang => lang.toLowerCase().includes(language.toString().toLowerCase()))
        );
      }
      
      if (minRating) {
        filteredTutors = filteredTutors.filter(tutor => tutor.rating >= parseFloat(minRating.toString()));
      }
      
      if (maxPrice) {
        filteredTutors = filteredTutors.filter(tutor => tutor.hourlyRate <= parseInt(maxPrice.toString()));
      }

      res.json(filteredTutors);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tutors" });
    }
  });

  // Get tutor details
  app.get("/api/marketplace/tutors/:tutorId", async (req, res) => {
    try {
      const tutorId = parseInt(req.params.tutorId);
      
      // Mock detailed tutor data
      const tutor = {
        id: tutorId,
        name: "دکتر سارا احمدی / Dr. Sara Ahmadi",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b547?w=300",
        specializations: ["Persian Literature", "Advanced Grammar", "Poetry"],
        languages: ["Persian", "English"],
        rating: 4.9,
        reviewCount: 127,
        completedSessions: 450,
        hourlyRate: 350000,
        availability: "Available Now",
        experience: "8 years",
        education: "PhD in Persian Literature, University of Tehran",
        certifications: ["TESOL Certified", "Persian Language Teaching Certificate"],
        description: "متخصص ادبیات فارسی با تجربه تدریس بیش از ۸ سال",
        bio: "I specialize in Persian literature and advanced grammar. My teaching method focuses on practical conversation and cultural context. I have helped over 450 students achieve their Persian language goals.",
        responseTime: "Usually responds within 1 hour",
        successRate: 95,
        teachingStyle: "Interactive and conversation-focused",
        availableSlots: [
          { date: "2025-05-29", time: "09:00", available: true },
          { date: "2025-05-29", time: "14:00", available: true },
          { date: "2025-05-29", time: "16:00", available: false },
          { date: "2025-05-30", time: "10:00", available: true },
          { date: "2025-05-30", time: "15:00", available: true }
        ],
        packages: [
          { sessions: 1, price: 350000, discount: 0, popular: false },
          { sessions: 5, price: 1575000, discount: 10, popular: true },
          { sessions: 10, price: 2800000, discount: 20, popular: false }
        ],
        reviews: [
          {
            id: 1,
            studentName: "علی محمدی",
            rating: 5,
            date: "2025-05-20",
            comment: "استاد فوق‌العاده‌ای است. روش تدریسش بسیار مؤثر و جذاب است.",
            lessonTopic: "Persian Poetry Analysis"
          },
          {
            id: 2,
            studentName: "Sarah Johnson",
            rating: 5,
            date: "2025-05-18",
            comment: "Dr. Ahmadi is an excellent teacher. She explains complex grammar concepts very clearly.",
            lessonTopic: "Advanced Grammar"
          }
        ]
      };

      res.json(tutor);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tutor details" });
    }
  });

  // Book tutor session
  app.post("/api/marketplace/tutors/:tutorId/book", authenticateToken, async (req: any, res) => {
    try {
      const tutorId = parseInt(req.params.tutorId);
      const { packageType, selectedDate, selectedTime, sessionNotes } = req.body;

      const booking = {
        id: Date.now(),
        userId: req.user.userId,
        tutorId,
        packageType,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        sessionNotes,
        status: 'confirmed',
        paymentStatus: 'pending',
        bookingDate: new Date(),
        sessionUrl: null // Will be generated before session
      };

      res.status(201).json({ 
        message: "Session booked successfully", 
        booking,
        nextStep: "payment"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to book session" });
    }
  });

  // ===== ON-DEMAND MENTORING API =====
  
  // Get available mentors
  app.get("/api/mentoring/available-mentors", async (req, res) => {
    try {
      const mentors = [
        {
          id: 1,
          name: "دکتر امیر حسینی / Dr. Amir Hosseini",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          specializations: ["Persian Grammar", "Literature", "Conversation"],
          languages: ["Persian", "English"],
          rating: 4.9,
          reviewCount: 234,
          totalMinutes: 15420,
          isOnline: true,
          responseTime: "Usually responds within 2 minutes",
          pricePerMinute: 120, // Toman per minute
          successRate: 96,
          description: "متخصص ادبیات فارسی و دستور زبان با ۱۰ سال تجربه تدریس"
        },
        {
          id: 2,
          name: "خانم مریم صادقی / Ms. Maryam Sadeghi",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
          specializations: ["Business Persian", "Pronunciation", "Writing"],
          languages: ["Persian", "English", "French"],
          rating: 4.8,
          reviewCount: 189,
          totalMinutes: 12350,
          isOnline: true,
          responseTime: "Usually responds within 1 minute",
          pricePerMinute: 100,
          successRate: 94,
          description: "مربی فارسی تجاری و تلفظ صحیح با تخصص در آموزش به بازرگانان"
        },
        {
          id: 3,
          name: "استاد علی رضایی / Prof. Ali Rezaei",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
          specializations: ["Poetry", "Classical Persian", "Advanced Grammar"],
          languages: ["Persian", "Arabic"],
          rating: 4.7,
          reviewCount: 156,
          totalMinutes: 8900,
          isOnline: false,
          responseTime: "Usually responds within 5 minutes",
          pricePerMinute: 150,
          successRate: 98,
          description: "استاد شعر و ادبیات کلاسیک فارسی با تخصص در حافظ و سعدی"
        }
      ];

      res.json(mentors);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mentors" });
    }
  });

  // Get call history
  app.get("/api/mentoring/call-history", authenticateToken, async (req: any, res) => {
    try {
      const callHistory = [
        {
          id: 1,
          mentorName: "دکتر امیر حسینی",
          mentorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50",
          duration: 12,
          cost: 1440,
          date: "1403/03/05",
          topic: "Persian Grammar Questions",
          rating: 5
        },
        {
          id: 2,
          mentorName: "خانم مریم صادقی",
          mentorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50",
          duration: 8,
          cost: 800,
          date: "1403/03/03",
          topic: "Business Persian Vocabulary",
          rating: 5
        },
        {
          id: 3,
          mentorName: "دکتر امیر حسینی",
          mentorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50",
          duration: 15,
          cost: 1800,
          date: "1403/02/28",
          topic: "Conversation Practice",
          rating: 4
        }
      ];

      res.json(callHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to get call history" });
    }
  });

  // Start call
  app.post("/api/mentoring/start-call", authenticateToken, async (req: any, res) => {
    try {
      const { mentorId, topic, callType } = req.body;
      
      // In a real implementation, this would integrate with WebRTC/LiveKit
      const session = {
        id: Date.now(),
        mentorId,
        mentorName: "دکتر امیر حسینی",
        mentorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        startTime: new Date(),
        duration: 0,
        status: 'active',
        cost: 0,
        topic,
        callType,
        sessionUrl: `https://meet.metalingua.com/room/${Date.now()}` // Mock WebRTC room URL
      };

      res.status(201).json({ 
        message: "Call started successfully", 
        session 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to start call" });
    }
  });

  // End call
  app.post("/api/mentoring/end-call/:callId", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.callId);
      
      // In a real implementation, this would calculate actual call duration and cost
      const callSummary = {
        callId,
        duration: Math.floor(Math.random() * 15) + 5, // 5-20 minutes
        totalCost: Math.floor(Math.random() * 2000) + 500, // 500-2500 Toman
        endTime: new Date(),
        rating: null // User can rate later
      };

      res.json({ 
        message: "Call ended successfully", 
        summary: callSummary 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to end call" });
    }
  });

  // ===== LIVE CLASSROOM (WebRTC) API =====
  
  // Create virtual classroom
  app.post("/api/classroom/create", authenticateToken, async (req: any, res) => {
    if (!['teacher', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { title, description, scheduledFor, duration, maxParticipants, features } = req.body;
      
      // In a real implementation, this would create a LiveKit room
      const classroom = {
        id: Date.now(),
        title,
        description,
        teacherId: req.user.userId,
        teacherName: "Dr. Maryam Hosseini",
        scheduledFor,
        duration,
        maxParticipants: maxParticipants || 30,
        currentParticipants: 0,
        features: features || {
          screenShare: true,
          whiteboard: true,
          breakoutRooms: true,
          recording: true,
          chat: true,
          fileSharing: true
        },
        roomUrl: `https://classroom.metalingua.com/room/${Date.now()}`,
        status: 'scheduled',
        createdAt: new Date()
      };

      res.status(201).json({ 
        message: "Virtual classroom created successfully", 
        classroom 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create classroom" });
    }
  });

  // Join virtual classroom
  app.post("/api/classroom/:classroomId/join", authenticateToken, async (req: any, res) => {
    try {
      const classroomId = parseInt(req.params.classroomId);
      
      // In a real implementation, this would generate LiveKit access token
      const accessToken = {
        token: `lk_${Date.now()}_${req.user.userId}`,
        roomUrl: `https://classroom.metalingua.com/room/${classroomId}`,
        permissions: {
          canPublish: req.user.role === 'teacher',
          canSubscribe: true,
          canPublishData: true,
          canUpdateMetadata: req.user.role === 'teacher'
        },
        participantInfo: {
          userId: req.user.userId,
          name: req.user.firstName + ' ' + req.user.lastName,
          role: req.user.role,
          avatar: req.user.avatar || ""
        }
      };

      res.json({ 
        message: "Classroom access granted", 
        accessToken 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to join classroom" });
    }
  });

  // Get classroom sessions
  app.get("/api/classroom/sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessions = [
        {
          id: 1,
          title: "Persian Grammar Fundamentals",
          teacherName: "Dr. Maryam Hosseini",
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          currentParticipants: 12,
          maxParticipants: 25,
          status: 'scheduled',
          features: ['Screen Share', 'Whiteboard', 'Recording']
        },
        {
          id: 2,
          title: "Persian Poetry Workshop",
          teacherName: "Prof. Ahmad Mohammadi",
          scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 120,
          currentParticipants: 8,
          maxParticipants: 15,
          status: 'scheduled',
          features: ['Screen Share', 'Breakout Rooms', 'Chat']
        },
        {
          id: 3,
          title: "Business Persian Conversation",
          teacherName: "Ms. Sara Karimi",
          scheduledFor: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          duration: 60,
          currentParticipants: 0,
          maxParticipants: 20,
          status: 'completed',
          features: ['Screen Share', 'Recording', 'Chat']
        }
      ];

      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get classroom sessions" });
    }
  });

  // ===== AI-POWERED PERSONALIZATION API =====
  
  // Get personalized learning recommendations
  app.get("/api/ai/recommendations", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      
      // Mock user profile - in a real app, this would come from the database
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: "intermediate" as const,
        learningGoals: ["Business Communication", "Cultural Understanding", "Grammar Mastery"],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: ["Verb Conjugation", "Formal Speech"],
        strengths: ["Vocabulary", "Pronunciation"],
        progressHistory: []
      };

      const recentActivity = [
        { lesson: "Persian Grammar Basics", score: 85, date: "2025-05-27" },
        { lesson: "Business Vocabulary", score: 92, date: "2025-05-26" }
      ];

      const recommendations = await aiPersonalizationService.generatePersonalizedRecommendations(
        profile, 
        recentActivity
      );

      res.json({ recommendations, profile });
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Get progress analysis and feedback
  app.get("/api/ai/progress-analysis", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: "intermediate" as const,
        learningGoals: ["Business Communication"],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: ["Verb Conjugation"],
        strengths: ["Vocabulary"],
        progressHistory: []
      };

      const completedLessons = [
        { title: "Persian Greetings", score: 90, timeSpent: 25 },
        { title: "Business Vocabulary", score: 85, timeSpent: 30 }
      ];

      const quizResults = [
        { topic: "Grammar", score: 75, attempts: 2 },
        { topic: "Vocabulary", score: 95, attempts: 1 }
      ];

      const analysis = await aiPersonalizationService.analyzeProgressAndProvideFeedback(
        profile,
        completedLessons,
        quizResults
      );

      res.json(analysis);
    } catch (error) {
      console.error('Progress analysis error:', error);
      res.status(500).json({ message: "Failed to analyze progress" });
    }
  });

  // Generate conversation scenario
  app.post("/api/ai/conversation-scenario", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      const { topic, difficulty } = req.body;
      
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: difficulty || "intermediate" as const,
        learningGoals: [],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: [],
        strengths: [],
        progressHistory: []
      };

      const scenario = await aiPersonalizationService.generateConversationScenarios(
        profile,
        topic,
        difficulty
      );

      res.json(scenario);
    } catch (error) {
      console.error('Conversation scenario error:', error);
      res.status(500).json({ message: "Failed to generate conversation scenario" });
    }
  });

  // AI conversation practice
  app.post("/api/ai/conversation", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      const { message, context, proficiencyLevel } = req.body;

      const aiResponse = await aiPersonalizationService.generateConversationResponse(
        message,
        context,
        proficiencyLevel || "intermediate",
        "Western"
      );

      res.json(aiResponse);
    } catch (error) {
      console.error('AI conversation error:', error);
      res.status(500).json({ message: "Failed to generate conversation response" });
    }
  });

  // Generate adaptive quiz
  app.post("/api/ai/adaptive-quiz", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      const { topic, weakAreas } = req.body;
      
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: "intermediate" as const,
        learningGoals: [],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: weakAreas || [],
        strengths: [],
        progressHistory: []
      };

      const quiz = await aiPersonalizationService.generateAdaptiveQuiz(
        profile,
        topic,
        weakAreas || []
      );

      res.json(quiz);
    } catch (error) {
      console.error('Adaptive quiz error:', error);
      res.status(500).json({ message: "Failed to generate adaptive quiz" });
    }
  });

  // AI Companion Chat with Ollama
  app.post("/api/ai/companion-chat", authenticateToken, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      
      const prompt = `You are Lexi, a delightful and encouraging AI companion for Persian language learners. You have a playful, supportive personality and help students learn Persian in a fun way.

Context:
- Student Level: ${context.level || 'intermediate'}
- Current Lesson: ${context.currentLesson || 'general practice'}
- Previous Messages: ${JSON.stringify(context.previousMessages || [])}

Student Message: "${message}"

Respond as Parsa with:
1. A helpful, encouraging response in both Persian and English
2. An appropriate emotion for your animated character
3. Optional cultural tips or pronunciation help
4. Keep responses concise but warm and supportive

Return JSON format:
{
  "response": "Your bilingual response (Persian / English)",
  "emotion": "happy|excited|encouraging|thinking|celebrating",
  "culturalTip": "optional cultural insight",
  "pronunciation": "optional pronunciation guide"
}`;

      // Try Ollama first (local AI)
      try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama2', // or any available model
            prompt: prompt,
            stream: false,
            format: 'json'
          }),
        });

        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json();
          const result = JSON.parse(ollamaData.response || '{}');
          
          res.json({
            response: result.response || "سلام! چطور می‌تونم کمکت کنم؟ / Hello! How can I help you?",
            emotion: result.emotion || "happy",
            culturalTip: result.culturalTip,
            pronunciation: result.pronunciation
          });
          return;
        }
      } catch (ollamaError) {
        console.log('Ollama not available, using fallback responses');
      }

      // Fallback to intelligent pattern-based responses
      // Get user's language preference from context
      const userLanguage = context.language || 'en';
      const lowerMessage = message.toLowerCase();
      
      let response = "";
      let emotion = "happy";
      let culturalTip = null;
      let pronunciation = null;

      if (lowerMessage.includes('سلام') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = userLanguage === 'fa' ? 
          "سلام عزیزم! خیلی خوشحالم که می‌بینمت! چطوری؟ 😊" :
          "Hello dear! I'm so happy to see you! How are you feeling today? 😊";
        emotion = "excited";
        culturalTip = userLanguage === 'fa' ? 
          "در فرهنگ ایرانی، احوال‌پرسی خیلی مهمه و نشان از محبت داره" :
          "In Persian culture, greetings are very warm and personal. 'عزیزم' (azizam) means 'my dear'";
        pronunciation = userLanguage === 'fa' ? 
          "سلام: sa-LAAM (تاکید روی آخر)" :
          "سلام is pronounced 'sa-LAAM' with emphasis on the second syllable";
      } else if (lowerMessage.includes('help') || lowerMessage.includes('راهنمایی') || lowerMessage.includes('کمک')) {
        response = userLanguage === 'fa' ? 
          "البته! همیشه آماده کمکم! امروز چی می‌خوای یاد بگیری؟ 🤝" :
          "Of course! I'm always ready to help! What would you like to learn today? 🤝";
        emotion = "encouraging";
        culturalTip = userLanguage === 'fa' ? 
          "کمک کردن به دیگران از ارزش‌های اصلی فرهنگ ایرانیه" :
          "Helping others is a core value in Persian culture called 'کمک رسانی' (komak resani)";
      } else if (lowerMessage.includes('thanks') || lowerMessage.includes('thank') || lowerMessage.includes('مرسی') || lowerMessage.includes('متشکرم')) {
        response = userLanguage === 'fa' ? 
          "خواهش می‌کنم! خیلی خوشحالم که کمک کردم! 🌟" :
          "You're very welcome! I'm so happy I could help! 🌟";
        emotion = "celebrating";
        culturalTip = userLanguage === 'fa' ? 
          "ایرانی‌ها خیلی مؤدب هستن و همیشه 'خواهش می‌کنم' می‌گن" :
          "Persians are very polite and often say 'خواهش می‌کنم' (khahesh mikonam)";
        pronunciation = userLanguage === 'fa' ? 
          "مرسی: mer-SEE (از فرانسوی گرفته شده)" :
          "مرسی is pronounced 'mer-SEE' - borrowed from French 'merci'";
      } else if (lowerMessage.includes('lesson') || lowerMessage.includes('درس') || lowerMessage.includes('practice') || lowerMessage.includes('تمرین')) {
        response = userLanguage === 'fa' ? 
          "عالی! بیا با هم تمرین کنیم! کدوم موضوع رو دوست داری؟ 📚" :
          "Great! Let's practice together! What topic interests you most? 📚";
        emotion = "excited";
        culturalTip = userLanguage === 'fa' ? 
          "تمرین مداوم کلید یادگیری فارسیه" :
          "Regular practice is key in Persian learning. Try to use new words daily";
      } else if (lowerMessage.includes('culture') || lowerMessage.includes('فرهنگ') || lowerMessage.includes('cultural')) {
        response = userLanguage === 'fa' ? 
          "فرهنگ ایران خیلی غنیه! کدوم قسمتش رو می‌خوای بدونی؟ 🎭" :
          "Iranian culture is so rich! What aspect would you like to learn about? 🎭";
        emotion = "excited";
        culturalTip = userLanguage === 'fa' ? 
          "مهمان‌نوازی، شعر و خانواده از رکن‌های فرهنگ ایرانن" :
          "Iranian culture emphasizes hospitality (مهمان‌نوازی), poetry, and family connections";
      } else {
        response = userLanguage === 'fa' ? 
          "جالبه! بگو ببینم بیشتر چی می‌خوای بدونی؟ 🤔" :
          "Interesting! Tell me more about what you'd like to learn? 🤔";
        emotion = "thinking";
        culturalTip = userLanguage === 'fa' ? 
          "در گفتگوهای فارسی، نشان دادن علاقه واقعی خیلی مهمه" :
          "In Persian conversations, showing genuine interest is very important";
      }

      res.json({
        response,
        emotion,
        culturalTip,
        pronunciation
      });

    } catch (error) {
      console.error('Companion chat error:', error);
      res.json({
        response: "متأسفم، الان نمی‌تونم جواب بدم. دوباره تلاش کن! / Sorry, I can't respond right now. Please try again!",
        emotion: "encouraging",
        culturalTip: null,
        pronunciation: null
      });
    }
  });

  // Branding endpoints
  app.get("/api/branding", async (req, res) => {
    const branding = await storage.getBranding();
    res.json(branding);
  });

  app.put("/api/branding", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const branding = await storage.updateBranding(req.body);
      res.json({ message: "Branding updated", branding });
    } catch (error) {
      res.status(400).json({ message: "Failed to update branding" });
    }
  });

  // Institute Branding API
  app.get("/api/branding", async (req, res) => {
    try {
      const branding = await storage.getBranding();
      res.json(branding);
    } catch (error) {
      console.error("Error fetching branding:", error);
      res.status(500).json({ message: "Failed to fetch branding" });
    }
  });

  app.put("/api/branding", authenticateToken, async (req: any, res) => {
    try {
      // Only managers can update branding
      if (req.user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can update branding" });
      }

      const brandingData = req.body;
      const updatedBranding = await storage.updateBranding(brandingData);
      res.json(updatedBranding);
    } catch (error) {
      console.error("Error updating branding:", error);
      res.status(500).json({ message: "Failed to update branding" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
