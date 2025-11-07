# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced, multilingual language learning and institute management platform designed for self-hosting, specifically for language institutes globally. It supports teaching various languages, extensive administration, student management, course enrollment, VoIP integration, and a wallet-based payment system. Its primary goal is to provide a powerful, customizable, and independent platform, particularly in regions requiring self-hosted solutions, offering a comprehensive and customizable solution for language education and administration.

## Recent Changes (November 2025)
**Deployment & Infrastructure Documentation**:
- **Comprehensive Deployment Guide**: Created 1,600-line DEPLOYMENT.md covering complete Iranian self-hosted production setup. Includes PostgreSQL/Redis/Nginx configuration, AI services (Ollama, Whisper, Edge TTS), WebRTC/TURN server, Iranian services integration (Kavenegar SMS, Shetab payments, Isabel VoIP), monitoring, backups, security hardening, and troubleshooting.
- **Environment Configuration Validation**: Added mandatory environment variable validation step (`npx tsx -e "import { validateEnvironment } from './server/config/env-validator.ts'; validateEnvironment();"`) to deployment workflow. Prevents silent configuration failures by catching variable naming errors (e.g., VOIP_* vs ISABEL_VOIP_*, SHETAB_API_KEY vs SHETAB_SECRET_KEY) before deployment.
- **Environment Files Alignment**: Fixed .env.production.template and .env.production.complete to match env-validator.ts exactly. Corrected Isabel VoIP variables (ISABEL_VOIP_SERVER, ISABEL_VOIP_PORT, etc.) and Shetab variables (SHETAB_SECRET_KEY, SHETAB_GATEWAY_URL, SHETAB_CALLBACK_URL). All three files now aligned and validated.
- **GitIgnore Updates**: Updated .gitignore to exclude .cache/ directory (8.8GB Whisper models + Playwright browsers), SQL backups, screenshots, and development files from version control to prevent deployment blockers.

**UI/UX Polish & Refinements**:
- **Statistics Boxes Redesign**: Changed admin dashboard statistics from narrow 4-column vertical layout to wider 2-column horizontal layout with rounded icon containers, better spacing, and no text wrapping issues. Icons now have solid colored backgrounds (56px rounded containers).
- **Role Indicators Enhancement**: Rainbow role indicators in sidebar now only visible to admin users. Made more subtle (width reduced from w-1 to w-0.5), limited to 3 colors max, with informative tooltips showing role access levels.
- **Error State Improvements**: Enhanced trial scheduling error screen with professional Card component, circular icon container, descriptive error messaging, dual-button layout (Retry + Back to Dashboard), responsive design, and client-side navigation.
- **Visitor Chat System**: Professional-grade real-time WebSocket messaging with typing indicators, canned responses (11 Persian templates), sound notifications, unread badges, and admin online status. Database tables created via SQL execution.
- **Curriculum Categories i18n**: Fixed navigation menu inconsistency where curriculum categories displayed in English despite active Persian/Arabic locale. Added `nameFa` and `nameAr` fields to curriculum_categories table, populated with translations for all 5 categories (Test Prep, Conversation & Fluency, Business English, Academic English, Kids & Teens), and updated PublicLayout component with `getCategoryName()` helper to display localized names based on current i18n language.

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
- **Localization**: Multi-language support with comprehensive i18n and full RTL/LTR layout handling (Persian/English/Arabic) across all pages and user roles.
- **UI/UX**: Modern gradient backgrounds, professional layouts, mobile-first responsive design, touch-optimized components, role-based UI, resizable panels, and bottom navigation for mobile.
- **Responsive Design**: Collapsible sidebar for tablets/desktop (64px collapsed, 256px expanded), mobile sheet sidebar (<768px), responsive grids and containers, smooth transitions, localStorage state persistence. Breakpoints: mobile <768px, tablet 768-1024px, desktop ≥1024px.
- **Key Features**:
    - Unified Dashboard for 8 user roles, conditionally displaying features based on enrollment status and admin configurations.
    - LinguaQuest interactive game system with 19 activity types and a progress dashboard.
    - TTS audio pre-generation pipeline.
    - Dynamic Form Management System for custom forms with 9 field types, multi-language support, and dynamic validation. Advanced widgets include `FileUploadWidget`, `RichTextWidget`, and `AudioRecorderWidget`.
    - Front Desk Clerk Pages with full internationalization, including Dashboard, Walk-in Intake, Call Logging, and Caller History.
    - Public marketing website with 8 pages (Homepage, Blog, Video Gallery, About, Contact) replacing the login-first experience, featuring SEO implementation and partial i18n.
    - Comprehensive SMS Campaign Management System for targeted marketing, audience segmentation (e.g., unpaid placement test takers, inactive students, custom CSV uploads), variable message templates, and bulk sending.
    - **Dynamic Curriculum Category System**: Admin-managed curriculum categories with drag-to-reorder, public curriculum hub (/curriculum), dynamic category detail pages (/curriculum/:slug), and integrated navigation dropdown. Supports SEO, i18n, and course-category associations.
    - **Guest Placement Test Flow**: Anonymous placement test (/take-test) with no login required, post-test contact capture modal, CEFR results display with skill breakdowns, curriculum category recommendations, and CTAs to register/enroll. Session persistence via localStorage enables test resume.
    - **Visitor Chat System**: Floating chat widget on all public pages with smooth, non-intrusive contact capture (after 2+ messages), full RTL support (Farsi/English/Arabic), and admin dashboard for managing visitor conversations, viewing contact info, and tracking inquiries.
    - **Font Management System**: White-label branding system (/admin/font-management) allowing admins to upload custom fonts (.woff, .woff2, .ttf, .otf), activate language-specific fonts (Farsi/English/Arabic), preview fonts before activation, and apply them globally via dynamic CSS injection. Supports one active font per language.

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
    - **Video & Communication**: 24/7 on-demand video tutoring (WebRTC), screen sharing, call recording, AI features (live vocab, auto-transcript, grammar rewrite), VoIP integration.
    - **Gamification**: XP/level system, achievements, daily challenges.
    - **Testing System**: Supports 8 question types, including MST Placement Test.
    - **Unified Class Scheduling**: Multi-view calendar with drag-and-drop.
    - **AI Supervisor**: Real-time AI supervision in video calls (audio streaming, vocabulary suggestions, attention tracking, TTT ratio monitoring) with Ollama fallback.
    - **Business Logic**: Centralized utilities for filtering, calculations, data integrity (Check-First Protocol).
    - **CMS Platform**: Management dashboards for Blog, Video, and Media library, supporting rich text editing, media uploads, and comprehensive metadata.

### Database Design
- **ORM**: Drizzle
- **Schema**: User management, course system, payment tracking, gamification, mood intelligence, guest progress tracking, LinguaQuest lessons, dynamic form definitions/submissions, curriculum categories with course associations, guest leads for contact capture, visitor chat sessions/messages for website engagement, and custom fonts for white-label branding with language-specific activation.
- **Migration**: `npm run db:push --force` for schema synchronization or manual SQL for fresh deployments.

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