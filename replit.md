# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced multilingual language learning and institute management platform. Its purpose is to provide a robust, self-contained solution for language institutes globally, enabling effective language education in any language and efficient institute operations. The platform is designed to be self-hostable and independent of services blocked in certain regions, catering to teaching ALL languages. Key capabilities include a comprehensive admin system, student management, course enrollment, VoIP integration, and a wallet-based payment system.

## User Preferences
Preferred communication style: Simple, everyday language.
Work sessions: User prefers to have work logged so they can resume from where we left off.
Critical requirement: Self-hosting in Iran with zero external dependencies. Must follow check-first protocol.
Database strategy: Use Replit/Neon for development only, migrate to self-hosted PostgreSQL for production in Iran.
Code quality: Always avoid duplications - no duplicate code, methods, or logic. Prefer composition and reuse over duplication.
Language preference: Default language set to Farsi (fa) for Iranian users (August 14, 2025).
Database cleanup: Successfully removed 23 duplicate methods from database-storage.ts (January 13, 2025).
Phase 2 implementation: Successfully connected 10 organizational & student management tables with all 29 tests passing (January 13, 2025).
Phase 3 implementation: Connected communication and teacher management tables with comprehensive test coverage (August 13, 2025). Added 11 missing methods for full functionality.
Phase 4 implementation: **100% DATABASE COVERAGE ACHIEVED** - All 103 tables now connected with real functionality, zero mock data (August 13, 2025). Added methods for 16 final tables including learning support, business operations, group management, system configuration, and assessment features.
UI Button Behaviors Audit: Comprehensive implementation of consistent React Query invalidation patterns, fixed all missing invalidations, created complete test suite with 24/24 tests passing (August 13, 2025).
Course/Class Architecture Separation: Successfully implemented separation where courses contain only general info (name, description, fee, level, language) and classes are specific instances with teacher/schedule/dates. Added new `classes` and `holidays` tables, implemented storage methods with automatic end-date calculation considering holidays, and created complete REST API endpoints for both resources. **FULLY TESTED: 4/4 tests passing** - Confirmed complete architectural separation with real database implementation (August 14, 2025).
Class Enrollment System: **COMPREHENSIVE ENROLLMENT IMPLEMENTATION** - Added `classEnrollments` table with full CRUD operations, student search by name/course, bulk enrollment capabilities, and automatic class capacity tracking. Implemented 10 new API endpoints for enrollment management. Course-based student creation replaces level system - students now assigned to courses during creation via `enrolledCourseId` field (August 14, 2025).

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
- **Authentication**: JWT-based with refresh token mechanism, role-based access control (Admin, Teacher, Mentor, Student, Supervisor, Call Center Agent, Accountant).
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
- **Callern Service**: 24/7 on-demand video tutoring system using WebRTC for real-time video calling, screen sharing, and call recording capabilities. Includes AI-powered features like live vocabulary suggestions, automatic transcript generation, grammar rewrite suggestions, personal glossary building with SRS, and quiz generation. Features teacher authorization system using teacherCallernAvailability table to control which teachers can provide Callern services.
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
- **Complete i18n Implementation**: Comprehensive Persian/Arabic/English translation system with RTL support across all admin dialogs and forms.
- **Unified Dashboard System**: Role-appropriate content for all 7 user roles landing on `/dashboard`.

### Deployment Strategy
- **Development**: Replit hosting.
- **Production**: Replit Deploy, downloadable as ZIP, Docker containerization. Designed for Iranian hosting.
- **Self-Hosting Requirements**: PostgreSQL 14+, Node.js 18+, Nginx, Docker (optional).

## External Dependencies

- **Database**: Neon PostgreSQL (development), self-hosted PostgreSQL (production).
- **Payment Gateway**: Shetab (for Iranian market).
- **SMS Service**: Kavenegar (for Iranian SMS).
- **VoIP**: Isabel VoIP line.
- **AI Services**: OpenAI API (personalization, development), Ollama server (local AI processing, production).
- **Testing**: Playwright (E2E), Vitest (unit).
- **Fonts**: Self-hosted Arabic/Persian fonts.
- **WebRTC**: Self-hosted TURN/STUN server support only. Integrated with Socket.io for signaling and Simple Peer for peer-to-peer connections.
- **Real-time Communication**: Socket.io for WebSocket connections, Simple Peer for WebRTC, RecordRTC for call recording.
- **Self-Hosting**: Complete independence from external services outside Iran.