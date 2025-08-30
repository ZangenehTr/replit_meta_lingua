import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ringtoneService } from '@/services/ringtone-service';
import { Volume2, Play, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RingtonePreferences {
  selectedRingtone: string;
  volume: number;
}

export function TeacherRingtoneSettings() {
  const { t } = useTranslation(['teacher', 'common']);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<RingtonePreferences>({
    selectedRingtone: 'classic',
    volume: 0.7
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingRingtone, setPlayingRingtone] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const ringtones = ringtoneService.getRingtones();

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem(`teacher_ringtone_preferences_${user?.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences(parsed);
        }
      } catch (error) {
        console.error('Error loading ringtone preferences:', error);
      }
    };

    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  // Save preferences
  const savePreferences = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(
        `teacher_ringtone_preferences_${user.id}`,
        JSON.stringify(preferences)
      );

      // Could also save to backend if needed
      // await apiRequest(`/api/teacher/ringtone-preferences`, {
      //   method: 'POST',
      //   body: preferences
      // });

      toast({
        title: t('common:success'),
        description: 'Ringtone preferences saved successfully'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: t('common:error'),
        description: 'Failed to save ringtone preferences',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Play/stop preview
  const togglePreview = async (ringtoneId: string) => {
    try {
      if (isPlaying && playingRingtone === ringtoneId) {
        // Stop current preview
        ringtoneService.stopRingtone();
        setIsPlaying(false);
        setPlayingRingtone(null);
      } else {
        // Stop any current preview
        ringtoneService.stopRingtone();
        
        // Set volume before playing
        ringtoneService.setVolume(preferences.volume);
        
        // Play new preview (not looped for preview)
        await ringtoneService.playRingtone(ringtoneId, false);
        setIsPlaying(true);
        setPlayingRingtone(ringtoneId);

        // Check periodically if the ringtone has stopped playing
        const checkIfFinished = () => {
          if (!ringtoneService.isPlaying()) {
            setIsPlaying(false);
            setPlayingRingtone(null);
          } else {
            // Continue checking
            setTimeout(checkIfFinished, 200);
          }
        };
        
        // Start checking after a short delay to allow audio to start
        setTimeout(checkIfFinished, 500);
      }
    } catch (error) {
      console.error('Error playing ringtone preview:', error);
      setIsPlaying(false);
      setPlayingRingtone(null);
      toast({
        title: t('common:error'),
        description: 'Could not play ringtone preview',
        variant: 'destructive'
      });
    }
  };

  // Stop all previews when component unmounts
  useEffect(() => {
    return () => {
      ringtoneService.stopRingtone();
    };
  }, []);

  // Update volume in real-time
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setPreferences(prev => ({ ...prev, volume: newVolume }));
    
    // Update volume of currently playing ringtone
    if (isPlaying) {
      ringtoneService.setVolume(newVolume);
    }
  };

  // Only show for teachers
  if (!user || (user.role !== 'Teacher' && user.role !== 'Teacher/Tutor')) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Ringtone Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ringtone Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Choose Your Ringtone</Label>
          <div className="space-y-2">
            {ringtones.map((ringtone) => (
              <div 
                key={ringtone.id} 
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  preferences.selectedRingtone === ringtone.id 
                    ? 'bg-primary/10 border-primary' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setPreferences(prev => ({ ...prev, selectedRingtone: ringtone.id }));
                }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    <input
                      type="radio"
                      name="ringtone"
                      value={ringtone.id}
                      checked={preferences.selectedRingtone === ringtone.id}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferences(prev => ({ ...prev, selectedRingtone: ringtone.id }));
                        }
                      }}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {ringtone.name}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ringtone.description}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePreview(ringtone.id);
                  }}
                  disabled={isPlaying && playingRingtone !== ringtone.id}
                >
                  {isPlaying && playingRingtone === ringtone.id ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Volume Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Ringtone Volume</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(preferences.volume * 100)}%
            </span>
          </div>
          <div className="px-2">
            <Slider
              value={[preferences.volume]}
              onValueChange={handleVolumeChange}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Test Current Ringtone */}
        <div className="pt-4 border-t">
          <Button
            onClick={() => togglePreview(preferences.selectedRingtone)}
            variant="outline"
            className="w-full"
            disabled={isPlaying && playingRingtone !== preferences.selectedRingtone}
          >
            {isPlaying && playingRingtone === preferences.selectedRingtone ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Test
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test Selected Ringtone
              </>
            )}
          </Button>
        </div>

        {/* Save Button */}
        <Button
          onClick={savePreferences}
          className="w-full"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
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