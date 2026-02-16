export const ROLES = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  ACCOUNTANT: 'Accountant',
  CALL_CENTER: 'Call Center Agent',
  FRONT_DESK: 'Front Desk Clerk',
  MENTOR: 'Mentor',
  SUPERVISOR: 'Supervisor',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ALL_ROLES: UserRole[] = Object.values(ROLES);

export const ROLE_ALIASES: Record<string, UserRole> = {
  'admin': ROLES.ADMIN,
  'Admin': ROLES.ADMIN,
  'teacher': ROLES.TEACHER,
  'Teacher': ROLES.TEACHER,
  'Teacher/Tutor': ROLES.TEACHER,
  'Tutor': ROLES.TEACHER,
  'student': ROLES.STUDENT,
  'Student': ROLES.STUDENT,
  'accountant': ROLES.ACCOUNTANT,
  'Accountant': ROLES.ACCOUNTANT,
  'Call Center Agent': ROLES.CALL_CENTER,
  'CallCenter': ROLES.CALL_CENTER,
  'call center': ROLES.CALL_CENTER,
  'Front Desk Clerk': ROLES.FRONT_DESK,
  'FrontDesk': ROLES.FRONT_DESK,
  'Front Desk': ROLES.FRONT_DESK,
  'frontdesk': ROLES.FRONT_DESK,
  'mentor': ROLES.MENTOR,
  'Mentor': ROLES.MENTOR,
  'supervisor': ROLES.SUPERVISOR,
  'Supervisor': ROLES.SUPERVISOR,
  'Manager': ROLES.SUPERVISOR,
  'manager': ROLES.SUPERVISOR,
};

export function normalizeRole(role: string): UserRole {
  return ROLE_ALIASES[role] || ROLES.STUDENT;
}

export function matchesRole(userRole: string, allowedRoles: string[]): boolean {
  const normalized = normalizeRole(userRole);
  return allowedRoles.some(r => normalizeRole(r) === normalized);
}
