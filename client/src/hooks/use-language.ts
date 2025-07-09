import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface LanguageSettings {
  language: string;
  rtl: boolean;
  dateFormat: string;
  numberFormat: string;
}

export function useLanguage() {
  // Get user preferences from API - fallback to localStorage for development
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/users/me'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Disable for now, use localStorage
  });

  // Default to English unless user has specifically selected Farsi
  const currentLanguage = userPreferences?.preferences?.language || localStorage.getItem('appLanguage') || 'en';
  const isRTL = currentLanguage === 'fa';

  // Helper function to change language
  const changeLanguage = (newLanguage: string) => {
    localStorage.setItem('appLanguage', newLanguage);
    // Refresh the page to apply changes
    window.location.reload();
  };

  const texts = {
    en: {
      // Games page
      gamesTitle: "Educational Games",
      gamesDescription: "Strengthen your language skills with interactive games",
      browseGames: "Browse Games",
      progress: "Progress",
      history: "History",
      leaderboard: "Leaderboard", 
      achievements: "Achievements",
      ageGroup: "Age Group",
      allAgeGroups: "All Age Groups",
      skill: "Skill",
      allSkills: "All Skills",
      vocabulary: "Vocabulary",
      grammar: "Grammar",
      listening: "Listening",
      speaking: "Speaking",
      reading: "Reading",
      writing: "Writing",
      level: "Level",
      allLevels: "All Levels",
      minutes: "minutes",
      startGame: "Start Game",
      loading: "Loading...",
      continuGame: "Continue Game",
      completion: "Completion",
      currentLevel: "Current Level",
      timesPlayed: "Times Played",
      bestScore: "Best Score",
      xpEarned: "XP Earned",
      coins: "Coins",
      lastPlayed: "Last Played:",
      never: "Never",
      score: "Score",
      accuracy: "Accuracy",
      correctAnswers: "Correct Answers",
      wrongAnswers: "Wrong Answers",
      date: "Date",
      duration: "Duration",
      totalXp: "Total XP",
      currentLevelShort: "Current Level",
      streakDays: "Streak Days",
      gamesPlayed: "Games Played",
      weeklyLeaderboard: "Weekly Leaderboard",
      gamesCompleted: "Games Completed",
      unlockedOn: "Unlocked on"
    },
    fa: {
      // Games page
      gamesTitle: "بازی‌های آموزشی",
      gamesDescription: "با بازی‌های تعاملی مهارت‌های زبانی خود را تقویت کنید",
      browseGames: "مرور بازی‌ها",
      progress: "پیشرفت",
      history: "تاریخچه",
      leaderboard: "جدول امتیازات",
      achievements: "دستاوردها",
      ageGroup: "گروه سنی",
      allAgeGroups: "همه گروه‌های سنی",
      skill: "مهارت",
      allSkills: "همه مهارت‌ها",
      vocabulary: "واژگان",
      grammar: "دستور زبان",
      listening: "شنیداری",
      speaking: "گفتاری",
      reading: "خواندن",
      writing: "نوشتن",
      level: "سطح",
      allLevels: "همه سطوح",
      minutes: "دقیقه",
      startGame: "شروع بازی",
      loading: "در حال بارگذاری...",
      continuGame: "ادامه بازی",
      completion: "میزان تکمیل",
      currentLevel: "سطح فعلی",
      timesPlayed: "بازی شده",
      bestScore: "بهترین امتیاز",
      xpEarned: "XP کسب شده",
      coins: "سکه",
      lastPlayed: "آخرین بازی:",
      never: "هرگز",
      score: "امتیاز",
      accuracy: "دقت",
      correctAnswers: "پاسخ صحیح",
      wrongAnswers: "پاسخ غلط",
      date: "تاریخ",
      duration: "مدت زمان",
      totalXp: "مجموع XP",
      currentLevelShort: "سطح فعلی",
      streakDays: "روزهای متوالی",
      gamesPlayed: "بازی‌های انجام شده",
      weeklyLeaderboard: "جدول امتیازات هفته",
      gamesCompleted: "بازی",
      unlockedOn: "باز شده در"
    }
  };

  return {
    language: currentLanguage,
    isRTL,
    t: texts[currentLanguage] || texts.en,
    changeLanguage,
    formatDate: (date: string) => {
      const dateObj = new Date(date);
      return currentLanguage === 'fa' 
        ? dateObj.toLocaleDateString('fa-IR')
        : dateObj.toLocaleDateString('en-US');
    },
    formatNumber: (num: number) => {
      return currentLanguage === 'fa'
        ? num.toLocaleString('fa-IR')
        : num.toLocaleString('en-US');
    }
  };
}