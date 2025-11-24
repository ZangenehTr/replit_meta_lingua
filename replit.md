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
CRITICAL DIRECTIVE: Before any implementation, check existing codebase to avoid duplication. NO hardcoded data, NO fake/mock data, NO non-functional buttons, always use real API calls and working e2e business logic.

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
- **Key Features**: User & Course Management, payment & wallet system, AI Integration (adaptive micro-sessions, content generation via Ollama, pre/post-session reviews, in-session suggestions), Video & Communication (24/7 on-demand video tutoring via WebRTC, screen sharing, call recording, AI features like live vocab/auto-transcript/grammar rewrite, VoIP integration), Gamification (XP/level system, achievements, daily challenges), Testing System (8 question types, MST Placement Test), Unified Class Scheduling, AI Supervisor for real-time video call monitoring, CMS Platform (Blog, Video, Media library), CallerN Storage Layer for session management, roadmap tracking, and post-session reporting, OTP Service (SMS via Kavenegar, Email).

### Database Design
- **ORM**: Drizzle.
- **Schema**: Supports user management, course system, payment tracking, gamification, mood intelligence, guest progress, LinguaQuest lessons, dynamic form definitions/submissions, curriculum categories, guest leads, visitor chat sessions/messages, custom fonts, and CallerN session tracking (callSessions, callPostReports, sessionRatings, srsCards).

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