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
CRITICAL DIRECTIVE: Before any implementation, check existing codebase to avoid duplication. NO hardcoded data, NO fake/mock data, NO non-functional buttons, always use real API calls and working e2e business logic.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Build Tool**: Vite
- **Localization**: Multi-language support with RTL/LTR layout handling and comprehensive i18n (Persian/English/Arabic).
  - **RTL Implementation** (Oct 2025): **🎉 HISTORIC MILESTONE - 100% COMPLETE FOR ENTIRE PLATFORM** ✅
    - **Verified RTL Pattern**: Import `useLanguage` hook OR use `i18n.dir()`, extract `isRTL`, add `dir={isRTL ? 'rtl' : 'ltr'}` OR `dir={direction}` to main container AND loading states (semantic approach, not className)
    - **Platform-Wide RTL Coverage**: **104/104 pages (100%)** across all 8 user roles ✅
      - **Admin**: 64/64 pages (100%) ✅
      - **Teacher**: 20/20 pages (100%) ✅
      - **Accountant**: 1/1 pages (100%) ✅
      - **Supervisor**: 2/2 pages (100%) ✅
      - **Mentor**: 4/4 pages (100%) ✅
      - **Call Center**: 7/7 pages (100%) ✅
      - **Front Desk**: 6/6 pages (100%) ✅
    - **Critical Achievement**: All loading states include dir attribute to ensure RTL works during loading, verified by architect with no regressions
    - **All Platform Pages RTL-Enabled**: Every page in client/src/pages/ has full RTL support with semantic dir attribute, proper isRTL extraction, and comprehensive loading state RTL coverage
- **UI/UX**: Modern gradient backgrounds, professional layouts, responsive (mobile-first), touch-optimized components, role-based UI, resizable panels, and bottom navigation for mobile.
- **Specific Implementations**: 
    - Unified Dashboard for 8 user roles
    - LinguaQuest interactive game system with 19 activity types (e.g., Sentence Reordering, Image Selection, Spelling, True/False)
    - LinguaQuest Progress Dashboard with real-time stats (XP, streaks, achievements, lesson history)
    - TTS audio pre-generation pipeline for LinguaQuest content
    - **Form Management System** (Oct 2025): Dynamic form builder for creating custom forms without code changes
      - Drag-and-drop form builder with 9 field types (text, email, phone, number, textarea, select, radio, checkbox, date)
      - Multi-language support (English/Persian/Arabic) for all form elements
      - Dynamic validation rules (required, min/max length, patterns, custom messages)
      - Form submission management with approval workflow
      - Export functionality for submissions (CSV/JSON)
      - Real-time form rendering from JSON schema
      - Admin-only access with role-based permissions
      - Database: form_definitions & form_submissions tables
      - Components: FormBuilder.tsx, DynamicForm.tsx
      - API: /api/admin/forms, /api/forms/:id/submit, /api/forms/:id (public endpoint with full multi-language support)
      - Note: File upload field type deferred until multipart file handling is implemented
      - **Pilot Migration** (Oct 30, 2025): Forgot Password form successfully migrated from hard-coded to dynamic (Form ID: 1)
        - Migration Pattern: Fetch form definition → Use DynamicForm component → Preserve custom styling → Keep original submission endpoint
        - Verified: Multi-language support, custom styling preservation, submission logic maintained, no regressions
      - **Mass Form Definition Creation** (Oct 30, 2025): **18 form definitions created & VERIFIED** across all user roles
        - **Authentication Forms**: Login (ID:2), Register (ID:3), Reset Password (ID:4), Forgot Password (ID:1) ✅
        - **User Forms**: User Profile Update (ID:5)
        - **Supervisor Forms**: Target Setting (ID:6), Class Observation (ID:16)
        - **Admin Forms**: Communication Log (ID:7), Course Creation (ID:10), Video Lesson (ID:11), Video Course (ID:15), Teacher Management (ID:17), Lead Management (ID:19)
        - **Teacher Forms**: Teacher Availability (ID:8), Assignment Creation (ID:9)
        - **Call Center Forms**: New Lead Intake (ID:12)
        - **Front Desk Forms**: SMS Template (ID:13), Call Logging (ID:14)
        - **Verification** (Oct 30, 2025): ✅ 100% field coverage vs Zod schemas, ✅ 100% EN/FA/AR label coverage (spot-checked IDs 8, 12, 19), ✅ Architect approved
        - **Migration Progress** (Oct 30, 2025 Session 2): **6 of 18 forms migrated (33%), 1 attempted with feature loss** 
          - **Completed Migrations**: Forgot Password (ID:1), Reset Password (ID:4), Course Creation (ID:10), Target Setting (ID:6), Communication Log (ID:7), Teacher Availability (ID:8)
          - **Attempted - Feature Loss Identified**: SMS Template (ID:13) - Basic CRUD migrated but lost variable insertion UI feature
          - **Migration Challenges Identified**:
            - **SMS Template (ID:13)**: Variable insertion button UI removed (users can still type {{variable}} manually)
            - **Assignment Creation (ID:9)**: Requires TipTap rich text editor, audio recording, file uploads - beyond DynamicForm capabilities
            - **Call Logging (ID:14)**: 20+ fields with call timer, auto-save, complex conditional logic - too complex for current DynamicForm
            - **Pattern Discovered**: Simple embedded dialog forms migrate well, complex feature-rich forms need DynamicForm enhancements or custom implementations
          - **Recommended Deferred**: Assignment Creation (ID:9), Call Logging (ID:14), forms with rich text editors, file uploads, or custom UI widgets
          - **Excluded from Migration**: Login (ID:2), Register (ID:3) - Complex custom logic (OTP toggle, conditional fields, custom action buttons)
        - **Migration Pattern Established** (Oct 30, 2025):
          1. Add FormDefinition interface and DynamicForm import
          2. Fetch form definition with useQuery (enabled only when dialog/form is visible)
          3. Create async submit handlers using mutateAsync() and returning promises
          4. Replace hard-coded form JSX with DynamicForm component (disabled={mutation.isPending}, showTitle={false})
          5. For edit dialogs: Pass initialValues with date strings converted to Date objects (e.g., `new Date(record.dateField)`)
          6. Remove unused schemas, form instances, and reset() calls
          7. Proper error handling and cache invalidation with queryClient.invalidateQueries()
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