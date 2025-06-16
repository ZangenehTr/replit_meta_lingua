import { db } from "../server/db";
import { users } from "../shared/schema";
import { hashPassword } from "../server/auth";

async function createTestUser() {
  try {
    const hashedPassword = await hashPassword("password123");
    
    const [user] = await db.insert(users).values({
      email: "admin@metalingua.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
      credits: 1000,
      streakDays: 0,
      totalLessons: 0,
    }).returning();

    console.log("Test user created successfully:", user);
    console.log("Login credentials:");
    console.log("Email: admin@metalingua.com");
    console.log("Password: password123");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating test user:", error);
    process.exit(1);
  }
}

createTestUser();