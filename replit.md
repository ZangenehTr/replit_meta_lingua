# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced, multilingual language learning and institute management platform designed for self-hosting. It offers a comprehensive solution for language institutes globally, supporting teaching various languages, extensive administration, student management, course enrollment, VoIP integration, and a wallet-based payment system. Its primary goal is to provide institutes with a powerful, customizable, and independent platform, especially in regions requiring self-hosted solutions.

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
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Build Tool**: Vite
- **Localization**: Multi-language support with comprehensive i18n and full RTL/LTR layout handling (Persian/English/Arabic) implemented across all pages and user roles.
- **UI/UX**: Modern gradient backgrounds, professional layouts, responsive (mobile-first), touch-optimized components, role-based UI, resizable panels, and bottom navigation for mobile.
- **Key Features**:
    - Unified Dashboard for 8 user roles.
    - LinguaQuest interactive game system with 19 activity types and a progress dashboard.
    - TTS audio pre-generation pipeline.
    - Dynamic Form Management System for custom forms with 9 field types, multi-language support, and dynamic validation.
    - Front Desk Clerk Pages with full internationalization, including Dashboard, Walk-in Intake, Call Logging, and Caller History.

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (code-first schema)
- **Authentication**: JWT with refresh tokens and role-based access control (8 user roles).
- **API Design**: RESTful
- **Runtime**: Node.js ESM modules
- **Key Features**:
    - **Authentication**: JWT-based, role-based authorization, password and OTP login.
    - **User & Course Management**: CRUD for students, course enrollment, progress tracking, teacher assignment, scheduling, video courses.
    - **Payment & Wallet**: IRR-based wallet, member tiers, transaction tracking.
    - **AI Integration**: Adaptive micro-sessions, AI content generation (Ollama), pre-session review, in-session AI suggestions (Socket.io), post-session ratings.
    - **Video & Communication**: 24/7 on-demand video tutoring (WebRTC), screen sharing, call recording, AI features (live vocab, auto-transcript, grammar rewrite), VoIP integration (Isabel VoIP).
    - **Gamification**: XP/level system, achievements, daily challenges.
    - **Testing System**: Supports 8 question types, including MST Placement Test.
    - **Unified Class Scheduling**: Multi-view calendar with drag-and-drop.
    - **AI Supervisor**: Real-time AI supervision in video calls (audio streaming, vocabulary suggestions, attention tracking, TTT ratio monitoring) with Ollama fallback.
    - **Business Logic**: Centralized utilities for filtering, calculations, data integrity (Check-First Protocol).

### Database Design
- **ORM**: Drizzle
- **Schema**: User management, course system, payment tracking, gamification, mood intelligence, guest progress tracking, LinguaQuest lessons, and dynamic form definitions/submissions.
- **Migration**: `npm run db:push --force` for schema synchronization or manual SQL for fresh deployments.

### Dynamic Form System
- **Total Forms in Platform**: 19 forms across authentication, admin, teacher, supervisor, call center, and front desk categories
- **Migrated to DynamicForm**: 6 forms (32% migration rate)
  - ✅ Forgot Password (ID:1), Reset Password (ID:4), Course Creation (ID:10), Target Setting (ID:6), Communication Log (ID:7), Teacher Availability (ID:8)
- **Migration Boundaries Established**:
  - **DynamicForm Sweet Spot**: Simple embedded dialog forms with 3-7 basic fields (text, number, select, textarea, boolean)
  - **Cannot Migrate Without Enhancements**: Forms requiring file uploads (Student Management ID:20, Assignment Creation ID:9), rich text editors (TipTap), audio recording, custom UI widgets (SMS Template variable insertion ID:13), programmatic field manipulation, conditional logic, multi-step flows, or 20+ fields
- **Forms Catalog** (19 total):
  1. Forgot Password ✅, 2. Login, 3. Register, 4. Reset Password ✅, 5. User Profile Update, 6. Target Setting ✅, 7. Communication Log ✅, 8. Teacher Availability ✅, 9. Assignment Creation (⛔ file upload), 10. Course Creation ✅, 11. Video Lesson (⛔ auto-fill), 12. New Lead Intake (⛔ conditional fields), 13. SMS Template (⛔ variable insertion UI), 14. Call Logging (⛔ 20+ fields), 15. Video Course (⛔ file upload), 16. Class Observation, 17. Teacher Management, 19. Lead Management, 20. Student Management (⛔ profile image upload, 11 fields)
- **Strategic Approach**: Balanced hybrid - DynamicForm for simple forms, custom implementations for complex features to avoid feature regression

### Deployment Strategy
- **Development**: Replit hosting with Neon PostgreSQL.
- **Production**: Replit Deploy, downloadable as ZIP, Docker containerization. Designed for Iranian hosting, requiring PostgreSQL 14+, Node.js 18+, Nginx, and Docker (optional).

## External Dependencies

### Development Environment
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