# Meta Lingua Platform - Complete Feature Guide

## Overview

Meta Lingua is a comprehensive AI-enhanced multilingual language learning and institute management platform designed for self-hosting in Iran with zero external dependencies. This document provides detailed explanations of all platform features and capabilities.

---

## 1. Authentication & Authorization System

### Phone-Only OTP Authentication

Meta Lingua uses a secure phone-based authentication system optimized for the Iranian market. Users enter their phone number in either local format (09XXXXXXXXX) or international format (+989XXXXXXXXX), and the system automatically normalizes it to the standard +98XXXXXXXXXX format for consistent storage and lookup.

When a user requests to log in or sign up, a 6-digit one-time password (OTP) is generated and sent via SMS through the Kavenegar service. The system includes an IP-based fallback mechanism (46.102.138.125) to ensure reliable delivery within Iranian network infrastructure.

**Security Features:**
- Rate limiting prevents abuse by restricting users to 5 OTP requests per phone number within a 15-minute window
- A 90-second cooldown between resend requests prevents spam
- OTP codes expire after 10 minutes for security
- For testing and demonstrations, a demo mode generates predictable OTP codes for whitelisted test accounts using HMAC-SHA256 with 30-minute rotation

### JWT Token Management

The platform uses JSON Web Tokens (JWT) for secure session management. When a user successfully authenticates, they receive two tokens:

- **Access Token**: A short-lived token (24-hour expiry) used for API authentication. This token is sent with every request to protected endpoints.
- **Refresh Token**: A longer-lived token (7-day expiry) used to obtain new access tokens without requiring re-authentication.

The system automatically handles token refresh when access tokens expire, providing a seamless user experience. Legacy password authentication is still supported for backward compatibility, using bcrypt for secure password hashing.

### User Roles

Meta Lingua implements a comprehensive role-based access control (RBAC) system with eight distinct user roles:

1. **Admin (مدیر سیستم)**: Full system administrators with access to all features, settings, and user management. Admins can configure the platform, manage other users, view all data, and modify system settings.

2. **Teacher (معلم)**: Instructors who deliver lessons, manage their classes, grade assignments, and participate in CallerN video tutoring sessions. Teachers have access to their assigned courses, student lists, and teaching tools.

3. **Mentor (منتور)**: Academic advisors who monitor student progress, provide guidance, and help students navigate their learning journey. Mentors can view student analytics, set goals, and communicate with their assigned mentees.

4. **Student (دانش‌آموز)**: Learners who enroll in courses, attend classes, complete assignments, and participate in learning activities. Students have access to their enrolled courses, progress tracking, wallet, and communication tools.

5. **Supervisor (سرپرست)**: Quality assurance personnel who evaluate teacher performance, observe classes, and ensure teaching standards are maintained. Supervisors have access to evaluation tools and teacher analytics.

6. **Call Center Agent (پشتیبان)**: Customer service representatives who handle inquiries, manage leads through the sales pipeline, and provide support. Agents access the unified workflow system and lead management tools.

7. **Accountant (حسابدار)**: Financial staff who manage transactions, process payments, handle teacher payroll, and generate financial reports. Accountants have access to all financial data and reporting tools.

8. **Front Desk Clerk (پذیرش)**: Reception staff who handle visitor intake, schedule appointments, and manage walk-in registrations. Front desk clerks can create leads and manage the initial intake process.

---

## 2. Student Management System

### Student Profiles

Each student has a comprehensive profile that captures all relevant information for personalized learning. The profile includes personal details (name, contact information, emergency contacts), cultural and educational background, and learning preferences.

The system tracks language proficiency using the Common European Framework of Reference (CEFR) levels from A1 (beginner) to C2 (mastery). Students can see their current level for each language skill (listening, reading, speaking, writing) and track their progress over time.

Custom fields allow institutes to capture institution-specific data such as student ID numbers, parent information, or special requirements. The profile also displays wallet balance, transaction history, and purchased CallerN packages.

### Enrollment & Progress

The enrollment system manages student registration for courses with automatic prerequisite checking. When a student attempts to enroll, the system verifies they have completed any required prior courses or placement tests.

Real-time progress tracking shows students and teachers how far along they are in their courses. Progress is measured through various metrics including lesson completion, assignment scores, attendance, and skill assessments. The system generates visual progress reports with charts and analytics.

Attendance monitoring tracks student participation in scheduled classes and CallerN sessions. The system can automatically detect patterns such as frequent absences and alert mentors or administrators.

### Communication

Students receive important updates through multiple channels. SMS notifications via Kavenegar deliver time-sensitive information like OTP codes, class reminders, and urgent announcements. The in-app messaging system built on Socket.io provides real-time chat capabilities for communication with teachers, mentors, and support staff.

---

## 3. Course Management System

### Course Creation & Structure

Meta Lingua supports a flexible multi-level course architecture designed to accommodate various teaching methodologies. Courses can be organized into levels (beginner, intermediate, advanced) or by specific skills, topics, or certification requirements.

The modular content organization allows course creators to build curricula from reusable components. Lessons can include text content, video materials, interactive exercises, downloadable resources, and assessments. The custom curriculum builder provides a visual interface for arranging course components.

### Class Management

The scheduling system handles all aspects of class management with support for recurring sessions. Administrators can schedule classes to repeat weekly, bi-weekly, or on custom patterns. The system automatically generates sessions for the entire term based on the defined pattern.

Room and resource management tracks physical classroom availability, virtual meeting rooms, and equipment. The holiday and vacation manager integrates with the Persian (Jalali) calendar to automatically skip classes on holidays and adjust schedules accordingly.

Automatic conflict detection prevents double-booking of teachers, rooms, or students. When creating or modifying schedules, the system checks for overlaps and alerts administrators to potential conflicts.

Class capacity management limits enrollment based on available seats. When a class reaches capacity, new students can be added to a waitlist and automatically notified when spots become available.

### Teacher Assignment

Teachers are matched to courses based on their qualifications, specializations, and availability. The system maintains teacher profiles with their credentials, experience, language proficiencies, and preferred teaching areas.

Availability-based scheduling shows which teachers are free during proposed class times. The system considers teacher preferences for specific time slots and workload limits to ensure fair distribution of classes.

---

## 4. CallerN - 24/7 Video Tutoring Service

### Core Video Features

CallerN is Meta Lingua's innovative on-demand video tutoring service that connects students with teachers for personalized learning sessions. Built on WebRTC technology using SimplePeer, CallerN provides high-quality, low-latency video communication directly in the browser.

Students can start a CallerN session at any time when authorized teachers are available. The system matches students with appropriate teachers based on their learning needs, the teacher's specializations, and current availability. The matching algorithm considers factors like language, skill level, and specific learning goals.

**Key video features include:**
- **Screen Sharing**: Teachers and students can share their screens for collaborative learning, allowing teachers to present materials or students to show their work for review
- **Automatic Recording**: All CallerN sessions are automatically recorded for quality assurance and student review. Recordings are stored securely and accessible from the session history
- **Media Controls**: Users can mute/unmute audio and toggle camera on/off during sessions

### Recording System

Session recordings are stored in a self-hosted storage system organized by date (/recordings/YYYY-MM/). Each recording is saved in WebM format with optimized settings (256kbps audio, 20fps video) balancing quality with file size. A maximum file size of 500MB per recording prevents storage issues with long sessions.

Recordings are uploaded securely with JWT authentication, ensuring only authorized users can access session recordings. Both teachers and students can access their recording history through their dashboards.

### AI Supervisor Integration

The AI Supervisor provides intelligent assistance during CallerN sessions, enhancing the learning experience with real-time feedback and suggestions.

**Real-time Features:**
- **Speech Recognition**: Converts spoken words to text, enabling transcript generation and analysis
- **Vocabulary Suggestions**: The AI identifies unfamiliar words in context and suggests definitions or alternatives
- **Grammar Correction**: Detects grammatical errors in real-time and provides correction recommendations
- **Attention Tracking**: Uses MediaPipe facial detection to monitor student engagement and alert when attention wanes
- **Teacher Talking Time (TTT) Monitoring**: Tracks the ratio of teacher-to-student speaking time to encourage student participation

**Post-Session Features:**
- Automatic transcript generation for session review
- Performance scoring for both students and teachers
- Learning recommendations based on session content

### Teacher Authorization

Not all teachers have access to CallerN services. Administrators selectively authorize teachers for video tutoring based on qualifications and performance. Authorized teachers can:
- Set their hourly rates for CallerN sessions
- Manage their availability schedule
- Toggle their online/offline status
- View their CallerN earnings and statistics

### Student Features

Students access CallerN through package-based purchasing. Available packages include 5, 10, or 15 hours of tutoring time, which can be purchased using wallet credit. When starting a session, students can specify their learning focus (conversation practice, grammar help, exam preparation, etc.).

Progress through CallerN sessions is tracked and integrated with the student's overall learning journey. Students can review past session recordings, track improvement over time, and receive personalized recommendations based on their performance.

---

## 5. LinguaQuest - Gamified Learning Platform

### Overview

LinguaQuest is a free, interactive language learning platform that makes education engaging through gamification. Built with 23 unique activity types, LinguaQuest covers all aspects of language learning across CEFR levels A1 through C2.

The platform is accessible to guests without requiring registration, making it an effective tool for marketing and lead generation. Guest progress is tracked via session tokens stored in the browser, and this progress transfers to a registered account if the user signs up.

### Activity Types

1. **Introduction/Scenario Steps**: Set the context for learning activities with audio narration and cultural background information. These steps immerse learners in realistic situations where they'll practice the target language.

2. **Vocabulary Practice**: Present new words through flashcards, visual galleries, and word-building exercises. Each vocabulary item includes audio pronunciation, translations, example sentences, and visual aids where applicable.

3. **Matching Games**: Reinforce vocabulary and concepts through interactive matching exercises. Options include drag-and-drop matching, memory games (flip cards to find pairs), and idiom matching (expressions to meanings).

4. **Conversation Practice**: Practice dialogue through interactive roleplay scenarios. Students take on roles in realistic conversations (ordering food, visiting a doctor, job interviews) and receive feedback on their responses.

5. **Pronunciation Challenge**: Listen to native speaker recordings and practice pronunciation. The system provides Text-to-Speech (TTS) reference audio for comparison.

6. **Listening Comprehension**: Develop listening skills through audio playback followed by comprehension questions. Scenarios include natural conversations, announcements, lectures, and other real-world audio.

7. **Fill in the Blank**: Complete sentences or stories by filling in missing words. This tests grammar, vocabulary, and contextual understanding.

8. **Drag and Drop**: Interactive exercises like shopping simulations where learners drag items to complete tasks, reinforcing practical vocabulary and phrases.

9. **Quick Quiz**: Multiple-choice questions with immediate feedback. Quizzes adapt to the lesson content and can simulate real situations like checkout procedures.

10. **Menu Exploration**: Restaurant-themed activities where learners navigate menus, learn food vocabulary, and practice ordering phrases.

11. **Ordering Practice**: Simulate ordering experiences with options for special requests, modifications, and handling complications.

12. **Symptom Description**: Medical English practice where learners describe symptoms, understand diagnoses, and communicate with healthcare providers.

13. **Prescription Reading**: Develop the ability to read and understand medical documents, prescriptions, and health instructions.

14. **Sentence Reordering**: Build sentences by arranging scrambled words in the correct order, reinforcing grammar and syntax.

15. **Image Selection**: Choose the correct image based on audio or text prompts, connecting vocabulary with visual representations.

16. **True/False Questions**: Quick comprehension checks with binary choices and immediate feedback.

17. **Spelling Challenge**: Practice spelling words correctly based on audio prompts, improving written accuracy.

18. **Vocabulary Matching**: Connect words with their meanings, synonyms, or translations using the Content Bank system.

19. **Synonym/Antonym Matching**: Match words with their synonyms or antonyms, building vocabulary depth and understanding of word relationships.

20. **Word Formation**: Build words by arranging letter tiles, developing spelling skills and word recognition.

21. **Grammar Battles**: Quiz-style grammar challenges with multiple rules, each including explanations of the correct answers.

22. **Cultural Context**: Explore cultural aspects of language use, including customs, etiquette, and regional variations.

23. **Default Step**: A fallback for handling any content that doesn't fit other categories, ensuring all lessons can be completed.

### AI Lesson Generator

Content creators can use the AI Lesson Generator to automatically create LinguaQuest lessons. The generator supports both Ollama (self-hosted AI) and OpenAI providers, allowing institutes to choose their preferred AI service. Lessons can be generated based on topics, vocabulary lists, or learning objectives.

---

## 6. Call Center Unified Workflow

### Overview

The Call Center module provides a comprehensive lead management system that tracks prospects from initial contact through enrollment or closure. The unified workflow interface gives agents a clear view of all leads organized by their current stage in the sales pipeline.

### Workflow Stages

**New Intake**: The entry point for all new leads. Leads arrive here from various sources including website inquiries, phone calls, walk-ins, and marketing campaigns. Agents perform initial contact and data collection at this stage.

**Contact Desk**: Active leads being worked by agents. This stage involves outreach calls, needs assessment, program explanation, and relationship building. Agents log all interactions and schedule follow-up activities.

**Follow Up**: Leads awaiting callback or additional action. This stage includes scheduled callbacks, pending document collection, or leads who need time to consider their options. The system provides reminders for scheduled follow-ups.

**Qualified**: Leads who have expressed genuine interest and meet enrollment criteria. At this stage, agents prepare enrollment documentation, discuss payment options, and finalize program selection.

**Enrolled**: Successfully converted leads who have completed registration. This stage triggers welcome communications and hands off to the student management system.

**Lost**: Leads who did not convert. Leads move here when they decline to enroll, become unreachable, or choose a competitor. The system captures the reason for loss to improve future conversion efforts.

### Lead Management Features

Each lead record contains complete contact information, communication history, notes from all interactions, and stage history. Agents can log phone calls, emails, and in-person meetings, maintaining a complete record of the relationship.

Source tracking identifies where each lead originated (website form, phone inquiry, referral, advertisement campaign). This data feeds into marketing analytics to measure campaign effectiveness and optimize lead generation efforts.

Course targeting records which programs each prospect is interested in, helping agents provide relevant information and enabling targeted follow-up communications.

### Role Permissions

The system enforces role-based access to lead data. Administrators can view and manage all leads across the organization. Call Center Agents access only their assigned leads and the shared intake queue. Supervisors can view all leads for reporting and oversight but may have restricted editing capabilities. Front Desk Clerks can create new leads and manage walk-in intake.

---

## 7. Payment & Financial System

### Shetab Payment Gateway

Meta Lingua integrates with Shetab, Iran's national payment network, for secure online transactions. The integration supports the complete payment lifecycle:

**Payment Initiation**: When a user makes a purchase (course enrollment, CallerN package, wallet top-up), the system creates a transaction record and redirects to the Shetab gateway.

**Payment Processing**: Users complete payment through their bank's interface using their Iranian bank cards. The gateway handles all sensitive financial data.

**Callback Processing**: Upon payment completion, Shetab sends a callback to Meta Lingua with the transaction result. The system verifies the callback authenticity using HMAC signature verification.

**Transaction Management**: Users can view their payment history, and administrators can track all transactions. The system supports refund processing for eligible transactions.

**Security Features**: Transaction idempotency prevents duplicate charges from repeated submissions. All payment data is logged for audit purposes.

### Wallet System

Each user has an IRR (Iranian Rial) wallet for prepaid credit. Users can top up their wallets via Shetab payments and use the balance for purchases within the platform. This simplifies transactions and enables special pricing for prepaid users.

The wallet tracks all transactions with detailed history including deposits, payments, refunds, and adjustments. Users receive balance notifications when their wallet balance changes and optional low-balance alerts.

### Member Tiers

Meta Lingua rewards loyal users with a tiered membership system:

- **Bronze**: The default tier for all users. Standard pricing and access.
- **Silver**: Achieved after spending 500,000 IRR. Members receive a 5% discount on purchases.
- **Gold**: Achieved after spending 2,000,000 IRR. Members receive 10% discount and priority support.
- **Platinum**: Achieved after spending 5,000,000 IRR. Members receive 15% discount, VIP support, and exclusive content access.

The system automatically promotes users to higher tiers as they reach spending thresholds.

### Financial Reporting

Comprehensive financial dashboards provide visibility into platform economics:

- Revenue analytics show daily, weekly, and monthly income with trend visualization
- Teacher payment calculations automate salary computation based on classes taught and CallerN sessions
- Commission tracking monitors referral bonuses and agent incentives
- Transaction reports enable reconciliation with bank statements

---

## 8. AI-Powered Features

### AI Provider Architecture

Meta Lingua implements a flexible AI provider system that prioritizes self-hosted solutions for Iranian deployment while supporting cloud alternatives. The primary provider is Ollama, a self-hosted AI server that runs large language models locally. OpenAI serves as an optional fallback for enhanced capabilities or when Ollama is unavailable.

The provider configuration is controlled through environment variables, allowing administrators to switch providers without code changes. The system includes automatic failover—if the primary provider fails, requests automatically route to the fallback.

Health monitoring in the admin dashboard shows real-time status of AI services including connection status, model availability, and response latency.

### AI Capabilities

**Content Generation**: The AI creates lesson content, quiz questions, vocabulary exercises, and reading passages. Content can be generated for specific topics, difficulty levels, and learning objectives.

**Grammar Correction**: Real-time analysis identifies grammatical errors in student writing and provides correction suggestions with explanations.

**Vocabulary Suggestions**: Context-aware word recommendations help students expand their vocabulary during reading, writing, and conversation activities.

**Speech-to-Text**: Integration with Whisper (via local server or OpenAI) converts spoken audio to text for transcription and analysis.

**Text-to-Speech**: Edge TTS generates natural-sounding audio for vocabulary words, sentences, and reading passages in multiple languages.

**AI Lesson Generator**: Automatically creates complete LinguaQuest lessons from topic descriptions, saving hours of content creation time.

### AI Assessment

The AI assists with student assessment through:
- Automatic quiz generation based on lesson content
- Writing evaluation with grammar, vocabulary, and style feedback
- Listening comprehension testing with auto-generated questions
- Progress analysis identifying learning patterns and areas needing attention

---

## 9. Gamification System

### XP & Leveling

Students earn Experience Points (XP) for virtually every learning activity:

- **Lesson Completion**: 100 XP for completing a lesson
- **Homework Submission**: 50 XP for submitting assignments
- **Perfect Attendance**: 200 XP bonus for attending all classes in a week
- **CallerN Sessions**: 150 XP for each 30-minute video tutoring session
- **Test Completion**: 75 XP for finishing assessments
- **Daily Login**: 10 XP for opening the app each day
- **Streak Bonuses**: Multiplied XP for consecutive daily activity

The leveling system spans 100 levels with increasing XP requirements. Beginner levels (1-20) require 1,000 XP each, intermediate levels (21-50) require 2,000 XP, advanced levels (51-80) require 3,000 XP, and expert levels (81-100) require 5,000 XP each.

Skill-specific XP tracks progress in the four language skills separately (listening, reading, speaking, writing), providing detailed visibility into strengths and areas for improvement.

### Achievement System

Achievements recognize student accomplishments across multiple categories:

- **Learning Achievements**: First lesson completed, first test passed, first CallerN session, course completions
- **Consistency Achievements**: Login streaks (7-day, 30-day, 100-day), perfect attendance weeks, study time goals
- **Excellence Achievements**: Perfect scores, rapid improvement, top percentile rankings
- **Social Achievements**: Helping classmates, forum participation, peer tutoring

Each achievement awards XP and a visual badge displayed on the student profile. Some achievements have multiple levels (bronze, silver, gold) that can be upgraded through repeated accomplishment.

### Daily Challenges

The daily challenge system presents personalized learning goals each day:

- **Vocabulary Builder**: Learn and review a set number of new words
- **Grammar Master**: Complete specific grammar exercises
- **Speaking Practice**: Engage in a CallerN session or pronunciation exercises
- **Reading Comprehension**: Complete a reading task
- **Writing Excellence**: Submit a writing assignment

Challenge difficulty adapts to the student's level and recent performance. Completing daily challenges earns bonus XP and contributes to streak tracking. Students who complete challenges consistently unlock special badges and rewards.

### Leaderboards

Competition features encourage engagement through rankings:

- **Global Leaderboard**: All platform users ranked by total XP
- **Class Leaderboard**: Rankings within enrolled courses
- **Weekly Leaderboard**: Based on XP earned in the current week
- **Skill Leaderboards**: Separate rankings for each language skill

---

## 10. Communication Infrastructure

### SMS Integration (Kavenegar)

Meta Lingua integrates with Kavenegar, Iran's premier SMS service provider, for reliable message delivery within the country. The integration includes an IP-based fallback mechanism that connects directly to Kavenegar servers using IP addresses, ensuring delivery even when DNS resolution is problematic.

**SMS Use Cases:**
- OTP codes for authentication
- Class reminders before scheduled sessions
- Payment confirmations
- Important announcements and alerts
- Marketing campaigns (with appropriate frequency limits)

Rate limiting protects against abuse: 100 SMS maximum per 15-minute window and 10 bulk messages per hour. Message templates can be customized in multiple languages (Persian, English, Arabic).

### Messaging System

Real-time in-app messaging uses Socket.io for instant communication. Users can send direct messages to individuals or participate in group chats for classes and study groups.

Message features include:
- Text messaging with Unicode support for Persian and Arabic
- File sharing for documents, images, and audio
- Message history archived and searchable
- Typing indicators show when others are composing messages
- Online/offline status visibility

### Notification System

Multi-channel notifications ensure users never miss important information:

- **SMS**: Critical alerts that require immediate attention
- **Push Notifications**: Real-time alerts through PWA
- **In-App Notifications**: Updates visible when users are active
- **Email**: Non-urgent communications and newsletters

Priority routing ensures the most important notifications use the most immediate channels. Users can customize their notification preferences to control which channels they receive different types of alerts.

---

## 11. Testing & Assessment System

### Question Types

The assessment engine supports eight distinct question types:

1. **Multiple Choice**: Questions with single or multiple correct answers. Can include images, audio, or video in the question stem. Supports partial credit for partially correct selections.

2. **True/False**: Binary choice questions for quick comprehension checks. Can include explanation text shown after answering.

3. **Fill in the Blanks**: Sentences or paragraphs with missing words. Supports multiple blanks with auto-correction that can be configured for strict or lenient matching.

4. **Essay Questions**: Open-ended writing prompts evaluated by AI for grammar, vocabulary, coherence, and content relevance.

5. **Speaking Tests**: Audio recording prompts that capture student speech for pronunciation analysis and content evaluation.

6. **Listening Comprehension**: Audio playback followed by questions testing understanding. Audio can be replayed a configurable number of times.

7. **Matching Exercises**: Connect items in two lists (vocabulary to definitions, questions to answers, images to words).

8. **Ordering/Sequencing**: Arrange items in the correct order (sentences in a paragraph, steps in a process, chronological events).

### MST Placement Test

The Multi-Stage Testing (MST) placement test uses adaptive algorithms to accurately assess student proficiency in approximately 10 minutes. The test adjusts difficulty based on responses, spending more time on the boundary between levels.

Test results map to CEFR levels (A1, A2, B1, B2, C1, C2) and generate a personalized learning roadmap. The roadmap identifies specific skill gaps and recommends courses, lessons, and learning activities tailored to the student's needs.

---

## 12. Mobile & PWA Features

### Progressive Web App

Meta Lingua is built as a Progressive Web App (PWA), providing a native app experience through the web browser. Users can install the app to their device's home screen for quick access without visiting an app store.

**PWA Capabilities:**
- **Install Prompt**: Users see a prompt to add the app to their home screen on compatible devices
- **Offline Support**: Service workers cache essential resources, allowing limited functionality without internet connection
- **Push Notifications**: Real-time alerts even when the app is not open
- **Standalone Mode**: Full-screen experience without browser chrome
- **Background Sync**: Data synchronization when connection is restored

### Caching Strategy

The service worker implements intelligent caching for optimal performance:

- **CacheFirst for Static Assets**: Fonts, images, and JavaScript files are cached for up to one year, loading instantly on repeat visits
- **NetworkFirst for API Calls**: Data requests try the network first but fall back to cached responses if offline
- **Image Caching**: Course images and user avatars are cached for 30 days

The precache limit is set to 5 MB to ensure reasonable download sizes on initial install.

### Responsive Design

The mobile-first design approach ensures excellent usability across all devices:

- **Touch Optimization**: All buttons and interactive elements are sized for finger taps
- **Bottom Navigation**: Primary navigation appears at the bottom of the screen on mobile for thumb accessibility
- **Gesture Support**: Swipe gestures for navigation and interactions
- **WCAG Compliance**: Color contrast ratios exceed 4.5:1 for accessibility

### Multi-Language Support

Complete localization for three languages with proper text direction handling:

- **Persian (Farsi)**: Full right-to-left (RTL) layout with Persian numerals and Jalali calendar
- **Arabic**: RTL layout with Arabic numerals
- **English**: Left-to-right (LTR) layout

Users can switch languages dynamically without reloading. All interface elements, error messages, and system notifications are translated.

---

## 13. Administrative Features

### Institute Management

For organizations operating multiple branches or franchises, Meta Lingua supports multi-institute configurations:

- **White-Label Ready**: Each institute can have custom branding, colors, and logos
- **Departmental Organization**: Group courses and staff by department (e.g., English, Arabic, German)
- **Branch Management**: Separate physical locations with their own schedules and resources
- **Centralized Control**: Super-admin access to manage all institutes from one dashboard

### Infrastructure Status Widget

The admin dashboard includes a real-time infrastructure monitoring widget showing:

- AI provider status (Ollama/OpenAI connection health)
- Database connectivity
- SMS gateway status (Kavenegar service health)
- Storage usage and availability

Administrators can switch between AI providers directly from the dashboard if issues arise.

---

## 14. Deployment & Production

### Production Optimization

Meta Lingua has been optimized for production deployment with minimal resource requirements:

- **Deployment Size**: Optimized to under 8 GiB for Replit deployment limits
- **Package Optimization**: Reduced from 18 to 2 essential Nix packages (ffmpeg, jq)
- **Node Modules**: Reduced from 1.7 GB to approximately 1.2 GB by removing development-only dependencies
- **Code Splitting**: 10 vendor chunks for parallel loading and efficient caching
- **Minification**: Terser removes console.log statements and debugger calls in production

### Deployment Options

**Replit Deploy**: One-click deployment directly from Replit with automatic SSL certificates and managed infrastructure.

**Docker Containerization**: Docker Compose configurations for deploying the full stack (app, database, Ollama) on any server supporting Docker.

**Manual Server Deployment**: Traditional deployment using PM2 process manager and Nginx reverse proxy, suitable for dedicated Iranian servers.

### Iranian Self-Hosting Requirements

For deployment within Iran, the platform requires:

- PostgreSQL 14+ for the database
- Node.js 18+ runtime
- Ollama for AI services (eliminating dependency on blocked OpenAI)
- Kavenegar for SMS delivery
- Optional: coturn server for TURN/STUN (video calling NAT traversal)
- Optional: Isabel VoIP for call center phone integration

All external dependencies can be self-hosted within Iran, ensuring zero reliance on services that may be inaccessible or blocked.

---

## Test Accounts and Demo Mode

### Demo OTP System

For testing, demonstrations, and quality assurance, Meta Lingua includes a demo mode that generates predictable OTP codes for designated test accounts. This allows stakeholders to test the authentication flow without consuming SMS credits.

**Configuration:**
- Set `DEMO_TEST_ACCOUNTS=true` in environment variables
- Set `DEMO_TEST_SECRET` with a secure random string

Demo OTP codes rotate every 30 minutes using HMAC-SHA256 hashing. The system only generates demo codes for whitelisted test phone numbers—real users always receive actual SMS messages.

### Pre-configured Test Accounts

Nine test accounts cover all user roles for comprehensive testing:

| Role | Phone | Name | Purpose |
|------|-------|------|---------|
| Teacher | +989121234567 | Sara Rezaei | Test teaching features |
| Teacher | +989127654321 | Ali Mohammadi | Test CallerN features |
| Student | +989131234567 | Maryam Karimi | Test student experience |
| Student | +989137654321 | Reza Ahmadi | Test enrollment flow |
| Admin | +989101234567 | Admin User | Test administration |
| Accountant | +989101234568 | Sara Accountant | Test financial features |
| Call Center | +989101234569 | Ali CallCenter | Test workflow system |
| Front Desk | +989101234570 | Maryam FrontDesk | Test intake process |
| Mentor | +989101234571 | Reza Mentor | Test mentoring features |

Use the seed endpoint (`POST /api/seed-test-users`) to populate these accounts in a fresh database.

---

## Documentation Resources

Meta Lingua includes comprehensive documentation for different audiences:

- **META_LINGUA_MASTER_GUIDE.md**: Complete platform reference for administrators and developers
- **BUYER_MANUAL_COMPLETE.md**: User documentation for institute staff
- **DEPLOYMENT_GUIDE.md**: Step-by-step Iranian self-hosting instructions
- **WEBRTC_SETUP.md**: CallerN and coturn server configuration
- **LINGUAQUEST_STATUS_REPORT.md**: Detailed LinguaQuest activity documentation

---

*Document Version: 1.0*  
*Last Updated: December 2025*  
*Meta Lingua - AI-Enhanced Language Learning Platform*
