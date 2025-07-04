# Meta Lingua Platform

## Overview

Meta Lingua is an AI-enhanced multilingual language learning and institute management platform built for Persian language instruction. The platform is designed to be self-hostable and runs independently without reliance on blocked services in Iran. It features a comprehensive admin system, student management, course enrollment, VoIP integration, and wallet-based payment system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side navigation
- **Build Tool**: Vite with development optimizations for Replit
- **Language Support**: Multi-language support (English, Persian, Arabic) with RTL layout handling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with refresh token mechanism
- **API Design**: RESTful API with role-based access control
- **Runtime**: Node.js ESM modules

### Database Design
- **ORM**: Drizzle with code-first schema approach
- **Provider**: Neon PostgreSQL (cloud-hosted for development)
- **Schema**: Comprehensive user management, course system, payment tracking, and gamification features

## Key Components

### Authentication System
- JWT-based authentication with access and refresh tokens
- Role-based authorization (admin, teacher, student, manager, etc.)
- Centralized API client with automatic token refresh
- Session management with graceful error handling

### Student Management
- Complete CRUD operations for student records
- Course enrollment and progress tracking
- VoIP integration for call recording (Isabel VoIP line)
- Cultural background and learning preference profiling

### Payment & Wallet System
- IRR-based wallet system with credit conversion
- Member tier system (Bronze, Silver, Gold, Diamond) with discounts
- Shetab payment gateway integration for Iranian market
- Transaction tracking and financial reporting

### Course Management
- Comprehensive course creation and management
- Teacher assignment and availability tracking
- Session scheduling with calendar integration
- Progress monitoring and analytics

### Gamification Features
- XP and level system
- Achievement badges and streaks
- Daily challenges and leaderboards
- Cultural learning incentives

### VoIP Integration
- Isabel VoIP line for call recording
- Contact management with click-to-call functionality
- Call history and recording storage

## Data Flow

1. **User Authentication**: Client authenticates via `/api/auth/login`, receives JWT tokens
2. **API Requests**: All requests go through centralized apiClient with automatic token attachment
3. **Database Operations**: Drizzle ORM handles all database interactions with type safety
4. **Real-time Updates**: React Query manages cache invalidation and background refetching
5. **Error Handling**: Comprehensive error boundaries and graceful degradation

## External Dependencies

### Development Dependencies
- **Database**: Neon PostgreSQL (cloud-hosted, development only)
- **Testing**: Playwright for E2E testing, Vitest for unit tests
- **AI Services**: OpenAI API for personalization features
- **Fonts**: Self-hosted Arabic/Persian fonts for RTL support

### Production Dependencies (Self-Hosted)
- **Database**: PostgreSQL server
- **Payment**: Shetab gateway for Iranian market
- **SMS**: Kavenegar service for Iranian SMS
- **VoIP**: Isabel VoIP line integration
- **AI**: Ollama server for local AI processing

### Code Quality Tools
- **Linting**: ESLint with TypeScript rules
- **Type Checking**: TypeScript strict mode
- **Testing**: Comprehensive test suite with 7/7 database tests passing

## Deployment Strategy

### Development Phase
- Hosted on Replit with cloud services for rapid development
- Environment variables managed through Replit Secrets
- Hot reload and development optimizations enabled

### Production Deployment
- Self-contained application bundle downloadable as ZIP
- Docker containerization for easy deployment
- Environment configuration for Iranian hosting requirements
- No external dependencies on blocked services

### Configuration Management
- Environment-based configuration system
- Support for Iranian payment and SMS providers
- Localization ready for Persian/Arabic markets
- Self-hosted font and asset management

## Changelog
- July 01, 2025. Initial setup
- July 01, 2025. Enhanced course creation UX: Auto-calculate end times from session duration, eliminating redundant user input
- July 04, 2025. Enhanced file upload support for .docx and .pages documents with mammoth library integration
- July 04, 2025. Fixed critical database schema issues with comprehensive schema synchronization script
- July 04, 2025. Resolved AI model management system issues: Fixed mock endpoint returning fake status, added proper offline state handling, enhanced error reporting with retry logic, and added preemptive safeguards to prevent mutations when Ollama service is unavailable
- July 04, 2025. Fixed critical circular dependency bug: Added missing getAvailableModels() method to OllamaService class, implemented fully functional bootstrap system that automatically installs Ollama and downloads initial models when service is offline, added prominent bootstrap UI with comprehensive error handling
- July 04, 2025. Fixed persistent "Failed to fetch" errors in API calls: Overhauled queryClient.ts to properly handle response parsing and error messaging
- July 04, 2025. Complete AI services management system overhaul: Model download progress tracking fixed with proper polling, auto-selection of active model for training workflow implemented, redundant auto-refresh buttons removed
- July 04, 2025. AI Conversations feature implemented: Added voice-enabled AI conversation tab with full speech/audio capabilities including voice recording, text-to-speech playback, and real-time conversation display for language learning practice
- July 04, 2025. Student AI Practice integration: Added AI Practice tab to student dashboard with hold-to-speak voice interface, backend routes for AI conversation processing, and real-time status monitoring for language learning practice sessions

## User Preferences

Preferred communication style: Simple, everyday language.