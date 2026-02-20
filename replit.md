# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced, multilingual language learning and institute management platform designed for self-hosting by language institutes globally. It supports teaching various languages, extensive administration, student management, course enrollment, VoIP integration, and a wallet-based payment system. The primary goal is to provide a powerful, customizable, and independent platform, particularly in regions requiring self-hosted solutions. The business vision is to empower language institutes with a robust, self-managed digital learning ecosystem, tapping into markets that prioritize data sovereignty and local infrastructure.

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
- **Framework**: React 18 with TypeScript, Tailwind CSS with shadcn/ui components.
- **State Management**: TanStack React Query.
- **Routing**: Wouter.
- **Build Tool**: Vite.
- **Localization**: Multi-language support with i18n and full RTL/LTR handling (Persian/English/Arabic).
- **UI/UX**: Modern gradient backgrounds (WCAG-compliant blues), professional layouts, mobile-first responsive design, touch-optimized components, role-based UI, resizable panels, bottom navigation for mobile, collapsible sidebar, dark mode support.
- **Key Features**: Unified Dashboard for 8 user roles, LinguaQuest interactive game system (23 activity types, 6 lessons), TTS audio pre-generation, Dynamic Form Management, PWA support (installable, offline capability), Public marketing website, SMS Campaign Management, Dynamic Curriculum Category System, Guest Placement Test Flow (AI-powered roadmap, CEFR results), Visitor Chat System, Font Management, Breadcrumb Navigation, Admin Infrastructure Status Widget.
- **Admin Navigation**: Collapsible section grouping for Admin sidebar items (e.g., People & Access, Courses & Academics).
- **Role-Based Section Grouping**: Sidebar section grouping enabled for ALL roles with 8+ items: Teacher/Tutor (Teaching, Content & Reports, Financial), Supervisor (Institute Management + Call Center sections), Front Desk Clerk (Reception, Communication, Scheduling). Roles with fewer items (Mentor, Call Center Agent, Accountant) keep flat lists. Students use mobile bottom navigation.

### Backend
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: JWT with refresh tokens and role-based access control (8 user roles), phone-only authentication (phone number + OTP).
- **API Design**: RESTful.
- **Runtime**: Node.js ESM modules.
- **Key Features**: User & Course Management, payment & wallet system, AI Integration (adaptive micro-sessions, content generation via Ollama, pre/post-session reviews, in-session suggestions, AI Lesson Generator, AI Supervisor for real-time video call monitoring, AI 24/7 Sales Agent), Video & Communication (24/7 on-demand video tutoring via WebRTC, screen sharing, call recording, AI features like live vocab/auto-transcript/grammar rewrite, VoIP integration), Gamification (XP/level system, achievements, daily challenges), Testing System (8 question types, MST Placement Test), Unified Class Scheduling, CMS Platform (Blog, Video, Media library), CallerN Storage Layer for session management, roadmap tracking, and post-session reporting, OTP Service (SMS via Kavenegar, Email).
- **Phone Number Normalization**: Centralized normalization to +98XXXXXXXXXX format for authentication.

### Database Design
- **ORM**: Drizzle.
- **Schema**: Supports user management, course system, payment tracking, gamification, mood intelligence, guest progress, LinguaQuest lessons, dynamic form definitions/submissions, curriculum categories, guest leads, visitor chat sessions/messages, custom fonts, CallerN session tracking (callSessions, callPostReports, sessionRatings, srsCards), Daily Challenges system (gameDailyChallenges, userDailyChallengeProgress), and AI Supervisor Analysis (callernAiAnalysis).

### AI Provider Configuration
- Flexible AI provider selection via environment variables, supporting Ollama (default for Iranian self-hosting) and OpenAI.
- Automatic retry with fallback provider.
- Admin dashboard widget for AI provider health monitoring and selection.

### Deployment Strategy
- **Development**: Replit hosting with Neon PostgreSQL.
- **Production**: Replit Deploy, downloadable as ZIP, Docker containerization. Designed for Iranian hosting, requiring PostgreSQL 14+, Node.js 18+, Nginx, and Docker (optional).
- **Optimization**: Multi-stage Dockerfiles, package cleanup (Nix, Node.js dependencies), PWA precaching, code splitting, Terser minification.

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

## Recent Changes (Feb 20, 2026)
### Platform Audit & Polish
- **Route Consolidation**: Merged duplicate server/cms-routes.ts into server/routes/cms-routes.ts (canonical), deleted unused lexi-routes.ts. Fixed ESM compatibility (`require('fs')` → `import fsSync from 'fs'`).
- **i18n 100% Coverage**: Synced 1,500+ missing translation keys across Farsi and Arabic for all 17 namespaces. Fixed structural issues where FA `common.actions` and `student.packages` were strings instead of objects (converted to proper nested objects matching EN structure). Zero missing keys in FA and AR.
- **Mobile Responsive**: Made 8 pages fully responsive (wallet, BookReader, ai-practice, course-detail, unified-dashboard, level-assessment, pronunciation-practice, not-found). Pattern: mobile-first with sm:/md:/lg: breakpoints, flex-col stacking, responsive padding/text.
- **Non-functional Buttons Fixed**: Fixed 3 empty onClick handlers in student and teacher mobile dashboards with proper navigation.
- **Cleanup**: Removed .backup files from locale folders, removed dead code.
- **Server Health**: All routes registering successfully, CMS media upload working, AI provider health monitoring active.

## Previous Changes (Feb 19, 2026)
### Social & Interactive Features (4 Major Features)
- **3D Interactive Scenes**: Three.js-powered immersive vocabulary learning environments (cafe, market, airport, hospital, office) with clickable 3D objects, CEFR A1-C1 levels, trilingual support (en/fa/ar), question panels, progress tracking. Routes: `/linguaquest/scenes`, `/linguaquest/scene/:id`. Backend: `server/routes/interactive-scenes-routes.ts`. Component: `client/src/components/3d-lessons/InteractiveScene3D.tsx`. 5 scenes seeded with 33 interaction points.
- **Challenge Your Crush (Social Duels)**: Language dueling system with challenge/accept/decline/submit flow, leaderboard, stats tracking, daily challenge limits, anonymous mode, admin question bank CRUD. Routes: `/social/duels`. Backend: `server/routes/social-duels-routes.ts`. Frontend: `client/src/pages/social/ChallengeDuelsPage.tsx`.
- **Session Crashers**: Drop-in practice during live CallerN sessions. Availability toggle, CEFR-based matching, teacher approval, XP rewards, session history, rating system. Routes: `/social/crashers`. Backend: `server/routes/session-crashers-routes.ts`. Frontend: `client/src/pages/social/SessionCrashersPage.tsx`.
- **Diaspora Bridge**: Homeland-abroad language exchange matching. Diaspora/local profiles, Cultural Ambassador system, exchange sessions, ratings/feedback, admin management. Routes: `/social/diaspora`. Backend: `server/routes/diaspora-bridge-routes.ts`. Frontend: `client/src/pages/social/DiasporaBridgePage.tsx`.
- **Database**: 9 new tables (interactive_scenes, scene_interaction_points, scene_progress, social_duels, duel_question_bank, crash_availability, crash_sessions, diaspora_profiles, diaspora_exchange_sessions)
- **i18n**: Translation keys added for all 4 features across en/fa/ar

## Previous Changes (Feb 16, 2026)
### Student Profile & Dashboard Fixes
- **API /api/profile**: Enhanced GET endpoint to join users + userProfiles tables, returning combined data (firstName, lastName, email, joinedDate, stats, settings) matching frontend ProfileData interface
- **formatDate**: Fixed to handle null/empty/invalid dates gracefully, dynamically selects locale (fa-IR/ar-SA/en-US) based on i18n.language
- **MobileBottomNav**: Dark glass-morphism theme (bg-gray-900/95, border-white/10, text-white/60 inactive, text-purple-400 active, bg-purple-500/20 indicator)
- **i18n**: Added 26+ missing translation keys to en/fa/ar student.json (memberSince, hoursLearned, coursesCompleted, certificates, contactInfo, settings, notifications, etc.)
- **LSP Fixes**: Fixed 6 GlossyButton variant="outline" errors in dashboard-mobile.tsx (changed to "secondary"), fixed User type mismatch in ConditionalDashboard.tsx

### LinguaQuest Bug Fixes & i18n Audit
- **CRITICAL FIX**: Dashboard useQuery URL mismatch — changed queryKey from `['/api/linguaquest/session', token]` to `[\`/api/linguaquest/session/${token}\`]` so data actually loads
- **TypeScript**: Fixed all 14 LSP errors in admin-linguaquest.tsx (added `<any>` type params to useQuery calls, updated refetchInterval to TanStack Query v5 API)
- **Streak Calculation**: Fixed guest-progress.ts to track consecutive days instead of incrementing per lesson completion
- **Score Accumulation**: Fixed ConversationStep in GameStepRenderer to use useRef for score tracking, preventing stale closure state; now returns percentage (0-100) instead of raw points
- **i18n Compliance**: Replaced ALL hardcoded English strings in LinguaQuestHome, LinguaQuestDashboard, LinguaQuestLesson, and GameStepRenderer with t() translation calls; added keys to en/fa/ar linguaquest.json
- **Navigation**: Added "Back to Platform" link on all LinguaQuest pages for logged-in users (checks auth_token in localStorage)
- **XP Progress**: Fixed inconsistent XP-to-next-level calculation (now consistently 100 XP per level)
- **Dashboard fallback**: Fixed duplicate "No Progress Found" block to use i18n instead of hardcoded English