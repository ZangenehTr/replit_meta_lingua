# CRM Pipeline Audit Report

> **Date:** 2026-03-10
> **Auditor:** AI Assistant (Step 2 of 4-step plan)
> **Scope:** All 34 CRM page files vs `/docs/CRM-PIPELINE-SPEC.md`
> **Focus Areas:** Field compliance, status transitions, role-based access (teacher role), menu label/URL correctness

---

## Executive Summary

### Critical Issues Found: 8
### Major Issues Found: 6
### Minor Issues Found: 5

The most severe problems are **teacher role over-permission** across multiple pages. Teachers currently see ALL data (not filtered by their own classes/students) and have access to admin/supervisor-level action buttons and configuration panels.

---

## File-to-Spec Mapping

| # | Spec Page | Code File | Exists |
|---|-----------|-----------|--------|
| 1 | Contacts (کانتکت) | `ContactBook.tsx` | Yes |
| 2 | New Lead (سرنخ) | `NewLead.tsx` | Yes |
| 3 | No Response (پاسخ نداده ها) | `NoAnswer.tsx` | Yes |
| 4 | Pre-Placement Follow-up (پیگیری) | `PrePlacementFollowUp.tsx` | Yes |
| 5 | Placement Test (تعیین سطح) | `PlacementTest.tsx` | Yes |
| 6 | Post-Placement Call Center (مشاوره مرکز تماس) | `ConsultationCallCenter.tsx` | Yes |
| 7 | Post-Placement Counter (مشاوره کانتر) | `ConsultationCounter.tsx` | Yes |
| 8 | Set Private Class (ست کلاس خصوصی) | `PrivateClassSetup.tsx` | Yes |
| 9 | Set Class Number (ست شماره کلاس) | `RoomAssignment.tsx` | Yes |
| 10 | Active Private Classes (کلاس‌های خصوصی در جریان) | `ActivePrivateClasses.tsx` | Yes |
| 11 | Charge Renewal (تمدید شارژ) | `ChargeExtension.tsx` | Yes |
| 12 | Hold (هلد) | `HoldCalendar.tsx` | Yes |
| 13 | Installments (اقساط) | `Installments.tsx` | Yes |
| 14 | Cheque (چک) | `Checks.tsx` | Yes |
| 15 | Online Attendance (حضور و غیاب آنلاین) | `AttendanceOnline.tsx` | Yes |
| 16 | Offsite Attendance (حضور و غیاب برون سازمانی) | `AttendanceOffsite.tsx` | Yes |
| 17 | In-Person Attendance (حضور و غیاب حضوری) | `AttendanceInperson.tsx` | Yes |
| 18 | Withdrawal (انصراف) | `Withdrawal.tsx` | Yes |
| 19 | No-Show (عدم حضور) | `NoShow.tsx` | Yes |
| 20 | Final Registration (ثبت نام نهایی) | `FinalRegistration.tsx` | Yes |
| 21 | Logbook (لاگ بوک) | `LogBook.tsx` | Yes |
| 22 | Mentor Assignment (تخصیص منتور) | `MentorAssignment.tsx` | Yes |
| 23 | SPA | `SPACards.tsx` | Yes |
| 24 | QC | `QCCards.tsx` | Yes |
| 25 | Observer (آبزرو) | `Observer.tsx` | Yes |
| 26 | Completed Private Classes | `CompletedPrivate.tsx` | Yes (implied by spec) |
| — | **Extra pages (not in spec):** | | |
| 27 | Active Group Classes | `ActiveGroupClasses.tsx` | Extra |
| 28 | Completed Groups | `CompletedGroups.tsx` | Extra |
| 29 | Group Class Setup | `GroupClassSetup.tsx` | Extra |
| 30 | Pipeline Analytics | `PipelineAnalytics.tsx` | Extra |
| 31 | Attendance Analytics | `AttendanceAnalytics.tsx` | Extra |
| 32 | Substitution History | `SubstitutionHistory.tsx` | Extra |
| 33 | Teacher Availability | `TeacherAvailability.tsx` | Extra |
| 34 | GuardedCRM (wrapper) | `GuardedCRM.tsx` | Infrastructure |

> Extra pages (27-33) are reasonable extensions not covered by this spec version.

---

## CRITICAL ISSUES

### C1. Teacher sees ALL classes — no teacherId filter

**Files:** `ActivePrivateClasses.tsx`, `CompletedPrivate.tsx`
**Line:** `ActivePrivateClasses.tsx:90` — `getAllActiveClasses()` with zero filtering
**Spec says:** Teachers should only see their own assigned classes
**Impact:** Teacher sees every student's private class in the institute, including financial data (balance)

**Fix:** Filter by `c.teacherId === currentUser.teacherId` when `user.role === 'teacher'`

---

### C2. Teacher sees ALL attendance sheets — no teacherId filter

**Files:** `AttendanceOnline.tsx`, `AttendanceInperson.tsx`, `AttendanceOffsite.tsx`
**Lines:**
- `AttendanceOnline.tsx:95` — `getAllActiveClasses().filter(c => c.deliveryType === 'online')` (no teacher filter)
- `AttendanceInperson.tsx:38` — `getAllActiveClasses().filter(c => c.deliveryType !== 'online')` (no teacher filter)
- `AttendanceOffsite.tsx` — same pattern
**Spec says:** Teachers should only see attendance for their own students
**Impact:** Teacher can view and mark attendance for ALL students across ALL teachers

**Fix:** Add `.filter(c => user.role !== 'teacher' || c.teacherId === currentTeacherId)`

---

### C3. Teacher sees admin-level action buttons on Active Private Classes

**File:** `ActivePrivateClasses.tsx:252-281`
**What's shown to ALL roles including teacher:**
- Hold (هلد) — admin/supervisor only
- Withdrawal (انصراف) — admin/supervisor only
- Charge Extension (تمدید شارژ) — admin/supervisor/accountant only
- SPA — supervisor only (auto-triggered)
- QC Card — supervisor only (auto-triggered)
- Observer — supervisor only (auto-triggered)
- Mentor Assignment — supervisor/admin only
**Spec says:** These are admin/supervisor actions; spec section 10 shows they're triggered by the system at specific session milestones or by supervisors
**Impact:** Teacher can initiate holds, withdrawals, charge extensions, and quality reviews they shouldn't

**Fix:** Conditionally render `ACTION_BUTTONS` based on `user.role`. Teachers should only see: Student Absence (غیبت مجاز), Teacher Absence (own report), possibly Class Completion

---

### C4. Teacher sees supervisor-only features on Online Attendance

**File:** `AttendanceOnline.tsx:417-441, 443-544`
**What's exposed to teachers:**
- Webhook configuration (Telegram & SMS) — supervisor/admin only
- Threshold settings (grace period, late cutoff) — supervisor/admin only
- Analytics button — supervisor/admin only
- Notification bell with attendance alerts — supervisor only
- Substitute teacher assignment modal — supervisor/admin only
- Auto/Manual mode toggle — supervisor only (teachers should only see their sessions)
**Spec says:** Online Attendance for teachers = basic Attendance Registration + Reminder Calendar
**Impact:** Teacher can configure webhooks, change thresholds, assign substitute teachers, view all alerts

**Fix:** Hide these controls when `user.role === 'teacher'`. Teacher should see: their own classes, attendance registration button, reminder calendar button.

---

### C5. No `useAuth()` in ANY CRM page (except NewLead)

**Finding:** Of all 34 CRM files, ONLY `NewLead.tsx` imports and uses `useAuth()` to filter data (line 86: filters by agentId for non-manager call center users).
**All other pages** load data without any awareness of who is logged in.
**Impact:** Every page shows every user's data to every role. This is a systemic security gap.

**Files needing `useAuth()` + role-based filtering:**
- `ActivePrivateClasses.tsx` — filter by teacherId for teachers
- `AttendanceOnline.tsx` — filter by teacherId for teachers
- `AttendanceInperson.tsx` — filter by teacherId for teachers
- `AttendanceOffsite.tsx` — filter by teacherId for teachers
- `CompletedPrivate.tsx` — filter by teacherId for teachers
- `SPACards.tsx` — filter by teacherId for teachers (show only their own SPA cards)
- `QCCards.tsx` — filter by teacherId for teachers
- `Observer.tsx` — filter by teacherId for teachers
- `ConsultationCallCenter.tsx` — filter by agentId for call center agents
- `ConsultationCounter.tsx` — filter by agentId for front desk staff
- `PlacementTest.tsx` — filter by supervisorId for supervisors

---

### C6. Missing spec field: "Start Class" button on Active Private Classes

**File:** `ActivePrivateClasses.tsx`
**Spec says (Section 10):** There is a main "Start Class" button (دکمه شروع کلاس). This button fills teacher and classroom timetable slots. The 8 action buttons should ONLY appear AFTER this button has been clicked.
**Current code:** All 8/9 action buttons are always visible. There is no "Start Class" button.
**Impact:** The critical timetable-filling workflow is missing. Action buttons should be gated behind class start confirmation.

---

### C7. Missing spec fields: "Class Completion" and "Change Days/Teacher" buttons

**File:** `ActivePrivateClasses.tsx`
**Spec says (Section 10):**
- Button 6: Class Completion (اتمام کلاس) → moves to Completed Private Classes
- Button 7: Change Class Days (تغییر روزهای کلاس) → moves back to Set Private Class
- Button 8: Change Teacher (تغییر استاد) → moves back to Set Private Class
**Current code:** Only 8 action buttons defined in `ACTION_BUTTONS` array (extend, hold, student_absence, teacher_absence, private_withdrawal, spa, qc, observer). Missing: class_completion, change_days, change_teacher.
**Impact:** 3 of the 8 spec-defined transitions don't exist

---

### C8. Spec: Attendance pages should have "Reminder Calendar" button that gates "Attendance Registration"

**Files:** `AttendanceOnline.tsx`, `AttendanceOffsite.tsx`
**Spec says (Section 15):** The "Reminder Calendar" button must be clicked FIRST before the "Attendance Registration" button appears. Creates a Google Calendar event. One-time use per card arrival.
**Current code:** No "Reminder Calendar" button exists. Attendance marking is always available.
**Impact:** The Google Calendar integration workflow and attendance gating is missing.

---

## MAJOR ISSUES

### M1. Menu label mismatch: "Active Classes" → `/crm/active-private`

**File:** `AppShell.tsx:106` (admin menu) and `AppShell.tsx:346` (teacher menu)
**Current:** `{ label: 'Active Classes', path: '/crm/active-private' }`
**Problem:** Label says "Active Classes" (generic) but URL goes to active PRIVATE classes only. In the spec, this page is specifically "Active Private Classes" (کلاس‌های خصوصی در جریان).
**Fix:** Change label to "Active Private Classes" / "کلاس‌های خصوصی فعال" to match spec title.

---

### M2. In-Person Attendance filter is wrong

**File:** `AttendanceInperson.tsx:38`
**Current:** `getAllActiveClasses().filter(c => c.deliveryType !== 'online')`
**Spec says:** In-Person Attendance should only show students where `deliveryType === 'in_person'`
**Current code:** Shows both `in_person` AND `off_site` classes (everything that's not online)
**Impact:** Off-site classes appear in both In-Person and Off-Site attendance pages

**Fix:** Change filter to `c.deliveryType === 'in_person'`

---

### M3. Attendance In-Person missing teacher-grouped view

**File:** `AttendanceInperson.tsx`
**Spec says (Section 17):** Initial view should show cards grouped by teacher:
- Teacher photo
- Teacher name
- Student count
- Then student table per teacher with: Name, Last Name, Gender, Course Type, Initial Sessions, Extension Sessions, Allowed Sessions, Teacher Briefing, Course Type, Course Level, Teacher, Session Details
**Current code:** Uses same card-per-class layout as online attendance — not teacher-grouped
**Impact:** Doesn't match the spec's distinct UI pattern for in-person attendance

---

### M4. Follow-up color coding partially implemented

**File:** `types.ts:139-151` — `getFollowUpColor()` function exists
**Spec says (Section 4):** Cards should be colored: Yellow (1st), Green (2nd), Blue (3rd), Black (4th+)
**types.ts:** The helper function exists and returns correct colors
**Needs verification:** Whether `PrePlacementFollowUp.tsx` actually uses this function to color cards

---

### M5. Missing spec feature: Student authorized absence limit (2 per 10 sessions)

**File:** `ActivePrivateClasses.tsx`
**Spec says (Section 10, Button 2):** "In every 10 sessions, a student is allowed 2 authorized absences" (در هر 10 جلسه زبان آموز 2 بار مجاز به غیبت است)
**Current code:** The Student Absence action modal just records an absence with a date and notes — no validation of the 2-per-10 limit
**Impact:** No enforcement of absence limits

---

### M6. Auto-generated student message template not fully implemented

**File:** `ActivePrivateClasses.tsx`
**Spec says (Section 10):** An auto-generated message (پیام شروع دوره زبان آموز) should be created with class schedule details, teacher name, dates, login credentials, and contact info
**Current code:** No such message generation exists in the active classes page
**Impact:** Missing the student notification workflow at class start

---

## MINOR ISSUES

### m1. Goal Matrix: spec has "Upper-intermediate" for GE but code uses "Upper-intermediate"
**Status:** Match confirmed in `types.ts:73` — this is correct.

### m2. BEC goals: spec says "elementary, pre intermediate, intermediate, upper intermediate, advanced"
**File:** `types.ts:81` — `BEC: ['Elementary', 'Pre-intermediate', 'Intermediate']`
**Missing:** "Upper-intermediate" and "Advanced" for BEC goals

### m3. TTC goals: spec says "Kids, General, IELTS"
**File:** `types.ts:82` — `TTC: ['Kids', 'General', 'IELTS']`
**Status:** Match confirmed.

### m4. PTE goals: spec shows 50-60, 60-65, 65-79, 79-90 (4 ranges)
**File:** `types.ts:76` — `PTE: ['50-60', '60-65', '65-79', '79-90']`
**Status:** Match confirmed.

### m5. Referral sources: spec lists 15, code lists 15 — need exact match check
**File:** `types.ts:34-38`
**Spec list:** اینستاگرام, سایت, آشنایان, مهاجرت, پیامک, گفتینو, تابلو موسسه, زبان آموز قدیمی, تراکت, بیلبورد, تلگرام, همایش, ایمیل, تعیین سطح آنلاین, فراجا
**Code list:** instagram, website, acquaintances, immigration, sms, goftino, institute_sign, former_student, flyer, billboard, telegram, conference, email, online_placement, faraja
**Status:** All 15 match. Correct.

---

## DATA TYPE COMPLIANCE

### Fields and Enums (Spec vs Code)

| Spec Item | Code Location | Status |
|-----------|--------------|--------|
| Desired Courses (10) | `types.ts:22` | MATCH (all 10) |
| IELTS Modules (Academic/General) | `types.ts:25` | MATCH |
| PTE Modules (Academic/Core) | `types.ts:26` | MATCH |
| Goal Matrix (10 courses) | `types.ts:72-83` | MATCH (minor: BEC missing 2 levels) |
| Delivery Types (3) | `types.ts:28` | MATCH (online/in_person/off_site) |
| Class Formats (2) | `types.ts:31` | MATCH (private/group) |
| Referral Sources (15) | `types.ts:34-38` | MATCH |
| Lead Statuses (4) | `types.ts:41` | MATCH |
| Group Class Levels (67) | `types.ts:86-101` | MATCH |
| Private Class Levels (38) | `types.ts:104-114` | MATCH |
| Registration Private Levels (48) | `types.ts:117-126` | MATCH |
| Package Levels (10) | `types.ts:129-134` | MATCH |
| Package Sublevels (9) | `types.ts:136` | MATCH |
| Follow-up Colors | `types.ts:139-151` | MATCH |
| Contact Interface | `types.ts:154-165` | MATCH (id, firstName, lastName, age, gender, phone, nationalId, nationalIdImage, avatar) |

---

## ROLE-BASED ACCESS SUMMARY

### Current State (what's actually enforced)

| Layer | Mechanism | Granularity |
|-------|-----------|-------------|
| Route Guard | `GuardedCRM.tsx` → `CRM_ROLES` array | Page-level: allows/denies entire page |
| FACS | `feature-permissions-store.ts` | Feature-level: teacher enabled for `crm.active_classes`, `crm.attendance`, `crm.quality` |
| In-page filtering | **MISSING** (except NewLead) | Zero filtering within pages |

### What Teacher SHOULD See vs CURRENTLY Sees

| Page | Should See | Currently Sees |
|------|-----------|---------------|
| Active Private Classes | Own classes only, read-only (no action buttons) | ALL classes + ALL 9 action buttons |
| Online Attendance | Own classes, Attendance + Reminder buttons only | ALL classes + webhooks, substitutes, analytics, thresholds, notifications |
| In-Person Attendance | Own students grouped by teacher card | ALL teachers' student cards |
| Off-Site Attendance | Own classes, Attendance + Reminder only | ALL classes |
| Completed Private | Own completed classes | ALL completed classes |
| SPA Cards | Own SPA cards | ALL SPA cards |
| QC Reports | Own QC cards (read-only) | ALL QC cards |

---

## RECOMMENDED FIX PRIORITY

### Phase 1 — Security Critical (do first)
1. **C1-C5:** Add `useAuth()` to all CRM pages, filter by `teacherId`/`agentId` based on role
2. **C3:** Hide admin action buttons for teacher role on Active Private Classes
3. **C4:** Hide supervisor controls on Attendance Online for teacher role

### Phase 2 — Spec Compliance
4. **C6:** Add "Start Class" button that gates action buttons
5. **C7:** Add missing action buttons (Class Completion, Change Days, Change Teacher)
6. **C8:** Add Reminder Calendar button that gates Attendance Registration
7. **M1:** Fix menu label "Active Classes" → "Active Private Classes"
8. **M2:** Fix in-person attendance filter (`!== 'online'` → `=== 'in_person'`)
9. **M3:** Implement teacher-grouped view for in-person attendance

### Phase 3 — Enhancements
10. **M5:** Enforce 2-per-10 absence limit validation
11. **M6:** Implement auto-generated student message at class start
12. **m2:** Add missing BEC goal levels
13. **M4:** Verify follow-up color coding is applied in PrePlacementFollowUp.tsx

---

## PAGES WITH NO ISSUES DETECTED

These pages appear to match the spec based on field/enum analysis:
- `ContactBook.tsx` — Fields match spec Section 1
- `NewLead.tsx` — Fields match spec Section 2 (ONLY page with proper auth filtering)
- `NoAnswer.tsx` — Fields match spec Section 3
- `PlacementTest.tsx` — Fields present per spec Section 5
- `ConsultationCallCenter.tsx` — Registration/payment fields per spec Section 6
- `ConsultationCounter.tsx` — Same as CallCenter with signature per spec Section 7
- `Withdrawal.tsx` — Withdrawal reason flow per spec
- `NoShow.tsx` — No-show tracking per spec
- `FinalRegistration.tsx` — Terminal registration page per spec
- `LogBook.tsx` — Full activity log per spec
- `MentorAssignment.tsx` — Mentor assignment per spec
- `HoldCalendar.tsx` — Calendar view with hold dates per spec Section 12
- `Installments.tsx` — Installment payment flow per spec Section 13
- `Checks.tsx` — Cheque registration per spec Section 14

> Note: These pages still need the `useAuth()` fix (C5) for role-based data filtering, but their field structure and transitions appear compliant with the spec.
