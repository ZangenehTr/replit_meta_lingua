# CRITICAL: You Need to Apply These Fixes to Your Production Server

## The Problem
The fixes I created are only in this development environment. Your production server still has the original bugs:

1. **Missing `night_slot` column** causing teacher API crashes
2. **Student packages not showing** due to missing JOIN in database query
3. **Teachers not appearing** because API uses hardcoded test users instead of authorized teachers

## STEP 1: Run Database Fixes on Production Server

```sql
-- Add missing night_slot column
ALTER TABLE teacher_callern_availability 
ADD COLUMN IF NOT EXISTS night_slot BOOLEAN DEFAULT false;

-- Authorize your real teachers
INSERT INTO teacher_callern_authorization (teacher_id, is_authorized, authorized_by, authorized_at)
SELECT u.id, true, 5, NOW()
FROM users u 
WHERE u.email IN ('dr.smith@institute.com', 'ali.hosseini@institute.com')
  AND u.role = 'Teacher'
  AND NOT EXISTS (SELECT 1 FROM teacher_callern_authorization tca WHERE tca.teacher_id = u.id);

-- Set teachers online
INSERT INTO teacher_callern_availability (teacher_id, is_online, morning_slot, afternoon_slot, night_slot)
SELECT u.id, true, true, true, false
FROM users u 
WHERE u.email IN ('dr.smith@institute.com', 'ali.hosseini@institute.com')
  AND u.role = 'Teacher'
  AND NOT EXISTS (SELECT 1 FROM teacher_callern_availability tca WHERE tca.teacher_id = u.id);
```

## STEP 2: Update Code Files on Production Server

### File 1: `/opt/metalingua/server/database-storage.ts`

**Add this import** (around line 24):
```typescript
teacherCallernAuthorization,
```

**Replace the `getStudentCallernPackages` method** (around line 576):
```typescript
async getStudentCallernPackages(studentId: number): Promise<StudentCallernPackage[]> {
  const result = await db
    .select({
      id: studentCallernPackages.id,
      studentId: studentCallernPackages.studentId,
      packageId: studentCallernPackages.packageId,
      totalHours: studentCallernPackages.totalHours,
      usedMinutes: studentCallernPackages.usedMinutes,
      remainingMinutes: studentCallernPackages.remainingMinutes,
      price: studentCallernPackages.price,
      status: studentCallernPackages.status,
      purchasedAt: studentCallernPackages.purchasedAt,
      expiresAt: studentCallernPackages.expiresAt,
      createdAt: studentCallernPackages.createdAt,
      updatedAt: studentCallernPackages.updatedAt,
      // Package details
      packageName: callernPackages.packageName,
      packageDescription: callernPackages.description,
      packageIsActive: callernPackages.isActive
    })
    .from(studentCallernPackages)
    .innerJoin(callernPackages, eq(studentCallernPackages.packageId, callernPackages.id))
    .where(eq(studentCallernPackages.studentId, studentId));

  return result.map(row => ({
    id: row.id,
    studentId: row.studentId,
    packageId: row.packageId,
    totalHours: row.totalHours,
    usedMinutes: row.usedMinutes,
    remainingMinutes: row.remainingMinutes,
    price: row.price,
    status: row.status,
    purchasedAt: row.purchasedAt,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    package: {
      id: row.packageId,
      packageName: row.packageName,
      description: row.packageDescription,
      isActive: row.packageIsActive,
      totalHours: row.totalHours,
      price: row.price
    }
  })) as StudentCallernPackage[];
}
```

**Add this new method** (after getTeachersForCallern):
```typescript
async getAuthorizedCallernTeachers(): Promise<any[]> {
  const result = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      avatar: users.avatar,
      role: users.role,
      // Authorization info
      isAuthorized: teacherCallernAuthorization.isAuthorized,
      authorizedAt: teacherCallernAuthorization.authorizedAt,
      // Availability info
      isOnline: teacherCallernAvailability.isOnline,
      morningSlot: teacherCallernAvailability.morningSlot,
      afternoonSlot: teacherCallernAvailability.afternoonSlot,
      eveningSlot: teacherCallernAvailability.eveningSlot,
      nightSlot: teacherCallernAvailability.nightSlot
    })
    .from(users)
    .innerJoin(teacherCallernAuthorization, eq(users.id, teacherCallernAuthorization.teacherId))
    .leftJoin(teacherCallernAvailability, eq(users.id, teacherCallernAvailability.teacherId))
    .where(
      and(
        eq(users.role, 'Teacher'),
        eq(users.isActive, true),
        eq(teacherCallernAuthorization.isAuthorized, true)
      )
    );
  
  return result;
}
```

### File 2: `/opt/metalingua/server/routes.ts`

**Replace the teacher endpoint** (around line 15669):
```typescript
// Get available Callern teachers
app.get("/api/student/callern-teachers", authenticateToken, async (req: any, res) => {
  try {
    const { language } = req.query;
    
    // Get authorized Callern teachers from database
    const authorizedTeachers = await storage.getAuthorizedCallernTeachers();
    
    console.log('Found authorized Callern teachers:', authorizedTeachers.length);
    
    // Filter by language if specified
    let callernTeachers = authorizedTeachers;
    
    if (language && language !== 'all') {
      callernTeachers = callernTeachers.filter((teacher: any) => {
        const languages = teacher.languages || ['English'];
        const specializations = teacher.specializations || [];
        return languages.includes(language) || specializations.includes(language);
      });
    }
    
    console.log('Filtered teachers by language:', callernTeachers.length);
    
    // Teachers are already formatted by getAuthorizedCallernTeachers
    const formattedTeachers = callernTeachers.map((teacher: any) => ({
      id: teacher.id,
      firstName: teacher.firstName || teacher.first_name || 'Teacher',
      lastName: teacher.lastName || teacher.last_name || '',
      languages: teacher.languages || ['English', 'Persian'],
      specializations: teacher.specializations || ['General Conversation'],
      rating: teacher.rating || 4.5,
      hourlyRate: teacher.hourlyRate || 600000, // 600k IRR default
      isOnline: teacher.isOnline || false,
      profileImageUrl: teacher.avatar || null
    }));
    
    res.json(formattedTeachers);
  } catch (error) {
    console.error('Error fetching Callern teachers:', error);
    res.status(500).json({ message: "Failed to fetch available teachers" });
  }
});
```

## STEP 3: Restart Application

```bash
pm2 restart metalingua
```

## This Will Fix Both Issues:
1. ✅ Callern packages will show on the Callern page  
2. ✅ Authorized teachers will appear in the UI

**The changes are only in this development environment - you MUST apply them to your production server!**