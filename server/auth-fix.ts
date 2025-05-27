import type { Express } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = "meta-lingua-secret-2025";

// Simple demo user data
const DEMO_USER = {
  id: 1,
  email: "ahmad.rezaei@example.com",
  firstName: "Ahmad",
  lastName: "Rezaei",
  role: "student",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  credits: 12,
  streakDays: 15,
  preferences: { theme: "light", language: "en", notifications: true }
};

export function setupAuth(app: Express) {
  // Authentication middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid token' });
    }
  };

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Check demo credentials
    if (email === "ahmad.rezaei@example.com" && password === "password123") {
      const token = jwt.sign(
        { userId: DEMO_USER.id, email: DEMO_USER.email, role: DEMO_USER.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({
        token: token,
        user: DEMO_USER
      });
    }

    return res.status(401).json({ message: "Invalid credentials" });
  });

  // User profile endpoint
  app.get("/api/users/me", authenticateToken, (req: any, res) => {
    res.json(DEMO_USER);
  });

  // Other protected endpoints with demo data
  app.get("/api/dashboard", authenticateToken, (req: any, res) => {
    res.json({
      stats: {
        streak: 15,
        progress: 68,
        credits: 12,
        nextSession: "2025-05-28T14:00:00Z"
      }
    });
  });

  app.get("/api/sessions/upcoming", authenticateToken, (req: any, res) => {
    res.json([
      {
        id: 1,
        title: "Persian Grammar Basics",
        scheduledAt: "2025-05-28T14:00:00Z",
        tutorName: "Dr. Sarah Hosseini",
        tutorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b27c?w=40&h=40&fit=crop&crop=face"
      }
    ]);
  });

  // Available courses endpoint
  app.get("/api/courses", authenticateToken, (req: any, res) => {
    res.json([
      {
        id: 1,
        title: "Persian Language Fundamentals",
        description: "Master the basics of Persian language with native instructors",
        thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop",
        language: "Persian",
        level: "Beginner",
        instructorId: 1,
        price: 25000, // تومان
        duration: "8 weeks",
        isActive: true
      },
      {
        id: 2,
        title: "Advanced Persian Literature",
        description: "Explore classical Persian poetry and modern literature",
        thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
        language: "Persian",
        level: "Advanced",
        instructorId: 2,
        price: 35000,
        duration: "12 weeks",
        isActive: true
      },
      {
        id: 3,
        title: "Business English for Iranians",
        description: "Professional English communication skills",
        thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop",
        language: "English",
        level: "Intermediate",
        instructorId: 3,
        price: 30000,
        duration: "10 weeks",
        isActive: true
      },
      {
        id: 4,
        title: "Arabic for Persian Speakers",
        description: "Learn Arabic with Persian language context",
        thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
        language: "Arabic",
        level: "Beginner",
        instructorId: 4,
        price: 28000,
        duration: "6 weeks",
        isActive: true
      }
    ]);
  });

  app.get("/api/courses/my", authenticateToken, (req: any, res) => {
    res.json([
      {
        id: 1,
        title: "Persian Language Fundamentals",
        description: "Master the basics of Persian language with native instructors",
        thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop",
        progress: 68,
        language: "Persian",
        level: "Beginner",
        enrolledAt: "2025-05-15T10:00:00Z",
        nextLesson: "Lesson 7: Persian Grammar Basics",
        completedLessons: 6,
        totalLessons: 12
      }
    ]);
  });

  // Course enrollment endpoint
  app.post("/api/courses/:id/enroll", authenticateToken, (req: any, res) => {
    const courseId = parseInt(req.params.id);
    
    res.json({
      message: "Successfully enrolled in course!",
      enrollment: {
        id: Date.now(),
        courseId: courseId,
        userId: req.user?.userId || 1,
        enrolledAt: new Date().toISOString(),
        progress: 0
      }
    });
  });

  // Update course progress
  app.put("/api/courses/:id/progress", authenticateToken, (req: any, res) => {
    const courseId = parseInt(req.params.id);
    const { lessonId, completed } = req.body;
    
    res.json({
      message: "Progress updated successfully",
      progress: {
        courseId,
        lessonId,
        completed,
        newProgress: Math.min(100, (lessonId / 12) * 100)
      }
    });
  });

  app.get("/api/homework/pending", authenticateToken, (req: any, res) => {
    res.json([
      {
        id: 1,
        title: "Persian Alphabet Practice",
        courseName: "Persian Fundamentals",
        dueDate: "2025-05-30T23:59:59Z",
        status: "pending"
      }
    ]);
  });

  app.get("/api/tutors/featured", authenticateToken, (req: any, res) => {
    res.json([
      {
        id: 1,
        firstName: "Dr. Sarah",
        lastName: "Hosseini",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b27c?w=150&h=150&fit=crop&crop=face",
        role: "tutor"
      }
    ]);
  });

  app.get("/api/messages", authenticateToken, (req: any, res) => {
    res.json([
      {
        id: 1,
        content: "Great progress on your Persian studies!",
        senderName: "Dr. Sarah Hosseini",
        senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b27c?w=40&h=40&fit=crop&crop=face",
        sentAt: "2025-05-27T12:00:00Z",
        isRead: false
      }
    ]);
  });

  app.get("/api/payments", authenticateToken, (req: any, res) => {
    res.json([
      {
        id: 1,
        amount: "50,000 تومان",
        creditsAwarded: 10,
        createdAt: "2025-05-25T10:00:00Z",
        status: "completed"
      }
    ]);
  });
}