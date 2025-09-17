import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../client/src/i18n';

// Import workflow components
import ContactDesk from '../../client/src/pages/callcenter/workflow-stages/contact-desk';
import NewIntake from '../../client/src/pages/callcenter/workflow-stages/new-intake';
import NoResponse from '../../client/src/pages/callcenter/workflow-stages/no-response';
import FollowUp from '../../client/src/pages/callcenter/workflow-stages/follow-up';
import LevelAssessment from '../../client/src/pages/callcenter/workflow-stages/level-assessment';
import Withdrawal from '../../client/src/pages/callcenter/workflow-stages/withdrawal';

// Mock API client
vi.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
}));

// Mock authentication
vi.mock('../../client/src/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'Admin', firstName: 'Test', lastName: 'Admin' }
  })
}));

// Mock toast
vi.mock('../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock language hook
vi.mock('../../client/src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    isRTL: true,
    language: 'fa'
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('Workflow Stage Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contact Desk Component', () => {
    it('should render search input and phone number field', () => {
      renderWithProviders(<ContactDesk />);
      
      expect(screen.getByTestId('input-search')).toBeInTheDocument();
      expect(screen.getByTestId('input-phone-number')).toBeInTheDocument();
    });

    it('should search by phone number on form submit', async () => {
      const { apiRequest } = await import('../../client/src/lib/queryClient');
      (apiRequest as any).mockResolvedValueOnce({ id: 1, firstName: 'احمد', phoneNumber: '09123456789' });

      renderWithProviders(<ContactDesk />);
      
      const phoneInput = screen.getByTestId('input-phone-number');
      const searchButton = screen.getByTestId('button-search-phone');

      fireEvent.change(phoneInput, { target: { value: '09123456789' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/api/leads/search-by-phone?phoneNumber=09123456789');
      });
    });

    it('should create new lead when not found', async () => {
      const { apiRequest } = await import('../../client/src/lib/queryClient');
      (apiRequest as any).mockRejectedValueOnce(new Error('Not found'));

      renderWithProviders(<ContactDesk />);
      
      const phoneInput = screen.getByTestId('input-phone-number');
      const createButton = screen.getByTestId('button-create-new-lead');

      fireEvent.change(phoneInput, { target: { value: '09187654321' } });
      fireEvent.click(createButton);

      // Verify new lead creation dialog appears
      await waitFor(() => {
        expect(screen.getByText('ایجاد متقاضی جدید')).toBeInTheDocument();
      });
    });
  });

  describe('New Intake Component', () => {
    beforeEach(() => {
      const { apiRequest } = vi.mocked(require('../../client/src/lib/queryClient').apiRequest);
      apiRequest.mockResolvedValue([
        { id: 1, firstName: 'احمد', lastName: 'محمدی', phoneNumber: '09123456789', workflowStatus: 'new_intake' }
      ]);
    });

    it('should render intake form fields', async () => {
      renderWithProviders(<NewIntake />);

      await waitFor(() => {
        expect(screen.getByTestId('input-first-name')).toBeInTheDocument();
        expect(screen.getByTestId('input-last-name')).toBeInTheDocument();
        expect(screen.getByTestId('select-interested-language')).toBeInTheDocument();
        expect(screen.getByTestId('select-course-target')).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      renderWithProviders(<NewIntake />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('input-first-name')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('button-submit-intake');
      fireEvent.click(submitButton);

      // Form validation should prevent submission
      await waitFor(() => {
        expect(screen.getByText(/نام الزامی است/)).toBeInTheDocument();
      });
    });

    it('should show conditional fields based on course selection', async () => {
      renderWithProviders(<NewIntake />);

      await waitFor(() => {
        const courseSelect = screen.getByTestId('select-course-target');
        fireEvent.change(courseSelect, { target: { value: 'IELTS' } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('select-course-module')).toBeInTheDocument();
      });
    });
  });

  describe('No Response Component', () => {
    beforeEach(() => {
      const { apiRequest } = vi.mocked(require('../../client/src/lib/queryClient').apiRequest);
      apiRequest.mockResolvedValue([
        { id: 1, firstName: 'فاطمه', callCount: 2, nextCallDate: new Date().toISOString() }
      ]);
    });

    it('should display leads with call count', async () => {
      renderWithProviders(<NoResponse />);

      await waitFor(() => {
        expect(screen.getByTestId('lead-name-1')).toBeInTheDocument();
        expect(screen.getByText('2 تماس')).toBeInTheDocument();
      });
    });

    it('should record call attempt', async () => {
      const { apiRequest } = vi.mocked(require('../../client/src/lib/queryClient').apiRequest);
      
      renderWithProviders(<NoResponse />);

      await waitFor(() => {
        const callButton = screen.getByTestId('button-call-attempt-1');
        fireEvent.click(callButton);
      });

      // Verify call attempt dialog
      await waitFor(() => {
        expect(screen.getByText('ثبت تماس')).toBeInTheDocument();
      });

      const notesInput = screen.getByTestId('textarea-call-notes');
      const submitButton = screen.getByTestId('button-submit-call');

      fireEvent.change(notesInput, { target: { value: 'تماس بی‌پاسخ' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/api/leads/1/call-attempt', {
          method: 'POST',
          body: expect.stringContaining('no_answer')
        });
      });
    });
  });

  describe('Follow-up Component', () => {
    beforeEach(() => {
      const { apiRequest } = vi.mocked(require('../../client/src/lib/queryClient').apiRequest);
      apiRequest.mockResolvedValue([
        { id: 1, firstName: 'علی', followUpStart: new Date().toISOString(), smsReminderEnabled: true }
      ]);
    });

    it('should display categorized leads (today, overdue, upcoming)', async () => {
      renderWithProviders(<FollowUp />);

      await waitFor(() => {
        expect(screen.getByText(/امروز/)).toBeInTheDocument();
        expect(screen.getByText(/برنامه‌ریزی شده/)).toBeInTheDocument();
      });
    });

    it('should schedule follow-up with date and time', async () => {
      renderWithProviders(<FollowUp />);

      await waitFor(() => {
        const scheduleButton = screen.getByTestId('button-schedule-followup-1');
        fireEvent.click(scheduleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('برنامه‌ریزی پیگیری')).toBeInTheDocument();
        expect(screen.getByTestId('time-picker')).toBeInTheDocument();
      });
    });

    it('should enable SMS reminder toggle', async () => {
      renderWithProviders(<FollowUp />);

      await waitFor(() => {
        const smsToggle = screen.getByTestId('switch-sms-reminder');
        expect(smsToggle).toBeInTheDocument();
        fireEvent.click(smsToggle);
      });
    });
  });

  describe('Level Assessment Component', () => {
    beforeEach(() => {
      const { apiRequest } = vi.mocked(require('../../client/src/lib/queryClient').apiRequest);
      apiRequest.mockResolvedValue([
        { id: 1, firstName: 'مریم', workflowStatus: 'level_assessment' }
      ]);
    });

    it('should render assessment scheduling interface', async () => {
      renderWithProviders(<LevelAssessment />);

      await waitFor(() => {
        expect(screen.getByTestId('lead-name-1')).toBeInTheDocument();
      });
    });

    it('should schedule assessment with time slots', async () => {
      renderWithProviders(<LevelAssessment />);

      await waitFor(() => {
        const scheduleButton = screen.getByTestId('button-schedule-assessment-1');
        fireEvent.click(scheduleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('برنامه‌ریزی تعیین سطح')).toBeInTheDocument();
        // Time slots should be available
        expect(screen.getByText('09:00')).toBeInTheDocument();
        expect(screen.getByText('10:00')).toBeInTheDocument();
      });
    });

    it('should complete assessment with proficiency level', async () => {
      renderWithProviders(<LevelAssessment />);

      await waitFor(() => {
        const completeButton = screen.getByTestId('button-complete-assessment-1');
        fireEvent.click(completeButton);
      });

      await waitFor(() => {
        expect(screen.getByText('مبتدی (A1)')).toBeInTheDocument();
        expect(screen.getByText('متوسط (B1)')).toBeInTheDocument();
      });
    });
  });

  describe('Withdrawal Component', () => {
    beforeEach(() => {
      const { apiRequest } = vi.mocked(require('../../client/src/lib/queryClient').apiRequest);
      apiRequest.mockResolvedValue([
        { id: 1, firstName: 'حسن', withdrawalReason: null, workflowStatus: 'withdrawal' }
      ]);
    });

    it('should display withdrawal statistics', async () => {
      renderWithProviders(<Withdrawal />);

      await waitFor(() => {
        expect(screen.getByText(/کل انصراف امروز/)).toBeInTheDocument();
        expect(screen.getByText(/بدون دلیل مشخص/)).toBeInTheDocument();
        expect(screen.getByText(/قابل بازگردانی/)).toBeInTheDocument();
      });
    });

    it('should add withdrawal reason', async () => {
      renderWithProviders(<Withdrawal />);

      await waitFor(() => {
        const addReasonButton = screen.getByTestId('button-add-reason-1');
        fireEvent.click(addReasonButton);
      });

      await waitFor(() => {
        expect(screen.getByText('ثبت دلیل انصراف')).toBeInTheDocument();
        expect(screen.getByText('شرایط مالی')).toBeInTheDocument();
        expect(screen.getByTestId('textarea-withdrawal-notes')).toBeInTheDocument();
      });
    });

    it('should reactivate withdrawn lead', async () => {
      const { apiRequest } = vi.mocked(require('../../client/src/lib/queryClient').apiRequest);
      
      renderWithProviders(<Withdrawal />);

      await waitFor(() => {
        const reactivateButton = screen.getByTestId('button-reactivate-1');
        fireEvent.click(reactivateButton);
      });

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/api/leads/1', {
          method: 'PUT',
          body: expect.stringContaining('follow_up')
        });
      });
    });
  });
});