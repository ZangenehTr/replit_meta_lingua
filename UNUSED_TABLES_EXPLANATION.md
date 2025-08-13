# Explanation of Unused Database Tables

I'll explain what each unused table was designed for. These tables exist in your schema but aren't connected to the application yet.

## 1. AUDIT & LOGGING TABLES

### `auditLogs`
**Purpose**: Track all important actions in the system for security and compliance
- Records who did what, when, and from where
- Tracks login attempts, data changes, permission changes
- Essential for security audits and troubleshooting
- Can help detect unauthorized access or unusual activity

### `emailLogs`
**Purpose**: Track all emails sent by the system
- Records email recipient, subject, content, send time
- Tracks delivery status (sent, delivered, bounced, opened)
- Helps debug email issues and verify communications
- Required for compliance in many countries

### `smsLogs`
**Purpose**: Track all SMS messages sent
- Records phone number, message content, send time
- Tracks delivery status and cost
- Essential for debugging SMS issues
- Helps manage SMS quota and costs

### `voipCallLogs`
**Purpose**: Track all VoIP calls made through the system
- Records call duration, participants, quality metrics
- Links to call recordings if enabled
- Used for billing and quality monitoring
- Required for call center operations

## 2. FINANCIAL TABLES

### `paymentTransactions`
**Purpose**: Detailed record of every financial transaction
- More detailed than the basic `payments` table
- Records payment gateway responses, fees, taxes
- Tracks refunds, chargebacks, disputes
- Essential for financial reconciliation

### `invoiceItems`
**Purpose**: Line items for invoices
- Breaks down what students are paying for
- Supports multiple items per invoice (courses, materials, fees)
- Enables detailed financial reporting
- Required for proper accounting

### `taxSettings`
**Purpose**: Configure tax rates and rules
- Different tax rates for different services/locations
- VAT, GST, or other tax types
- Tax exemption rules
- Required for legal compliance

## 3. ORGANIZATIONAL TABLES

### `institutes`
**Purpose**: Support multiple language institutes on one platform
- Each institute has its own branding, settings, courses
- Enables franchise or multi-branch operations
- Separate data isolation between institutes
- Allows platform to scale to multiple organizations

### `departments`
**Purpose**: Organize institutes into departments
- E.g., "Adult Education", "Children's Program", "Business English"
- Different departments can have different rules, pricing
- Helps organize teachers and courses
- Enables department-level reporting

### `customRoles`
**Purpose**: Create custom user roles beyond the default ones
- Add roles like "Department Head", "Teaching Assistant"
- Define specific permissions for each custom role
- Flexible permission system
- Adapts to different organizational structures

## 4. STUDENT MANAGEMENT TABLES

### `placementTests`
**Purpose**: Initial assessment tests for new students
- Determines student's starting level
- Automated or manual grading
- Links to course recommendations
- Tracks test history

### `placementQuestions`
**Purpose**: Question bank for placement tests
- Multiple question types (multiple choice, essay, speaking)
- Difficulty levels and skill categories
- Reusable across multiple tests
- Supports adaptive testing

### `placementResults`
**Purpose**: Store placement test results
- Student's scores by skill area
- Recommended course level
- Detailed feedback
- Historical record for progress tracking

### `studentReports`
**Purpose**: Periodic progress reports for students/parents
- Automated generation based on performance data
- Teacher comments and recommendations
- Attendance and participation metrics
- Can be emailed to parents

### `parentGuardians`
**Purpose**: Manage parent/guardian information
- Contact details for minors' parents
- Permission settings and notifications
- Access to student progress
- Emergency contact information

### `studentNotes`
**Purpose**: Private notes teachers write about students
- Behavioral observations
- Learning challenges or strengths
- Special accommodations needed
- Not visible to students

## 5. SCHEDULING TABLES

### `eventCalendar`
**Purpose**: Institute-wide events and activities
- Special events, workshops, cultural activities
- Field trips, guest speakers
- Exam schedules
- Social events for students

### `holidayCalendar`
**Purpose**: Define institute holidays and breaks
- National holidays, school breaks
- Affects class scheduling automatically
- Different calendars for different regions
- Helps in planning and billing

### `substitutionRequests`
**Purpose**: Handle teacher absence and substitutions
- Teachers request substitutes for their classes
- Tracks approval workflow
- Notifies substitute teachers
- Ensures classes aren't cancelled

### `classObservations`
**Purpose**: Record classroom observation sessions
- Quality assurance visits by supervisors
- Peer observations for teacher development
- Structured feedback forms
- Links to teacher performance reviews

## 6. EDUCATIONAL RESOURCE TABLES

### `resourceLibrary`
**Purpose**: Central repository of teaching materials
- Lesson plans, worksheets, videos, audio files
- Categorized by level, topic, skill
- Version control for materials
- Sharing between teachers

### `levelAssessmentQuestions`
**Purpose**: Questions for regular level assessments
- Different from placement tests - these are progress checks
- Standardized assessments across all classes
- Tracks learning objectives
- Generates certificates on completion

### `levelAssessmentResults`
**Purpose**: Store results of level assessments
- Pass/fail status for level progression
- Detailed scores by skill area
- Comparison with previous attempts
- Triggers level advancement

### `teacherEvaluations`
**Purpose**: Formal teacher performance evaluations
- Periodic reviews by management
- Student feedback scores
- Peer review results
- Links to professional development plans

### `courseSessions`
**Purpose**: Detailed session planning within courses
- More detailed than basic `sessions` table
- Lesson objectives, materials, homework
- Links to curriculum standards
- Tracks coverage of syllabus

## 7. REFERRAL & MARKETING TABLES

### `referralSettings`
**Purpose**: Configure referral program rules
- Referral bonuses, discount percentages
- Eligibility criteria
- Expiration rules
- Different programs for different user types

### `courseReferrals`
**Purpose**: Track who referred whom for courses
- Links referrer to new student
- Tracks conversion and enrollment
- Calculates rewards
- Prevents fraud

### `referralCommissions`
**Purpose**: Calculate and track referral payments
- Commission amounts earned
- Payment status and history
- Tax withholding if applicable
- Links to wallet transactions

## 8. SYSTEM CONFIGURATION TABLES

### `systemMetrics`
**Purpose**: Track system performance and usage
- User activity metrics
- Performance benchmarks
- Resource usage
- Helps optimize system

### `systemConfig`
**Purpose**: Store system-wide configuration
- Feature flags (enable/disable features)
- System limits and quotas
- Default values
- Environment-specific settings

---

## Summary

These 33 unused tables fall into 8 major categories. They were designed to make Meta Lingua a complete, enterprise-ready language learning platform. 

**Most critical to implement:**
1. Audit logs (security)
2. Communication logs (debugging)
3. Student reports (core feature)
4. Financial tables (proper accounting)

Would you like me to start connecting any of these tables to make them functional? Which category is most important for your immediate needs?