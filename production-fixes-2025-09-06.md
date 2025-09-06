# Production Fixes for Meta Lingua - 2025-09-06

## Critical Issues Fixed

### 1. Profile Modal Size Issue
**File:** `client/src/components/profile/FirstTimeProfileModal.tsx` (Line 65)
**Fix:**
```tsx
<DialogContent 
  className={`max-w-sm sm:max-w-md mx-auto max-h-[85vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`}
  hideCloseButton
>
```

### 2. Profile Route Redirect Issue  
**File:** `client/src/App.tsx` (Lines 164-179)
**Add this component:**
```tsx
// Profile redirect component based on user role
function ProfileRedirect() {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Redirect students to student profile
  if (user.role === 'Student') {
    return <Redirect to="/student/profile" />;
  }
  
  // For other roles, use the general profile
  return <UserProfile />;
}
```

**And update the route (Line 188):**
```tsx
<Route path="/profile">
  <ProtectedRoute>
    <ProfileRedirect />
  </ProtectedRoute>
</Route>
```

### 3. Callern Teachers Not Showing
**File:** `server/database-storage.ts` (Lines 579-610)
**Add this method:**
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

**File:** `server/database-storage.ts` (Line 24)
**Add import:**
```typescript
callernPackages, studentCallernPackages, teacherCallernAvailability, teacherCallernAuthorization,
```

**File:** `server/routes.ts` (Lines 15671-15705)
**Update the teachers endpoint:**
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

### 4. Student Callern Package Enhancement
**File:** `server/database-storage.ts` (Lines 612-658)
**Update method:**
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

### 5. Purchase Amount Fix
**File:** `server/routes.ts` (Lines 15743-15773)
**Fix wallet balance validation:**
```typescript
// Get user's wallet balance
const walletData = await storage.getUserWalletData(req.user.id);
const packagePrice = parseFloat(selectedPackage.price);

if (!walletData || walletData.walletBalance < packagePrice) {
  console.log(`Wallet check - Balance: ${walletData?.walletBalance}, Package price: ${packagePrice}, Required: ${packagePrice}`);
  return res.status(400).json({ message: "Insufficient wallet balance" });
}

// Deduct from wallet
await storage.updateWalletBalance(req.user.id, -packagePrice);

// Create wallet transaction
await storage.createWalletTransaction({
  userId: req.user.id,
  type: 'purchase',
  amount: -packagePrice,
  description: `Purchased Callern package: ${selectedPackage.packageName}`,
  status: 'completed',
  merchantTransactionId: `CALLERN_${Date.now()}_${req.user.id}`
});

// Purchase the package
const purchasedPackage = await storage.purchaseCallernPackage({
  studentId: req.user.id,
  packageId: packageId,
  price: packagePrice
});

if (!purchasedPackage) {
  // Rollback wallet deduction if purchase fails
  await storage.updateWalletBalance(req.user.id, packagePrice);
  return res.status(400).json({ message: "Failed to purchase package" });
}
```

## Database SQL Updates Required

Run these SQL commands on your production database:

```sql
-- Add missing night_slot column
ALTER TABLE teacher_callern_availability 
ADD COLUMN IF NOT EXISTS night_slot BOOLEAN DEFAULT false;

-- Create Sara's Callern enrollment
INSERT INTO student_callern_packages (
    student_id, package_id, total_hours, remaining_minutes, price, status
)
SELECT 
    u.id, cp.id, cp.total_hours, (cp.total_hours * 60), cp.price, 'active'
FROM users u, callern_packages cp
WHERE u.email = 'sara.ahmadi@gmail.com' 
  AND cp.package_name = 'English Conversation Starter'
  AND NOT EXISTS (
    SELECT 1 FROM student_callern_packages scp 
    WHERE scp.student_id = u.id AND scp.package_id = cp.id
  );

-- Authorize production teachers for Callern
INSERT INTO teacher_callern_authorization (teacher_id, is_authorized, authorized_by, authorized_at)
SELECT u.id, true, 5, NOW()  -- 5 is admin user ID
FROM users u 
WHERE u.email IN ('dr.smith@institute.com', 'ali.hosseini@institute.com')
  AND u.role = 'Teacher'
  AND NOT EXISTS (SELECT 1 FROM teacher_callern_authorization tca WHERE tca.teacher_id = u.id);

-- Set teachers online for testing
INSERT INTO teacher_callern_availability (teacher_id, is_online, morning_slot, afternoon_slot, night_slot)
SELECT u.id, true, true, true, false
FROM users u 
WHERE u.email IN ('dr.smith@institute.com', 'ali.hosseini@institute.com')
  AND u.role = 'Teacher'
  AND NOT EXISTS (SELECT 1 FROM teacher_callern_availability tca WHERE tca.teacher_id = u.id);
```

## Files to Update on Production Server

1. `client/src/components/profile/FirstTimeProfileModal.tsx`
2. `client/src/App.tsx` 
3. `server/database-storage.ts`
4. `server/routes.ts`

After updating these files, restart your Node.js application and run the SQL updates above.