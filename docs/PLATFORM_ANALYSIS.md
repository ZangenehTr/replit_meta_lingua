# Meta Lingua Academy — Complete Platform Analysis & Improvement Roadmap

> **Generated:** February 16, 2026
> **Codebase Size:** ~403,000 lines of TypeScript (~460,000 including JSON/CSS) across 750+ files
> **Core Files:** routes.ts (28,230 lines), database-storage.ts (19,022 lines), schema.ts (8,945 lines), storage.ts (9,041 lines)
> **Note:** Features are categorized as Implemented, Configured (code exists, needs deployment config), or Planned (infrastructure present, not fully wired). See individual sections for status.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [Feature Inventory by Module](#4-feature-inventory-by-module)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Authentication & Security](#6-authentication--security)
7. [AI Subsystem](#7-ai-subsystem)
8. [Communication & Real-Time Systems](#8-communication--real-time-systems)
9. [Payment & Financial System](#9-payment--financial-system)
10. [Internationalization (i18n)](#10-internationalization-i18n)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [Feature Interdependency Map](#12-feature-interdependency-map)
13. [Improvement Suggestions](#13-improvement-suggestions)
14. [Engineering Quality Assessment](#14-engineering-quality-assessment)
15. [Uniqueness & Competitive Advantages](#15-uniqueness--competitive-advantages)

---

## 1. Platform Overview

Meta Lingua Academy is an **AI-enhanced, multilingual language learning and institute management platform** designed for self-hosting by language institutes globally — with a primary focus on the **Iranian market**.

### Core Value Proposition
- Full institute management (students, teachers, courses, finances)
- AI-powered personalized learning with adaptive content
- Phone-based tutoring system (CallerN) with WebRTC video calls
- Free public learning gateway (LinguaQuest) for lead generation
- Designed for self-hosting with minimal external dependencies (critical for Iranian market)

> **Dependency Note:** For development, the platform uses Neon PostgreSQL and OpenAI. For production self-hosting, it's designed to run with Ollama (local AI), self-hosted PostgreSQL, Edge TTS, and Faster-Whisper — but OpenAI remains available as a fallback/alternative. Some services (Google TTS, Stripe) have code-level integration that is optional.

### Scale Summary
| Metric | Count |
|--------|-------|
| Frontend pages | 220 |
| React components | 233 |
| Frontend routes | 186 |
| Backend API endpoints | 974 |
| Database tables | 225 |
| Storage methods | 1,058 |
| Backend service files | 51 |
| Backend route modules | 40 |
| i18n namespaces | 16 |
| Supported languages | 3 (English, Persian, Arabic) |
| User roles | 8 |

---

## 2. System Architecture

### 2.1 Frontend Stack
```
React 18 + TypeScript + Vite
├── UI Framework: Tailwind CSS + shadcn/ui (Radix primitives)
├── State Management: TanStack React Query v5
├── Routing: Wouter (lightweight)
├── Animations: Framer Motion
├── i18n: i18next + react-i18next
├── Forms: React Hook Form + Zod validation
├── Rich Text: TipTap editor
├── 3D Content: Three.js (planned for LinguaQuest)
├── Video: WebRTC via simple-peer
├── Charts: Recharts
└── PWA: Service Worker with precaching
```

**Key Frontend Patterns:**
- **Role-based routing** via `RoleProtectedRoute` and `ProtectedRoute` wrappers
- **Mobile-first design** with separate mobile pages for student (`*-mobile.tsx`) and teacher
- **Glass-morphism UI** for student mobile views
- **Dark mode support** via next-themes
- **Custom hooks** for auth, enrollment, branding, PWA, WebRTC, TTS, sockets
- **Conditional dashboards** that adapt based on enrollment status

### 2.2 Backend Stack
```
Express.js + TypeScript (ESM)
├── ORM: Drizzle ORM
├── Database: PostgreSQL (Neon for dev, self-hosted for prod)
├── Auth: JWT (access + refresh tokens)
├── File Upload: Multer
├── Rate Limiting: express-rate-limit
├── WebSocket: ws library (for CallerN)
├── Job Queue: BullMQ (with Redis, optional)
├── Email: Nodemailer
├── PDF Generation: Custom
├── CSV Processing: csv-parse + json2csv
└── Monitoring: Custom health service + metrics
```

### 2.3 Data Flow Pattern
```
Browser → Express Router → Auth Middleware → Route Handler → Storage Layer → Drizzle ORM → PostgreSQL
                                                                ↑
                                                          AI Services
                                                          (Ollama / OpenAI)
```

### 2.4 File Organization
```
/
├── client/src/
│   ├── pages/          # 220 page components organized by role
│   │   ├── admin/      # 75+ admin pages
│   │   ├── student/    # 25+ student pages
│   │   ├── teacher/    # 18+ teacher pages
│   │   ├── callcenter/ # 8 call center pages
│   │   ├── supervisor/ # 2 supervisor pages
│   │   ├── mentor/     # 4 mentor pages
│   │   ├── accountant/ # 1 accountant page
│   │   └── linguaquest/# 3 public learning pages
│   ├── components/     # 233 reusable components
│   │   ├── ui/         # shadcn/ui primitives
│   │   ├── layout/     # Navigation, sidebar, breadcrumbs
│   │   ├── mobile/     # Mobile-specific components
│   │   ├── linguaquest/# Game activity components
│   │   ├── callern/    # Video call components
│   │   └── [role]/     # Role-specific components
│   ├── hooks/          # 22 custom hooks
│   ├── lib/            # 25 utility modules
│   ├── i18n/           # 3 languages × 16 namespaces
│   └── styles/         # Mobile app CSS, themes
├── server/
│   ├── routes.ts       # Main route file (28K lines)
│   ├── routes/         # 40 modular route files
│   ├── services/       # 51 service files
│   ├── ai-providers/   # AI abstraction layer
│   ├── storage/        # CallerN storage
│   ├── modules/mst/    # Multi-Skill Test module
│   ├── monitoring/     # Health, metrics, disk
│   ├── workers/        # Background workers
│   ├── social-platforms/# Social media strategies
│   └── content/        # Seed data files
└── shared/
    └── schema.ts       # Database schema (225 tables)
```

---

## 3. Database Design

### 3.1 Table Categories (225 Tables)

**Core User & Auth (8 tables)**
| Table | Purpose |
|-------|---------|
| `users` | Main user accounts (email, phone, role, credits, XP, wallet) |
| `userProfiles` | Extended profile data (native language, learning style, bio) |
| `userSessions` | JWT session tracking |
| `passwordResetTokens` | Password reset flow |
| `userAddresses` | Shipping addresses for e-commerce |
| `studentPreferences` | Learning preferences |
| `userStats` | XP, levels, streaks |
| `dailyGoals` | Daily learning targets |

**Course & Curriculum (10 tables)**
| Table | Purpose |
|-------|---------|
| `courses` | Course catalog (CEFR level, price, schedule, max students) |
| `courseEnrollments` | Student-course assignments |
| `curriculumCategories` | Language/skill categorization |
| `curriculums` | Multi-level curriculum definitions |
| `curriculumLevels` | CEFR levels within curriculums |
| `curriculumLevelCourses` | Course-level mappings |
| `studentCurriculumProgress` | Student progress through curriculum |
| `specialClasses` | Workshop/trial classes |
| `teacherTrialAvailability` | Trial lesson scheduling |
| `trialLessons` | Trial lesson records |

**Testing & Assessment (12 tables)**
| Table | Purpose |
|-------|---------|
| `tests` | Test definitions (quiz, exam, placement) |
| `testQuestions` | 8 question types (MCQ, fill-blank, essay, etc.) |
| `testAttempts` | Student test sessions |
| `testAnswers` | Individual answers |
| `mstSessions` | Multi-Skill Test sessions |
| `mstResponses` | MST response tracking |
| `mstSkillStates` | IRT-based skill state tracking |

**AI & Learning Intelligence (15 tables)**
| Table | Purpose |
|-------|---------|
| `aiProgressTracking` | AI-monitored student progress |
| `aiActivitySessions` | AI micro-learning sessions |
| `aiVocabularyTracking` | Vocabulary learning tracking |
| `aiGrammarTracking` | Grammar mastery tracking |
| `aiPronunciationAnalysis` | Pronunciation assessment |
| `aiTrainingData` | Custom AI training data |
| `aiKnowledgeBase` | Knowledge base for AI agents |
| `aiTrainingJobs` | AI model training jobs |
| `aiTrainingDatasets` | Training dataset management |
| `aiModels` | Trained model registry |
| `aiDatasetItems` | Individual training items |
| `aiCallInsights` | AI analysis of calls |
| `aiStudyPartners` | Virtual AI study companions |

**CallerN (Phone Tutoring) (12 tables)**
| Table | Purpose |
|-------|---------|
| `callSessions` | Active/past call sessions |
| `callPostReports` | Post-call teacher reports |
| `callernCallHistory` | Call history log |
| `callernSyllabusTopics` | Per-package syllabus |
| `studentCallernProgress` | Student progress in CallerN |
| `callernPackages` | Purchasable calling packages |
| `studentCallernPackages` | Assigned packages |
| `teacherCallernAvailability` | Teacher scheduling |
| `rooms` | Virtual rooms |

**Financial (10 tables)**
| Table | Purpose |
|-------|---------|
| `walletTransactions` | Wallet credit/debit log |
| `paymentIdempotency` | Duplicate payment prevention |
| `coursePayments` | Course payment records |
| `paymentTransactions` | Generic payment log |
| `teacherPaymentRecords` | Teacher salary/commission |
| `chartOfAccounts` | Accounting chart |
| `accountingLedger` | Double-entry ledger |
| `invoices` | Invoice generation |
| `orders` / `order_items` | E-commerce orders |

**Gamification (8 tables)**
| Table | Purpose |
|-------|---------|
| `achievements` | Achievement definitions |
| `userAchievements` | Earned achievements |
| `learningProblems` | Detected learning issues |
| `learningRecommendations` | AI recommendations |
| `skillCorrelations` | Cross-skill analysis |
| `performancePatterns` | Performance analytics |
| `analyticsInsights` | AI-generated insights |

**LinguaQuest (Free Learning) (10 tables)**
| Table | Purpose |
|-------|---------|
| `linguaquestLessons` | 6 interactive lessons (B1-C1) |
| `guestProgressTracking` | Guest progress (no auth needed) |
| `linguaquestCefrLevels` | CEFR level definitions |
| `linguaquestAudioAssets` | TTS audio files |
| `linguaquestLeaderboardEntries` | Public leaderboard |
| `linguaquestContentBank` | Reusable content |
| `linguaquestAudioJobs` | Audio generation queue |
| `linguaquestLessonFeedback` | User feedback |
| `freemiumConversionTracking` | Conversion funnel analytics |
| `voiceExercisesGuest` | Guest voice exercises |

**CMS & Content (12 tables)**
| Table | Purpose |
|-------|---------|
| `cmsPages` | Custom website pages |
| `cmsPageSections` | Page sections/blocks |
| `cmsBlogPosts` | Blog articles |
| `cmsBlogCategories` / `cmsBlogTags` | Blog organization |
| `cmsBlogComments` | Blog comments |
| `cmsVideos` | Video content |
| `cmsMediaAssets` | Media library |
| `cmsPageAnalytics` | Page view tracking |
| `customFonts` | Arabic/Persian font management |

**Communication (8 tables)**
| Table | Purpose |
|-------|---------|
| `chatConversations` | Internal messaging |
| `chatMessages` | Chat messages |
| `leads` | CRM lead management |
| `communicationLogs` | SMS/email/call logs |
| `visitorChatSessions` | Live visitor chat |
| `visitorChatMessages` | Chat messages |
| `visitorChatCannedResponses` | Quick response templates |
| `emailLogs` | Email delivery tracking |

**E-Commerce / Book Store (10 tables)**
| Table | Purpose |
|-------|---------|
| `books` | Digital/physical book catalog |
| `book_categories` | Book categorization |
| `book_assets` | Book files (PDF, audio) |
| `bookReviews` | Book reviews |
| `book_orders` | Book orders |
| `dictionary_lookups` | In-reader dictionary |
| `carts` / `cart_items` | Shopping cart |
| `shipping_orders` | Physical delivery tracking |
| `courier_tracking` | Courier integration |

**Video Learning (5 tables)**
| Table | Purpose |
|-------|---------|
| `videoLessons` | Video course content |
| `videoProgress` | Watch progress tracking |
| `videoNotes` | Timestamped notes |
| `videoBookmarks` | Video bookmarks |
| `threeDVideoLessons` | 3D interactive lessons |

**Other (15+ tables)**
- Teacher evaluations, class observations, attendance records
- Form definitions/submissions (dynamic forms)
- Iranian calendar settings/events/holidays
- Scrape jobs, competitor prices, market trends
- Peer socializer groups, matching requests
- Glossary items, quiz results, rewrite suggestions

---

## 4. Feature Inventory by Module

### 4.1 LinguaQuest — Free Learning Gateway
**Purpose:** Public-facing, no-authentication interactive language learning platform to attract leads.

**Components:**
- `LinguaQuestHome` — Landing page with lesson catalog
- `LinguaQuestDashboard` — Guest progress tracking (uses localStorage + database)
- `LinguaQuestLesson` — Interactive lesson player

**23 Activity Types:**
1. VocabularyMatch, StoryBuilder, ListeningComprehension
2. GrammarExercise, SpeakingExercise, ReadingComprehension
3. ConversationStep, CulturalNote, DebateStep
4. WordAssociation, ErrorCorrection, SentenceTransformation
5. PronunciationPractice, Idioms, MediaAnalysis
6. RolePlay, CrossCultural, EmotionalTone
7. BusinessWriting, AcademicDebate, AdvancedListening
8. TranslationExercise, ParagraphWriting, FreeResponse

**Data Flow:**
```
Guest arrives → localStorage fingerprint → Play lessons (no auth) → 
Progress saved locally + DB → Leaderboard → Conversion tracking → 
Lead capture → Institute enrollment
```

### 4.2 Student Dashboard & Learning
**Pages:** unified-dashboard, dashboard-mobile, profile-mobile, sessions, courses, assignments, payments, test-taking, video-courses, mood-learning, messages, peer-socializer, virtual-mall, order-history

**Features:**
- Enrollment-aware dashboard (shows different UI based on enrolled vs unenrolled)
- XP/streak gamification system
- Course browsing and enrollment
- Session scheduling and attendance
- Assignment submission
- Test taking (8 question types)
- Video course player with notes/bookmarks
- Mood-based learning adjustments
- Peer matching for practice
- Virtual mall / book store
- Wallet and payment management

### 4.3 Teacher System
**Pages:** dashboard, classes, students, assignments, homework, schedule, availability, reports, observations, payments, video-courses, test-questions, callern

**Features:**
- Class management and attendance tracking
- Assignment creation and grading
- Schedule/availability management
- Student progress reports
- Teaching observation recording
- Payment/salary tracking
- CallerN video tutoring sessions
- Video course creation
- Test question authoring

### 4.4 CallerN — Phone Tutoring System
**Purpose:** On-demand and scheduled video/audio tutoring via WebRTC.

**Architecture:**
```
Student requests call → WebSocket notification → Teacher accepts →
WebRTC peer connection → Video/audio call → Screen sharing →
AI real-time monitoring → Post-session report → SRS card generation →
Progress tracking → Roadmap advancement
```

**Components:**
- WebRTC video/audio with screen sharing [Implemented — code in useWebRTC.ts, safe-peer.ts, websocket-server.ts]
- AI Supervisor (real-time call monitoring) [Configured — service exists in ai-supervisor-service.ts, requires Ollama/OpenAI]
- Auto-transcription (Whisper) [Configured — whisper-service.ts exists, requires self-hosted Whisper server]
- Post-session reports by teacher [Implemented — callPostReports table + routes]
- SRS (Spaced Repetition System) flashcards [Implemented — srs-service.ts + srsCards schema]
- Syllabus-based progress tracking [Implemented — callernSyllabusTopics + studentCallernProgress tables]
- Package management (minutes/sessions) [Implemented — callernPackages + studentCallernPackages tables]
- Recording and playback [Configured — recording-service.ts exists, requires storage setup]

### 4.5 Admin Panel
**75+ Admin Pages covering:**

**People & Access:**
- User management (CRUD, role assignment, activation)
- Student management (photo upload, level assignment)
- Teacher management (onboarding, payments, QA)
- Mentor matching
- Call center access control
- Subsystem permissions

**Courses & Academics:**
- Course management (CRUD, pricing, scheduling)
- Curriculum categories
- Video courses
- 3D lesson builder
- Roadmap designer (learning paths)
- Exam roadmaps

**Communication:**
- SMS settings and testing (Kavenegar)
- Campaign management (SMS campaigns)
- Visitor chat management
- Blog management (CMS)
- Social media scraper
- Communications hub

**Financial:**
- Financial overview and reports
- Teacher payments
- Currency settings
- Iranian compliance settings
- Shetab payment gateway configuration

**AI & Technology:**
- AI services management (provider selection, health monitoring)
- AI training data management
- AI study partner configuration
- TTS system management
- LinguaQuest administration
- Enhanced analytics dashboard

**System:**
- System settings
- Font management
- Form management (dynamic forms)
- White-label / branding
- Website builder (CMS pages)
- Room management
- Infrastructure health monitoring
- API smoke testing

### 4.6 Call Center
**Pages:** dashboard, calls, campaigns, leads, prospects, unified-workflow, voip-center, workflow-stages (contact-desk, follow-up)

**Features:**
- Lead management and scoring
- Campaign execution (SMS/call)
- VoIP integration (Isabel)
- Prospect lifecycle tracking
- Contact stage workflow
- Follow-up scheduling
- Performance analytics

### 4.7 Supervisor
**Pages:** supervisor-dashboard, teacher-supervision-dashboard

**Features:**
- Business intelligence dashboard
- Teacher supervision and QA
- Performance monitoring
- Call center oversight

### 4.8 Mentor System
**Pages:** dashboard, students, sessions, progress

**Features:**
- Student matching and assignment
- Session tracking
- Progress monitoring with AI recommendations
- Learning path guidance

### 4.9 Accountant
**Pages:** dashboard

**Features:**
- Student registration (enrollment + payment)
- Financial reporting
- Invoice generation
- Chart of accounts / double-entry ledger

### 4.10 Front Desk
**Workflow:** Reception, scheduling, communication

### 4.11 Public Marketing Website
**Pages:** Homepage (/), About, Contact, Blog, Videos, Curriculum, Expert Teachers, Take Test, Services (CallerN), Book Reader

**Features:**
- Marketing landing page
- Blog with articles
- Video gallery
- Curriculum catalog
- Placement test (public, guest-accessible)
- Teacher showcase
- CallerN service page

---

## 5. User Roles & Permissions

### 5.1 Role Definitions

| Role | Internal Key | Primary Access |
|------|-------------|---------------|
| Admin | `Admin` / `admin` | Full platform access, all settings |
| Student | `Student` | Learning, courses, assignments, payments |
| Teacher/Tutor | `Teacher/Tutor` / `teacher` | Classes, students, grading, CallerN |
| Supervisor | `Supervisor` / `supervisor` | Oversight, BI, teacher QA |
| Call Center Agent | `Call Center Agent` / `call_center` | Leads, campaigns, calls |
| Mentor | `Mentor` / `mentor` | Student guidance, sessions |
| Accountant | `Accountant` / `accountant` | Financial operations, student registration |
| Front Desk Clerk | `Front Desk Clerk` / `front_desk` | Reception, scheduling |

### 5.2 Permission Model
- **Route-level protection:** `RoleProtectedRoute` on frontend, `requireRole()` middleware on backend
- **Role strings are case-sensitive** and inconsistent (e.g., `'Admin'` vs `'admin'`, `'call_center'` vs `'Call Center Agent'`)
- No granular permission system (binary: you have the role or you don't)
- Some routes allow multiple roles (e.g., financial pages allow both Admin and Accountant)

### 5.3 Role-Based Navigation
- **Admin:** Full sidebar with collapsible section groups
- **Student:** Mobile bottom navigation (4 tabs: Home, Courses, Progress, Profile)
- **Teacher/Tutor:** Sidebar with Teaching, Content & Reports, Financial sections
- **Supervisor:** Institute Management + Call Center sections
- **Others:** Simplified navigation based on role scope

---

## 6. Authentication & Security

### 6.1 Authentication Flow
```
Phone-First (Primary):
User enters phone → Request OTP → Kavenegar SMS → Verify OTP → JWT tokens

Email/Password (Secondary):
Register with email → Hash password (bcrypt) → Login → JWT tokens

JWT Token System:
- Access token: Short-lived
- Refresh token: Long-lived
- Stored in localStorage (frontend)
- Sent via Authorization: Bearer header
```

### 6.2 Auth Components
| File | Purpose |
|------|---------|
| `server/auth.ts` | Token generation, password hashing, session management |
| `server/auth-middleware.ts` | Express middleware: authenticateToken, requireRole, optionalAuth |
| `server/routes/phone-auth-routes.ts` | Phone OTP authentication endpoints |
| `server/services/otp-service.ts` | OTP generation and verification |
| `server/kavenegar-service.ts` | SMS delivery via Kavenegar API |
| `client/src/hooks/use-auth.ts` | Frontend auth state management |
| `client/src/lib/auth.ts` | Auth utilities |

### 6.3 Security Features
- **Rate limiting** on OTP requests and verification
- **Password hashing** with bcrypt
- **JWT** with access/refresh token pattern
- **Phone number normalization** to +98XXXXXXXXXX format
- **Role-based route protection** (frontend + backend)
- **CORS** configuration
- **Idempotency keys** for payment operations

---

## 7. AI Subsystem

### 7.1 AI Provider Architecture
```
AIProviderManager
├── Primary: OpenAI (default for international/cloud)
├── Primary: Ollama (default for Iranian self-hosting)
└── Fallback: Auto-retry with alternate provider

Configuration via environment variables:
- AI_PROVIDER=ollama|openai
- OPENAI_API_KEY
- OLLAMA_HOST, OLLAMA_MODEL
```

### 7.2 AI Services Inventory

| Service | File | Purpose |
|---------|------|---------|
| AI Personalization | `ai-services.ts` | Adaptive learning recommendations |
| AI Orchestrator | `ai-orchestrator.ts` | Coordinate AI services |
| AI Insights | `ai-insights-service.ts` | Learning analytics insights |
| AI Mentoring | `ai-mentoring-service.ts` | Mentoring recommendations |
| AI Content Generator | `services/ai-content-generator.ts` | Generate learning materials |
| AI Lesson Generator | `services/ai-lesson-generator.ts` | Auto-generate lessons |
| AI Roadmap Generator | `services/ai-roadmap-generator.ts` | Learning path generation |
| AI Sales Agent | `services/ai-sales-agent/` | Telegram bot for sales |
| AI Supervisor | `services/ai-supervisor-service.ts` | Real-time call monitoring |
| AI Study Partner | `services/ai-study-partner/` | Virtual conversation partner |
| AI Analytics | `services/ai-analytics-service.ts` | Pattern detection |
| CEFR Scoring | `services/cefr-scoring-service.ts` | Language level assessment |
| CEFR Tagging | `services/cefr-tagging-service.ts` | Content level tagging |
| Mood Intelligence | `services/mood-intelligence-service.ts` | Emotion-aware learning |
| Persian NLP | `persian-nlp-service.ts` | Persian language processing |
| Lexi AI | `services/lexi-ai-service.ts` | Dictionary/glossary AI |
| Suggestion Engine | `services/suggestion-engine.ts` | Learning suggestions |
| IRT Service | `services/irt-service.ts` | Item Response Theory for testing |

### 7.3 Speech & Audio
| Service | Purpose |
|---------|---------|
| TTS (Edge TTS) | Text-to-speech for learning content |
| Whisper (self-hosted) | Speech-to-text transcription |
| Piper Service | Alternative TTS engine |
| Audio Processor | Audio file processing |

### 7.4 AI Sales Agent (Telegram Bot)
- Automated sales conversations via Telegram
- Trained on platform features and pricing
- Lead capture and qualification
- Knowledge base of 9 documents
- Handles inquiries about courses, pricing, enrollment

---

## 8. Communication & Real-Time Systems

### 8.1 WebRTC (CallerN Video Calls)
```
Components:
- client/src/hooks/useWebRTC.ts — WebRTC hook
- client/src/lib/safe-peer.ts — simple-peer wrapper
- server/websocket-server.ts — Signaling server
- server/webrtc-config.ts — TURN/STUN configuration

Features:
- 1:1 video/audio calls
- Screen sharing
- Call recording
- AI real-time monitoring overlay
```

### 8.2 WebSocket System
```
server/websocket-server.ts — CallerN WebSocket
├── Call signaling (offer/answer/ICE)
├── Real-time notifications
├── Presence tracking
└── Chat messaging
```

### 8.3 Email System
- Nodemailer integration
- OTP delivery
- Notification emails
- Password reset
- Iranian SMTP support

### 8.4 SMS System
- **Kavenegar API** (Iranian SMS provider)
- OTP verification
- Campaign SMS
- Reminder notifications (background worker)
- Domain-based endpoint for cloud servers

### 8.5 VoIP Integration
- **Isabel VoIP** (Iranian telecom)
- Asterisk Manager protocol
- Inbound/outbound call handling
- Call routing to agents

---

## 9. Payment & Financial System

### 9.1 Payment Methods
| Method | Status | Purpose |
|--------|--------|---------|
| Shetab Gateway | Configured | Iranian bank card payments |
| Wallet System | Active | Internal credit/debit |
| Stripe | Configured (code present) | International payments |

### 9.2 Wallet Architecture
```
WalletService (server/wallet-service.ts)
├── Credit operations (add funds)
├── Debit operations (course purchase, services)
├── Transaction logging
├── Idempotency protection
└── Balance tracking per user
```

### 9.3 Financial Modules
- Course payments with enrollment
- Teacher salary/commission tracking
- Invoice generation
- Chart of accounts (double-entry)
- Accounting ledger
- E-commerce orders (book store)
- Currency settings (Iranian Rial/Toman support)

---

## 10. Internationalization (i18n)

### 10.1 Architecture
```
i18next + react-i18next
├── 16 namespace files per language
├── 3 languages: en, fa (Persian), ar (Arabic)
├── RTL/LTR auto-switching
├── Persian calendar support (Jalali)
├── Dynamic font loading (Arabic/Persian fonts)
└── Missing key logging and dev tools
```

### 10.2 Namespaces
| Namespace | Purpose |
|-----------|---------|
| common | Shared UI terms |
| auth | Login, register, OTP |
| student | Student dashboard, profile |
| teacher | Teacher interfaces |
| admin | Admin panel |
| supervisor | Supervisor views |
| callcenter | Call center UI |
| accountant | Financial interfaces |
| frontdesk | Front desk UI |
| mentor | Mentor interfaces |
| callern | CallerN system |
| coursePlayer | Course player UI |
| courses | Course catalog |
| linguaquest | Free learning platform |
| errors | Error messages |
| validation | Form validation |

### 10.3 Persian-Specific Features
- Jalali (Solar Hijri) calendar integration (`jalaali-js`)
- Persian number formatting
- RTL layout support
- Persian font management (custom font upload)
- Iranian phone number validation (+98 format)
- Iranian national ID validation

---

## 11. Third-Party Integrations

### 11.1 Core Integrations
| Service | Usage | Required for Production |
|---------|-------|------------------------|
| PostgreSQL | Database | Yes |
| Kavenegar | SMS/OTP | Yes (Iranian market) |
| Ollama | AI processing | Yes (self-hosted) |
| OpenAI | AI fallback | Optional |
| Edge TTS | Text-to-speech | Yes |
| Faster-Whisper | Speech recognition | Optional |

### 11.2 Optional Integrations
| Service | Usage |
|---------|-------|
| Isabel VoIP | Phone call routing |
| Shetab | Iranian payment gateway |
| Stripe | International payments |
| Telegram Bot API | AI sales agent |
| Nodemailer | Email delivery |
| Asterisk | VoIP PBX integration |
| Keybit Calendar | Persian calendar sync |
| Google TTS | Alternative TTS |
| TensorFlow.js | Client-side ML |
| MediaPipe | Face/hand detection |

### 11.3 Self-Hosting Dependencies
For Iranian production deployment:
```
Required:
- PostgreSQL 14+
- Node.js 18+
- Nginx (reverse proxy)
- Ollama (AI processing)
- Edge TTS server

Recommended:
- Docker (containerization)
- Redis (job queues)
- TURN/STUN server (WebRTC)
- Whisper (speech recognition)
```

---

## 12. Feature Interdependency Map

### 12.1 Core Dependencies
```
Authentication
├── All protected features depend on auth
├── Phone OTP depends on Kavenegar
└── Session management depends on PostgreSQL

User Management
├── Students → Enrollment → Courses
├── Teachers → Classes → Students → Assignments
├── Call Center → Leads → Prospects → Conversion
└── Admin → All subsystems

Course System
├── Courses → Curriculum Categories
├── Enrollment → Payment (Wallet/Shetab)
├── Enrollment → Class Assignment
├── Progress → Testing System
└── Progress → AI Analytics

CallerN System
├── Packages → Student Assignment
├── Sessions → WebRTC → WebSocket
├── Sessions → AI Supervisor
├── Sessions → Transcription (Whisper)
├── Post-Reports → SRS Cards
└── Progress → Roadmaps

LinguaQuest
├── Lessons → Activity Types
├── Progress → localStorage + Database
├── Leaderboard → Guest Tracking
├── Conversion → Lead Capture → Call Center
└── Audio → TTS Service

AI System
├── Provider Manager → Ollama | OpenAI
├── Content Generation → Courses, Lessons
├── Analytics → Student Progress Data
├── Sales Agent → Telegram Bot → Knowledge Base
└── Supervisor → CallerN Sessions

Financial
├── Wallet → User Account
├── Payments → Shetab Gateway
├── Teacher Pay → Session/Class Records
└── E-commerce → Book Orders
```

### 12.2 Data Dependency Chain
```
User Registration
  → Profile Creation
    → Enrollment Request
      → Payment Processing
        → Course Assignment
          → Class Scheduling
            → Session Attendance
              → Assignment Submission
                → Grade/Score Recording
                  → Progress Analytics
                    → AI Recommendations
                      → Next Course Suggestion
```

---

## 13. Improvement Suggestions

### 13.1 Critical Architecture Issues

#### A. Monolithic Route File (CRITICAL)
**Problem:** `server/routes.ts` is 28,230 lines — the single largest file in the codebase. This is extremely difficult to maintain, debug, and review.

**Solution:**
1. Split into domain-based route modules (partially done with `/server/routes/` directory)
2. Complete migration: Move ALL route handlers from `routes.ts` into modular files
3. Use Express Router instances per domain
4. Target: `routes.ts` should be <500 lines (just imports and mounting)

**Impact:** Dramatically improves maintainability, reduces merge conflicts, enables parallel development

#### B. Monolithic Storage File (CRITICAL)
**Problem:** `server/database-storage.ts` is 19,022 lines with 1,058 methods. `server/storage.ts` (interface) is 9,041 lines.

**Solution:**
1. Split into domain-specific storage files (e.g., `user-storage.ts`, `course-storage.ts`, `callern-storage.ts`)
2. Use composition pattern: main storage class delegates to domain storages
3. Consider repository pattern with interfaces per domain

#### C. Role String Inconsistency (HIGH)
**Problem:** Roles are referenced inconsistently: `'Admin'` vs `'admin'`, `'Call Center Agent'` vs `'call_center'`, `'Teacher/Tutor'` vs `'teacher'`.

**Solution:**
1. Define a canonical Role enum/union type
2. Create a role normalization utility
3. Update all `requireRole()` and `allowedRoles` to use the enum
4. Add database migration to normalize stored role values

#### D. Duplicate API Endpoints (HIGH)
**Problem:** Multiple duplicate routes found (e.g., `/api/profile` GET defined at both line 2492 and 26112, `/api/admin/system/configuration` defined twice).

**Solution:**
1. Audit all routes for duplicates
2. Remove duplicated definitions
3. Add route registration validation that warns on duplicates

### 13.2 Performance Optimizations

#### A. Database Query Optimization
**Current:** Many endpoints fetch all records then filter in JavaScript (e.g., `getAllUsers()` then filter).

**Solution:**
1. Add proper WHERE clauses with indexes
2. Implement pagination on all list endpoints
3. Add database-level search (ILIKE, full-text search) instead of in-memory filtering
4. Add missing indexes on frequently queried columns (userId, courseId, status, createdAt)

#### B. API Response Caching
**Current:** No caching layer. Every request hits the database.

**Solution:**
1. Add Redis caching for frequently accessed data (course catalog, settings, user profiles)
2. Implement cache invalidation on mutations
3. Add ETags for client-side caching
4. Cache AI responses with TTL

#### C. Bundle Size Optimization
**Current:** All 220 pages are imported, large dependency tree (TensorFlow.js, MediaPipe, Three.js, TipTap, etc.)

**Solution:**
1. Implement code splitting with React.lazy() for all role-specific pages
2. Only load AI/ML libraries (TensorFlow, MediaPipe) when needed
3. Tree-shake unused Radix UI components
4. Lazy-load Framer Motion animations
5. Consider removing unused dependencies

#### D. Frontend State Management
**Current:** React Query for server state, but some components use excessive re-rendering patterns.

**Solution:**
1. Memoize expensive computations with useMemo
2. Use React.memo for large list items
3. Virtualize long lists (leaderboards, student lists) with react-window
4. Debounce search inputs consistently

### 13.3 Security Hardening

#### A. Token Storage (HIGH)
**Problem:** JWT tokens stored in localStorage, vulnerable to XSS attacks.

**Solution:**
1. Move to httpOnly cookies for token storage
2. Implement CSRF protection with SameSite cookies
3. Add Content-Security-Policy headers

#### B. Input Validation (MEDIUM)
**Problem:** Inconsistent input validation — some endpoints validate with Zod, others don't validate at all.

**Solution:**
1. Create Zod schemas for ALL API inputs
2. Add middleware that validates request body against schemas
3. Sanitize HTML inputs (potential XSS through TipTap editor content)

#### C. Rate Limiting (MEDIUM)
**Problem:** Rate limiting only on OTP endpoints.

**Solution:**
1. Add global rate limiting per IP
2. Add per-user rate limiting on mutation endpoints
3. Implement progressive delays on failed auth attempts

#### D. API Key Exposure (LOW)
**Problem:** Some API keys are referenced in frontend code paths.

**Solution:**
1. Audit all frontend code for hardcoded keys/secrets
2. Ensure all API calls to third-party services go through the backend
3. Add server-side proxy for any external API calls

### 13.4 Code Quality Improvements

#### A. TypeScript Strictness
**Problem:** Extensive use of `any` types throughout the codebase (~1,400+ LSP diagnostics in core files).

**Solution:**
1. Enable strict TypeScript configuration incrementally
2. Define proper types for all API request/response payloads
3. Replace `any` with specific types, especially in route handlers (`req: any`)
4. Use Drizzle's inferred types for database operations

#### B. Error Handling
**Problem:** Inconsistent error handling — some endpoints return proper error responses, others catch-all with generic messages.

**Solution:**
1. Create a centralized error handling middleware
2. Define error response format (code, message, details)
3. Add proper error logging with context (user, route, payload)
4. Distinguish between client errors (4xx) and server errors (5xx)

#### C. Dead Code
**Problem:** Multiple backup files (`.backup`), archived components (`_archived/`), duplicate service files (`shetab-service.ts` + `shetab-service-v2.ts`).

**Solution:**
1. Remove backup files (version control handles history)
2. Remove archived components
3. Consolidate duplicate services
4. Run dead code analysis tools

#### D. Testing
**Problem:** Very limited test coverage — only a few test files found (`server/__tests__/teacher-coaching.test.ts`, `client/src/components/callern/__tests__/`).

**Solution:**
1. Add unit tests for critical business logic (wallet operations, enrollment, scoring)
2. Add API integration tests for auth flow, payment flow
3. Add component tests for complex UI (CallerN, LinguaQuest)
4. Set up CI pipeline with minimum coverage thresholds
5. Implement E2E tests with Playwright for critical user journeys

### 13.5 UX/UI Enhancements

#### A. Consistent Mobile Experience
**Problem:** Some pages have dedicated mobile versions (`*-mobile.tsx`), most don't. Inconsistent mobile UX.

**Solution:**
1. Use responsive design patterns for all pages (rather than separate mobile pages)
2. Implement breakpoint-based layout switching within components
3. Remove duplicate mobile pages, using CSS-driven responsive patterns instead

#### B. Loading States
**Problem:** Basic loading spinners. No skeleton loading, no optimistic updates.

**Solution:**
1. Add skeleton loading screens for all data-heavy pages
2. Implement optimistic updates for mutations (assignments, messages, likes)
3. Add proper error boundaries with retry options

#### C. Offline Support
**Problem:** PWA is configured but offline functionality is limited.

**Solution:**
1. Cache critical pages for offline access
2. Queue mutations for offline mode (assignments, messages)
3. Show clear offline indicators
4. Sync queued operations when connection restores

#### D. Accessibility
**Solution:**
1. Add ARIA labels to all interactive elements
2. Ensure keyboard navigation works throughout
3. Test with screen readers
4. Add focus management for modals and dialogs

### 13.6 Scalability Improvements

#### A. Background Job Processing
**Current:** SMS reminders run as a simple setInterval worker.

**Solution:**
1. Implement BullMQ (already in dependencies) for all background jobs
2. Move AI operations to job queues
3. Add TTS audio generation queue
4. Implement email sending queue
5. Add job monitoring dashboard

#### B. File Storage
**Current:** Files stored on local filesystem.

**Solution:**
1. Implement object storage abstraction (S3-compatible)
2. Add CDN support for static assets
3. Implement image optimization pipeline
4. Add upload size limits and type validation

#### C. Database Connection Pooling
**Current:** Single database connection.

**Solution:**
1. Configure connection pooling (pgBouncer or Drizzle pooling)
2. Add read replicas for query-heavy operations
3. Implement connection retry logic

### 13.7 Developer Experience

#### A. API Documentation
**Problem:** No API documentation. 974 endpoints with no swagger/OpenAPI spec.

**Solution:**
1. Add Swagger/OpenAPI annotations to all routes
2. Generate interactive API documentation
3. Add request/response examples
4. Create Postman/Bruno collection

#### B. Environment Management
**Solution:**
1. Create `.env.example` with all required variables
2. Add environment validation on startup (partially done)
3. Document all configuration options
4. Add Docker Compose for local development

#### C. Monitoring & Observability
**Solution:**
1. Add structured logging (winston/pino)
2. Implement request tracing (correlation IDs)
3. Add performance metrics (response times, error rates)
4. Create health check dashboard
5. Set up alerting for critical failures

---

## 14. Engineering Quality Assessment

### 14.1 Strengths
| Area | Assessment |
|------|-----------|
| Feature richness | Exceptional — covers nearly every aspect of institute management |
| AI integration depth | Excellent — 18+ AI services with multi-provider support |
| i18n implementation | Good — 3 languages, RTL support, Persian calendar |
| Mobile awareness | Good — dedicated mobile views for key pages |
| Self-hosting design | Good — designed for zero external dependencies |
| Financial system | Good — wallet, Shetab gateway, double-entry accounting |
| Real-time features | Good — WebRTC, WebSocket, live monitoring |

### 14.2 Weaknesses
| Area | Assessment | Severity |
|------|-----------|----------|
| Code organization | Monolithic core files (28K + 19K + 9K lines) | Critical |
| Role consistency | Inconsistent role strings across frontend/backend | High |
| Test coverage | Almost no tests | High |
| TypeScript strictness | Excessive `any` usage | Medium |
| API documentation | None | Medium |
| Dead code | Backup files, duplicate services | Low |
| Error handling | Inconsistent across endpoints | Medium |

### 14.3 Technical Debt Score: 7/10 (High)
The platform has impressive breadth but accumulated significant technical debt due to rapid feature development. The core files need restructuring before adding more features.

---

## 15. Uniqueness & Competitive Advantages

### 15.1 What Makes This Platform Unique

1. **Iranian Market Focus** — No other platform offers this combination:
   - Shetab payment gateway [Configured — code exists, needs gateway credentials]
   - Kavenegar SMS integration [Implemented — API key configured, OTP working]
   - Jalali calendar throughout [Implemented — jalaali-js integrated]
   - RTL-first design [Implemented — auto RTL/LTR switching]
   - Ollama for data-sovereign AI [Configured — auto-fallback to OpenAI]
   - Designed for self-hosting with minimal external dependencies

2. **CallerN System** — Phone-based tutoring with:
   - WebRTC video + AI supervisor
   - Real-time transcription
   - Post-session SRS cards
   - Package-based billing
   - Unique in the language learning space

3. **LinguaQuest Free Gateway** — 23 interactive activity types:
   - Guest-based (no auth friction)
   - Conversion tracking funnel
   - 3D-ready architecture
   - Unique approach to lead generation through gamified learning

4. **8-Role Architecture** — Most platforms have 2-3 roles. This covers:
   - Full institute operations
   - Call center for sales
   - Supervision and QA
   - Mentoring
   - Accounting
   - Front desk reception

5. **AI Depth** — 18+ AI services covering:
   - Adaptive learning
   - Content generation
   - Sales automation (Telegram bot)
   - Real-time call monitoring
   - Mood-based learning
   - IRT-based adaptive testing
   - Persian NLP

6. **Integrated E-Commerce** — Book store with:
   - Digital + physical products
   - Shopping cart
   - Shipping/courier tracking
   - PDF reader with dictionary lookups

### 15.2 Recommendations to Strengthen Uniqueness

1. **Double down on CallerN** — This is the most differentiated feature. Add:
   - Group calls for class sessions
   - Call recording library with AI search
   - Automated post-session email reports to students/parents
   - Integration with WhatsApp for notifications

2. **LinguaQuest as a standalone** — Consider making it:
   - Embeddable widget for partner websites
   - Mobile app (React Native)
   - Social sharing of achievements
   - Multi-language content (not just English learning)

3. **AI Tutor Identity** — Create a named, persistent AI character that:
   - Remembers conversation history
   - Adapts personality to student preferences
   - Provides emotional support
   - Has a consistent avatar/voice across all interactions

4. **Parent Portal** — Add a role for parents to:
   - Track their child's progress
   - Communicate with teachers
   - View attendance and grades
   - Manage payments

5. **Iranian Compliance Package** — Turn the Iranian-specific features into a sellable module:
   - Shetab integration toolkit
   - Kavenegar SMS toolkit
   - Jalali calendar component library
   - RTL design system
   - This has value beyond just language learning

---

## Appendix A: File Size Report (Largest Files)

| File | Lines | Concern |
|------|-------|---------|
| server/routes.ts | 28,230 | Must be split |
| server/database-storage.ts | 19,022 | Must be split |
| server/storage.ts | 9,041 | Must be split |
| shared/schema.ts | 8,945 | Consider splitting by domain |
| client/src/App.tsx | 1,240 | Moderate — acceptable with lazy loading |

## Appendix B: Complete API Endpoint Count by Category

| Category | Estimated Count |
|----------|----------------|
| Auth (register, login, OTP, password) | ~15 |
| Admin management | ~120 |
| Course & curriculum | ~40 |
| Student features | ~60 |
| Teacher features | ~30 |
| CallerN system | ~50 |
| Financial/payment | ~30 |
| AI services | ~80 |
| CMS/blog/media | ~40 |
| LinguaQuest | ~25 |
| Testing/assessment | ~30 |
| Communication | ~25 |
| Gamification | ~20 |
| E-commerce | ~30 |
| System/monitoring | ~40 |
| Third-party integration | ~20 |
| Other | ~319 |
| **Total** | **~974** |

## Appendix C: Technology Stack Summary

### Frontend
React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query v5, Wouter, Framer Motion, i18next, React Hook Form, Zod, TipTap, Recharts, Three.js, simple-peer, TensorFlow.js, MediaPipe

### Backend
Express.js, TypeScript (ESM), Drizzle ORM, PostgreSQL, JWT, BullMQ, Multer, Nodemailer, csv-parse, json2csv, ws, express-rate-limit

### AI/ML
Ollama, OpenAI API, Edge TTS, Faster-Whisper, TensorFlow.js, MediaPipe

### Iranian Services
Kavenegar (SMS), Shetab (Payments), Isabel VoIP, Jalali Calendar, Persian NLP

---

*This document was generated by analyzing the complete Meta Lingua Academy codebase. It reflects the state of the platform as of February 16, 2026.*
