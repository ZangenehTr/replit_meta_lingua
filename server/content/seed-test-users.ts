/**
 * Test User Seeding Script for Meta Lingua Platform
 * Creates clean test users for development and production environments
 * 
 * Creates:
 * - 2 Teachers (CallerN-enabled)
 * - 2 Students (1 with CallerN service, 1 with 10B rials wallet)
 * - 5 Admin users (Admin, Accountant, Call Center, Front Desk, Mentor)
 */

import { db } from "../db";
import { users, studentCallernPackages, callernPackages } from "../../shared/schema";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";

// Password for all test users (should be changed in production)
const TEST_PASSWORD = "test123";
const HASHED_PASSWORD = bcrypt.hashSync(TEST_PASSWORD, 10);

// 10 billion rials = 10,000,000,000
const TEN_BILLION_RIALS = 10000000000;

export async function seedTestUsers() {
  try {
    console.log('🌱 Starting Test User Seeding...');
    console.log('');

    // Check if any of the specific test users already exist
    const testEmails = [
      "sara.rezaei@example.com",
      "ali.mohammadi@example.com",
      "maryam.karimi@example.com",
      "reza.ahmadi@example.com",
      "admin@metalingua.com",
      "accountant@metalingua.com",
      "callcenter@metalingua.com",
      "frontdesk@metalingua.com",
      "mentor@metalingua.com"
    ];
    
    const existingTestUsers = await db.select().from(users).where(
      inArray(users.email, testEmails)
    ).limit(1);
    
    if (existingTestUsers.length > 0) {
      console.log(`⚠️  Test users already exist in database.`);
      console.log(`   Found existing user: ${existingTestUsers[0].email}`);
      console.log('   To reseed, first delete these specific test user accounts.');
      return {
        success: false,
        message: 'Test users already exist. Delete them first to reseed.',
        existingEmail: existingTestUsers[0].email
      };
    }

    console.log('📝 Creating test users...');
    console.log('');

    // ========================================
    // 1. CREATE TEACHERS (2)
    // ========================================
    console.log('👨‍🏫 Creating Teachers...');
    
    const teacher1 = await db.insert(users).values({
      email: "sara.rezaei@example.com",
      password: HASHED_PASSWORD,
      firstName: "Sara",
      lastName: "Rezaei",
      role: "Teacher/Tutor",
      phoneNumber: "+989121234567",
      isActive: true,
      walletBalance: 0,
      status: "active",
      gender: "female",
      nationalId: "0012345678",
      notes: "CallerN-enabled teacher"
    } as any).returning();

    const teacher2 = await db.insert(users).values({
      email: "ali.mohammadi@example.com",
      password: HASHED_PASSWORD,
      firstName: "Ali",
      lastName: "Mohammadi",
      role: "Teacher/Tutor",
      phoneNumber: "+989127654321",
      isActive: true,
      walletBalance: 0,
      status: "active",
      gender: "male",
      nationalId: "0012345679",
      notes: "CallerN-enabled teacher"
    } as any).returning();

    console.log(`   ✅ Created Teacher 1: ${teacher1[0].firstName} ${teacher1[0].lastName} (${teacher1[0].email})`);
    console.log(`   ✅ Created Teacher 2: ${teacher2[0].firstName} ${teacher2[0].lastName} (${teacher2[0].email})`);
    console.log('');

    // ========================================
    // 2. CREATE STUDENTS (2)
    // ========================================
    console.log('👨‍🎓 Creating Students...');
    
    // Student A: Has purchased CallerN service
    const studentA = await db.insert(users).values({
      email: "maryam.karimi@example.com",
      password: HASHED_PASSWORD,
      firstName: "Maryam",
      lastName: "Karimi",
      role: "Student",
      phoneNumber: "+989131234567",
      isActive: true,
      walletBalance: 5000000, // 5 million rials for additional purchases
      status: "active",
      gender: "female",
      nationalId: "0023456789",
      notes: "Has active CallerN service"
    } as any).returning();

    // Student B: Rich student with 10 billion rials
    const studentB = await db.insert(users).values({
      email: "reza.ahmadi@example.com",
      password: HASHED_PASSWORD,
      firstName: "Reza",
      lastName: "Ahmadi",
      role: "Student",
      phoneNumber: "+989137654321",
      isActive: true,
      walletBalance: TEN_BILLION_RIALS,
      status: "active",
      gender: "male",
      nationalId: "0023456790",
      notes: "Rich student with 10 billion rials"
    } as any).returning();

    console.log(`   ✅ Created Student A: ${studentA[0].firstName} ${studentA[0].lastName} (${studentA[0].email})`);
    console.log(`      - Wallet: ${studentA[0].walletBalance?.toLocaleString()} rials`);
    console.log(`   ✅ Created Student B: ${studentB[0].firstName} ${studentB[0].lastName} (${studentB[0].email})`);
    console.log(`      - Wallet: ${studentB[0].walletBalance?.toLocaleString()} rials (10 billion)`);
    console.log('');

    // ========================================
    // 3. CREATE ADMIN USERS (5)
    // ========================================
    console.log('👤 Creating Admin Users...');
    
    const admin = await db.insert(users).values({
      email: "admin@metalingua.com",
      password: HASHED_PASSWORD,
      firstName: "Admin",
      lastName: "User",
      role: "Admin",
      phoneNumber: "+989101234567",
      isActive: true,
      status: "active",
      notes: "Full system access - all features and data"
    } as any).returning();

    const accountant = await db.insert(users).values({
      email: "accountant@metalingua.com",
      password: HASHED_PASSWORD,
      firstName: "Sara",
      lastName: "Accountant",
      role: "Accountant",
      phoneNumber: "+989101234568",
      isActive: true,
      status: "active",
      gender: "female",
      notes: "Financial management, payments, invoicing"
    } as any).returning();

    const callCenter = await db.insert(users).values({
      email: "callcenter@metalingua.com",
      password: HASHED_PASSWORD,
      firstName: "Ali",
      lastName: "CallCenter",
      role: "Call Center Agent",
      phoneNumber: "+989101234569",
      isActive: true,
      status: "active",
      gender: "male",
      notes: "Phone operations, lead calling, follow-ups"
    } as any).returning();

    const frontDesk = await db.insert(users).values({
      email: "frontdesk@metalingua.com",
      password: HASHED_PASSWORD,
      firstName: "Maryam",
      lastName: "FrontDesk",
      role: "Front Desk Clerk",
      phoneNumber: "+989101234570",
      isActive: true,
      status: "active",
      gender: "female",
      notes: "Walk-in intake, visitor management, front desk operations"
    } as any).returning();

    const mentor = await db.insert(users).values({
      email: "mentor@metalingua.com",
      password: HASHED_PASSWORD,
      firstName: "Reza",
      lastName: "Mentor",
      role: "Mentor",
      phoneNumber: "+989101234571",
      isActive: true,
      status: "active",
      gender: "male",
      notes: "Student guidance, academic support, mentorship"
    } as any).returning();

    console.log(`   ✅ Created Admin: ${admin[0].email}`);
    console.log(`   ✅ Created Accountant: ${accountant[0].email}`);
    console.log(`   ✅ Created Call Center: ${callCenter[0].email}`);
    console.log(`   ✅ Created Front Desk: ${frontDesk[0].email}`);
    console.log(`   ✅ Created Mentor: ${mentor[0].email}`);
    console.log('');

    // ========================================
    // 4. CREATE CALLERN PACKAGE FOR STUDENT A
    // ========================================
    console.log('📦 Setting up CallerN package for Student A...');

    // First, create a CallerN package if one doesn't exist
    let callernPackage = await db.select().from(callernPackages).limit(1);
    
    if (callernPackage.length === 0) {
      // Create a basic CallerN package
      const newPackage = await db.insert(callernPackages).values({
        name: "Basic CallerN Package",
        sessionCount: 10,
        validityDays: 30,
        price: "5000000", // 5 million rials (decimal as string)
        features: ["10 video sessions", "30 days validity", "AI-powered suggestions"]
      } as any).returning();
      callernPackage = newPackage;
      console.log(`   ✅ Created CallerN package: ${newPackage[0].name}`);
    }

    // Assign package to Student A
    await db.insert(studentCallernPackages).values({
      studentId: studentA[0].id,
      packageId: callernPackage[0].id,
      sessionsRemaining: 5, // 5 sessions remaining out of 10
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    } as any);

    console.log(`   ✅ Assigned CallerN package to ${studentA[0].firstName} ${studentA[0].lastName}`);
    console.log(`      - Package: ${callernPackage[0].name}`);
    console.log(`      - Remaining: 5 sessions (out of 10)`);
    console.log(`      - Status: Active`);
    console.log('');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('');
    console.log('✅ ========================================');
    console.log('✅ TEST USER SEEDING COMPLETED SUCCESSFULLY');
    console.log('✅ ========================================');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Teachers: 2 (both CallerN-enabled)`);
    console.log(`   - Students: 2 (1 with CallerN, 1 with 10B rials)`);
    console.log(`   - Admin Users: 5 (Admin, Accountant, Call Center, Front Desk, Mentor)`);
    console.log(`   - Total Users: 9`);
    console.log('');
    console.log('🔑 Login Credentials (all users):');
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log('');
    console.log('👥 Test Users:');
    console.log('');
    console.log('   TEACHERS:');
    console.log(`   1. ${teacher1[0].email} - Sara Rezaei (Mon-Fri, 9-5)`);
    console.log(`   2. ${teacher2[0].email} - Ali Mohammadi (Sat-Wed, 10-6)`);
    console.log('');
    console.log('   STUDENTS:');
    console.log(`   1. ${studentA[0].email} - Maryam Karimi (Has CallerN service + 5M rials)`);
    console.log(`   2. ${studentB[0].email} - Reza Ahmadi (10 BILLION rials wallet)`);
    console.log('');
    console.log('   ADMIN USERS:');
    console.log(`   1. ${admin[0].email} - Full system access`);
    console.log(`   2. ${accountant[0].email} - Financial management`);
    console.log(`   3. ${callCenter[0].email} - Phone operations`);
    console.log(`   4. ${frontDesk[0].email} - Walk-in intake`);
    console.log(`   5. ${mentor[0].email} - Student guidance`);
    console.log('');
    console.log('💡 Note: Change passwords in production!');
    console.log('');

    return {
      success: true,
      message: 'Test users seeded successfully',
      usersCreated: 9,
      credentials: {
        password: TEST_PASSWORD,
        teachers: [teacher1[0].email, teacher2[0].email],
        students: [studentA[0].email, studentB[0].email],
        admins: [admin[0].email, accountant[0].email, callCenter[0].email, frontDesk[0].email, mentor[0].email]
      }
    };
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  }
}
