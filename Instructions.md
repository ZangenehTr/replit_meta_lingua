# Comprehensive Observation Scheduling Workflow Implementation Plan

## Executive Summary

After deep analysis of the Meta Lingua codebase, I've identified critical gaps in the teacher observation scheduling workflow that prevent proper class-based observation scheduling, teacher notifications, and observation queue management. This document outlines the complete implementation plan.

## Current State Analysis

### What Exists
1. **Basic Observation Creation**: `/api/supervision/observations` POST endpoint exists with SMS integration
2. **Teacher Data**: `getTeacherClasses()` method exists but returns mock session data
3. **Dashboard Structure**: Supervisor dashboard has placeholder UI for schedule review
4. **SMS Infrastructure**: Kavenegar service ready for teacher notifications
5. **Database Schema**: `supervision_observations` table exists with teacher/supervisor relationships

### Critical Missing Components
1. **No teacher class selection workflow** - Cannot select specific classes for observation
2. **No scheduled observation queue** - No way to schedule future observations
3. **No teacher notification on scheduling** - Only notifies after observation completion
4. **No dashboard "to-do" observations** - No pending observation management
5. **Placeholder schedule review functionality** - Lines 730-914 in supervisor dashboard show "Review scheduling functionality will be available in the next update"

## Identified Problems & Root Causes

### Problem 1: Schedule Review Not Functional
**Location**: `client/src/pages/supervisor/supervisor-dashboard.tsx` lines 730-914
**Root Cause**: Placeholder implementation with no backend integration
**Impact**: Supervisors cannot review teacher schedules or select classes for observation

### Problem 2: Missing Scheduled Observations System
**Root Cause**: No database schema or API endpoints for scheduled (future) observations
**Impact**: Cannot queue observations or notify teachers in advance

### Problem 3: Incomplete Teacher Class Integration
**Location**: `server/database-storage.ts` `getTeacherClasses()` method
**Root Cause**: Returns mock data instead of real class schedules
**Impact**: Cannot show actual teacher classes for observation selection

### Problem 4: No Observation Queue Management
**Root Cause**: No "scheduled" vs "completed" observation states
**Impact**: Cannot track pending observations or show supervisor to-do lists

## Implementation Plan

### Phase 1: Database Schema Enhancement (Priority: Critical)

#### 1.1 Create Scheduled Observations Table
```sql
CREATE TABLE scheduled_observations (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES users(id),
  supervisor_id INTEGER REFERENCES users(id),
  session_id INTEGER REFERENCES sessions(id),
  class_id INTEGER REFERENCES sessions(id), -- Specific class instance
  observation_type VARCHAR(50) NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
  notes TEXT,
  teacher_notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.2 Add Observation States to Existing Table
```sql
ALTER TABLE supervision_observations 
ADD COLUMN scheduled_observation_id INTEGER REFERENCES scheduled_observations(id),
ADD COLUMN observation_status VARCHAR(20) DEFAULT 'completed';
```

### Phase 2: Backend API Implementation (Priority: Critical)

#### 2.1 Scheduled Observations API Endpoints
- `GET /api/supervision/scheduled-observations` - Get all scheduled observations
- `POST /api/supervision/scheduled-observations` - Schedule new observation
- `PUT /api/supervision/scheduled-observations/:id` - Update scheduled observation
- `DELETE /api/supervision/scheduled-observations/:id` - Cancel scheduled observation
- `GET /api/supervision/scheduled-observations/teacher/:teacherId` - Get teacher's scheduled observations

#### 2.2 Teacher Classes API Enhancement
- `GET /api/teachers/:teacherId/classes` - Get real teacher class schedule
- `GET /api/teachers/:teacherId/classes/available-for-observation` - Get classes available for observation

#### 2.3 Storage Methods Implementation
```typescript
// Add to DatabaseStorage class
async getScheduledObservations(supervisorId?: number): Promise<ScheduledObservation[]>
async createScheduledObservation(data: InsertScheduledObservation): Promise<ScheduledObservation>
async updateScheduledObservation(id: number, data: Partial<ScheduledObservation>): Promise<ScheduledObservation>
async getTeacherClassesForObservation(teacherId: number): Promise<TeacherClass[]>
async getPendingObservations(supervisorId?: number): Promise<ScheduledObservation[]>
```

### Phase 3: Teacher Notification Workflow (Priority: High)

#### 3.1 Immediate Notification on Scheduling
When observation is scheduled:
1. Create entry in `scheduled_observations` table
2. Send SMS notification to teacher: "Your class [CLASS_NAME] on [DATE] has been scheduled for observation by [SUPERVISOR_NAME]. Please prepare accordingly."
3. Create in-app notification
4. Update `teacher_notified` flag

#### 3.2 Reminder Notifications
- 24 hours before: "Reminder: Your class tomorrow is scheduled for observation"
- 2 hours before: "Your class [CLASS_NAME] observation starts in 2 hours"

#### 3.3 SMS Templates Enhancement
Add new templates to `server/kavenegar-service.ts`:
```typescript
async sendObservationScheduledNotification(teacherPhone: string, teacherName: string, className: string, observationDate: string, supervisorName: string)
async sendObservationReminderNotification(teacherPhone: string, teacherName: string, className: string, timeRemaining: string)
```

### Phase 4: Frontend Schedule Review Implementation (Priority: High)

#### 4.1 Replace Placeholder Schedule Review Dialog
**Location**: `client/src/pages/supervisor/supervisor-dashboard.tsx` lines 730-914

#### 4.2 New Schedule Review Workflow
1. **Teacher Selection**: Dropdown showing all teachers with real data
2. **Class Display**: Show teacher's actual classes with:
   - Course name
   - Date/time
   - Student names
   - Room/location
   - Current observation status
3. **Observation Scheduling**: 
   - Select classes for observation
   - Choose observation type (live_in_person, live_online, recorded)
   - Set priority level
   - Add notes
   - Schedule date/time
4. **Instant Notification**: Send SMS immediately upon scheduling

#### 4.3 Class Selection Component
```typescript
interface TeacherClassSelectionProps {
  teacherId: number;
  onClassSelect: (classIds: number[]) => void;
}
```

### Phase 5: Dashboard "To-Do" Observations (Priority: High)

#### 5.1 Pending Observations Widget
Replace hardcoded "Recent Activities" with real pending observations:
- Scheduled observations (future)
- In-progress observations (today)
- Overdue observations (past due)
- Teacher responses pending

#### 5.2 Dashboard Stats Enhancement
Update `/api/supervisor/dashboard-stats` to include:
```typescript
{
  totalTeachers: number,
  scheduledObservations: number,
  pendingObservations: number,
  completedThisWeek: number,
  overdueObservations: number,
  teacherResponsesPending: number
}
```

### Phase 6: Observation Workflow Integration (Priority: Medium)

#### 6.1 Scheduled to Completed Flow
1. When supervisor begins observation: Update status to 'in_progress'
2. When scores are given: 
   - Create entry in `supervision_observations` table
   - Link to original scheduled observation
   - Update scheduled observation status to 'completed'
   - Send completion SMS to teacher

#### 6.2 Score Impact Workflow
After observation completion:
1. **Individual Teacher Record**: Update teacher performance metrics
2. **Course Quality Tracking**: Update course-level quality scores
3. **Institutional Analytics**: Feed into overall quality metrics
4. **Follow-up Actions**: Auto-schedule follow-up if scores below threshold

### Phase 7: Advanced Features (Priority: Low)

#### 7.1 Bulk Observation Scheduling
- Select multiple teachers
- Schedule observations for entire week/month
- Auto-avoid schedule conflicts

#### 7.2 Observation Templates
- Pre-defined observation criteria by course type
- Persian language specific evaluation forms
- Cultural context considerations

#### 7.3 Performance Tracking
- Teacher improvement over time
- Course quality trends
- Supervisor workload balancing

## Technical Implementation Requirements

### Database Changes Needed
1. Create `scheduled_observations` table
2. Modify `supervision_observations` table
3. Add indexes for performance
4. Create foreign key constraints

### API Endpoints to Implement
- 5 new scheduled observation endpoints
- 2 enhanced teacher class endpoints  
- 1 enhanced dashboard stats endpoint

### Frontend Components to Build
- `TeacherClassSelector` component
- `ObservationScheduler` component  
- `PendingObservationsWidget` component
- Enhanced schedule review dialog

### SMS Integration Points
- 3 new SMS notification types
- Enhanced templates with Persian support
- Reminder scheduling system

## Success Metrics

### User Experience Metrics
1. **Schedule Review Functionality**: Supervisors can view all teacher classes and select specific ones for observation
2. **Instant Teacher Notification**: Teachers receive SMS within 30 seconds of observation scheduling
3. **Dashboard Accuracy**: "To-do" observations show real pending items, not hardcoded data
4. **Complete Workflow**: From scheduling → notification → observation → scoring → follow-up

### Technical Metrics
1. **Zero Placeholder Data**: All supervisor dashboard data comes from database
2. **SMS Delivery Rate**: >95% successful notification delivery
3. **Real-time Updates**: Dashboard reflects changes immediately
4. **Data Integrity**: Complete audit trail from scheduling to completion

## Risk Assessment

### High Risk Items
1. **Database Migration**: Adding new tables to production
2. **SMS Rate Limits**: Bulk notifications may hit Kavenegar limits
3. **Teacher Adoption**: Teachers must respond to notifications

### Mitigation Strategies
1. **Staged Rollout**: Implement with test data first
2. **SMS Batching**: Implement queue system for notifications
3. **Training Materials**: Create user guides for new workflow

## Implementation Timeline

### Week 1: Database & Backend (Critical Path)
- Day 1-2: Database schema implementation
- Day 3-4: Storage methods implementation  
- Day 5-7: API endpoints implementation

### Week 2: Notification System
- Day 1-3: SMS template enhancement
- Day 4-5: Notification workflow implementation
- Day 6-7: Testing and debugging

### Week 3: Frontend Implementation  
- Day 1-3: Schedule review dialog replacement
- Day 4-5: Dashboard "to-do" widget implementation
- Day 6-7: Integration testing

### Week 4: Testing & Deployment
- Day 1-3: End-to-end workflow testing
- Day 4-5: User acceptance testing
- Day 6-7: Production deployment

## Files Requiring Changes

### Critical Files
1. `shared/schema.ts` - Add scheduled_observations schema
2. `server/database-storage.ts` - Add new storage methods
3. `server/routes.ts` - Add new API endpoints
4. `client/src/pages/supervisor/supervisor-dashboard.tsx` - Replace placeholders
5. `server/kavenegar-service.ts` - Add SMS templates

### Supporting Files
1. `drizzle.config.ts` - Database migrations
2. `client/src/lib/queryClient.ts` - New API hooks
3. `Instructions.md` - This implementation plan

## Conclusion

The current system has solid foundations but lacks the complete workflow for observation scheduling. The key insight is that supervisors need to select **specific class instances** for observation, not just teachers in general. This requires showing real teacher schedules, enabling class selection, and creating a complete notification and tracking workflow.

Implementation must prioritize:
1. **Real data over placeholders** (Phase 1-2)
2. **Teacher notification workflow** (Phase 3)  
3. **Functional schedule review** (Phase 4)
4. **Dashboard accuracy** (Phase 5)

Success depends on seamless integration between scheduling, notification, observation, and follow-up phases with complete SMS integration throughout.