interface RingtonePreferences {
  selectedRingtone: string;
  volume: number;
}

// Helper function to get teacher's ringtone preferences
export const getTeacherRingtonePreferences = (teacherId: number): RingtonePreferences => {
  try {
    const stored = localStorage.getItem(`teacher_ringtone_preferences_${teacherId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading ringtone preferences:', error);
  }
  
  // Default preferences
  return {
    selectedRingtone: 'classic',
    volume: 0.7
  };
};