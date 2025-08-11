# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced multilingual language learning and institute management platform. It's designed for teaching ALL languages (English, Persian, Arabic, Spanish, French, German, Chinese, etc.), built to be self-hostable, and independent of services blocked in certain regions. The platform provides a comprehensive admin system, student management, course enrollment, VoIP integration, and a wallet-based payment system. Its vision is to offer a robust, self-contained solution for language institutes globally, enabling effective language education in any language and efficient institute operations.

## User Preferences
Preferred communication style: Simple, everyday language.
Work sessions: User prefers to have work logged so they can resume from where we left off.
Critical requirement: Self-hosting in Iran with zero external dependencies. Must follow check-first protocol.
Database strategy: Use Replit/Neon for development only, migrate to self-hosted PostgreSQL for production in Iran.
Recent session (2025-01-11):
- **Session Updates:**
  - Fixed white page issue - application now loads properly
  - Added /assignments route that redirects to homework page
  - Fixed database query errors in getStudentAssignments with proper null handling
  - Improved error handling to prevent app crashes
  - Student dashboard is now accessible with working navigation
- **Outstanding Requirements:**
  - All student pages need UI redesign with mobile app theme (native app look, not just responsive)
  - All functions on student and teacher pages need to be corrected and tested
  - Design approach: Full-screen gradients, glassmorphism effects, animated elements, bottom navigation
- **Previously Completed:**
  - Replaced all Math.random() usage with crypto functions for security
  - Fixed OTP generation to use crypto.randomInt() for secure 6-digit codes
  - Fixed file upload naming to use crypto.randomBytes() for unique identifiers
  - Fixed referral code generation to use crypto.randomBytes()
  - Removed 83+ instances of mock data throughout the codebase
  - Fixed SQL syntax errors in registration analytics
  - All endpoints now use real database queries instead of hardcoded values
- **Previously Completed:**
  - Implemented complete OTP login system via SMS for all user roles
  - Users can login using either password or a 6-digit SMS code
  - OTP codes expire after 5 minutes and are single-use only
  - Added SMS templates for student creation notifications
  - Students' phone numbers are set as their default password for easy first login
Previous session (2025-01-10): 
- Resolved database connectivity issues, confirmed Neon working for development, prepared migration guides for self-hosting
- Fixed Callern Management authorization issue (case-insensitive role checks)
- Added complete Persian translations for Callern Management interface
- Implemented full create Callern packages functionality (UI dialog + backend API)
Previous session (2025-01-09): 
- Previous session (2025-01-08): Complete translation overhaul of ALL admin components with form translations (200+ new keys)
- MAJOR TRANSLATION FIX: Resolved missing campaigns, smsSettings, and iranianCompliance translations across all languages
- Added comprehensive campaigns section translations (70+ keys) for all three languages (Persian, Arabic, English)
  - Includes campaign creation, social media integration, performance tracking, and automation features
- Added complete smsSettings section translations (50+ keys) for all three languages
  - Includes SMS event templates, automation rules, Kavenegar settings, and all event types
- Added full iranianCompliance section translations (40+ keys) for all three languages
  - Includes VoIP configuration, Shetab payment settings, and third-party services status
- Fixed structural inconsistencies between language files - all admin.json files now have matching section structures
- Updated English admin.json with missing translations to match Persian and Arabic completeness
- Ensured all eventTypes (enrollment, sessionReminder, homeworkAssigned, etc.) are properly translated
- Added missing recipient types (teacher, parent, student) in all languages
- All campaigns and SMS automation features now fully translated and functional
- Translation consistency achieved across all three language files - no more missing keys

## Test Accounts
All 7 roles have test accounts with the following credentials:
- **Admin**: admin@test.com / admin123
- **Teacher**: teacher@test.com / teacher123  
- **Student**: student@test.com / student123
- **Mentor**: mentor@test.com / mentor123
- **Supervisor**: supervisor@test.com / supervisor123
- **Call Center**: callcenter@test.com / callcenter123
- **Accountant**: accountant@test.com / accountant123

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side navigation
- **Build Tool**: Vite
- **Language Support**: Multi-language support for ALL languages (English, Persian, Arabic, Spanish, French, German, Chinese, Japanese, Korean, etc.) with RTL/LTR layout handling. Implements comprehensive i18n with localized number formatting.
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
- **Authentication System**: JWT-based with role-based authorization. Supports both password and OTP (One-Time Password) login via SMS for all roles. Students can use their phone number as default password.
- **Student Management**: CRUD operations, course enrollment, progress tracking, cultural profiling. Automatic SMS notifications on creation with login credentials.
- **Payment & Wallet System**: IRR-based wallet, member tiers, Shetab payment gateway integration, transaction tracking.
- **Course Management**: Creation, teacher assignment, session scheduling, progress monitoring. Includes video courses and Callern on-demand video tutoring service.
- **Callern Service**: 24/7 on-demand video tutoring system where students purchase hour packages and connect instantly with available teachers for any language. Features WebRTC-based video calling with real-time peer-to-peer connections, screen sharing, and call recording capabilities.
- **Gamification Features**: XP/level system, achievements, daily challenges, age-based games with localized content.
- **VoIP Integration**: Isabel VoIP line for call recording and call center functionality. Supports Bluetooth headset integration.
- **Teacher vs Mentor System**: Differentiated roles for direct instruction (Teachers) and progress monitoring/support (Mentors).
- **Comprehensive Testing System**: Supports 8 question types (multiple choice, true/false, short answer, essay, fill in blank, matching, ordering, listening comprehension).
- **Teacher Payment Management**: Automated calculation based on completed sessions, white-label multi-institute management, professional quality assurance system, SMS event management, placement test Q&A, and campaign management.
- **Unified Class Scheduling Interface**: Multi-view calendar, drag-and-drop scheduling, real-time availability.
- **Session Packages**: For private students to purchase bundles of sessions.
- **Communication System**: Support ticket management, internal chat, push notifications (email, SMS).
- **Ollama AI Services**: Local AI processing for multilingual language support (all languages), model management, and data sovereignty.
- **Check-First Protocol**: Mandatory validation for data integrity and conflict prevention.
- **Business Logic Consolidation**: Centralized utilities for filtering, calculations, and data integrity.
- **Complete i18n Implementation**: Comprehensive Persian/Arabic/English translation system with RTL support across all admin dialogs and forms. Student management and course creation dialogs fully translated with proper RTL layout handling.
- **Unified Dashboard System**: All 7 user roles land on `/dashboard` URL but see role-appropriate content. Eliminates infinite redirect loops while preserving all existing functionality and API endpoints. Each role maintains their specific dashboard features through role-based content routing.

### Deployment Strategy
- **Development**: Replit hosting, environment variables via Replit Secrets.
- **Production**: Replit Deploy, downloadable as ZIP, Docker containerization. Designed for Iranian hosting requirements with no reliance on blocked services.
- **Self-Hosting Requirements**: PostgreSQL 14+, Node.js 18+, Nginx, Docker (optional).

## External Dependencies

- **Database**: Neon PostgreSQL (development), self-hosted PostgreSQL (production).
- **Payment Gateway**: Shetab (for Iranian market).
- **SMS Service**: Kavenegar (for Iranian SMS).
- **VoIP**: Isabel VoIP line.
- **AI Services**: OpenAI API (personalization, development), Ollama server (local AI processing, production).
- **Testing**: Playwright (E2E), Vitest (unit).
- **Fonts**: Self-hosted Arabic/Persian fonts.
- **WebRTC**: Self-hosted TURN/STUN server support only (no external dependencies). Works on local networks or with configured TURN servers. Integrated with Socket.io for signaling and Simple Peer for peer-to-peer connections.
- **Real-time Communication**: Socket.io for WebSocket connections, Simple Peer for WebRTC, RecordRTC for call recording.
- **Self-Hosting**: Complete independence from external services outside Iran. All features work within local network or with self-hosted infrastructure.