# Meta Lingua 3-Day Mission Plan
**Start Date**: August 20, 2025  
**Deadline**: August 23, 2025  
**Goal**: 100% functional application with zero hardcoded/fake data

## CRITICAL PRIORITIES

### DAY 1: AI & Core Infrastructure
- [x] **Replace OpenAI with Ollama** ✅ COMPLETED
  - [x] Create Ollama service integration 
  - [x] Update all AI endpoints to use Ollama
  - [x] Test Callern AI features with Ollama
  - [x] Update roadmap AI assistance
  - [x] Remove all OpenAI dependencies

- [x] **Fix Hardcoded Data** ✅ IN PROGRESS
  - [x] Teacher online status (now fetches from database)
  - [x] Teacher specializations (now from user profiles)
  - [x] Mock user avatars (returns null for frontend to handle)
  - [x] Video course progress (fetches real data from DB)
  - [ ] Sample courses data in routes
  - [ ] Test data in various endpoints

### DAY 2: Complete Functionality & WebRTC
- [ ] **WebRTC Video Calling**
  - [ ] Fix video stream establishment
  - [ ] Add TURN server configuration
  - [ ] Implement proper ICE candidate handling
  - [ ] Add connection retry logic
  - [ ] Test peer-to-peer connectivity

- [ ] **Complete Missing Features**
  - [ ] Teacher dashboard stats (currently returning 500)
  - [ ] Session recording functionality
  - [ ] Wallet payment processing
  - [ ] SMS integration for notifications
  - [ ] Email system implementation

### DAY 3: Testing & Polish
- [ ] **Comprehensive Testing**
  - [ ] Write unit tests for all services
  - [ ] Integration tests for API endpoints
  - [ ] E2E tests for critical user flows
  - [ ] Load testing for WebSocket/WebRTC

- [ ] **Bug Fixes & Polish**
  - [ ] Fix all TypeScript errors
  - [ ] Remove all console.logs
  - [ ] Optimize database queries
  - [ ] Add proper error handling everywhere
  - [ ] Performance optimization

## HARDCODED/FAKE DATA TO REPLACE

### 1. Teacher System
- `/api/callern/online-teachers` - hardcoded online status
- Teacher availability - using fake isOnline flag
- Teacher specializations - hardcoded arrays
- Teacher ratings - static values

### 2. Course System
- Available courses - returning sample data
- Course thumbnails - using external URLs
- Course progress - mock percentages
- Course instructors - hardcoded names

### 3. Financial System
- Wallet transactions - mock data
- Payment processing - not connected
- Financial reports - static calculations
- Revenue analytics - fake trends

### 4. Communication
- SMS notifications - not implemented
- Email system - not functional
- Push notifications - missing
- Chat system - incomplete

### 5. Analytics & Reports
- Student retention - fake percentages
- Teacher performance - mock metrics
- Marketing funnel - static data
- Operational metrics - hardcoded values

## NON-FUNCTIONAL BUTTONS/FEATURES

### Admin Panel
- [x] Export buttons (CSV) ✅ FIXED - Added 4 export endpoints
  - [x] Students CSV export
  - [x] Teachers CSV export  
  - [x] Financial report CSV export
  - [x] Attendance CSV export
- [ ] Export buttons (PDF)
- [ ] Bulk operations
- [ ] Report generation
- [ ] System backup
- [ ] Data migration tools

### Teacher Dashboard
- Schedule optimizer
- Performance analytics
- Student feedback system
- Resource library
- Collaboration tools

### Student Interface
- Achievement system
- Social features
- Study groups
- Progress sharing
- Referral system

## DUPLICATIONS TO REMOVE

### Code Duplications
- API error handling (repeated in every route)
- Authentication checks (duplicated logic)
- Database queries (similar patterns)
- UI components (repeated structures)
- Validation logic (scattered)

### Data Duplications
- User information (stored in multiple tables)
- Course data (redundant fields)
- Transaction records (duplicate tracking)
- Session data (multiple sources)

## OLLAMA INTEGRATION PLAN

### 1. Setup Ollama Service
```typescript
// server/services/ollama-service.ts
class OllamaService {
  private baseUrl: string;
  
  async generateText(prompt: string, model: string = 'llama2')
  async analyzeLanguage(text: string)
  async translateText(text: string, targetLang: string)
  async generateQuestions(topic: string, level: string)
}
```

### 2. Replace OpenAI Endpoints
- `/api/callern/ai/word-suggestions`
- `/api/callern/ai/instant-translation`
- `/api/callern/ai/grammar-correction`
- `/api/callern/ai/pronunciation-guide`
- `/api/roadmaps/generate`

### 3. Configuration
- Add OLLAMA_HOST to environment
- Create model selection logic
- Implement fallback handling
- Add response caching

## TEST SUITE REQUIREMENTS

### Unit Tests
- All service methods
- Database operations
- Utility functions
- Validation logic
- Authentication

### Integration Tests
- API endpoints
- WebSocket events
- Database transactions
- File operations
- External services

### E2E Tests
- User registration flow
- Course enrollment
- Video calling
- Payment processing
- Admin operations

## SUCCESS METRICS
- ✅ Zero hardcoded data
- ✅ All buttons functional
- ✅ No code duplications
- ✅ 100% test coverage
- ✅ Ollama fully integrated
- ✅ All TypeScript errors resolved
- ✅ Production-ready for self-hosting

## IMPLEMENTATION ORDER
1. Ollama integration (highest priority for self-hosting)
2. Fix critical bugs (teacher stats, WebRTC)
3. Replace hardcoded data
4. Implement missing features
5. Remove duplications
6. Write comprehensive tests
7. Final polish and optimization

---
**Note**: This is a living document. Update checkboxes as tasks are completed.