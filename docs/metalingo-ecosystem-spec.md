# MetaLingo — System-Level Ecosystem Specification

> Version 1.0 | April 2026  
> Audience: Product designers, developers, marketers, AI systems

---

## Preface

MetaLingo is not a "language course platform." It is a **multi-layered learning ecosystem** where education, AI, marketplace mechanics, CRM, and engagement systems are tightly coupled — each layer feeding the others. This document maps how those layers connect, how value flows through them, and what emerges from their combination.

---

## 1. Ecosystem Overview — Layer Map

### 1.1 Learning Layer

**What it does:** Delivers structured language education across four modalities:

- **Group Courses** (IELTS, TOEFL, GRE, PTE, Conversation): Admin-created courses with fixed curricula, session schedules, and attendance tracking. Students enroll via wallet or payment gateway.
- **Private 1:1 Sessions** (Session Bundles): Admin creates bundles (e.g., "10 × 60-min sessions, 90-day validity"). Call Center or Front Desk assigns a teacher and creates a package for the student. Sessions are logged with notes and AI analysis.
- **In-Person / Physical Classes**: Physical classroom attendance tracked via QR-code check-in or manual attendance. Same session schema as online classes.
- **Special Classes**: Limited-seat, discounted classes published by admin — creates urgency via max-enrollment cap and discount percentage.
- **CallerN On-Demand Sessions**: Separate marketplace layer (see 1.2).

**How it connects to other layers:**

- Placement test output (CEFR level) determines which courses a student is shown (**AI Layer → Learning Layer**)
- Enrollment triggers CRM lead advancement (**Learning Layer → CRM Layer**)
- Completed sessions trigger XP awards (**Learning Layer → Engagement Layer**)
- Group class schedules published to public website (**Learning Layer → Content Layer**)

---

### 1.2 On-Demand Layer — CallerN

**What it does:** A marketplace for live 1:1 video tutoring with zero scheduling friction:

- Teachers set three-state presence: **available / teaching / offline** — visible in real-time
- Students browse available teachers, view profiles, and start a WebRTC video session instantly
- Sessions are 10–60 minutes; no advance booking required
- AI Supervisor runs during each session (pronunciation analysis, grammar detection, speech-flow assistance)
- Post-session: recording uploaded, AI generates a written feedback report
- Teacher followers: students can follow a teacher and receive push notifications when they come online

**Session Bundle Integration:** Students purchase CallerN session bundles (pre-paid packages) managed by the same session-bundle system used for private classes.

**How it connects:**

- Session outcomes feed the **AI Layer** (analytics, next-session content recommendations)
- Completion triggers **Engagement Layer** (XP, streaks, achievements)
- Teacher online status drives **Content Layer** (homepage shows live teacher counts)
- CallerN is the primary **upsell path** for students who finished group courses (**CRM Layer**)

---

### 1.3 AI Layer

**What it does:** AI operates in two distinct modes — real-time (during interaction) and analytical (after interaction).

#### Real-Time AI (During Interaction)

| Trigger | System Behavior | UI Appearance |
|---------|----------------|---------------|
| Student hesitates > 3 seconds while speaking | Lexi AI offers a vocabulary hint or reformulation suggestion | Floating card; student can accept, dismiss, or ask for more |
| Mispronunciation detected | Lexi flags the word with a phonetic overlay | Non-blocking inline highlight; does not interrupt flow |
| Grammar error in written input | Inline suggestion with explanation | Highlighted text with tooltip; student accepts in one tap |
| CallerN session ongoing | AI Supervisor silently analyses speech | Stats panel visible to teacher; optional student-visible mode |

#### Analytical AI (After Interaction)

| Event | What AI Produces | Where It Appears |
|-------|-----------------|-----------------|
| CallerN session ends | Pronunciation score, grammar accuracy, vocabulary range, fluency metric | Student "Session Report" + teacher dashboard |
| LinguaQuest lesson completed | Skill gap identification, recommended next lesson type | Student dashboard recommendations |
| MST Placement Test completed | CEFR level (A1–C2), per-skill sub-scores, recommended course | Onboarding screen + admin CRM record |
| Weekly AI review | Trend analysis (improving / plateauing / regressing) | Student progress timeline |

#### AI Across the Ecosystem

- **Placement (MST/IRT):** 3-Parameter Logistic IRT model, adaptive item selection, CEFR theta mapping (A1=−2.0 through C2=+3.0). Personalises course recommendations from day one.
- **Content Generation (BullMQ pipeline):** Admin triggers AI-generated blog posts via Ollama; output enters approval queue (draft → pending_admin_review → published); SEO fields auto-filled; sitemap regenerated.
- **CRM / Sales (Lexi Telegram Bot):** Trained on all platform features; responds 24/7, answers program questions, captures lead phone numbers into CRM.
- **LinguaQuest AI:** Generates game-style lessons on demand — vocabulary battles, speaking challenges, grammar puzzles — personalised to student's current sub-level.

---

### 1.4 CRM / Sales Layer

**What it does:** Manages the full lifecycle from anonymous visitor to enrolled paying student.

#### Lead Capture Mechanisms

| Source | How Lead Is Created |
|--------|-------------------|
| Guest Placement Test | Student completes free test → auto-create lead with CEFR result |
| Self-registration | OTP phone verification → lead with `source='self_registration'` |
| Visitor Chat Widget | Guest submits contact info during chat → lead created |
| Telegram AI Sales Bot | Bot captures phone number → lead created |
| Scraped Leads | External scraper → qualification score → auto-promotion if score ≥ threshold |
| Call Center Manual | Agent creates lead after outbound call |
| Referral | Referred user registers → lead tagged with referrer |

#### 24-Stage Pipeline

Leads move through a validated pipeline: `new_lead → contacted → interested → consultation_scheduled → consultation_done → offer_sent → negotiation → verbal_commitment → payment_pending → enrolled → ...`

Each transition: validated by `LEAD_STAGE_TRANSITIONS` map (illegal jumps rejected), full field snapshot written to `lead_activity_log`, key events trigger automatic SMS via Kavenegar.

#### Consultation → Enrollment Flow

1. Lead reaches `consultation_scheduled` → Front Desk creates calendar event
2. After consultation: agent updates to `consultation_done`, attaches notes
3. Offer sent → student makes payment (wallet top-up or payment gateway)
4. `advanceLeadAfterPayment()` automatically transitions lead to `enrolled` and writes activity log
5. Student sees `/welcome` onboarding screen (teacher wall, placement CTA, course teaser, LinguaQuest preview, certificate mockup)

---

### 1.5 Engagement Layer

**What it does:** Drives retention, word-of-mouth, and repeat sessions through structured reward mechanics.

- **XP & Level System:** Every completed lesson, session, or daily challenge awards XP; maps to levels; level-up triggers achievement badge
- **Achievements:** 20+ predefined badges (e.g., "First CallerN session", "7-day streak", "IELTS preparation started")
- **Daily Challenges:** One micro-challenge per day (5-minute vocabulary, pronunciation drill, grammar quiz); completion awards bonus XP; streak breaks trigger SMS nudge
- **Referral System:** Unique referral link per student; referrer receives wallet credit when referred user enrolls and pays
- **LinguaQuest:** Game-mode learning with narrative progression, boss battles, collectible vocabulary sets; leaderboard (global, level-based, nearby-rank)
- **Reviews:** Star rating + written review after course completion (moderated); appear on public course landing pages

---

### 1.6 Content / SEO Layer

**What it does:** Drives organic discovery and supports sales through structured content.

- **CMS Page Builder:** Flexible section-based marketing pages published at `/p/:slug`. Subsystem includes:
  - 7 section types: hero, features, rich text, CTA, testimonials, stats, spacer
  - 9 animation capabilities per section via GSAP ScrollTrigger: entrance transitions (fade/slide/scale), sticky pinning, parallax, text reveal (word-by-word/blur/fade-up), scroll snap, blur-on-enter, and section theming
  - Global page settings: smooth scroll (desktop-only) and progress bar
  - Content stored in `cms_page_sections.content` (jsonb); animation config in `cms_page_sections.styles` (jsonb)
  - Note: this replaces the previous `admin_settings.homepageContent` approach for new marketing pages — the existing homepage editor and landing pages editor remain unchanged
- **Blog:** AI-generated or manually written posts; each auto-gets `metaTitle`, `metaDescription`, `keywords`, `slug`; sitemap.xml auto-regenerated on publish
- **Video Gallery:** Curated video content; categorised by program (IELTS, TOEFL, etc.)
- **Course Landing Pages:** Per-program pages (`/courses/ielts`, `/courses/toefl`, etc.) with dynamic content, testimonials, enrollment CTA
- **Expert Teachers Page:** Public directory of available teachers with profiles, languages, ratings
- **Curriculum Hub:** Public course catalogue organised by curriculum categories
- **Books E-commerce:** Textbook catalog with shopping cart, PDF download after purchase
- **Public Stats:** Live counters (active students, teachers, courses) on homepage hero

---

## 2. Value Flow & Business Logic

### Complete Conversion Flow

```
[Organic / Social / Referral]
        ↓
  Anonymous Visitor
        ↓
  Public Website → Blog / Course Landing / CallerN Page
        ↓
  Free Placement Test (MST/IRT) ← CEFR result generated instantly
        ↓
  CRM Lead created automatically
        ↓
  Lexi AI Bot (Telegram) / Visitor Chat / Call Center follows up
        ↓
  Consultation Scheduled (Front Desk)
        ↓
  Offer: Group Course OR Private Bundle OR CallerN Package
        ↓
  Payment (Shetab gateway / Wallet top-up)
        ↓
  Lead auto-advanced to "enrolled"
        ↓
  /welcome onboarding screen
        ↓
  Learning begins (courses + CallerN + LinguaQuest)
        ↓
  Engagement loop (XP, streaks, daily challenges, leaderboard)
        ↓
  Session completion → AI report → recommended upgrade
        ↓
  Upsell: Private sessions / More CallerN bundles / Higher-level course
        ↓
  Certificate issued on completion → shareable → organic referral
```

### Revenue Streams

1. **Group course enrollment fees** (per-course payment or wallet)
2. **Private session bundles** (pre-paid session packages)
3. **CallerN session packages** (on-demand tutoring credits)
4. **Books e-commerce** (PDF textbook sales with cart + checkout)
5. **Special class enrollments** (limited-seat discounted classes)
6. **Wallet top-ups** (students deposit balance, spend across products)
7. **Referral credits** (generate loyalty, reduce customer acquisition cost)

---

## 3. User Journeys

### A. IELTS Student (High-Intent)

| Step | What Happens | Systems Involved |
|------|-------------|-----------------|
| Lands on /courses/ielts | Sees exam-specific content, band scores, testimonials | Content Layer |
| Takes free placement test | 20–40 adaptive questions; CEFR + per-skill result in < 15 min | AI Layer (MST/IRT) |
| CRM lead auto-created | Lead tagged with CEFR level and `source='placement_test'` | CRM Layer |
| Lexi Telegram bot contacts | "Your B1 score means you're ready for IELTS Preparation track" | AI Layer (Sales Bot) |
| Books consultation | Front Desk schedules a 20-min video call | CRM Layer |
| Consultation outcome | Agent recommends 3-month IELTS course + 10-session CallerN bundle | Learning Layer |
| Payment | Wallet top-up via Shetab; `advanceLeadAfterPayment()` fires | Payment + CRM Layer |
| Onboarding | /welcome shows teacher profiles, first lesson preview, LinguaQuest intro | Engagement Layer |
| Weekly progress | AI generates weekly report; streak reminder SMS if daily challenge missed | AI + Engagement Layer |
| 3-month mark | Certificate issued; system prompts: "Start IELTS Advanced course?" | Learning + CRM Layer |

### B. Casual Learner (Discovery → Retention)

| Step | What Happens |
|------|-------------|
| Finds blog post via SEO | Reads "How to improve English speaking fluency in 30 days" |
| Visitor chat widget opens | Asks a question; contact info captured |
| Explores LinguaQuest | Plays 3 lessons without registering (guest mode) |
| Upgrade prompt | "Log in to save progress & unlock XP" |
| Registers via phone OTP | Conversion to registered user |
| Placement test taken | CEFR B1 result |
| Recommended: Conversation course | Low-commitment, affordable, relevant |
| Enrolls | Wallet payment |
| CallerN upsell at week 3 | "You've had 3 classes — practice live speaking with a tutor" |

### C. CallerN User Journey

| Step | What Happens | Systems |
|------|-------------|---------|
| Enters /services/callern | Sees live teacher availability (real-time presence) | Content + Learning |
| Browses teacher profiles | Sees rating, intro video, languages, availability hours | Content Layer |
| Registers / logs in | Phone OTP | Auth |
| Purchases a session bundle | Wallet charge | Payment Layer |
| Starts a session | Clicks "Call Now" → WebRTC connection established | Learning Layer |
| During session | AI Supervisor analyses speech; teacher sees live stats | AI Layer |
| Session ends | Recording uploaded; AI generates report in ~2 minutes | AI Layer |
| Student reads report | Pronunciation score, top 3 improvement areas, next session type | AI Layer |
| Next session | Adaptive content pre-loaded for teacher (vocabulary, grammar drills) | AI + Learning Layer |

---

## 4. Learning System (Deep)

### Personalisation Path

```
New Student
    ↓
MST Placement Test (adaptive, IRT-based)
    ↓
CEFR Level Assigned (A1–C2) + Per-Skill Scores
    ↓
Sub-Level Mapped (e.g., B1.2 → specific curriculum module)
    ↓
Recommended Courses + Session Bundle Type Shown
    ↓
CallerN Content Pre-Seeded (vocabulary set, grammar focus, conversation topic)
    ↓
Weekly AI Review → Level Re-Assessment if plateau detected
```

### Modality Comparison

| Dimension | Group Course | Private Bundle | CallerN On-Demand |
|-----------|-------------|----------------|------------------|
| Schedule | Fixed (admin-set) | Agreed with teacher | No schedule needed |
| Duration | 3–6 months | Per bundle validity | Per session (10–60 min) |
| Cost | Lower per hour | Mid-range | Premium (flexibility) |
| Personalization | Low | High | Highest |
| Best for | Structured learners | Goal-focused | Conversational / spontaneous |
| AI involvement | Analytical (post-class) | Analytical + coaching | Real-time + analytical |

### Curriculum Sub-Level System

- Curriculum organised into levels (A1.1, A1.2, A2.1…C2.2)
- Each level has associated courses, CallerN bundle constraints, and LinguaQuest content
- Session bundles can restrict: "Only available for students between B1.1 and B2.2"
- When a student is assigned a sub-level after placement, they see only eligible content

---

## 5. CallerN — Integrated System View

CallerN is **not a standalone tutoring service**. It is embedded into the learning progression:

1. **Entry:** Recommended after group course completion OR as standalone package
2. **Session prep:** AI pre-generates vocabulary set and conversation topic based on student's last session results and current sub-level
3. **During session:** Teacher sees student briefing (name, CEFR level, focus areas from last AI report, teacher notes)
4. **AI Supervisor:** Runs phoneme analysis, grammar detection, fluency scoring — silently. Teacher sees a live stats panel.
5. **Post-session:** AI generates a 1-page feedback report (pronunciation %, grammar accuracy, vocabulary range, 3 improvement areas)
6. **Progression hook:** Report includes "Your next session should focus on [X]" — pre-populated in next session's adaptive content
7. **Retention hook:** Teacher follower system — student follows favourite teachers, receives push notification when they come online

---

## 6. AI System — Full Breakdown

### A. Real-Time AI During CallerN Sessions

**Technology:** Faster-Whisper (self-hosted speech recognition) + custom phoneme analysis + OpenAI/Ollama for NLU

**Trigger logic:**
- Speech-to-text runs continuously with a 2-second rolling buffer
- Hesitation > 3 seconds → vocabulary hint triggered
- Phoneme mismatch score > threshold → pronunciation flag (non-blocking)
- Grammar error in transcript → suggestion queued (shown after sentence ends, not mid-speech)

**User control:**
- Student can enable/disable "Lexi hints" toggle in session settings
- Teacher can choose "Supervisor mode: student-visible" or "teacher-only"

### B. Analytical AI — Post-Session

Runs as a background job after recording upload:
1. Full transcript generated (Whisper)
2. Pronunciation scored per word (phoneme comparison)
3. Grammar pass (rule-based + LLM for nuance)
4. Vocabulary range scored (CEFR word-level analysis)
5. Fluency: words-per-minute, pause frequency, filler-word count
6. Report structured and stored; student notified via in-app notification

### C. Content Generation Pipeline (Admin)

```
Admin triggers content generation
    ↓
BullMQ job queued (provider: Ollama / OpenAI)
    ↓
Prompt template selected from DB library
    ↓
AI generates: title, body, metaTitle, metaDescription, keywords, slug
    ↓
Status: draft → pending_admin_review
    ↓
Admin approves in dashboard
    ↓
Status: published → sitemap.xml regenerated
    ↓
Social media copy generated (Facebook, Instagram, LinkedIn, Twitter)
```

### D. MST Placement Test (IRT Model)

- Item bank: questions tagged with difficulty (b), discrimination (a), guessing (c) parameters
- Adaptive selection: next item chosen to maximise information at current theta estimate
- Session ends when SE(theta) < 0.3 or after 40 items
- CEFR mapping: theta −2.0=A1, −1.0=A2, 0.0=B1, +1.0=B2, +2.0=C1, +3.0=C2
- Result stored in student record; used for course recommendation and CallerN content seeding

---

## 7. CRM & Sales System — Complete Map

### Pipeline Stages (24-stage, validated)

`new_lead → contacted → interested → consultation_scheduled → consultation_done → offer_sent → negotiation → verbal_commitment → payment_pending → enrolled → orientation → active → ...`

Each stage:
- Transition validated server-side (`LEAD_STAGE_TRANSITIONS` map — illegal jumps rejected with 400)
- Full field snapshot written to `lead_activity_log`
- Key transitions trigger automatic Kavenegar SMS

### Product Design Supporting Sales

- **Public placement test** = highest-intent lead magnet (user invests 15 minutes = high commitment signal)
- **CallerN live teacher counter** on homepage = social proof + urgency
- **/welcome onboarding** = immediate value demonstration before buyer's remorse
- **Certificate preview on /welcome** = future-pacing (student sees goal before starting)
- **Referral dashboard** = distributed sales force with zero salary cost

---

## 8. Engagement Systems

### Combined Effect (Not in Isolation)

| System | Immediate Effect | Long-Term Effect |
|--------|----------------|-----------------|
| XP / Levels | Dopamine from progress | Identity as "a learner" |
| Streaks | Daily habit formation | Churn reduction |
| Leaderboard | Competitive pressure | Community formation |
| Achievements | Milestone celebration | Completion rate increase |
| Referrals | Viral growth | CAC reduction |
| Reviews | Trust signal | Conversion rate increase |
| Certificates | Goal realisation | Upsell trigger |

**Critical connection:** XP is awarded for EVERY meaningful action across every layer. This means every part of the ecosystem feeds the engagement layer, and the engagement layer motivates further engagement in every part. The system compounds.

---

## 9. Micro-Interactions

### 9.1 User Hesitates While Speaking (CallerN)

- **Trigger:** 3+ seconds of silence after student began a sentence
- **System:** Whisper detects silence; NLP determines sentence was incomplete
- **UI:** Lexi AI floating card: "Did you mean to say: [vocabulary suggestion]?" — 3 options: Accept / Try differently / Dismiss
- **UX:** Non-threatening; positioned to not block video feed; auto-dismisses after 8 seconds if ignored

### 9.2 User Completes a Session

- **Trigger:** WebRTC call ended and recording saved
- **System:** AI job queued; immediate XP awarded; streak counter incremented
- **UI:** Session completion screen — XP animation, streak badge, "Your report will be ready in ~2 minutes"
- **UX:** Celebration moment; report arrival notified via in-app notification

### 9.3 User Receives AI Feedback Report

- **Trigger:** AI analysis job completes (~2 minutes post-session)
- **System:** Notification sent; report stored; next-session content pre-seeded
- **UI:** Card-based report with pronunciation wheel, grammar accuracy bar, vocabulary tier chart, 3 improvement areas, recommended next session type
- **UX:** Feels like a personal coach letter, not a score sheet

### 9.4 User Prompted to Upgrade

- **Trigger:** Group course > 50% complete OR 5+ CallerN sessions completed
- **System:** Rule-based check after session completion; CRM lead advanced to "upsell_opportunity" stage
- **UI:** Non-intrusive banner: "Ready for more? Students at your level average 2× improvement with a private bundle"
- **UX:** Backed by real data (student's own progress chart); no pressure, clear value

### 9.5 User Receives SMS

- **Trigger:** Lead stage transition, streak at risk, payment confirmation, session reminder
- **System:** Kavenegar API; triggered server-side only
- **Content:** Stage-specific Farsi template with student's name and specific details
- **UX:** Feels personalised ("رضا عزیز، جلسه‌ات با استاد سارا فردا ساعت ۱۰ صبح است")

---

## 10. Key Differentiators

### 10.1 Placement-to-Enrollment in One Session
Most platforms require manual consultations. MetaLingo's IRT-based placement test auto-generates a CEFR result, auto-creates a CRM lead, and pre-populates the consultation with the student's exact weakness profile. The sales agent walks in knowing what the student needs.

### 10.2 AI During Live Sessions, Not Just After
Platforms like Cambly or italki have no AI during sessions. MetaLingo's AI Supervisor runs in real-time — the teacher sees the student's pronunciation score updating live; the student gets a hint card when they hesitate. The session is simultaneously human and AI.

### 10.3 CRM Built Into the Learning Product
Most platforms treat CRM as a separate tool. In MetaLingo, every student action (completing a lesson, buying a bundle, taking a placement test) writes to the CRM automatically. Sales agents see actual learning behaviour, not just a contact form submission.

### 10.4 Every Layer Feeds Every Other Layer

```
CallerN session ends
    → AI report generated
    → CRM upsell trigger fired
    → Engagement XP awarded
    → Leaderboard rank updated
    → SMS streak reminder scheduled
    → Next session adaptive content pre-loaded
```

No layer is isolated. Value compounds across the system.

### 10.5 Self-Hosted by Design (Iranian Market)
Zero dependency on Google, AWS, or Western APIs in production: Ollama for AI, Kavenegar for SMS, Shetab for payments, coturn for WebRTC, self-hosted Whisper for STT. This is a strategic moat — no competitor can offer the same stack within Iranian infrastructure constraints.

### 10.6 Institute-Grade Operations
MetaLingo is not just student-facing. It includes:
- HR module with KPI tracking per role (Teacher, Call Center, Mentor, Supervisor, Front Desk)
- Teacher payment calculation per session
- VoIP integration (Issabel PBX via AMI on port 5038)
- SMS marketing campaigns
- Social media publishing
- Lead scraping with auto-promotion pipeline
- Full 24-stage CRM pipeline

It replaces 5–6 separate SaaS tools for a language institute.

---

## Appendix: System Architecture Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 18 + Vite + Tailwind + shadcn/ui | Multi-role dashboard + public website |
| Backend | Express.js + TypeScript (ESM) | 64 route files, RESTful API |
| Database | PostgreSQL + Drizzle ORM | 15 domain schema files |
| Auth | JWT + OTP (Kavenegar SMS) | Phone-only authentication |
| AI (prod) | Ollama (Qwen3) + Faster-Whisper | Local AI, no external dependency |
| AI (dev/fallback) | OpenAI API | Development and testing |
| Queue | BullMQ + Redis | Content generation, async AI jobs |
| Video | WebRTC + self-hosted TURN (coturn) | CallerN live sessions |
| Payment | Shetab (primary), Zarinpal, IDPay, Zibal | Iranian payment gateways |
| SMS | Kavenegar | OTP + CRM notifications |
| VoIP | Issabel PBX via AMI (port 5038) | Call center integration |
| Storage | Local filesystem (prod) / Replit (dev) | Recordings, PDFs, media |
| Deployment | Docker Compose + Nginx | Self-hosted on Iranian server |
| i18n | react-i18next | Farsi (default) + English + Arabic + RTL |

---

*This document is a living specification. Update it when new systems are added or existing flows change.*
