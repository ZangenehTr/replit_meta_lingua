# MetaLingua System - Visual Diagrams
**Complete System Architecture Visualization**

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer (React SPA)"
        WebApp[Web Application<br/>React + TypeScript]
        MobileApp[Mobile Responsive UI<br/>Touch-optimized]
        WebSocket[WebSocket Client<br/>Socket.io]
    end

    subgraph "Server Layer (Express.js)"
        API[REST API Server<br/>Port 5000]
        WS[WebSocket Server<br/>Socket.io]
        Auth[JWT Authentication<br/>8 User Roles]
        Routes[73+ Route Modules]
        Workers[Background Workers<br/>SMS, Content Gen, IRT]
    end

    subgraph "Storage Layer"
        DB[(PostgreSQL<br/>Neon Database<br/>50+ Tables)]
        Memory[In-Memory Storage<br/>Maps, Caching]
        Files[File System<br/>Uploads, Audio, Video]
    end

    subgraph "AI Services (Self-Hosted)"
        Ollama[Ollama AI<br/>45.89.239.250:11434<br/>Model: llama3.2b]
        Whisper[Whisper STT<br/>localhost:8000]
        EdgeTTS[Edge TTS<br/>Self-hosted]
    end

    subgraph "External Services (Iranian)"
        Kavenegar[Kavenegar SMS<br/>Iranian Provider]
        Isabel[Isabel VoIP<br/>Iranian Telecom]
        Shetab[Shetab Gateway<br/>Iranian Banking]
        KeybitCal[keybit.ir<br/>Persian Calendar]
    end

    WebApp --> API
    MobileApp --> API
    WebApp --> WebSocket
    WebSocket --> WS
    
    API --> Auth
    API --> Routes
    Routes --> DB
    Routes --> Memory
    Routes --> Files
    Routes --> Ollama
    Routes --> Whisper
    Routes --> EdgeTTS
    Routes --> Kavenegar
    Routes --> Isabel
    Routes --> Shetab
    Routes --> KeybitCal
    
    Workers --> DB
    Workers --> Kavenegar
    
    WS --> Memory
    WS --> DB

    style Ollama fill:#ff6b6b,color:#fff
    style Whisper fill:#ff6b6b,color:#fff
    style Kavenegar fill:#ffa726,color:#fff
    style Isabel fill:#ffa726,color:#fff
    style Shetab fill:#ffa726,color:#fff
    style DB fill:#4caf50,color:#fff
```

**Legend:**
- 🔴 Red: AI Services (may be unavailable)
- 🟠 Orange: External Iranian Services (network dependent)
- 🟢 Green: Critical Database

---

## 2. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant Auth as Auth Middleware
    participant DB as Database
    participant SMS as Kavenegar SMS

    User->>Client: Enter credentials
    Client->>API: POST /api/login<br/>{email, password}
    API->>DB: Query users table
    DB-->>API: User record
    API->>API: Bcrypt verify password
    
    alt Password Valid
        API->>API: Generate JWT tokens<br/>(Access + Refresh)
        API-->>Client: {user, accessToken, refreshToken}
        Client->>Client: Store in localStorage
        Client-->>User: Redirect to dashboard
    else Password Invalid
        API-->>Client: 401 Unauthorized
        Client-->>User: Show error
    end

    Note over User,SMS: Alternative: OTP Login

    User->>Client: Request OTP
    Client->>API: POST /api/login-otp<br/>{phone}
    API->>SMS: Send OTP via Kavenegar
    SMS-->>User: SMS with OTP code
    User->>Client: Enter OTP
    Client->>API: POST /api/verify-otp<br/>{phone, otp}
    API->>API: Verify OTP
    API-->>Client: {user, tokens}

    Note over User,DB: Protected Endpoint Access

    Client->>API: GET /api/student/dashboard<br/>Authorization: Bearer <token>
    API->>Auth: authenticateToken()
    Auth->>Auth: Verify JWT signature
    Auth->>Auth: Check expiration
    Auth->>API: Attach user to request
    API->>Auth: requireRole(['Student'])
    Auth->>Auth: Check user.role
    
    alt Role Authorized
        API->>DB: Fetch dashboard data
        DB-->>API: Dashboard metrics
        API-->>Client: Dashboard data
    else Role Denied
        API-->>Client: 403 Forbidden
    end

    Note over Client,API: Token Refresh
    Client->>API: POST /api/auth/refresh<br/>{refreshToken}
    API->>API: Verify refresh token
    API->>API: Generate new access token
    API-->>Client: {newAccessToken}
```

---

## 3. LinguaQuest Free Learning Platform Flow

```mermaid
graph TB
    subgraph "Guest Access (No Auth Required)"
        Home[LinguaQuest Home<br/>/linguaquest]
        Browse[Browse Lessons<br/>By category/level]
        SessionToken[Generate Session Token<br/>localStorage]
    end

    subgraph "Lesson Selection"
        API1[GET /api/linguaquest/lessons]
        DB1[(linguaquest_lessons<br/>WHERE published = true)]
        LessonList[Lesson List UI<br/>19 Activity Types]
    end

    subgraph "Lesson Playback"
        API2[GET /api/linguaquest/lessons/:id]
        DB2[(Full lesson data<br/>+ activities)]
        AudioFiles[Pre-generated TTS Audio<br/>/uploads/linguaquest-audio/]
        LessonUI[Interactive Lesson UI<br/>Audio + Exercises]
    end

    subgraph "Answer Submission"
        Submit[Student submits answers]
        API3[POST /api/linguaquest/lessons/:id/submit]
        Scoring[Auto-scoring Engine<br/>19 activity types]
        XPCalc[Calculate XP, Streak, Score]
        Storage[Store Progress<br/>Guest: Memory<br/>User: Database]
    end

    subgraph "Feedback & Analytics"
        Feedback[POST /api/linguaquest/lessons/:id/feedback]
        FeedbackDB[(linguaquest_lesson_feedback)]
        Analytics[Admin Analytics Dashboard]
    end

    subgraph "Admin Management"
        AdminUI[Admin LinguaQuest Dashboard<br/>/admin/linguaquest]
        CRUD[Lesson CRUD Operations]
        AudioGen[TTS Audio Generation<br/>POST /api/linguaquest/audio/generate]
        Jobs[Real-time Job Monitoring]
    end

    Home --> Browse
    Browse --> SessionToken
    Browse --> API1
    API1 --> DB1
    DB1 --> LessonList
    LessonList --> API2
    API2 --> DB2
    API2 --> AudioFiles
    DB2 --> LessonUI
    AudioFiles --> LessonUI
    
    LessonUI --> Submit
    Submit --> API3
    API3 --> Scoring
    Scoring --> XPCalc
    XPCalc --> Storage
    
    Submit --> Feedback
    Feedback --> FeedbackDB
    FeedbackDB --> Analytics
    
    AdminUI --> CRUD
    CRUD --> DB1
    CRUD --> AudioGen
    AudioGen --> AudioFiles
    AudioGen --> Jobs

    style AudioFiles fill:#ffeb3b,color:#000
    style FeedbackDB fill:#f44336,color:#fff
    style Storage fill:#4caf50,color:#fff
```

**19 Activity Types:**
1. Multiple Choice
2. True/False
3. Fill in Blank
4. Sentence Reordering
5. Image Selection
6. Spelling
7. Listening Comprehension
8. Pronunciation (Whisper AI)
9. Grammar Correction
10. Vocabulary Matching
11. Reading Comprehension
12. Dialogue Completion
13. Translation
14. Word Formation
15. Error Detection
16. Matching Pairs
17. Gap Fill
18. Cloze Test
19. Dictation

---

## 4. CallerN 24/7 Video Tutoring Flow

```mermaid
sequenceDiagram
    participant Student
    participant Teacher
    participant Client
    participant API
    participant WS as WebSocket Server
    participant DB as Database
    participant AI as AI Services<br/>(Ollama + Whisper)
    participant WebRTC

    Note over Student,DB: Step 1: Teacher Goes Online

    Teacher->>Client: Toggle CallerN availability
    Client->>WS: socket.emit('authenticate')<br/>{userId, role: 'teacher', enableCallern: true}
    WS->>WS: Store in teacherSockets Map
    WS->>DB: Update teacher_callern_availability
    WS->>Client: Broadcast teacher-status-update
    Client-->>Teacher: Status: Online

    Note over Student,WebRTC: Step 2: Student Initiates Call

    Student->>Client: Click "Start Video Call"
    Client->>API: POST /api/callern/initiate-call<br/>{teacherId, packageId}
    API->>DB: Check student_callern_packages
    
    alt Insufficient Minutes
        API-->>Client: 400 Insufficient minutes
        Client-->>Student: Show error + purchase option
    else Has Minutes
        API->>API: Create unique roomId
        API->>WS: Create room in activeRooms Map
        API->>DB: INSERT callern_call_history<br/>(status: 'pending')
        WS->>Teacher: socket.emit('incoming-call')<br/>{roomId, studentName}
        WS->>Student: socket.emit('call-initiated')<br/>{roomId}
        API-->>Client: {roomId, status: 'pending'}
    end

    Note over Student,WebRTC: Step 3: WebRTC Connection

    Teacher->>Client: Accept call
    Client->>WS: socket.emit('accept-call')<br/>{roomId}
    
    Student->>WebRTC: Create PeerConnection
    Student->>WebRTC: Generate SDP Offer
    Student->>WS: socket.emit('webrtc-offer')<br/>{roomId, offer}
    WS->>Teacher: Forward offer
    
    Teacher->>WebRTC: Create PeerConnection
    Teacher->>WebRTC: Generate SDP Answer
    Teacher->>WS: socket.emit('webrtc-answer')<br/>{roomId, answer}
    WS->>Student: Forward answer
    
    Student->>WS: socket.emit('ice-candidate')<br/>{candidate}
    WS->>Teacher: Forward ICE candidate
    Teacher->>WS: socket.emit('ice-candidate')<br/>{candidate}
    WS->>Student: Forward ICE candidate
    
    WebRTC-->>Student: P2P Connection Established
    WebRTC-->>Teacher: P2P Connection Established

    Note over Student,AI: Step 4: Call In Progress (AI Features)

    loop Every Audio Chunk
        Student->>WS: socket.emit('audio-chunk')<br/>{roomId, audioData}
        WS->>AI: Send to Whisper (transcription)
        AI-->>WS: Transcript text
        WS->>AI: Send to Ollama (analysis)
        AI-->>WS: Vocabulary suggestions<br/>Grammar corrections<br/>TTT ratio
        WS->>Teacher: socket.emit('ai-suggestion')<br/>{suggestions}
    end

    loop Every Minute
        WS->>WS: Update room timer
        WS->>DB: UPDATE student_callern_packages<br/>(minutes_used += 1)
        
        alt 5 Minutes Remaining
            WS->>Student: socket.emit('low-minutes-warning')
        end
        
        alt 0 Minutes Remaining
            WS->>Student: socket.emit('call-ended')<br/>{reason: 'no-minutes'}
            WS->>Teacher: socket.emit('call-ended')<br/>{reason: 'no-minutes'}
        end
    end

    Note over Student,DB: Step 5: Call End

    Student->>Client: End call button
    Client->>WS: socket.emit('end-call')<br/>{roomId}
    WS->>WebRTC: Close peer connections
    WS->>WS: Remove from activeRooms Map
    WS->>DB: UPDATE callern_call_history<br/>(end_time, total_minutes, status: 'completed')
    
    WS->>AI: POST /api/callern/post-session-analysis
    AI->>AI: Generate session report<br/>- Transcript summary<br/>- Vocabulary learned<br/>- Grammar issues<br/>- Pronunciation scores
    AI-->>WS: Session report
    WS->>DB: INSERT callern_session_reports
    
    WS->>Student: socket.emit('request-rating')
    WS->>Teacher: socket.emit('request-rating')
    
    Student->>Client: Submit rating
    Client->>API: POST /api/callern/rate-session<br/>{sessionId, rating, feedback}
    API->>DB: UPDATE callern_call_history<br/>(student_rating, student_feedback)
    API->>DB: UPDATE teacher_qa_metrics
```

---

## 5. Unified Testing System (21 Question Types)

```mermaid
graph TB
    subgraph "Test Creation (Admin/Teacher)"
        AdminUI[Admin Test Builder<br/>/admin/admin-placement-test]
        CreateQ[Create Question<br/>POST /api/unified-testing/questions]
        ValidateQ[Zod Schema Validation<br/>21 question types]
        StoreQ[Store Question<br/>Map/Database]
        CreateTemplate[Create Test Template<br/>POST /api/unified-testing/templates]
        AdaptiveRules[Configure Adaptive Logic<br/>IRT-based selection]
    end

    subgraph "Question Types"
        General[General Types 9<br/>multiple_choice<br/>true_false<br/>fill_blank<br/>matching<br/>ordering<br/>short_answer<br/>essay<br/>speaking<br/>translation]
        
        IELTS[IELTS-Specific 2<br/>map_diagram_labeling<br/>multiple_choice_multiple_answers]
        
        TOEFL[TOEFL-Specific 1<br/>text_completion_multiple_blanks]
        
        GRE[GRE-Specific 2<br/>sentence_equivalence<br/>coherence_insertion]
        
        PTE[PTE-Specific 4<br/>read_aloud<br/>repeat_sentence<br/>describe_image<br/>fill_blanks_drag_drop]
        
        GMAT[GMAT-Specific 3<br/>data_sufficiency<br/>sentence_correction<br/>two_part_analysis]
    end

    subgraph "Test Taking (Student)"
        StartSession[POST /api/unified-testing/sessions/start<br/>{templateId}]
        LoadTemplate[Load Template Config]
        SelectQuestions[Select Questions<br/>Random or Adaptive IRT]
        CreateSession[Create Session<br/>sessionId + state]
        
        FetchQ[GET /api/unified-testing/sessions/:id/question/:index]
        DisplayQ[Display Question<br/>+ Audio if applicable]
        
        SubmitA[POST /api/unified-testing/sessions/:id/submit-answer<br/>{questionId, answer}]
        ScoreAnswer[Type-specific Scoring<br/>Auto or Manual]
        AIScore[AI-Assisted Scoring<br/>Ollama: Essays<br/>Whisper: Speaking]
        UpdateSession[Update Session Progress]
        AdaptiveLogic[Adjust Next Question<br/>IRT difficulty]
        
        CompleteTest[POST /api/unified-testing/sessions/:id/complete]
        CalcScore[Calculate Total Score]
        CEFRLevel[Determine CEFR Level]
        GenerateReport[Generate Test Report]
        StoreResults[Store Results<br/>test_results table]
    end

    subgraph "Analytics"
        AdminStats[GET /api/admin/stats]
        FetchAnalytics[Fetch Unified Testing Analytics<br/>- Total questions by type<br/>- Total sessions<br/>- Question type distribution]
        Display[Display in Admin Dashboard<br/>Question Bank Statistics]
    end

    AdminUI --> CreateQ
    CreateQ --> ValidateQ
    ValidateQ --> General
    ValidateQ --> IELTS
    ValidateQ --> TOEFL
    ValidateQ --> GRE
    ValidateQ --> PTE
    ValidateQ --> GMAT
    General --> StoreQ
    IELTS --> StoreQ
    TOEFL --> StoreQ
    GRE --> StoreQ
    PTE --> StoreQ
    GMAT --> StoreQ
    
    AdminUI --> CreateTemplate
    CreateTemplate --> AdaptiveRules
    AdaptiveRules --> StoreQ
    
    StartSession --> LoadTemplate
    LoadTemplate --> SelectQuestions
    SelectQuestions --> CreateSession
    CreateSession --> FetchQ
    FetchQ --> DisplayQ
    DisplayQ --> SubmitA
    SubmitA --> ScoreAnswer
    ScoreAnswer --> AIScore
    AIScore --> UpdateSession
    UpdateSession --> AdaptiveLogic
    AdaptiveLogic --> FetchQ
    UpdateSession --> CompleteTest
    CompleteTest --> CalcScore
    CalcScore --> CEFRLevel
    CEFRLevel --> GenerateReport
    GenerateReport --> StoreResults
    
    StoreResults --> AdminStats
    AdminStats --> FetchAnalytics
    FetchAnalytics --> Display

    style General fill:#2196f3,color:#fff
    style IELTS fill:#ff9800,color:#fff
    style TOEFL fill:#4caf50,color:#fff
    style GRE fill:#9c27b0,color:#fff
    style PTE fill:#f44336,color:#fff
    style GMAT fill:#00bcd4,color:#fff
    style AIScore fill:#ff6b6b,color:#fff
```

---

## 6. Payment & Wallet System Flow

```mermaid
sequenceDiagram
    participant Student
    participant Client
    participant API
    participant DB as Database
    participant Shetab as Shetab Gateway<br/>(Iranian Banking)
    participant SMS as Kavenegar SMS

    Note over Student,SMS: Wallet Deposit Flow

    Student->>Client: Request wallet deposit
    Client->>API: POST /api/wallet/deposit<br/>{amount: 500000 IRR}
    API->>DB: Check wallet record
    API->>Shetab: Create payment request<br/>{amount, merchantId, callbackUrl}
    Shetab-->>API: {paymentId, paymentUrl}
    API-->>Client: {paymentUrl}
    Client-->>Student: Redirect to bank portal
    
    Student->>Shetab: Complete payment on bank portal<br/>(Enter card details, OTP)
    Shetab->>Shetab: Process transaction
    
    alt Payment Successful
        Shetab->>API: POST /api/wallet/shetab-callback<br/>{paymentId, amount, signature}
        API->>API: Verify signature<br/>(CRITICAL: Prevent fraud)
        API->>API: Verify amount matches
        API->>DB: BEGIN TRANSACTION
        API->>DB: UPDATE wallets<br/>(balance += amount)
        API->>DB: INSERT wallet_transactions<br/>(type: 'deposit', status: 'completed')
        API->>DB: Check member tier threshold
        
        alt Tier Upgrade
            API->>DB: UPDATE wallets<br/>(member_tier = 'Silver')
        end
        
        API->>DB: COMMIT TRANSACTION
        API->>SMS: Send confirmation SMS<br/>"Deposit successful: 500,000 IRR"
        SMS-->>Student: SMS notification
        Shetab-->>Student: Redirect to success page
        API-->>Client: {success: true, newBalance}
        Client-->>Student: Show success message
    else Payment Failed
        Shetab-->>Student: Redirect to failure page
        API->>DB: INSERT wallet_transactions<br/>(type: 'deposit', status: 'failed')
    end

    Note over Student,SMS: Course Purchase Flow

    Student->>Client: Enroll in course
    Client->>API: POST /api/enrollments<br/>{courseId, studentId}
    API->>DB: GET course price
    DB-->>API: price: 200,000 IRR
    API->>DB: GET wallet balance
    DB-->>API: balance: 500,000 IRR
    
    alt Sufficient Balance
        API->>DB: BEGIN TRANSACTION
        API->>DB: UPDATE wallets<br/>(balance -= 200,000)
        API->>DB: INSERT wallet_transactions<br/>(type: 'purchase', amount: -200,000)
        API->>DB: INSERT enrollments<br/>(student_id, course_id, status: 'active')
        API->>DB: COMMIT TRANSACTION
        API->>SMS: Send confirmation SMS<br/>"Enrolled in: Advanced English"
        SMS-->>Student: SMS notification
        API-->>Client: {success: true, enrollment}
        Client-->>Student: Show success + course access
    else Insufficient Balance
        API-->>Client: 400 Insufficient funds
        Client-->>Student: Show error + deposit option
    end

    Note over Student,SMS: Withdrawal Flow

    Student->>Client: Request withdrawal
    Client->>API: POST /api/wallet/withdraw<br/>{amount: 100,000, bankAccount}
    API->>DB: Check balance
    
    alt Sufficient Balance
        API->>DB: INSERT wallet_transactions<br/>(type: 'withdrawal', status: 'pending')
        API-->>Client: {status: 'pending', message: 'Admin approval required'}
        Client-->>Student: "Withdrawal pending approval"
        
        Note over API,Shetab: Admin Approval (Manual)
        
        API->>DB: UPDATE wallet_transactions<br/>(status: 'approved')
        API->>DB: UPDATE wallets<br/>(balance -= 100,000)
        API->>Shetab: Process payout<br/>{amount, bankAccount}
        Shetab-->>API: {success: true, transactionId}
        API->>DB: UPDATE wallet_transactions<br/>(status: 'completed', transaction_id)
        API->>SMS: Send confirmation SMS<br/>"Withdrawal completed: 100,000 IRR"
        SMS-->>Student: SMS notification
    else Insufficient Balance
        API-->>Client: 400 Insufficient funds
    end

    Note over Student,DB: Financial Analytics (Admin)

    Client->>API: GET /api/admin/financial
    API->>DB: Aggregate wallet transactions<br/>- Total revenue<br/>- Revenue by course<br/>- Revenue by month<br/>- Member tier distribution
    DB-->>API: Financial metrics
    API-->>Client: Dashboard data
    Client-->>Student: Financial reports UI
```

---

## 7. AI Services Integration Flow

```mermaid
graph TB
    subgraph "AI Provider Architecture"
        Manager[AI Provider Manager<br/>ai-provider-manager.ts]
        OllamaProvider[Ollama Provider<br/>45.89.239.250:11434]
        OpenAIProvider[OpenAI Fallback<br/>DISABLED for Iran]
        Health[Health Check<br/>10s timeout]
    end

    subgraph "Use Case 1: Content Generation"
        ContentAPI[POST /api/ai-training/generate-content<br/>{topic, level, language}]
        Prompt1[Prompt Engineering<br/>Lesson plans, exercises, quizzes]
        OllamaGen[Ollama Generation<br/>Stream or Complete]
        Validate1[Validate Output<br/>Check for hallucinations]
        Return1[Return Generated Content]
    end

    subgraph "Use Case 2: AI Study Partner"
        ChatAPI[POST /api/ai-study-partner/chat<br/>{message, context}]
        Context[Maintain Conversation Context<br/>In-memory]
        OllamaChat[Ollama Chat Completion]
        Grammar[Grammar Corrections]
        Vocab[Vocabulary Suggestions]
        Return2[Stream Response]
    end

    subgraph "Use Case 3: CallerN AI Supervisor"
        AudioChunk[WebSocket: audio-chunk event<br/>{roomId, audioData}]
        Whisper[Whisper STT<br/>localhost:8000<br/>Transcribe audio]
        Transcript[Extract transcript text]
        OllamaAnalyze[Ollama Analysis<br/>- Identify vocabulary<br/>- Grammar issues<br/>- TTT ratio calculation]
        Suggestions[Generate Suggestions]
        SocketEmit[Socket.emit: ai-suggestion<br/>Send to teacher]
    end

    subgraph "Use Case 4: Post-Session Analysis"
        PostAPI[POST /api/callern/post-session-analysis<br/>{sessionId, transcript}]
        OllamaSummarize[Ollama Summarization<br/>- Transcript summary<br/>- Key vocabulary<br/>- Grammar issues]
        WhisperPron[Whisper Pronunciation<br/>Fluency scores]
        GenerateReport[Generate Session Report]
        StoreReport[(Store in DB<br/>callern_session_reports)]
    end

    subgraph "Use Case 5: AI Sales Agent"
        SalesAPI[POST /api/ai-sales-agent/chat<br/>{message, language}]
        Bilingual[Bilingual Support<br/>Persian + English]
        OllamaSales[Ollama Chat<br/>- Answer FAQs<br/>- Pricing info<br/>- Schedule tests]
        Escalate[Escalate to Human<br/>if complex query]
        CRM[Create CRM Record<br/>if lead identified]
    end

    subgraph "Use Case 6: AI Testing"
        TestGenAPI[POST /api/unified-testing/ai-generate-question<br/>{topic, questionType, level}]
        OllamaQuestion[Ollama Generation<br/>Generate test question]
        ValidateQ[Validate Question Quality<br/>Check answer key]
        StoreQ[(Store in question bank)]
        
        EssayAPI[POST /api/unified-testing/ai-score-essay<br/>{essayText, rubric}]
        OllamaEssay[Ollama Essay Scoring<br/>- Grammar<br/>- Coherence<br/>- Vocabulary<br/>- CEFR level]
        Feedback[Generate Detailed Feedback]
    end

    subgraph "Error Handling"
        Timeout[Connection Timeout<br/>10s limit]
        Fallback[Graceful Degradation<br/>Rule-based fallback]
        Retry[Retry Logic<br/>3 attempts]
        LogError[Log Error<br/>Continue app operation]
    end

    Manager --> OllamaProvider
    Manager --> OpenAIProvider
    Manager --> Health
    
    Health --> Timeout
    Timeout --> Fallback
    Timeout --> Retry
    Timeout --> LogError
    
    ContentAPI --> Prompt1
    Prompt1 --> OllamaGen
    OllamaGen --> Validate1
    Validate1 --> Return1
    
    ChatAPI --> Context
    Context --> OllamaChat
    OllamaChat --> Grammar
    OllamaChat --> Vocab
    Grammar --> Return2
    Vocab --> Return2
    
    AudioChunk --> Whisper
    Whisper --> Transcript
    Transcript --> OllamaAnalyze
    OllamaAnalyze --> Suggestions
    Suggestions --> SocketEmit
    
    PostAPI --> OllamaSummarize
    PostAPI --> WhisperPron
    OllamaSummarize --> GenerateReport
    WhisperPron --> GenerateReport
    GenerateReport --> StoreReport
    
    SalesAPI --> Bilingual
    Bilingual --> OllamaSales
    OllamaSales --> Escalate
    OllamaSales --> CRM
    
    TestGenAPI --> OllamaQuestion
    OllamaQuestion --> ValidateQ
    ValidateQ --> StoreQ
    
    EssayAPI --> OllamaEssay
    OllamaEssay --> Feedback

    style OllamaProvider fill:#ff6b6b,color:#fff
    style Whisper fill:#ff6b6b,color:#fff
    style OpenAIProvider fill:#9e9e9e,color:#fff
    style Timeout fill:#f44336,color:#fff
    style Fallback fill:#ffa726,color:#fff
```

---

## 8. External Services Integration

```mermaid
graph LR
    subgraph "MetaLingua Core"
        API[Express API Server]
        Workers[Background Workers]
    end

    subgraph "Kavenegar SMS (Iranian)"
        SMS_API[SMS API<br/>api.kavenegar.com]
        Send[Send SMS<br/>Rate: 100/15min]
        Bulk[Bulk SMS<br/>Rate: 10/hour<br/>Max: 500 recipients]
        Status[Delivery Status<br/>Webhook]
    end

    subgraph "Isabel VoIP (Iranian)"
        SIP[SIP Trunk<br/>Iranian Telecom]
        Inbound[Inbound Calls<br/>Lead intake]
        Outbound[Outbound Calls<br/>Follow-ups]
        Recording[Call Recording<br/>Storage]
    end

    subgraph "Shetab Gateway (Iranian)"
        Payment[Payment Gateway<br/>Iranian Banking]
        Request[Payment Request]
        Verify[Transaction Verify]
        Callback[Webhook Callback<br/>Signature verification]
        Settlement[Daily Settlement]
    end

    subgraph "keybit.ir Calendar (Iranian)"
        Calendar[Persian Calendar API]
        Sync[Calendar Sync]
        Holidays[Iranian Holidays]
        PrayerTimes[Prayer Times]
    end

    subgraph "Social Media Platforms"
        FB[Facebook]
        IG[Instagram]
        TW[Twitter/X]
        LI[LinkedIn]
        TG[Telegram]
        YT[YouTube]
        TT[TikTok]
        WA[WhatsApp]
        EM[Email]
    end

    subgraph "Scraping & CRM"
        Scraper[Social Media Scraper<br/>scraper-service.ts]
        Jobs[(Scrape Jobs<br/>Database)]
        Leads[(Scraped Leads<br/>CRM)]
        Competitors[(Competitor Prices<br/>Market Trends)]
    end

    API --> SMS_API
    Workers --> SMS_API
    SMS_API --> Send
    SMS_API --> Bulk
    SMS_API --> Status
    
    API --> SIP
    SIP --> Inbound
    SIP --> Outbound
    SIP --> Recording
    
    API --> Payment
    Payment --> Request
    Payment --> Verify
    Payment --> Callback
    Payment --> Settlement
    
    API --> Calendar
    Calendar --> Sync
    Calendar --> Holidays
    Calendar --> PrayerTimes
    
    API --> Scraper
    Scraper --> FB
    Scraper --> IG
    Scraper --> TW
    Scraper --> LI
    Scraper --> TG
    Scraper --> YT
    Scraper --> TT
    Scraper --> WA
    Scraper --> EM
    
    Scraper --> Jobs
    Scraper --> Leads
    Scraper --> Competitors

    style SMS_API fill:#ffa726,color:#fff
    style SIP fill:#ffa726,color:#fff
    style Payment fill:#ffa726,color:#fff
    style Calendar fill:#ffa726,color:#fff
    style Jobs fill:#f44336,color:#fff
```

**Error Points:**
- 🔴 SMS: Rate limiting (100/15min), API key issues
- 🔴 VoIP: SIP registration failures, NAT traversal
- 🔴 Shetab: Gateway timeout, signature mismatch, double-credit
- 🔴 Scraping: CAPTCHA challenges, rate limiting, API changes

---

## 9. Database Schema Relationships

```mermaid
erDiagram
    users ||--o{ enrollments : has
    users ||--o{ wallets : has
    users ||--o{ callern_call_history : participates
    users ||--o{ teacher_callern_availability : sets
    users ||--o{ test_sessions : takes
    users ||--o{ achievements_earned : earns
    users ||--o{ linguaquest_lesson_feedback : provides
    
    courses ||--o{ enrollments : includes
    courses ||--o{ class_sessions : has
    courses ||--o{ curriculumLevelCourses : part_of
    
    wallets ||--o{ wallet_transactions : contains
    
    callern_packages ||--o{ student_callern_packages : assigned_to
    student_callern_packages ||--o{ callern_call_history : uses
    
    callern_call_history ||--o{ callern_session_reports : generates
    
    unified_test_questions ||--o{ test_sessions : used_in
    test_sessions ||--o{ test_results : produces
    
    linguaquest_lessons ||--o{ linguaquest_lesson_feedback : receives
    
    gamification_challenges ||--o{ achievements : defines
    achievements ||--o{ achievements_earned : awarded_as
    
    curriculums ||--o{ curriculumLevels : contains
    curriculumLevels ||--o{ curriculumLevelCourses : contains
    curriculumLevelCourses ||--o{ studentCurriculumProgress : tracked_in
    
    scrape_jobs ||--o{ scrapedLeads : produces
    scrape_jobs ||--o{ competitorPrices : produces
    scrape_jobs ||--o{ marketTrends : produces

    users {
        int id PK
        string email
        string phone
        string passwordHash
        string role
        timestamp createdAt
    }
    
    wallets {
        int id PK
        int userId FK
        decimal balance
        string memberTier
        string currency
    }
    
    wallet_transactions {
        int id PK
        int walletId FK
        string type
        decimal amount
        string status
        timestamp createdAt
    }
    
    enrollments {
        int id PK
        int studentId FK
        int courseId FK
        string status
        timestamp enrolledAt
    }
    
    callern_call_history {
        int id PK
        int studentId FK
        int teacherId FK
        int packageId FK
        string roomId
        int totalMinutes
        string status
        string recordingUrl
        int studentRating
        int teacherRating
        timestamp startTime
        timestamp endTime
    }
    
    unified_test_questions {
        int id PK
        string questionType
        string skill
        string cefrLevel
        string language
        text content
        text answerKey
    }
    
    test_sessions {
        int id PK
        int userId FK
        int templateId FK
        string status
        int score
        string cefrLevel
        timestamp startedAt
        timestamp completedAt
    }
    
    linguaquest_lessons {
        int id PK
        string title
        string level
        text activities
        text audioUrls
        boolean published
        int xpReward
    }
    
    linguaquest_lesson_feedback {
        int id PK
        int lessonId FK
        int userId FK
        string guestSessionToken
        int starRating
        string difficultyRating
        text textFeedback
        boolean wasHelpful
        int completionTimeSeconds
        int scorePercentage
    }
```

---

## 10. Production Error Points Map

```mermaid
graph TB
    subgraph "CRITICAL - System Crash"
        E1[JWT_SECRET Missing<br/>→ App exits]
        E2[DATABASE_URL Missing<br/>→ Cannot start]
        E3[Wallet Race Condition<br/>→ Incorrect balance]
        E4[Shetab Callback Duplicate<br/>→ Double credit]
        E5[CallerN Room Memory Leak<br/>→ Server OOM]
    end

    subgraph "HIGH - Feature Broken"
        E6[Ollama Timeout 10s<br/>→ AI features disabled]
        E7[Whisper Service Down<br/>→ No STT]
        E8[Kavenegar API Invalid<br/>→ No SMS]
        E9[WebRTC NAT Failure<br/>→ No video calls]
        E10[Shetab Gateway Timeout<br/>→ Payment failures]
        E11[TTS Audio Missing<br/>→ Silent lessons]
    end

    subgraph "MEDIUM - Recoverable"
        E12[SMS Rate Limit 100/15min<br/>→ Delayed delivery]
        E13[AI Hallucinations<br/>→ Content review needed]
        E14[Audio Upload Failure<br/>→ Retry mechanism]
        E15[Session Timeout<br/>→ Student restart]
        E16[Concurrent Edit<br/>→ Last write wins]
    end

    subgraph "LOW - Monitoring"
        E17[Missing Telemetry<br/>→ Blind spots]
        E18[Worker Crash Loop<br/>→ No alerts]
        E19[Disk Space<br/>→ No monitoring]
        E20[Orphaned Files<br/>→ Accumulation]
    end

    subgraph "Mitigation Strategies"
        M1[Graceful Degradation<br/>Ollama/Whisper optional]
        M2[Rate Limiting<br/>express-rate-limit]
        M3[Idempotency Keys<br/>UUID for SMS/Payments]
        M4[JWT Refresh Tokens<br/>Token rotation]
        M5[Zod Validation<br/>Input sanitization]
        M6[Health Monitoring<br/>AI provider status]
        M7[WebSocket Cleanup<br/>On disconnect]
        M8[DB Connection Pool<br/>Retry logic]
    end

    E1 --> M1
    E2 --> M8
    E3 --> M3
    E4 --> M3
    E5 --> M7
    E6 --> M1
    E7 --> M1
    E8 --> M6
    E9 --> M7
    E10 --> M3
    E11 --> M1
    E12 --> M2
    E13 --> M5
    E14 --> M1
    E15 --> M4
    E16 --> M5
    E17 --> M6
    E18 --> M6
    E19 --> M6
    E20 --> M6

    style E1 fill:#d32f2f,color:#fff
    style E2 fill:#d32f2f,color:#fff
    style E3 fill:#d32f2f,color:#fff
    style E4 fill:#d32f2f,color:#fff
    style E5 fill:#d32f2f,color:#fff
    style E6 fill:#f57c00,color:#fff
    style E7 fill:#f57c00,color:#fff
    style E8 fill:#f57c00,color:#fff
    style E9 fill:#f57c00,color:#fff
    style E10 fill:#f57c00,color:#fff
    style E11 fill:#f57c00,color:#fff
    style M1 fill:#388e3c,color:#fff
    style M2 fill:#388e3c,color:#fff
    style M3 fill:#388e3c,color:#fff
    style M4 fill:#388e3c,color:#fff
    style M5 fill:#388e3c,color:#fff
    style M6 fill:#388e3c,color:#fff
    style M7 fill:#388e3c,color:#fff
    style M8 fill:#388e3c,color:#fff
```

---

## Summary Statistics

### System Scale:
- **Client Pages**: 150+ React components
- **Server Routes**: 73+ route modules
- **Database Tables**: 50+ tables
- **API Endpoints**: 500+ endpoints
- **User Roles**: 8 roles
- **Question Types**: 21 types
- **Activity Types**: 19 types (LinguaQuest)
- **Social Platforms**: 9 platforms
- **External Services**: 5 Iranian services

### Production Error Points:
- **Critical (System Crash)**: 5 points
- **High (Feature Broken)**: 6 points
- **Medium (Recoverable)**: 5 points
- **Low (Monitoring)**: 4 points
- **Total Identified**: 150+ throughout system

### Mitigation Coverage:
- ✅ Graceful degradation implemented
- ✅ Rate limiting configured
- ✅ Idempotency keys enforced
- ✅ Input validation with Zod
- ✅ Health monitoring active
- ✅ WebSocket cleanup on disconnect
- ✅ DB connection retry logic
- ⚠️ Missing: Comprehensive telemetry
- ⚠️ Missing: Disk space monitoring
- ⚠️ Missing: Worker health checks

---

**Generated:** October 17, 2025  
**Based on:** Actual codebase analysis (200+ files)
