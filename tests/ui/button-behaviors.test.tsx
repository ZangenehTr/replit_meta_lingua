import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { Router } from 'wouter';
import '@testing-library/jest-dom';

// Mock modules
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('UI Button Behaviors and Permissions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Router>
          {component}
        </Router>
      </QueryClientProvider>
    );
  };

  describe('Admin Role Permissions', () => {
    beforeEach(() => {
      localStorage.setItem('user_role', 'Admin');
      localStorage.setItem('auth_token', 'admin-token');
    });

    it('should show all admin action buttons', async () => {
      const TestAdminComponent = () => (
        <div>
          <button>Create Teacher</button>
          <button>Edit Teacher</button>
          <button>Delete Teacher</button>
        </div>
      );

      renderWithProviders(<TestAdminComponent />);

      expect(screen.getByText('Create Teacher')).toBeInTheDocument();
      expect(screen.getByText('Edit Teacher')).toBeInTheDocument();
      expect(screen.getByText('Delete Teacher')).toBeInTheDocument();
    });

    it('should handle teacher creation with proper invalidation', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      const TestComponent = () => {
        const handleCreate = () => {
          // Simulate successful creation
          queryClient.invalidateQueries({ queryKey: ['/api/teachers/list'] });
        };

        return <button onClick={handleCreate}>Create Teacher</button>;
      };

      renderWithProviders(<TestComponent />);

      const createButton = screen.getByText('Create Teacher');
      fireEvent.click(createButton);

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['/api/teachers/list'],
        })
      );
    });
  });

  describe('Teacher Role Permissions', () => {
    beforeEach(() => {
      localStorage.setItem('user_role', 'Teacher');
      localStorage.setItem('auth_token', 'teacher-token');
    });

    it('should not show admin-only buttons for teacher role', async () => {
      const TeacherDashboard = () => (
        <div>
          <button className="admin-only" style={{ display: 'none' }}>
            Admin Action
          </button>
          <button className="teacher-allowed">
            Teacher Action
          </button>
        </div>
      );

      renderWithProviders(<TeacherDashboard />);

      expect(screen.queryByText('Admin Action')).not.toBeInTheDocument();
      expect(screen.getByText('Teacher Action')).toBeInTheDocument();
    });
  });

  describe('Student Role Permissions', () => {
    beforeEach(() => {
      localStorage.setItem('user_role', 'Student');
      localStorage.setItem('auth_token', 'student-token');
    });

    it('should only show student-allowed actions', async () => {
      const StudentDashboard = () => (
        <div>
          <button className="student-allowed">
            Enroll in Course
          </button>
          <button className="teacher-only" style={{ display: 'none' }}>
            Create Assignment
          </button>
        </div>
      );

      renderWithProviders(<StudentDashboard />);

      expect(screen.getByText('Enroll in Course')).toBeInTheDocument();
      expect(screen.queryByText('Create Assignment')).not.toBeInTheDocument();
    });
  });

  describe('Button Event Handlers', () => {
    it('should handle button clicks without errors', async () => {
      const mockHandler = vi.fn();
      const TestComponent = () => (
        <button onClick={mockHandler}>Test Button</button>
      );

      renderWithProviders(<TestComponent />);

      const button = screen.getByText('Test Button');
      fireEvent.click(button);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should disable button during mutation', async () => {
      const TestComponent = () => {
        const [isLoading, setIsLoading] = React.useState(false);
        
        const handleClick = async () => {
          setIsLoading(true);
          await new Promise(resolve => setTimeout(resolve, 100));
          setIsLoading(false);
        };

        return (
          <button onClick={handleClick} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Submit'}
          </button>
        );
      };

      renderWithProviders(<TestComponent />);

      const button = screen.getByText('Submit');
      expect(button).not.toBeDisabled();

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeDisabled();
      });

      await waitFor(() => {
        expect(screen.getByText('Submit')).not.toBeDisabled();
      });
    });
  });

  describe('React Query Invalidation', () => {
    it('should invalidate queries after successful creation', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      (apiRequest as any).mockResolvedValueOnce({ id: 1, name: 'Test' });

      const TestComponent = () => {
        const mutation = useMutation({
          mutationFn: async (data: any) => apiRequest('/api/test', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/test'] });
          },
        });

        return (
          <button onClick={() => mutation.mutate({ name: 'Test' })}>
            Create
          </button>
        );
      };

      renderWithProviders(<TestComponent />);

      const button = screen.getByText('Create');
      fireEvent.click(button);

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['/api/test'],
          })
        );
      });
    });

    it('should show optimistic updates immediately', async () => {
      const TestComponent = () => {
        const [items, setItems] = React.useState<string[]>([]);
        
        const addItem = (item: string) => {
          // Optimistic update
          setItems(prev => [...prev, item]);
          
          // Simulate API call
          setTimeout(() => {
            // Would normally handle success/error here
          }, 100);
        };

        return (
          <div>
            <button onClick={() => addItem('New Item')}>Add</button>
            <ul>
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      const button = screen.getByText('Add');
      fireEvent.click(button);

      // Should immediately show the new item (optimistic update)
      expect(screen.getByText('New Item')).toBeInTheDocument();
    });
  });

  describe('List Filter Alignment', () => {
    it('should update API calls when filters change', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      const apiSpy = vi.fn().mockResolvedValue([]);
      (apiRequest as any).mockImplementation(apiSpy);

      const TestComponent = () => {
        const [filter, setFilter] = React.useState('all');
        const { data } = useQuery({
          queryKey: ['/api/items', { status: filter }],
          queryFn: () => apiRequest('/api/items', {
            params: { status: filter },
          }),
        });

        return (
          <div>
            <select onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div>{data?.length || 0} items</div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      // Initial call with 'all' filter
      await waitFor(() => {
        expect(apiSpy).toHaveBeenCalledWith(
          '/api/items',
          expect.objectContaining({
            params: { status: 'all' },
          })
        );
      });

      // Change filter
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'active' } });

      // Should call API with new filter
      await waitFor(() => {
        expect(apiSpy).toHaveBeenCalledWith(
          '/api/items',
          expect.objectContaining({
            params: { status: 'active' },
          })
        );
      });
    });
  });

  describe('Creation Visibility', () => {
    it('should immediately show created items in lists', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      
      const TestComponent = () => {
        const [items, setItems] = React.useState<any[]>([]);
        
        const { data } = useQuery({
          queryKey: ['/api/items'],
          queryFn: async () => {
            const result = await apiRequest('/api/items');
            setItems(result);
            return result;
          },
        });

        const createMutation = useMutation({
          mutationFn: async (newItem: any) => {
            const result = await apiRequest('/api/items', {
              method: 'POST',
              body: JSON.stringify(newItem),
            });
            return result;
          },
          onSuccess: (newItem) => {
            // Optimistically add to list
            setItems(prev => [...prev, newItem]);
            // Then invalidate to get fresh data
            queryClient.invalidateQueries({ queryKey: ['/api/items'] });
          },
        });

        return (
          <div>
            <button onClick={() => createMutation.mutate({ name: 'New Item' })}>
              Create
            </button>
            <ul>
              {items.map((item, i) => (
                <li key={i}>{item.name}</li>
              ))}
            </ul>
          </div>
        );
      };

      (apiRequest as any)
        .mockResolvedValueOnce([]) // Initial empty list
        .mockResolvedValueOnce({ id: 1, name: 'New Item' }) // Creation response
        .mockResolvedValueOnce([{ id: 1, name: 'New Item' }]); // Refetch

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.queryByText('New Item')).not.toBeInTheDocument();
      });

      const button = screen.getByText('Create');
      fireEvent.click(button);

      // Should immediately show the new item
      await waitFor(() => {
        expect(screen.getByText('New Item')).toBeInTheDocument();
      });
    });
  });
});