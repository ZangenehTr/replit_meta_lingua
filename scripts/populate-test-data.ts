#!/usr/bin/env node
/**
 * Script to populate the database with realistic test data
 * This will add users, courses, enrollments, and transactions
 * to demonstrate real database queries working
 */

import { db } from "../server/db";
import { 
  users, courses, enrollments, walletTransactions, 
  userProfiles, sessions, leads, communicationLogs,
  mentorAssignments
} from "../shared/schema";
import { hashPassword } from "../server/auth";

async function populateTestData() {
  console.log("🔄 Starting to populate test data...");

  try {
    // 1. Create diverse users for different roles
    console.log("👥 Creating users...");
    
    // Teachers
    const teacherPasswords = await Promise.all([
      hashPassword("teacher123"),
      hashPassword("teacher123"),
      hashPassword("teacher123")
    ]);

    const teachers = await db.insert(users).values([
      {
        email: "sara.ahmadi@metalingua.com",
        password: teacherPasswords[0],
        firstName: "سارا",
        lastName: "احمدی",
        role: "Teacher",
        isActive: true,
        preferences: { language: "fa" }
      },
      {
        email: "mohammad.rezaei@metalingua.com", 
        password: teacherPasswords[1],
        firstName: "محمد",
        lastName: "رضایی",
        role: "Teacher",
        isActive: true,
        preferences: { language: "fa" }
      },
      {
        email: "zahra.karimi@metalingua.com",
        password: teacherPasswords[2],
        firstName: "زهرا",
        lastName: "کریمی",
        role: "Teacher", 
        isActive: true,
        preferences: { language: "fa" }
      }
    ]).returning();

    // Students
    const studentPasswords = await Promise.all([
      hashPassword("student123"),
      hashPassword("student123"),
      hashPassword("student123"),
      hashPassword("student123"),
      hashPassword("student123")
    ]);

    const students = await db.insert(users).values([
      {
        email: "ali.hosseini@gmail.com",
        password: studentPasswords[0],
        firstName: "علی",
        lastName: "حسینی",
        role: "Student",
        isActive: true,
        preferences: { language: "fa" }
      },
      {
        email: "maryam.ebrahimi@gmail.com",
        password: studentPasswords[1],
        firstName: "مریم", 
        lastName: "ابراهیمی",
        role: "Student",
        isActive: true,
        preferences: { language: "fa" }
      },
      {
        email: "reza.mohammadi@gmail.com",
        password: studentPasswords[2],
        firstName: "رضا",
        lastName: "محمدی", 
        role: "Student",
        isActive: true,
        preferences: { language: "fa" }
      },
      {
        email: "fateme.hashemi@gmail.com",
        password: studentPasswords[3],
        firstName: "فاطمه",
        lastName: "هاشمی",
        role: "Student",
        isActive: true,
        preferences: { language: "fa" }
      },
      {
        email: "amir.sadeghi@gmail.com",
        password: studentPasswords[4],
        firstName: "امیر",
        lastName: "صادقی",
        role: "Student",
        isActive: true,
        preferences: { language: "fa" }
      }
    ]).returning();

    // Mentor
    const mentorPassword = await hashPassword("mentor123");
    const [mentor] = await db.insert(users).values({
      email: "hossein.nouri@metalingua.com",
      password: mentorPassword,
      firstName: "حسین",
      lastName: "نوری",
      role: "Mentor",
      isActive: true,
      preferences: { language: "fa" }
    }).returning();

    // Call Center Agent
    const agentPassword = await hashPassword("agent123");
    const [agent] = await db.insert(users).values({
      email: "nina.rashidi@metalingua.com",
      password: agentPassword,
      firstName: "نینا",
      lastName: "رشیدی",
      role: "Call Center Agent",
      isActive: true,
      preferences: { language: "fa" }
    }).returning();

    console.log("✅ Created users successfully");

    // 2. Create user profiles for students
    console.log("📋 Creating user profiles...");
    for (const student of students) {
      await db.insert(userProfiles).values({
        userId: student.id,
        bio: `Persian language learner interested in mastering conversational skills`,
        avatarUrl: null,
        phoneNumber: "+98912" + Math.floor(Math.random() * 9000000 + 1000000),
        address: "Tehran, Iran",
        city: "Tehran",
        country: "Iran",
        postalCode: Math.floor(Math.random() * 90000 + 10000).toString(),
        timezone: "Asia/Tehran",
        preferredLanguage: "fa",
        learningGoals: ["conversation", "reading", "writing"],
        currentLevel: Math.random() > 0.5 ? "beginner" : "intermediate"
      });
    }

    console.log("✅ Created user profiles");

    // 3. Create courses
    console.log("📚 Creating courses...");
    const courseData = await db.insert(courses).values([
      {
        title: "مکالمه فارسی مقدماتی",
        description: "آموزش مکالمه روزمره فارسی برای مبتدیان",
        instructorId: teachers[0].id,
        price: 2500000, // 2.5M IRR
        currency: "IRR",
        duration: 60,
        level: "beginner",
        category: "conversation",
        language: "persian",
        maxStudents: 15,
        status: "published",
        startDate: new Date("2025-01-10"),
        endDate: new Date("2025-04-10"),
        schedule: { days: ["Sunday", "Tuesday"], time: "18:00" }
      },
      {
        title: "گرامر فارسی پیشرفته",
        description: "یادگیری قواعد پیشرفته زبان فارسی",
        instructorId: teachers[1].id,
        price: 3000000, // 3M IRR
        currency: "IRR", 
        duration: 90,
        level: "advanced",
        category: "grammar",
        language: "persian",
        maxStudents: 12,
        status: "published",
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-04-15"),
        schedule: { days: ["Monday", "Wednesday"], time: "19:00" }
      },
      {
        title: "خط و خوشنویسی فارسی",
        description: "آموزش خط نستعلیق و خوشنویسی",
        instructorId: teachers[2].id,
        price: 2000000, // 2M IRR
        currency: "IRR",
        duration: 120,
        level: "intermediate", 
        category: "writing",
        language: "persian",
        maxStudents: 10,
        status: "published",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-05-01"),
        schedule: { days: ["Saturday"], time: "10:00" }
      }
    ]).returning();

    console.log("✅ Created courses");

    // 4. Create enrollments
    console.log("🎓 Creating enrollments...");
    const enrollmentData = [];
    for (let i = 0; i < students.length; i++) {
      const courseIndex = i % courseData.length;
      enrollmentData.push({
        userId: students[i].id,
        courseId: courseData[courseIndex].id,
        status: "active" as const,
        enrollmentDate: new Date(),
        progress: Math.floor(Math.random() * 60 + 20),
        completedLessons: Math.floor(Math.random() * 10 + 5),
        totalLessons: 24
      });
    }
    await db.insert(enrollments).values(enrollmentData);

    console.log("✅ Created enrollments");

    // 5. Create wallet transactions (payments)
    console.log("💰 Creating wallet transactions...");
    const transactionData = [];
    for (const enrollment of enrollmentData) {
      const course = courseData.find(c => c.id === enrollment.courseId);
      if (course) {
        transactionData.push({
          userId: enrollment.userId,
          type: "credit" as const,
          amount: course.price,
          balance: course.price,
          description: `Payment for course: ${course.title}`,
          referenceType: "course_payment",
          referenceId: course.id,
          status: "completed" as const,
          currency: "IRR",
          paymentMethod: "shetab",
          shetabReferenceNumber: "SH" + Math.random().toString(36).substring(2, 15).toUpperCase(),
          metadata: { courseId: course.id }
        });
      }
    }
    await db.insert(walletTransactions).values(transactionData);

    console.log("✅ Created wallet transactions");

    // 6. Create sessions (classes)
    console.log("🎯 Creating sessions...");
    const sessionData = [];
    for (const course of courseData) {
      for (let i = 0; i < 5; i++) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() + i * 3);
        
        sessionData.push({
          courseId: course.id,
          title: `Session ${i + 1}: ${course.title}`,
          description: `Interactive session focusing on practical exercises`,
          startTime: new Date(sessionDate.setHours(18, 0, 0, 0)),
          endTime: new Date(sessionDate.setHours(19, 30, 0, 0)),
          status: i < 2 ? "completed" as const : "scheduled" as const,
          meetingUrl: `https://meet.metalingua.com/session-${course.id}-${i + 1}`,
          recordingUrl: i < 2 ? `https://recordings.metalingua.com/rec-${course.id}-${i + 1}` : null,
          materials: null,
          maxAttendees: course.maxStudents,
          actualAttendees: i < 2 ? Math.floor(Math.random() * 5 + 8) : 0
        });
      }
    }
    await db.insert(sessions).values(sessionData);

    console.log("✅ Created sessions");

    // 7. Create leads for call center
    console.log("📞 Creating leads...");
    const leadData = await db.insert(leads).values([
      {
        firstName: "نازنین",
        lastName: "مرادی",
        email: "nazanin.moradi@gmail.com",
        phoneNumber: "+989121234567",
        source: "website",
        status: "new",
        priority: "high",
        interestedLanguage: "english",
        interestedLevel: "beginner",
        preferredFormat: "private",
        budget: 5000000,
        notes: "Interested in business English",
        assignedAgentId: agent.id,
        nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        firstName: "کامران",
        lastName: "یزدانی",
        email: "kamran.yazdani@gmail.com",
        phoneNumber: "+989122345678",
        source: "referral",
        status: "contacted",
        priority: "medium", 
        interestedLanguage: "persian",
        interestedLevel: "intermediate",
        preferredFormat: "group",
        budget: 3000000,
        notes: "Referred by existing student",
        assignedAgentId: agent.id,
        lastContactDate: new Date()
      }
    ]).returning();

    console.log("✅ Created leads");

    // 8. Create communication logs
    console.log("📱 Creating communication logs...");
    for (const lead of leadData) {
      await db.insert(communicationLogs).values({
        leadId: lead.id,
        userId: agent.id,
        type: "call",
        direction: "outbound",
        duration: 180 + Math.floor(Math.random() * 300),
        outcome: "interested",
        notes: "Discussed course options and pricing",
        phoneNumber: lead.phoneNumber,
        scheduledAt: new Date()
      });
    }

    console.log("✅ Created communication logs");

    // 9. Create mentor assignments
    console.log("🤝 Creating mentor assignments...");
    for (let i = 0; i < 3; i++) {
      await db.insert(mentorAssignments).values({
        mentorId: mentor.id,
        studentId: students[i].id,
        status: "active",
        assignedDate: new Date(),
        goals: ["Improve conversation skills", "Cultural understanding", "Grammar mastery"],
        notes: "Weekly progress meetings scheduled"
      });
    }

    console.log("✅ Created mentor assignments");

    console.log("\n🎉 Successfully populated database with test data!");
    console.log("\n📊 Summary:");
    console.log(`- ${teachers.length} Teachers`);
    console.log(`- ${students.length} Students`);
    console.log(`- ${courseData.length} Courses`);
    console.log(`- ${enrollmentData.length} Enrollments`);
    console.log(`- ${transactionData.length} Transactions`);
    console.log(`- ${sessionData.length} Sessions`);
    console.log(`- ${leadData.length} Leads`);
    console.log("\nYou can now see real data in your dashboards!");

  } catch (error) {
    console.error("❌ Error populating test data:", error);
    throw error;
  }
}

// Run the script
populateTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });