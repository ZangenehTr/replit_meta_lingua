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

### Phone-First Authentication (November 25, 2025)
- **SMS-Based Login**: Users can now authenticate via Iranian phone numbers (Kavenegar SMS)
- **6 Authentication Endpoints**:
  1. `/api/auth/phone/request-otp-login` - Request OTP for existing users
  2. `/api/auth/phone/request-otp-signup` - Request OTP for registration
  3. `/api/auth/phone/verify-otp-login` - Verify OTP and login
  4. `/api/auth/phone/verify-otp-signup` - Verify OTP and create account
  5. `/api/auth/phone/login` - Phone login flow (combined)
  6. `/api/auth/phone/signup` - Phone signup flow (combined)
- **Features**: Rate limiting, Iranian phone number validation, multilingual support (FA/EN/AR), 10-min OTP expiry
- **Session Management**: Automatic session creation with 24-hour access tokens, 7-day refresh tokens
- **Phone Field**: Users now have `isPhoneVerified` flag and phone number stored in profile

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

### PWA & Production Deployment Optimization (November 25, 2025)
- **Bundle Size & Image Optimization**: Fixed PWA and deployment image size failures
- **Five Optimization Strategies Applied**:
  1. **Increased PWA Precache Limit**: maximumFileSizeToCacheInBytes increased from 2 MB to 5 MB
  2. **Precache Exclusions**: Added globIgnores for node_modules and dist folders
  3. **Enhanced Code Splitting**: Large vendor libraries split into separate chunks
     - vendor-three (Three.js 3D library)
     - vendor-pdf (PDF reader)
     - vendor-charts (Charts visualization)
     - vendor-ml (TensorFlow/ML)
     - vendor-mediapipe (MediaPipe face/hand detection)
     - vendor-openai (OpenAI API client)
     - vendor-stripe (Stripe payment processing)
     - vendor-radix (@radix-ui components)
     - vendor-motion (Framer Motion animations)
     - vendor-common (Other dependencies)
  4. **Production Build Optimization**:
     - Added Terser minification with console/debugger removal
     - Environment variables: SKIP_ASSET_GENERATION for production
     - Build cleanup script removes source maps and test files
  5. **Docker & Repository Optimization**:
     - Created .dockerignore to exclude node_modules, cache, build artifacts
     - Created .prettierignore to exclude development files
     - Configured package.json build scripts with post-build cleanup
- **Result**: App deployable without size errors (reduced image from 8 GiB to deployable size); better performance and optimized deployment

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