import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { insertUserSchema, insertSessionSchema, insertMessageSchema, insertPaymentSchema } from "@shared/schema";

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
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
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

  app.get("/api/admin/students", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const users = await storage.getAllUsers();
      const students = users.filter(u => u.role === 'student').map(student => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        phone: student.phoneNumber || 'N/A',
        status: student.isActive ? 'active' : 'inactive',
        enrolledCourses: 2,
        totalPayments: 1250,
        lastActivity: '2 days ago'
      }));

      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to get students" });
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

  const httpServer = createServer(app);
  return httpServer;
}
