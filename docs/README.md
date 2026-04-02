# Meta Lingua Academy — Platform Overview

**Version:** 1.2.0  
**Last Updated:** April 2, 2026  
**Status:** Production-Ready

---

## What is Meta Lingua?

Meta Lingua is a comprehensive, AI-enhanced multilingual language institute management platform built for Iranian and regional language schools. It is designed for **complete self-hosting** with zero dependency on foreign cloud services, making it ideal for institutes that require data sovereignty, speed, and full ownership of their infrastructure.

It combines institute administration, student management, course delivery, live tutoring, gamification, CRM, HR management, payment processing, marketing tools, and AI-powered teaching tools into a single integrated system.

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
| WCAG Compliant | Full ARIA labels, keyboard navigation, and focus management throughout |
| Private Classes | Session packages for 1-on-1 private lessons with sub-level targeting |

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
- Post-session mutual ratings (student rates teacher, teacher rates student)
- Live teacher ratings displayed to students when browsing available tutors

### 5. Private Classes
- Session packages (bundles of private lesson hours) with configurable pricing
- Per-package min/max student sub-level targeting for smart enrollment eligibility
- Teacher assignment and booking flow
- Integrated with the sub-level system for automatic course discovery

### 6. LinguaQuest Gamification
- XP and leveling system
- Achievement badges
- Daily challenges
- Interactive language learning games (12 game types)

### 7. AI Features
- Lexi — AI teaching assistant (Ollama or OpenAI)
- Adaptive micro-sessions
- AI lesson generator
- Guest placement test (CEFR-aligned, IRT scoring)
- AI HR performance narratives and anomaly detection
- Telegram AI sales agent

### 8. HR Module
- Employee directory and contracts
- Leave request workflow
- Monthly payroll records
- Role-specific KPI performance scoring
- Automated anomaly detection and alerts

### 9. Testing System
- 8 question types (MCQ, fill-in, listening, reading, etc.)
- Multi-Stage Adaptive Testing (MST) for placement with IRT-calibrated question bank
- CEFR level output (A1–C2)
- Full analytics per student and cohort

### 10. Payment & Finance
- Multi-gateway support: Shetab, Zarinpal, IDPay, Zibal, Mellat
- Wallet top-up and course payment flow
- Promo code engine (percentage/fixed, single-use-per-user, expiry) with real-time discount preview at checkout
- Full transaction history and receipts

### 11. Marketing & Growth
- **Course Reviews**: Students submit star ratings and written reviews after course completion. Admin moderation queue with approve/reject/feature controls. Approved reviews display on the public course page.
- **Referral Program**: Each student receives a unique referral code. Sharing the link rewards both the referrer (wallet credit) and the new student (welcome credit) on their first enrollment. Per-course share links, WhatsApp/SMS one-tap sharing, and a live leaderboard for admins.
- **UTM Attribution**: Marketing campaign source, medium, and campaign are captured at registration and on every payment transaction, enabling ROI tracking per channel.
- **SMS Campaign Management**: Bulk SMS to filtered groups of students

### 12. Communication
- Kavenegar SMS integration
- SMS campaign management
- Visitor live chat widget
- VoIP click-to-call via Issabel PBX (AMI protocol)

### 13. Content Management
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

## Changelog

### v1.2.0 — April 2, 2026
- **Private Class Stack**: Full private lesson system — session packages with per-package pricing, min/max sub-level configuration, teacher assignment, and booking flow end-to-end
- **Sub-level System**: Curriculum levels now support fine-grained sub-levels (e.g., A1.1, A1.2); smart course discovery filters courses by student's current sub-level
- **Promo Code Checkout UI**: Students can now enter promo codes directly in the enrollment dialog — real-time discount preview with strikethrough pricing before payment confirmation
- **RTL & Accessibility**: All 1,000+ physical directional Tailwind classes (ml/mr/pl/pr/left/right) replaced with logical equivalents (ms/me/ps/pe/start/end) for correct RTL layout; removed forced `dir="ltr"` from app layout; full ARIA label coverage for all icon-only buttons, modals, and navigation; keyboard focus management in all dialogs
- **MST Question Bank**: Multi-Stage Adaptive Test seeded with real IRT-calibrated questions across all CEFR levels and skill domains (listening, reading, grammar, vocabulary)
- **Post-Merge Automation**: `scripts/post-merge.sh` configured — dependency install and migrations run automatically after every task merge

### v1.1.0 — March 29, 2026
- **Course Reviews**: Full review submission, moderation, and public display system
- **Referral Program**: Unique codes per student, wallet credit rewards, admin leaderboard
- **UTM Attribution**: Campaign tracking from registration through to payment
- **CallerN Real Ratings**: Post-session mutual ratings with live aggregate display

### v1.0.0 — March 2026
- Initial production-ready release

---

## License & Support

This platform is delivered as a complete source-code package for self-hosting. All source code is included. Deployment and customization support is available separately.
