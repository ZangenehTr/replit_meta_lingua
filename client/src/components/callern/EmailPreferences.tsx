import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Bell, Calendar, Globe } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface StudentPreferences {
  showLiveSuggestions: boolean;
  emailCallSummaries: boolean;
  emailWeeklyRecap: boolean;
  preferredLanguage: string;
}

export function EmailPreferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<StudentPreferences>({
    showLiveSuggestions: true,
    emailCallSummaries: true,
    emailWeeklyRecap: true,
    preferredLanguage: 'en',
  });

  // Fetch current preferences
  const { data, isLoading } = useQuery({
    queryKey: ['/api/student/preferences'],
    queryFn: async () => apiRequest('/api/student/preferences', 'GET'),
  });

  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<StudentPreferences>) => {
      return apiRequest('/api/student/preferences', 'PUT', updates);
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/preferences'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (key: keyof StudentPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
  };

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (isLoading) {
    return <div>Loading preferences...</div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Customize how you receive updates about your language learning progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="call-summaries">Call Summaries</Label>
                <p className="text-sm text-muted-foreground">
                  Receive detailed summaries after each call with vocabulary and improvements
                </p>
              </div>
            </div>
            <Switch
              id="call-summaries"
              checked={preferences.emailCallSummaries}
              onCheckedChange={(checked) => handleChange('emailCallSummaries', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="weekly-recap">Weekly Recap</Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly summary of your learning progress and achievements
                </p>
              </div>
            </div>
            <Switch
              id="weekly-recap"
              checked={preferences.emailWeeklyRecap}
              onCheckedChange={(checked) => handleChange('emailWeeklyRecap', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Bell className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="live-suggestions">Live Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  Show real-time vocabulary suggestions during calls
                </p>
              </div>
            </div>
            <Switch
              id="live-suggestions"
              checked={preferences.showLiveSuggestions}
              onCheckedChange={(checked) => handleChange('showLiveSuggestions', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Globe className="h-4 w-4 text-purple-600" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="language">Preferred Language</Label>
                <p className="text-sm text-muted-foreground">
                  Language for email notifications
                </p>
              </div>
            </div>
            <Select
              value={preferences.preferredLanguage}
              onValueChange={(value) => handleChange('preferredLanguage', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fa">فارسی</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Email Frequency</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Call summaries: Sent immediately after each call ends</li>
            <li>• Weekly recap: Sent every Sunday at 9:00 AM</li>
            <li>• Quiz reminders: Sent when you have 5+ items due for review</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}