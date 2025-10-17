# MetaLingua Complete System Workflow Diagram
**Based on Actual Codebase Analysis (October 2025)**

## Legend
- ✅ = Fully Implemented
- ⚠️ = Potential Production Error Point
- 🔒 = Authentication/Authorization Required
- 🌐 = External Dependency (Iranian Self-Hosted)
- 💾 = Database Operation
- 🤖 = AI-Powered Feature

---

## 1. SYSTEM INITIALIZATION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ Server Startup (server/index.ts)                                │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ├──> Load Environment Variables (.env)
                           │    ⚠️ PRODUCTION ERROR POINT: Missing JWT_SECRET exits app
                           │    ⚠️ PRODUCTION ERROR POINT: Missing OLLAMA_HOST defaults to localhost
                           │    ⚠️ PRODUCTION ERROR POINT: Missing DATABASE_URL fails
                           │
                           ├──> Initialize Database Connection (Neon PostgreSQL)
                           │    💾 Connection: ep-curly-hat-a5e23m8e.us-east-2.aws.neon.tech
                           │    ⚠️ PRODUCTION ERROR POINT: Network timeout (10s)
                           │    ⚠️ PRODUCTION ERROR POINT: SSL certificate issues
                           │
                           ├──> Initialize Storage Systems
                           │    ├─> DatabaseStorage (PostgreSQL - Production)
                           │    ├─> MemStorage (In-Memory - Development)
                           │    └─> UnifiedTestingStorage (Map-based, NO database)
                           │
                           ├──> Initialize AI Services
                           │    ├─> Ollama Provider (Ollama-only mode)
                           │    │   🌐 Host: http://45.89.239.250:11434
                           │    │   🌐 Model: llama3.2b
                           │    │   ⚠️ PRODUCTION ERROR POINT: Connection timeout (10s)
                           │    │   ⚠️ PRODUCTION ERROR POINT: Model not downloaded
                           │    │   ⚠️ Graceful degradation: App starts without Ollama
                           │    │
                           │    ├─> Whisper Service (Speech-to-Text)
                           │    │   🌐 Host: http://localhost:8000
                           │    │   ⚠️ PRODUCTION ERROR POINT: Service not available
                           │    │   ⚠️ Graceful degradation: Features disabled
                           │    │
                           │    ├─> TTS Service (Edge TTS - Self-hosted)
                           │    │   ✅ No external dependencies
                           │    │   ⚠️ PRODUCTION ERROR POINT: Voice synthesis failures
                           │    │
                           │    └─> AI Insights Service
                           │        ├─> AI Provider Manager
                           │        ├─> Health Monitoring Service
                           │        └─> Caching System (in-memory)
                           │
                           ├──> Initialize External Services
                           │    ├─> Kavenegar SMS Service
                           │    │   🌐 Iranian provider
                           │    │   ⚠️ PRODUCTION ERROR POINT: API key missing/invalid
                           │    │   ⚠️ PRODUCTION ERROR POINT: Rate limiting (100 SMS/15min)
                           │    │   ⚠️ PRODUCTION ERROR POINT: Bulk SMS limit (10/hour)
                           │    │
                           │    ├─> Isabel VoIP Service
                           │    │   🌐 Iranian telecom
                           │    │   ⚠️ PRODUCTION ERROR POINT: SIP trunk unavailable
                           │    │   ⚠️ PRODUCTION ERROR POINT: Call routing failures
                           │    │
                           │    └─> Shetab Payment Gateway
                           │        🌐 Iranian banking network
                           │        ⚠️ PRODUCTION ERROR POINT: Gateway timeout
                           │        ⚠️ PRODUCTION ERROR POINT: Transaction verification failures
                           │
                           ├──> Initialize WebSocket Server (CallerN)
                           │    ├─> Socket.io Server (port 5000)
                           │    ├─> CallerN Supervisor Handlers
                           │    ├─> Active Rooms Management (in-memory Map)
                           │    └─> Teacher/Student Socket Tracking
                           │    ⚠️ PRODUCTION ERROR POINT: Socket connection failures
                           │    ⚠️ PRODUCTION ERROR POINT: Memory leaks from abandoned rooms
                           │
                           ├──> Initialize Background Workers
                           │    ├─> SMS Reminder Worker (60s interval)
                           │    │   ⚠️ PRODUCTION ERROR POINT: Worker crashes loop
                           │    ├─> Content Generation Worker
                           │    └─> IRT Processing Worker
                           │
                           ├──> Register Route Modules (73+ route files)
                           │    ├─> Authentication Routes (auth.ts)
                           │    ├─> Admin Routes (routes.ts)
                           │    ├─> Student Routes (routes.ts)
                           │    ├─> Teacher Routes (routes.ts)
                           │    ├─> LinguaQuest Routes (linguaquest-routes.ts)
                           │    ├─> CallerN Routes (callern-ai-routes.ts)
                           │    ├─> Unified Testing Routes (unified-testing-routes.ts)
                           │    ├─> Payment Routes (routes.ts)
                           │    ├─> Gamification Routes (gamification-routes.ts)
                           │    ├─> AI Training Routes (ai-training-routes.ts)
                           │    ├─> Social Media Routes (routes.ts)
                           │    ├─> Book E-Commerce Routes (book-ecommerce-routes.ts)
                           │    ├─> Content Bank Routes (content-bank-routes.ts)
                           │    ├─> Third-Party Integration Routes
                           │    └─> 60+ more specialized routes
                           │    ⚠️ PRODUCTION ERROR POINT: Route conflicts (duplicate paths)
                           │    ⚠️ PRODUCTION ERROR POINT: Middleware ordering issues
                           │
                           └──> Start HTTP Server
                                ✅ Express server on port 5000
                                ⚠️ PRODUCTION ERROR POINT: Port already in use
```

---

## 2. AUTHENTICATION & AUTHORIZATION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ User Authentication Flow                                         │
└─────────────────────────────────────────────────────────────────┘

1. Login Request
   │
   ├──> POST /api/login
   │    ├─> Validate credentials (email/phone + password)
   │    │   💾 Query: users table
   │    │   ⚠️ PRODUCTION ERROR POINT: SQL injection if not sanitized
   │    │   ⚠️ PRODUCTION ERROR POINT: Timing attacks on password check
   │    │
   │    ├─> Bcrypt password verification
   │    │   ⚠️ PRODUCTION ERROR POINT: Bcrypt comparison failures
   │    │
   │    ├─> Generate JWT tokens
   │    │   🔒 Access Token (short-lived)
   │    │   🔒 Refresh Token (long-lived)
   │    │   ⚠️ PRODUCTION ERROR POINT: JWT_SECRET missing = app crash
   │    │   ⚠️ PRODUCTION ERROR POINT: Token signing failures
   │    │
   │    └─> Return user data + tokens
   │
   └──> POST /api/login-otp (Alternative: OTP-based login)
        ├─> Send SMS OTP via Kavenegar
        │   ⚠️ PRODUCTION ERROR POINT: SMS delivery failures
        │   ⚠️ PRODUCTION ERROR POINT: Rate limiting (100 SMS/15min)
        │
        ├─> Verify OTP code
        │   ⚠️ PRODUCTION ERROR POINT: OTP expiration timing
        │   ⚠️ PRODUCTION ERROR POINT: Brute force attacks
        │
        └─> Generate JWT tokens

2. Token Refresh
   │
   └──> POST /api/auth/refresh
        ├─> Verify refresh token
        │   ⚠️ PRODUCTION ERROR POINT: Expired token handling
        │   ⚠️ PRODUCTION ERROR POINT: Invalid token format
        │
        └─> Generate new access token

3. Protected Endpoint Access
   │
   └──> Any protected route
        ├─> authenticateToken middleware
        │   ├─> Extract Bearer token from Authorization header
        │   │   ⚠️ PRODUCTION ERROR POINT: Missing Authorization header
        │   │   ⚠️ PRODUCTION ERROR POINT: Malformed token format
        │   │
        │   ├─> Verify JWT signature
        │   │   ⚠️ PRODUCTION ERROR POINT: Token signature mismatch
        │   │   ⚠️ PRODUCTION ERROR POINT: Token expiration
        │   │
        │   └─> Attach user to request object
        │
        └─> requireRole middleware (if role-specific)
            ├─> Check user.role against required roles
            │   ⚠️ PRODUCTION ERROR POINT: Role mismatch = 403 Forbidden
            │   ⚠️ PRODUCTION ERROR POINT: Missing role in token
            │
            └─> Allow/Deny access

User Roles:
├─> Admin (full system access)
├─> Teacher (teaching features)
├─> Mentor (mentoring features)
├─> Student (learning features)
├─> Supervisor (teacher supervision)
├─> Call Center Agent (lead management)
├─> Accountant (financial reports)
└─> Front Desk Clerk (intake/scheduling)
```

---

## 3. LINGUAQUEST FREE LEARNING PLATFORM FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ LinguaQuest: Gamified Language Learning (Free Platform)         │
└─────────────────────────────────────────────────────────────────┘

Guest Access (No Authentication)
│
├──> GET /linguaquest
│    └─> LinguaQuest Home Page
│        ├─> Browse lessons by category/level
│        ├─> View featured lessons
│        └─> Generate session token for guest progress tracking
│            💾 Session token stored in localStorage
│
├──> GET /api/linguaquest/lessons
│    ├─> Fetch published lessons from database
│    │   💾 Query: linguaquest_lessons (WHERE published = true)
│    │   ⚠️ PRODUCTION ERROR POINT: Large dataset performance
│    │
│    └─> Return lesson metadata (title, level, activities)
│
├──> GET /api/linguaquest/lessons/:id
│    ├─> Fetch single lesson with full activity data
│    │   💾 Query: linguaquest_lessons (JOIN activities)
│    │   ⚠️ PRODUCTION ERROR POINT: Missing lesson = 404
│    │
│    ├─> Fetch pre-generated TTS audio paths
│    │   ⚠️ PRODUCTION ERROR POINT: Missing audio files
│    │
│    └─> Return complete lesson structure
│
└──> POST /api/linguaquest/lessons/:id/submit
     ├─> Validate submitted answers
     │   ├─> Score activity by type (19 activity types):
     │   │   ├─> Multiple Choice
     │   │   ├─> True/False
     │   │   ├─> Fill in Blank
     │   │   ├─> Sentence Reordering
     │   │   ├─> Image Selection
     │   │   ├─> Spelling
     │   │   ├─> Listening Comprehension
     │   │   ├─> Pronunciation (requires Whisper)
     │   │   │   🤖 AI scoring via Whisper service
     │   │   │   ⚠️ PRODUCTION ERROR POINT: Whisper unavailable
     │   │   ├─> Grammar Correction
     │   │   ├─> Vocabulary Matching
     │   │   └─> 9 more activity types
     │   │
     │   ├─> Calculate score, XP, streak
     │   │
     │   └─> Store progress
     │       💾 Guest: In-memory (session token)
     │       💾 Registered: Database (user_id)
     │       ⚠️ PRODUCTION ERROR POINT: Guest data loss on session expiry
     │
     ├─> Award achievements
     │   ├─> Check achievement triggers
     │   └─> Update gamification stats
     │
     └─> POST /api/linguaquest/lessons/:id/feedback
         ├─> Store lesson feedback
         │   💾 Insert: linguaquest_lesson_feedback
         │   ⚠️ PRODUCTION ERROR POINT: Table creation required (see replit.md)
         │
         └─> Return feedback confirmation

Admin Features (LinguaQuest Management)
│
├──> GET /admin/linguaquest
│    └─> Admin LinguaQuest Dashboard
│        ├─> Lesson CRUD operations
│        ├─> Analytics dashboard
│        ├─> Audio generation control panel
│        └─> Feedback monitoring
│
├──> POST /api/linguaquest/admin/lessons
│    ├─> Create new lesson
│    │   💾 Insert: linguaquest_lessons
│    │   ⚠️ PRODUCTION ERROR POINT: Schema validation failures
│    │
│    └─> Trigger TTS audio generation job
│        ├─> POST /api/linguaquest/audio/generate
│        │   ├─> Queue audio generation for all lesson content
│        │   │   ├─> Generate hash (MD5) for content deduplication
│        │   │   ├─> Check existing audio cache
│        │   │   └─> Generate missing audio via Edge TTS
│        │   │       🌐 Self-hosted TTS (no external API)
│        │   │       ⚠️ PRODUCTION ERROR POINT: TTS synthesis failures
│        │   │       ⚠️ PRODUCTION ERROR POINT: Disk space for audio files
│        │   │
│        │   ├─> Store audio files: /uploads/linguaquest-audio/
│        │   │   ⚠️ PRODUCTION ERROR POINT: File system permissions
│        │   │   ⚠️ PRODUCTION ERROR POINT: Disk quota exceeded
│        │   │
│        │   └─> Update lesson with audio paths
│        │       💾 Update: linguaquest_lessons (audio_urls)
│        │
│        └─> GET /api/linguaquest/audio/jobs
│            └─> Real-time job monitoring (in-memory queue)
│                ⚠️ PRODUCTION ERROR POINT: Queue state lost on restart
│
├──> PUT /api/linguaquest/admin/lessons/:id
│    ├─> Update lesson content
│    │   ⚠️ PRODUCTION ERROR POINT: Concurrent edit conflicts
│    │
│    └─> Re-generate audio if content changed
│
└──> DELETE /api/linguaquest/admin/lessons/:id
     ├─> Soft delete (set published = false)
     │   💾 Update: linguaquest_lessons
     │
     └─> Clean up orphaned audio files
         ⚠️ PRODUCTION ERROR POINT: Orphaned files accumulate
```

---

## 4. CALLERN 24/7 VIDEO TUTORING FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ CallerN: AI-Powered Video Tutoring Platform                     │
└─────────────────────────────────────────────────────────────────┘

Student Flow (On-Demand Video Call)
│
├──> Student Login → Dashboard
│    └─> View available teachers (online status)
│        ├─> GET /api/student/online-teachers
│        │   ├─> Query teacher sockets (WebSocket in-memory)
│        │   │   ⚠️ PRODUCTION ERROR POINT: Socket state desync
│        │   └─> Filter by availability
│        │
│        └─> Check student's CallernPackage balance
│            💾 Query: student_callern_packages
│            ⚠️ PRODUCTION ERROR POINT: Insufficient minutes
│
├──> Initiate Call
│    └─> POST /api/callern/initiate-call
│        ├─> Validate student package
│        │   ⚠️ PRODUCTION ERROR POINT: Package expired
│        │   ⚠️ PRODUCTION ERROR POINT: Zero minutes remaining
│        │
│        ├─> Find available teacher
│        │   ├─> Check teacher sockets
│        │   └─> Match by subject/level
│        │       ⚠️ PRODUCTION ERROR POINT: No teachers available
│        │
│        ├─> Create call room (WebSocket)
│        │   ├─> Generate unique roomId
│        │   ├─> Store in activeRooms Map (in-memory)
│        │   │   ⚠️ PRODUCTION ERROR POINT: Memory leak if room not cleaned
│        │   └─> Start room timer
│        │
│        ├─> Emit Socket.io events
│        │   ├─> To Teacher: 'incoming-call'
│        │   └─> To Student: 'call-initiated'
│        │   ⚠️ PRODUCTION ERROR POINT: Socket event delivery failures
│        │
│        └─> Create call history record
│            💾 Insert: callern_call_history (status: 'pending')
│
└──> WebRTC Connection Establishment
     ├─> Student WebSocket: 'webrtc-offer'
     │   ├─> Create peer connection (Simple Peer)
     │   ├─> Generate SDP offer
     │   │   ⚠️ PRODUCTION ERROR POINT: ICE candidate gathering failures
     │   │   ⚠️ PRODUCTION ERROR POINT: STUN/TURN server unreachable
     │   │
     │   └─> Send offer to teacher via Socket.io
     │
     ├─> Teacher WebSocket: 'webrtc-answer'
     │   ├─> Create peer connection
     │   ├─> Generate SDP answer
     │   └─> Send answer to student
     │
     ├─> ICE Candidate Exchange
     │   ├─> Exchange ICE candidates
     │   │   ⚠️ PRODUCTION ERROR POINT: NAT traversal failures
     │   │   ⚠️ PRODUCTION ERROR POINT: Symmetric NAT issues
     │   │
     │   └─> Establish peer-to-peer connection
     │       ⚠️ PRODUCTION ERROR POINT: Firewall blocking
     │
     └─> Call In Progress
         ├─> Video/Audio streams (WebRTC)
         ├─> Screen sharing (optional)
         ├─> Real-time chat (Socket.io)
         │
         ├─> AI Supervisor Features (Real-time)
         │   ├─> Audio streaming to Ollama
         │   │   🤖 AI-powered vocabulary suggestions
         │   │   🤖 Grammar correction suggestions
         │   │   🤖 Attention tracking (TTT ratio)
         │   │   ⚠️ PRODUCTION ERROR POINT: Ollama streaming failures
         │   │   ⚠️ PRODUCTION ERROR POINT: High latency degrades UX
         │   │
         │   ├─> Live transcript generation (Whisper)
         │   │   🤖 Speech-to-text conversion
         │   │   ⚠️ PRODUCTION ERROR POINT: Whisper service down
         │   │
         │   └─> Socket.io: 'ai-suggestion' events
         │       ⚠️ PRODUCTION ERROR POINT: Event flooding
         │
         ├─> Call Recording (Optional)
         │   ├─> RecordRTC: Local browser recording
         │   ├─> Upload to server: /uploads/recordings/
         │   │   ⚠️ PRODUCTION ERROR POINT: Upload failures
         │   │   ⚠️ PRODUCTION ERROR POINT: Large file size (storage)
         │   │
         │   └─> Store metadata
         │       💾 Update: callern_call_history (recording_url)
         │
         └─> Minute Tracking
             ├─> Update room timer (every 60s)
             ├─> Deduct from student package
             │   💾 Update: student_callern_packages (minutes_used)
             │   ⚠️ PRODUCTION ERROR POINT: Race conditions on concurrent deduction
             │
             └─> Alert at 5 minutes remaining
                 ├─> Socket.io: 'low-minutes-warning'
                 └─> Auto-disconnect at 0 minutes
                     ⚠️ PRODUCTION ERROR POINT: Abrupt call termination

Call End Flow
│
├──> WebSocket: 'end-call'
│    ├─> Clean up WebRTC connections
│    │   ├─> Close peer connections
│    │   ├─> Stop media streams
│    │   └─> Remove from activeRooms Map
│    │       ⚠️ PRODUCTION ERROR POINT: Memory leak if cleanup fails
│    │
│    ├─> Update call history
│    │   💾 Update: callern_call_history
│    │   ├─> Set end_time
│    │   ├─> Calculate total_minutes
│    │   ├─> Set status: 'completed'
│    │   └─> Store final package balance
│    │
│    ├─> AI Post-Session Analysis
│    │   🤖 POST /api/callern/post-session-analysis
│    │   ├─> Generate call transcript summary (Ollama)
│    │   ├─> Extract key vocabulary learned
│    │   ├─> Grammar issues identified
│    │   ├─> Fluency/pronunciation scores (Whisper)
│    │   │   ⚠️ PRODUCTION ERROR POINT: AI analysis timeout (30s+)
│    │   │   ⚠️ PRODUCTION ERROR POINT: Ollama model hallucinations
│    │   │
│    │   └─> Store session report
│    │       💾 Insert: callern_session_reports
│    │
│    └─> Request ratings
│        ├─> Socket.io: 'request-rating'
│        ├─> POST /api/callern/rate-session
│        │   💾 Update: callern_call_history (student_rating, teacher_rating)
│        │
│        └─> Update teacher QA metrics
│            💾 Update: teacher_qa_metrics

Teacher Flow (Availability Management)
│
├──> Teacher Login → Dashboard
│    └─> Toggle CallerN availability
│        ├─> PUT /api/teacher/callern-availability
│        │   ├─> Update teacher socket (in-memory)
│        │   ├─> Update database
│        │   │   💾 Update: teacher_callern_availability
│        │   │
│        │   └─> Notify admin dashboard
│        │       ├─> Socket.io: 'teacher-status-update'
│        │       └─> Update online teachers count
│        │
│        └─> Receive incoming calls
│            ├─> Socket.io: 'incoming-call' event
│            ├─> Accept or Reject
│            │   ⚠️ PRODUCTION ERROR POINT: No response timeout
│            │
│            └─> If accepted, join WebRTC call

Admin Features (CallerN Management)
│
├──> GET /admin/callern-management
│    └─> Monitor real-time call activity
│        ├─> Active calls (from activeRooms Map)
│        ├─> Online teachers
│        ├─> Call history analytics
│        └─> Package usage reports
│
└──> POST /api/admin/callern-packages
     ├─> Create CallerN package
     │   💾 Insert: callern_packages
     │
     └─> Assign to student
         💾 Insert: student_callern_packages
         ⚠️ PRODUCTION ERROR POINT: Duplicate package assignments
```

---

## 5. UNIFIED TESTING SYSTEM FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ Unified Testing System: 21 Question Types (IELTS/TOEFL/GRE/PTE) │
└─────────────────────────────────────────────────────────────────┘

Storage Architecture
│
├─> Map-based In-Memory Storage (Development)
│   ├─> NO database dependencies
│   ├─> Maps for: questions, templates, sessions, results
│   │   ⚠️ PRODUCTION ERROR POINT: Data loss on server restart
│   │   ⚠️ PRODUCTION ERROR POINT: No persistence
│   │
│   └─> Graceful degradation if database unavailable
│
└─> Database Storage (Production)
    💾 Tables: unified_test_questions, test_sessions, test_results
    ⚠️ PRODUCTION ERROR POINT: Migration required for production

Question Types (21 total)
│
├─> General Question Types (9)
│   ├─> multiple_choice
│   ├─> true_false
│   ├─> fill_blank
│   ├─> matching
│   ├─> ordering
│   ├─> short_answer
│   ├─> essay
│   ├─> speaking
│   └─> translation
│
├─> IELTS-Specific (2)
│   ├─> map_diagram_labeling
│   └─> multiple_choice_multiple_answers
│
├─> TOEFL-Specific (1)
│   └─> text_completion_multiple_blanks
│
├─> GRE-Specific (2)
│   ├─> sentence_equivalence
│   └─> coherence_insertion
│
├─> PTE-Specific (4)
│   ├─> read_aloud
│   ├─> repeat_sentence
│   ├─> describe_image
│   └─> fill_blanks_drag_drop
│
└─> GMAT-Specific (3)
    ├─> data_sufficiency
    ├─> sentence_correction
    └─> two_part_analysis

Test Creation Flow (Admin/Teacher)
│
├──> GET /admin/admin-placement-test
│    └─> Test builder interface
│
├──> POST /api/unified-testing/questions
│    ├─> Validate question schema (Zod)
│    │   ⚠️ PRODUCTION ERROR POINT: Schema validation failures
│    │
│    ├─> Store question
│    │   💾 Map-based: questionsMap.set(id, question)
│    │   💾 Database: INSERT INTO unified_test_questions
│    │
│    └─> Return question ID
│
├──> POST /api/unified-testing/templates
│    ├─> Create test template
│    │   ├─> Define question selection rules
│    │   ├─> Set time limits, difficulty distribution
│    │   └─> Configure adaptive logic (optional)
│    │       🤖 IRT-based adaptive testing
│    │       ⚠️ PRODUCTION ERROR POINT: Complex IRT calculations
│    │
│    └─> Store template
│        💾 Map/Database: test_templates
│
└──> GET /api/unified-testing/templates/:id/preview
     └─> Preview test template with sample questions

Test Taking Flow (Student)
│
├──> POST /api/unified-testing/sessions/start
│    ├─> Create test session
│    │   ├─> Load template
│    │   ├─> Select questions (random/adaptive)
│    │   │   🤖 Adaptive: Based on student's previous performance
│    │   │   ⚠️ PRODUCTION ERROR POINT: Insufficient questions in pool
│    │   │
│    │   ├─> Generate session ID
│    │   └─> Store session state
│    │       💾 Map/Database: test_sessions
│    │       ⚠️ PRODUCTION ERROR POINT: Session state loss
│    │
│    └─> Return session data + first question
│
├──> GET /api/unified-testing/sessions/:id/question/:questionIndex
│    └─> Fetch next question
│        ├─> Check session validity
│        │   ⚠️ PRODUCTION ERROR POINT: Expired session
│        │
│        └─> Return question data (with audio URLs if applicable)
│            ⚠️ PRODUCTION ERROR POINT: Missing audio files
│
├──> POST /api/unified-testing/sessions/:id/submit-answer
│    ├─> Validate answer format
│    │   ⚠️ PRODUCTION ERROR POINT: Type mismatch
│    │
│    ├─> Score answer (type-specific logic)
│    │   ├─> Auto-scoring: multiple_choice, true_false, matching, etc.
│    │   ├─> Manual scoring required: essay, speaking
│    │   │   ⚠️ PRODUCTION ERROR POINT: Scoring queue overflow
│    │   │
│    │   └─> AI-assisted scoring (optional)
│    │       🤖 Ollama: Essay scoring, grammar analysis
│    │       🤖 Whisper: Speaking pronunciation scoring
│    │       ⚠️ PRODUCTION ERROR POINT: AI service unavailable
│    │
│    ├─> Update session progress
│    │   💾 Map/Database: test_sessions (answers, scores)
│    │
│    └─> Adaptive logic (if enabled)
│        🤖 Adjust next question difficulty based on IRT
│
└──> POST /api/unified-testing/sessions/:id/complete
     ├─> Finalize session
     │   ├─> Calculate total score
     │   ├─> Determine CEFR level (for placement tests)
     │   │   🤖 CEFR scoring service
     │   │   ⚠️ PRODUCTION ERROR POINT: CEFR calculation errors
     │   │
     │   └─> Generate test report
     │       💾 Insert: test_results
     │
     ├─> Award XP/achievements (if gamified)
     │
     └─> Return detailed results
         ├─> Overall score
         ├─> Section breakdowns
         ├─> CEFR level
         ├─> Strengths/weaknesses
         └─> Recommended courses

Analytics Flow
│
└──> GET /api/admin/stats
     ├─> Fetch unified testing analytics
     │   ├─> Total questions (by type)
     │   ├─> Total sessions completed
     │   ├─> Average scores
     │   ├─> Question type distribution
     │   │   ⚠️ PRODUCTION ERROR POINT: Large dataset aggregation
     │   │
     │   └─> Return to admin dashboard
     │       ✅ Displayed in "Question Bank Statistics" section
     │
     └─> GET /api/unified-testing/analytics/student/:id
         ├─> Student-specific analytics
         │   ├─> Test history
         │   ├─> Progress over time
         │   ├─> Skill strengths/weaknesses
         │   └─> Recommended practice areas
         │       🤖 AI-generated recommendations
```

---

## 6. PAYMENT & WALLET SYSTEM FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ Payment System: IRR-Based Wallet (Iranian Self-Hosting)         │
└─────────────────────────────────────────────────────────────────┘

Wallet Architecture
│
├─> Currency: Iranian Rial (IRR)
├─> Payment Gateway: Shetab (Iranian banking network)
└─> Member Tiers: Bronze, Silver, Gold, Platinum

Student Wallet Flow
│
├──> GET /api/wallet/balance
│    ├─> Fetch student wallet
│    │   💾 Query: wallets (WHERE user_id = ?)
│    │   ⚠️ PRODUCTION ERROR POINT: Missing wallet record
│    │
│    └─> Return balance, member tier
│
├──> POST /api/wallet/deposit
│    ├─> Initiate deposit via Shetab
│    │   🌐 Shetab Gateway API
│    │   ├─> Create payment request
│    │   ├─> Generate payment URL
│    │   │   ⚠️ PRODUCTION ERROR POINT: Gateway timeout
│    │   │   ⚠️ PRODUCTION ERROR POINT: Invalid merchant credentials
│    │   │
│    │   └─> Redirect to bank portal
│    │
│    ├─> Student completes payment on bank portal
│    │   ⚠️ PRODUCTION ERROR POINT: Payment abandonment
│    │   ⚠️ PRODUCTION ERROR POINT: Transaction timeout
│    │
│    └─> POST /api/wallet/shetab-callback (Webhook)
│        ├─> Verify transaction signature
│        │   ⚠️ PRODUCTION ERROR POINT: Signature mismatch = security breach
│        │
│        ├─> Verify transaction amount
│        │   ⚠️ PRODUCTION ERROR POINT: Amount tampering
│        │
│        ├─> Credit wallet
│        │   💾 Update: wallets (balance += amount)
│        │   💾 Insert: wallet_transactions
│        │   ⚠️ PRODUCTION ERROR POINT: Double-credit if callback duplicated
│        │
│        ├─> Update member tier (if threshold crossed)
│        │   💾 Update: wallets (member_tier)
│        │
│        └─> Send confirmation SMS
│            🌐 Kavenegar SMS
│            ⚠️ PRODUCTION ERROR POINT: SMS delivery failures
│
└──> POST /api/wallet/withdraw
     ├─> Validate withdrawal amount
     │   ⚠️ PRODUCTION ERROR POINT: Insufficient balance
     │   ⚠️ PRODUCTION ERROR POINT: Minimum withdrawal not met
     │
     ├─> Create withdrawal request
     │   💾 Insert: wallet_transactions (type: 'withdrawal', status: 'pending')
     │
     ├─> Admin approval required
     │   🔒 Manual verification
     │
     └─> Process withdrawal (Admin action)
         ├─> Deduct from wallet
         │   💾 Update: wallets (balance -= amount)
         │   💾 Update: wallet_transactions (status: 'completed')
         │
         └─> Transfer to student's bank account
             🌐 Shetab payout API
             ⚠️ PRODUCTION ERROR POINT: Payout failures

Course/Package Purchase Flow
│
├──> POST /api/enrollments
│    ├─> Check course price
│    ├─> Check wallet balance
│    │   ⚠️ PRODUCTION ERROR POINT: Insufficient funds
│    │
│    ├─> Deduct from wallet
│    │   💾 Update: wallets (balance -= price)
│    │   💾 Insert: wallet_transactions (type: 'purchase')
│    │   ⚠️ PRODUCTION ERROR POINT: Race condition on concurrent purchases
│    │
│    ├─> Create enrollment
│    │   💾 Insert: enrollments
│    │
│    └─> Send confirmation SMS
│
└──> POST /api/callern-packages/purchase
     ├─> Check package price
     ├─> Check wallet balance
     ├─> Deduct from wallet
     │   💾 Update: wallets, wallet_transactions
     │
     └─> Assign package
         💾 Insert: student_callern_packages

Admin Financial Management
│
├──> GET /api/admin/financial
│    └─> Financial dashboard
│        ├─> Total revenue (all time)
│        ├─> Revenue by month
│        ├─> Revenue by course
│        ├─> Revenue by package
│        ├─> Pending withdrawals
│        └─> Member tier distribution
│            ⚠️ PRODUCTION ERROR POINT: Large dataset aggregation
│
└──> POST /api/admin/wallet-transactions/export
     ├─> Generate CSV export
     │   ⚠️ PRODUCTION ERROR POINT: Large file size
     │
     └─> Return downloadable file
```

---

## 7. AI-POWERED FEATURES FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ AI Services: Ollama-Only Mode (Iranian Self-Hosting)            │
└─────────────────────────────────────────────────────────────────┘

AI Provider Architecture
│
├─> Ollama Provider (Primary)
│   🌐 Host: http://45.89.239.250:11434
│   🌐 Model: llama3.2b
│   ├─> Health check on startup
│   │   ⚠️ PRODUCTION ERROR POINT: Connection timeout (10s)
│   │
│   ├─> Graceful degradation if unavailable
│   │   ├─> App starts without AI features
│   │   └─> Fallback to rule-based logic
│   │
│   └─> Re-attempt connection on first AI request
│       ⚠️ PRODUCTION ERROR POINT: Persistent connection failures
│
└─> OpenAI Fallback: DISABLED
    🚫 Not available in Iran (sanctions)

AI Use Cases
│
├──> 1. AI Content Generation
│    ├─> POST /api/ai-training/generate-content
│    │   🤖 Generate lesson plans, exercises, quizzes
│    │   ├─> Input: Topic, level, language
│    │   ├─> Ollama prompt engineering
│    │   │   ⚠️ PRODUCTION ERROR POINT: Hallucinations in generated content
│    │   │   ⚠️ PRODUCTION ERROR POINT: Inappropriate content
│    │   │
│    │   └─> Return generated content
│    │       ⚠️ PRODUCTION ERROR POINT: Timeout on long generation (30s+)
│    │
│    └─> POST /api/content-bank/ai-generate
│        🤖 Generate reading passages, dialogues, vocabulary lists
│
├──> 2. AI Study Partner
│    ├─> POST /api/ai-study-partner/chat
│    │   🤖 Conversational AI for language practice
│    │   ├─> Maintain conversation context (in-memory)
│    │   ├─> Provide grammar corrections
│    │   ├─> Suggest vocabulary improvements
│    │   │   ⚠️ PRODUCTION ERROR POINT: Context window overflow
│    │   │
│    │   └─> Ollama streaming response
│    │       ⚠️ PRODUCTION ERROR POINT: Streaming interruptions
│    │
│    └─> POST /api/ai-study-partner/grammar-check
│        🤖 Grammar and style analysis
│
├──> 3. CallerN AI Supervisor (Real-time)
│    ├─> WebSocket: 'audio-chunk' events
│    │   ├─> Stream audio to Whisper (transcription)
│    │   │   🌐 Whisper service: http://localhost:8000
│    │   │   ⚠️ PRODUCTION ERROR POINT: Whisper service down
│    │   │   ⚠️ PRODUCTION ERROR POINT: Audio quality issues
│    │   │
│    │   ├─> Send transcript to Ollama (analysis)
│    │   │   🤖 Identify vocabulary, grammar issues
│    │   │   🤖 Calculate TTT ratio (Teacher Talk Time)
│    │   │   ⚠️ PRODUCTION ERROR POINT: High latency (500ms+)
│    │   │
│    │   └─> Socket.io: 'ai-suggestion' to teacher
│    │       ⚠️ PRODUCTION ERROR POINT: Suggestion flooding
│    │
│    └─> POST /api/callern/post-session-analysis
│        🤖 Generate comprehensive session report
│        ├─> Transcript summary
│        ├─> Vocabulary learned
│        ├─> Grammar issues
│        ├─> Pronunciation scores (Whisper)
│        └─> Recommended next topics
│            ⚠️ PRODUCTION ERROR POINT: Analysis timeout (60s+)
│
├──> 4. AI Sales Agent (24/7 Lead Engagement)
│    ├─> POST /api/ai-sales-agent/chat
│    │   🤖 Bilingual chatbot (Persian/English)
│    │   ├─> Answer FAQs about courses
│    │   ├─> Provide pricing information
│    │   ├─> Schedule placement tests
│    │   │   ⚠️ PRODUCTION ERROR POINT: Inaccurate information
│    │   │
│    │   └─> Escalate to human agent if needed
│    │
│    └─> POST /api/ai-webhooks/process-call
│        🤖 Process VoIP call transcripts
│        ├─> Extract lead information
│        ├─> Score lead quality
│        └─> Create CRM record
│            💾 Insert: scrapedLeads
│
├──> 5. AI Mentoring Recommendations
│    ├─> GET /api/mentoring/ai-recommendations/:studentId
│    │   🤖 Personalized learning path recommendations
│    │   ├─> Analyze student progress
│    │   ├─> Identify skill gaps
│    │   ├─> Generate tailored study plan
│    │   │   ⚠️ PRODUCTION ERROR POINT: Insufficient data for recommendations
│    │   │
│    │   └─> Return recommendations
│    │
│    └─> POST /api/mentoring/ai-feedback
│        🤖 AI-generated feedback on student work
│
├──> 6. AI-Powered Testing
│    ├─> POST /api/unified-testing/ai-generate-question
│    │   🤖 Generate test questions by topic/level
│    │   ⚠️ PRODUCTION ERROR POINT: Question quality inconsistency
│    │
│    └─> POST /api/unified-testing/ai-score-essay
│        🤖 Automated essay scoring
│        ├─> Analyze grammar, coherence, vocabulary
│        ├─> Assign CEFR level
│        └─> Provide detailed feedback
│            ⚠️ PRODUCTION ERROR POINT: Scoring accuracy issues
│
└──> 7. Social Media Content Generation
     └─> POST /api/social-media/generate-content
         🤖 Generate posts for 9 platforms
         ├─> Facebook, Instagram, Twitter, LinkedIn, Telegram
         ├─> YouTube, TikTok, WhatsApp, Email
         │   ⚠️ PRODUCTION ERROR POINT: Platform-specific format violations
         │
         └─> Multilingual support (Persian/English/Arabic)
```

---

## 8. EXTERNAL INTEGRATIONS FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ External Services (Iranian Self-Hosted Infrastructure)          │
└─────────────────────────────────────────────────────────────────┘

1. Kavenegar SMS Service
   │
   ├─> POST /api/sms/send (Rate Limited: 100 SMS/15min)
   │   ├─> Validate Iranian phone number
   │   │   ⚠️ PRODUCTION ERROR POINT: Invalid phone format
   │   │
   │   ├─> Generate idempotency key (UUID)
   │   │   ⚠️ PRODUCTION ERROR POINT: Duplicate SMS without idempotency
   │   │
   │   ├─> Call Kavenegar API
   │   │   🌐 https://api.kavenegar.com/v1/{API_KEY}/sms/send.json
   │   │   ⚠️ PRODUCTION ERROR POINT: API key missing/invalid
   │   │   ⚠️ PRODUCTION ERROR POINT: Network timeout
   │   │   ⚠️ PRODUCTION ERROR POINT: Rate limit exceeded (429)
   │   │   ⚠️ PRODUCTION ERROR POINT: Insufficient credit
   │   │
   │   ├─> Store SMS record
   │   │   💾 Insert: sms_logs
   │   │
   │   └─> Return status
   │
   ├─> POST /api/sms/send-bulk (Rate Limited: 10 bulk/hour)
   │   ├─> Validate recipients (max 500)
   │   │   ⚠️ PRODUCTION ERROR POINT: Recipient count exceeds limit
   │   │
   │   ├─> Call Kavenegar bulk API
   │   │   ⚠️ PRODUCTION ERROR POINT: Partial delivery failures
   │   │
   │   └─> Track delivery status
   │       💾 Insert: sms_campaigns
   │
   └─> SMS Reminder Worker (Background)
       ├─> Runs every 60 seconds
       ├─> Query upcoming classes/sessions
       │   💾 Query: class_sessions, trial_lessons
       │
       ├─> Send reminders 24h, 1h before
       │   🌐 Kavenegar API
       │   ⚠️ PRODUCTION ERROR POINT: Worker crash loops
       │
       └─> Mark as sent
           💾 Update: class_sessions (reminder_sent = true)

2. Isabel VoIP Service
   │
   ├─> POST /api/admin/diagnostic-voip
   │   ├─> Test VoIP line connectivity
   │   │   🌐 SIP trunk: Isabel VoIP
   │   │   ⚠️ PRODUCTION ERROR POINT: SIP registration failures
   │   │   ⚠️ PRODUCTION ERROR POINT: Audio codec mismatches
   │   │
   │   └─> Return diagnostics
   │
   ├─> POST /api/admin/test-voip
   │   ├─> Initiate test call
   │   │   ⚠️ PRODUCTION ERROR POINT: Call routing failures
   │   │   ⚠️ PRODUCTION ERROR POINT: NAT/firewall blocking
   │   │
   │   └─> Record call quality metrics
   │
   └─> CallerN VoIP Integration
       ├─> Inbound calls routed to call center
       ├─> Outbound calls for lead follow-ups
       │   ⚠️ PRODUCTION ERROR POINT: Concurrent call limits
       │
       └─> Call recording storage
           ⚠️ PRODUCTION ERROR POINT: Storage quota exceeded

3. Shetab Payment Gateway
   │
   ├─> POST /api/admin/test/shetab
   │   ├─> Test gateway connectivity
   │   │   🌐 Shetab merchant portal
   │   │   ⚠️ PRODUCTION ERROR POINT: Merchant credentials invalid
   │   │   ⚠️ PRODUCTION ERROR POINT: Gateway maintenance
   │   │
   │   └─> Return test transaction result
   │
   ├─> Payment Flow (see Section 6)
   │   ⚠️ PRODUCTION ERROR POINT: Transaction timeout
   │   ⚠️ PRODUCTION ERROR POINT: Callback URL unreachable
   │
   └─> Settlement & Reconciliation
       ├─> Daily settlement reports
       ├─> Transaction verification
       │   ⚠️ PRODUCTION ERROR POINT: Settlement amount mismatches
       │
       └─> Dispute resolution
           💾 Insert: payment_disputes

4. Third-Party Calendar Integration (keybit.ir)
   │
   ├─> GET /api/third-party/calendar/sync
   │   ├─> Sync with external Iranian calendar service
   │   │   🌐 keybit.ir API
   │   │   ⚠️ PRODUCTION ERROR POINT: API changes breaking integration
   │   │
   │   └─> Update local calendar
   │       💾 Insert: calendar_events_iranian
   │
   └─> Persian Calendar Support
       ├─> Jalali (Shamsi) calendar conversion
       ├─> Iranian holidays database
       └─> Prayer times integration
           ⚠️ PRODUCTION ERROR POINT: Date conversion errors

5. Social Media Scraping (9 Platforms)
   │
   ├─> POST /api/social-media-scraper/start-job
   │   ├─> Configure scraping job
   │   │   ├─> Facebook, Instagram, Twitter, LinkedIn, Telegram
   │   │   ├─> YouTube, TikTok, WhatsApp, Email
   │   │   └─> Competitor analysis
   │   │
   │   ├─> Schedule scraper
   │   │   💾 Insert: scrape_jobs
   │   │   ⚠️ PRODUCTION ERROR POINT: Rate limiting from platforms
   │   │   ⚠️ PRODUCTION ERROR POINT: Platform API changes
   │   │   ⚠️ PRODUCTION ERROR POINT: CAPTCHA challenges
   │   │
   │   └─> Store scraped data
   │       💾 Insert: scrapedLeads, competitorPrices, marketTrends
   │
   └─> GET /api/social-media-scraper/jobs
       └─> Monitor scraping jobs
           ⚠️ PRODUCTION ERROR POINT: Job failures not detected
```

---

## 9. ERROR HANDLING & PRODUCTION RISKS

```
┌─────────────────────────────────────────────────────────────────┐
│ Production Error Points Summary (Categorized by Severity)       │
└─────────────────────────────────────────────────────────────────┘

CRITICAL (System Crash / Data Loss)
│
├─> ⚠️ Missing JWT_SECRET in production → App exits immediately
├─> ⚠️ DATABASE_URL missing → Cannot start server
├─> ⚠️ Ollama connection timeout → Graceful degradation, but AI features disabled
├─> ⚠️ Shetab payment callback signature mismatch → Security breach
├─> ⚠️ Wallet double-credit from duplicate callbacks → Financial loss
├─> ⚠️ Race conditions on concurrent wallet deductions → Incorrect balance
├─> ⚠️ Memory leaks from abandoned CallerN rooms → Server OOM crash
├─> ⚠️ UnifiedTesting Map-based storage → Data loss on restart (Dev only)
├─> ⚠️ WebSocket state desync → Teachers appear online when offline
└─> ⚠️ LinguaQuest feedback table missing → INSERT failures (see replit.md SQL)

HIGH (Feature Broken / Degraded UX)
│
├─> ⚠️ Kavenegar API key invalid → No SMS notifications
├─> ⚠️ Whisper service down → No speech-to-text features
├─> ⚠️ TTS audio file missing → Silent lessons
├─> ⚠️ CallerN WebRTC NAT traversal failures → Cannot establish calls
├─> ⚠️ Shetab gateway timeout → Payment failures
├─> ⚠️ Insufficient CallernPackage minutes → Call termination
├─> ⚠️ No available teachers → Students cannot initiate calls
├─> ⚠️ Social media scraper CAPTCHA → Lead generation stops
├─> ⚠️ Isabel VoIP SIP registration failures → No inbound calls
└─> ⚠️ Large dataset aggregation on admin analytics → Slow dashboard

MEDIUM (Recoverable Errors)
│
├─> ⚠️ SMS rate limit exceeded (100/15min) → Delayed delivery
├─> ⚠️ Bulk SMS limit exceeded (10/hour) → Queued for later
├─> ⚠️ Ollama AI hallucinations → Generated content requires review
├─> ⚠️ AI content generation timeout (30s+) → Retry with fallback
├─> ⚠️ CallerN AI suggestion flooding → Muted suggestions
├─> ⚠️ Audio upload failures → Retry mechanism
├─> ⚠️ LinguaQuest guest session expiry → Progress lost (by design)
├─> ⚠️ Test session expiry → Student must restart
├─> ⚠️ Orphaned audio files accumulate → Manual cleanup needed
└─> ⚠️ Concurrent edit conflicts on lesson updates → Last write wins

LOW (Logging / Monitoring)
│
├─> ⚠️ Missing telemetry for analytics fetch failures
├─> ⚠️ No alerts for worker crash loops
├─> ⚠️ Insufficient logging for payment disputes
└─> ⚠️ No monitoring for disk space (audio/video storage)

Mitigation Strategies Implemented
│
├─> ✅ Graceful degradation for Ollama/Whisper unavailability
├─> ✅ Rate limiting on SMS endpoints (express-rate-limit)
├─> ✅ Idempotency keys for SMS sending (UUID validation)
├─> ✅ JWT token expiration handling (refresh token flow)
├─> ✅ Input validation with Zod schemas
├─> ✅ Health monitoring service for AI providers
├─> ✅ WebSocket cleanup on disconnect
├─> ✅ Database connection retries
├─> ✅ CORS configuration for cross-origin requests
└─> ✅ Production environment variable validation
```

---

## 10. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ Complete Data Flow (Client → Server → Database → External)      │
└─────────────────────────────────────────────────────────────────┘

Client (React SPA)
    │
    ├─> Authentication
    │   └─> POST /api/login
    │       ├─> JWT tokens returned
    │       └─> Stored in localStorage
    │           ⚠️ PRODUCTION ERROR POINT: XSS vulnerability if not sanitized
    │
    ├─> API Requests (Authenticated)
    │   ├─> Authorization: Bearer <token>
    │   ├─> TanStack React Query (caching)
    │   │   └─> Automatic cache invalidation on mutations
    │   │       ⚠️ PRODUCTION ERROR POINT: Stale data if invalidation fails
    │   │
    │   └─> apiRequest helper function
    │       ├─> POST/PATCH/DELETE requests
    │       └─> Error handling with toast notifications
    │
    ├─> WebSocket Connections (Real-time)
    │   ├─> Socket.io client
    │   ├─> Authenticate on connection
    │   │   └─> socket.emit('authenticate', { userId, role })
    │   │
    │   ├─> Listen for events:
    │   │   ├─> teacher-status-update
    │   │   ├─> incoming-call
    │   │   ├─> ai-suggestion
    │   │   ├─> low-minutes-warning
    │   │   └─> notification events
    │   │
    │   └─> Emit events:
    │       ├─> webrtc-offer/answer
    │       ├─> audio-chunk (AI supervisor)
    │       ├─> end-call
    │       └─> chat-message
    │
    └─> File Uploads
        ├─> FormData for multipart/form-data
        ├─> Teacher photos, student photos
        │   ⚠️ PRODUCTION ERROR POINT: Large file size validation
        │   ⚠️ PRODUCTION ERROR POINT: File type validation bypass
        │
        └─> Stored in /uploads/

Server (Express.js)
    │
    ├─> Request Pipeline
    │   ├─> CORS headers (allow all origins)
    │   │   ⚠️ PRODUCTION ERROR POINT: Overly permissive CORS
    │   │
    │   ├─> JSON body parser
    │   ├─> URL-encoded parser
    │   │
    │   ├─> Authentication middleware (authenticateToken)
    │   │   ├─> Verify JWT signature
    │   │   │   ⚠️ PRODUCTION ERROR POINT: Token expiration not handled
    │   │   └─> Attach user to req.user
    │   │
    │   └─> Authorization middleware (requireRole)
    │       └─> Check user.role against allowed roles
    │
    ├─> Route Handlers (73+ files)
    │   ├─> Validate request body (Zod schemas)
    │   │   ⚠️ PRODUCTION ERROR POINT: Validation bypass
    │   │
    │   ├─> Business logic (business-logic-utils.ts)
    │   │   ├─> filterTeachers, filterStudents
    │   │   ├─> calculatePercentage, calculateAttendanceRate
    │   │   └─> validateActiveTeacher
    │   │
    │   ├─> Storage operations (storage.ts interface)
    │   │   ├─> DatabaseStorage (production)
    │   │   └─> MemStorage (development)
    │   │
    │   └─> Return JSON response
    │
    ├─> WebSocket Server (websocket-server.ts)
    │   ├─> Socket.io event handlers
    │   ├─> In-memory state:
    │   │   ├─> activeRooms Map<roomId, CallRoom>
    │   │   ├─> teacherSockets Map<teacherId, TeacherSocket>
    │   │   ├─> studentSockets Map<studentId, socketId>
    │   │   └─> userSockets Map<socketId, UserSocket>
    │   │       ⚠️ PRODUCTION ERROR POINT: State lost on server restart
    │   │
    │   └─> Room lifecycle management
    │       ├─> Create room on call initiate
    │       ├─> Cleanup on disconnect
    │       │   ⚠️ PRODUCTION ERROR POINT: Cleanup failures leak memory
    │       └─> Timer-based minute tracking
    │
    └─> Background Workers
        ├─> SMS Reminder Worker (60s interval)
        │   ├─> Query upcoming sessions
        │   ├─> Send reminders via Kavenegar
        │   │   ⚠️ PRODUCTION ERROR POINT: Worker crash restarts
        │   └─> Mark as sent
        │
        ├─> Content Generation Worker
        │   └─> Process queued content generation jobs
        │
        └─> IRT Processing Worker
            └─> Process adaptive test calculations

Database (PostgreSQL - Neon)
    │
    ├─> Connection
    │   🌐 ep-curly-hat-a5e23m8e.us-east-2.aws.neon.tech
    │   ⚠️ PRODUCTION ERROR POINT: Connection pool exhaustion
    │   ⚠️ PRODUCTION ERROR POINT: SSL certificate expiry
    │
    ├─> Schema (shared/schema.ts)
    │   ├─> Drizzle ORM (code-first)
    │   ├─> 50+ tables:
    │   │   ├─> users, courses, enrollments
    │   │   ├─> wallets, wallet_transactions
    │   │   ├─> callern_call_history, callern_packages
    │   │   ├─> linguaquest_lessons, linguaquest_lesson_feedback
    │   │   ├─> unified_test_questions, test_sessions
    │   │   ├─> gamification_challenges, achievements
    │   │   └─> 40+ more tables
    │   │
    │   └─> Migrations
    │       ├─> npm run db:push (no manual SQL migrations)
    │       ⚠️ PRODUCTION ERROR POINT: drizzle-kit push timeout on large schemas
    │       ⚠️ PRODUCTION ERROR POINT: linguaquest_lesson_feedback table missing
    │           → Manual SQL in replit.md required for production
    │
    ├─> Queries (Drizzle queries)
    │   ├─> SELECT with filters (eq, and, or, like, gte, lte)
    │   ├─> INSERT with .values()
    │   ├─> UPDATE with .set()
    │   ├─> DELETE with .where()
    │   │   ⚠️ PRODUCTION ERROR POINT: N+1 query problems
    │   │   ⚠️ PRODUCTION ERROR POINT: Missing indexes on large tables
    │   │
    │   └─> Transactions
    │       └─> db.transaction() for atomic operations
    │
    └─> Indexes & Performance
        ⚠️ PRODUCTION ERROR POINT: No explicit indexes defined
        ⚠️ PRODUCTION ERROR POINT: Full table scans on analytics queries

External Services
    │
    ├─> Ollama (AI)
    │   🌐 http://45.89.239.250:11434
    │   ├─> Model: llama3.2b
    │   ├─> Streaming API for chat
    │   ├─> Completion API for content generation
    │   │   ⚠️ PRODUCTION ERROR POINT: Timeout 10s
    │   │   ⚠️ PRODUCTION ERROR POINT: Model not downloaded
    │   └─> Graceful degradation if unavailable
    │
    ├─> Whisper (Speech-to-Text)
    │   🌐 http://localhost:8000
    │   ├─> Transcription API
    │   ├─> Used for: CallerN AI supervisor, pronunciation scoring
    │   │   ⚠️ PRODUCTION ERROR POINT: Service not running
    │   └─> Graceful degradation if unavailable
    │
    ├─> Edge TTS (Text-to-Speech)
    │   ✅ Self-hosted (no external API)
    │   ├─> Generate audio for LinguaQuest lessons
    │   ├─> Hash-based caching (MD5 of text+language+voice)
    │   │   ⚠️ PRODUCTION ERROR POINT: TTS synthesis failures
    │   └─> Storage: /uploads/linguaquest-audio/
    │
    ├─> Kavenegar (SMS)
    │   🌐 https://api.kavenegar.com
    │   ├─> Send SMS API
    │   ├─> Bulk SMS API
    │   │   ⚠️ PRODUCTION ERROR POINT: API key invalid
    │   │   ⚠️ PRODUCTION ERROR POINT: Rate limiting
    │   └─> Delivery status webhook
    │
    ├─> Isabel VoIP (Telephony)
    │   🌐 Iranian SIP trunk
    │   ├─> Inbound/outbound calls
    │   ├─> Call routing
    │   │   ⚠️ PRODUCTION ERROR POINT: SIP registration failures
    │   └─> Call recording storage
    │
    └─> Shetab (Payment Gateway)
        🌐 Iranian banking network
        ├─> Payment request API
        ├─> Transaction verification API
        │   ⚠️ PRODUCTION ERROR POINT: Gateway timeout
        │   ⚠️ PRODUCTION ERROR POINT: Callback URL unreachable
        └─> Settlement reports API
```

---

## SUMMARY OF CRITICAL PRODUCTION ERROR POINTS

### Top 20 Critical Issues to Monitor:

1. **JWT_SECRET Missing** → App crash on startup
2. **Ollama Connection Failures** → AI features disabled
3. **Whisper Service Down** → No speech-to-text
4. **Kavenegar SMS API Failures** → No notifications
5. **Shetab Payment Callback Issues** → Double-credit or lost payments
6. **WebSocket State Desync** → Teacher availability incorrect
7. **CallerN Room Memory Leaks** → Server crash
8. **Wallet Race Conditions** → Incorrect balances
9. **Database Connection Pool Exhaustion** → App freeze
10. **TTS Audio File Missing** → Silent lessons
11. **WebRTC NAT Traversal Failures** → Cannot establish calls
12. **Isabel VoIP SIP Failures** → No inbound calls
13. **UnifiedTesting Data Loss** → Map-based storage resets on restart
14. **linguaquest_lesson_feedback Table Missing** → INSERT failures
15. **SMS Rate Limiting** → Delivery delays
16. **Large Dataset Analytics** → Slow admin dashboard
17. **Drizzle Push Timeout** → Migration failures
18. **File Upload Size Limits** → Upload failures
19. **Social Media Scraper CAPTCHA** → Lead generation stops
20. **Worker Crash Loops** → Background tasks fail

---

**Generated from codebase analysis on:** October 17, 2025
**Based on:** Actual code structure, not documentation
**Files analyzed:** 200+ server files, 150+ client files, 50+ database tables
