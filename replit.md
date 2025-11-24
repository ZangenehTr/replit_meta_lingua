# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced, multilingual language learning and institute management platform designed for self-hosting by language institutes globally. It supports teaching various languages, extensive administration, student management, course enrollment, VoIP integration, and a wallet-based payment system. Its primary goal is to provide a powerful, customizable, and independent platform, particularly in regions requiring self-hosted solutions, offering a comprehensive and customizable solution for language education and administration.

## User Preferences
Preferred communication style: Simple, everyday language.
Work sessions: User prefers to have work logged so they can resume from where we left off.
Critical requirement: Self-hosting in Iran with zero external dependencies. Must follow check-first protocol.
Database strategy: Use Replit/Neon for development only, migrate to self-hosted PostgreSQL for production in Iran.
Code quality: Always avoid duplications - no duplicate code, methods, or logic. Prefer composition and reuse over duplication.
Language preference: Default language set to Farsi (fa) for Iranian users.
CRITICAL DIRECTIVE: Before any implementation, check existing codebase to avoid duplication. NO hardcoded data, NO fake/mock data, NO non-functional buttons, always use real API calls and working e2e business logic.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Tailwind CSS with shadcn/ui components.
- **State Management**: TanStack React Query.
- **Routing**: Wouter.
- **Build Tool**: Vite.
- **Localization**: Multi-language support with i18n and full RTL/LTR handling (Persian/English/Arabic).
- **UI/UX**: Modern gradient backgrounds, professional layouts, mobile-first responsive design, touch-optimized components, role-based UI, resizable panels, and bottom navigation for mobile.
- **Responsive Design**: Collapsible sidebar for tablets/desktop, mobile sheet sidebar, responsive grids, smooth transitions, localStorage state persistence.
- **Key Features**:
    - Unified Dashboard for 8 user roles with conditional feature display.
    - **LinguaQuest interactive game system with 23 activity types** including 4 new game modes (Synonym/Antonym Matching, Word Formation, Grammar Battles, Timed Vocabulary Blitz) with 6 B1-C1 lessons.
    - TTS audio pre-generation pipeline.
    - Dynamic Form Management System for custom forms with 9 field types.
    - Front Desk Clerk Pages with i18n, including Dashboard, Walk-in Intake, Call Logging, and Caller History.
    - Public marketing website with 8 pages, SEO implementation, and partial i18n.
    - Comprehensive SMS Campaign Management System.
    - Dynamic Curriculum Category System with admin management, drag-to-reorder, and public hub.
    - Guest Placement Test Flow with anonymous testing, **auto-timer audio recording** (browser MediaRecorder API, countdown timer, auto-stop), contact capture, AI-powered personalized roadmap generation, CEFR results, and curriculum recommendations.
    - Visitor Chat System with floating widget, contact capture, RTL support, and admin dashboard.
    - Font Management System for white-label branding, custom font uploads, and language-specific activation.
    - Breadcrumb Navigation System with dynamic URL-based trail generation, i18n, and RTL/LTR awareness.

### Backend
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: JWT with refresh tokens and role-based access control (8 user roles).
- **API Design**: RESTful.
- **Runtime**: Node.js ESM modules.
- **Key Features**:
    - User & Course Management, payment & wallet system.
    - AI Integration for adaptive micro-sessions, content generation (Ollama), pre/post-session reviews, in-session suggestions.
    - Video & Communication: 24/7 on-demand video tutoring (WebRTC), screen sharing, call recording, AI features (live vocab, auto-transcript, grammar rewrite), VoIP integration.
    - Gamification: XP/level system, achievements, daily challenges.
    - Testing System supporting 8 question types, including MST Placement Test.
    - Unified Class Scheduling with multi-view calendar.
    - AI Supervisor for real-time video call monitoring (audio streaming, vocab suggestions, attention tracking, TTT ratio).
    - CMS Platform for Blog, Video, and Media library.
    - **CallerN Storage Layer**: Dedicated module (`server/storage/callern-storage.ts`) with 24 methods for session management, roadmap tracking, and post-session reporting. Uses real database queries with proper FK constraints.

### Database Design
- **ORM**: Drizzle.
- **Schema**: User management, course system, payment tracking, gamification, mood intelligence, guest progress, LinguaQuest lessons (12 total: 6 pre-existing A1-A2, 6 new B1-C1), dynamic form definitions/submissions, curriculum categories, guest leads, visitor chat sessions/messages, custom fonts, and CallerN session tracking (callSessions, callPostReports, sessionRatings, srsCards).

### CallerN Implementation Status (November 24, 2025 - UPDATED)

**Storage Layer** (`server/storage/callern-storage.ts`):
- ✅ **Session Management (5 methods)**: createCallSession, updateCallSession, getCallSession, getWebRTCConfig with real DB queries
- ✅ **Post-Session Reporting (4 methods)**: createCallPostReport, updateCallPostReport, getCallPostReport, getSessionReport with callPostReports table
- ✅ **Roadmap Tracking (5 methods)**: getRoadmapInstanceByCourse, getActiveRoadmapInstanceForStudent, getRoadmapPosition, getUpcomingActivities, updateRoadmapProgressFromSession with studentRoadmapProgress/callernRoadmapSteps tables
- ✅ **Progress Updates (2 methods)**: updateActivityInstanceStatus (with sessionId scoping), updateOverallRatings
- ✅ **Teacher Presence Tracking**: updateTeacherStatus() now persists to callernPresence table with status validation (online/offline/in_call/away)
- ✅ **WebRTC Configuration**: getWebRTCConfig() now returns configurable TURN/STUN servers with Iranian self-hosting support and fallback to public STUN servers
- ⚠️ **AI Content Stubs (3 methods)**: generatePreSessionContent, generateSessionSummary, generateNextMicroSession return placeholders pending full AI integration
- ⚠️ **Evidence & Scoring Stubs (3 methods)**: createActivityEvidence, scoreActivityInstance return mock data (no persistence tables yet)

**Database Schema**:
- ✅ callSessions table with FK constraints: roadmapProgressId → studentRoadmapProgress.id, roadmapStepId → callernRoadmapSteps.id
- ✅ callPostReports table with sessionId → callSessions.id
- ✅ sessionRatings and srsCards tables defined
- ✅ callernPresence table used for teacher status tracking with real DB queries
- ⚠️ Activity evidence storage not implemented (separate table needed)

**Routes Integration** (`server/routes/callern-flow-routes.ts`):
- ✅ All 29 callernStorage.* method calls connected to real database methods
- ✅ Zero LSP errors in routes and storage modules
- ✅ Pre-session content, session initiation, post-session reporting flows wired

**Known Limitations**:
1. Activity evidence and scoring data not stored in database (analytics incomplete)
2. Database migration command (npm run db:push) times out due to large schema - requires manual retry or --force flag
3. Roadmap session progress tracking implemented but scoring/adaptive pacing not yet wired

### AI Provider Configuration (November 24, 2025)

The platform supports flexible AI provider selection through environment variables, enabling deployment in both Iranian (Ollama-based) and international (OpenAI-based) contexts.

**Environment Variables**:
- `AI_PROVIDER`: Primary AI provider selection (`ollama` | `openai`)
  - Default: `ollama` (for Iranian self-hosting)
  - Set to `openai` for international deployments
- `AI_FALLBACK_PROVIDER`: Optional fallback AI provider (`ollama` | `openai`)
  - Automatically retries failed requests with fallback provider
  - Must be different from primary provider
  - No default (single provider mode if not set)

**Provider-Specific Configuration**:
- **Ollama** (Iranian self-hosting):
  - `OLLAMA_HOST`: Ollama server URL (default: `http://localhost:11434`)
  - `OLLAMA_MODEL`: Model name (default: `llama3.2:3b`)
  - Requires self-hosted Ollama server (not available in Replit dev environment)
- **OpenAI** (International deployments):
  - `OPENAI_API_KEY`: OpenAI API key (required for OpenAI provider)
  - Uses `gpt-4o-mini` model by default

**Deployment Scenarios**:

1. **Iranian Self-Hosting (Default)**:
   - No configuration needed
   - Uses Ollama exclusively
   - Ollama connection errors expected in dev environment (connects on production server)

2. **International Deployment**:
   ```bash
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   ```

3. **Hybrid with Fallback** (Development flexibility):
   ```bash
   AI_PROVIDER=openai
   AI_FALLBACK_PROVIDER=ollama
   OPENAI_API_KEY=sk-...
   OLLAMA_HOST=http://localhost:11434
   ```

4. **Reverse Fallback** (Test OpenAI while primary is Ollama):
   ```bash
   AI_PROVIDER=ollama
   AI_FALLBACK_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   OLLAMA_HOST=http://localhost:11434
   ```

**Behavior**:
- System tries primary provider first
- If primary fails and fallback is configured, automatically retries with fallback
- Logs show which provider is being used for each request
- Health checks monitor both primary and fallback provider status
- Graceful degradation: app starts even if AI providers are unavailable (expected during development builds)

### Deployment Strategy
- **Development**: Replit hosting with Neon PostgreSQL.
- **Production**: Replit Deploy, downloadable as ZIP, Docker containerization. Designed for Iranian hosting, requiring PostgreSQL 14+, Node.js 18+, Nginx, and Docker (optional).

### Test User Seeding
For clean deployments (both development and production), use the test user seeding endpoint to populate a fresh database with 9 essential test users:

**Endpoint**: `POST /api/seed-test-users`

**Created Users** (all with password: `test123`):
1. **Teachers (2)**:
   - Sara Rezaei (sara.rezaei@example.com) - CallerN available Mon-Fri, 9 AM - 5 PM
   - Ali Mohammadi (ali.mohammadi@example.com) - CallerN available Sat-Wed, 10 AM - 6 PM

2. **Students (2)**:
   - Maryam Karimi (maryam.karimi@example.com) - Has CallerN service (5 sessions remaining)
   - Reza Ahmadi (reza.ahmadi@example.com) - Has 10,000,000,000 rials wallet balance

3. **Admin Roles (5)**:
   - Admin (admin@metalingua.com) - Full system access
   - Accountant (accountant@metalingua.com) - Financial management
   - Call Center (callcenter@metalingua.com) - Student outreach
   - Front Desk (frontdesk@metalingua.com) - Reception duties
   - Mentor (mentor@metalingua.com) - Student guidance

**Usage**: After running `npm run db:push` on a fresh PostgreSQL database, call this endpoint to populate test users. Ideal for Iranian self-hosted deployments starting with a clean database.

## OTP Service Implementation (November 24, 2025 - NEW)

**Supported Channels**: SMS (Kavenegar) and Email with **phone-first priority**

**Features**:
- ✅ **Real SMS Delivery**: Implements Kavenegar API integration (environment variable: `KAVENEGAR_API_KEY`)
- ✅ **Real Email Delivery**: Uses email service with Iranian SMTP infrastructure support
- ✅ **Phone Format Support**: Iranian phone number validation and formatting (accepts 0XXXXXXXXX, 9XXXXXXXXX, +989XXXXXXXXX)
- ✅ **Rate Limiting**: 5 attempts per identifier per hour, 10 attempts per IP per hour
- ✅ **Secure Hashing**: OTP codes stored with bcrypt hashing
- ✅ **Multi-language Support**: Full Farsi (fa), English (en), Arabic (ar) translations with RTL email templates
- ✅ **10-minute Expiry**: Auto-expiring OTP codes with cleanup mechanism

**Environment Variables**:
- `KAVENEGAR_API_KEY`: Kavenegar API key for SMS delivery (optional, falls back to console logging in dev)
- `TURN_SERVER_URL`: Primary TURN server for WebRTC (used in CallerN)
- `TURN_USERNAME` / `TURN_PASSWORD`: TURN server credentials
- `STUN_SERVER_URL`: STUN server for NAT traversal

**Authentication Flow** (`POST /api/auth/request-otp`):
1. Client provides identifier (phone or email)
2. System detects type and defaults to SMS if phone
3. OTP generated and stored with hash
4. SMS sent via Kavenegar (primary) or email (fallback)
5. Rate limits enforced per identifier and IP

## External Dependencies

### Development Environment
- **Database**: Neon PostgreSQL
- **Testing**: Playwright (E2E), Vitest (unit)

### Production Environment (Iranian Self-Hosting)
- **Database**: Self-hosted PostgreSQL
- **Payment Gateway**: Shetab (Iranian network)
- **SMS Service**: Kavenegar (Iranian provider) - INTEGRATED with real API calls in OTP service
- **VoIP**: Isabel VoIP line (Iranian telecom)
- **AI Services**: Ollama server (local AI processing) - configurable via AI_PROVIDER env var
  - Default: Ollama for Iranian deployments
  - Alternative: OpenAI for international deployments (requires OPENAI_API_KEY)
  - Optional fallback mode supported via AI_FALLBACK_PROVIDER
- **TTS Services**: Microsoft Edge TTS (self-hosted)
- **Fonts**: Self-hosted Arabic/Persian fonts
- **WebRTC**: Self-hosted TURN/STUN server - CONFIGURED with Iranian self-hosting defaults and fallback to public STUN servers
- **Email**: Iranian SMTP infrastructure for OTP and notification delivery
- **Video Infrastructure**: Local filesystem storage and streaming
- **File Storage**: Local server filesystem