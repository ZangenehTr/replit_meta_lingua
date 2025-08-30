import { Express } from "express";
import { authenticateToken, requireRole } from "./auth-middleware";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  teacherCallernAuthorization,
  teacherCallernAvailability,
  callernCallHistory,
  users,
  callernScoresTeacher,
  callernScoresStudent
} from "@shared/schema";

export function registerCallernTeacherRoutes(app: Express, storage: any) {
  // Check teacher authorization for Callern
  app.get("/api/teacher/callern/authorization", authenticateToken, requireRole(['Teacher', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      
      // Check if teacher is authorized for Callern
      const authorization = await db
        .select()
        .from(teacherCallernAuthorization)
        .where(and(
          eq(teacherCallernAuthorization.teacherId, teacherId),
          eq(teacherCallernAuthorization.isAuthorized, true)
        ))
        .limit(1);
      
      if (authorization.length === 0) {
        return res.json({ isAuthorized: false });
      }
      
      return res.json({ 
        isAuthorized: true,
        authorizedAt: authorization[0].authorizedAt,
        authorizedBy: authorization[0].authorizedBy
      });
    } catch (error) {
      console.error('Error checking teacher authorization:', error);
      res.status(500).json({ message: 'Failed to check authorization' });
    }
  });

  // Get teacher availability settings
  app.get("/api/teacher/callern/availability", authenticateToken, requireRole(['Teacher', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      
      const availability = await db
        .select()
        .from(teacherCallernAvailability)
        .where(eq(teacherCallernAvailability.teacherId, teacherId))
        .limit(1);
      
      if (availability.length === 0) {
        // Return default availability
        return res.json({
          morningSlot: false,
          afternoonSlot: false,
          eveningSlot: false,
          nightSlot: false,
          hourlyRate: null,
          isOnline: false
        });
      }
      
      return res.json(availability[0]);
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ message: 'Failed to fetch availability' });
    }
  });

  // Update teacher availability
  app.put("/api/teacher/callern/availability", authenticateToken, requireRole(['Teacher', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const { morningSlot, afternoonSlot, eveningSlot, nightSlot } = req.body;
      
      // Check if record exists
      const existing = await db
        .select()
        .from(teacherCallernAvailability)
        .where(eq(teacherCallernAvailability.teacherId, teacherId))
        .limit(1);
      
      if (existing.length === 0) {
        // Create new record
        await db.insert(teacherCallernAvailability).values({
          teacherId,
          morningSlot: morningSlot || false,
          afternoonSlot: afternoonSlot || false,
          eveningSlot: eveningSlot || false,
          nightSlot: nightSlot || false,
          isOnline: false,
          totalCallsHandled: 0,
          missedShifts: 0,
          missedCalls: 0
        });
      } else {
        // Update existing record
        await db
          .update(teacherCallernAvailability)
          .set({
            morningSlot,
            afternoonSlot,
            eveningSlot,
            nightSlot,
            updatedAt: new Date()
          })
          .where(eq(teacherCallernAvailability.teacherId, teacherId));
      }
      
      res.json({ message: 'Availability updated successfully' });
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({ message: 'Failed to update availability' });
    }
  });

  // Get teacher's call history with enhanced data
  app.get("/api/teacher/callern/history", authenticateToken, requireRole(['Teacher', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      
      const history = await db
        .select({
          id: callernCallHistory.id,
          studentId: callernCallHistory.studentId,
          duration: callernCallHistory.durationMinutes,
          status: callernCallHistory.status,
          startedAt: callernCallHistory.startTime,
          endedAt: callernCallHistory.endTime,
          recordingUrl: callernCallHistory.recordingUrl,
          transcriptUrl: callernCallHistory.transcriptUrl,
          contentBundleUrl: callernCallHistory.contentBundleUrl,
          studentRating: callernCallHistory.studentRating,
          supervisorRating: callernCallHistory.supervisorRating,
          teacherConnectionQuality: callernCallHistory.teacherConnectionQuality,
          studentConnectionQuality: callernCallHistory.studentConnectionQuality,
          studentFirstName: users.firstName,
          studentLastName: users.lastName
        })
        .from(callernCallHistory)
        .leftJoin(users, eq(callernCallHistory.studentId, users.id))
        .where(eq(callernCallHistory.teacherId, teacherId))
        .orderBy(desc(callernCallHistory.startTime))
        .limit(100);
      
      // Format response with privacy protection
      const formattedHistory = history.map(call => ({
        ...call,
        studentName: `${call.studentFirstName} ${call.studentLastName}`,
        callType: 'general' // Default if not specified
      }));
      
      res.json(formattedHistory);
    } catch (error) {
      console.error('Error fetching call history:', error);
      res.status(500).json({ message: 'Failed to fetch call history' });
    }
  });

  // Get teacher statistics
  app.get("/api/teacher/callern/stats", authenticateToken, requireRole(['Teacher', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const now = new Date();
      
      // Get dates for different periods
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get call statistics
      const [dailyStats, weeklyStats, monthlyStats, availability, ratings] = await Promise.all([
        // Daily stats
        db.select({
          count: sql<number>`count(*)`,
          totalMinutes: sql<number>`coalesce(sum(duration_minutes), 0)`
        })
        .from(callernCallHistory)
        .where(and(
          eq(callernCallHistory.teacherId, teacherId),
          gte(callernCallHistory.startTime, todayStart),
          eq(callernCallHistory.status, 'completed')
        )),
        
        // Weekly stats
        db.select({
          count: sql<number>`count(*)`,
          totalMinutes: sql<number>`coalesce(sum(duration_minutes), 0)`
        })
        .from(callernCallHistory)
        .where(and(
          eq(callernCallHistory.teacherId, teacherId),
          gte(callernCallHistory.startTime, weekStart),
          eq(callernCallHistory.status, 'completed')
        )),
        
        // Monthly stats
        db.select({
          count: sql<number>`count(*)`,
          totalMinutes: sql<number>`coalesce(sum(duration_minutes), 0)`
        })
        .from(callernCallHistory)
        .where(and(
          eq(callernCallHistory.teacherId, teacherId),
          gte(callernCallHistory.startTime, monthStart),
          eq(callernCallHistory.status, 'completed')
        )),
        
        // Teacher availability data
        db.select()
        .from(teacherCallernAvailability)
        .where(eq(teacherCallernAvailability.teacherId, teacherId))
        .limit(1),
        
        // Average ratings
        db.select({
          avgStudentRating: sql<number>`avg(student_rating)`,
          avgSupervisorRating: sql<number>`avg(supervisor_rating)`,
          totalRatings: sql<number>`count(case when student_rating is not null or supervisor_rating is not null then 1 end)`
        })
        .from(callernCallHistory)
        .where(and(
          eq(callernCallHistory.teacherId, teacherId),
          eq(callernCallHistory.status, 'completed')
        ))
      ]);
      
      // Calculate average rating
      const avgStudentRating = ratings[0]?.avgStudentRating || 0;
      const avgSupervisorRating = ratings[0]?.avgSupervisorRating || 0;
      const averageRating = (avgStudentRating + avgSupervisorRating) / 2 || 0;
      
      // Get hourly rate (default 500,000 IRR if not set)
      const hourlyRate = availability[0]?.hourlyRate ? parseFloat(availability[0].hourlyRate) : 500000;
      
      // Calculate monthly earnings
      const monthlyMinutes = monthlyStats[0]?.totalMinutes || 0;
      const monthlyHours = monthlyMinutes / 60;
      const monthlyEarnings = monthlyHours * hourlyRate;
      
      // Get leaderboard rank (simplified - in production, use proper ranking query)
      const allTeacherStats = await db.select({
        teacherId: callernCallHistory.teacherId,
        avgRating: sql<number>`avg((student_rating + supervisor_rating) / 2.0)`
      })
      .from(callernCallHistory)
      .where(eq(callernCallHistory.status, 'completed'))
      .groupBy(callernCallHistory.teacherId)
      .orderBy(sql`avg((student_rating + supervisor_rating) / 2.0) desc`);
      
      const rank = allTeacherStats.findIndex(t => t.teacherId === teacherId) + 1;
      
      res.json({
        dailyCalls: dailyStats[0]?.count || 0,
        weeklyCalls: weeklyStats[0]?.count || 0,
        monthlyCalls: monthlyStats[0]?.count || 0,
        dailyMinutes: dailyStats[0]?.totalMinutes || 0,
        weeklyMinutes: weeklyStats[0]?.totalMinutes || 0,
        monthlyMinutes: monthlyMinutes,
        averageRating: averageRating,
        totalRatings: ratings[0]?.totalRatings || 0,
        missedShifts: availability[0]?.missedShifts || 0,
        missedCalls: availability[0]?.missedCalls || 0,
        hourlyRate: hourlyRate,
        monthlyEarnings: monthlyEarnings,
        leaderboardRank: rank || null,
        totalTeachers: allTeacherStats.length,
        weeklyStats: {
          totalCalls: weeklyStats[0]?.count || 0,
          totalMinutes: weeklyStats[0]?.totalMinutes || 0,
          uniqueStudents: 0, // TODO: Implement unique student count
          completionRate: 100 // TODO: Calculate actual completion rate
        },
        monthlyEarnings: {
          basePay: monthlyEarnings,
          bonuses: 0, // TODO: Implement bonus calculation
          total: monthlyEarnings
        }
      });
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Get leaderboard
  app.get("/api/teacher/callern/leaderboard", authenticateToken, requireRole(['Teacher', 'Teacher/Tutor']), async (req: any, res) => {
    try {
      // Get top performers based on ratings and call volume
      const leaderboard = await db.select({
        teacherId: callernCallHistory.teacherId,
        teacherFirstName: users.firstName,
        teacherLastName: users.lastName,
        averageRating: sql<number>`coalesce(avg((student_rating + supervisor_rating) / 2.0), 0)`,
        totalCalls: sql<number>`count(*)`,
        totalMinutes: sql<number>`coalesce(sum(duration_minutes), 0)`
      })
      .from(callernCallHistory)
      .leftJoin(users, eq(callernCallHistory.teacherId, users.id))
      .where(eq(callernCallHistory.status, 'completed'))
      .groupBy(callernCallHistory.teacherId, users.firstName, users.lastName)
      .orderBy(sql`avg((student_rating + supervisor_rating) / 2.0) desc`)
      .limit(20);
      
      // Format with ranks
      const formattedLeaderboard = leaderboard.map((entry, index) => ({
        teacherId: entry.teacherId,
        teacherName: `${entry.teacherFirstName} ${entry.teacherLastName}`,
        averageRating: parseFloat(entry.averageRating?.toString() || '0'),
        totalCalls: entry.totalCalls || 0,
        totalMinutes: entry.totalMinutes || 0,
        rank: index + 1
      }));
      
      res.json(formattedLeaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
  });

  // Admin endpoints for managing teacher authorization
  app.post("/api/admin/callern/authorize-teacher", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { teacherId, hourlyRate, notes } = req.body;
      const authorizedBy = req.user.id;
      
      // Check if already authorized
      const existing = await db
        .select()
        .from(teacherCallernAuthorization)
        .where(eq(teacherCallernAuthorization.teacherId, teacherId))
        .limit(1);
      
      if (existing.length > 0 && existing[0].isAuthorized) {
        return res.status(400).json({ message: 'Teacher already authorized for Callern' });
      }
      
      if (existing.length > 0) {
        // Update existing record
        await db
          .update(teacherCallernAuthorization)
          .set({
            isAuthorized: true,
            authorizedBy,
            authorizedAt: new Date(),
            revokedAt: null,
            notes,
            updatedAt: new Date()
          })
          .where(eq(teacherCallernAuthorization.teacherId, teacherId));
      } else {
        // Create new authorization
        await db.insert(teacherCallernAuthorization).values({
          teacherId,
          authorizedBy,
          isAuthorized: true,
          notes
        });
      }
      
      // Set hourly rate if provided
      if (hourlyRate) {
        const availabilityExists = await db
          .select()
          .from(teacherCallernAvailability)
          .where(eq(teacherCallernAvailability.teacherId, teacherId))
          .limit(1);
        
        if (availabilityExists.length > 0) {
          await db
            .update(teacherCallernAvailability)
            .set({
              hourlyRate: hourlyRate.toString(),
              updatedAt: new Date()
            })
            .where(eq(teacherCallernAvailability.teacherId, teacherId));
        } else {
          await db.insert(teacherCallernAvailability).values({
            teacherId,
            hourlyRate: hourlyRate.toString(),
            isOnline: false,
            morningSlot: false,
            afternoonSlot: false,
            eveningSlot: false,
            nightSlot: false,
            missedShifts: 0,
            missedCalls: 0,
            totalCallsHandled: 0
          });
        }
      }
      
      res.json({ message: 'Teacher authorized for Callern successfully' });
    } catch (error) {
      console.error('Error authorizing teacher:', error);
      res.status(500).json({ message: 'Failed to authorize teacher' });
    }
  });

  // Revoke teacher authorization
  app.post("/api/admin/callern/revoke-teacher", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const { teacherId, reason } = req.body;
      
      await db
        .update(teacherCallernAuthorization)
        .set({
          isAuthorized: false,
          revokedAt: new Date(),
          notes: reason,
          updatedAt: new Date()
        })
        .where(eq(teacherCallernAuthorization.teacherId, teacherId));
      
      // Also set teacher offline
      await db
        .update(teacherCallernAvailability)
        .set({
          isOnline: false,
          updatedAt: new Date()
        })
        .where(eq(teacherCallernAvailability.teacherId, teacherId));
      
      res.json({ message: 'Teacher authorization revoked' });
    } catch (error) {
      console.error('Error revoking authorization:', error);
      res.status(500).json({ message: 'Failed to revoke authorization' });
    }
  });

  // Get list of authorized teachers (for admin)
  app.get("/api/admin/callern/authorized-teachers", authenticateToken, requireRole(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const authorizedTeachers = await db
        .select({
          teacherId: teacherCallernAuthorization.teacherId,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          authorizedAt: teacherCallernAuthorization.authorizedAt,
          authorizedBy: teacherCallernAuthorization.authorizedBy,
          isAuthorized: teacherCallernAuthorization.isAuthorized,
          hourlyRate: teacherCallernAvailability.hourlyRate,
          isOnline: teacherCallernAvailability.isOnline,
          morningSlot: teacherCallernAvailability.morningSlot,
          afternoonSlot: teacherCallernAvailability.afternoonSlot,
          eveningSlot: teacherCallernAvailability.eveningSlot,
          nightSlot: teacherCallernAvailability.nightSlot
        })
        .from(teacherCallernAuthorization)
        .leftJoin(users, eq(teacherCallernAuthorization.teacherId, users.id))
        .leftJoin(teacherCallernAvailability, eq(teacherCallernAuthorization.teacherId, teacherCallernAvailability.teacherId))
        .where(eq(teacherCallernAuthorization.isAuthorized, true));
      
      res.json(authorizedTeachers);
    } catch (error) {
      console.error('Error fetching authorized teachers:', error);
      res.status(500).json({ message: 'Failed to fetch authorized teachers' });
    }
  });
}