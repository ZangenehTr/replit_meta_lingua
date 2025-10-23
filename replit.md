# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced multilingual language learning and institute management platform designed for self-hosting. It provides a comprehensive solution for language institutes globally, enabling effective language education and efficient operations. The platform supports teaching any language, offers extensive admin and student management, course enrollment, VoIP integration, and a wallet-based payment system. Its core purpose is to empower language institutes with a powerful, customizable, and independent platform, especially in regions requiring self-hosted solutions.

## Documentation
- **System Workflow Documentation**: `METALINGUA_SYSTEM_WORKFLOW.md` - Complete text-based workflow with 150+ production error points identified
- **Visual Diagrams**: `METALINGUA_VISUAL_DIAGRAMS.md` - 10 comprehensive Mermaid diagrams covering all system flows
  - System Architecture Overview
  - Authentication & Authorization Flow
  - LinguaQuest Platform Flow (19 activity types)
  - CallerN Video Tutoring Flow (WebRTC + AI)
  - Unified Testing System (21 question types)
  - Payment & Wallet System
  - AI Services Integration (7 use cases)
  - External Services Integration (Iranian providers)
  - Database Schema Relationships (50+ tables)
  - Production Error Points Map (Critical/High/Medium/Low)

## User Preferences
Preferred communication style: Simple, everyday language.
Work sessions: User prefers to have work logged so they can resume from where we left off.
Critical requirement: Self-hosting in Iran with zero external dependencies. Must follow check-first protocol.
Database strategy: Use Replit/Neon for development only, migrate to self-hosted PostgreSQL for production in Iran.
Code quality: Always avoid duplications - no duplicate code, methods, or logic. Prefer composition and reuse over duplication.
Language preference: Default language set to Farsi (fa) for Iranian users.
CRITICAL DIRECTIVE: 3-day deadline to achieve 100% functionality - NO hardcoded data, NO fake/mock data, NO non-functional buttons, NO duplications, comprehensive tests required, replace OpenAI with Ollama (user's server).

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Build Tool**: Vite
- **Localization**: Multi-language support with RTL/LTR layout handling and comprehensive i18n (Persian/English).
- **UI/UX**: Modern gradient backgrounds, professional layouts, responsive (mobile-first), touch-optimized components, role-based UI, resizable panels, and bottom navigation for mobile.
- **Specific Implementations**: 
    - Unified Dashboard for 8 user roles
    - LinguaQuest interactive game system with 19 activity types (e.g., Sentence Reordering, Image Selection, Spelling, True/False)
    - LinguaQuest Progress Dashboard with real-time stats (XP, streaks, achievements, lesson history)
    - TTS audio pre-generation pipeline for LinguaQuest content
    - **Front Desk Clerk Pages** (Oct 2025): Fully internationalized with comprehensive i18n support
      - Dashboard: 92+ translation calls, quick actions, stats cards, task management, trial scheduling
      - Walk-in Intake: 200+ translations, multi-step form with memoized validation schema, RTL-aware navigation
      - Call Logging: 80+ translations, call timer, quick templates, internationalized validation
      - Caller History: Full i18n for filters, search, timeline view, export functionality
      - All pages support English/Farsi/Arabic with proper RTL layouts
      - Validation messages fully internationalized using useMemo pattern
      - Language toggle integrated for seamless switching

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (code-first schema)
- **Authentication**: JWT with refresh tokens and role-based access control (Admin, Teacher, Mentor, Student, Supervisor, Call Center Agent, Accountant, Front Desk Clerk).
- **API Design**: RESTful
- **Runtime**: Node.js ESM modules
- **Key Features**:
    - **Authentication**: JWT-based, role-based authorization, password and OTP login.
    - **User & Course Management**: CRUD for students, course enrollment, progress tracking, teacher assignment, scheduling, video courses.
    - **Payment & Wallet**: IRR-based wallet, member tiers, transaction tracking.
    - **AI Integration**: Adaptive micro-sessions, AI content generation (Ollama), pre-session review (AI grammar/vocab), in-session AI suggestions (Socket.io), post-session ratings.
    - **Video & Communication**: 24/7 on-demand video tutoring (WebRTC), screen sharing, call recording, AI features (live vocab, auto-transcript, grammar rewrite), VoIP integration (Isabel VoIP).
    - **Gamification**: XP/level system, achievements, daily challenges.
    - **Testing System**: Supports 8 question types, including MST Placement Test.
    - **Unified Class Scheduling**: Multi-view calendar with drag-and-drop.
    - **AI Supervisor**: Real-time AI supervision in video calls (audio streaming, vocabulary suggestions, attention tracking, TTT ratio monitoring) with Ollama fallback.
    - **Business Logic**: Centralized utilities for filtering, calculations, data integrity (Check-First Protocol).

### Database Design
- **ORM**: Drizzle
- **Schema**: User management, course system, payment tracking, gamification, mood intelligence, guest progress tracking, and LinguaQuest lessons.
- **Migration Notes**: For fresh deployments, the following table must be created:

```sql
-- LinguaQuest Lesson Feedback Table (added Oct 2025)
CREATE TABLE IF NOT EXISTS linguaquest_lesson_feedback (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES linguaquest_lessons(id),
  guest_session_token TEXT,
  user_id INTEGER REFERENCES users(id),
  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  difficulty_rating VARCHAR(20),
  text_feedback TEXT,
  was_helpful BOOLEAN,
  completion_time_seconds INTEGER,
  score_percentage INTEGER CHECK (score_percentage >= 0 AND score_percentage <= 100),
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

Alternative: Run `npm run db:push --force` during deployment to sync schema changes.

### Deployment Strategy
- **Development**: Replit hosting with Neon PostgreSQL.
- **Production**: Replit Deploy, downloadable as ZIP, Docker containerization. Designed for Iranian hosting, requiring PostgreSQL 14+, Node.js 18+, Nginx, and Docker (optional). App starts gracefully even if Ollama is initially unreachable.

## External Dependencies

### Development Environment (Replit)
- **Database**: Neon PostgreSQL
- **Testing**: Playwright (E2E), Vitest (unit)

### Production Environment (Iranian Self-Hosting)
- **Database**: Self-hosted PostgreSQL
- **Payment Gateway**: Shetab (Iranian network)
- **SMS Service**: Kavenegar (Iranian provider)
- **VoIP**: Isabel VoIP line (Iranian telecom)
- **AI Services**: Ollama server (local AI processing)
- **TTS Services**: Microsoft Edge TTS (self-hosted)
- **Fonts**: Self-hosted Arabic/Persian fonts
- **WebRTC**: Self-hosted TURN/STUN server, Socket.io (WebSockets), Simple Peer (WebRTC), RecordRTC (local recording)
- **Video Infrastructure**: Local filesystem storage and streaming
- **File Storage**: Local server filesystem
- **Self-Hosting**: ZERO dependencies on non-Iranian external services