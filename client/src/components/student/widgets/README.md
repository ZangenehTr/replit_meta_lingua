# Student Dashboard Widgets

This directory contains shared, reusable widget components extracted from the mobile student dashboard. These widgets are designed to be used across both Explorer and Learner dashboards with theme support and real API integration.

## Available Widgets

### 1. GamificationWidget
**File**: `GamificationWidget.tsx`
**API Endpoint**: `/api/student/gamification-stats`

Displays student's gamification data including:
- Current level and XP progress
- Experience points with progress bar
- Daily streak counter with flame icon
- Total credits and member tier

**Props**:
- `theme`: 'explorer' | 'learner' (purple/blue vs blue/indigo)
- `compact`: boolean - reduces size for smaller displays
- Standard `BaseWidgetProps`

### 2. LearningProgressWidget  
**File**: `LearningProgressWidget.tsx`
**API Endpoint**: `/api/student/learning-progress`

Shows learning progress metrics:
- Course completion percentage
- Weekly learning goals with progress tracking
- Current course and next milestone information
- Progress statistics (completion rate, weekly rate, lessons remaining)

### 3. UpcomingSessionsWidget
**File**: `UpcomingSessionsWidget.tsx`  
**API Endpoint**: `/api/student/upcoming-sessions`

Displays upcoming learning sessions:
- Session titles with teacher information
- Scheduled times with relative time formatting
- Online/in-person session types with appropriate icons
- Join/Info buttons for immediate access
- Course titles and session durations

### 4. AssignmentsWidget
**File**: `AssignmentsWidget.tsx`
**API Endpoint**: `/api/student/assignments`

Manages student assignments:
- Assignment titles with course context
- Due dates with overdue warnings
- Status tracking (pending, submitted, graded)
- Score display for graded assignments
- Priority-based sorting (overdue first, then by status)

### 5. AchievementWidget
**File**: `AchievementWidget.tsx`
**API Endpoint**: `/api/student/achievements`

Showcases student achievements:
- Horizontal scrolling achievement cards
- Category-based icons (learning, streak, completion, social)
- Achievement titles and unlock dates
- Configurable display limits
- Empty state messaging

### 6. QuickActionsWidget
**File**: `QuickActionsWidget.tsx`
**No API required** (uses navigation)

Provides quick access buttons:
- Configurable action buttons with icons
- Grid layout (2, 3, or 4 columns)
- Theme-aware styling with gradients  
- Default actions: Continue Learning, AI Practice, Sessions, etc.
- Custom action support with onClick handlers

## Utility Components

### WidgetError
**File**: `WidgetError.tsx`

Standard error display component with:
- Error message display
- Retry button functionality
- Compact mode support
- Consistent error styling

### WidgetLoading  
**File**: `WidgetLoading.tsx`

Loading skeleton component with:
- Animated pulse effect
- Configurable height
- Consistent loading patterns

## Types and Interfaces

### BaseWidgetProps
Common props for all widgets:
```typescript
interface BaseWidgetProps {
  theme?: WidgetTheme; // 'explorer' | 'learner'
  className?: string;
  loading?: boolean;
  error?: string | null;  
  onRefresh?: () => void;
}
```

### Theme Configuration
Supports two themes:
- **Explorer Theme**: Purple to blue gradient (`from-purple-600 to-blue-600`)
- **Learner Theme**: Blue to indigo gradient (`from-blue-600 to-indigo-600`)

## API Integration

All widgets use React Query for data fetching with:
- Proper error handling and loading states
- Configurable stale times (2-10 minutes)
- Authorization token integration
- Automatic refetch capabilities
- Cache invalidation support

## Usage Example

```tsx
import { 
  GamificationWidget, 
  LearningProgressWidget,
  QuickActionsWidget 
} from '@/components/student/widgets';

function StudentDashboard() {
  return (
    <div className="space-y-6">
      <GamificationWidget theme="learner" />
      <QuickActionsWidget theme="learner" columns={2} />
      <LearningProgressWidget theme="learner" />
    </div>
  );
}
```

## Responsive Design

All widgets are designed with mobile-first responsive principles:
- Touch-friendly button sizes (minimum 44px height)
- Appropriate spacing and typography scaling
- Horizontal scrolling for achievement lists
- Flexible grid layouts for different screen sizes

## Testing

Each widget includes comprehensive `data-testid` attributes for testing:
- Main widget containers
- Interactive elements (buttons, inputs)
- Dynamic content (scores, dates, progress)
- Error and loading states

## Migration Notes

The original mobile dashboard has been updated to use these shared widgets, replacing the inline component definitions. The same functionality is preserved while gaining the benefits of:
- Code reusability across different dashboard views
- Consistent theme support
- Improved maintainability
- Better separation of concerns
- Enhanced testing capabilities