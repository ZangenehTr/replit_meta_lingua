# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced, multilingual language learning and institute management platform. It is designed for self-hosting by language institutes, offering comprehensive administration, student management, course enrollment, VoIP integration, and a wallet-based payment system. The platform aims to provide a powerful, customizable, and independent solution, particularly for regions prioritizing data sovereignty and local infrastructure. Its business vision is to empower language institutes with a robust, self-managed digital learning ecosystem.

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
- **UI/UX**: WCAG-compliant modern design, mobile-first responsiveness, touch-optimized components, role-based UI, PWA support, dark mode. Features include a Unified Dashboard for 8 user roles, LinguaQuest interactive game system (23 activity types), TTS audio pre-generation, Dynamic Form Management, a public marketing website, SMS Campaign Management, Dynamic Curriculum Category System, Guest Placement Test Flow (AI-powered, CEFR results), Visitor Chat System, and Admin Infrastructure Status Widget.
- **Navigation**: Role-based sidebar grouping for admin, supervisor, teacher, and front desk roles. Student role uses mobile bottom navigation.

### Backend
- **Framework**: Express.js with TypeScript, Node.js ESM modules.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: JWT with refresh tokens, role-based access control (8 user roles), phone-only OTP authentication via Kavenegar. No email/password logins exist anywhere.
- **API Design**: RESTful.
- **Phone Number Normalization**: Centralized normalization to +98XXXXXXXXXX format.
- **Key Features**: User & Course Management, payment & wallet system, AI Integration (adaptive micro-sessions, content generation via Ollama, AI Lesson Generator, AI Supervisor for video calls, AI 24/7 Sales Agent), Video & Communication (24/7 on-demand video tutoring via WebRTC, screen sharing, call recording, AI features like live vocab/auto-transcript/grammar rewrite, VoIP), Gamification (XP/level system, achievements), Testing System (8 question types, MST Placement Test), Unified Class Scheduling, CMS Platform (Blog, Video, Media library), CallerN Storage Layer for session management, roadmap tracking, and OTP Service (SMS).

### Payment & Enrollment Pipeline (Multi-Gateway)
- **Active gateway** is read from `adminSettings.activePaymentGateway` (default: `shetab`).
- **Gateway factory** at `server/payment/gateway-factory.ts` returns the active `PaymentGateway` implementation.
- **Supported gateways**: `shetab`, `zarinpal`, `idpay`, `zibal`, `mellat` (mellat UI only, no SOAP yet).
- **Wallet topup** and **course enroll** routes both use `getActiveGateway()` — no longer hardcoded to Shetab.
- **Shetab callback** (legacy, unchanged): `POST /api/payments/shetab/callback` — dispatches by `transactionId` prefix:
  - `COURSE_*` → calls `updateCoursePaymentStatus(..., 'completed')`. Redirects to `/courses`.
  - `WALLET_*` → calls `updateWalletTransactionStatus(..., 'completed')`. Redirects to `/student/wallet`.
- **New gateway callbacks**:
  - `GET /api/payments/zarinpal/callback` — verifies Authority, dispatches by orderId prefix.
  - `POST /api/payments/idpay/callback` — verifies id+order_id, dispatches by orderId prefix.
  - `GET /api/payments/zibal/callback` — verifies trackId+orderId, dispatches by orderId prefix.
- **Admin config UI**: `/admin/payment-gateway` — select active gateway, configure credentials, test connectivity.
- **Admin API**: `GET/PUT /api/admin/payment-gateway/config`, `POST /api/admin/payment-gateway/test`.
- **Gateway transactionId storage**: Stored in `walletTransactions.shetabTransactionId` / `coursePayments.gatewayTransactionId` for Zarinpal authority lookup during callbacks.
- **New schema fields**: `adminSettings` gains 15 gateway config columns; `walletTransactions` gains `gatewayName`; `coursePayments` gains `merchantTransactionId`, `gatewayTransactionId`, `gatewayReferenceNumber`, `gatewayName`, `cardNumber`, `originalPrice`, `discountPercentage`, `finalPrice`, `creditsAwarded`.
- **Enroll route** (`POST /api/courses/enroll`) — accepts paymentMethod: `wallet | shetab | zarinpal | idpay | zibal | mellat | gateway`. Free courses (price = 0) enroll directly. Wallet payment immediate.

### Isabel VoIP Integration (Issabel PBX)
- **Protocol**: AMI (Asterisk Manager Interface) TCP on **port 5038** — not SIP port 5060, not HTTP.
- **Library**: `asterisk-manager` package v0.2.0.
- **File**: `server/isabel-voip-service.ts` — fully real implementation, no simulation code.
- **Capabilities**: Originate calls (`SIP/<username>` channel, `from-internal` context), MixMonitor recording on bridge, Hangup, Ping/testConnection, auto-reconnect via `keepConnected()`.
- **VoIP diagnostic route**: Uses `net.Socket` TCP probe + AMI Ping/Pong authentication, no HTTP fetch to port 5038.
- **Env vars**: `ISABEL_VOIP_ENABLED`, `ISABEL_VOIP_SERVER`, `ISABEL_VOIP_PORT` (default: 5038), `ISABEL_VOIP_USERNAME`, `ISABEL_VOIP_PASSWORD`.
- **Issabel version note**: Issabel 4.0.0 / Asterisk 11.25.3 does NOT support ARI, PJSIP, or WebRTC↔PSTN. CallerN WebRTC is browser-to-browser and works independently of Asterisk.

### HR Module (Human Resources)
- **Schema Tables**: `employees`, `contracts`, `leave_requests`, `payroll_records`, `performance_reviews` in `shared/schema.ts`.
- **Backend**: `server/routes/hr-routes.ts` — full CRUD for employees, contracts, leave approval workflow, payroll calculation, and AI-powered performance review generation/publishing.
- **Services**: `server/services/hr-performance-aggregator.ts` computes role-specific KPI metrics pulling from CallerN scoring events, AI supervisor observations, lead activity, test scores. `server/services/hr-ai-narratives.ts` calls Ollama/OpenAI to generate monthly narratives, improvement plans, and anomaly alerts (15-point drop detection vs 3-month rolling average).
- **Route prefix**: `/api/hr/employees` — sub-paths: `/:id/contracts`, `/:id/leaves`, `/leaves/all`, `/leaves/:id/review`, `/payroll/period`, `/payroll/calculate`, `/payroll/:id/approve`, `/:id/performance`, `/:id/performance/generate`, `/:id/performance/:id/publish`, `/performance/anomalies`.
- **Frontend pages**: `/admin/hr/employees`, `/admin/hr/leave`, `/admin/hr/payroll`, `/admin/hr/performance`.
- **Role access**: Admin = full access; Supervisor = employees/leave/performance (read + leave approve); Accountant = payroll read-only.
- **Subsystem keys**: `hr_employees`, `hr_leave`, `hr_payroll`, `hr_performance` in `SUBSYSTEM_ROUTES` and `SUBSYSTEM_TREE`.

### Call Center ERP (24-Stage Pipeline)
- **Workflow Stages**: contact_desk → new_intake → follow_up/no_response → level_assessment → evaluation → consultation_cc/sup → pre_registration → final_registration → enrolled/private_class_setup → active class lifecycle
- **Transitions**: Validated via LEAD_STAGE_TRANSITIONS map in shared/schema.ts, covering all 24 stages with forward/backward paths
- **Activity Log**: lead_activity_log table with full field snapshots for audit trail, auto-recorded on every transition
- **SMS Triggers**: Auto-SMS via Kavenegar on key transitions (level_assessment, pre_registration, final_registration, enrolled, withdrawal)
- **Frontend**: 24 React components (7933 lines) in client/src/pages/callcenter/workflow-stages/ with real API calls
- **Schema**: Extended leads table with 27+ fields for withdrawal tracking, retry scheduling, follow-up color coding, assessment, payment, class management

### Database Design
- **ORM**: Drizzle.
- **Migration command**: `npm run db:push` (development) or `docker compose exec app npm run db:push` (production).
- **Schema**: Supports comprehensive user, course, payment, gamification, mood intelligence, guest progress, LinguaQuest lessons, dynamic forms, curriculum categories, guest leads, visitor chat, custom fonts, CallerN session tracking, Daily Challenges, AI Supervisor Analysis, and Call Center ERP (lead_activity_log for audit trail).

### AI Provider Configuration
- Flexible selection via environment variables, supporting Ollama (default for self-hosting) and OpenAI, with automatic retry and fallback. Admin dashboard widget for monitoring and selection.

### Queue System (Redis)
- BullMQ queues via `ioredis` for content generation jobs.
- Redis connection reads **individual vars**: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — NOT `REDIS_URL`.
- In Docker Compose, `REDIS_HOST=redis` (container service name).

### Deployment Strategy
- **Development**: Replit with Neon PostgreSQL. Run `npm run dev`.
- **Production**: Docker Compose on Iranian self-hosted server. See `COMPREHENSIVE_DEPLOYMENT_GUIDE.md` for full step-by-step instructions.
- **Build**: `npm run build` → Vite frontend + esbuild server bundle → `npm start` runs from `dist/`.
- **Docker**: Multi-stage Dockerfile (non-root `nodejs:1001` user, Iran timezone `Asia/Tehran`, `dumb-init` entrypoint). `docker-compose.yml` includes PostgreSQL 14 + Redis 7 with health checks and dependency ordering.
- **Nginx**: `nginx-example.conf` provides SSL termination, WebSocket upgrade, 100 MB upload limit, gzip, security headers.

## Critical Environment Variable Notes

The following three vars must always be set to the same value (your public domain). They control different parts of the payment flow:

| Variable | Used by |
|---|---|
| `APP_URL` | docker-compose reference variable |
| `BASE_URL` | Shetab callback URL fallback in shetab-service.ts |
| `FRONTEND_URL` | Post-payment redirect in routes.ts |

In `docker-compose.yml`, all three are derived from `${APP_URL}` automatically.

## External Dependencies

### Development Environment
- **Database**: Neon PostgreSQL
- **Testing**: Playwright (E2E), Vitest (unit)

### Production Environment (Iranian Self-Hosting)
- **Database**: Self-hosted PostgreSQL 14+ (container or bare metal)
- **Queue**: Redis 7 (container)
- **Payment Gateway**: Shetab (Iranian network) — callback path: `/api/payments/shetab/callback`
- **SMS Service**: Kavenegar (Iranian provider) — mandatory for OTP login
- **VoIP**: Issabel PBX via AMI on port 5038
- **AI Services**: Ollama server (local AI processing); configurable with OpenAI as an alternative
- **TTS Services**: Microsoft Edge TTS (self-hosted)
- **Speech Recognition**: Faster-Whisper (self-hosted); configurable with OpenAI Whisper as an alternative
- **Fonts**: Self-hosted Arabic/Persian fonts
- **WebRTC**: Self-hosted TURN/STUN server (coturn) — required for cross-NAT video calls
- **Email**: Iranian SMTP infrastructure (optional)
- **Video Infrastructure**: Local filesystem storage and streaming
- **File Storage**: Local server filesystem (`./uploads` volume mounted in Docker)

## Key Files

| File | Purpose |
|---|---|
| `server/isabel-voip-service.ts` | Isabel VoIP AMI integration (port 5038, asterisk-manager) |
| `server/shetab-service.ts` | Iranian payment gateway |
| `server/routes.ts` | All API routes including payment callback dispatch logic |
| `server/database-storage.ts` | All database operations |
| `shared/schema.ts` | Drizzle schema + LEAD_STAGE_TRANSITIONS map |
| `Dockerfile` | Multi-stage production build |
| `docker-compose.yml` | Production stack (app + postgres + redis) |
| `.env.example` | Canonical reference for all environment variables |
| `nginx-example.conf` | Production Nginx reverse proxy config |
| `COMPREHENSIVE_DEPLOYMENT_GUIDE.md` | Step-by-step self-hosting guide (current, Docker-based) |
| `scripts/deploy.sh` | Automated deployment script |
| `scripts/backup-daily.sh` | Database + uploads backup script |
| `install-ollama-iran.sh` | Ollama installation helper for Iranian servers |
