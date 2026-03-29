# Meta Lingua Academy — Buyer Manual

**Version:** 1.0.0  
**Last Updated:** March 29, 2026  
**Audience:** Institute Owners, Administrators, Department Heads

---

## Welcome

Congratulations on choosing Meta Lingua Academy. This manual covers everything you need to know to operate the platform — from daily administration to advanced configuration. Read it from start to finish on your first setup, then use it as a reference later.

---

## Table of Contents

1. [Understanding User Roles](#1-understanding-user-roles)
2. [First-Time Setup Checklist](#2-first-time-setup-checklist)
3. [Admin Dashboard](#3-admin-dashboard)
4. [Student Management](#4-student-management)
5. [Course & Curriculum Management](#5-course--curriculum-management)
6. [Enrollment & Payments](#6-enrollment--payments)
7. [Promo Codes](#7-promo-codes)
8. [Digital Certificates](#8-digital-certificates)
9. [Call Center ERP](#9-call-center-erp)
10. [Class Scheduling](#10-class-scheduling)
11. [CallerN — 24/7 Video Tutoring](#11-callern--247-video-tutoring)
12. [LinguaQuest Gamification](#12-linguaquest-gamification)
13. [Testing & Placement](#13-testing--placement)
14. [HR Module](#14-hr-module)
15. [VoIP Integration](#15-voip-integration)
16. [AI Features](#16-ai-features)
17. [CMS — Blog & Video Library](#17-cms--blog--video-library)
18. [SMS Campaigns](#18-sms-campaigns)
19. [Settings & Configuration](#19-settings--configuration)
20. [User Roles Reference](#20-user-roles-reference)
21. [Troubleshooting Common Issues](#21-troubleshooting-common-issues)

---

## 1. Understanding User Roles

Meta Lingua uses **8 distinct roles**, each with its own dashboard, navigation, and permissions. A user can only hold one role at a time.

| Role | Who Uses It | Key Access |
|---|---|---|
| **Admin** | Institute owner / IT manager | Everything — full system control |
| **Supervisor** | Academic director | Courses, teachers, performance, analytics |
| **Teacher / Tutor** | Class instructors | Their classes, student progress, content |
| **Student** | Learners | Courses, certificates, gamification, tutoring |
| **Front Desk** | Reception staff | Bookings, enrollment, lead intake |
| **Mentor** | Academic coaches | Assigned students, learning paths |
| **Call Center Agent** | Sales/outreach team | Lead CRM pipeline, trial bookings |
| **Accountant** | Finance staff | Transactions, wallet, payroll view |

Roles are assigned by an Admin from the **Users** section.

---

## 2. First-Time Setup Checklist

Complete these steps in order after your server is running.

### Step 1 — Log In as Admin
Use the phone number registered as admin during deployment. You will receive an OTP via SMS to your Kavenegar-connected line.

### Step 2 — Configure Institute Settings
Go to **Admin → Settings** and fill in:
- Institute name (appears on certificates, emails, SMS)
- Logo URL or upload your logo file
- Default language (recommend: `fa` for Persian)
- Timezone

### Step 3 — Configure Payment Gateway
Go to **Admin → Settings → Payment Gateways** and:
- Select your active gateway (Shetab is default for Iran)
- Enter your gateway credentials
- Run the connectivity test

### Step 4 — Configure SMS
In **Admin → Settings**, enter your Kavenegar API key. All OTP and notification SMS flows depend on this.

### Step 5 — Set Up Certificate Template
Go to **Admin → Certificates** and configure:
- Your institute name (for certificate header)
- Logo URL
- Signature title and name
- Footer note

### Step 6 — Create Curriculum Categories
Go to **Admin → Curriculum Categories** to create language/level groupings (e.g., "English — Beginner", "IELTS Preparation").

### Step 7 — Create Your First Course
Go to **Admin → Courses → New Course** and set:
- Title, language, level
- Curriculum category
- Price
- Lessons/content

### Step 8 — Add Staff Accounts
Go to **Admin → Users → Add User**, select the appropriate role, and provide the phone number. The user will log in via OTP.

---

## 3. Admin Dashboard

The admin dashboard is your command center. It shows:

- **Live KPIs**: Total students, active enrollments, revenue this month, new leads
- **Recent Activity**: Latest enrollments, payments, lead updates
- **Infrastructure Status**: Server health, AI service, Redis, VoIP connectivity
- **Quick Links**: Jump to most-used sections

The dashboard updates automatically. No page refresh needed.

---

## 4. Student Management

### Finding a Student
Go to **Admin → Users** and search by name or phone number. Click any student to see their full profile.

### Student Profile Shows
- Personal details and contact info
- Wallet balance
- Enrolled courses and progress per course
- Certificate history
- Gamification stats (XP, level, badges)
- Session history (tutoring, classes)
- Payment history

### Editing a Student Account
From the student profile, you can:
- Update contact details
- Manually adjust wallet balance (with reason note)
- Change enrollment status
- Assign a mentor

### Blocking / Deactivating
Set a user's `isActive` to false to prevent login. Their data is preserved.

---

## 5. Course & Curriculum Management

### Creating a Course
**Admin → Courses → New Course**

Required fields:
- **Title**: The course name (shows to students)
- **Language**: Teaching language
- **Level**: Proficiency level (A1, A2, B1, B2, C1, C2, or custom)
- **Curriculum Category**: Groups this course in the catalog
- **Price**: In Rials (0 = free)
- **Duration**: In weeks
- **Max Students**: Capacity limit (0 = unlimited)

Optional:
- Description (rich text)
- Prerequisites
- Certificate eligibility toggle

### Adding Lessons to a Course
From the course detail page, click **Add Lesson** and set:
- Lesson title
- Content type: Video / Text / Audio / Quiz
- Order number (determines sequence)
- Video file upload or embed URL

### Publishing a Course
Courses are **Draft** by default. Change status to **Published** to make them visible in the student catalog.

### Curriculum Categories
These group courses in the public catalog. Go to **Admin → Curriculum Categories** to add, edit, or reorder them. Each category can have a description and color.

---

## 6. Enrollment & Payments

### How Students Enroll
1. Student browses the public course catalog
2. Clicks "Enroll" on a course
3. Chooses payment method: Wallet or Payment Gateway
4. Completes payment
5. Gains immediate access to course content

### Payment Methods Available
| Method | How It Works |
|---|---|
| **Wallet** | Student's pre-loaded wallet balance is deducted instantly |
| **Shetab / Zarinpal / IDPay / Zibal / Mellat** | Student is redirected to the gateway's payment page, then returned after confirmation |

### Admin-Side Enrollment
You can enroll a student manually from **Admin → Enrollments → Add**. Select student and course, choose payment method (can mark as "complimentary" with zero charge).

### Viewing Transactions
**Admin → Finance → Transactions** shows all wallet top-ups and course payments with:
- Amount, date, status, gateway reference number
- Student name, course name
- Promo code applied (if any)

---

## 7. Promo Codes

### Creating a Promo Code
Go to **Admin → Promo Codes → New Code** and configure:

| Field | Description |
|---|---|
| **Code** | The code students type at checkout (e.g., `SUMMER25`) |
| **Type** | Percentage (e.g., 20% off) or Fixed amount (e.g., 50,000 Rials off) |
| **Value** | The discount amount |
| **Min Purchase Amount** | Minimum cart value to qualify |
| **Max Uses** | Total uses across all students (leave blank = unlimited) |
| **Single Use Per Student** | Each student can use it only once |
| **Expiry Date** | Auto-deactivates after this date |
| **Applicable Courses** | Leave blank for all courses, or specify certain courses |

### How Students Use Promo Codes
At checkout, students enter the code in the promo code field. The discount is applied and shown before payment confirmation.

### Tracking Usage
From the promo code detail page you can see:
- How many times used vs. max allowed
- List of students who used it and when
- Revenue saved (total discounts given)

### Deactivating a Code
Toggle the **Active** switch to disable a code without deleting it (preserves usage history).

---

## 8. Digital Certificates

### How Certificates Work
Certificates are issued **automatically** when a student completes all lessons in a course. There is no manual step required from the student or admin.

### What Triggers Auto-Issuance
- Student watches/completes the final lesson → system checks completion → certificate generated immediately
- If the student visits their Certificates page and completion is detected, any missed certs are issued automatically in the background

### Certificate Content
Each certificate includes:
- Student full name
- Course title, language, level
- Issue date
- Unique certificate number
- Institute name, logo, and signature (from your template settings)
- QR code / verification URL

### Downloading Certificates
Students can download their certificate as a PDF from **My Certificates** in their dashboard. A browser-print fallback is provided if the PDF server is unavailable.

### Public Verification
Anyone with a certificate number can verify it at:
```
https://yourdomain.com/verify-certificate/[certificate-number]
```
This works without logging in, perfect for employers or universities checking credentials.

### Admin Certificate Management
**Admin → Certificates** lets you:
- Search all issued certificates by student, course, or number
- View certificate details and status
- Revoke a certificate (with mandatory reason note)
- Re-issue a certificate to a student (creates new cert, keeps revoked one as audit record)
- Download any certificate as PDF
- Configure the certificate template (logo, institute name, footer)

### Configuring the Certificate Template
**Admin → Certificates → Template Settings**:
- Institute Name
- Logo (URL or file upload)
- Signature Title and Name
- Footer Note (e.g., "Accredited by…")

---

## 9. Call Center ERP

The Call Center ERP is your sales pipeline for converting prospects into enrolled students.

### Pipeline Stages (24 stages)
The pipeline follows this order:
1. New Lead → 2. Contacted → 3. Interested → 4. Demo Scheduled → 5. Demo Completed → 6. Follow-up → 7. Proposal Sent → 8. Negotiating → 9. Trial Booked → 10. Trial Completed → 11. Enrollment Ready → 12. Enrolled → ... → 24. Closed/Won

Each stage transition is logged with timestamp, agent name, and field changes.

### Adding a New Lead
**Call Center → Leads → Add Lead**:
- Phone number (normalized automatically)
- Name, email (optional)
- Language of interest
- Source (walk-in, referral, social media, etc.)
- Notes

### Moving a Lead Through Stages
Open the lead profile and click the stage action button. The system validates that the transition is allowed (not all jumps are permitted — stages must progress sequentially).

### Automatic SMS on Stage Changes
Certain transitions automatically send SMS to the lead via Kavenegar:
- Demo confirmed
- Trial session reminder
- Enrollment confirmation

### Trial Session Booking
From a lead at the "Trial Booked" stage, click **Book Trial Session** and select:
- Teacher
- Date and time
- Session type (in-person / online)
- Class room or video link

### Activity Log
Every lead has a full history of all changes — who changed what, and when. This is viewable from the lead detail page under **Activity Log**.

---

## 10. Class Scheduling

### Creating a Class Session
**Admin → Schedule → New Session**:
- Course
- Teacher
- Date, start time, end time
- Room (in-person) or auto-generate video link (online)
- Max participants

### Calendar Views
The schedule is viewable as:
- **Daily**: Hour-by-hour for one day
- **Weekly**: Side-by-side columns per day
- **Monthly**: Overview grid

### Student View
Students see their upcoming sessions in their dashboard and receive SMS reminders (if configured).

### Teacher View
Teachers see only their own sessions and can mark attendance from the session detail page.

---

## 11. CallerN — 24/7 Video Tutoring

CallerN is the on-demand video tutoring module. Students can book live one-on-one or group sessions with available tutors at any time.

### How Students Book
1. Go to **CallerN** in their student menu
2. Browse available tutors (filtered by language, level)
3. Pick a time slot
4. Session is confirmed and a video room link is generated

### How Teachers Use CallerN
1. Set their availability schedule
2. Accept or decline booking requests
3. Join the session at the booked time via the video room link

### Video Room Features
- WebRTC peer-to-peer video (no external service required)
- Screen sharing
- Recording (saved to server)
- AI-generated session summary
- Auto-generated quiz from session content

### AI Supervisor
During sessions, the AI Supervisor can:
- Monitor speaking time balance
- Flag vocabulary or grammar issues for follow-up
- Generate a post-session report

---

## 12. LinguaQuest Gamification

LinguaQuest turns language learning into an engaging experience.

### How It Works for Students
- Earn **XP** (experience points) for every lesson watched, quiz completed, and session attended
- Level up as XP accumulates
- Unlock **achievement badges** (e.g., "First Lesson", "7-Day Streak", "Perfect Score")
- Complete **Daily Challenges** for bonus XP

### Available Game Types
| Game | Focus |
|---|---|
| Word Match Kids | Vocabulary for beginners |
| Vocab Challenge | Vocabulary for intermediate+ |
| Grammar Quest | Grammar rules |
| Story Builder | Writing and creativity |
| Listen & Choose | Listening comprehension |
| Reading Pro | Reading speed and comprehension |
| Conversation Practice | Speaking patterns |
| Business English | Professional vocabulary |
| Academic Writing | Academic register |
| Color Grammar | Grammar with visual cues |
| Debate Master | Advanced argumentation |
| Professional Listening | Business listening |

### Admin View
Admins can see leaderboards, XP distribution, and which games are most popular from **Admin → Analytics → Gamification**.

---

## 13. Testing & Placement

### Placement Test (Guest Flow)
Prospective students can take a placement test **without creating an account**:
1. Click "Placement Test" on the public site
2. Complete the AI-adaptive Multi-Stage Test (MST)
3. Receive their CEFR level result (A1–C2) instantly
4. The result is saved and linked when they register

The test uses IRT (Item Response Theory) scoring for accuracy.

### Question Types
The testing system supports 8 question formats:
- Multiple Choice (text)
- Multiple Choice (image)
- Fill in the Blank
- True / False
- Matching
- Ordering / Sequencing
- Listening Comprehension (audio)
- Reading Comprehension (passage + questions)

### Creating Tests
**Admin → Tests → New Test**:
- Add questions manually or use AI generation (provide a topic and level)
- Set passing threshold
- Configure time limit
- Assign to a course as a completion requirement (optional)

### Analytics
**Admin → Analytics → Testing** shows:
- Pass/fail rates per test
- Average score distribution
- Most-missed questions
- Individual student score history

---

## 14. HR Module

### Employee Directory
**Admin → HR → Employees** lists all staff. Each employee record contains:
- Personal details and contact info
- Role and department
- Join date
- Linked user account (for system login)

### Contracts
Each employee can have multiple contracts on file with:
- Contract type (permanent, fixed-term, part-time)
- Start and end dates
- Salary details

### Leave Management
Employees submit leave requests from their own dashboard. Admins and supervisors review, approve, or reject requests from **HR → Leave Requests**.

Leave types: Annual, Sick, Emergency, Unpaid.

### Payroll
Monthly payroll records are stored per employee with:
- Base salary
- Additions (bonuses, overtime)
- Deductions (absence, advances)
- Net pay

Payroll is managed from **Admin → HR → Payroll**.

### Performance Scoring
The system automatically calculates monthly KPI scores per role:

| Role | KPIs Tracked |
|---|---|
| Teacher | Lesson completion rate, student satisfaction, punctuality |
| Call Center Agent | Leads converted, response time, trial bookings |
| Mentor | Student progress improvement, session frequency |
| Supervisor | Team performance, course quality |
| Front Desk | Enrollment processed, booking accuracy |

Anomaly detection alerts admins when performance drops significantly. Thresholds are configurable in **Admin → Settings → HR Anomaly Threshold**.

---

## 15. VoIP Integration

Meta Lingua integrates with **Issabel PBX** via the AMI (Asterisk Manager Interface).

### What You Can Do
- **Click-to-call** a lead or student directly from their profile
- Calls are initiated through your office phone system
- Calls can be automatically recorded (MixMonitor)
- Recording files are stored on the server

### Configuration
**Admin → Settings → VoIP**:
- AMI Host (your Issabel server IP)
- AMI Port (default: 5038)
- AMI Username and Secret
- Default outbound trunk

### Diagnostic Tool
**Admin → Infrastructure Status** includes a VoIP connectivity test. It checks TCP connection to port 5038 and sends an AMI Ping to confirm authentication.

---

## 16. AI Features

### Lexi — AI Teaching Assistant
Students interact with Lexi, the AI assistant, from their dashboard. Lexi can:
- Answer language questions
- Explain grammar concepts
- Provide vocabulary exercises on demand
- Give conversation practice prompts

By default, Lexi uses your locally-hosted Ollama model. You can switch to OpenAI in settings.

### AI Lesson Generator
Teachers can generate lesson content by providing a topic, level, and learning objectives. The AI produces:
- Lesson text
- Vocabulary list
- Practice questions
- A suggested activity

Access from **Teacher → My Content → Generate Lesson**.

### Telegram Sales Bot
A 24/7 AI sales agent runs on Telegram. When a prospective student messages the bot:
1. The bot introduces the institute and its offerings
2. Answers questions about courses, pricing, and schedules
3. Collects contact details
4. Creates a lead in the CRM automatically

Configure the bot token in **Admin → Settings → Telegram Bot**.

### AI Placement Test
The placement test uses AI-adaptive questioning (IRT model) to determine student level more accurately than fixed tests, using fewer questions.

---

## 17. CMS — Blog & Video Library

### Blog
**Admin → CMS → Blog**:
- Create, edit, and publish articles
- Rich text editor with image embedding
- Categories and tags
- Published posts appear on the public website

### Video Library
**Admin → CMS → Videos**:
- Upload video files to the server
- Assign to courses or make publicly available
- Streaming is handled server-side (no third-party video host needed)

### Media Manager
**Admin → CMS → Media** is a file manager for all uploaded images, videos, and documents. Files can be linked in blog posts, lesson content, and certificates.

---

## 18. SMS Campaigns

### Creating a Campaign
**Admin → SMS Campaigns → New Campaign**:
- Select recipient group (all students, specific course, specific level, etc.)
- Write your message (character count shown live)
- Schedule: Send now or pick a future date/time

### Delivery Tracking
After sending, the campaign shows:
- Total recipients
- Delivered count
- Failed count (with error details from Kavenegar)

### Use Cases
- Upcoming session reminders
- New course announcements
- Payment deadline reminders
- Holiday greetings

---

## 19. Settings & Configuration

Go to **Admin → Settings** for all global configuration.

### General Settings
| Setting | Description |
|---|---|
| Institute Name | Appears on certificates and SMS |
| Logo | Upload file or enter URL |
| Default Language | System UI default (fa / en / ar) |
| Timezone | Used for scheduling and timestamps |
| Contact Email | For system notifications |

### Payment Settings
| Setting | Description |
|---|---|
| Active Gateway | Which payment gateway is used |
| Gateway Credentials | API keys, merchant IDs per gateway |
| Sandbox Mode | Toggle test mode per gateway |

### AI Settings
| Setting | Description |
|---|---|
| AI Provider | Ollama (local) or OpenAI |
| Ollama Host | URL to your Ollama server (e.g., http://localhost:11434) |
| Ollama Model | Model name (default: llama3.2:3b) |
| OpenAI API Key | Used if OpenAI is selected |

### SMS Settings
| Setting | Description |
|---|---|
| Kavenegar API Key | Your Kavenegar account key |
| Sender Number | The verified Kavenegar line number |

### Certificate Template
| Setting | Description |
|---|---|
| Institute Name | Header on certificate |
| Logo URL | Image shown on certificate |
| Signature Title | e.g., "Academic Director" |
| Signature Name | Person's name on certificate |
| Footer Note | Accreditation text, legal notes |

### HR Settings
| Setting | Description |
|---|---|
| Anomaly Threshold | % drop in performance that triggers alert |
| Notification Phone | Number to receive HR anomaly SMS |

---

## 20. User Roles Reference

### Admin
Full access to everything. Only admins can:
- Add or remove users
- Change user roles
- Configure system settings
- Revoke certificates
- Manage payment gateways

### Supervisor
- View all courses and enrollment data
- View teacher performance and student progress
- Generate reports
- Cannot change system settings

### Teacher / Tutor
- See their assigned classes
- Mark attendance
- Upload lesson content
- View student progress in their courses
- Generate AI lesson content

### Student
- Browse and enroll in courses
- Watch lessons
- Take tests and quizzes
- View gamification stats
- Download certificates
- Book CallerN tutoring sessions
- Manage wallet (top-up, view history)

### Front Desk
- Register new students
- Process enrollments
- Manage trial session bookings
- View the daily schedule

### Mentor
- View assigned students' profiles and progress
- Schedule mentoring sessions
- Add notes to student records
- See learning path recommendations

### Call Center Agent
- Full CRM access (leads, pipeline stages)
- Book and manage trial sessions
- Send SMS to leads
- View team performance (own only)

### Accountant
- View all financial transactions
- View payroll records
- Generate financial reports
- Cannot modify any data

---

## 21. Troubleshooting Common Issues

### Student Cannot Receive OTP
1. Check that the Kavenegar API key is set in Settings
2. Verify the student's phone number is in correct format (+98XXXXXXXXXX)
3. Check Kavenegar dashboard for delivery status
4. Confirm the sender number is active on your Kavenegar account

### Payment Redirect Not Working
1. Ensure `APP_URL`, `BASE_URL`, and `FRONTEND_URL` are all set to the same domain in your `.env` file
2. Confirm the correct gateway is selected in Settings
3. Check the gateway's sandbox/live mode toggle
4. Test connectivity from the gateway settings page

### Certificate Not Auto-Issued
1. Confirm the course has lessons added and the student has completed all of them
2. Check the video progress table — all lessons should show `completed = true`
3. Visit the student's "My Certificates" page — this triggers a background check and will auto-issue if missed
4. Admins can manually issue from **Admin → Certificates → Issue Certificate**

### VoIP Calls Not Connecting
1. Run the diagnostic from **Admin → Infrastructure Status**
2. Confirm the Issabel server is reachable from your server on port 5038
3. Verify AMI credentials in settings match your Issabel configuration
4. Check that the outbound trunk is configured and active in Issabel

### AI Not Responding
1. If using Ollama: confirm the Ollama server is running and accessible at the configured URL
2. If using OpenAI: verify the API key is valid and has credits
3. Check **Admin → Infrastructure Status** for the AI service health indicator

### Video Streaming Issues
1. Confirm the video file is uploaded and the path is correctly stored
2. Check server disk space (videos require significant storage)
3. For CallerN WebRTC: confirm the coturn TURN server is running and accessible
4. Ensure WebSocket connections are not being blocked by Nginx (check upgrade headers)

---

*For technical deployment questions, refer to the [Deployment Guide](./deployment-guide.md).*  
*For platform architecture details, refer to the [README](./README.md).*
