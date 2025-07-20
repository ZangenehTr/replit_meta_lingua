import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Smile, 
  Frown, 
  Meh, 
  Battery, 
  Target, 
  AlertCircle, 
  Brain,
  Clock,
  BookOpen,
  Heart,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MoodTrackerProps {
  onMoodSubmitted?: (moodData: any) => void;
  quickMode?: boolean;
}

const MOOD_CATEGORIES = [
  { id: 'excited', icon: Smile, label: 'excited', color: 'bg-green-500', emoji: '😄' },
  { id: 'motivated', icon: TrendingUp, label: 'motivated', color: 'bg-blue-500', emoji: '💪' },
  { id: 'calm', icon: Heart, label: 'calm', color: 'bg-teal-500', emoji: '😌' },
  { id: 'focused', icon: Brain, label: 'focused', color: 'bg-purple-500', emoji: '🧠' },
  { id: 'tired', icon: Battery, label: 'tired', color: 'bg-orange-500', emoji: '😴' },
  { id: 'stressed', icon: AlertCircle, label: 'stressed', color: 'bg-red-500', emoji: '😰' },
  { id: 'frustrated', icon: Frown, label: 'frustrated', color: 'bg-red-400', emoji: '😤' },
  { id: 'bored', icon: Meh, label: 'bored', color: 'bg-gray-500', emoji: '😑' }
];

const QUICK_MOODS = [
  { id: 'great', label: 'great', emoji: '😄', color: 'bg-green-500' },
  { id: 'good', label: 'good', emoji: '😊', color: 'bg-blue-500' },
  { id: 'okay', label: 'okay', emoji: '😐', color: 'bg-yellow-500' },
  { id: 'tired', label: 'tired', emoji: '😴', color: 'bg-orange-500' },
  { id: 'stressed', label: 'stressed', emoji: '😰', color: 'bg-red-500' }
];

export default function MoodTracker({ onMoodSubmitted, quickMode = false }: MoodTrackerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Full mood tracking state
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [moodScore, setMoodScore] = useState<number>(5);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [motivationLevel, setMotivationLevel] = useState<number>(5);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [focusLevel, setFocusLevel] = useState<number>(5);
  const [context, setContext] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availableTime, setAvailableTime] = useState<number>(20);

  // Quick mood tracking state
  const [quickMood, setQuickMood] = useState<string>('');

  // Submission mutations
  const trackMoodMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/mood/track', { method: 'POST', body: data }),
    onSuccess: (data) => {
      toast({
        title: 'Mood tracking successful',
        description: 'Personalized recommendations generated'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mood/history'] });
      onMoodSubmitted?.(data);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to track mood',
        variant: 'destructive'
      });
    }
  });

  const quickCheckMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/mood/quick-check', { method: 'POST', body: data }),
    onSuccess: (data) => {
      toast({
        title: 'Quick mood check complete',
        description: 'Quick recommendations ready'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mood/history'] });
      onMoodSubmitted?.(data);
      setQuickMood('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to process quick check',
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setSelectedMood('');
    setMoodScore(5);
    setEnergyLevel(5);
    setMotivationLevel(5);
    setStressLevel(5);
    setFocusLevel(5);
    setContext('');
    setNotes('');
  };

  const handleMoodSubmit = () => {
    if (!selectedMood) {
      toast({
        title: 'Error',
        description: 'Please select your mood first',
        variant: 'destructive'
      });
      return;
    }

    const moodData = {
      moodCategory: selectedMood,
      moodScore,
      energyLevel,
      motivationLevel,
      stressLevel,
      focusLevel,
      context,
      notes,
      userInput: notes || context,
      inputType: 'manual'
    };

    trackMoodMutation.mutate(moodData);
  };

  const handleQuickCheck = (moodId: string) => {
    setQuickMood(moodId);
    
    const quickData = {
      quickMood: moodId,
      energyLevel: energyLevel,
      availableTime: availableTime
    };

    quickCheckMutation.mutate(quickData);
  };

  if (quickMode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Quick Mood Check
          </CardTitle>
          <CardDescription>
            Get instant learning recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Time Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Available Time: {availableTime} minutes
            </label>
            <div className="flex gap-2">
              {[10, 15, 20, 30, 45].map((time) => (
                <Button
                  key={time}
                  variant={availableTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAvailableTime(time)}
                >
                  {time}m
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Energy Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Battery className="h-4 w-4" />
              Energy Level: {energyLevel}/10
            </label>
            <Progress value={energyLevel * 10} className="h-2" />
            <div className="flex justify-between">
              {[1, 3, 5, 7, 10].map((level) => (
                <Button
                  key={level}
                  variant={energyLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnergyLevel(level)}
                  className="w-12"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Quick Mood Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              How are you feeling right now?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_MOODS.map((mood) => (
                <Button
                  key={mood.id}
                  variant={quickMood === mood.id ? 'default' : 'outline'}
                  onClick={() => handleQuickCheck(mood.id)}
                  disabled={quickCheckMutation.isPending}
                  className="flex items-center justify-start gap-3 h-12"
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="capitalize">{mood.label}</span>
                  {quickCheckMutation.isPending && quickMood === mood.id && (
                    <div className="ml-auto">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          Persian Learning Mood Tracker
        </CardTitle>
        <CardDescription>
          Track your emotional state for personalized Persian learning recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Category Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            How are you feeling right now? *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOOD_CATEGORIES.map((mood) => {
              const IconComponent = mood.icon;
              const isSelected = selectedMood === mood.id;
              
              return (
                <Button
                  key={mood.id}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`flex flex-col items-center gap-2 h-20 ${
                    isSelected ? mood.color : ''
                  }`}
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="text-xs capitalize">
                    {mood.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {selectedMood && (
          <>
            <Separator />

            {/* Mood Scales */}
            <div className="space-y-4">
              {/* Overall Mood Score */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Smile className="h-4 w-4" />
                  Overall Mood: {moodScore}/10
                </label>
                <Progress value={moodScore * 10} className="h-3" />
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <Button
                      key={score}
                      variant={moodScore === score ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMoodScore(score)}
                      className="w-8 h-8 p-0"
                    >
                      {score}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  Energy Level: {energyLevel}/10
                </label>
                <Progress value={energyLevel * 10} className="h-3" />
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <Button
                      key={level}
                      variant={energyLevel === level ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setEnergyLevel(level)}
                      className="w-8 h-8 p-0"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Motivation Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Motivation Level: {motivationLevel}/10
                </label>
                <Progress value={motivationLevel * 10} className="h-3" />
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <Button
                      key={level}
                      variant={motivationLevel === level ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMotivationLevel(level)}
                      className="w-8 h-8 p-0"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Stress Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Stress Level: {stressLevel}/10
                </label>
                <Progress value={stressLevel * 10} className="h-3" />
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <Button
                      key={level}
                      variant={stressLevel === level ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setStressLevel(level)}
                      className="w-8 h-8 p-0"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Focus Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Focus Level: {focusLevel}/10
                </label>
                <Progress value={focusLevel * 10} className="h-3" />
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <Button
                      key={level}
                      variant={focusLevel === level ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFocusLevel(level)}
                      className="w-8 h-8 p-0"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Context and Notes */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="context" className="text-sm font-medium">
                  What's affecting your mood today?
                </label>
                <Textarea
                  id="context"
                  placeholder="e.g., difficult lesson, personal stress, excitement about progress..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Additional notes
                </label>
                <Textarea
                  id="notes"
                  placeholder="Any specific thoughts about your Persian learning journey today..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleMoodSubmit}
                disabled={trackMoodMutation.isPending || !selectedMood}
                className="w-full max-w-xs"
                size="lg"
              >
                {trackMoodMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Analyzing mood...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Get Personalized Recommendations
                  </div>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}