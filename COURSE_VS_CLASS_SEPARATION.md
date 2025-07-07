# Course Management vs Class Scheduling: Clear Separation

## Course Management (/admin/courses)
**Purpose**: Define WHAT is taught - the educational content and structure

### Responsibilities:
- **Curriculum Design**: Course structure, modules, lessons, learning paths
- **Content Management**: Learning materials, videos, documents, assessments
- **Academic Settings**: Prerequisites, learning outcomes, skill levels
- **Business Rules**: Pricing, enrollment capacity, course duration (weeks/months)
- **Strategic Planning**: Course catalog, program offerings, certifications

### Key Data:
- Course title and description
- Language of instruction
- Difficulty level (beginner/intermediate/advanced)
- Total duration (12 weeks, 6 months, etc.)
- Price and payment plans
- Maximum enrollment capacity
- Prerequisites and requirements
- Learning objectives and outcomes
- Course materials and resources
- Assessment methods

### Example:
"Persian Language Level 1" - A 12-week comprehensive program covering basic Persian grammar, vocabulary, and conversation skills. Price: 5,000,000 IRR, Max students: 30.

---

## Class Scheduling (/admin/classes)
**Purpose**: Define WHEN, WHERE, and HOW courses are delivered

### Responsibilities:
- **Logistics Management**: Dates, times, locations, resources
- **Resource Allocation**: Teacher assignments, room bookings
- **Operational Planning**: Daily/weekly schedules, recurring patterns
- **Instance Management**: Multiple sessions of the same course
- **Delivery Coordination**: Online/in-person/hybrid setup

### Key Data:
- Reference to course (pulls title, level, language from course)
- Assigned teacher
- Room/virtual space allocation
- Specific dates and times
- Class instance capacity (may be less than course max)
- Delivery type (online/in-person/hybrid)
- Session-specific notes
- Recurring schedule patterns
- Attendance tracking

### Example:
Course "Persian Language Level 1" scheduled as:
- Section A: Mon/Wed 9-11am, Teacher: Dr. Hosseini, Room 101, 20 seats
- Section B: Tue/Thu 6-8pm, Teacher: Ms. Karimi, Online, 15 seats
- Section C: Sat 10am-2pm, Teacher: Mr. Rashidi, Room 202, 25 seats

---

## Key Principle: Single Source of Truth

### Course-level data (stored once in Course Management):
- Title, description, level, language
- Learning objectives and outcomes
- Total program duration
- Base price

### Class-level data (unique per scheduled instance):
- Which course is being scheduled
- Specific teacher for this instance
- Specific room/location
- Actual meeting times
- Instance-specific capacity
- Delivery method for this section

This separation ensures:
1. No data duplication
2. Clear responsibilities
3. Flexibility (one course, many scheduled instances)
4. Easier maintenance
5. Better reporting and analytics