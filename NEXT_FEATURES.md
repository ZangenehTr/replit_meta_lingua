# Meta Lingua Platform - Next Features Roadmap

## Priority 1: LinguaQuest Enhancement (IMMEDIATE)

### 1.1 Persian/English i18n for LinguaQuest
**Status:** Ready to implement  
**Effort:** 2-3 hours  
**Impact:** High - Makes platform accessible to Iranian users

**Tasks:**
- Create translation files: `client/src/i18n/locales/fa/linguaquest.json` and `client/src/i18n/locales/en/linguaquest.json`
- Add translations for all UI strings in LinguaQuestHome.tsx and LinguaQuestLesson.tsx
- Translate lesson titles, instructions, feedback messages
- Add RTL support for Persian game steps
- Test language switching within active lessons

**Key Translations Needed:**
- Lesson difficulty levels (Beginner → مبتدی, Intermediate → متوسط, Advanced → پیشرفته)
- Activity instructions ("Click to start" → "برای شروع کلیک کنید")
- Feedback messages ("Great! Moving forward..." → "عالی! بریم جلو...")
- Completion screen ("Lesson Complete!" → "درس تمام شد!")

### 1.2 Audio Integration with Self-Hosted TTS
**Status:** Architecture ready, needs implementation  
**Effort:** 4-6 hours  
**Impact:** High - Enables full audio learning experience

**Tasks:**
- Integrate Microsoft Edge TTS for Persian/English audio generation
- Create audio caching service to store generated audio files locally
- Update VocabularyStep to use real audio playback
- Add pronunciation feedback using audio comparison
- Implement offline audio fallback (pre-generated audio files)

**Technical Approach:**
```typescript
// server/services/tts-service.ts
export async function generateAudio(text: string, language: 'en' | 'fa') {
  const voice = language === 'fa' ? 'fa-IR-DilaraNeural' : 'en-US-JennyNeural';
  // Generate audio using edge-tts
  // Cache to local filesystem
  // Return URL: /audio/cached/{hash}.mp3
}
```

### 1.3 AI-Powered Lesson Generator using Ollama
**Status:** Ollama configured, needs service implementation  
**Effort:** 6-8 hours  
**Impact:** Very High - Enables infinite lesson creation

**Tasks:**
- Create AI service to generate lesson content using Ollama
- Build lesson template system for different topics (travel, business, medical, etc.)
- Implement vocabulary extraction and image URL generation
- Add admin interface for AI lesson generation
- Create lesson review/approval workflow

**Use Cases:**
- Teacher enters topic: "Restaurant Ordering in Paris"
- AI generates 6-step lesson with vocabulary, dialogues, exercises
- Teacher reviews, edits, publishes to student pool
- Students access new lessons immediately

### 1.4 Progress Dashboard & Analytics
**Status:** Database ready, needs UI  
**Effort:** 4-5 hours  
**Impact:** Medium - Provides user engagement insights

**Tasks:**
- Create student progress dashboard showing completed lessons, XP earned, time spent
- Add lesson completion graphs (by day/week/month)
- Implement achievement badges (First Lesson, 5-Day Streak, Perfect Score, etc.)
- Build teacher analytics showing popular lessons, average scores, completion rates
- Add export functionality for progress reports (PDF/CSV)

---

## Priority 2: Social Media Integration (HIGH VALUE)

### 2.1 9-Platform Social Media Content Scraper
**Status:** Planned, architecture ready  
**Effort:** 10-12 hours  
**Impact:** Very High - Core revenue feature

**Platforms to Support:**
1. Instagram (posts, stories, reels)
2. Twitter/X (tweets, threads)
3. Facebook (posts, groups)
4. LinkedIn (posts, articles)
5. YouTube (videos, comments)
6. TikTok (videos, trends)
7. Telegram (channels, groups)
8. WhatsApp Business (status updates)
9. Pinterest (pins, boards)

**Technical Implementation:**
```typescript
// Database schema
social_media_posts {
  id: serial primary key
  platform: varchar (instagram, twitter, etc.)
  post_url: text
  content: text
  media_urls: text[] array
  author: varchar
  engagement_metrics: jsonb {likes, comments, shares}
  scraped_at: timestamp
  category: varchar (educational, promotional, viral)
  language: varchar (fa, en, ar)
}

// Service architecture
- Puppeteer-based scraping (no external APIs)
- Rate limiting per platform
- Proxy rotation for Iranian hosting
- Content categorization using Ollama AI
- Duplicate detection and deduplication
```

**Key Features:**
- Scheduled scraping (hourly/daily per platform)
- Keyword-based filtering (language learning, education, etc.)
- Sentiment analysis using Ollama
- Content trending detection
- Multi-language support (Persian, English, Arabic)

### 2.2 AI-Powered 24/7 Sales/Marketing Agent
**Status:** Ollama ready, needs chatbot implementation  
**Effort:** 8-10 hours  
**Impact:** Very High - Automated lead generation

**Features:**
- WhatsApp/Telegram bot responding to inquiries 24/7
- Multi-language support (Persian, English, Arabic)
- Course recommendations based on user questions
- Automatic lead capture to CRM (existing database)
- FAQ handling using RAG (Retrieval-Augmented Generation) with Ollama
- Escalation to human agents for complex queries

**Technical Stack:**
- Telegram Bot API (no external dependencies)
- WhatsApp Business API (local hosting)
- Ollama for conversational AI (already configured)
- Vector database for RAG (pgvector extension in PostgreSQL)
- Response templates in Persian/English/Arabic

**Conversation Flow:**
```
User: سلام، میخوام انگلیسی یاد بگیرم (Hello, I want to learn English)
Bot: سلام! خوشحالم که میخوای انگلیسی یاد بگیری. سطح فعلی زبان انگلیسیت چطوره؟
     (Hello! Glad you want to learn English. What's your current level?)
User: مبتدی (Beginner)
Bot: عالیه! ما دوره مبتدی داریم که شامل... (Great! We have beginner courses including...)
     [Sends course links, pricing, schedule]
```

---

## Priority 3: Book E-Commerce with AI Descriptions

### 3.1 Digital Bookstore Implementation
**Status:** Planned  
**Effort:** 8-10 hours  
**Impact:** High - New revenue stream

**Database Schema:**
```typescript
books {
  id: serial primary key
  title: varchar
  author: varchar
  isbn: varchar unique
  price_irr: integer
  language: varchar (en, fa, ar)
  category: varchar (grammar, vocabulary, literature, etc.)
  level: varchar (A1, A2, B1, B2, C1, C2)
  cover_image_url: text
  pdf_file_path: text // Local filesystem storage
  description: text // AI-generated
  sample_pages: jsonb // First 10 pages preview
  purchase_count: integer
  rating_avg: decimal
}

book_purchases {
  id: serial primary key
  user_id: integer
  book_id: integer
  purchase_date: timestamp
  price_paid: integer
  download_token: varchar unique
  download_count: integer
  expires_at: timestamp
}
```

**Features:**
- AI-generated Persian/English descriptions using Ollama
- Book recommendations based on user level and progress
- Sample page previews (first 10 pages)
- Wallet integration for purchases
- Offline PDF download with watermarking
- Reading progress tracking

**AI Description Generator:**
```typescript
// Example: Input book metadata
const book = {
  title: "English Grammar in Use",
  author: "Raymond Murphy",
  level: "B1-B2"
};

// Ollama generates:
"این کتاب یکی از بهترین منابع برای یادگیری گرامر انگلیسی است. 
مناسب برای دانش‌آموزان سطح متوسط (B1-B2) که میخواهند گرامر رو 
به صورت عملی و کاربردی یاد بگیرند..."
```

---

## Priority 4: Calendar System (Persian/English/Arabic)

### 4.1 Multi-Calendar Support
**Status:** Partially implemented, needs expansion  
**Effort:** 6-8 hours  
**Impact:** Medium - Essential for Iranian users

**Features:**
- Persian (Jalali) calendar for Iranian students
- Gregorian calendar for international students
- Hijri calendar for Arabic-speaking students
- Automatic conversion between calendars
- Cultural holiday marking (Nowruz, Ramadan, etc.)
- Class scheduling with calendar preference
- Event notifications in user's preferred calendar

**Technical Implementation:**
```typescript
import jalaali from 'jalaali-js';

// Unified calendar service
export class CalendarService {
  convertDate(date: Date, to: 'jalali' | 'gregorian' | 'hijri') {
    if (to === 'jalali') {
      const j = jalaali.toJalaali(date);
      return `${j.jy}/${j.jm}/${j.jd}`;
    }
    // ... other conversions
  }
  
  getCulturalHolidays(calendar: string, year: number) {
    // Return holidays for specific calendar system
  }
}
```

**UI Components:**
- Calendar switcher in header (📅 شمسی | میلادی | هجری)
- Date picker with multi-calendar support
- Event reminders respecting cultural context

---

## Priority 5: Production Deployment Preparation

### 5.1 Self-Hosting Documentation
**Status:** Needs creation  
**Effort:** 4-5 hours  
**Impact:** Critical - Required for Iranian deployment

**Documents to Create:**
1. `SELF_HOSTING_GUIDE.md` (Persian + English)
   - System requirements (PostgreSQL 14+, Node 18+, Nginx)
   - Step-by-step installation for Ubuntu/Debian servers
   - Environment variables configuration
   - Ollama server setup for AI features
   - TURN/STUN server configuration for WebRTC
   - SMS gateway integration (Kavenegar)
   - Payment gateway setup (Shetab)

2. `DOCKER_DEPLOYMENT.md`
   - Dockerfile optimization
   - Docker Compose configuration
   - Volume management for media files
   - Database backup strategies
   - Nginx reverse proxy setup

3. `SECURITY_CHECKLIST.md`
   - SSL/TLS certificate installation (Let's Encrypt)
   - Firewall configuration (UFW)
   - PostgreSQL security hardening
   - Rate limiting and DDoS protection
   - Data encryption at rest

### 5.2 Database Migration to Self-Hosted PostgreSQL
**Status:** Schema ready, needs migration scripts  
**Effort:** 3-4 hours  
**Impact:** Critical

**Tasks:**
- Create database dump script from Neon
- Write import script for self-hosted PostgreSQL
- Add data validation checks
- Test complete migration on staging server
- Document rollback procedure

### 5.3 Monitoring & Logging Setup
**Status:** Basic logs exist, needs enhancement  
**Effort:** 5-6 hours  
**Impact:** High - Essential for production

**Tools (Self-Hosted):**
- PM2 for Node.js process management
- PostgreSQL query logging
- Custom dashboard for system health (CPU, memory, disk, DB connections)
- Error tracking (store in PostgreSQL, no external services)
- API response time monitoring

---

## Quick Wins (1-2 hours each)

### QW1: Fix SQL Syntax Warnings
- Review and fix SQL syntax errors in guest session queries
- Add proper error handling for database operations

### QW2: Add Lesson Search
- Implement search bar in LinguaQuest home
- Filter by difficulty, type, duration, keywords

### QW3: Export Progress Reports
- Add "Download Progress" button for students
- Generate PDF report with completed lessons, scores, time spent

### QW4: Lesson Favorites
- Add bookmark feature for lessons
- Create "My Favorites" section

### QW5: Dark Mode Toggle
- Implement system-wide dark mode
- Persist preference in localStorage
- Update all game components for dark mode support

---

## Long-Term Vision (3+ weeks)

### LTV1: Mobile Apps (React Native)
- Convert web app to React Native
- Offline lesson support
- Push notifications for class reminders
- App store deployment (Google Play, direct APK for Iran)

### LTV2: Live Class Integration
- Zoom-like live classroom (WebRTC-based)
- Screen sharing for teachers
- Virtual whiteboard
- Breakout rooms for group activities
- Session recording and playback

### LTV3: Content Marketplace
- Allow teachers to create and sell lessons
- Revenue sharing model
- Content review and quality control
- Student ratings and reviews

### LTV4: Gamification Expansion
- Global leaderboards
- Weekly challenges with prizes
- Multiplayer competitive games
- Team-based learning competitions

---

## Immediate Next Steps (Recommended Order)

1. **Persian i18n for LinguaQuest** (2-3 hours) - Quick win, high impact
2. **Fix SQL syntax warnings** (1 hour) - Clean up technical debt
3. **Audio integration with Edge TTS** (4-6 hours) - Complete core feature
4. **Social media scraper MVP** (10-12 hours) - New revenue stream
5. **Self-hosting documentation** (4-5 hours) - Prepare for production
6. **AI Sales Agent** (8-10 hours) - Automated lead generation
7. **Book e-commerce** (8-10 hours) - New revenue stream
8. **Database migration to self-hosted** (3-4 hours) - Production readiness

**Total Estimated Effort for Phase 1:** 40-55 hours (1-2 weeks)

---

## Success Metrics to Track

**LinguaQuest:**
- Daily active users (DAU)
- Lesson completion rate (target: >70%)
- Average session duration (target: >15 minutes)
- Retry rate (indicates difficulty - target: <30%)

**Social Media:**
- Posts scraped per day (target: 1,000+)
- Content categorization accuracy (target: >85%)
- Trending topic detection speed (target: <1 hour)

**AI Sales Agent:**
- Conversations handled per day (target: 50+)
- Lead conversion rate (target: >20%)
- Response accuracy (target: >90%)
- Escalation rate (target: <10%)

**Platform Overall:**
- New student registrations per week
- Course enrollment rate
- Revenue per student (RPS)
- Student retention (90-day active rate)

---

## Iranian Production Checklist ✅

Before deploying to Iranian hosting:
- [ ] All external dependencies removed
- [ ] Ollama server configured and tested
- [ ] Kavenegar SMS integration tested
- [ ] Shetab payment gateway integrated
- [ ] Self-hosted TURN/STUN servers operational
- [ ] Edge TTS configured for Persian voices
- [ ] All fonts self-hosted (no Google Fonts)
- [ ] Database migrated to self-hosted PostgreSQL
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Backup scripts automated
- [ ] Monitoring dashboard deployed
- [ ] Load testing completed (target: 1,000 concurrent users)
- [ ] Security audit completed
- [ ] Persian i18n 100% complete
- [ ] Documentation translated to Persian
