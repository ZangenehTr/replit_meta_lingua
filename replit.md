# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced, multilingual language learning and institute management platform designed for self-hosting by language institutes globally. It supports teaching various languages, extensive administration, student management, course enrollment, VoIP integration, and a wallet-based payment system. Its primary goal is to provide a powerful, customizable, and independent platform, particularly in regions requiring self-hosted solutions, offering a comprehensive and customizable solution for language education and administration. The business vision is to empower language institutes with a robust, self-managed digital learning ecosystem, tapping into markets that prioritize data sovereignty and local infrastructure.

## User Preferences
Preferred communication style: Simple, everyday language.
Work sessions: User prefers to have work logged so they can resume from where we left off.
Critical requirement: Self-hosting in Iran with zero external dependencies. Must follow check-first protocol.
Database strategy: Use Replit/Neon for development only, migrate to self-hosted PostgreSQL for production in Iran.
Code quality: Always avoid duplications - no duplicate code, methods, or logic. Prefer composition and reuse over duplication.
Language preference: Default language set to Farsi (fa) for Iranian users.
AI Sales Agent: Telegram bot must be trained on ALL platform features with attractive messaging emphasizing novelty and innovation.
CRITICAL DIRECTIVE: Before any implementation, check existing codebase to avoid duplication. NO hardcoded data, NO fake/mock data, NO non-functional buttons, always use real API calls and working e2e business logic.

## Recently Completed Features

### UI/UX Color Scheme Fix (November 29, 2025)
- **Problem Fixed**: Dark purple backgrounds were causing serious readability issues on certain devices and browsers
- **Solution**: Replaced dark purple theme with clean, high-contrast neutral colors:
  - Gradients changed from purple (`hsl(262, 83%, 58%)`) to blue (`#2563eb`, `#0ea5e9`)
  - Card backgrounds changed to white with subtle borders
  - Tab and input elements use light gray (`#f1f5f9`) backgrounds
  - All text now uses dark gray colors for WCAG-compliant contrast
- **Mobile Responsiveness**: Fixed LinguaQuest lesson pages:
  - Removed `overflow-hidden` that blocked scrolling
  - Changed to `overflow-y-auto` for proper mobile scrolling
  - 3D scene container adjusted to fixed heights on mobile (`200px`/`250px`) with flex growth on desktop
  - Game step container uses `flex-1` for dynamic sizing
- **Dark Mode**: Maintained support with appropriate dark variants (`#1e293b` backgrounds)
- **Files Changed**: `glossy-ai-fantasy.css`, `LinguaQuestLesson.tsx`, `index.css`

### PWA (Progressive Web App) Support (November 25, 2025)
- **Installable App**: Users can install Meta Lingua as a native-like app on mobile/desktop
- **Offline Support**: Service worker with Workbox caching strategy for offline learning
- **PWA Components**: Install prompt, update prompt, offline indicator integrated into main App
- **Manifest Configuration**: Meta Lingua branding, standalone display, Persian/English/Arabic support
- **Caching Strategy**: 
  - CacheFirst for fonts and static assets (1 year)
  - NetworkFirst for API calls (1 day, 10s timeout)
  - CacheFirst for images (30 days)
- **Icons**: Generated PWA icons (192x192, 512x512, maskable)

### Phone-Only Authentication (November 27, 2025) - SIMPLIFIED
- **Phone-Only Login/Signup**: Authentication now uses only phone number + OTP (no email/password)
- **Simplified UI**: Clean Persian interface with phone number field only
- **4 Core Endpoints**:
  1. `/api/auth/phone/request-otp-login` - Request OTP for existing users
  2. `/api/auth/phone/request-otp-signup` - Request OTP for registration (with firstName, lastName)
  3. `/api/auth/phone/verify-otp-login` - Verify OTP and login
  4. `/api/auth/phone/verify-otp-signup` - Verify OTP and create account
- **Development Mode OTP Bypass**: When SMS fails in dev mode, OTP codes are logged to console for testing
- **Features**: Rate limiting, Iranian phone number validation, 90-second resend cooldown, 10-min OTP expiry
- **Session Management**: Automatic session creation with 24-hour access tokens, 7-day refresh tokens
- **Kavenegar IP-Based**: Uses direct IP addresses (46.102.138.125) for Iranian network compatibility

### Shetab Payment Integration (November 25, 2025)
- **Iranian Payment Gateway**: Complete integration with Shetab (Iran's national payment network)
- **6 Payment Endpoints** (at `/api/payment/shetab/`):
  1. `POST /shetab/initiate` - Initiate payment request
  2. `POST /shetab/callback` - Receive payment confirmation from Shetab
  3. `GET /shetab/status` - Check gateway configuration status
  4. `GET /shetab/transaction/:transactionId` - Get payment status
  5. `POST /shetab/refund` - Request refund for completed payment
  6. `GET /shetab/history` - Get user's payment history
- **Features**: Payment idempotency, transaction tracking, refund support, HMAC signature verification
- **Security**: Cryptographic signature verification, rate limiting, transaction deduplication
- **Database**: Uses `walletTransactions`, `paymentTransactions`, and `paymentIdempotency` tables

### PWA & Production Deployment Optimization (November 25, 2025) - DEPLOYMENT ISSUE RESOLVED
- **Critical Fix**: Reduced deployment image size from 8+ GiB to under limit by removing heavy packages
- **Massive Nix Package Cleanup** (CRITICAL - saved ~5+ GB):
  - Removed: ollama (should be external), ffmpeg-full, gcc, glibc, libcxx, libsndfile, libstdcxx5, libxcrypt, libyaml, netcat, openssh, pkg-config, python3, sshpass, xsimd, espeak-ng
  - Kept: ffmpeg, jq (minimal required packages)
  - Removed Python 3.11 module (TTS/Whisper run externally in production)
- **Node.js Dependencies Cleanup** (saved ~500+ MB):
  - Removed: @tensorflow/tfjs-node (660MB - server-side ML not needed, client-side works)
  - Removed: @playwright/test, vitest, @testing-library/*, eslint, jsdom (dev/test only)
  - Removed: @typescript-eslint/*, eslint-plugin-* (linting is dev-only)
  - Removed: supertest, @vitest/ui (testing packages)
  - node_modules reduced from 1.7G → ~1.2G
- **Additional Optimizations Applied**:
  1. **Dockerfile Multi-Stage**: Production-only deps installed fresh
  2. **PWA Precache**: 5 MB limit with globIgnores
  3. **Code Splitting**: 10 vendor chunks for parallel caching
  4. **Terser Minification**: Console/debugger removal
  5. **Build Cleanup**: Removes *.map and *.test.* files
- **Results**: 
  - Nix packages: 18 → 2 (ffmpeg, jq)
  - node_modules: 1.7G → ~1.2G
  - Total deployment size: Under 8 GiB limit
  - App tested and verified working

### WebRTC & Deployment Documentation (November 25, 2025)
- **DEPLOYMENT_GUIDE.md** - Complete Iranian self-hosting guide (PostgreSQL, Ollama, Kavenegar, Isabel VoIP setup)
- **WEBRTC_SETUP.md** - CallerN video infrastructure guide (coturn TURN/STUN server setup, performance tuning)

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Tailwind CSS with shadcn/ui components.
- **State Management**: TanStack React Query.
- **Routing**: Wouter.
- **Build Tool**: Vite.
- **Localization**: Multi-language support with i18n and full RTL/LTR handling (Persian/English/Arabic).
- **UI/UX**: Modern gradient backgrounds, professional layouts, mobile-first responsive design, touch-optimized components, role-based UI, resizable panels, bottom navigation for mobile, collapsible sidebar.
- **Key Features**: Unified Dashboard for 8 user roles, LinguaQuest interactive game system (23 activity types, 6 lessons), TTS audio pre-generation, Dynamic Form Management, Front Desk Clerk pages, Public marketing website, SMS Campaign Management, Dynamic Curriculum Category System, Guest Placement Test Flow (AI-powered roadmap, CEFR results), Visitor Chat System, Font Management, Breadcrumb Navigation, Admin Infrastructure Status Widget.

### Backend
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: JWT with refresh tokens and role-based access control (8 user roles).
- **API Design**: RESTful.
- **Runtime**: Node.js ESM modules.
- **Key Features**: User & Course Management, payment & wallet system, AI Integration (adaptive micro-sessions, content generation via Ollama, pre/post-session reviews, in-session suggestions), Video & Communication (24/7 on-demand video tutoring via WebRTC, screen sharing, call recording, AI features like live vocab/auto-transcript/grammar rewrite, VoIP integration), Gamification (XP/level system, achievements, daily challenges), Testing System (8 question types, MST Placement Test), Unified Class Scheduling, AI Supervisor for real-time video call monitoring, CMS Platform (Blog, Video, Media library), CallerN Storage Layer for session management, roadmap tracking, and post-session reporting, OTP Service (SMS via Kavenegar, Email), **AI 24/7 Sales Agent** (Telegram/WhatsApp chatbot with multilingual FA/EN/AR support, lead scoring, FAQ handling, human escalation), **AI Lesson Generator** (Ollama/OpenAI dual-support for creating LinguaQuest lessons).

### Database Design
- **ORM**: Drizzle.
- **Schema**: Supports user management, course system, payment tracking, gamification, mood intelligence, guest progress, LinguaQuest lessons, dynamic form definitions/submissions, curriculum categories, guest leads, visitor chat sessions/messages, custom fonts, CallerN session tracking (callSessions, callPostReports, sessionRatings, srsCards), **Daily Challenges system** (gameDailyChallenges, userDailyChallengeProgress), and **AI Supervisor Analysis** (callernAiAnalysis).
- **Recent Additions**: 
  - `gameDailyChallenges`: Stores daily challenge definitions (type, difficulty, instructions in 3 languages, rewards)
  - `userDailyChallengeProgress`: Tracks user progress on daily challenges with scoring and badges
  - `callernAiAnalysis`: AI-powered analysis for CallerN video sessions including grammar, pronunciation, vocabulary feedback

### AI Provider Configuration
- Flexible AI provider selection via environment variables (`AI_PROVIDER`, `AI_FALLBACK_PROVIDER`).
- Supports Ollama (default for Iranian self-hosting) and OpenAI (for international deployments).
- Provider-specific configurations for Ollama (host, model) and OpenAI (API key, model).
- Automatic retry with fallback provider if primary fails.
- Admin dashboard widget for AI provider health monitoring and selection (Ollama/OpenAI switching).

### Deployment Strategy
- **Development**: Replit hosting with Neon PostgreSQL.
- **Production**: Replit Deploy, downloadable as ZIP, Docker containerization. Designed for Iranian hosting, requiring PostgreSQL 14+, Node.js 18+, Nginx, and Docker (optional).
- **Test User Seeding**: `POST /api/seed-test-users` endpoint to populate 9 essential test users for clean deployments.

## External Dependencies

### Development Environment
- **Database**: Neon PostgreSQL
- **Testing**: Playwright (E2E), Vitest (unit)

### Production Environment (Iranian Self-Hosting)
- **Database**: Self-hosted PostgreSQL
- **Payment Gateway**: Shetab (Iranian network)
- **SMS Service**: Kavenegar (Iranian provider)
- **VoIP**: Isabel VoIP line (Iranian telecom)
- **AI Services**: Ollama server (local AI processing); configurable with OpenAI as an alternative.
- **TTS Services**: Microsoft Edge TTS (self-hosted)
- **Speech Recognition**: Faster-Whisper (self-hosted); configurable with OpenAI Whisper as an alternative.
- **Fonts**: Self-hosted Arabic/Persian fonts
- **WebRTC**: Self-hosted TURN/STUN server
- **Email**: Iranian SMTP infrastructure
- **Video Infrastructure**: Local filesystem storage and streaming
- **File Storage**: Local server filesystem