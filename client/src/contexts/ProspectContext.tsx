import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { 
  Lead,
  GuestLead,
  User
} from '@shared/schema';

interface UnifiedProspect {
  id: string;
  type: 'lead' | 'guest';
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  source?: string;
  nationalId?: string;
  age?: number;
  gender?: string;
  score?: number;
  cefr?: string;
  data: Lead | GuestLead;
}

interface ProspectContextValue {
  // Current prospect being worked on
  currentProspect: UnifiedProspect | null;
  setCurrentProspect: (prospect: UnifiedProspect | null) => void;
  
  // Prospects list
  prospects: UnifiedProspect[];
  isLoadingProspects: boolean;
  refreshProspects: () => void;
  
  // Operations
  getOrCreateProspect: (data: {
    phone?: string;
    email?: string;
    name?: string;
    source?: string;
  }) => Promise<Lead>;
  
  mergeGuestToLead: (guestLeadId: string, leadId: string) => Promise<void>;
  
  enrichProspect: (leadId: string, data: Partial<Lead>) => Promise<Lead>;
  
  convertToStudent: (leadId: string, options: {
    initialPayment?: number;
    paymentMethod?: 'cash' | 'card' | 'invoice' | 'online';
    enrollInCourse?: string;
    sendNotification?: boolean;
  }) => Promise<User>;
  
  // Search and filter
  findProspectByPhone: (phone: string) => UnifiedProspect | undefined;
  findProspectByEmail: (email: string) => UnifiedProspect | undefined;
}

const ProspectContext = createContext<ProspectContextValue | undefined>(undefined);

export function ProspectProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [currentProspect, setCurrentProspect] = useState<UnifiedProspect | null>(null);

  // Load prospects from ProspectLifecycle unified view
  const { data: prospects = [], isLoading: isLoadingProspects, refetch: refreshProspects } = useQuery({
    queryKey: ['/api/prospect-lifecycle/unified-view'],
    select: (data: any[]) => data.map(item => ({
      id: item.id,
      type: item.type as 'lead' | 'guest',
      name: item.name,
      email: item.email,
      phone: item.phone,
      status: item.status,
      source: item.source,
      nationalId: item.nationalId,
      age: item.age,
      gender: item.gender,
      score: item.score,
      cefr: item.cefr,
      data: item.data
    }))
  });

  // Get or create prospect mutation
  const getOrCreateMutation = useMutation({
    mutationFn: async (data: { phone?: string; email?: string; name?: string; source?: string }) => {
      return apiRequest('/api/prospect-lifecycle/get-or-create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (lead: Lead) => {
      queryClient.invalidateQueries({ queryKey: ['/api/prospect-lifecycle'] });
      refreshProspects();
      return lead;
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ایجاد یا یافتن سرنخ',
        variant: 'destructive'
      });
    }
  });

  // Merge guest to lead mutation
  const mergeMutation = useMutation({
    mutationFn: async ({ guestLeadId, leadId }: { guestLeadId: string; leadId: string }) => {
      return apiRequest(`/api/prospect-lifecycle/merge-guest/${guestLeadId}/${leadId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prospect-lifecycle'] });
      refreshProspects();
      toast({
        title: 'موفقیت',
        description: 'اطلاعات مهمان با موفقیت به سرنخ اصلی منتقل شد'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ادغام اطلاعات',
        variant: 'destructive'
      });
    }
  });

  // Enrich prospect mutation
  const enrichMutation = useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: Partial<Lead> }) => {
      return apiRequest(`/api/prospect-lifecycle/enrich/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (lead: Lead) => {
      queryClient.invalidateQueries({ queryKey: ['/api/prospect-lifecycle'] });
      refreshProspects();
      toast({
        title: 'موفقیت',
        description: 'اطلاعات سرنخ با موفقیت بروزرسانی شد'
      });
      return lead;
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بروزرسانی اطلاعات',
        variant: 'destructive'
      });
    }
  });

  // Convert to student mutation
  const convertMutation = useMutation({
    mutationFn: async ({ leadId, options }: { 
      leadId: string; 
      options: {
        initialPayment?: number;
        paymentMethod?: 'cash' | 'card' | 'invoice' | 'online';
        enrollInCourse?: string;
        sendNotification?: boolean;
      }
    }) => {
      return apiRequest(`/api/prospect-lifecycle/convert/${leadId}`, {
        method: 'POST',
        body: JSON.stringify(options)
      });
    },
    onSuccess: (user: User) => {
      queryClient.invalidateQueries({ queryKey: ['/api/prospect-lifecycle'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      refreshProspects();
      toast({
        title: 'تبریک!',
        description: `سرنخ با موفقیت به دانشجو تبدیل شد. کد ورود OTP: ${user.otpCode}`
      });
      return user;
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در تبدیل سرنخ به دانشجو',
        variant: 'destructive'
      });
    }
  });

  // Helper functions
  const findProspectByPhone = (phone: string) => {
    return prospects.find(p => p.phone === phone);
  };

  const findProspectByEmail = (email: string) => {
    return prospects.find(p => p.email === email);
  };

  const getOrCreateProspect = async (data: {
    phone?: string;
    email?: string;
    name?: string;
    source?: string;
  }) => {
    return getOrCreateMutation.mutateAsync(data);
  };

  const mergeGuestToLead = async (guestLeadId: string, leadId: string) => {
    return mergeMutation.mutateAsync({ guestLeadId, leadId });
  };

  const enrichProspect = async (leadId: string, data: Partial<Lead>) => {
    return enrichMutation.mutateAsync({ leadId, data });
  };

  const convertToStudent = async (leadId: string, options: {
    initialPayment?: number;
    paymentMethod?: 'cash' | 'card' | 'invoice' | 'online';
    enrollInCourse?: string;
    sendNotification?: boolean;
  }) => {
    return convertMutation.mutateAsync({ leadId, options });
  };

  // Persist current prospect in sessionStorage for form recovery
  useEffect(() => {
    if (currentProspect) {
      sessionStorage.setItem('currentProspect', JSON.stringify(currentProspect));
    } else {
      sessionStorage.removeItem('currentProspect');
    }
  }, [currentProspect]);

  // Recover current prospect on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('currentProspect');
    if (stored) {
      try {
        setCurrentProspect(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to recover current prospect:', e);
      }
    }
  }, []);

  return (
    <ProspectContext.Provider value={{
      currentProspect,
      setCurrentProspect,
      prospects,
      isLoadingProspects,
      refreshProspects,
      getOrCreateProspect,
      mergeGuestToLead,
      enrichProspect,
      convertToStudent,
      findProspectByPhone,
      findProspectByEmail
    }}>
      {children}
    </ProspectContext.Provider>
  );
}

export function useProspect() {
  const context = useContext(ProspectContext);
  if (!context) {
    throw new Error('useProspect must be used within ProspectProvider');
  }
  return context;
}