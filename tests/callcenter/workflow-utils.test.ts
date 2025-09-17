import { describe, it, expect } from 'vitest';
import { WORKFLOW_STATUS, LEAD_STATUS } from '@shared/schema';

describe('Workflow Utilities and Constants', () => {
  describe('Workflow Status Values', () => {
    it('should have all required workflow statuses', () => {
      expect(WORKFLOW_STATUS.CONTACT_DESK).toBe('دفتر_تلفن');
      expect(WORKFLOW_STATUS.NEW_INTAKE).toBe('ورودی_جدید');
      expect(WORKFLOW_STATUS.NO_RESPONSE).toBe('پاسخ_نداده');
      expect(WORKFLOW_STATUS.FOLLOW_UP).toBe('پیگیری');
      expect(WORKFLOW_STATUS.LEVEL_ASSESSMENT).toBe('تعیین_سطح');
      expect(WORKFLOW_STATUS.WITHDRAWAL).toBe('انصراف');
      expect(WORKFLOW_STATUS.LEVEL_ASSESSMENT_COMPLETE).toBe('تعیین_سطح_کامل');
    });

    it('should have Persian/Farsi readable names for workflow stages', () => {
      const workflowNames = {
        [WORKFLOW_STATUS.CONTACT_DESK]: 'دفتر تماس',
        [WORKFLOW_STATUS.NEW_INTAKE]: 'ورودی جدید',
        [WORKFLOW_STATUS.NO_RESPONSE]: 'پاسخ ندادهها',
        [WORKFLOW_STATUS.FOLLOW_UP]: 'پیگیری',
        [WORKFLOW_STATUS.LEVEL_ASSESSMENT]: 'تعیین سطح',
        [WORKFLOW_STATUS.WITHDRAWAL]: 'انصراف'
      };

      Object.keys(workflowNames).forEach(status => {
        expect(workflowNames[status as keyof typeof workflowNames]).toBeTruthy();
        expect(typeof workflowNames[status as keyof typeof workflowNames]).toBe('string');
      });
    });
  });

  describe('Lead Status Values', () => {
    it('should have all required lead statuses', () => {
      expect(LEAD_STATUS.NEW).toBe('new');
      expect(LEAD_STATUS.CONTACTED).toBe('contacted');
      expect(LEAD_STATUS.QUALIFIED).toBe('qualified');
      expect(LEAD_STATUS.LOST).toBe('lost'); // Use LOST instead of NOT_INTERESTED
      expect(LEAD_STATUS.CONVERTED).toBe('converted');
      expect(LEAD_STATUS.ASSESSMENT_SCHEDULED).toBe('assessment_scheduled');
    });
  });

  describe('Workflow Progression Logic', () => {
    const getNextWorkflowStage = (current: string, outcome: 'success' | 'no_response' | 'withdrawal'): string => {
      const progressionMap: Record<string, Record<string, string>> = {
        [WORKFLOW_STATUS.CONTACT_DESK]: {
          success: WORKFLOW_STATUS.NEW_INTAKE,
          no_response: WORKFLOW_STATUS.NO_RESPONSE,
          withdrawal: WORKFLOW_STATUS.WITHDRAWAL
        },
        [WORKFLOW_STATUS.NEW_INTAKE]: {
          success: WORKFLOW_STATUS.FOLLOW_UP,
          no_response: WORKFLOW_STATUS.NO_RESPONSE,
          withdrawal: WORKFLOW_STATUS.WITHDRAWAL
        },
        [WORKFLOW_STATUS.NO_RESPONSE]: {
          success: WORKFLOW_STATUS.FOLLOW_UP,
          no_response: WORKFLOW_STATUS.NO_RESPONSE, // Stay in same stage
          withdrawal: WORKFLOW_STATUS.WITHDRAWAL
        },
        [WORKFLOW_STATUS.FOLLOW_UP]: {
          success: WORKFLOW_STATUS.LEVEL_ASSESSMENT,
          no_response: WORKFLOW_STATUS.NO_RESPONSE,
          withdrawal: WORKFLOW_STATUS.WITHDRAWAL
        },
        [WORKFLOW_STATUS.LEVEL_ASSESSMENT]: {
          success: WORKFLOW_STATUS.LEVEL_ASSESSMENT_COMPLETE,
          no_response: WORKFLOW_STATUS.NO_RESPONSE,
          withdrawal: WORKFLOW_STATUS.WITHDRAWAL
        }
      };
      
      return progressionMap[current]?.[outcome] || current;
    };

    it('should progress correctly from contact desk', () => {
      expect(getNextWorkflowStage(WORKFLOW_STATUS.CONTACT_DESK, 'success')).toBe(WORKFLOW_STATUS.NEW_INTAKE);
      expect(getNextWorkflowStage(WORKFLOW_STATUS.CONTACT_DESK, 'no_response')).toBe(WORKFLOW_STATUS.NO_RESPONSE);
      expect(getNextWorkflowStage(WORKFLOW_STATUS.CONTACT_DESK, 'withdrawal')).toBe(WORKFLOW_STATUS.WITHDRAWAL);
    });

    it('should progress correctly from new intake', () => {
      expect(getNextWorkflowStage(WORKFLOW_STATUS.NEW_INTAKE, 'success')).toBe(WORKFLOW_STATUS.FOLLOW_UP);
      expect(getNextWorkflowStage(WORKFLOW_STATUS.NEW_INTAKE, 'no_response')).toBe(WORKFLOW_STATUS.NO_RESPONSE);
      expect(getNextWorkflowStage(WORKFLOW_STATUS.NEW_INTAKE, 'withdrawal')).toBe(WORKFLOW_STATUS.WITHDRAWAL);
    });

    it('should handle no response stage correctly', () => {
      expect(getNextWorkflowStage(WORKFLOW_STATUS.NO_RESPONSE, 'success')).toBe(WORKFLOW_STATUS.FOLLOW_UP);
      expect(getNextWorkflowStage(WORKFLOW_STATUS.NO_RESPONSE, 'no_response')).toBe(WORKFLOW_STATUS.NO_RESPONSE);
      expect(getNextWorkflowStage(WORKFLOW_STATUS.NO_RESPONSE, 'withdrawal')).toBe(WORKFLOW_STATUS.WITHDRAWAL);
    });

    it('should progress from follow-up to assessment', () => {
      expect(getNextWorkflowStage(WORKFLOW_STATUS.FOLLOW_UP, 'success')).toBe(WORKFLOW_STATUS.LEVEL_ASSESSMENT);
      expect(getNextWorkflowStage(WORKFLOW_STATUS.FOLLOW_UP, 'no_response')).toBe(WORKFLOW_STATUS.NO_RESPONSE);
      expect(getNextWorkflowStage(WORKFLOW_STATUS.FOLLOW_UP, 'withdrawal')).toBe(WORKFLOW_STATUS.WITHDRAWAL);
    });

    it('should complete assessment successfully', () => {
      expect(getNextWorkflowStage(WORKFLOW_STATUS.LEVEL_ASSESSMENT, 'success')).toBe(WORKFLOW_STATUS.LEVEL_ASSESSMENT_COMPLETE);
      expect(getNextWorkflowStage(WORKFLOW_STATUS.LEVEL_ASSESSMENT, 'withdrawal')).toBe(WORKFLOW_STATUS.WITHDRAWAL);
    });
  });

  describe('Call Backoff Intervals', () => {
    const getCallBackoffInterval = (attemptNumber: number): number => {
      const intervals = [2, 24, 72, 168, 336]; // hours
      return intervals[Math.min(attemptNumber - 1, intervals.length - 1)] || 336;
    };

    it('should implement progressive backoff for call attempts', () => {
      expect(getCallBackoffInterval(1)).toBe(2);   // 2 hours
      expect(getCallBackoffInterval(2)).toBe(24);  // 1 day
      expect(getCallBackoffInterval(3)).toBe(72);  // 3 days
      expect(getCallBackoffInterval(4)).toBe(168); // 1 week
      expect(getCallBackoffInterval(5)).toBe(336); // 2 weeks
      expect(getCallBackoffInterval(10)).toBe(336); // Cap at 2 weeks
    });

    it('should handle edge cases for call intervals', () => {
      expect(getCallBackoffInterval(0)).toBe(336);   // Use the fallback interval
      expect(getCallBackoffInterval(-1)).toBe(336);  // Handle negative numbers with fallback
    });
  });

  describe('Withdrawal Reasons', () => {
    const withdrawalReasons = [
      'شرایط مالی',
      'مشکل زمانی',
      'عدم علاقه به ادامه',
      'پیدا کردن آموزشگاه دیگر',
      'مشکلات شخصی',
      'تأخیر در شروع دوره',
      'عدم انطباق سطح',
      'مشکل در برقراری ارتباط',
      'عدم تأیید والدین',
      'سایر دلایل'
    ];

    it('should have comprehensive withdrawal reasons in Persian', () => {
      expect(withdrawalReasons).toHaveLength(10);
      withdrawalReasons.forEach(reason => {
        expect(typeof reason).toBe('string');
        expect(reason.length).toBeGreaterThan(0);
      });
    });

    it('should include common withdrawal scenarios', () => {
      expect(withdrawalReasons).toContain('شرایط مالی');         // Financial conditions
      expect(withdrawalReasons).toContain('مشکل زمانی');        // Time issues
      expect(withdrawalReasons).toContain('عدم علاقه به ادامه'); // Not interested
      expect(withdrawalReasons).toContain('سایر دلایل');         // Other reasons
    });
  });

  describe('SMS Message Templates', () => {
    const getSMSTemplate = (type: 'followup' | 'assessment' | 'reminder', name: string): string => {
      const templates = {
        followup: `سلام ${name} عزیز، جلسه مشاوره شما فردا برنامه‌ریزی شده است. منتظر حضور شما هستیم.`,
        assessment: `سلام ${name} عزیز، جلسه تعیین سطح شما امروز برنامه‌ریزی شده است.`,
        reminder: `یادآوری: جلسه شما با ${name} در ساعات آینده خواهد بود.`
      };
      return templates[type] || '';
    };

    it('should generate proper Persian SMS templates', () => {
      expect(getSMSTemplate('followup', 'احمد')).toContain('احمد عزیز');
      expect(getSMSTemplate('assessment', 'مریم')).toContain('مریم عزیز');
      expect(getSMSTemplate('reminder', 'علی')).toContain('علی');
    });

    it('should include required SMS elements', () => {
      const followupSMS = getSMSTemplate('followup', 'فاطمه');
      expect(followupSMS).toContain('سلام');
      expect(followupSMS).toContain('عزیز');
      expect(followupSMS).toContain('جلسه');
      expect(followupSMS).toContain('منتظر');
    });
  });

  describe('Workflow Statistics Calculations', () => {
    const calculateConversionRate = (converted: number, total: number): number => {
      return total > 0 ? Math.round((converted / total) * 100) : 0;
    };

    const calculateAverageConversionTime = (conversions: { createdAt: string; conversionDate: string }[]): number => {
      if (conversions.length === 0) return 0;
      
      const totalDays = conversions.reduce((sum, conversion) => {
        const created = new Date(conversion.createdAt);
        const converted = new Date(conversion.conversionDate);
        const diffDays = (converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      
      return Math.round(totalDays / conversions.length);
    };

    it('should calculate conversion rate correctly', () => {
      expect(calculateConversionRate(10, 100)).toBe(10);
      expect(calculateConversionRate(25, 100)).toBe(25);
      expect(calculateConversionRate(0, 100)).toBe(0);
      expect(calculateConversionRate(10, 0)).toBe(0); // Avoid division by zero
    });

    it('should calculate average conversion time', () => {
      const conversions = [
        { createdAt: '2024-01-01', conversionDate: '2024-01-08' }, // 7 days
        { createdAt: '2024-01-01', conversionDate: '2024-01-15' }, // 14 days
        { createdAt: '2024-01-01', conversionDate: '2024-01-04' }  // 3 days
      ];
      
      expect(calculateAverageConversionTime(conversions)).toBe(8); // (7+14+3)/3 = 8
      expect(calculateAverageConversionTime([])).toBe(0); // Empty array
    });
  });
});