# Meta Lingua Platform - Master Guide

**Version:** 2.0  
**Last Updated:** December 2025  
**Platform Status:** Production Ready

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Core Features Summary](#2-core-features-summary)
3. [User Roles and Access Control](#3-user-roles-and-access-control)
4. [Authentication System](#4-authentication-system)
5. [Student Management](#5-student-management)
6. [Teacher Management](#6-teacher-management)
7. [Course and Class Management](#7-course-and-class-management)
8. [CallerN Video Tutoring System](#8-callern-video-tutoring-system)
9. [LinguaQuest Free Learning Platform](#9-linguaquest-free-learning-platform)
10. [Call Center Unified Workflow](#10-call-center-unified-workflow)
11. [Financial Management and Payments](#11-financial-management-and-payments)
12. [AI Services Integration](#12-ai-services-integration)
13. [Gamification System](#13-gamification-system)
14. [Communication Systems](#14-communication-systems)
15. [Mobile and PWA Features](#15-mobile-and-pwa-features)
16. [Testing and Assessment](#16-testing-and-assessment)
17. [Reporting and Analytics](#17-reporting-and-analytics)
18. [White-Label Customization](#18-white-label-customization)
19. [Deployment Guide](#19-deployment-guide)
20. [Environment Variables Reference](#20-environment-variables-reference)
21. [Test Accounts and Demo Mode](#21-test-accounts-and-demo-mode)
22. [Troubleshooting Guide](#22-troubleshooting-guide)
23. [API Reference Summary](#23-api-reference-summary)

---

## 1. Platform Overview

### What is Meta Lingua?

Meta Lingua is a comprehensive AI-enhanced multilingual language learning and institute management platform designed specifically for **self-hosting in Iran with zero external dependencies**. It combines traditional language institute management with modern AI-powered learning technologies.

### Key Value Propositions

| Feature | Description |
|---------|-------------|
| **Complete Self-Hosting** | No dependency on blocked or external services |
| **Iranian Market Optimized** | Supports Shetab payments, Kavenegar SMS, Persian calendar |
| **AI-Powered Learning** | Local Ollama integration for personalized education |
| **Multilingual Support** | Teaches any language with RTL/LTR support |
| **Comprehensive Management** | Full institute operations in one platform |
| **White-Label Ready** | Multi-tenant architecture for resellers |

### Core Components

1. **Learning Management System (LMS)** - Course creation, enrollment, progress tracking
2. **CallerN Video Tutoring** - 24/7 AI-powered video sessions
3. **LinguaQuest** - Free gamified learning with 23 activity types
4. **Student Information System** - Comprehensive student profiles
5. **Teacher Management** - Scheduling, payments, performance
6. **Financial Management** - Wallet, Shetab payments, teacher payroll
7. **Call Center CRM** - Lead management, unified workflow
8. **AI Services** - Ollama/OpenAI for content generation and analysis
9. **Gamification Engine** - XP, levels, achievements, daily challenges

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Express.js, TypeScript, Node.js ESM |
| **Database** | PostgreSQL 14+, Drizzle ORM |
| **State Management** | TanStack React Query |
| **Routing** | Wouter |
| **Build Tool** | Vite |
| **Real-time** | Socket.io, WebRTC (SimplePeer) |
| **AI** | Ollama (self-hosted), OpenAI (optional) |

---

## 2. Core Features Summary

### Production-Ready Features (✅ 85%+ Complete)

- ✅ Multi-method authentication (Phone OTP, Password, JWT)
- ✅ 8 user roles with role-based access control
- ✅ Student and teacher profile management
- ✅ Course creation and class scheduling
- ✅ CallerN video tutoring with recording
- ✅ LinguaQuest 23 game types
- ✅ Wallet system with IRR currency
- ✅ Shetab payment gateway integration
- ✅ Kavenegar SMS integration
- ✅ AI provider switching (Ollama/OpenAI)
- ✅ PWA with offline support
- ✅ Full Persian/English/Arabic i18n
- ✅ Mobile-first responsive design

### Features in Progress (🟡 50-84%)

- 🟡 AI Supervisor for video sessions
- 🟡 Advanced gamification features
- 🟡 VoIP integration (Isabel)
- 🟡 Advanced analytics dashboards

---

## 3. User Roles and Access Control

Meta Lingua supports **8 distinct user roles**, each with specific permissions and dashboard features:

### Role Overview

| Role | Persian Name | Primary Functions |
|------|--------------|-------------------|
| **Admin** | مدیر سیستم | Full system control and configuration |
| **Teacher** | معلم | Direct instruction and content delivery |
| **Student** | دانش‌آموز | Learning and course participation |
| **Mentor** | منتور | Student guidance and progress monitoring |
| **Supervisor** | سرپرست | Quality assurance and teacher evaluation |
| **Call Center Agent** | پشتیبان | Customer service and lead management |
| **Accountant** | حسابدار | Financial operations and reporting |
| **Front Desk Clerk** | پذیرش | Reception, intake, scheduling |

### Role Capabilities Matrix

| Capability | Admin | Teacher | Student | Mentor | Supervisor | Call Center | Accountant | Front Desk |
|------------|:-----:|:-------:|:-------:|:------:|:----------:|:-----------:|:----------:|:----------:|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Course Creation | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Class Teaching | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CallerN Sessions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lead Management | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Financial Reports | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Student Guidance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Teacher Evaluation | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 4. Authentication System

### Phone-Only OTP Authentication (Primary Method)

Meta Lingua uses **phone number + OTP** as the primary authentication method, optimized for the Iranian market.

#### Authentication Flow

```
1. User enters phone number (09XXXXXXXXX or +989XXXXXXXXX)
2. System normalizes phone to +98XXXXXXXXXX format
3. OTP sent via Kavenegar SMS
4. User enters 6-digit OTP code
5. JWT tokens issued (access + refresh)
6. Session created with 24-hour access, 7-day refresh
```

#### Phone Number Normalization

All phone formats are normalized to `+98XXXXXXXXXX`:

| Input Format | Normalized Format |
|--------------|-------------------|
| `09121234567` | `+989121234567` |
| `+989121234567` | `+989121234567` |
| `989121234567` | `+989121234567` |

#### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/phone/request-otp-login` | POST | Request OTP for existing user |
| `/api/auth/phone/request-otp-signup` | POST | Request OTP for new registration |
| `/api/auth/phone/verify-otp-login` | POST | Verify OTP and login |
| `/api/auth/phone/verify-otp-signup` | POST | Verify OTP and create account |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout and invalidate session |

#### Security Features

- **Rate Limiting**: 5 OTP requests per phone per 15 minutes
- **OTP Expiry**: 10 minutes
- **Resend Cooldown**: 90 seconds between requests
- **Phone Validation**: Iranian format only (09XXXXXXXXX)
- **Bcrypt Password Hashing**: For legacy password auth
- **JWT Tokens**: HS256 signed with secret keys

---

## 5. Student Management

### Student Lifecycle

```
Registration → Placement Test → Course Selection → Enrollment → Learning → Assessment → Certification
```

### Student Profile Features

- **Personal Information**: Name, phone, email, emergency contacts
- **Academic History**: Previous courses, certifications, levels
- **Learning Analytics**: Progress data, strengths/weaknesses
- **Cultural Profile**: Background for personalized content
- **Wallet Balance**: IRR-based prepaid credit
- **CallerN Packages**: Purchased video tutoring hours

### Enrollment System

1. **Self-Registration**: Phone OTP verification
2. **Placement Test**: MST adaptive assessment (10 minutes)
3. **CEFR Placement**: A1-C2 automatic assignment
4. **Course Enrollment**: With prerequisite checking
5. **Progress Tracking**: Real-time analytics

---

## 6. Teacher Management

### Teacher Profile Components

- **Qualifications**: Certificates, experience levels
- **Specializations**: Languages, course types
- **Availability**: Calendar-based scheduling
- **CallerN Authorization**: Optional video tutoring approval
- **Hourly Rates**: Per-class and CallerN rates
- **Performance Metrics**: Student ratings, attendance

### CallerN Teacher Features

When authorized for CallerN:

1. **Go Online**: Toggle availability status
2. **Set Preferences**: Languages, levels, session types
3. **Accept Sessions**: Real-time student connections
4. **AI Assistance**: Live teaching suggestions
5. **Earnings Tracking**: Commission-based payments

### Payment Calculation

```
Teacher Payment = Base Salary + (Class Hours × Hourly Rate) + (CallerN Sessions × Commission) + Bonuses
```

---

## 7. Course and Class Management

### Course Hierarchy

```
Institute
├── Departments (English, Persian, Arabic)
│   ├── Programs (General, Business, Exam Prep)
│   │   ├── Courses (Beginner English, IELTS Speaking)
│   │   │   ├── Classes (Monday 9 AM, Online Group A)
│   │   │   │   ├── Sessions (Individual class meetings)
│   │   │   │   └── Students (Enrolled learners)
│   │   │   └── Materials (Curriculum content)
│   │   └── Assessments (Tests and evaluations)
│   └── Teachers (Assigned instructors)
└── Resources (Shared materials and tools)
```

### Class Scheduling Features

- **Multi-View Calendar**: Day, week, month, agenda views
- **Drag-and-Drop**: Easy class time adjustments
- **Conflict Detection**: Automatic scheduling alerts
- **Room Management**: Physical and virtual classrooms
- **Recurring Sessions**: Automatic schedule generation
- **Holiday Integration**: Persian calendar support

---

## 8. CallerN Video Tutoring System

### Overview

CallerN is Meta Lingua's revolutionary 24/7 on-demand video tutoring service connecting students with teachers instantly.

### Core Features

| Feature | Description |
|---------|-------------|
| **WebRTC Video** | SimplePeer-based, low latency |
| **Screen Sharing** | Collaborative learning |
| **Auto Recording** | Mandatory session capture |
| **TURN/STUN** | Self-hosted coturn server |
| **AI Supervisor** | Real-time feedback and suggestions |

### Student Flow

```
1. Purchase Package (5/10/15 hours)
2. Start Session from Dashboard
3. Select Learning Focus (Conversation, Grammar, Exam Prep)
4. System Matches Available Teacher
5. Connect via WebRTC Video
6. AI Provides Live Assistance
7. Session Auto-Recorded
8. Post-Session Review Available
```

### AI Supervisor Features (In-Session)

- **Vocabulary Suggestions**: Context-appropriate words
- **Grammar Corrections**: Real-time error detection
- **Pronunciation Feedback**: Accent analysis
- **TTT Monitoring**: Teacher Talking Time ratio
- **Attention Tracking**: MediaPipe facial detection
- **Transcript Generation**: Speech-to-text conversion

### Recording System

- **Format**: WebM (256kbps, 20fps)
- **Storage**: `/recordings/YYYY-MM/` folders
- **Max Size**: 500MB per recording
- **Upload**: JWT-authenticated secure upload
- **History**: Full recording list on dashboard

---

## 9. LinguaQuest Free Learning Platform

### Overview

LinguaQuest is a free, gamified language learning platform with **23 unique activity types** covering all CEFR levels (A1-C2).

### Activity Types

| # | Activity Type | Description |
|---|---------------|-------------|
| 1 | **Introduction** | Scenario setup with audio narration |
| 2 | **Vocabulary Practice** | Flashcards, galleries, word building |
| 3 | **Matching Games** | Drag-and-drop, memory games |
| 4 | **Conversation Practice** | Dialogue roleplay, real scenarios |
| 5 | **Pronunciation Challenge** | TTS reference audio practice |
| 6 | **Listening Comprehension** | Audio playback with questions |
| 7 | **Fill in the Blank** | Text input, story completion |
| 8 | **Drag and Drop** | Shopping simulations, sorting |
| 9 | **Quick Quiz** | Multiple-choice with feedback |
| 10 | **Menu Exploration** | Restaurant/food vocabulary |
| 11 | **Ordering Practice** | Order simulation with requests |
| 12 | **Symptom Description** | Medical vocabulary practice |
| 13 | **Prescription Reading** | Medical document comprehension |
| 14 | **Sentence Reordering** | Word order practice |
| 15 | **Image Selection** | Picture-based vocabulary |
| 16 | **True/False Questions** | Binary choice exercises |
| 17 | **Spelling Challenge** | Spelling with audio cues |
| 18 | **Vocabulary Matching** | Content Bank integration |
| 19 | **Synonym/Antonym** | Word relationship matching |
| 20 | **Word Formation** | Tile-based word building |
| 21 | **Grammar Battles** | Multi-rule quiz with explanations |
| 22 | **Cultural Context** | Cultural immersion content |
| 23 | **Default Step** | Fallback for unknown types |

### Lesson Structure

```json
{
  "title": "At the Restaurant",
  "level": "A2",
  "language": "english",
  "activities": [
    { "type": "introduction", "data": {...} },
    { "type": "vocabulary_gallery", "data": {...} },
    { "type": "conversation_practice", "data": {...} },
    { "type": "quick_quiz", "data": {...} }
  ]
}
```

### Guest Access

- No authentication required
- Session token stored in localStorage
- Progress tracked per session
- Converts to registered user progress on signup

---

## 10. Call Center Unified Workflow

### Overview

The Call Center module provides a **unified workflow interface** for managing leads through the entire prospect lifecycle.

### Workflow Stages

| Stage | Description | Actions |
|-------|-------------|---------|
| **New Intake** | Fresh leads from marketing/website | Create lead, initial contact |
| **Contact Desk** | Active outreach and follow-up | Call tracking, notes, scheduling |
| **Follow Up** | Pending callbacks and reminders | Set reminders, track attempts |
| **Qualified** | Ready for enrollment | Prepare enrollment docs |
| **Enrolled** | Completed registration | Welcome package, orientation |
| **Lost** | Did not convert | Archive with reason |

### Lead Creation API

```
POST /api/leads
{
  "firstName": "علی",
  "lastName": "محمدی",
  "phone": "09121234567",
  "email": "ali@example.com",
  "source": "call_center",
  "courseTarget": "IELTS",
  "workflowStage": "new_intake"
}
```

### Stage Transitions

```
New Intake → Contact Desk → Follow Up → Qualified → Enrolled
                    ↓           ↓          ↓
                   Lost        Lost       Lost
```

### Role Permissions

- **Admin**: Full access to all leads and stages
- **Call Center Agent**: Create leads, manage assigned leads
- **Supervisor**: View all leads, assign agents, reports

---

## 11. Financial Management and Payments

### Wallet System

- **Currency**: IRR (Iranian Rial)
- **Features**: Prepaid credit, top-up, transactions
- **Balance Tracking**: Real-time updates
- **Transaction Types**: Deposit, withdrawal, payment, refund

### Shetab Payment Gateway

Iran's national payment network integration:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payment/shetab/initiate` | POST | Start payment |
| `/api/payment/shetab/callback` | POST | Receive confirmation |
| `/api/payment/shetab/status` | GET | Gateway status |
| `/api/payment/shetab/transaction/:id` | GET | Transaction status |
| `/api/payment/shetab/refund` | POST | Request refund |
| `/api/payment/shetab/history` | GET | User's history |

### Payment Flow

```
1. User initiates payment (course, CallerN package)
2. System creates transaction record
3. Redirect to Shetab gateway
4. User enters bank card details
5. Bank processes payment
6. Callback received with confirmation
7. Wallet updated, transaction completed
8. Receipt generated
```

### Security Features

- **HMAC Signature**: Cryptographic verification
- **Idempotency**: Transaction deduplication
- **Rate Limiting**: Prevent abuse
- **Audit Trail**: Full transaction history

### Member Tiers

| Tier | Requirements | Benefits |
|------|--------------|----------|
| **Bronze** | Default | Standard access |
| **Silver** | 500,000 IRR spent | 5% discount |
| **Gold** | 2,000,000 IRR spent | 10% discount, priority |
| **Platinum** | 5,000,000 IRR spent | 15% discount, VIP support |

---

## 12. AI Services Integration

### Provider Architecture

Meta Lingua supports multiple AI providers with automatic failover:

```
Primary Provider (Ollama) → Fallback Provider (OpenAI)
```

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROVIDER` | Primary provider | `ollama` |
| `AI_FALLBACK_PROVIDER` | Backup provider | `openai` |
| `OLLAMA_HOST` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model | `llama3.2` |
| `OPENAI_API_KEY` | OpenAI API key | - |

### AI Capabilities

| Feature | Provider | Description |
|---------|----------|-------------|
| **Content Generation** | Ollama/OpenAI | Lesson content, quizzes |
| **Grammar Correction** | Ollama/OpenAI | Real-time error detection |
| **Vocabulary Suggestions** | Ollama/OpenAI | Context-aware words |
| **Speech-to-Text** | Whisper | Transcription |
| **Text-to-Speech** | Edge TTS | Audio generation |
| **AI Lesson Generator** | Ollama/OpenAI | Auto-create LinguaQuest lessons |

### Health Monitoring

Admin dashboard includes AI provider health widget:

- Connection status
- Model availability
- Response latency
- Error rates

---

## 13. Gamification System

### XP and Leveling

#### XP Earning Activities

| Activity | XP Earned |
|----------|-----------|
| Lesson Completion | 100 XP |
| Homework Submission | 50 XP |
| Perfect Attendance (Week) | 200 XP |
| CallerN Session (30 min) | 150 XP |
| Test Completion | 75 XP |
| Forum Participation | 25 XP |
| Daily Login | 10 XP |
| Streak Bonus | Multiplier |

#### Level Progression

| Levels | Category | XP per Level |
|--------|----------|--------------|
| 1-20 | Beginner | 1,000 XP |
| 21-50 | Intermediate | 2,000 XP |
| 51-80 | Advanced | 3,000 XP |
| 81-100 | Expert | 5,000 XP |

### Achievement System

- **Learning Achievements**: First lesson, first test, milestones
- **Consistency Achievements**: Streaks, regular attendance
- **Excellence Achievements**: Perfect scores, rapid improvement
- **Social Achievements**: Forum participation, helping others

### Daily Challenges

Generated daily based on user level and preferences:

- **Vocabulary Builder**: Learn 10 new words
- **Grammar Master**: Complete grammar exercises
- **Speaking Practice**: 30-minute CallerN session
- **Reading Comprehension**: Complete reading task
- **Writing Excellence**: Submit writing assignment

### Leaderboards

- **Global**: All users
- **Class**: Within specific courses
- **Weekly**: Recent activity ranking
- **Skill-Specific**: By language skill (LRSW)

---

## 14. Communication Systems

### SMS Integration (Kavenegar)

Iranian SMS provider for:

- OTP verification codes
- Class reminders
- Announcements
- Marketing campaigns

**Configuration:**
```env
KAVENEGAR_API_KEY=your-api-key
KAVENEGAR_SENDER=your-sender-number
```

**Rate Limits:**
- 100 SMS per 15 minutes
- 10 bulk SMS per hour

### In-App Messaging

- Real-time chat (Socket.io)
- Group messaging for classes
- File sharing
- Message history
- Read receipts

### Notification System

| Channel | Purpose |
|---------|---------|
| SMS | Critical alerts, OTPs |
| Push | Real-time app notifications |
| Email | Reports, newsletters |
| In-App | Messages, updates |

---

## 15. Mobile and PWA Features

### Progressive Web App

Meta Lingua is installable as a native-like app:

- **Install Prompt**: Add to home screen
- **Offline Support**: Service worker caching
- **Push Notifications**: Real-time alerts
- **Standalone Mode**: Full-screen experience

### Caching Strategy

| Content Type | Strategy | Duration |
|--------------|----------|----------|
| Fonts & Static | CacheFirst | 1 year |
| API Calls | NetworkFirst | 1 day |
| Images | CacheFirst | 30 days |

### Mobile-First Design

- Touch-optimized interfaces
- Bottom navigation for mobile
- Swipe gestures
- Thumb-friendly layouts
- Responsive breakpoints

---

## 16. Testing and Assessment

### Question Types (8 Types)

1. **Multiple Choice**: Single/multiple answers
2. **True/False**: Binary choice
3. **Fill in the Blanks**: Text input with auto-correction
4. **Essay Questions**: AI evaluation
5. **Speaking Tests**: Recording and analysis
6. **Listening Comprehension**: Audio with questions
7. **Matching Exercises**: Pair connections
8. **Ordering/Sequencing**: Arrange in correct order

### MST Placement Test

- **Adaptive Testing**: Difficulty adjusts to responses
- **Duration**: 10 minutes
- **Skills Tested**: Reading, Listening, Grammar
- **CEFR Output**: A1-C2 level assignment
- **Personalized Roadmap**: Generated from results

---

## 17. Reporting and Analytics

### Available Reports

| Report Type | Audience | Contents |
|-------------|----------|----------|
| **Student Progress** | Students, Parents | Skills, attendance, grades |
| **Class Performance** | Teachers | Participation, outcomes |
| **Financial** | Accountants | Revenue, payments, payroll |
| **Teacher Evaluation** | Supervisors | Ratings, observations |
| **Lead Conversion** | Call Center | Funnel metrics |
| **System Health** | Admins | Usage, performance |

### Export Formats

- PDF with charts
- Excel spreadsheets
- CSV for data analysis

---

## 18. White-Label Customization

### Branding Options

- Logo replacement
- Color scheme customization
- Typography selection
- Layout themes
- Custom CSS

### Multi-Tenant Features

- Subdomain deployment
- Custom domain support
- Institute-specific settings
- Isolated data storage

### Configuration

```
Institute Configuration:
- Institute Name: "Tehran Language Academy"
- Subdomain: "tehran-academy"
- Custom Domain: "tehranacademy.com"
- Primary Language: Persian
- Currency: IRR
- Time Zone: Asia/Tehran
```

---

## 19. Deployment Guide

### System Requirements

#### Production (Iranian Self-Hosting)

| Component | Requirement |
|-----------|-------------|
| **OS** | Ubuntu 20.04 LTS or CentOS 8+ |
| **Node.js** | 18.x or higher |
| **PostgreSQL** | 14.x or higher |
| **Nginx** | 1.18+ (reverse proxy) |
| **RAM** | 8GB minimum (16GB recommended) |
| **Disk** | 50GB+ free space |
| **CPU** | 4 cores minimum (8 recommended) |

### Deployment Options

#### Option 1: Replit Deploy

1. Configure production secrets in Replit
2. Click Deploy button
3. Configure custom domain (optional)
4. Run `npm run db:push` for migrations

#### Option 2: Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: metalingua
      POSTGRES_USER: metalingua_user
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://metalingua_user:password@postgres:5432/metalingua
      JWT_SECRET: your-jwt-secret
      NODE_ENV: production
    ports:
      - "5000:5000"

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"

volumes:
  postgres_data:
  ollama_data:
```

#### Option 3: Manual Server Deployment

```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y nodejs postgresql nginx

# 2. Create database
sudo -u postgres createdb metalingua
sudo -u postgres createuser metalingua_user

# 3. Deploy application
cd /var/www/metalingua
npm ci --production
npm run build

# 4. Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

### Iranian Services Setup

#### Ollama (Self-Hosted AI)

```bash
curl https://ollama.ai/install.sh | sh
ollama serve
ollama pull llama3.2
```

#### Kavenegar SMS

```bash
# Register at kavenegar.com
# Add to .env:
KAVENEGAR_API_KEY=your-api-key
KAVENEGAR_SENDER=your-sender-number
```

#### Shetab Payment Gateway

Contact bank merchant services for:
- Merchant ID
- Terminal ID
- API Key

#### TURN/STUN Server (coturn)

```bash
sudo apt install coturn
# Configure /etc/turnserver.conf
sudo systemctl enable coturn
```

---

## 20. Environment Variables Reference

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/metalingua"

# JWT Authentication
JWT_SECRET="generate-256-bit-random-string"
JWT_REFRESH_SECRET="generate-another-256-bit-string"

# Application
NODE_ENV="production"
PORT="5000"
APP_URL="https://your-domain.com"
```

### AI Services

```env
# Primary AI (Ollama - Self-Hosted)
AI_PROVIDER="ollama"
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="llama3.2"

# Fallback AI (OpenAI)
AI_FALLBACK_PROVIDER="openai"
OPENAI_API_KEY="sk-your-key"
```

### Iranian Services

```env
# Kavenegar SMS
KAVENEGAR_API_KEY="your-api-key"
KAVENEGAR_SENDER="your-sender"

# Shetab Payment
SHETAB_MERCHANT_ID="your-merchant-id"
SHETAB_API_KEY="your-api-key"
SHETAB_TERMINAL_ID="your-terminal-id"
SHETAB_CALLBACK_URL="https://your-domain.com/api/payment/shetab/callback"

# Isabel VoIP (Optional)
ISABEL_VOIP_NUMBER="your-number"
ISABEL_VOIP_API_KEY="your-api-key"
```

### WebRTC

```env
TURN_SERVER_URL="turn:your-domain.com:3478"
TURN_SERVER_USERNAME="username"
TURN_SERVER_PASSWORD="password"
STUN_SERVER_URL="stun:your-domain.com:3478"
```

### Demo Mode

```env
# Enable demo mode for test accounts
DEMO_TEST_ACCOUNTS="true"
DEMO_TEST_SECRET="your-demo-secret-for-otp-generation"
```

---

## 21. Test Accounts and Demo Mode

### Demo OTP System

For testing and demonstrations, Meta Lingua includes a demo mode that generates predictable OTP codes for whitelisted test accounts.

#### Enabling Demo Mode

```env
DEMO_TEST_ACCOUNTS=true
DEMO_TEST_SECRET=your-secret-key
```

#### Test Accounts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| **Teacher** | Sara Rezaei | +989121234567 | sara.rezaei@example.com |
| **Teacher** | Ali Mohammadi | +989127654321 | ali.mohammadi@example.com |
| **Student** | Maryam Karimi | +989131234567 | maryam.karimi@example.com |
| **Student** | Reza Ahmadi | +989137654321 | reza.ahmadi@example.com |
| **Admin** | Admin User | +989101234567 | admin@metalingua.com |
| **Accountant** | Sara Accountant | +989101234568 | accountant@metalingua.com |
| **Call Center** | Ali CallCenter | +989101234569 | callcenter@metalingua.com |
| **Front Desk** | Maryam FrontDesk | +989101234570 | frontdesk@metalingua.com |
| **Mentor** | Reza Mentor | +989101234571 | mentor@metalingua.com |

#### Generating Demo OTP Codes

```bash
node scripts/generate-demo-otp.cjs
```

This displays current OTP codes for all test accounts (rotates every 30 minutes).

#### How Demo OTP Works

1. OTP codes rotate every 30 minutes based on time slices
2. Uses HMAC-SHA256 with `DEMO_TEST_SECRET`
3. Only works for whitelisted test phone numbers
4. Real users still receive actual SMS OTPs

### Seeding Test Users

For fresh deployments, seed test users:

```bash
curl -X POST http://localhost:5000/api/seed-test-users
```

### Seeding LinguaQuest Lessons

```bash
curl -X POST http://localhost:5000/api/content-bank/seed-lessons
```

---

## 22. Troubleshooting Guide

### Common Issues

#### Cannot Login

**Symptoms**: OTP not received or login fails

**Solutions**:
1. Check phone format (use 09XXXXXXXXX or +989XXXXXXXXX)
2. Verify Kavenegar API key is configured
3. Check rate limiting (5 requests per 15 min)
4. For test accounts, use demo OTP codes

#### Database Connection Failed

**Symptoms**: "Cannot connect to database" error

**Solutions**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Run migrations
npm run db:push
```

#### CallerN Video Not Connecting

**Symptoms**: Video calls fail to establish

**Solutions**:
1. Check browser permissions (camera/microphone)
2. Verify TURN server is running
3. Check firewall allows WebRTC ports
4. Try different browser (Chrome recommended)

#### AI Services Not Responding

**Symptoms**: AI features not working

**Solutions**:
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama
sudo systemctl restart ollama

# Verify model is downloaded
ollama list
```

#### Payment Processing Failed

**Symptoms**: Shetab payments not completing

**Solutions**:
1. Verify merchant credentials
2. Check callback URL is accessible
3. Ensure HTTPS is configured
4. Review transaction logs

### Debug Endpoints

```
GET /api/debug-demo-mode    # Check demo mode status
GET /api/health             # System health check
GET /api/ai/status          # AI provider status
```

### Log Files

- **Application Logs**: `./logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **PM2 Logs**: `pm2 logs`

---

## 23. API Reference Summary

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/phone/request-otp-login` | POST | Request login OTP |
| `/api/auth/phone/request-otp-signup` | POST | Request signup OTP |
| `/api/auth/phone/verify-otp-login` | POST | Verify login OTP |
| `/api/auth/phone/verify-otp-signup` | POST | Verify signup OTP |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET | List users (admin) |
| `/api/users/:id` | GET | Get user profile |
| `/api/users/:id` | PUT | Update user |
| `/api/users/:id` | DELETE | Delete user (admin) |

### Courses

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses` | GET | List courses |
| `/api/courses` | POST | Create course |
| `/api/courses/:id` | GET | Get course |
| `/api/courses/:id` | PUT | Update course |
| `/api/courses/:id/enroll` | POST | Enroll student |

### CallerN

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/callern/teachers/available` | GET | List online teachers |
| `/api/callern/sessions` | POST | Start session |
| `/api/callern/sessions/:id` | GET | Get session |
| `/api/callern/recordings/:id` | GET | Get recording |

### LinguaQuest

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/linguaquest/lessons` | GET | List lessons |
| `/api/linguaquest/lessons/:id` | GET | Get lesson |
| `/api/linguaquest/progress` | POST | Save progress |

### Leads

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads` | GET | List leads |
| `/api/leads` | POST | Create lead |
| `/api/leads/:id` | PUT | Update lead |
| `/api/leads/:id/stage` | PUT | Change stage |

### Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payment/shetab/initiate` | POST | Start payment |
| `/api/payment/shetab/callback` | POST | Receive confirmation |
| `/api/wallet/balance` | GET | Get balance |
| `/api/wallet/transactions` | GET | Transaction history |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | December 2025 | Comprehensive rewrite with all features |
| 1.5 | November 2025 | Added phone OTP, Call Center workflow |
| 1.0 | October 2025 | Initial release |

---

**Meta Lingua Platform**  
*AI-Enhanced Multilingual Language Learning & Institute Management*  
*Designed for Self-Hosting in Iran with Zero External Dependencies*
