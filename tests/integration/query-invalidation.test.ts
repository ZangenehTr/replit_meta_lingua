import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { 
  invalidationPatterns,
  optimisticUpdate,
  batchInvalidate,
  queryKeys
} from '@/lib/query-utils';

describe('Query Invalidation Patterns', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('invalidationPatterns', () => {
    it('should invalidate correct queries for user changes', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      invalidationPatterns.userChange(queryClient);

      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.users.all 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.users.list 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.dashboard.stats 
      });
    });

    it('should invalidate correct queries for teacher changes', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      invalidationPatterns.teacherChange(queryClient);

      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.teachers.all 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.teachers.list 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.teachers.available 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.dashboard.stats 
      });
    });

    it('should invalidate correct queries for course enrollment', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      invalidationPatterns.enrollmentChange(queryClient);

      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.courses.my 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.courses.available 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.dashboard.all 
      });
    });

    it('should invalidate correct queries for financial changes', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      invalidationPatterns.financialChange(queryClient);

      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.financial.all 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.financial.overview 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.financial.payments 
      });
    });

    it('should invalidate correct queries for session changes', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      invalidationPatterns.sessionChange(queryClient);

      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.sessions.all 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.sessions.upcoming 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.sessions.teacher 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.dashboard.all 
      });
    });

    it('should invalidate roadmap-specific queries when roadmapId provided', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const roadmapId = 123;
      
      invalidationPatterns.roadmapChange(queryClient, roadmapId);

      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.roadmaps.all 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.roadmaps.detail(roadmapId) 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.roadmaps.milestones(roadmapId) 
      });
    });
  });

  describe('optimisticUpdate', () => {
    it('should update query data optimistically', () => {
      const oldData = { count: 5, items: ['a', 'b'] };
      const queryKey = ['test-key'] as const;
      
      queryClient.setQueryData(queryKey, oldData);
      
      const previousData = optimisticUpdate(
        queryClient,
        queryKey,
        (data: typeof oldData) => ({
          ...data,
          count: data.count + 1,
          items: [...data.items, 'c'],
        })
      );

      expect(previousData).toEqual(oldData);
      expect(queryClient.getQueryData(queryKey)).toEqual({
        count: 6,
        items: ['a', 'b', 'c'],
      });
    });

    it('should return undefined if no previous data exists', () => {
      const queryKey = ['non-existent'] as const;
      
      const previousData = optimisticUpdate(
        queryClient,
        queryKey,
        (data: any) => ({ ...data, updated: true })
      );

      expect(previousData).toBeUndefined();
      expect(queryClient.getQueryData(queryKey)).toBeUndefined();
    });
  });

  describe('batchInvalidate', () => {
    it('should execute multiple invalidation patterns', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const refetchSpy = vi.spyOn(queryClient, 'refetchQueries').mockResolvedValue();
      
      await batchInvalidate(queryClient, [
        (qc) => invalidationPatterns.userChange(qc),
        (qc) => invalidationPatterns.teacherChange(qc),
      ]);

      // Check that all expected invalidations occurred
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.users.all 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.teachers.all 
      });
      expect(refetchSpy).toHaveBeenCalled();
    });
  });

  describe('queryKeys', () => {
    it('should generate correct query keys for detail views', () => {
      expect(queryKeys.users.detail(42)).toEqual(['/api/users', 42]);
      expect(queryKeys.teachers.detail(10)).toEqual(['/api/teachers', 10]);
      expect(queryKeys.students.detail(5)).toEqual(['/api/students', 5]);
      expect(queryKeys.courses.detail(3)).toEqual(['/api/courses', 3]);
    });

    it('should generate correct query keys with parameters', () => {
      expect(queryKeys.users.byRole('Admin')).toEqual(['/api/users', { role: 'Admin' }]);
      expect(queryKeys.classes.teacher(15)).toEqual(['/api/supervision/teacher-classes', 15]);
    });

    it('should generate correct nested query keys', () => {
      expect(queryKeys.students.progress(7)).toEqual(['/api/students', 7, 'progress']);
      expect(queryKeys.teachers.availability(9)).toEqual(['/api/teachers', 9, 'availability']);
      expect(queryKeys.roadmaps.milestones(4)).toEqual(['/api/roadmaps', 4, 'milestones']);
    });
  });

  describe('Query Invalidation Integration', () => {
    it('should handle cascading invalidations correctly', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      // Simulate a teacher being assigned to a student
      invalidationPatterns.assignmentChange(queryClient);

      // Should invalidate both unassigned students and available teachers
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.students.unassigned 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.teachers.available 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.sessions.all 
      });
    });

    it('should handle observation changes with comprehensive invalidation', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      invalidationPatterns.observationChange(queryClient);

      // Should invalidate all observation-related queries
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.supervision.pending 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.supervision.scheduled 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.supervision.overdue 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.supervision.upcoming 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.observations.all 
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: queryKeys.dashboard.stats 
      });
    });
  });
});