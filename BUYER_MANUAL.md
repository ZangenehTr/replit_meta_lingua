# Meta Lingua — Complete Platform Manual

> **Authentication note:** The platform uses phone-only OTP login via Kavenegar. There are no email/password logins in production. All access begins with entering a phone number and receiving a 6-digit SMS code.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Platform Overview](#2-platform-overview)
3. [User Roles](#3-user-roles)
4. [Authentication System](#4-authentication-system)
5. [Student Management](#5-student-management)
6. [Teacher Management](#6-teacher-management)
7. [Course & Class Management](#7-course--class-management)
8. [CallerN Video Tutoring](#8-callern-video-tutoring)
9. [LinguaQuest Free Learning Platform](#9-linguaquest-free-learning-platform)
10. [Call Center ERP — 24-Stage Pipeline](#10-call-center-erp--24-stage-pipeline)
11. [Financial System](#11-financial-system)
12. [AI Services](#12-ai-services)
13. [Gamification System](#13-gamification-system)
14. [Communication Systems](#14-communication-systems)
15. [Testing & Placement Assessment](#15-testing--placement-assessment)
16. [Analytics & Reporting](#16-analytics--reporting)
17. [White-Label Customization](#17-white-label-customization)
18. [PWA & Mobile Features](#18-pwa--mobile-features)
19. [Database Schema Reference](#19-database-schema-reference)
20. [Development & Testing](#20-development--testing)

---

## 1. Quick Start

### What you need before going live

| Requirement | Purpose | Time to obtain |
|---|---|---|
| **Domain + SSL** | Public URL, HTTPS | 1 day |
| **Kavenegar API key** | OTP login codes for every user | 15 minutes |
| **Shetab merchant account** | Tuition payments, wallet top-ups | 1–2 days |
| **Server (Ubuntu 22.04)** | Self-hosted deployment | Immediate |

### Activation steps

**Step 1 — Get SMS working (15 minutes)**
1. Register at [kavenegar.com](https://kavenegar.com)
2. Copy your API key from the dashboard
3. Add to `.env`: `KAVENEGAR_API_KEY=your_key`
4. Without this, users cannot log in

**Step 2 — Activate payments (1–2 days)**
1. Contact your bank for Shetab gateway access
2. Obtain Merchant ID, Terminal ID, and API Key
3. Add to `.env`:
   ```
   SHETAB_MERCHANT_ID=...
   SHETAB_TERMINAL_ID=...
   SHETAB_API_KEY=...
   SHETAB_CALLBACK_URL=https://yourdomain.com/api/payments/shetab/callback
   ```

**Step 3 — Activate AI (30 minutes)**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve
ollama pull llama3.2:3b
```
Set `OLLAMA_HOST=http://localhost:11434` in `.env`. The app auto-detects and uses Ollama.

**Step 4 — Create your first admin**
```sql
-- Run inside the database container
docker compose exec postgres psql -U metalingua -d metalingua

INSERT INTO users (phone, first_name, last_name, role, is_active, phone_verified, language_preference, created_at)
VALUES ('+989121234567', 'مدیر', 'سیستم', 'admin', true, true, 'fa', NOW());
```
Then log in at `https://yourdomain.com` with that phone number.

---

## 2. Platform Overview

### What is Meta Lingua?

Meta Lingua is a comprehensive AI-enhanced multilingual language learning and institute management platform designed for **complete self-hosting in Iran with zero external dependencies**. It combines traditional language institute management with modern AI-powered learning technologies.

### Key Value Propositions

| Feature | Description |
|---|---|
| **Complete Self-Hosting** | No dependency on blocked or external services |
| **Iranian Market Optimized** | Supports Shetab payments, Kavenegar SMS, Persian calendar |
| **AI-Powered Learning** | Local Ollama integration for personalized education |
| **Multilingual Support** | Persian, English, Arabic with full RTL/LTR |
| **Comprehensive Management** | Full institute operations in one platform |
| **White-Label Ready** | Custom branding for any institute |

### Core Subsystems

| Subsystem | What it does |
|---|---|
| **LMS** | Course creation, enrollment, progress tracking |
| **CallerN** | 24/7 on-demand video tutoring (WebRTC) |
| **LinguaQuest** | Free gamified learning — 23 activity types |
| **Call Center ERP** | Lead-to-enrollment pipeline (24 stages) |
| **Wallet** | IRR-based prepaid credit system |
| **Shetab** | Iranian bank payment gateway integration |
| **AI Services** | Ollama/OpenAI for content, feedback, analysis |
| **Gamification** | XP, levels, achievements, daily challenges |
| **Placement Test** | MST adaptive test → CEFR level → roadmap |
| **Telegram Bot** | 24/7 AI sales agent trained on all features |

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Express.js, TypeScript, Node.js ESM |
| Database | PostgreSQL 14+, Drizzle ORM |
| Real-time | Socket.io, WebRTC (SimplePeer) |
| AI | Ollama (self-hosted), OpenAI (optional fallback) |
| State | TanStack React Query |
| Build | Vite |

---

## 3. User Roles

### 8 Roles Overview

| Role | Persian | Primary Function |
|---|---|---|
| **Admin** | مدیر سیستم | Full system control and configuration |
| **Teacher** | معلم | Direct instruction, CallerN sessions |
| **Student** | دانش‌آموز | Learning, course participation |
| **Mentor** | منتور | Student guidance, progress monitoring |
| **Supervisor** | سرپرست | Quality assurance, teacher evaluation |
| **Call Center Agent** | پشتیبان | Lead management, customer service |
| **Accountant** | حسابدار | Financial operations, reporting |
| **Front Desk Clerk** | پذیرش | Reception, intake, scheduling |

### Permissions Matrix

| Capability | Admin | Teacher | Student | Mentor | Supervisor | Call Center | Accountant | Front Desk |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| User management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Course creation | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Class teaching | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CallerN sessions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lead management | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Financial reports | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Student guidance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Teacher evaluation | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

### Role Detail: Admin

- Full platform access including AI model management
- System configuration and branding
- Financial oversight and payment gateway settings
- Backup and data management
- Audit logs and compliance reports
- Integration settings (Kavenegar, Shetab, Issabel VoIP)

### Role Detail: Teacher

- Class scheduling and management (own classes only)
- Student assessment, grading, and feedback
- Content creation and material upload
- CallerN video tutoring availability toggle
- Earnings tracking for CallerN sessions

### Role Detail: Student

- Phone OTP login and profile management
- Browse and enroll in courses (free and paid)
- Take placement test → get CEFR level → follow roadmap
- Attend classes, submit homework, take quizzes
- Wallet management and Shetab payments
- CallerN package purchase and session access
- LinguaQuest gamified learning (free, no login required to try)
- Mobile bottom navigation (role-specific layout)

### Role Detail: Mentor

- Assigned students overview with progress analytics
- Intervention recommendations (AI-powered)
- Goal setting and milestone tracking
- Communication tools for guidance

### Role Detail: Supervisor

- Class observation scheduling and structured feedback forms
- Teacher performance evaluation (ratings, metrics, trends)
- Quality standards configuration
- Compliance and accreditation monitoring

### Role Detail: Call Center Agent

- Create and manage leads through the 24-stage pipeline
- Call logging and SMS dispatch via Kavenegar
- Follow-up scheduling and callback reminders
- Conversion tracking and funnel analytics
- Auto-dialing via Issabel PBX (AMI integration)

### Role Detail: Accountant

- Revenue analytics (income streams, payment methods)
- Teacher payroll calculations and processing
- Refund handling and payment disputes
- Financial reports, invoice generation
- Shetab transaction reconciliation

---

## 4. Authentication System

### Phone-Only OTP (Primary Method)

The platform uses **phone number + 6-digit OTP** as the only authentication method, optimized for the Iranian market.

```
1. User enters phone number (09XXXXXXXXX or +989XXXXXXXXX)
2. System normalizes to +98XXXXXXXXXX format
3. OTP sent via Kavenegar SMS (6 digits, expires in 10 minutes)
4. User enters OTP
5. JWT access token (24h) + refresh token (7d) issued
6. Session active — no re-login for 24 hours
```

### Phone Number Normalization

| Input | Normalized |
|---|---|
| `09121234567` | `+989121234567` |
| `+989121234567` | `+989121234567` |
| `989121234567` | `+989121234567` |

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/phone/request-otp-login` | POST | Request OTP for existing user |
| `/api/auth/phone/request-otp-signup` | POST | Request OTP for new registration |
| `/api/auth/phone/verify-otp-login` | POST | Verify OTP and log in |
| `/api/auth/phone/verify-otp-signup` | POST | Verify OTP and create account |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout and invalidate session |

### Security Controls

- 5 OTP requests per phone per 15 minutes (rate limiting)
- 90-second resend cooldown
- Iranian phone format validation only (09XXXXXXXXX)
- JWT signed with HS256, secrets min 64 bytes

---

## 5. Student Management

### Student Lifecycle

```
Registration → Placement Test → Level Assignment → Course Selection → Enrollment → Learning → Assessment → Certification
```

### Registration Paths

**Self-registration (student-initiated):**
1. Go to `/auth` → enter phone
2. Verify OTP
3. Complete profile (name, learning goals)
4. Take mandatory MST placement test
5. Browse courses matching their CEFR level

**Admin/Call Center creation:**
1. `Admin → User Management → Create User`
2. Fill in: name, phone (Iranian format), role = Student
3. System sends welcome SMS with first login instructions
4. Student completes placement test on first login

### Student Profile

- Personal info: name, phone, emergency contacts
- Academic history: previous courses, certifications, CEFR level
- Learning analytics: progress, strengths/weaknesses by skill
- Cultural profile: background for personalized AI content
- Wallet balance (IRR)
- CallerN purchased hour packages

### Progress Tracking

- **Skills radar chart**: LRSW (Listening, Reading, Speaking, Writing) visual
- **Timeline view**: milestones and achievements
- **Comparative analysis**: performance vs class average
- **Predictive analytics**: AI-powered success forecasting
- **Attendance tracking**: class and session participation
- **Real-time updates**: after every activity

### How to Update a Student Profile

1. `Admin → Students → [Student Name]`
2. Edit sections: Basic Info, Academic, Preferences, Notes
3. Save — changes take effect immediately

---

## 6. Teacher Management

### Setting Up a New Teacher

1. `Admin → Teachers → Add New Teacher`
2. Fill in:
   ```
   Personal: Full name, phone, qualifications
   Teaching: Specializations, experience level, languages
   Payment: Hourly rate (default 600,000 IRR), CallerN rate
   CallerN: Authorized for video tutoring (Yes/No)
   Availability: Calendar-based schedule
   ```
3. System creates phone-OTP account, sends welcome SMS

### Teacher Payment Calculation

```
Total Payment = Base Salary
              + (Class Hours × Hourly Rate)
              + (CallerN Sessions × Commission Rate)
              + Performance Bonuses
```

To process payments: `Admin → Financial → Teacher Payments` → select period → review auto-calculations → approve.

### Performance Monitoring

| Metric | Source |
|---|---|
| Student satisfaction | Post-session ratings |
| Attendance reliability | Class delivery records |
| Student outcomes | Progress and test scores |
| CallerN engagement | Session duration and feedback |
| TTT ratio | AI Supervisor analysis (per CallerN session) |

### CallerN Teacher Flow

When authorized:
1. Toggle availability to "Online" from teacher dashboard
2. Set preferences: languages, levels, session types
3. System matches available teacher to student requests in real time
4. Session connects via WebRTC — AI Supervisor runs in background
5. Earnings tracked automatically per session

---

## 7. Course & Class Management

### Course Hierarchy

```
Institute
└── Departments (English, Persian, Arabic)
    └── Programs (General, Business, IELTS Prep)
        └── Courses (Beginner English A1, IELTS Speaking B2)
            └── Classes (Monday 9 AM Group A, Online Group B)
                └── Sessions (Individual class meetings)
                    └── Students (Enrolled learners)
```

### Creating a Course

1. `Admin → Course Management → Create Course`
2. Fill in:
   ```
   Title: "Business English A2"
   Language: English | Level: A2 (CEFR)
   Duration: 12 weeks | Sessions/week: 2
   Session duration: 90 minutes
   Class size: 8-12 students
   Price: 2,500,000 IRR (0 = free)
   Prerequisites: A1 completion
   Teacher: [Assign qualified instructor]
   ```
3. Set schedule and room/online assignment
4. Activate for enrollment

> Paid courses (price > 0) require payment before enrollment. Students who try to enroll without paying receive an error directing them to the payment flow. Free courses (price = 0) enroll directly.

### Scheduling Features

- Multi-view calendar: day, week, month, agenda
- Drag-and-drop class time adjustments
- Conflict detection (prevents double-booking teachers/rooms)
- Recurring session generation
- Persian calendar integration for holidays
- Automatic SMS reminders: 24 hours + 1 hour before class

---

## 8. CallerN Video Tutoring

### Overview

CallerN is the 24/7 on-demand video tutoring service. Students purchase hour packages, then connect with available teachers at any time. All sessions are automatically recorded.

### Core Technical Features

| Feature | Details |
|---|---|
| Protocol | WebRTC via SimplePeer |
| Screen sharing | Yes (collaborative learning) |
| Recording | Mandatory, WebM format, 256kbps/20fps |
| Recording storage | `/recordings/YYYY-MM/` (max 500 MB/file) |
| TURN server | Required for cross-NAT internet calls (coturn) |
| AI Supervisor | Real-time analysis during session |

### Student Flow

```
Purchase Package (5/10/15 hours)
     ↓
Start Session from Dashboard
     ↓
Select Focus (Conversation / Grammar / Exam Prep)
     ↓
System Matches Available Teacher
     ↓
WebRTC Video Connection
     ↓
AI Supervisor runs in background
     ↓
Session Auto-Recorded
     ↓
Post-Session Review Available
```

### Sample Package Pricing

| Package | Hours | Price |
|---|---|---|
| Practice Speaking | 5 hours | 2,500,000 IRR |
| IELTS Preparation | 10 hours | 4,500,000 IRR |
| Intensive Course | 15 hours | 6,000,000 IRR |

### AI Supervisor Features (In-Session)

- **Vocabulary suggestions**: context-appropriate words shown to teacher
- **Grammar corrections**: real-time error detection
- **TTT monitoring**: Teacher Talking Time ratio tracking
- **Attention tracking**: MediaPipe facial detection (optional)
- **Auto-transcript**: speech-to-text of full session
- **Grammar rewrite**: AI-improved version of student sentences

### Admin Setup for CallerN

1. `Admin → Callern Management` → authorize teachers
2. Create packages: `Admin → Callern → Packages`
3. Verify TURN server is configured (required for internet calls)
4. Set recording storage path (`ISABEL_VOIP_RECORDING_PATH` or `/recordings`)

---

## 9. LinguaQuest Free Learning Platform

### Overview

LinguaQuest is a free gamified learning platform requiring no account to start. It covers CEFR levels A1–C2 with 23 distinct activity types. Guest progress is tracked per session and converted to registered user progress on signup.

### 23 Activity Types

| # | Type | Description |
|---|---|---|
| 1 | Introduction | Scenario setup with AI audio narration |
| 2 | Vocabulary Practice | Flashcards, galleries, word building |
| 3 | Matching Games | Drag-and-drop, memory games |
| 4 | Conversation Practice | Dialogue roleplay, real scenarios |
| 5 | Pronunciation Challenge | TTS reference audio practice |
| 6 | Listening Comprehension | Audio playback with questions |
| 7 | Fill in the Blank | Text input, story completion |
| 8 | Drag and Drop | Shopping simulations, sorting |
| 9 | Quick Quiz | Multiple-choice with instant feedback |
| 10 | Menu Exploration | Restaurant/food vocabulary |
| 11 | Ordering Practice | Order simulation with polite requests |
| 12 | Symptom Description | Medical vocabulary practice |
| 13 | Prescription Reading | Medical document comprehension |
| 14 | Sentence Reordering | Word order practice |
| 15 | Image Selection | Picture-based vocabulary |
| 16 | True/False Questions | Binary choice exercises |
| 17 | Spelling Challenge | Spelling with audio cues |
| 18 | Vocabulary Matching | Content Bank integration |
| 19 | Synonym/Antonym | Word relationship matching |
| 20 | Word Formation | Tile-based word building |
| 21 | Grammar Battles | Multi-rule quiz with explanations |
| 22 | Cultural Context | Cultural immersion content |
| 23 | Default Step | Fallback for unrecognized types |

### Lesson Structure (JSON)

```json
{
  "title": "At the Restaurant",
  "level": "A2",
  "language": "english",
  "activities": [
    { "type": "introduction", "data": { "narration": "..." } },
    { "type": "vocabulary_gallery", "data": { "words": [...] } },
    { "type": "conversation_practice", "data": { "dialogue": [...] } },
    { "type": "quick_quiz", "data": { "questions": [...] } }
  ]
}
```

### AI Lesson Generator

Admins can generate new LinguaQuest lessons automatically:
- `Admin → LinguaQuest → Generate Lesson`
- Provide: topic, CEFR level, target language, focus skills
- Ollama generates complete lesson JSON with all activity data
- Review and publish

---

## 10. Call Center ERP — 24-Stage Pipeline

### Overview

The Call Center module manages the complete prospect lifecycle from first contact to active student, with mandatory stage validation, full audit trail, and automatic SMS triggers.

### 24 Pipeline Stages

```
contact_desk
  → new_intake
  → follow_up / no_response
  → level_assessment
  → evaluation
  → consultation_cc / consultation_sup
  → pre_registration
  → final_registration
  → enrolled / private_class_setup
  → active class lifecycle stages
```

All transitions are validated by the `LEAD_STAGE_TRANSITIONS` map in `shared/schema.ts`. Invalid jumps (e.g. skipping from `new_intake` to `enrolled`) are rejected with an error.

### Lead Schema (27+ fields)

Key fields on the leads table:
- Withdrawal tracking and reason codes
- Retry scheduling with timestamps
- Follow-up color coding (green/yellow/red)
- Level assessment scores
- Payment status and amount
- Class assignment reference
- Call recording links

### Activity Log (Audit Trail)

Every stage transition writes a row to `lead_activity_log` with:
- Previous and new stage
- Full field snapshot at the time of transition
- Agent ID and timestamp
- Notes and action taken

### Automatic SMS Triggers

| Transition | SMS Content |
|---|---|
| `level_assessment` | "Your placement test has been scheduled" |
| `pre_registration` | "Congratulations! Your spot is reserved" |
| `final_registration` | "Welcome to [Course Name]!" |
| `enrolled` | "Your first class starts [Date/Time]" |
| Withdrawal | Customizable retention message |

### Lead Creation

```json
POST /api/leads
{
  "firstName": "علی",
  "lastName": "محمدی",
  "phone": "09121234567",
  "source": "website",
  "courseTarget": "IELTS",
  "workflowStage": "new_intake"
}
```

### Role Permissions in Call Center

| Role | Capability |
|---|---|
| Admin | Full access to all leads and reports |
| Call Center Agent | Create and manage assigned leads |
| Supervisor | View all, assign agents, export reports |
| Front Desk | Create new intake leads |

---

## 11. Financial System

### Wallet System

- **Currency**: IRR (Iranian Rial)
- **Transaction types**: deposit, withdrawal, payment, refund, top-up
- **Balance**: real-time updates after every transaction
- **Top-up**: via Shetab bank payment → callback credits wallet

### Shetab Payment Gateway

Iran's national payment network. The callback URL `https://yourdomain.com/api/payments/shetab/callback` must be registered exactly as-is in the Shetab merchant portal.

**Payment flow:**
```
1. User initiates payment (course enrollment or wallet top-up)
2. System creates transaction record with COURSE_* or WALLET_* prefix
3. User redirected to Shetab gateway page
4. User enters bank card details
5. Bank processes payment
6. Shetab POSTs callback to /api/payments/shetab/callback
7. Platform verifies HMAC signature
8. If COURSE_*: student enrolled, XP awarded, notification sent
9. If WALLET_*: wallet balance credited
10. User redirected to success page
```

### Member Tiers

| Tier | Spending threshold | Benefit |
|---|---|---|
| Bronze | Default | Standard access |
| Silver | 500,000 IRR spent | 5% discount |
| Gold | 2,000,000 IRR spent | 10% discount, priority support |
| Platinum | 5,000,000 IRR spent | 15% discount, VIP access |

### Teacher Payroll

`Admin → Financial → Teacher Payments`:
1. Select period (weekly/monthly)
2. System auto-calculates: class hours × rate + CallerN commission + bonuses
3. Admin reviews and approves
4. Payslips generated and sent via SMS

### Security

- HMAC signature verification on all Shetab callbacks
- Transaction deduplication (idempotency keys)
- Rate limiting on payment initiation
- Full audit trail for all financial operations
- Dual approval required for large refunds (Admin + Accountant)

---

## 12. AI Services

### Provider Architecture

```
Primary Provider (Ollama — self-hosted)
        ↓ (if unavailable)
Fallback Provider (OpenAI — optional)
```

### Configuration

| Variable | Description | Default |
|---|---|---|
| `OLLAMA_HOST` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.2:3b` |
| `OPENAI_API_KEY` | OpenAI key (fallback only) | — |

### AI Capabilities

| Feature | Provider | Notes |
|---|---|---|
| Content generation | Ollama/OpenAI | Lesson plans, LinguaQuest activities |
| Grammar correction | Ollama/OpenAI | Real-time in CallerN |
| Vocabulary suggestions | Ollama/OpenAI | Context-aware, per session |
| Placement test analysis | Ollama/OpenAI | CEFR assignment from responses |
| Speech-to-text | Whisper | Port 8000, `WHISPER_API_URL` |
| Text-to-speech | Edge TTS | Self-hosted, no external dependency |
| AI Supervisor | Ollama/OpenAI | TTT, grammar rewrite, attention |
| Telegram AI agent | Ollama/OpenAI | Trained on all platform features |

### Connecting AI Services

**Whisper (speech-to-text):**
```env
WHISPER_API_URL=http://localhost:8000
WHISPER_ENABLED=true
```
Test: `curl -X POST http://localhost:8000/transcribe -F "audio=@test.wav"`

**Coqui TTS (text-to-speech alternative):**
```env
TTS_API_URL=http://localhost:5002
TTS_ENABLED=true
TTS_VOICE_MODEL=tts_models/multilingual/multi-dataset/xtts_v2
TTS_LANGUAGE=fa
```
Test: `curl -X POST http://localhost:5002/tts -H "Content-Type: application/json" -d '{"text":"سلام","language":"fa"}'`

**Verify all AI services:**
Check startup logs for these lines:
```
✅ Whisper service available at http://localhost:8000
✅ Ollama service initialized with host: http://localhost:11434
✓ TTS Service initialized with Edge TTS (self-hosted)
```

### Admin AI Dashboard

`Admin → AI Services`:
- Connection status per provider
- Model availability check
- Response latency monitoring
- Error rates and fallback frequency
- Switch primary provider without restart

---

## 13. Gamification System

### XP Earning Activities

| Activity | XP |
|---|---|
| Lesson completion | 100 XP |
| Homework submission | 50 XP |
| Perfect attendance (week) | 200 XP |
| CallerN session (30 min) | 150 XP |
| Test completion | 75 XP |
| Forum participation | 25 XP |
| Daily login | 10 XP |
| Streak bonus | Multiplier on all XP |

### Level Progression

| Level Range | Category | XP per Level |
|---|---|---|
| 1–20 | Beginner | 1,000 XP |
| 21–50 | Intermediate | 2,000 XP |
| 51–80 | Advanced | 3,000 XP |
| 81–100 | Expert | 5,000 XP |

### Achievements

- **Learning**: First lesson, first test, CEFR milestones
- **Consistency**: 7-day streak, 30-day streak, perfect month
- **Excellence**: Perfect test score, rapid level advancement
- **Social**: Forum contributions, peer help

### Daily Challenges

Generated daily based on user level and preferences:
- Vocabulary Builder — learn 10 new words
- Grammar Master — complete grammar exercises
- Speaking Practice — 30-min CallerN session
- Reading Comprehension — complete reading task
- Writing Excellence — submit writing assignment

### Leaderboards

- Global (all users)
- Per class (enrolled students in same course)
- Weekly (recent activity)
- Skill-specific (by LRSW category)

---

## 14. Communication Systems

### SMS (Kavenegar)

Iranian SMS provider used for:
- OTP login codes (mandatory for all logins)
- Class reminders (24h + 1h before)
- Call center stage transition notifications
- Enrollment confirmations
- Marketing campaigns

Rate limits: 100 SMS per 15 minutes, 10 bulk per hour.

### Telegram AI Sales Agent

A 24/7 bot trained on all platform features:
- Set `TELEGRAM_BOT_TOKEN` in `.env`
- Bot responds in Persian with feature details, pricing, and CTAs
- Configured for attractive, novelty-emphasizing messaging
- Handles admission inquiries and routes to call center agents

### In-App Messaging (Socket.io)

- Real-time chat between students, teachers, mentors
- Group messaging per class
- File sharing
- Read receipts and message history
- Push notifications (PWA)

### Notification Channels

| Channel | Purpose |
|---|---|
| SMS (Kavenegar) | Critical alerts, OTPs, stage transitions |
| Telegram bot | Sales inquiries, feature questions |
| Push (PWA) | Real-time lesson reminders, session alerts |
| In-app | Direct messages, class announcements |

---

## 15. Testing & Placement Assessment

### MST Placement Test

- **Type**: Adaptive (difficulty adjusts to each response)
- **Duration**: ~10 minutes
- **Skills tested**: Reading, Listening, Grammar
- **Output**: CEFR level (A1–C2) + personalized learning roadmap
- **Trigger**: Mandatory on first login for new students

### 8 Question Types

1. **Multiple Choice** — single or multiple correct answers
2. **True/False** — binary choice
3. **Fill in the Blank** — text input with auto-correction
4. **Essay** — AI evaluation via Ollama/OpenAI
5. **Speaking** — recording analyzed by Whisper
6. **Listening Comprehension** — audio playback with follow-up questions
7. **Matching Exercises** — pair connections
8. **Ordering/Sequencing** — arrange items in correct order

### Unified Testing System

All tests (placement, class quizzes, chapter tests) run through the unified testing system:
- Map-based in-memory storage (no database load during tests)
- Supports all 8 question types
- CEFR-aligned difficulty levels
- IRT (Item Response Theory) scoring for accuracy
- Session tracking and auto-save on each answer

---

## 16. Analytics & Reporting

### Available Reports

| Report | Audience | Contents |
|---|---|---|
| Student Progress | Students, Mentors | LRSW skills, attendance, grades |
| Class Performance | Teachers, Supervisors | Participation, outcomes, TTT |
| Financial | Accountants, Admin | Revenue, payments, payroll, refunds |
| Teacher Evaluation | Supervisors | Ratings, observation notes, trends |
| Lead Conversion | Call Center | Funnel metrics, stage durations |
| System Health | Admin | CPU, memory, DB, AI service status |
| AI Usage | Admin | Model calls, response times, error rates |

### Export Formats

- PDF with embedded charts
- Excel spreadsheets
- CSV for raw data analysis

### Infrastructure Status Widget

`Admin → Infrastructure`:
- Database connection status
- Redis queue health
- Ollama AI status
- Whisper/TTS service status
- Isabel VoIP AMI connection
- Disk usage (uploads, recordings, logs)

---

## 17. White-Label Customization

### Branding Options

- Logo replacement (upload from admin panel)
- Primary and secondary color scheme
- Typography selection (Persian/Arabic/Latin fonts)
- Layout themes (dark/light/custom)
- Custom CSS injection
- Institute name and tagline

### Multi-Tenant Features

- Subdomain deployment (each institute gets own subdomain)
- Custom domain support (CNAME to platform)
- Institute-specific settings and branding
- Isolated data storage per institute

### Configuration Path

`Admin → System → Branding`:
1. Upload logo (PNG/SVG, transparent background)
2. Set primary color (used in buttons, highlights)
3. Set secondary color (sidebars, cards)
4. Set institute name and registration number
5. Save — applies instantly to all sessions

---

## 18. PWA & Mobile Features

### Progressive Web App

Meta Lingua installs as a native-like app on any device:
- **Android**: "Add to Home Screen" from Chrome
- **iOS**: "Add to Home Screen" from Safari
- **Desktop**: Install prompt from browser address bar

### Caching Strategy

| Content | Strategy | Duration |
|---|---|---|
| Fonts & static assets | CacheFirst | 1 year |
| API responses | NetworkFirst | 1 day |
| Images | CacheFirst | 30 days |
| LinguaQuest lessons | Stale-while-revalidate | 7 days |

### Mobile-First Design

- Student role uses bottom navigation (thumb-friendly)
- Admin/Teacher roles use sidebar that collapses on mobile
- Touch-optimized form inputs, date pickers, and sliders
- Swipe gestures for lesson navigation
- Responsive breakpoints: 375px / 768px / 1024px / 1280px

---

## 19. Database Schema Reference

### Tables Currently Connected to the Application

The following major table groups are fully wired to API routes and UI:

**Core**: users, sessions, refresh_tokens  
**Courses**: courses, classes, enrollments, sessions_log, assignments  
**CallerN**: callern_packages, callern_enrollments, callern_sessions  
**Payments**: payments, wallet_transactions, course_payments  
**Call Center**: leads, lead_activity_log  
**Testing**: unified_test_sessions, unified_test_questions  
**Gamification**: user_xp, achievements, daily_challenges, leaderboard  
**LinguaQuest**: lingua_quest_lessons, lingua_quest_progress  
**CMS**: cms_pages, blog_posts, media_library  
**AI**: ai_insights_cache, ai_supervisor_analysis, mood_intelligence  
**Misc**: custom_fonts, visitor_chat, guest_leads, form_templates

### Tables Defined but Not Yet Connected (Future Features)

These tables exist in the schema and are ready to be activated:

| Table Group | Tables | Purpose |
|---|---|---|
| Audit & Logging | auditLogs, emailLogs, smsLogs, voipCallLogs | Compliance, debugging |
| Financial | paymentTransactions, invoiceItems, taxSettings | Detailed accounting |
| Organizational | institutes, departments, customRoles | Multi-tenant, franchises |
| Student Management | studentReports, parentGuardians, studentNotes | Parent access, notes |
| Scheduling | eventCalendar, holidayCalendar, substitutionRequests | Advanced scheduling |
| Resources | resourceLibrary, levelAssessmentQuestions | Content management |
| Referrals | referralSettings, courseReferrals, referralCommissions | Referral program |
| System | systemMetrics, systemConfig | Feature flags, limits |

These 33 tables are fully schema-defined and can be wired to routes incrementally as features are prioritized.

---

## 20. Development & Testing

### Development Login (Replit Environment Only)

> In the Replit development environment, OTP codes are logged to the server console instead of being sent via SMS (since Kavenegar is not configured in dev). Check the workflow logs for the OTP code.

To create development test users directly via the database:

```bash
docker compose exec postgres psql -U metalingua -d metalingua
```

```sql
-- Admin
INSERT INTO users (phone, first_name, last_name, role, is_active, phone_verified, language_preference, created_at)
VALUES ('+989001110001', 'Admin', 'Test', 'admin', true, true, 'fa', NOW());

-- Teacher
INSERT INTO users (phone, first_name, last_name, role, is_active, phone_verified, language_preference, created_at)
VALUES ('+989001110002', 'Teacher', 'Test', 'teacher', true, true, 'fa', NOW());

-- Student
INSERT INTO users (phone, first_name, last_name, role, is_active, phone_verified, language_preference, created_at)
VALUES ('+989001110003', 'Student', 'Test', 'student', true, true, 'fa', NOW());
```

Log in at `/auth` with those phone numbers. In dev mode, the OTP is printed in the server console log.

### Checking CallerN Package Data

```sql
SELECT * FROM "callernPackages";

SELECT u.phone, cp."packageName", ce."hoursRemaining"
FROM "callernEnrollments" ce
JOIN users u ON ce."studentId" = u.id
JOIN "callernPackages" cp ON ce."packageId" = cp.id;
```

### Adding Data Without Restarting

Database inserts take effect immediately — no application restart is needed. The app reads from the database on every request.

### Testing Checklist Before Launch

- [ ] Create admin user with real phone number
- [ ] Log in via OTP (confirms Kavenegar is working)
- [ ] Create a teacher user
- [ ] Create a student user
- [ ] Create a paid course and a free course
- [ ] Enroll student in free course (should work directly)
- [ ] Enroll student in paid course (should redirect to Shetab)
- [ ] Complete Shetab test payment and verify enrollment
- [ ] Top up wallet via Shetab and verify balance
- [ ] Schedule a class for the course
- [ ] Test CallerN: student purchases package, teacher goes online, connect
- [ ] Test LinguaQuest without login (guest mode)
- [ ] Test placement test flow
- [ ] Verify lead creation and stage transition in call center
- [ ] Check admin infrastructure status widget (all services green)
