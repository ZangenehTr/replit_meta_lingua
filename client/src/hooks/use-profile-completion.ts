import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

interface ProfileData {
  culturalBackground?: string;
  nativeLanguage?: string;
  targetLanguages?: string[];
  proficiencyLevel?: string;
  learningGoals?: string[];
  learningStyle?: string;
  timezone?: string;
  preferredStudyTime?: string;
  weeklyStudyHours?: number;
  personalityType?: string;
  motivationFactors?: string[];
  learningChallenges?: string[];
  strengths?: string[];
  interests?: string[];
  bio?: string;
}

interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  hasEverCompletedProfile: boolean;
  isFirstLogin: boolean;
}

const ESSENTIAL_FIELDS = [
  'nativeLanguage',
  'proficiencyLevel',
  'learningGoals',
  'learningStyle',
  'weeklyStudyHours'
];

const OPTIONAL_FIELDS = [
  'culturalBackground',
  'targetLanguages',
  'timezone',
  'preferredStudyTime',
  'personalityType',
  'motivationFactors',
  'learningChallenges',
  'strengths',
  'interests',
  'bio'
];

export function useProfileCompletion() {
  const { user, isAuthenticated } = useAuth();

  const { data: profile } = useQuery<ProfileData | null>({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      
      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (!response.ok) {
          return null;
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
    },
    enabled: isAuthenticated && !!user
  });

  const checkProfileCompletion = (): ProfileCompletionStatus => {
    if (!profile || !user) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ESSENTIAL_FIELDS,
        hasEverCompletedProfile: false,
        isFirstLogin: true
      };
    }

    // Check essential fields
    const missingEssentialFields = ESSENTIAL_FIELDS.filter(field => {
      const value = profile[field as keyof ProfileData];
      return !value || (Array.isArray(value) && value.length === 0);
    });

    // Check optional fields for completion percentage
    const completedOptionalFields = OPTIONAL_FIELDS.filter(field => {
      const value = profile[field as keyof ProfileData];
      return value && (!Array.isArray(value) || value.length > 0);
    });

    const totalFields = ESSENTIAL_FIELDS.length + OPTIONAL_FIELDS.length;
    const completedFields = ESSENTIAL_FIELDS.length - missingEssentialFields.length + completedOptionalFields.length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    // Profile is considered complete if all essential fields are filled
    const isComplete = missingEssentialFields.length === 0;

    // Check if user has ever filled out any profile information
    const hasAnyProfileData = Object.values(profile).some(value => 
      value && (!Array.isArray(value) || value.length > 0)
    );

    // Check if this might be a first login
    // This is a heuristic - if they have no profile data and it's a Student role
    const isFirstLogin = !hasAnyProfileData && user.role === 'Student';

    return {
      isComplete,
      completionPercentage,
      missingFields: missingEssentialFields,
      hasEverCompletedProfile: hasAnyProfileData,
      isFirstLogin
    };
  };

  const completionStatus = checkProfileCompletion();

  return {
    profile,
    user,
    isAuthenticated,
    ...completionStatus
  };
}