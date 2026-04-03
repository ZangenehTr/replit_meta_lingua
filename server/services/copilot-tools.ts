import type { IStorage } from '../storage';

export interface CopilotTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  requires_confirmation?: boolean;
}

export const COPILOT_TOOLS: CopilotTool[] = [
  {
    name: 'get_platform_summary',
    description: 'Get current platform statistics: total students, active courses, open leads, and teachers.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'list_curriculum_categories',
    description: 'List all curriculum categories with their name, slug, description, and student/course counts.',
    parameters: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          description: 'Filter by active status (default: true)'
        }
      }
    }
  },
  {
    name: 'create_curriculum_category',
    description: 'Create a new curriculum category. Can be linked to a CEFR/proficiency level (A1, B2, etc.). Slug must be URL-safe and unique (e.g., english-b2, persian-a1).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Category display name (e.g., "English B2 Level")' },
        slug: { type: 'string', description: 'Unique URL slug (e.g., english-b2). Auto-generated from name+level if omitted.' },
        level: { type: 'string', description: 'CEFR or proficiency level this category targets (e.g., A1, B2, beginner, advanced). Used in slug and description.' },
        description: { type: 'string', description: 'Description of the curriculum category and its learning objectives' },
        nameFa: { type: 'string', description: 'Persian (Farsi) name for the category' }
      },
      required: ['name']
    }
  },
  {
    name: 'list_courses',
    description: 'List courses, optionally filtered by level, active status, or teacher.',
    parameters: {
      type: 'object',
      properties: {
        level: { type: 'string', description: 'Level filter (beginner, intermediate, advanced, A1, B2, etc.)' },
        isActive: { type: 'boolean', description: 'Filter by active status' },
        teacherId: { type: 'number', description: 'Filter by instructor ID' },
        categoryId: { type: 'number', description: 'Filter by curriculum category ID' },
        limit: { type: 'number', description: 'Maximum results to return (default: 20)' }
      }
    }
  },
  {
    name: 'create_course',
    description: 'Create a new course on the platform.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Course title' },
        description: { type: 'string', description: 'Course description' },
        level: { type: 'string', description: 'Level (beginner, intermediate, advanced, A1, B2, C1, etc.)' },
        categoryId: { type: 'number', description: 'Curriculum category ID to link this course to' },
        price: { type: 'number', description: 'Course price' },
        maxStudents: { type: 'number', description: 'Maximum number of students' },
        totalSessions: { type: 'number', description: 'Number of sessions in the course' },
        sessionDurationMinutes: { type: 'number', description: 'Duration of each session in minutes' }
      },
      required: ['title', 'level']
    }
  },
  {
    name: 'list_teachers',
    description: 'List teachers with status, contact info, assigned course count (current load), and subjects.',
    parameters: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', description: 'Filter by active status' },
        limit: { type: 'number', description: 'Maximum results to return (default: 20)' }
      }
    }
  },
  {
    name: 'assign_teacher_to_course',
    description: 'Assign a teacher to a course (replaces current instructor).',
    parameters: {
      type: 'object',
      properties: {
        courseId: { type: 'number', description: 'The course ID' },
        teacherId: { type: 'number', description: 'The teacher user ID' }
      },
      required: ['courseId', 'teacherId']
    },
    requires_confirmation: true
  },
  {
    name: 'create_class_sessions',
    description: 'Create multiple class sessions for a course on a recurring schedule.',
    parameters: {
      type: 'object',
      properties: {
        courseId: { type: 'number', description: 'The course ID' },
        schedule: {
          type: 'object',
          description: 'Session schedule configuration',
          properties: {
            startDate: { type: 'string', description: 'Start date ISO format (e.g., 2024-01-15)' },
            startTime: { type: 'string', description: 'Start time HH:MM (e.g., 09:00)' },
            sessionCount: { type: 'number', description: 'Number of sessions to create' },
            intervalDays: { type: 'number', description: 'Days between sessions (e.g., 7 for weekly)' },
            durationMinutes: { type: 'number', description: 'Duration of each session in minutes' }
          },
          required: ['startDate', 'startTime', 'sessionCount']
        },
        roomId: { type: 'number', description: 'Optional room ID for physical sessions' }
      },
      required: ['courseId', 'schedule']
    },
    requires_confirmation: true
  },
  {
    name: 'list_leads',
    description: 'List leads (potential students) with optional filters by status, workflow stage, interested level, or last-contact date.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Lead status filter (new, contacted, qualified, converted, lost)' },
        workflowStage: { type: 'string', description: 'Filter by CRM workflow stage' },
        assignedTo: { type: 'string', description: 'Filter by assignee name' },
        interestedLevel: { type: 'string', description: 'Filter by the level the lead is interested in (e.g., A1, B2, beginner)' },
        lastContactedDaysAgo: { type: 'number', description: 'Return leads not contacted in the last N days' },
        limit: { type: 'number', description: 'Maximum results to return (default: 20)' }
      }
    }
  },
  {
    name: 'create_sms_campaign',
    description: 'Broadcast an SMS notification campaign to a filtered audience (students/teachers). The confirmation gate will show exact recipient count before any records are created.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        message: { type: 'string', description: 'SMS/notification message text' },
        audienceFilter: {
          type: 'object',
          description: 'Audience filter criteria — all fields are optional',
          properties: {
            role: { type: 'string', description: 'Target user role: Student (default) or Teacher' },
            enrolledOnly: { type: 'boolean', description: 'Only include enrolled students (requires role=Student)' },
            cefrLevel: { type: 'string', description: 'Only target students at a specific CEFR level (e.g., A1, B2)' }
          }
        }
      },
      required: ['name', 'message']
    },
    requires_confirmation: true
  },
  {
    name: 'search_students',
    description: 'Search for students by name, phone number, or email. Optionally filter by enrollment, level, or active status.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term (matches name, phone, or email)' },
        enrolledInCourseId: { type: 'number', description: 'Filter: only students enrolled in this course ID' },
        cefrLevel: { type: 'string', description: 'Filter by CEFR level (A1, A2, B1, B2, C1, C2) or general level (beginner, intermediate, advanced)' },
        isActive: { type: 'boolean', description: 'Filter by active account status' },
        limit: { type: 'number', description: 'Maximum results to return (default: 10)' }
      }
    }
  },
  {
    name: 'enroll_student_in_course',
    description: 'Enroll a student in a course.',
    parameters: {
      type: 'object',
      properties: {
        studentId: { type: 'number', description: 'The student user ID' },
        courseId: { type: 'number', description: 'The course ID' },
        paymentMethod: {
          type: 'string',
          description: 'Payment method (wallet, cash, online)',
          enum: ['wallet', 'cash', 'online']
        }
      },
      required: ['studentId', 'courseId', 'paymentMethod']
    },
    requires_confirmation: true
  }
];

export function getToolsForOpenAI(): { type: string; function: { name: string; description: string; parameters: unknown } }[] {
  return COPILOT_TOOLS.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

export function isToolRequiresConfirmation(toolName: string): boolean {
  const tool = COPILOT_TOOLS.find(t => t.name === toolName);
  return tool?.requires_confirmation === true;
}

export async function getEnrolledUserIds(storage: IStorage): Promise<Set<number>> {
  const allCourses = await storage.getCourses();
  const enrolledIds = new Set<number>();
  for (const course of allCourses) {
    const enrollments = await storage.getCourseEnrollments(course.id);
    for (const enr of enrollments) {
      if (enr.userId) enrolledIds.add(enr.userId);
    }
  }
  return enrolledIds;
}

export async function executeTool(
  name: string,
  params: Record<string, unknown>,
  storage: IStorage
): Promise<{ success: boolean; data?: unknown; error?: string; summary?: string }> {
  switch (name) {
    case 'get_platform_summary': {
      const allUsers = await storage.getAllUsers();
      const studentList = allUsers.filter(u => u.role === 'Student');
      const teacherList = allUsers.filter(u => u.role === 'Teacher' || u.role === 'Teacher/Tutor');
      const adminList = allUsers.filter(u => u.role === 'Admin' || u.role === 'admin');

      const allCourses = await storage.getCourses();
      const activeCourseCount = allCourses.filter(c => c.isActive).length;

      const allLeads = await storage.getLeads();
      const openLeads = allLeads.filter((l: Record<string, unknown>) =>
        !l.status || l.status === 'new' || l.status === 'contacted' || l.status === 'interested'
      );

      const totalEnrollments = await (async () => {
        let count = 0;
        for (const course of allCourses.filter(c => c.isActive)) {
          const enrollments = await storage.getCourseEnrollments(course.id);
          count += enrollments.length;
        }
        return count;
      })();

      const summary = {
        totalStudents: studentList.length,
        totalTeachers: teacherList.length,
        totalAdmins: adminList.length,
        totalActiveCourses: activeCourseCount,
        totalLeads: allLeads.length,
        openLeads: openLeads.length,
        totalActiveEnrollments: totalEnrollments
      };

      return {
        success: true,
        data: summary,
        summary: `Platform: ${summary.totalStudents} students, ${summary.totalTeachers} teachers, ${summary.totalActiveCourses} active courses, ${summary.openLeads} open leads (${summary.totalLeads} total), ${summary.totalActiveEnrollments} active enrollments.`
      };
    }

    case 'list_curriculum_categories': {
      const filterActive = params.isActive !== false;
      const categoryList = await storage.getCurriculumCategories({ isActive: filterActive });

      const allCourses = await storage.getCourses();
      const coursesByCat = new Map<number, typeof allCourses>();
      for (const course of allCourses) {
        if (course.categoryId) {
          const existing = coursesByCat.get(course.categoryId) || [];
          existing.push(course);
          coursesByCat.set(course.categoryId, existing);
        }
      }

      const enriched = await Promise.all(categoryList.map(async (cat: Record<string, unknown>) => {
        const catId = Number(cat.id);
        const catCourses = coursesByCat.get(catId) || [];
        let totalStudents = 0;
        for (const course of catCourses) {
          const enrollments = await storage.getCourseEnrollments(course.id);
          totalStudents += enrollments.length;
        }
        return {
          ...cat,
          courseCount: catCourses.length,
          studentCount: totalStudents,
          levels: [...new Set(catCourses.map(c => c.level).filter(Boolean))]
        };
      }));

      return {
        success: true,
        data: enriched,
        summary: `Found ${enriched.length} curriculum categories.`
      };
    }

    case 'create_curriculum_category': {
      const name = params.name as string;
      const level = (params.level as string) || undefined;
      const nameFa = (params.nameFa as string) || undefined;

      let slug = (params.slug as string) || undefined;
      if (!slug) {
        const baseParts = [name, level].filter(Boolean).join(' ');
        slug = baseParts.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }

      const description = (params.description as string) ||
        (level ? `Curriculum category for ${name} (Level: ${level})` : undefined);

      const existing = await storage.getCurriculumCategoryBySlug(slug);
      if (existing) {
        return { success: false, error: `Curriculum category with slug '${slug}' already exists. Try a different name or slug.` };
      }

      const newCategory = await storage.createCurriculumCategory({
        name,
        slug,
        description,
        nameFa,
        isActive: true,
      });

      return {
        success: true,
        data: newCategory,
        summary: `Created curriculum category: "${name}"${level ? ` (Level: ${level})` : ''} (slug: ${slug}).`
      };
    }

    case 'list_courses': {
      const limit = Number(params.limit) || 20;
      let courseList = await storage.getCourses();

      if (params.level) courseList = courseList.filter(c => c.level === params.level);
      if (params.isActive !== undefined) courseList = courseList.filter(c => c.isActive === params.isActive);
      if (params.teacherId) courseList = courseList.filter(c => c.instructorId === Number(params.teacherId));
      if (params.categoryId) courseList = courseList.filter(c => c.categoryId === Number(params.categoryId));

      const page = courseList.slice(0, limit).map(c => ({
        id: c.id,
        title: c.title,
        level: c.level,
        price: c.price,
        maxStudents: c.maxStudents,
        isActive: c.isActive,
        sessionDuration: c.sessionDuration,
        categoryId: c.categoryId,
        instructorId: c.instructorId,
        createdAt: c.createdAt
      }));

      return {
        success: true,
        data: page,
        summary: `Found ${page.length} courses (of ${courseList.length} total matching).`
      };
    }

    case 'create_course': {
      const newCourse = await storage.createCourse({
        title: params.title as string,
        description: (params.description as string) || '',
        level: params.level as string,
        categoryId: params.categoryId ? Number(params.categoryId) : undefined,
        price: Number(params.price) || 0,
        maxStudents: Number(params.maxStudents) || 20,
        totalSessions: Number(params.totalSessions) || 12,
        sessionDuration: Number(params.sessionDurationMinutes) || 60,
        isActive: true,
        createdAt: new Date(),
      });

      return {
        success: true,
        data: newCourse,
        summary: `Created course: "${newCourse.title}" (Level: ${newCourse.level}, ID: ${newCourse.id}).`
      };
    }

    case 'list_teachers': {
      const limit = Number(params.limit) || 20;
      const allTeachers = await storage.getTeachers();

      let filtered = allTeachers;
      if (params.isActive !== undefined) {
        filtered = filtered.filter(t => t.isActive === params.isActive);
      }

      const allCourses = await storage.getCourses();
      const coursesByTeacher = new Map<number, { title: string; level: string | null }[]>();
      for (const c of allCourses) {
        if (c.instructorId) {
          const existing = coursesByTeacher.get(c.instructorId) || [];
          existing.push({ title: c.title, level: c.level });
          coursesByTeacher.set(c.instructorId, existing);
        }
      }

      const page = filtered.slice(0, limit).map(t => {
        const assignedCourses = coursesByTeacher.get(t.id) || [];
        return {
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          phoneNumber: t.phoneNumber,
          role: t.role,
          isActive: t.isActive,
          currentLoad: assignedCourses.length,
          subjects: assignedCourses.map(c => c.title),
          createdAt: t.createdAt
        };
      });

      return {
        success: true,
        data: page,
        summary: `Found ${page.length} teachers.`
      };
    }

    case 'assign_teacher_to_course': {
      const courseId = Number(params.courseId);
      const teacherId = Number(params.teacherId);

      const course = await storage.getCourse(courseId);
      if (!course) return { success: false, error: `Course ID ${courseId} not found.` };

      const teacher = await storage.getUser(teacherId);
      if (!teacher || (teacher.role !== 'Teacher' && teacher.role !== 'Teacher/Tutor')) {
        return { success: false, error: `Teacher ID ${teacherId} not found or is not a teacher.` };
      }

      const updated = await storage.updateCourse(courseId, { instructorId: teacherId });
      if (!updated) return { success: false, error: `Failed to update course ${courseId}.` };

      return {
        success: true,
        data: { courseId, teacherId },
        summary: `Assigned ${teacher.firstName} ${teacher.lastName} to course "${course.title}".`
      };
    }

    case 'create_class_sessions': {
      const courseId = Number(params.courseId);
      const schedule = (params.schedule as Record<string, unknown>) || {};
      const course = await storage.getCourse(courseId);
      if (!course) return { success: false, error: `Course ID ${courseId} not found.` };

      const startDate = schedule.startDate as string;
      const startTime = schedule.startTime as string;
      const sessionCount = Number(schedule.sessionCount);
      const intervalDays = Number(schedule.intervalDays) || 7;
      const durationMinutes = Number(schedule.durationMinutes) || course.sessionDuration || 60;

      if (!startDate || !startTime || !sessionCount) {
        return { success: false, error: 'schedule.startDate, schedule.startTime, and schedule.sessionCount are required.' };
      }

      const roomId = params.roomId ? Number(params.roomId) : undefined;
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const created = [];
      for (let i = 0; i < sessionCount; i++) {
        const sessionDate = new Date(startDateTime);
        sessionDate.setDate(sessionDate.getDate() + i * intervalDays);

        const newSession = await storage.createSession({
          courseId,
          title: `${course.title} - Session ${i + 1}`,
          scheduledAt: sessionDate,
          duration: durationMinutes,
          status: 'scheduled',
          notes: roomId ? `Room ID: ${roomId}` : undefined,
          createdAt: new Date(),
        });
        created.push(newSession);
      }

      return {
        success: true,
        data: created,
        summary: `Created ${sessionCount} sessions for course "${course.title}" starting ${startDate} at ${startTime}.`
      };
    }

    case 'list_leads': {
      const limit = Number(params.limit) || 20;
      let leadList = params.status
        ? await storage.getLeadsByStatus(params.status as string)
        : await storage.getLeads();

      if (params.workflowStage) {
        leadList = leadList.filter((l: Record<string, unknown>) =>
          String(l.workflowStage || l.workflow_stage || '').includes(params.workflowStage as string)
        );
      }

      if (params.assignedTo) {
        const assignee = params.assignedTo as string;
        leadList = leadList.filter((l: Record<string, unknown>) =>
          String(l.assignedTo || l.assigned_to || l.assignedToName || '').includes(assignee)
        );
      }

      if (params.lastContactedDaysAgo) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(params.lastContactedDaysAgo));
        leadList = leadList.filter((l: Record<string, unknown>) => {
          const lastContact = l.lastContactedAt || l.last_contacted_at;
          if (!lastContact) return true;
          return new Date(lastContact as string) < cutoffDate;
        });
      }

      if (params.interestedLevel) {
        const lvl = (params.interestedLevel as string).toLowerCase();
        leadList = leadList.filter((l: Record<string, unknown>) => {
          const leadLevel = String(l.interestedLevel || l.interested_level || l.level || '').toLowerCase();
          const leadNotes = String(l.notes || l.comment || l.message || '').toLowerCase();
          return leadLevel.includes(lvl) || leadNotes.includes(lvl);
        });
      }

      const page = leadList.slice(0, limit);
      return {
        success: true,
        data: page,
        summary: `Found ${leadList.length} leads${params.status ? ` with status "${params.status as string}"` : ''}${params.interestedLevel ? ` interested in level "${params.interestedLevel as string}"` : ''}.`
      };
    }

    case 'create_sms_campaign': {
      const audienceFilter = (params.audienceFilter as Record<string, unknown>) || {};
      const targetRole = (audienceFilter.role as string) || 'Student';
      const enrolledOnly = Boolean(audienceFilter.enrolledOnly);
      const cefrLevelFilter = audienceFilter.cefrLevel as string | undefined;
      const campaignName = params.name as string;
      const message = params.message as string;

      let allUsers = await storage.getAllUsers();
      let targetUsers = allUsers.filter(u => u.role === targetRole);

      if (enrolledOnly) {
        const enrolledIds = await getEnrolledUserIds(storage);
        targetUsers = targetUsers.filter(u => enrolledIds.has(u.id));
      }

      if (cefrLevelFilter) {
        const lvl = cefrLevelFilter.toLowerCase();
        targetUsers = targetUsers.filter(u => {
          const userLevel = String((u as unknown as Record<string, unknown>).level || '').toLowerCase();
          const userSubLevel = String((u as unknown as Record<string, unknown>).subLevelCode || '').toLowerCase();
          return userLevel.includes(lvl) || userSubLevel.includes(lvl);
        });
      }

      const notifications = await Promise.all(
        targetUsers.map(user =>
          storage.createNotification({
            userId: user.id,
            title: campaignName,
            message,
            notificationType: 'system',
            priority: 'normal',
            isRead: false,
            metadata: { campaignName, channel: 'sms', audienceFilter }
          })
        )
      );

      return {
        success: true,
        data: {
          campaignName,
          message,
          recipientCount: notifications.length,
          status: 'sent'
        },
        summary: `SMS campaign "${campaignName}" broadcast to ${notifications.length} ${targetRole.toLowerCase()}s.`
      };
    }

    case 'search_students': {
      const limit = Number(params.limit) || 10;
      const queryStr = (params.query as string || '').toLowerCase().trim();

      const allUsers = await storage.getAllUsers();
      let students = allUsers.filter(u => u.role === 'Student');

      if (params.isActive !== undefined) {
        students = students.filter(u => u.isActive === params.isActive);
      }

      if (queryStr) {
        students = students.filter(u => {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
          const phone = (u.phoneNumber || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          return fullName.includes(queryStr) || phone.includes(queryStr) || email.includes(queryStr);
        });
      }

      if (params.enrolledInCourseId) {
        const courseEnrollments = await storage.getCourseEnrollments(Number(params.enrolledInCourseId));
        const enrolledUserIds = new Set(courseEnrollments.map((e: Record<string, unknown>) => Number(e.userId || e.user_id)));
        students = students.filter(u => enrolledUserIds.has(u.id));
      }

      if (params.cefrLevel) {
        const lvlFilter = (params.cefrLevel as string).toLowerCase();
        students = students.filter(u => {
          const userLevel = String((u as unknown as Record<string, unknown>).level || '').toLowerCase();
          const userSubLevel = String((u as unknown as Record<string, unknown>).subLevelCode || '').toLowerCase();
          return userLevel.includes(lvlFilter) || userSubLevel.includes(lvlFilter);
        });
      }

      const page = students.slice(0, limit).map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phoneNumber: u.phoneNumber,
        level: (u as unknown as Record<string, unknown>).level,
        isActive: u.isActive,
        createdAt: u.createdAt
      }));

      return {
        success: true,
        data: page,
        summary: `Found ${page.length} students matching "${queryStr || 'all'}"${params.cefrLevel ? ` at level "${params.cefrLevel as string}"` : ''}.`
      };
    }

    case 'enroll_student_in_course': {
      const studentId = Number(params.studentId);
      const courseId = Number(params.courseId);

      const student = await storage.getUser(studentId);
      if (!student || student.role !== 'Student') {
        return { success: false, error: `Student ID ${studentId} not found.` };
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return { success: false, error: `Course ID ${courseId} not found.` };
      }

      const existingEnrollments = await storage.getUserEnrollments(studentId);
      const alreadyEnrolled = existingEnrollments.some((e: Record<string, unknown>) =>
        Number(e.courseId || e.course_id) === courseId
      );

      if (alreadyEnrolled) {
        return { success: false, error: 'Student is already enrolled in this course.' };
      }

      const enrollment = await storage.enrollInCourse({
        userId: studentId,
        courseId,
        progress: 0
      });

      const paymentMethodStr = (params.paymentMethod as string) || 'cash';
      let paymentRecord: unknown = null;
      try {
        paymentRecord = await storage.createPayment({
          payerId: studentId,
          amount: String(course.price || '0'),
          paymentType: 'course_enrollment',
          paymentMethod: paymentMethodStr,
          status: 'completed',
          relatedEntityType: 'course',
          relatedEntityId: String(courseId),
          description: `Enrollment in "${course.title}" via Admin Copilot`,
        });
      } catch (payErr) {
        console.warn('[AdminCopilot] Payment record creation failed (non-blocking):', payErr instanceof Error ? payErr.message : String(payErr));
      }

      return {
        success: true,
        data: { enrollment, payment: paymentRecord },
        summary: `Enrolled ${student.firstName} ${student.lastName} in course "${course.title}" (payment method: ${paymentMethodStr}, price: ${course.price || 0}).`
      };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
