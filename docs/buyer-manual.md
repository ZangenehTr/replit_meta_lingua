# MetaLingo Academy — Buyer Manual

**Version:** 1.4.0  
**Last Updated:** April 4, 2026  
**Audience:** Institute Owners, Administrators, Department Heads

---

## Welcome

Congratulations on choosing MetaLingo Academy. This manual covers everything you need to know to operate the platform — from daily administration to advanced configuration. Read it from start to finish on your first setup, then use it as a reference later.

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
12. [Private Classes & Session Packages](#12-private-classes--session-packages)
13. [Course Reviews](#13-course-reviews)
14. [Referral Program](#14-referral-program)
15. [LinguaQuest Gamification](#15-linguaquest-gamification)
16. [Testing & Placement](#16-testing--placement)
17. [HR Module](#17-hr-module)
18. [VoIP Integration](#18-voip-integration)
19. [AI Features](#19-ai-features)
20. [AI Content & SEO Pipeline](#20-ai-content--seo-pipeline)
21. [Admin AI Copilot](#21-admin-ai-copilot)
22. [CMS — Blog & Video Library](#22-cms--blog--video-library)
23. [Course Landing Pages](#23-course-landing-pages)
24. [Homepage Content Editor](#24-homepage-content-editor)
25. [SMS Campaigns](#25-sms-campaigns)
26. [Settings & Configuration](#26-settings--configuration)
27. [User Roles Reference](#27-user-roles-reference)
28. [Troubleshooting Common Issues](#28-troubleshooting-common-issues)

---

## 1. Understanding User Roles

MetaLingo uses **8 distinct roles**, each with its own dashboard, navigation, and permissions. A user can only hold one role at a time.

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
When a student clicks **Enroll** on any course, an enrollment confirmation dialog opens. The dialog includes a collapsible **Promo Code** section. Students click it to expand, enter their code, and click **Apply**. The system validates the code instantly — if valid, the original price is shown with strikethrough and the discounted final price is displayed in green. The student then confirms the enrollment with the discounted price already applied. Invalid or expired codes show a clear inline error message.

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

### Post-Session Ratings
After every CallerN session ends, both parties are prompted to rate:
- **Student rates the teacher** (1–5 stars, optional comment)
- **Teacher rates the student** (1–5 stars, internal note)

Teacher ratings are **aggregated in real time** and displayed to students when browsing available tutors. This creates a quality feedback loop with no admin effort required. Admins can view raw rating data from **Admin → CallerN → Session Reports**.

---

## 12. Private Classes & Session Packages

Private classes allow students to book dedicated one-on-one lesson hours with a teacher, separate from the group course catalog.

### Session Packages
A session package is a bundle of private lesson hours sold as a single product. Each package has:
- **Name** and description
- **Number of sessions** included
- **Price** (per package)
- **Min / Max Sub-level**: Only students whose current sub-level falls within the configured range can purchase the package — this prevents mismatches between teacher and student level

### Creating a Session Package
**Admin → Private Classes → Session Packages → New Package**:
1. Enter the package name and number of sessions
2. Set the price
3. Configure the sub-level eligibility range (min and max)
4. Assign available teachers
5. Publish the package

### Sub-level Eligibility
The sub-level system divides each CEFR level (A1, A2, B1, etc.) into granular sub-levels (e.g., A1.1, A1.2, A1.3). Each student's current sub-level is determined by their placement test result or manually set by an admin. When a student browses session packages, only packages where their sub-level falls between the package's min and max are shown — ensuring appropriate level matching.

### Student Booking Flow
1. Student navigates to **Private Classes** in their menu
2. Eligible session packages are displayed (filtered to their sub-level)
3. Student purchases a package
4. They can then book individual sessions from their remaining balance of hours

### Admin View
**Admin → Private Classes** shows:
- All session packages with availability and purchase stats
- Active bookings and upcoming sessions per teacher
- Per-student session history and remaining hours

---

## 13. Course Reviews

Course reviews let enrolled students publicly rate and comment on courses they have completed, building trust for prospective students.

### How Students Submit Reviews
1. Student navigates to their enrolled course and opens the **Reviews** tab inside the course player
2. They select a star rating (1–5) and optionally write a title and review text
3. The review is submitted and enters the **moderation queue** — it is not yet visible publicly

### Admin Moderation Queue
Go to **Admin → Review Moderation** to see all pending reviews.

For each review you can:
- **Approve** — makes the review visible on the public course page
- **Reject** — hides the review permanently (the student is not notified)
- **Feature** — marks the review as highlighted; featured reviews appear at the top of the course listing

### Public Display
Approved reviews appear on the course page with:
- Star rating and average rating summary
- Reviewer first name and date
- Featured reviews shown first

### Helpful Votes
Logged-in students can mark reviews as "helpful". The helpful count is shown next to each review and influences the display order.

### Admin Tips
- Approve reviews quickly — they are a powerful enrollment conversion tool
- Feature 2–3 of your best reviews per course for maximum impact
- A course with no approved reviews shows no rating — run a review campaign via SMS after course completion

---

## 14. Referral Program

The referral program rewards existing students for bringing new students to the institute. It runs automatically with no manual administration needed day-to-day.

### How It Works
1. Each student receives a **unique referral code** (auto-generated on first access)
2. They share their personal referral link via WhatsApp, SMS, or copy-paste
3. When a new person registers using that link, the referral is recorded
4. When that new person **completes their first enrollment and payment**, both receive wallet credits automatically:
   - **Referrer** receives a credit to their wallet (configurable amount)
   - **New student** receives a welcome credit applied to their first purchase

### Student Referral Page
Students access their referral dashboard from **My Account → Referral Program** (or the Referral item in their navigation). They can see:
- Their personal referral link (general)
- Per-course referral links (same code, pre-filled course parameter — useful for sharing a specific course)
- One-tap share buttons: **WhatsApp**, **SMS**, and **Copy Link**
- Live stats: total clicks, sign-ups, and total credits earned

### Admin Referral Leaderboard
**Admin → Referral Leaderboard** shows:
- Rankings of top referring students
- Total referrals, total converted, and total credits paid per student
- Global program stats: total referrals, conversion rate, and total credits issued

### Configuring Credit Amounts
**Admin → Settings → Referral Program**:
- **Referrer Credit Amount** — wallet credit paid to the student who shared the link (in Toman)
- **Referred Credit Amount** — welcome wallet credit paid to the newly registered student (in Toman)
- **Active** — toggle the entire program on or off

### UTM Attribution (for Marketing Teams)
All referral links automatically include UTM parameters. If your marketing team runs campaigns on social media or email, append `?utm_source=instagram&utm_medium=post&utm_campaign=spring2026` to any registration URL. These values are captured at registration and on every payment, enabling cost-per-acquisition reporting.

---

## 15. LinguaQuest Gamification

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

## 16. Testing & Placement

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

## 17. HR Module

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

## 18. VoIP Integration

MetaLingo integrates with **Issabel PBX** via the AMI (Asterisk Manager Interface).

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

## 19. AI Features

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

## 20. AI Content & SEO Pipeline

The AI Content & SEO Pipeline (added in v1.3.0) enables admins to generate, review, and publish blog posts, landing pages, and social media content using the local Ollama AI model — all without manual writing.

### Prompt Template Library

Admins manage a library of reusable prompt templates from **Admin → CMS → Prompt Templates**. Each template defines:

- **Name** — a descriptive label (e.g., "Course Announcement Blog Post")
- **Template text** — the prompt sent to Ollama, with placeholders such as `{topic}`, `{keywords}`, `{tone}`, and `{length}`
- **Content type** — Blog Post, Landing Page, or Social Media

Templates can be created, edited, duplicated, and deleted. They are reusable across many content generation jobs.

### Generating Content

From **Admin → CMS → Blog** or **Admin → CMS → Landing Pages**, click **AI Generate**:

1. Select a prompt template from the library
2. Fill in the template variables (topic, keywords, desired tone, target length)
3. Click **Generate** — the system enqueues an async job and returns a job ID immediately (no waiting for slow AI)
4. When the job completes, the draft appears in the content list with status **Draft** and the `AI Generated` badge

The generation runs via a background BullMQ worker, so the admin UI stays responsive during generation.

### Approval Workflow (Draft → Review → Publish)

All AI-generated content starts as a **Draft** and must pass through the approval workflow before going live:

| Status | Who Acts | What Happens |
|---|---|---|
| **Draft** | Supervisor reviews | Supervisor reads, edits if needed, then approves or rejects |
| **Pending Admin Review** | Admin gives final sign-off | Required when the content policy mandates a second approval |
| **Approved** | Admin or Supervisor | Content is ready to publish |
| **Published** | Admin schedules or publishes immediately | Content goes live on the site |
| **Rejected** | Supervisor or Admin | Content is hidden; reason noted for the writer |

Supervisors review from **Supervisor → Content Review Queue**. Admins see all pending approvals from **Admin → CMS → Review Queue**.

### Scheduled Publisher

Instead of publishing immediately, admins can schedule a future publish date and time for any approved post. A background scheduler (runs every 5 minutes) automatically promotes scheduled posts to **Published** when their scheduled time arrives — no manual action required.

To schedule: open the approved post → click **Schedule** → pick date and time → confirm.

### Auto-Filled SEO Fields

When AI generates content, the following SEO fields are automatically populated based on the generated text:

| Field | What It Contains |
|---|---|
| **Meta Title** | An SEO-optimized title (≤60 characters) |
| **Meta Description** | A concise summary for search engine snippets (≤160 characters) |
| **Keywords** | A comma-separated list of relevant keywords extracted from the content |

Admins can review and edit these fields before publishing. They are stored on the post and rendered in the page's `<head>` tags for search engine indexing.

### sitemap.xml Auto-Updates

Every time a post is published (immediately or via the scheduler), the platform regenerates `sitemap.xml` automatically. Search engine crawlers (Google, Bing, etc.) can discover and index new content without any manual sitemap submission.

The sitemap is served at `https://yourdomain.com/sitemap.xml`.

---

## 21. Admin AI Copilot

The Admin AI Copilot is a conversational AI assistant built directly into the admin panel. It understands the MetaLingo platform and can answer questions, analyze data, and help you take action — all in plain language (Persian or English).

### Accessing the Copilot
Navigate to **Admin → AI Copilot** in the admin sidebar. The copilot opens as a chat interface.

### What It Can Do
- Answer questions about students, courses, payments, and leads ("How many students enrolled this month?", "What is the status of lead #452?")
- Explain platform features and how to use them
- Help you draft SMS campaigns or announcement texts
- Analyze performance trends ("Which courses have the most drop-offs?")
- Guide you through configuration tasks step by step

### How to Use It
Type your question or request in the chat box and press Enter or click Send. The AI responds immediately with a streaming reply — you see the answer appear word by word, just like a chat conversation.

### Conversation History
Your conversations are saved. Click the **New Conversation** button to start a fresh topic, or scroll up to review previous exchanges. Each conversation is stored under your admin account and visible only to you.

### AI Provider
The copilot uses ArvanCloud (Qwen3-30B-A3B model) as its primary AI provider. If ArvanCloud is unavailable, it falls back to OpenAI. Your DevOps team configures the API keys during deployment.

### Tips for Best Results
- Be specific: "Show me students who haven't completed their first lesson" gets better results than "show me students"
- You can ask follow-up questions — the copilot remembers your conversation context
- Use Persian or English — both work equally well

---

## 22. CMS — Blog & Video Library

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

## 23. Course Landing Pages

MetaLingo includes five pre-built Farsi-language SEO landing pages, one for each core program. These are public pages designed to rank in Iranian search engines and convert visitors into enrolled students.

### The Five Landing Pages

| URL | Program |
|---|---|
| `/courses/ielts` | IELTS Preparation |
| `/courses/toefl` | TOEFL Preparation |
| `/courses/gre` | GRE Test Preparation |
| `/courses/pte` | PTE Academic |
| `/courses/conversation` | English Conversation |

Each page includes:
- **Hero section**: Program name, tagline, and registration CTA
- **Features**: What the student gets from the program
- **CallerN highlight**: How on-demand tutoring helps them prepare
- **Pricing**: Displayed tier cards
- **Testimonials**: Student reviews
- **FAQ**: Common questions about the program
- **Structured data**: JSON-LD markup for search engine rich results (Google, Bing)

### Editing Landing Pages
Go to **Admin → Landing Pages** to view and edit all five landing pages. You can update the content of each page directly from the admin panel — no code changes needed.

Fields you can edit:
- Hero title and subtitle
- Feature list items
- Pricing tiers and prices
- Testimonials (name, quote, result)
- FAQ questions and answers

Changes are published immediately after saving.

---

## 24. Homepage Content Editor

The homepage is the first thing visitors see. The Homepage Content Editor lets you customize the key marketing copy without touching the codebase.

### Accessing the Editor
Go to **Admin → Homepage Content**.

### What You Can Edit
- **Hero Headline**: The large title at the top of the homepage
- **Hero Subtitle**: The supporting line below the headline
- **Statistics**: The numbers shown in the "why MetaLingo" bar (e.g., "12,000+ students", "98% pass rate")
- **Feature Cards**: The three or four highlight cards below the hero
- **Call-to-Action Text**: The main CTA button label

### How It Works
1. Open **Admin → Homepage Content**
2. Edit the fields you want to change
3. Click **Save**
4. The homepage reflects your changes immediately — no rebuild or restart required

---

## 25. SMS Campaigns

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

## 26. Settings & Configuration

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

## 27. User Roles Reference

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
- Rate tutors after CallerN sessions
- Submit course reviews (on completed courses)
- Access personal referral program (share links, view stats, earn credits)
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

## 28. Troubleshooting Common Issues

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

### Reviews Not Appearing on Course Page
1. Reviews must be **approved** from **Admin → Review Moderation** before they display publicly
2. If a student submitted a review but cannot submit another, check whether they already have a review for that course (only one review per student per course is allowed)
3. Average rating on the course card updates immediately after the first approved review

### Referral Credits Not Being Awarded
1. Credits are paid **on the new student's first completed payment**, not on registration — this is by design to prevent abuse
2. Confirm the referral program is **Active** in **Admin → Settings → Referral Program**
3. Confirm the credit amounts are set to a non-zero value in settings
4. Check the referral code was present in the registration URL (`?ref=XXXX`) — if the new student navigated directly to the site without the link, the referral is not tracked

### UTM Tracking Not Showing in Analytics
1. UTM parameters must be appended to the **registration URL** (e.g., `https://yourdomain.com/register?utm_source=instagram`)
2. They are captured at the moment of account creation — UTM data from later visits is not retroactively applied
3. To view captured data, query the `users` table: `utm_source`, `utm_medium`, `utm_campaign` columns

---

*For technical deployment questions, refer to the [Deployment Guide](./deployment-guide.md).*  
*For platform architecture details, refer to the [README](./README.md).*
