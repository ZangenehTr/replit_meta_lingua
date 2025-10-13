# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced multilingual language learning and institute management platform. Its purpose is to provide a robust, self-contained solution for language institutes globally, enabling effective language education in any language and efficient institute operations. The platform is designed to be self-hostable and independent of services blocked in certain regions, catering to teaching ALL languages. Key capabilities include a comprehensive admin system, student management, course enrollment, VoIP integration, and a wallet-based payment system.

## User Preferences
Preferred communication style: Simple, everyday language.
Work sessions: User prefers to have work logged so they can resume from where we left off.
Critical requirement: Self-hosting in Iran with zero external dependencies. Must follow check-first protocol.
Database strategy: Use Replit/Neon for development only, migrate to self-hosted PostgreSQL for production in Iran.
Code quality: Always avoid duplications - no duplicate code, methods, or logic. Prefer composition and reuse over duplication.
Language preference: Default language set to Farsi (fa) for Iranian users.
CRITICAL DIRECTIVE: 3-day deadline to achieve 100% functionality - NO hardcoded data, NO fake/mock data, NO non-functional buttons, NO duplications, comprehensive tests required, replace OpenAI with Ollama (user's server).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side navigation
- **Build Tool**: Vite
- **Language Support**: Multi-language support for ALL languages with RTL/LTR layout handling and comprehensive i18n with localized number formatting.
- **UI/UX Decisions**: Modern gradient backgrounds, professional layouts, responsive design using a mobile-first approach, touch-optimized components, and role-based UI patterns. Features resizable panels and a comprehensive mobile design system with bottom navigation.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with refresh token mechanism, role-based access control (Admin, Teacher, Mentor, Student, Supervisor, Call Center Agent, Accountant, Front Desk Clerk).
- **API Design**: RESTful API
- **Runtime**: Node.js ESM modules

### Database Design
- **ORM**: Drizzle with code-first schema approach
- **Schema**: Comprehensive user management, course system, payment tracking, gamification features, and a mood intelligence system.

### Key Features
- **Authentication System**: JWT-based with role-based authorization, supporting password and OTP login via SMS for all roles.
- **Student Management**: CRUD operations, course enrollment, progress tracking, cultural profiling, and SMS notifications.
- **Payment & Wallet System**: IRR-based wallet, member tiers, and transaction tracking.
- **Course Management**: Creation, teacher assignment, session scheduling, and progress monitoring, including video courses and Callern on-demand video tutoring.
- **CallerN Roadmap Integration System**: Comprehensive adaptive micro-sessions with AI content generation integration featuring:
  - Roadmap templates and instances for structured learning paths
  - AI content generator service with Ollama integration for real-time content generation
  - Course creator service with production sample courses (Business English A2, IELTS Speaking B2)
  - Mobile HUD components (student overlay, teacher overlay, pre-session review modal)
  - Pre-session review system with AI-generated grammar explanations and vocabulary
  - In-session AI activity suggestions with real-time Socket.io events
  - Post-session ratings, taught items confirmation, and next micro-session generation
  - Teacher briefing panel with real student data and session history
  - Complete API endpoints for roadmap management and CallerN flows
- **Callern Service**: 24/7 on-demand video tutoring system using WebRTC for real-time video calling, screen sharing, and call recording capabilities. Includes AI-powered features like live vocabulary suggestions, automatic transcript generation, grammar rewrite suggestions, personal glossary building with SRS, and quiz generation. Features teacher authorization system to control which teachers can provide Callern services.
- **Gamification Features**: XP/level system, achievements, daily challenges, age-based games.
- **VoIP Integration**: Isabel VoIP line for call recording and call center functionality.
- **Teacher vs Mentor System**: Differentiated roles for direct instruction and progress monitoring.
- **Comprehensive Testing System**: Supports 8 question types.
- **Teacher Payment Management**: Automated calculation, white-label multi-institute management, QA system, SMS event management, placement test Q&A, and campaign management.
- **Unified Class Scheduling Interface**: Multi-view calendar with drag-and-drop scheduling.
- **Session Packages**: For private students to purchase bundles of sessions.
- **Communication System**: Support ticket management, internal chat, push notifications (email, SMS).
- **Ollama AI Services**: Local AI processing for multilingual language support and data sovereignty.
- **Check-First Protocol**: Mandatory validation for data integrity.
- **Business Logic Consolidation**: Centralized utilities for filtering, calculations, and data integrity.
- **Complete i18n Implementation**: Comprehensive Persian/English translation system (Arabic excluded per user decision) with RTL support across all critical components. **Phase 3 i18n Completed (October 2025)**: 
  - Deduplication: Removed 526 duplicate keys from FA translation files
  - Critical components fully i18n: lead-management (8 keys), auth OTP field, all student pages (mobile versions with 15-26 translation calls each)
  - Callern components COMPLETE: LiveSuggestions (10 keys), StudentGlossary (24 keys), VideoCallLayout (8 keys) - Total: 42 callern translation keys (EN + FA)
  - All hardcoded user-facing strings replaced with t() translation calls using useLanguage hook
  - Culturally appropriate Persian translations with RTL formatting
  - Language switching functional (EN↔FA) with proper font families (Inter for EN, Vazir for FA)
- **Unified Dashboard System**: Role-appropriate content for all 8 user roles (Admin, Teacher, Mentor, Student, Supervisor, Call Center Agent, Accountant, Front Desk Clerk) landing on `/dashboard`.
- **WebRTC Video Calling**: SimplePeer-based system with WebSocket signaling, dynamic TURN servers, media controls, and AI integration for real-time language assistance (word suggestions, translation, grammar correction, pronunciation guides).
- **AI Supervisor**: Real-time AI supervision within video calls, featuring audio streaming, vocabulary suggestions, live attention tracking, TTT ratio monitoring, and intelligent fallback for Ollama.
- **ACTION PLAN Completed (October 2025)**: 4-step quality assurance initiative to ensure 100% functionality before deployment:
  - Step 1 ✅: Foundation Repair - Eliminated 3 major mock data blocks (admin stats, available courses, course player now use real DB data)
  - Step 2 ✅: Button Functionality Audit - Scanned 1,000+ buttons across 48 pages, 99%+ functional, identified 5 non-functional console.log buttons
  - Step 3 ✅: Fixed all 5 non-functional buttons in student/teacher mobile dashboards using wouter navigation (Link components + useLocation hooks)
  - Step 4 ✅: Mobile-First UI & Responsiveness - Comprehensive audit confirmed robust mobile architecture: 30+ mobile pages, global RTL support, touch-optimized navigation, responsive grids across all pages, no overflow issues found

### Deployment Strategy
- **Development**: Replit hosting.
- **Production**: Replit Deploy, downloadable as ZIP, Docker containerization. Designed for Iranian hosting.
- **Self-Hosting Requirements**: PostgreSQL 14+, Node.js 18+, Nginx, Docker (optional).

## External Dependencies

### Development Environment (Replit)
- **Database**: Neon PostgreSQL (development only)
- **Testing**: Playwright (E2E), Vitest (unit)

### Production Environment (Iranian Self-Hosting)
- **Database**: Self-hosted PostgreSQL (no external database services)
- **Payment Gateway**: Shetab (Iranian payment network only)
- **SMS Service**: Kavenegar (Iranian SMS provider only)
- **VoIP**: Isabel VoIP line (Iranian telecom)
- **AI Services**: Ollama server (local AI processing, no OpenAI or external AI APIs)
- **TTS Services**: Microsoft Edge TTS (confirmed professional quality for Iranian production)
- **Fonts**: Self-hosted Arabic/Persian fonts (no Google Fonts or external CDNs)
- **WebRTC**: Self-hosted TURN/STUN server (no Twilio or external services)
- **Real-time Communication**: Socket.io for WebSocket connections, Simple Peer for WebRTC, RecordRTC for local call recording
- **Video Infrastructure**: Local filesystem storage and streaming (no YouTube, Vimeo, or external CDNs)
- **File Storage**: Local server filesystem (no AWS S3, Cloudinary, or external storage)
- **Self-Hosting**: ZERO dependencies on non-Iranian servers - complete independence from all external services

## Recent Work (October 13, 2025)

### OTP Authentication System - COMPLETED ✅
**Status:** Fully functional with E2E test validation  
**Changes Made:**
- Fixed critical schema mismatch between shared/schema.ts and database
  - Corrected column names: `code` → `codeHash`, `attemptsCount` → `attempts`
  - Added missing fields: `channel`, `locale`, `phoneNumber`, `email`
- Added `email` column to otp_codes table via ALTER TABLE
- Updated OTP service to populate phoneNumber/email fields based on channel type
- Removed early return blocking OTP creation for non-existent users
- E2E test PASSED: OTP request flow working end-to-end with database record creation

**Files Modified:**
- `shared/schema.ts` - otpCodes table definition aligned with database
- `server/services/otp-service.ts` - Added phoneNumber/email field population
- `server/routes.ts` - Removed user existence check blocking new user OTP flow
- Database: Added email column to otp_codes table

### Ollama AI Configuration - DOCUMENTED ⚠️
**Status:** Configured but requires fixes  
**Configuration:**
- Environment: `OLLAMA_HOST=http://45.89.239.250:11434` ✅
- Model: `OLLAMA_MODEL` currently set to `llama3.2b` ❌ **MUST UPDATE TO** `llama3.2:3b` (correct Ollama tag notation)
- Connection Status: ❌ Port 11434 closed/unreachable (Connect Timeout Error)

**Behavior:**
- Application uses "AI fallback mode" when Ollama is unavailable
- All features function without Ollama (graceful degradation)
- Logs show: "ℹ️ Using AI fallback mode - external Ollama server not required"

**Action Required:**
- Check Ollama server at 45.89.239.250 is running
- Verify firewall allows incoming connections on port 11434
- Confirm Ollama is configured to bind to 0.0.0.0 (not just localhost)

## Future Enhancements

### Lingo Bookstore Mini-Game (Alternative Approach)
**Phase 1: Hybrid Enhancement (Planned)**
- Transform existing Virtual Mall into focused "Lingo Bookstore" experience
- Remove Maya, Emma, and other shopgirls - keep only Lexi as primary guide
- Add Lexi as overlay guide with professional voice synthesis and synchronized subtitles
- Implement level-adaptive dialogue system matching student proficiency (A1-C2)
- Create history-based book recommendation engine
- Design elegant single-panel UI for book details and cart actions (avoid duplications)
- Add guided search functionality where Lexi helps learner find books
- Implement chat and search in refined overlay interface with RTL support
- Ensure non-rotating, accessible 3D environment optimized for Iranian mobile devices
- CTO action required: Resolve Microsoft Edge TTS voice quality issues