# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced, multilingual language learning and institute management platform designed for self-hosting by language institutes. It offers comprehensive administration, student management, course enrollment, VoIP integration, and a wallet-based payment system. The platform aims to provide a powerful, customizable, and independent solution, particularly for regions prioritizing data sovereignty and local infrastructure, empowering institutes with a robust, self-managed digital learning ecosystem.

## User Preferences
Preferred communication style: Simple, everyday language.
Work sessions: User prefers to have work logged so they can resume from where we left off.
Critical requirement: Self-hosting in Iran with zero external dependencies. Must follow check-first protocol.
Database strategy: Use Replit/Neon for development only, migrate to self-hosted PostgreSQL for production in Iran.
Code quality: Always avoid duplications - no duplicate code, methods, or logic. Prefer composition and reuse over duplication.
Language preference: Default language set to Farsi (fa) for Iranian users.
AI Sales Agent: Telegram bot must be trained on ALL platform features with attractive messaging emphasizing novelty and innovation.
CRITICAL DIRECTIVE: Before any implementation, check existing codebase to avoid duplication. NO hardcoded data, NO fake/mock data, NO non-functional buttons, always use real API calls and working e2e business logic.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Tailwind CSS with shadcn/ui components, Vite for building.
- **State Management**: TanStack React Query.
- **Routing**: Wouter.
- **Localization**: i18n for multi-language support (Persian, English, Arabic) with full RTL/LTR handling.
- **UI/UX**: WCAG-compliant modern design, mobile-first responsiveness, touch-optimized components, role-based UI, PWA support, dark mode. Features include a Unified Dashboard for 8 user roles, LinguaQuest interactive game system, TTS audio pre-generation, Dynamic Form Management, a public marketing website, SMS Campaign Management, Dynamic Curriculum Category System, Guest Placement Test Flow (AI-powered, CEFR results), Visitor Chat System, and Admin Infrastructure Status Widget.
- **Navigation**: Role-based sidebar grouping for admin, supervisor, teacher, and front desk roles. Student role uses mobile bottom navigation.
- **Component Structure (post Task #18)**: All 12 previously monolithic page components decomposed — each page is under 400 lines. Domain components live in `client/src/components/<domain>/`. 8 data-fetching hooks extracted: `useStudents`, `useCampaigns`, `useCommunications`, `useSystem`, `useTeachers`, `useAssignments`, `useSupervisorDashboard`, `useSmsTemplates`.

### Backend
- **Framework**: Express.js with TypeScript, Node.js ESM modules.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: JWT with refresh tokens, role-based access control (8 user roles), phone-only OTP authentication via Kavenegar.
- **API Design**: RESTful.
- **Phone Number Normalization**: Centralized normalization to +98XXXXXXXXXX format.
- **Code Structure (post Task #17)**: `server/routes.ts` reduced from 29,586 → 403 lines; `server/storage.ts` reduced from 9,043 → 40 lines; `shared/schema.ts` (10,015 lines) converted to a 1-line barrel re-export shim. All `@shared/schema` imports unchanged. Domain files: 15 schema files in `shared/schema/`, 8 storage modules in `server/storage/`, 64 route files in `server/routes/`. TypeScript: zero errors.
- **Key Features**: User & Course Management, payment & wallet system, AI Integration (adaptive micro-sessions, content generation via Ollama, AI Lesson Generator, AI Supervisor for video calls, AI 24/7 Sales Agent), Video & Communication (24/7 on-demand video tutoring via WebRTC, screen sharing, call recording, AI features), Gamification (XP/level system, achievements), Testing System (8 question types, MST Placement Test), Unified Class Scheduling, CMS Platform (Blog, Video, Media library), CallerN Storage Layer for session management, and OTP Service (SMS).
- **Teacher Profiles & CallerN Presence v2**: Three-state presence (available/teaching/offline) in CallerN; `callern_teacher_followers` table with follow/unfollow REST API; WebSocket Notify-Me push when teacher comes online; public `GET /api/teachers/:id/profile` endpoint; `/tutors/:id` public profile page; `TeacherNameLink` shared component; admin followers leaderboard dashboard tab in CallerN Management.
- **CRM Bridge (Task #8)**: Self-registration → CRM lead (phone OTP and email registration paths both auto-create `source='self_registration'` leads, dedup by phone, non-blocking); `advanceLeadAfterPayment()` helper auto-advances lead to `enrolled` + writes activity log after wallet/gateway payments; `POST /api/leads/:id/finalize-payment` for cash/POS/cheque offline payments; `/welcome` onboarding page for new students (teacher wall, placement CTA, course teaser, LinguaQuest preview, certificate mockup) with auto-redirect if already enrolled; `GET /api/leads?source=...` filtering + self-registration quick-filter banner card in admin leads UI.
- **Scraper → CRM Bridge (Task #16)**: `server/services/scraper-crm-bridge.ts` with `promoteScrapedLead()` (phone dedup to +98 format, create/update CRM record, activity log) and `runAutoPromotion()` (15-min scheduled batch, reads threshold from `adminSettings.scraperAutoPromotionThreshold`, default 60, cap 50/batch); Admin endpoints: `GET /api/admin/scraped-leads` (filterable), `POST /api/admin/scraped-leads/:id/promote`, `POST /api/admin/scraped-leads/:id/dismiss`, `POST /api/admin/scraped-leads/bulk-promote`; "Scraped Leads" tab in admin CRM Leads page with qualification score badges, per-row promote/dismiss, bulk-select and bulk-promote; schema: `leads.scrape_source_ref`, `leads.scrape_qualification_score`, `admin_settings.scraper_auto_promotion_threshold` columns added via startup migration.
- **AI Content & SEO Pipeline (Task #14)**: `server/services/ai-cms-content-service.ts` + BullMQ worker for async blog/landing page generation from Ollama; prompt template library in DB; admin approval workflow (draft → pending_admin_review → published); scheduled publisher (every 5 min); SEO fields auto-filled (metaTitle, metaDescription, keywords, slug); sitemap.xml auto-updated on publish; social media content generation for Facebook/Instagram/LinkedIn/Twitter.
- **MST/IRT Reliability (Task #15)**: IRT 3PL model correctly implemented; CEFR theta mapping: A1=−2.0, A2=−1.0, B1=0.0, B2=+1.0, C1=+2.0, C2=+3.0; `mst_sessions`, `mst_responses`, `mst_item_parameters` tables; per-skill quickscoring with IRT fallback; adaptive routing logic in `server/modules/mst/routing/router.ts`; telemetry stored for every response.

### Payment & Enrollment Pipeline
- **Multi-Gateway Support**: Active gateway dynamically read from `adminSettings.activePaymentGateway` (default: `shetab`), with a gateway factory for supported providers like Shetab, Zarinpal, IDPay, Zibal, and Mellat.
- **Callbacks**: Specific API endpoints for each gateway to handle transaction verification and status updates for course payments and wallet top-ups.
- **Admin Configuration**: UI for selecting and configuring active payment gateways, including connectivity testing.
- **Transaction Storage**: Enhanced schema fields in `walletTransactions` and `coursePayments` for detailed transaction tracking across various gateways.
- **Enrollment**: `POST /api/courses/enroll` route supports various payment methods, including wallet and multiple payment gateways.

### Isabel VoIP Integration
- **Protocol**: AMI (Asterisk Manager Interface) TCP on port 5038.
- **Library**: `asterisk-manager` package.
- **Capabilities**: Originate calls, MixMonitor recording, Hangup, Ping/testConnection, auto-reconnect.
- **Diagnostics**: VoIP diagnostic route uses `net.Socket` TCP probe and AMI Ping/Pong authentication.

### HR Module
- **Schema**: Dedicated tables for `employees`, `contracts`, `leave_requests`, `payroll_records`, `performance_reviews`, and `performance_scores`.
- **Backend**: Full CRUD operations with role-strict RBAC for employees, contracts, leave, payroll, and performance management.
- **Services**: `hr-performance-aggregator.ts` computes role-specific KPI metrics (Teacher, Call Center Agent, Mentor, Supervisor, Front Desk) and `hr-ai-narratives.ts` for anomaly detection and alerts.
- **Scheduler**: BullMQ Queue for monthly performance aggregation and startup backfill.
- **Self-service**: Employees can submit and view their own leave requests.
- **Anomaly Configuration**: `adminSettings` fields for HR anomaly threshold and notification.
- **Frontend Pages**: Dedicated admin pages for employees, leave management, payroll, and performance.

### Call Center ERP
- **Workflow**: 24-stage pipeline for lead management from contact to enrollment, with validated transitions via `LEAD_STAGE_TRANSITIONS` map.
- **Activity Log**: `lead_activity_log` table records full field snapshots for audit trails on every transition.
- **SMS Triggers**: Auto-SMS via Kavenegar on key transition points.
- **Frontend**: Extensive React components for managing each workflow stage.
- **Schema**: Extended `leads` table with comprehensive fields for tracking.

### Database Design
- **ORM**: Drizzle.
- **Schema location**: `shared/schema/` directory (15 domain files) with `shared/schema.ts` as compatibility barrel re-export. Domain files: `users.ts`, `courses.ts`, `cms.ts`, `hr.ts`, `mst.ts`, `gamification.ts`, `scraper.ts`, `callern.ts`, `payments.ts`, `leads.ts`, `marketing.ts`, `teaching.ts`, `features.ts`, `curriculum-ext.ts`, `social.ts`.
- **Coverage**: Comprehensive support for user, course, payment, gamification, mood intelligence, guest progress, LinguaQuest lessons, dynamic forms, curriculum categories, guest leads, visitor chat, custom fonts, CallerN session tracking, Daily Challenges, AI Supervisor Analysis, and Call Center ERP.

### AI Provider Configuration
- Flexible selection via environment variables, supporting Ollama (default for self-hosting) and OpenAI, with automatic retry and fallback.

### Queue System
- BullMQ queues using `ioredis` for content generation jobs.
- Redis connection configured via individual environment variables (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`).

### Deployment Strategy
- **Development**: Replit with Neon PostgreSQL.
- **Production**: Docker Compose on Iranian self-hosted server, using a multi-stage Dockerfile and a `docker-compose.yml` that includes PostgreSQL and Redis.
- **Nginx**: Example configuration for SSL termination, WebSocket upgrade, and security headers.

### Critical Environment Variable Notes
- `APP_URL`, `BASE_URL`, and `FRONTEND_URL` must always be set to the same public domain for correct payment flow functionality.

## External Dependencies

### Development Environment
- **Database**: Neon PostgreSQL
- **Testing**: Playwright (E2E), Vitest (unit)

### Production Environment (Iranian Self-Hosting)
- **Database**: Self-hosted PostgreSQL 14+
- **Queue**: Redis 7
- **Payment Gateway**: Shetab (Iranian network)
- **SMS Service**: Kavenegar (Iranian provider)
- **VoIP**: Issabel PBX via AMI on port 5038
- **AI Services**: Ollama server (local AI processing); configurable with OpenAI
- **TTS Services**: Microsoft Edge TTS (self-hosted)
- **Speech Recognition**: Faster-Whisper (self-hosted); configurable with OpenAI Whisper
- **Fonts**: Self-hosted Arabic/Persian fonts
- **WebRTC**: Self-hosted TURN/STUN server (coturn)
- **Email**: Iranian SMTP infrastructure (optional)
- **Video Infrastructure**: Local filesystem storage and streaming
- **File Storage**: Local server filesystem
