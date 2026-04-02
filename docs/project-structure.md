# Meta Lingua — Project Structure & Architecture Guide

> **Who this is for:** Junior developers joining the project, or anyone who needs to understand how the system is built — including explaining it to a technical lead or CTO.

---

## Table of Contents

1. [What is Meta Lingua?](#what-is-meta-lingua)
2. [The Big Picture — System Map](#the-big-picture--system-map)
3. [How a Request Flows Through the App](#how-a-request-flows-through-the-app)
4. [Every Folder, Explained](#every-folder-explained)
5. [Major Feature Flows](#major-feature-flows)
   - [Student Registration → Placement → Enrollment](#1-student-registration--placement--enrollment)
   - [Payment Flow](#2-payment-flow)
   - [CallerN Live Video Tutoring](#3-callern-live-video-tutoring)
   - [AI Content Pipeline](#4-ai-content-pipeline)
   - [CRM Lead Pipeline](#5-crm-lead-pipeline)
   - [LinguaQuest Gamification](#6-linguaquest-gamification)
6. [The Technology Stack](#the-technology-stack)
7. [Self-Hosting Architecture (Iran Production)](#self-hosting-architecture-iran-production)

---

## What is Meta Lingua?

Meta Lingua is a **complete institute management platform** built for Iranian language schools. It replaces every tool an institute needs — from student registration and course management, to live tutoring sessions, AI-powered placement tests, payments, CRM, HR management, and content marketing — all in one self-hosted system with no dependency on foreign cloud services.

**8 user roles:** Admin, Supervisor, Teacher/Tutor, Front Desk, Student, Call Center Agent, Mentor, HR Manager

**Key pillars:**
- 🎓 **Learning** — Courses, live sessions (CallerN), AI tutor (Lexi), gamification (LinguaQuest)
- 🧪 **Assessment** — AI-powered MST placement test (CEFR A1–C2), adaptive IRT scoring
- 💰 **Payments** — Wallet system, Shetab/Zarinpal/IDPay gateways, promo codes
- 📞 **CRM** — 24-stage lead pipeline, call center ERP, scraper-to-CRM bridge
- 🤖 **AI** — Ollama (self-hosted LLM), content generation, SEO pipeline, sales agent
- 🏢 **HR** — Employees, contracts, leave requests, payroll, performance reviews
- 📱 **Marketing** — Blog/CMS, social media content, SMS campaigns, Telegram bot

---

## The Big Picture — System Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER / MOBILE                              │
│                                                                      │
│   Public Website    Student App    Admin Panel    Teacher Portal     │
│   (marketing)       (learning)     (management)   (sessions)        │
└─────────────────────────────┬───────────────────────────────────────┘
                               │  HTTPS (REST API + WebSocket)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS SERVER (Node.js)                     │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Auth Layer  │  │  API Routes  │  │    WebSocket Server       │  │
│  │  JWT + RBAC  │  │  (40+ files) │  │  (CallerN live sessions)  │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────────────┘  │
│                            │                                         │
│  ┌─────────────────────────▼──────────────────────────────────────┐ │
│  │                    SERVICE LAYER                                │ │
│  │                                                                 │ │
│  │  OllamaService  IRTService  PaymentGateway  KavenegarSMS       │ │
│  │  ScraperService  CRMBridge  HRService  CertificateService      │ │
│  │  SessionAdaptiveContent  AIContentGenerator  TTS Pipeline      │ │
│  └─────────────────────────┬──────────────────────────────────────┘ │
│                             │                                        │
│  ┌──────────────────────────▼──────────────────────────────────────┐│
│  │                   BACKGROUND WORKERS (BullMQ)                   ││
│  │                                                                  ││
│  │  IRT Processing  │  CMS Content Gen  │  SMS Reminders           ││
│  │  Adaptive Content│  HR Aggregation   │  TTS Pre-generation      ││
│  └──────────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                  ▼
┌─────────────────────────┐        ┌─────────────────────────┐
│     PostgreSQL DB        │        │      Redis Cache         │
│                          │        │                          │
│  Users, Courses          │        │  BullMQ job queues       │
│  Enrollments, Payments   │        │  Session state           │
│  Leads, HR, CMS          │        │  Rate limiting           │
│  MST, IRT, Gamification  │        │                          │
└─────────────────────────┘        └─────────────────────────┘
              │
              ▼
┌─────────────────────────┐        ┌─────────────────────────┐
│   Ollama (Local LLM)    │        │   Issabel PBX (VoIP)    │
│                          │        │                          │
│  Content generation      │        │  Outbound calls via AMI  │
│  Placement test scoring  │        │  Call recording          │
│  AI tutor (Lexi)         │        │  IVR integration         │
└─────────────────────────┘        └─────────────────────────┘
```

---

## How a Request Flows Through the App

> Think of this as a letter going through a post office. The request enters, gets checked, gets processed, and a response comes back.

```
Browser sends: GET /api/courses

    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 1. EXPRESS MIDDLEWARE (server/index.ts)                  │
│    - Parse JSON body                                     │
│    - Handle CORS (who's allowed to talk to us)           │
│    - Rate limiting (prevent abuse)                       │
│    - Serve static files (images, JS bundles)             │
└─────────────────────────────┬───────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│ 2. AUTHENTICATION (server/auth.ts)                       │
│    authenticateToken middleware:                         │
│    - Read JWT token from Authorization header            │
│    - Verify signature and expiry                         │
│    - Attach user object to request: req.user             │
│    - If invalid → 401 Unauthorized (stop here)           │
└─────────────────────────────┬───────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│ 3. AUTHORIZATION (server/auth.ts)                        │
│    requireRole(['Admin', 'Teacher']) middleware:          │
│    - Check req.user.role against allowed roles           │
│    - If not allowed → 403 Forbidden (stop here)          │
└─────────────────────────────┬───────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│ 4. ROUTE HANDLER (server/routes/courses-routes.ts)       │
│    - Validate request body/params (Zod schema)           │
│    - Call storage methods or service layer               │
│    - Return JSON response                                │
└─────────────────────────────┬───────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│ 5. STORAGE LAYER (server/storage.ts)                     │
│    - Build SQL query using Drizzle ORM                   │
│    - Execute against PostgreSQL                          │
│    - Return typed result objects                         │
└─────────────────────────────┬───────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│ 6. DATABASE (PostgreSQL via Neon/self-hosted)            │
│    - Execute query                                       │
│    - Return rows                                         │
└─────────────────────────────┬───────────────────────────┘
                               │
                    Response travels back up
                    through the same chain ↑
```

---

## Every Folder, Explained

### Root Level Folders

---

#### `__tests__/`
**What it is:** Jest-style unit and integration tests written alongside the code.

**For juniors:** These test individual functions to make sure they work correctly in isolation. When you change code, run these to check you didn't break anything.

---

#### `.agents/`
**What it is:** Internal workspace used by AI development agents. Contains task planning files and session notes.

**For juniors:** Ignore this folder — it's not part of the running application.

---

#### `.config/`
**What it is:** Configuration files for development tools — linters (ESLint), formatters (Prettier), and editor settings.

**For juniors:** These files enforce code style consistency across the team. Your editor reads them automatically.

---

#### `.git/`
**What it is:** Git version control history.

**For juniors:** Never touch this folder manually. Git manages it. It stores every change ever made to the codebase.

---

#### `.github/`
**What it is:** GitHub Actions workflow files — automated scripts that run on every code push (CI/CD).

**For juniors:** When you push code to GitHub, these scripts automatically run tests and checks to catch problems before they reach production.

---

#### `api/`
**What it is:** Stores static API assets — primarily pre-generated audio files served via API endpoints.

**For juniors:** The TTS (text-to-speech) pipeline generates audio files and stores them here so they can be served quickly without regenerating on every request.

---

#### `attached_assets/`
**What it is:** Files attached during development sessions (screenshots, design references, uploaded documents).

**For juniors:** Development reference files only. Not served by the web server and not part of the application.

---

#### `client/`
**What it is:** Everything that runs in the user's browser. The entire React frontend.

**For juniors:** If it's something the user sees and interacts with, it lives here.

```
client/
└── src/
    ├── App.tsx              ← The router: maps URLs to pages
    ├── main.tsx             ← Entry point: starts React
    ├── index.css            ← Global styles
    ├── pages/               ← One file per screen
    │   ├── admin/           ← Admin panel screens
    │   ├── student/         ← Student-facing screens
    │   ├── teacher/         ← Teacher portal screens
    │   ├── frontdesk/       ← Front desk staff screens
    │   ├── supervisor/      ← Supervisor screens
    │   └── public/          ← Public website (no login needed)
    ├── components/          ← Reusable UI pieces
    │   ├── admin/           ← Admin-specific widgets
    │   ├── callern/         ← Video session components
    │   ├── linguaquest/     ← Game UI components
    │   ├── ui/              ← shadcn/ui base components
    │   └── ...
    ├── hooks/               ← Custom data-fetching hooks
    ├── services/            ← Functions that call the API
    ├── contexts/            ← Global state (auth, language)
    ├── i18n/                ← Translations (Persian/English/Arabic)
    ├── styles/              ← Tailwind config, custom CSS
    ├── utils/               ← Small helper functions
    ├── types/               ← TypeScript type definitions
    └── lib/                 ← Third-party library setup
```

**Flow within the frontend:**
```
URL change
    │
    ▼
App.tsx (router) → matches URL → loads Page component
    │
    ▼
Page component → calls custom hook (useStudents, useCourses...)
    │
    ▼
Hook → calls service function → HTTP request to server API
    │
    ▼
Server responds → hook updates state → React re-renders UI
```

---

#### `data/`
**What it is:** Seed data files and static reference content — default curriculum structures, sample courses, initial configuration values.

**For juniors:** Used when setting up a fresh installation to populate the database with sensible starting data.

---

#### `dist/`
**What it is:** The compiled, production-ready version of the frontend. Generated automatically by Vite when you run `npm run build`.

**For juniors:** Never edit files here. They are overwritten every build. The server serves these files to users in production.

---

#### `docker/`
**What it is:** All files needed to run the application on a self-hosted server using Docker.

**For juniors:** Docker packages the app, database, Redis, and Nginx into containers that can run on any Linux server. This is how the platform is deployed in Iran.

```
docker/
├── Dockerfile              ← How to build the app container
├── docker-compose.yml      ← All containers + how they connect
└── nginx.conf              ← Web server config (SSL, routing)
```

---

#### `docs/`
**What it is:** Project documentation for developers, administrators, and buyers.

```
docs/
├── README.md               ← Feature overview and quick-start
├── buyer-manual.md         ← Institute admin user guide (24 sections)
├── deployment-guide.md     ← Self-hosting setup for Iran production
└── project-structure.md    ← This file
```

---

#### `highlights/`
**What it is:** Snapshot exports and visual reference files from design and development sessions.

**For juniors:** Reference material only, not part of the running app.

---

#### `http:/`
**What it is:** Plain-text HTTP request files (`.http` format). Used to test API endpoints directly in the IDE without a tool like Postman.

**For juniors:** Open these files in VS Code with the REST Client extension to send test requests to your local server.

---

#### `logs/`
**What it is:** Server log files written to disk during runtime. Captures errors, warnings, and informational messages.

**For juniors:** When something goes wrong in production, check here first. Log files are your debugging trail.

---

#### `migrations/`
**What it is:** SQL files that modify the database schema over time. Each file is applied once and never repeated.

**For juniors:** Every time the database structure changes (new table, new column), a migration file is added here. The post-merge script applies these automatically when new code is merged.

```
migrations/
├── 0090_sublevel_session_packages.sql
├── 0100_curriculum_levels_unique_constraint.sql
├── 0110_session_packages_sublevel_fk.sql
├── 0120_irt_mst_reliability_tables.sql
└── manual_social_media_tables.sql
```

---

#### `public/`
**What it is:** Static files served directly by the web server — no processing, just file delivery.

**For juniors:** Favicon, PWA manifest, offline page, fonts, and images that don't need to go through the React build process.

---

#### `recordings/`
**What it is:** Audio and video recordings from CallerN tutoring sessions stored on the server filesystem.

**For juniors:** When a live tutoring session is recorded, the file lands here. The AI Supervisor can analyze these recordings afterward.

---

#### `scripts/`
**What it is:** Utility scripts that run outside of the main application.

```
scripts/
└── post-merge.sh    ← Runs after every code merge:
                        1. npm install (new packages)
                        2. Apply SQL migrations
                        3. Confirm success
```

**For juniors:** `post-merge.sh` is the automated setup that runs when a task agent's work gets merged. You don't run it manually.

---

#### `server/`
**What it is:** Everything that runs on the server. The Node.js / Express backend.

**For juniors:** If the browser can't see it directly, it lives here. All business logic, database access, AI calls, and payment processing happen in this folder.

```
server/
├── index.ts              ← Entry point: starts the server, boots all services
├── auth.ts               ← JWT token creation/verification, RBAC middleware
├── db.ts                 ← Database connection (Drizzle ORM + pg pool)
│
├── routes.ts             ← Main route registration (~400 lines — thin wiring only)
├── routes/               ← 64 domain-specific route files (one file per feature)
│   ├── cms-routes.ts              ← Blog, pages, media
│   ├── hr-routes.ts               ← Employee, leave, payroll
│   ├── callern-flow-routes.ts     ← Live tutoring sessions
│   ├── placement-test-routes.ts   ← MST placement test
│   ├── shetab-payment-routes.ts   ← Shetab gateway callbacks
│   ├── gamification-routes.ts     ← XP, levels, badges
│   ├── ai-sales-agent-routes.ts   ← Telegram bot integration
│   └── ... (58 more)
│
├── storage.ts            ← Storage composition layer (~40 lines — wires modules)
├── storage/              ← 8 domain storage modules (database query logic)
│   ├── user-storage.ts            ← Users, profiles, roles
│   ├── course-storage.ts          ← Courses, enrollments, sessions
│   ├── lead-storage.ts            ← CRM leads, pipeline, activity log
│   ├── callern-storage.ts         ← CallerN sessions, presence, followers
│   ├── misc-storage.ts            ← Miscellaneous shared queries
│   ├── mem-storage.ts             ← In-memory fallback storage
│   ├── unified-testing-impl.ts    ← MST/placement test storage
│   └── storage-types.ts           ← Shared storage interface types
│
├── services/             ← Business logic (one class per concern)
│   ├── ollama-service.ts          ← Talks to the local AI (Ollama LLM)
│   ├── irt-service.ts             ← Adaptive scoring math (IRT 3PL/CAT)
│   ├── ai-cms-content-service.ts  ← AI blog/landing page generation
│   ├── scraper-crm-bridge.ts      ← Converts scraped leads to CRM leads
│   ├── gamification-service.ts    ← XP, levels, achievements
│   ├── otp-service.ts             ← SMS OTP via Kavenegar
│   └── ...
│
├── workers/              ← Background jobs (run async, not during HTTP request)
│   ├── sms-reminder.worker.ts     ← Sends scheduled SMS reminders
│   └── ...
│
├── modules/              ← Self-contained feature modules
│   └── mst/              ← MST Placement Test (complete subsystem)
│       ├── routing/      ← CEFR band routing logic
│       ├── scorers/      ← Per-skill quickscoring
│       ├── controllers/  ← Response processing
│       └── schemas/      ← Item and result type definitions
│
└── middleware/           ← Reusable Express middleware
```

---

#### `shared/`
**What it is:** Code used by both the frontend (client) and backend (server). Avoids duplication.

**For juniors:** If both sides need the same type definition or validation schema, it goes here so you only write it once.

```
shared/
├── schema.ts             ← Compatibility barrel: re-exports everything from
│                           shared/schema/* so all existing imports keep working
│                           (1 line — do not delete this file)
│
├── schema/               ← 15 domain schema files (Drizzle ORM table definitions)
│   ├── users.ts          ← Users, profiles, roles, OTP
│   ├── courses.ts        ← Courses, enrollments, schedules
│   ├── cms.ts            ← Blog posts, landing pages, media
│   ├── hr.ts             ← Employees, contracts, leave, payroll
│   ├── mst.ts            ← MST placement test, IRT parameters
│   ├── gamification.ts   ← XP, levels, achievements, daily challenges
│   ├── leads.ts          ← CRM leads, pipeline, activity log
│   ├── callern.ts        ← CallerN sessions, presence, followers, packages
│   ├── payments.ts       ← Wallet, transactions, gateways, promo codes
│   ├── marketing.ts      ← Roadmaps, 3D content, social posts
│   ├── teaching.ts       ← Books, lesson content
│   ├── features.ts       ← Dynamic forms, public features, fonts
│   ├── curriculum-ext.ts ← Sub-levels, orders, shipping
│   ├── social.ts         ← SMS logs, social media integration
│   └── schema-helpers.ts ← buildInsertSchema() typed helper (avoids as-any)
│
├── constants/            ← Values used everywhere (user roles, limits, enums)
├── types/                ← TypeScript types shared by client + server
└── *.ts                  ← Domain engines shared across both sides
                            (placement-test-schema, roadmap-schema,
                             evaluation-engine, mentoring-analytics-engine, etc.)
```

---

#### `test/`
**What it is:** Older standalone test scripts written during early development. Not part of the main test suite.

**For juniors:** These are one-off verification scripts. The canonical test suite is in `tests/`.

---

#### `tests/`
**What it is:** The main test suite, organized by layer.

```
tests/
├── unit/         ← Test individual functions (no DB, no HTTP)
├── integration/  ← Test multiple services working together
├── e2e/          ← End-to-end browser tests (Playwright)
├── api/          ← HTTP-level API contract tests
├── backend/      ← Server-side feature tests
├── frontend/     ← React component rendering tests
└── i18n/         ← Translation completeness checks
```

---

#### `transcripts/`
**What it is:** Text transcripts of CallerN tutoring sessions, generated by the Whisper speech-to-text service after a session ends.

**For juniors:** After a live session, audio gets transcribed here. The AI Supervisor reads these to analyze teacher performance and student progress.

---

#### `tts_system/`
**What it is:** The text-to-speech pre-generation pipeline for LinguaQuest lessons and course audio content.

**For juniors:** Instead of generating audio on every request (slow), this system pre-generates all the audio clips for lessons and stores them. The app just serves the cached files.

---

## Major Feature Flows

### 1. Student Registration → Placement → Enrollment

```
Student visits website
        │
        ▼
Enters phone number
        │
        ▼
OTP SMS sent via Kavenegar ──► Phone verified
        │
        ▼
Account created (Student role)
        │                               ┌─────────────────────────┐
        ▼                               │  CRM Bridge (automatic) │
CRM lead created automatically ────────►│  source = 'self_reg'    │
        │                               │  stage = 'new_contact'  │
        ▼                               └─────────────────────────┘
Takes MST Placement Test
        │
        ├── Listening questions  ──► quickscore ──► route up/down/stay
        ├── Reading questions    ──► quickscore ──► route up/down/stay
        ├── Speaking (audio)     ──► Whisper ASR ──► quickscore
        └── Writing questions    ──► quickscore
        │
        ▼
IRT algorithm calculates ability (theta score)
        │
        ▼
CEFR band assigned: A1 / A2 / B1 / B2 / C1 / C2
        │
        ▼
Student sees recommended courses for their level
        │
        ▼
Student adds to wallet (Shetab/Zarinpal/IDPay)
        │
        ▼
Student enrolls in course ──► CRM lead → 'enrolled'
        │
        ▼
/welcome onboarding page
(teacher wall, LinguaQuest preview, certificate mockup)
```

---

### 2. Payment Flow

```
Student initiates payment
        │
        ├── Wallet top-up path:                    ── Course payment path:
        │   Admin settings → activeGateway             Student selects course
        │   Gateway factory creates adapter            Checks wallet balance
        │   Redirect to payment page                   If enough → deduct wallet
        │   ↓                                          If not → gateway redirect
        │   User pays on bank page
        │   Bank redirects back to callback URL
        │   Server verifies transaction with gateway
        │   Wallet balance updated
        │   walletTransaction record created
        │
        └── Both paths ──► advanceLeadAfterPayment()
                            Lead stage → 'enrolled'
                            Activity log entry written
```

---

### 3. CallerN Live Video Tutoring

```
Student requests session
        │
        ▼
System finds available teacher (3-state presence: available/teaching/offline)
        │
        ▼
WebRTC peer connection established (STUN/TURN server)
        │
        ├── Video/Audio streams exchanged directly between browsers
        ├── Screen sharing available
        └── Session recording → recordings/ folder
        │
        ▼
AI Supervisor monitors session in background:
        ├── Whisper transcribes audio in real-time
        ├── Ollama analyzes transcript for teaching quality
        └── Flags issues or suggestions for teacher
        │
        ▼
Session ends → post-session content generated:
        ├── Session summary for student
        ├── Vocabulary/grammar from session saved to SRS
        └── XP awarded (gamification)
        │
        ▼
IRT ability estimate updated (async, BullMQ worker)
```

---

### 4. AI Content Pipeline

```
Scraper collects data (Puppeteer, scheduled)
        │
        ├── Competitor prices → competitor_prices table
        ├── Market trends → market_trends table
        └── Leads → scraped_leads table
        │
        ▼
Admin opens Blog Management → clicks "AI Generate"
        │
        ▼
Selects: source insight + prompt template + tone + length
        │
        ▼
POST /api/admin/content/generate → enqueue BullMQ job
        │                          (returns job ID immediately)
        ▼
CMS Content Worker picks up job:
        ├── Reads prompt template from cms_content_prompt_templates
        ├── Interpolates {topic}, {keywords}, {tone}, {length}
        └── Calls Ollama → generates structured content
        │
        ▼
Draft saved to cms_blog_posts:
        ├── status = 'draft'
        ├── ai_generated = true
        ├── ai_prompt stored (full traceability)
        └── SEO fields auto-filled (metaTitle, metaDescription, keywords)
        │
        ▼
Supervisor reviews → approves (or rejects)
        │
        ▼
If policy requires Admin sign-off:
        └── status → 'pending_admin_review' → Admin final approve
        │
        ▼
Admin publishes immediately OR schedules future date
        │
        ▼
Scheduled publisher (every 5 min) promotes when time arrives
        │
        ▼
Post live → sitemap.xml updated → SEO bots can index
```

---

### 5. CRM Lead Pipeline

```
Lead enters system via any of these sources:
        │
        ├── Self-registration (student signs up)
        ├── Front desk manually creates lead
        ├── Scraper promotion (scraped_leads → leads)
        └── Call center cold outreach
        │
        ▼
24-stage pipeline (enforced transitions only):
        │
        new_contact → contacted → interested → demo_scheduled →
        demo_done → proposal_sent → negotiating → trial_class →
        trial_done → decision_pending → payment_pending →
        payment_received → enrolled → active → ...
        │
Each stage transition:
        ├── Validated against LEAD_STAGE_TRANSITIONS map
        ├── Activity log entry with full field snapshot
        └── Auto-SMS triggered at key stages (Kavenegar)
        │
        ▼
After payment: advanceLeadAfterPayment()
        ├── Lead → 'enrolled'
        ├── Enrollment record created
        └── Activity log entry
```

---

### 6. LinguaQuest Gamification

```
Student completes any learning activity
        │
        ▼
XP awarded based on activity type and difficulty
        │
        ▼
GamificationService.awardXP():
        ├── Add XP to student profile
        ├── Check if level threshold crossed
        └── Check achievement conditions
        │
        ▼
If level up → notify student → unlock new content
        │
        ▼
Daily Challenge system:
        ├── New challenge generated each day (Ollama prompt)
        └── Bonus XP for completion
        │
        ▼
Leaderboard updated → social motivation
```

---

## The Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend framework** | React 18 + TypeScript | Component-based, type-safe UI |
| **Frontend build** | Vite | Fast dev server, optimized production builds |
| **UI components** | shadcn/ui + Tailwind CSS | Consistent, accessible, RTL-compatible |
| **State management** | TanStack React Query | Server state caching, background refetch |
| **Routing (frontend)** | Wouter | Lightweight URL routing |
| **Localization** | i18next | Persian/English/Arabic with full RTL/LTR |
| **Backend framework** | Express.js + TypeScript | Mature, flexible, well-understood |
| **Runtime** | Node.js ESM | Modern module system, async I/O |
| **Database** | PostgreSQL | Relational, reliable, full-text search, JSON support |
| **ORM** | Drizzle ORM | Type-safe queries, schema-as-code |
| **Background jobs** | BullMQ + Redis | Reliable async processing, retries, scheduling |
| **AI (self-hosted)** | Ollama | Runs LLMs locally — no foreign API dependencies |
| **Speech-to-text** | Whisper (Faster-Whisper) | Local transcription, no data leaves the server |
| **Text-to-speech** | Microsoft Edge TTS (self-hosted) | Persian/Arabic voice synthesis |
| **Video calls** | WebRTC + coturn | Peer-to-peer, no video goes through our server |
| **Authentication** | JWT + refresh tokens | Stateless, scalable, phone-OTP via Kavenegar |
| **SMS** | Kavenegar | Iranian SMS provider with full API |
| **Payments** | Shetab, Zarinpal, IDPay, Zibal, Mellat | Iranian payment gateways |
| **VoIP** | Issabel PBX via AMI (port 5038) | Outbound calling, IVR, call recording |
| **Web scraping** | Puppeteer | Headless Chromium, anti-detection measures |
| **Containerization** | Docker + Docker Compose | Reproducible deployment on any Linux server |
| **Reverse proxy** | Nginx | SSL termination, static file serving, WebSocket upgrade |

---

## Self-Hosting Architecture (Iran Production)

```
Internet
    │
    ▼ HTTPS :443
┌─────────────────┐
│     Nginx        │  ← SSL termination (Let's Encrypt or self-signed)
│  Reverse Proxy  │  ← Serves static files from dist/ directly
│                 │  ← Proxies /api/* to Node.js
│                 │  ← Upgrades WebSocket connections (CallerN)
└────────┬────────┘
         │
         ▼ HTTP :5000
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Node.js App   │    │   PostgreSQL     │    │     Redis        │
│   (Express)     │◄──►│   (local DB)     │    │  (BullMQ jobs)  │
│                 │    │                 │    │                 │
│  All API routes │    │  All data       │    │  Job queues     │
│  WebSocket      │    │  (encrypted at  │    │  Session cache  │
│  Background     │    │   rest optional)│    │                 │
│  workers        │    └─────────────────┘    └─────────────────┘
└────────┬────────┘
         │
         ├──► Ollama (localhost:11434) — Local LLM, no internet needed
         ├──► Faster-Whisper (localhost) — Speech-to-text
         ├──► Edge TTS — Text-to-speech
         ├──► Issabel PBX (port 5038) — VoIP via AMI protocol
         └──► Kavenegar API — SMS (only external dependency)

All data stays in Iran. Only SMS goes through Kavenegar's Iranian servers.
```

---

*Last updated: April 2, 2026 — v1.3.0*
