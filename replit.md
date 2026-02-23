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
- **Authentication**: JWT with refresh tokens, role-based access control (8 user roles), phone-only OTP authentication.
- **API Design**: RESTful.
- **Key Features**: User & Course Management, payment & wallet system, AI Integration (adaptive micro-sessions, content generation via Ollama, AI Lesson Generator, AI Supervisor for video calls, AI 24/7 Sales Agent), Video & Communication (24/7 on-demand video tutoring via WebRTC, screen sharing, call recording, AI features like live vocab/auto-transcript/grammar rewrite, VoIP), Gamification (XP/level system, achievements), Testing System (8 question types, MST Placement Test), Unified Class Scheduling, CMS Platform (Blog, Video, Media library), CallerN Storage Layer for session management, roadmap tracking, and OTP Service (SMS, Email).
- **Phone Number Normalization**: Centralized normalization to +98XXXXXXXXXX format.

### Call Center ERP (24-Stage Pipeline)
- **Workflow Stages**: contact_desk → new_intake → follow_up/no_response → level_assessment → evaluation → consultation_cc/sup → pre_registration → final_registration → enrolled/private_class_setup → active class lifecycle
- **Transitions**: Validated via LEAD_STAGE_TRANSITIONS map in shared/schema.ts, covering all 24 stages with forward/backward paths
- **Activity Log**: lead_activity_log table with full field snapshots for audit trail, auto-recorded on every transition
- **SMS Triggers**: Auto-SMS via Kavenegar on key transitions (level_assessment, pre_registration, final_registration, enrolled, withdrawal)
- **Frontend**: 24 React components (7933 lines) in client/src/pages/callcenter/workflow-stages/ with real API calls
- **Schema**: Extended leads table with 27+ fields for withdrawal tracking, retry scheduling, follow-up color coding, assessment, payment, class management

### Database Design
- **ORM**: Drizzle.
- **Schema**: Supports comprehensive user, course, payment, gamification, mood intelligence, guest progress, LinguaQuest lessons, dynamic forms, curriculum categories, guest leads, visitor chat, custom fonts, CallerN session tracking, Daily Challenges, AI Supervisor Analysis, and Call Center ERP (lead_activity_log for audit trail).

### AI Provider Configuration
- Flexible selection via environment variables, supporting Ollama (default for self-hosting) and OpenAI, with automatic retry and fallback. Admin dashboard widget for monitoring and selection.

### Deployment Strategy
- **Development**: Replit hosting with Neon PostgreSQL.
- **Production**: Replit Deploy, downloadable as ZIP, Docker containerization. Designed for Iranian hosting, requiring PostgreSQL 14+, Node.js 18+, Nginx, and Docker (optional).
- **Optimization**: Multi-stage Dockerfiles, package cleanup, PWA precaching, code splitting, Terser minification.

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