import { describe, it, expect } from 'vitest';
import { hasPermission, canAccessRoute, ROLE_PERMISSIONS } from '@/lib/permissions';
import type { UserRole } from '@/lib/permissions';

describe('Role-Based Permissions System', () => {
  describe('hasPermission function', () => {
    it('should allow admin access to all resources', () => {
      expect(hasPermission('admin', 'view', 'leads')).toBe(true);
      expect(hasPermission('admin', 'edit', 'students')).toBe(true);
      expect(hasPermission('admin', 'delete', 'courses')).toBe(true);
      expect(hasPermission('admin', 'create', 'anything')).toBe(true);
    });

    it('should allow call center agents access to lead management', () => {
      expect(hasPermission('call_center', 'view', 'leads')).toBe(true);
      expect(hasPermission('call_center', 'edit', 'lead_status')).toBe(true);
      expect(hasPermission('call_center', 'create', 'new_leads')).toBe(true);
      expect(hasPermission('call_center', 'delete', 'duplicate_leads')).toBe(true);
    });

    it('should allow supervisors broader access', () => {
      expect(hasPermission('supervisor', 'view', 'students')).toBe(true);
      expect(hasPermission('supervisor', 'view', 'teachers')).toBe(true);
      expect(hasPermission('supervisor', 'view', 'leads')).toBe(true);
      expect(hasPermission('supervisor', 'edit', 'leads')).toBe(true);
    });

    it('should allow mentors limited lead access', () => {
      expect(hasPermission('mentor', 'view', 'leads')).toBe(true);
      expect(hasPermission('mentor', 'view', 'follow_up_leads')).toBe(true);
      expect(hasPermission('mentor', 'edit', 'lead_follow_up')).toBe(true);
      expect(hasPermission('mentor', 'delete', 'leads')).toBe(false); // No delete access
    });

    it('should deny teachers access to call center resources', () => {
      expect(hasPermission('teacher', 'view', 'leads')).toBe(false);
      expect(hasPermission('teacher', 'edit', 'lead_status')).toBe(false);
      expect(hasPermission('teacher', 'create', 'new_leads')).toBe(false);
    });

    it('should deny students access to call center resources', () => {
      expect(hasPermission('student', 'view', 'leads')).toBe(false);
      expect(hasPermission('student', 'edit', 'lead_status')).toBe(false);
      expect(hasPermission('student', 'create', 'new_leads')).toBe(false);
      expect(hasPermission('student', 'delete', 'anything')).toBe(false);
    });
  });

  describe('canAccessRoute function', () => {
    it('should allow call center roles access to callcenter routes', () => {
      expect(canAccessRoute('admin', '/callcenter')).toBe(true);
      expect(canAccessRoute('supervisor', '/callcenter')).toBe(true);
      expect(canAccessRoute('call_center', '/callcenter')).toBe(true);
      expect(canAccessRoute('mentor', '/callcenter')).toBe(true);
    });

    it('should deny non-call center roles access to callcenter routes', () => {
      expect(canAccessRoute('teacher', '/callcenter')).toBe(false);
      expect(canAccessRoute('student', '/callcenter')).toBe(false);
    });

    it('should allow all authenticated users access to dashboard', () => {
      const roles: UserRole[] = ['admin', 'supervisor', 'call_center', 'mentor', 'teacher', 'student', 'accountant'];
      roles.forEach(role => {
        expect(canAccessRoute(role, '/dashboard')).toBe(true);
      });
    });

    it('should allow everyone access to public routes', () => {
      const roles: UserRole[] = ['admin', 'supervisor', 'call_center', 'mentor', 'teacher', 'student'];
      roles.forEach(role => {
        expect(canAccessRoute(role, '/auth')).toBe(true);
        expect(canAccessRoute(role, '/demo')).toBe(true);
      });
    });
  });

  describe('ROLE_PERMISSIONS configuration', () => {
    it('should have proper admin permissions', () => {
      const adminPerms = ROLE_PERMISSIONS.admin;
      expect(adminPerms.canView).toContain('*');
      expect(adminPerms.canEdit).toContain('*');
      expect(adminPerms.canDelete).toContain('*');
      expect(adminPerms.canCreate).toContain('*');
      expect(adminPerms.systemConfig).toBe(true);
      expect(adminPerms.userManagement).toBe(true);
    });

    it('should have proper call center agent permissions', () => {
      const ccPerms = ROLE_PERMISSIONS.call_center;
      expect(ccPerms.canView).toContain('leads');
      expect(ccPerms.canEdit).toContain('lead_status');
      expect(ccPerms.canCreate).toContain('new_leads');
      expect(ccPerms.leadManagement).toBe(true);
      expect(ccPerms.customerCommunication).toBe(true);
    });

    it('should have proper supervisor permissions', () => {
      const supPerms = ROLE_PERMISSIONS.supervisor;
      expect(supPerms.canView).toContain('leads');
      expect(supPerms.canView).toContain('students');
      expect(supPerms.canView).toContain('teachers');
      expect(supPerms.qualityAssurance).toBe(true);
      expect(supPerms.teacherEvaluation).toBe(true);
    });

    it('should have limited mentor permissions', () => {
      const mentorPerms = ROLE_PERMISSIONS.mentor;
      expect(mentorPerms.canView).toContain('leads');
      expect(mentorPerms.canView).toContain('follow_up_leads');
      expect(mentorPerms.canDelete).toHaveLength(0); // No delete permissions
      expect(mentorPerms.goalSetting).toBe(true);
      expect(mentorPerms.progressTracking).toBe(true);
    });

    it('should have limited student permissions', () => {
      const studentPerms = ROLE_PERMISSIONS.student;
      expect(studentPerms.canView).not.toContain('leads');
      expect(studentPerms.canView).toContain('own_profile');
      expect(studentPerms.canView).toContain('enrolled_courses');
      expect(studentPerms.learningAccess).toBe(true);
    });

    it('should have limited teacher permissions', () => {
      const teacherPerms = ROLE_PERMISSIONS.teacher;
      expect(teacherPerms.canView).not.toContain('leads');
      expect(teacherPerms.canView).toContain('own_students');
      expect(teacherPerms.canView).toContain('own_courses');
      expect(teacherPerms.gradeManagement).toBe(true);
      expect(teacherPerms.contentCreation).toBe(true);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle unknown resources gracefully', () => {
      expect(hasPermission('admin', 'view', 'unknown_resource')).toBe(true); // Admin has wildcard
      expect(hasPermission('student', 'view', 'unknown_resource')).toBe(false);
      expect(hasPermission('call_center', 'view', 'unknown_resource')).toBe(false);
    });

    it('should handle unknown routes', () => {
      expect(canAccessRoute('admin', '/unknown/route')).toBe(false);
      expect(canAccessRoute('student', '/unknown/route')).toBe(false);
    });

    it('should validate all required permission fields exist', () => {
      const allRoles: UserRole[] = ['admin', 'supervisor', 'call_center', 'mentor', 'teacher', 'student', 'accountant'];
      
      allRoles.forEach(role => {
        const perms = ROLE_PERMISSIONS[role];
        expect(perms).toBeDefined();
        expect(Array.isArray(perms.canView)).toBe(true);
        expect(Array.isArray(perms.canEdit)).toBe(true);
        expect(Array.isArray(perms.canDelete)).toBe(true);
        expect(Array.isArray(perms.canCreate)).toBe(true);
      });
    });
  });

  describe('Workflow-specific permissions', () => {
    it('should allow proper workflow stage access', () => {
      // Admin can access all workflow stages
      expect(hasPermission('admin', 'view', 'leads')).toBe(true);
      expect(hasPermission('admin', 'edit', 'leads')).toBe(true);

      // Call center can manage leads through workflow
      expect(hasPermission('call_center', 'view', 'leads')).toBe(true);
      expect(hasPermission('call_center', 'edit', 'lead_status')).toBe(true);
      expect(hasPermission('call_center', 'create', 'new_leads')).toBe(true);

      // Supervisors can oversee workflows
      expect(hasPermission('supervisor', 'view', 'leads')).toBe(true);
      expect(hasPermission('supervisor', 'edit', 'leads')).toBe(true);

      // Mentors have limited workflow access
      expect(hasPermission('mentor', 'view', 'leads')).toBe(true);
      expect(hasPermission('mentor', 'edit', 'lead_follow_up')).toBe(true);
    });

    it('should block inappropriate workflow access', () => {
      // Teachers should not access lead workflow
      expect(hasPermission('teacher', 'view', 'leads')).toBe(false);
      expect(hasPermission('teacher', 'edit', 'lead_status')).toBe(false);

      // Students should have no workflow access
      expect(hasPermission('student', 'view', 'leads')).toBe(false);
      expect(hasPermission('student', 'edit', 'lead_status')).toBe(false);
      expect(hasPermission('student', 'create', 'new_leads')).toBe(false);
    });
  });
});