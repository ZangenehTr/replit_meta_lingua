import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { adminSettings, users, courses } from "../shared/schema";
import { eq } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function initializeWalletSystem() {
  try {
    console.log("Initializing wallet-based payment system...");

    // Check if admin settings already exist
    const existingSettings = await db.select().from(adminSettings).limit(1);
    
    if (existingSettings.length === 0) {
      console.log("Creating default admin settings...");
      
      // Create default admin settings for wallet system
      await db.insert(adminSettings).values({
        creditValueInRials: 10000, // 10,000 IRR = 1 credit
        walletTopupIncrement: 100000, // 100,000 IRR increments
        bronzeTierThreshold: 10000, // 10,000 credits for Bronze
        silverTierThreshold: 100000, // 100,000 credits for Silver
        goldTierThreshold: 1000000, // 1,000,000 credits for Gold
        diamondTierThreshold: 10000000, // 10,000,000 credits for Diamond
        bronzeDiscount: 10, // 10% discount for Bronze
        silverDiscount: 15, // 15% discount for Silver
        goldDiscount: 20, // 20% discount for Gold
        diamondDiscount: 30, // 30% discount for Diamond
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log("Default admin settings created successfully!");
      console.log("Settings:");
      console.log("- Credit Value: 10,000 IRR = 1 credit");
      console.log("- Wallet Top-up Increment: 100,000 IRR");
      console.log("- Member Tiers:");
      console.log("  * Bronze: 10,000 credits (10% discount)");
      console.log("  * Silver: 100,000 credits (15% discount)");
      console.log("  * Gold: 1,000,000 credits (20% discount)");
      console.log("  * Diamond: 10,000,000 credits (30% discount)");
    } else {
      console.log("Admin settings already exist - skipping initialization");
    }

    // Create sample courses if they don't exist
    const existingCourses = await db.select().from(courses).limit(1);
    
    if (existingCourses.length === 0) {
      console.log("Creating sample courses for testing...");
      
      const sampleCourses = [
        {
          courseCode: "ENG101",
          title: "English Fundamentals",
          description: "Basic English language course for beginners",
          language: "English",
          level: "Beginner",
          thumbnail: "/images/english-basic.jpg",
          instructorId: 1,
          price: 2500000, // 2,500,000 IRR
          totalSessions: 20,
          sessionDuration: 90,
          maxStudents: 15,
          weekdays: ["Monday", "Wednesday", "Friday"],
          startTime: "09:00",
          endTime: "10:30",
          category: "Language Learning",
          prerequisites: "",
          learningOutcomes: "Basic English communication skills",
          isActive: true,
          isFeatured: true,
          autoRecord: false,
          recordingAvailable: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          courseCode: "ENG201",
          title: "Intermediate English Conversation",
          description: "Improve your English conversation skills",
          language: "English",
          level: "Intermediate",
          thumbnail: "/images/english-intermediate.jpg",
          instructorId: 1,
          price: 3500000, // 3,500,000 IRR
          totalSessions: 24,
          sessionDuration: 90,
          maxStudents: 12,
          weekdays: ["Tuesday", "Thursday"],
          startTime: "14:00",
          endTime: "15:30",
          category: "Language Learning",
          prerequisites: "Basic English knowledge",
          learningOutcomes: "Fluent English conversation",
          isActive: true,
          isFeatured: false,
          autoRecord: true,
          recordingAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          courseCode: "GER101",
          title: "German for Beginners",
          description: "Start your German language journey",
          language: "German",
          level: "Beginner",
          thumbnail: "/images/german-basic.jpg",
          instructorId: 2,
          price: 3000000, // 3,000,000 IRR
          totalSessions: 22,
          sessionDuration: 90,
          maxStudents: 10,
          weekdays: ["Saturday", "Monday"],
          startTime: "16:00",
          endTime: "17:30",
          category: "Language Learning",
          prerequisites: "",
          learningOutcomes: "Basic German communication",
          isActive: true,
          isFeatured: true,
          autoRecord: false,
          recordingAvailable: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const course of sampleCourses) {
        await db.insert(courses).values(course);
      }
      
      console.log("Sample courses created successfully!");
      console.log(`Created ${sampleCourses.length} courses for testing the wallet system`);
    } else {
      console.log("Courses already exist - skipping course creation");
    }

    // Update existing users to have wallet fields
    console.log("Updating user accounts for wallet system compatibility...");
    
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      if (user.walletBalance === null || user.totalCredits === null || !user.memberTier) {
        await db.update(users)
          .set({
            walletBalance: user.walletBalance || 0,
            totalCredits: user.totalCredits || 0,
            memberTier: user.memberTier || 'bronze',
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));
      }
    }
    
    console.log(`Updated ${allUsers.length} user accounts for wallet compatibility`);
    console.log("Wallet-based payment system initialization completed successfully!");
    
  } catch (error) {
    console.error("Error initializing wallet system:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeWalletSystem()
  .then(() => {
    console.log("Wallet system ready for use!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Initialization failed:", error);
    process.exit(1);
  });