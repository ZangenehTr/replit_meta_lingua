# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced multilingual language learning and institute management platform. It's built for Persian language instruction, designed to be self-hostable, and independent of services blocked in Iran. The platform provides a comprehensive admin system, student management, course enrollment, VoIP integration, and a wallet-based payment system. Its vision is to offer a robust, self-contained solution for language institutes, particularly in regions with internet restrictions, enabling effective Persian language education and efficient institute operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side navigation
- **Build Tool**: Vite
- **Language Support**: Multi-language support (English, Persian, Arabic) with RTL layout handling. Implements comprehensive i18n with Persian number formatting.
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
- **Authentication System**: JWT-based with role-based authorization.
- **Student Management**: CRUD operations, course enrollment, progress tracking, cultural profiling.
- **Payment & Wallet System**: IRR-based wallet, member tiers, Shetab payment gateway integration, transaction tracking.
- **Course Management**: Creation, teacher assignment, session scheduling, progress monitoring. Includes video courses and Callern time-free video call integration.
- **Gamification Features**: XP/level system, achievements, daily challenges, age-based games with localized content.
- **VoIP Integration**: Isabel VoIP line for call recording and call center functionality. Supports Bluetooth headset integration.
- **Teacher vs Mentor System**: Differentiated roles for direct instruction (Teachers) and progress monitoring/support (Mentors).
- **Comprehensive Testing System**: Supports 8 question types (multiple choice, true/false, short answer, essay, fill in blank, matching, ordering, listening comprehension).
- **Teacher Payment Management**: Automated calculation based on completed sessions, white-label multi-institute management, professional quality assurance system, SMS event management, placement test Q&A, and campaign management.
- **Unified Class Scheduling Interface**: Multi-view calendar, drag-and-drop scheduling, real-time availability.
- **Session Packages**: For private students to purchase bundles of sessions.
- **Communication System**: Support ticket management, internal chat, push notifications (email, SMS).
- **Ollama AI Services**: Local AI processing for Persian language support, model management, and data sovereignty.
- **Check-First Protocol**: Mandatory validation for data integrity and conflict prevention.
- **Business Logic Consolidation**: Centralized utilities for filtering, calculations, and data integrity.
- **Complete i18n Implementation**: Comprehensive Persian/Arabic/English translation system with RTL support across all admin dialogs and forms. Student management and course creation dialogs fully translated with proper RTL layout handling.

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
- **WebRTC**: Google STUN servers, OpenRelay free TURN servers, custom TURN server support.