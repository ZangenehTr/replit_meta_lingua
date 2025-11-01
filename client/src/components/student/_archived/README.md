# Archived Student Dashboard Components

## Purpose
This directory contains dashboard components that have been superseded by the unified dashboard approach but are preserved for potential future use in seasonal campaign landing pages.

## Archived Components

### ExplorerDashboard.tsx (1583 lines)
- **Original Purpose**: Comprehensive conversion-optimized dashboard for non-enrolled students
- **Features**: Course catalog browsing, teacher directory showcase, trial booking, LinguaQuest preview, branding integration
- **Why Archived**: Replaced by UnifiedStudentDashboard which handles both enrolled/non-enrolled states more efficiently

### NonEnrolledStudentDashboard.tsx (14 lines)
- **Original Purpose**: Simple wrapper around ExplorerDashboard
- **Why Archived**: No longer needed with unified dashboard approach

## Future Use Cases

These components can be repurposed for:

1. **Seasonal Campaign Landing Pages**
   - Christmas promotions with discount codes
   - Valentine's Day language learning campaigns
   - New Year resolution-focused landing pages
   - Back-to-school promotions

2. **Special Event Pages**
   - Open house events
   - Free trial weekend promotions
   - Referral campaigns
   - Partner institution showcases

3. **A/B Testing**
   - Testing different conversion flows
   - Comparing unified vs specialized dashboards
   - Testing different hero section designs

## Key Features to Reuse

- **Conversion-Optimized Design**: Purple-to-blue gradient theme, social proof elements
- **Course Showcase**: Grid layout with filtering and search
- **Teacher Directory**: Profile cards with specializations and availability
- **Trial Booking Flow**: Multi-step booking with calendar integration
- **Feature Highlights**: Icons, stats dashboard, achievement badges

## Integration Points

When reusing these components:

1. **Guest Placement Test**: Both components integrate with `/placement-test` route
2. **Discount Codes**: Add payment integration with promotional code support
3. **Campaign Tracking**: Add UTM parameter handling and analytics
4. **Limited-Time Offers**: Add countdown timers and urgency elements

## Architecture Decision

**Date**: November 1, 2025

**Decision**: Moved to unified dashboard approach where EnrolledStudentDashboard now handles both states intelligently based on:
- Enrollment status (`isEnrolled` flag)
- Public features configuration (admin-controlled)
- Placement test completion status

**Benefits**:
- Reduced code duplication
- Centralized feature visibility control
- Consistent UX between states
- Easier maintenance and testing

**Trade-offs**:
- Lost some specialized conversion optimizations
- More complex conditional logic in single component
- Preserved old components for campaign flexibility

## Restoration Guide

If you need to restore these components:

1. Copy desired component from `_archived/` to `client/src/components/student/`
2. Update route in `App.tsx` to use the component
3. Ensure API endpoints (`/api/branding`, `/api/teachers/directory`) are still functional
4. Add campaign-specific features (discount codes, tracking, etc.)
5. Test thoroughly before deployment

## Related Files

- `client/src/components/student/UnifiedStudentDashboard.tsx` - Current implementation
- `client/src/components/student/EnrolledStudentDashboard.tsx` - Full enrolled dashboard
- `client/src/hooks/use-enrollment-status.ts` - Enrollment detection logic
- `client/src/hooks/use-public-features.ts` - Feature visibility configuration
- `server/routes/public-features-routes.ts` - Admin controls for public features

## Notes

- All components use TanStack Query for data fetching
- i18n translations are in `client/src/i18n/locales/*/student.json`
- Test IDs are comprehensive for automated testing
- Mobile-responsive with Tailwind CSS
