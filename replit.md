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

### Database Design
- **ORM**: Drizzle.
- **Schema**: User management, course system, payment tracking, gamification, mood intelligence, guest progress, LinguaQuest lessons (12 total: 6 pre-existing A1-A2, 6 new B1-C1), dynamic form definitions/submissions, curriculum categories, guest leads, visitor chat sessions/messages, and custom fonts.

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
- **WebRTC**: Self-hosted TURN/STUN server, Socket.io, Simple Peer, RecordRTC
- **Video Infrastructure**: Local filesystem storage and streaming
- **File Storage**: Local server filesystem