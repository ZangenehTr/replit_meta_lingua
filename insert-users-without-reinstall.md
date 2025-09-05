# Insert Users and Data Without Reinstalling

You can add the production users and Callern setup to your existing deployment without reinstalling the entire application.

## 🎯 Option 1: Direct Database Execution (Recommended)

### Step 1: Connect to your PostgreSQL database
```bash
# Connect to your database
psql -U your_username -d your_database_name

# Or if using connection string:
psql "postgresql://username:password@localhost:5432/metalingua"
```

### Step 2: Execute the setup script
```sql
-- Copy and paste the entire content of setup-complete-callern-test.sql
-- Or run it from file:
\i /path/to/setup-complete-callern-test.sql
```

## 🎯 Option 2: Using Database Management Tool

### If you have pgAdmin, DBeaver, or similar:
1. Open your database connection
2. Create a new query window  
3. Copy the entire content of `setup-complete-callern-test.sql`
4. Execute the script

## 🎯 Option 3: Via Application API (If Needed)

### If database direct access isn't available:

**Create Admin first (via API):**
```bash
curl -X POST http://your-server:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password",
    "firstName": "Admin",
    "lastName": "User", 
    "role": "Admin"
  }'
```

**Then use admin login to create other users via the admin interface**

## 🎯 Option 4: Application Console (If Available)

If your Node.js app has a console/REPL:
```javascript
// Execute the SQL through your database connection
const result = await db.execute(sql`
  -- Your SQL commands here
`);
```

## 🚀 After Insertion

### Verify the setup worked:

**Check users were created:**
```sql
SELECT email, role, "firstName", "lastName", "walletBalance" 
FROM users 
WHERE email IN (
  'admin@test.com',
  'sara.ahmadi@gmail.com', 
  'mohammad.rezaei@gmail.com',
  'dr.smith@institute.com',
  'ali.hosseini@institute.com'
);
```

**Check Callern package:**
```sql
SELECT * FROM "callernPackages" WHERE "packageName" = 'Learn to Speak English';
```

**Check enrollments:**
```sql
SELECT u.email, cp."packageName", ce."hoursRemaining"
FROM "callernEnrollments" ce
JOIN users u ON ce."studentId" = u.id  
JOIN "callernPackages" cp ON ce."packageId" = cp.id;
```

## 🎯 Quick Test Access

**Once inserted, you can immediately login with:**

- **Admin**: `admin@test.com / password`
- **Students**: `sara.ahmadi@gmail.com / password` (30M IRR wallet)
- **Students**: `mohammad.rezaei@gmail.com / password` (30M IRR wallet)
- **Teachers**: `dr.smith@institute.com / password` (Callern authorized)
- **Teachers**: `ali.hosseini@institute.com / password` (Callern authorized)

## ✅ No Application Restart Needed

The data insertion is immediate - no need to restart your application. Users can login right away and:

- Students can access their Callern package
- Teachers can accept Callern sessions  
- Admin can manage the system

Your application continues running while the database gets the new data! 🚀