# CallerN Live Scoring Audit Report

## 1. Existing Infrastructure Analysis

### WebRTC/Video Components
- **client/src/components/callern/VideoCall.tsx**: Main video UI component
  - Uses SimplePeer for WebRTC peer connections
  - Manages local/remote video streams
  - Has controls for mute, video toggle, screen sharing
  - Already tracks call duration (callDuration state)
  - Extension point: Can overlay scoring UI on video container

### Real-time Communication
- **server/websocket-server.ts**: Socket.IO server for signaling
  - Handles room joining, WebRTC offer/answer/ICE
  - Manages teacher/student authentication
  - Tracks call state and duration
  - Extension point: Add new event types for scoring updates

### VoIP Integration
- **server/isabel-voip-service.ts**: SIP/VoIP integration
  - Manages call recording functionality
  - Extension point: Can tap into audio stream for ASR

### Database Layer
- **shared/schema.ts**: Drizzle ORM schema definitions
  - Already has users, callernCallHistory tables
  - Extension point: Add new scoring tables here
- **server/storage.ts**: Database interface
  - Extension point: Add scoring CRUD methods

## 2. Modules to Extend (No Duplication)

### Existing Features to Reuse:
1. **Authentication**: Already handled in websocket-server.ts
2. **Call Duration Tracking**: Already implemented
3. **Audio/Video Streams**: Available in VideoCall component
4. **Database Patterns**: Drizzle ORM with PostgreSQL
5. **Real-time Events**: Socket.IO infrastructure ready

### New Modules Needed:
1. **ASR Service**: Local whisper.cpp wrapper
2. **Scoring Engine**: Real-time score calculation
3. **Heads-up Overlay**: Mobile-first UI overlay
4. **Speech Segments**: Audio chunk processing
5. **Language Detection**: For TL enforcement

## 3. Extension Points

### Frontend (VideoCall.tsx):
- Line 83-720: Component has video refs and state management
- Add overlay container at line ~700 (before control buttons)
- Tap into localStreamRef for audio chunks
- Socket already available for scoring events

### Backend (websocket-server.ts):
- Line 52-660: Event handlers
- Add new events: 'speech.segment', 'score.update'
- Reuse authentication flow (line 57-89)
- Extend room management for scoring state

### Database (schema.ts):
- Add tables: presence, speech_segments, scores_student, scores_teacher
- Follow existing naming patterns (camelCase)
- Use existing user/lesson relationships

## 4. Implementation Strategy

### Phase 1: Database & Core (2 hours)
- Create scoring tables in schema.ts
- Add storage methods
- Set up ASR service wrapper

### Phase 2: Real-time Processing (3 hours)
- WebSocket events for speech/scoring
- Audio chunk extraction from VideoCall
- Scoring engine with rubrics

### Phase 3: UI Overlay (3 hours)
- Heads-up display components
- Mobile-responsive positioning
- Animation and transitions

### Phase 4: Integration & Testing (2 hours)
- Connect all components
- Test presence/TL enforcement
- Supervisor reporting view

## 5. Risks & Mitigation

### Potential Duplication Risks:
- ❌ DO NOT create new auth system (use existing)
- ❌ DO NOT create new WebRTC setup (extend VideoCall)
- ❌ DO NOT create new database connection (use storage.ts)
- ❌ DO NOT create new socket server (extend websocket-server.ts)

### Performance Considerations:
- Audio processing must be async (non-blocking)
- Overlay must use CSS transforms (no layout thrash)
- Score updates throttled to 2-second intervals
- ASR chunks buffered for efficiency

## 6. File Modification Plan

### Files to Modify:
1. shared/schema.ts - Add scoring tables
2. server/storage.ts - Add scoring methods
3. server/websocket-server.ts - Add scoring events
4. client/src/components/callern/VideoCall.tsx - Add overlay UI
5. server/routes.ts - Add REST endpoints for scores

### New Files to Create:
1. server/services/asr-service.ts - ASR wrapper
2. server/services/scoring-engine.ts - Score calculation
3. client/src/components/callern/ScoringOverlay.tsx - UI overlay
4. server/services/language-detector.ts - Language ID
5. shared/types/scoring.ts - TypeScript types

## Conclusion

The existing Callern infrastructure provides a solid foundation. By extending rather than duplicating, we can implement live scoring efficiently within the 24-hour timeline. The heads-up overlay approach will integrate seamlessly with the current video UI, providing real-time feedback without disrupting the call experience.