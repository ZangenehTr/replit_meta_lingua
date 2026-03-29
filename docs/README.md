# Meta Lingua Academy — Platform Overview

**Version:** 1.0.0  
**Last Updated:** March 29, 2026  
**Status:** Production-Ready

---

## What is Meta Lingua?

Meta Lingua is a comprehensive, AI-enhanced multilingual language institute management platform built for Iranian and regional language schools. It is designed for **complete self-hosting** with zero dependency on foreign cloud services, making it ideal for institutes that require data sovereignty, speed, and full ownership of their infrastructure.

It combines institute administration, student management, course delivery, live tutoring, gamification, CRM, HR management, payment processing, and AI-powered teaching tools into a single integrated system.

---

## Key Highlights

| Feature | Description |
|---|---|
| Self-Hosted | Runs entirely on your own server. No data leaves your premises. |
| Iranian-First | Integrates with Kavenegar SMS, Shetab payment network, Issabel VoIP |
| AI-Powered | Ollama (local) or OpenAI for teaching, content generation, and sales |
| Multilingual | Full Persian (RTL), English, and Arabic support |
| 8 User Roles | Admin, Supervisor, Teacher, Student, Front Desk, Mentor, Call Center, Accountant |
| PWA Ready | Installable as a mobile app on Android and iOS |
| WCAG Compliant | Accessible design throughout |

---

## Core Modules

### 1. Institute Administration
- Admin dashboard with real-time KPIs
- Course catalog management (levels, languages, pricing)
- Class scheduling (unified calendar view)
- Branch and room management

### 2. Student Management
- Phone-number-only OTP registration (no passwords)
- Enrollment workflow with payment integration
- Progress tracking per lesson and course
- Digital certificates (auto-issued on completion)
- Wallet system for balance top-ups and payments

### 3. Call Center ERP (CRM)
- 24-stage lead pipeline from first contact to enrollment
- Full audit trail with field-level change history
- Auto-SMS notifications at key pipeline stages
- Booking management for trial sessions

### 4. CallerN — 24/7 Video Tutoring
- On-demand video tutoring via WebRTC
- Screen sharing and call recording
- AI supervisor for real-time session analysis
- Quiz generation from session content

### 5. LinguaQuest Gamification
- XP and leveling system
- Achievement badges
- Daily challenges
- Interactive language learning games (12 game types)

### 6. AI Features
- Lexi — AI teaching assistant (Ollama or OpenAI)
- Adaptive micro-sessions
- AI lesson generator
- Guest placement test (CEFR-aligned, IRT scoring)
- AI HR performance narratives and anomaly detection
- Telegram AI sales agent

### 7. HR Module
- Employee directory and contracts
- Leave request workflow
- Monthly payroll records
- Role-specific KPI performance scoring
- Automated anomaly detection and alerts

### 8. Testing System
- 8 question types (MCQ, fill-in, listening, reading, etc.)
- Multi-Stage Adaptive Testing (MST) for placement
- CEFR level output (A1–C2)
- Full analytics per student and cohort

### 9. Payment & Finance
- Multi-gateway support: Shetab, Zarinpal, IDPay, Zibal, Mellat
- Wallet top-up and course payment flow
- Promo code engine (percentage/fixed, single-use-per-user, expiry)
- Full transaction history and receipts

### 10. Communication
- Kavenegar SMS integration
- SMS campaign management
- Visitor live chat widget
- VoIP click-to-call via Issabel PBX (AMI protocol)

### 11. Content Management
- Blog with rich text editor
- Video library with streaming
- Media file manager
- Custom fonts support (Arabic/Persian)

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui, Vite |
| Backend | Node.js, Express.js, TypeScript (ESM) |
| Database | PostgreSQL 14+ with Drizzle ORM |
| Auth | JWT + refresh tokens, OTP via Kavenegar |
| AI (local) | Ollama with llama3.2 |
| AI (cloud fallback) | OpenAI API |
| Queue | BullMQ + Redis 7 |
| Video | WebRTC + coturn (STUN/TURN) |
| TTS | Microsoft Edge TTS (self-hosted) |
| STT | Faster-Whisper (self-hosted) |
| VoIP | Issabel PBX via AMI (port 5038) |
| PDF | Puppeteer (server-side certificate generation) |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx with SSL |

---

## Documentation

| Document | Description |
|---|---|
| [Buyer Manual](./buyer-manual.md) | Complete guide for institute owners and administrators |
| [Deployment Guide](./deployment-guide.md) | Step-by-step server setup and production deployment |

---

## Repository Structure

```
meta-lingua/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── pages/        # All page components (by role)
│   │   ├── components/   # Shared UI components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # API client, utilities
├── server/               # Express backend
│   ├── routes/           # Feature-specific route files
│   ├── services/         # Business logic services
│   └── routes.ts         # Main route registration
├── shared/               # Shared types and DB schema
│   └── schema.ts         # Drizzle ORM schema (single source of truth)
├── migrations/           # SQL migration files (idempotent)
├── docs/                 # This documentation folder
├── docker-compose.yml    # Production container stack
├── Dockerfile            # Multi-stage production build
└── nginx.conf            # Example Nginx reverse proxy config
```

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (copy and edit)
cp .env.example .env

# 3. Push database schema
npm run db:push

# 4. Start development server
npm run dev
```

The application will be available at `http://localhost:5000`.

---

## License & Support

This platform is delivered as a complete source-code package for self-hosting. All source code is included. Deployment and customization support is available separately.
