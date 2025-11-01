# Meta Lingua Platform

## Overview
Meta Lingua is an AI-enhanced, multilingual language learning and institute management platform designed for self-hosting. It offers a comprehensive solution for language institutes globally, supporting teaching various languages, extensive administration, student management, course enrollment, VoIP integration, and a wallet-based payment system. Its primary goal is to provide institutes with a powerful, customizable, and independent platform, especially in regions requiring self-hosted solutions.

## Recent Changes

### Unified Student Dashboard Architecture (November 2025)
- **Decision**: Removed dual-dashboard architecture (ExplorerDashboard + EnrolledStudentDashboard) in favor of unified approach
- **Implementation**: 
  - Created `UnifiedStudentDashboard` component that handles both enrolled and non-enrolled states
  - Non-enrolled students see placement test CTA, public features (course catalog, teacher directory), and locked feature previews with enrollment CTAs
  - Enrolled students get full `EnrolledStudentDashboard` experience (3029 lines with all hubs)
  - Simplified `ConditionalDashboard` to single routing decision
- **Public Features System**:
  - Added `institutePublicFeaturesSchema` in shared/schema.ts for admin control over feature visibility
  - Created `/api/public-features` GET endpoint and `/api/admin/public-features` PUT endpoint
  - New `usePublicFeatures()` hook for fetching admin-configured visibility settings
  - 10 controllable features: courseCatalog, placementTest, teacherDirectory, liveClasses, progressTracking, linguaquestGames, certificates, oneOnOneSessions, blogPosts, videoCourses
- **Archived Components** (Preserved for Seasonal Campaigns):
  - `ExplorerDashboard.tsx` (1583 lines) → `_archived/` - Conversion-optimized dashboard with purple/blue gradient theme
  - `NonEnrolledStudentDashboard.tsx` (14 lines) → `_archived/` - Simple wrapper
  - **Future Use**: Christmas/Valentine's/New Year campaign landing pages with discount codes, special event promotions, A/B testing
  - Comprehensive README in `_archived/` with restoration guide and integration points
- **Benefits**: Reduced duplication, centralized feature control, consistent UX, easier maintenance, preserved campaign flexibility

### CMS Platform Development (Complete)
- **Phase 1**: Website builder retrofitted to CMS schema with proper API integration, payload filtering for InsertCmsPage compliance, and full type safety.
- **Phase 2**: All three CMS admin dashboards fully implemented:
  - **Phase 2A**: Blog management dashboard with RichTextWidget for content editing, category/tag selectors, featured image upload, draft/publish workflow, multi-language support, and SEO metadata fields.
  - **Phase 2B**: Video management dashboard supporting local uploads and YouTube/Vimeo embeds, with grid view, thumbnails, and comprehensive metadata editing.
  - **Phase 2C**: Media library dashboard with grid/list view toggle, file upload via FileUploadWidget, filtering by type, search functionality, statistics dashboard, and metadata editing. Backend PUT /api/cms/media/:id endpoint implemented for persisting alt text and captions.
- **Phase 3**: Gen-Z focused public marketing website with 8 pages replacing login-first experience:
  - **Public Layout**: Responsive header/footer with language switcher, gradient backgrounds (primary/purple/pink), mobile-optimized navigation
  - **Homepage** (/): Hero section, feature cards, stats dashboard, blog/video previews using real CMS API data, multiple CTAs
  - **Blog System** (/blog, /blog/:slug): Listing page with search/filters/pagination, detail page with rich text rendering, category/tag navigation, related posts
  - **Video Gallery** (/videos, /videos/:id): Grid layout with thumbnails, search/category filters, video player supporting local/YouTube/Vimeo embeds
  - **About Page** (/about): Mission statement, core values cards, institute statistics, fully internationalized
  - **Contact Page** (/contact): Contact cards (email/phone/location), working form with real POST /api/contact endpoint, Zod validation, toast feedback
  - **SEO Implementation**: SEOHead component on all pages with unique title/description/keywords/OpenGraph tags for social sharing
  - **i18n Status**: About/Contact pages fully translated with comprehensive data-testid coverage; Blog/Video/Home pages have partial i18n (framework in place, some hardcoded strings - backfill planned for final launch)
  - **Routing**: Public routes render before protected routes in App.tsx; unauthenticated users see public homepage instead of login screen

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
- **Migrated to DynamicForm**: 7 forms (37% migration rate)
  - ✅ Forgot Password (ID:1), Reset Password (ID:4), Course Creation (ID:10), Target Setting (ID:6), Communication Log (ID:7), Teacher Availability (ID:8), Student Management (ID:20)
- **Phase 1 Enhancement Complete (Advanced Widgets)**:
  - **Widget Registry System**: Modular architecture for custom field type rendering
  - **FileUploadWidget**: Drag-drop, multi-file, progress tracking, image preview, configurable subfolder storage with path traversal protection
  - **RichTextWidget**: TipTap editor integration with formatting toolbar, headings, lists, links, highlights
  - **AudioRecorderWidget**: Browser MediaRecorder API, real-time recording, playback controls, automatic upload
  - **File Storage API**: `/api/form-files/upload`, `/api/form-files/:subfolder/:filename` with multer, sanitized paths, MIME type validation
  - **Security**: All file operations enforce path traversal prevention (sanitizeSubfolder, path.basename, path.resolve verification)
  - **Backward Compatibility**: Existing 6 forms continue using built-in field types via `!Widget` fallback pattern
- **Migration Boundaries**:
  - **Migrated with Basic Fields**: Simple embedded dialog forms with text, number, select, textarea, date, boolean
  - **Migrated with Advanced Widgets**: Forms with file uploads (Student Management ID:20 with profile images)
  - **Future Enhancements Needed**: Conditional logic, multi-step flows, 20+ field forms, custom action widgets, computed fields
- **Forms Catalog** (19 total):
  1. Forgot Password ✅, 2. Login, 3. Register, 4. Reset Password ✅, 5. User Profile Update, 6. Target Setting ✅, 7. Communication Log ✅, 8. Teacher Availability ✅, 9. Assignment Creation (needs file upload), 10. Course Creation ✅, 11. Video Lesson (needs auto-fill), 12. New Lead Intake (needs conditional fields), 13. SMS Template (needs variable insertion UI), 14. Call Logging (20+ fields), 15. Video Course (needs file upload), 16. Class Observation, 17. Teacher Management, 19. Lead Management, 20. Student Management ✅ (12 fields with profile image upload)
- **Strategic Approach**: Balanced hybrid - DynamicForm for simple and file-based forms, custom implementations for complex features requiring conditional logic or specialized widgets

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