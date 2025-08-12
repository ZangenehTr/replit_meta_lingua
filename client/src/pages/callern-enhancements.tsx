import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CallRecordingConsent } from '@/components/callern/CallRecordingConsent';
import { LiveSuggestions } from '@/components/callern/LiveSuggestions';
import { StudentGlossary } from '@/components/callern/StudentGlossary';
import { EmailPreferences } from '@/components/callern/EmailPreferences';
import { 
  Mic, 
  BookOpen, 
  Mail, 
  Settings, 
  Video,
  Lightbulb,
  Brain,
  FileText,
  TrendingUp,
  Users,
  Clock,
  Award
} from 'lucide-react';

export default function CallernEnhancements() {
  const [activeCall, setActiveCall] = useState<number | null>(null);
  const [showConsent, setShowConsent] = useState(false);

  // Mock data for demonstration
  const mockCallStats = {
    totalCalls: 42,
    totalMinutes: 1260,
    vocabularyLearned: 234,
    averageScore: 8.5,
    streak: 7,
    nextReview: 12,
  };

  const startMockCall = () => {
    setActiveCall(1); // Mock call ID
    setShowConsent(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Callern Enhanced Learning</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered language learning with personalized feedback
          </p>
        </div>
        <Button onClick={startMockCall} size="lg" className="gap-2">
          <Video className="h-5 w-5" />
          Start Practice Call
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">All Time</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{mockCallStats.totalCalls}</div>
              <p className="text-xs text-muted-foreground">Total Calls</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">21h</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{mockCallStats.totalMinutes}</div>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">+12</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{mockCallStats.vocabularyLearned}</div>
              <p className="text-xs text-muted-foreground">Words Learned</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">B2</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{mockCallStats.averageScore}</div>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Award className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">🔥</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{mockCallStats.streak}</div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">Due</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{mockCallStats.nextReview}</div>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Show consent dialog if call is starting */}
      {showConsent && activeCall && (
        <CallRecordingConsent
          callId={activeCall}
          onConsentGiven={() => setShowConsent(false)}
          isStudent={true}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="live" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Live Session
          </TabsTrigger>
          <TabsTrigger value="glossary" className="gap-2">
            <BookOpen className="h-4 w-4" />
            My Glossary
          </TabsTrigger>
          <TabsTrigger value="summaries" className="gap-2">
            <FileText className="h-4 w-4" />
            Call Summaries
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Suggestions */}
            <LiveSuggestions 
              callId={activeCall || 1} 
              isLive={!!activeCall}
            />
            
            {/* Call Transcript/Rewrites */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-lg">Live Transcript</CardTitle>
                </div>
                <CardDescription>
                  Real-time transcription with AI-powered corrections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {activeCall ? (
                  <>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline">You</Badge>
                        <div className="flex-1">
                          <p className="text-sm line-through text-muted-foreground">
                            Yesterday I go to the store
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            ✓ Yesterday I went to the store
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Grammar: Past tense with time markers
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2">
                        <Badge>Teacher</Badge>
                        <div className="flex-1">
                          <p className="text-sm">
                            Great improvement! Remember to use past tense with "yesterday".
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start a call to see live transcript</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="glossary">
          <StudentGlossary />
        </TabsContent>

        <TabsContent value="summaries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Call Summaries</CardTitle>
              <CardDescription>
                AI-generated summaries of your practice sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">
                          Practice Session #{i}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString()} • 30 minutes
                        </p>
                      </div>
                      <Badge variant="outline">Score: 8.5/10</Badge>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      <div>
                        <p className="text-sm font-medium">Topics Covered:</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary">Past Tense</Badge>
                          <Badge variant="secondary">Articles</Badge>
                          <Badge variant="secondary">Pronunciation</Badge>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Key Improvements:</p>
                        <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                          <li>Better use of past tense markers</li>
                          <li>Improved article usage (a/an)</li>
                          <li>Clearer pronunciation of 'th' sounds</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Vocabulary Added:</p>
                        <p className="text-sm text-muted-foreground">
                          accomplish, elaborate, essential, furthermore (+4 more)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Mail className="h-3 w-3 mr-1" />
                        Email Summary
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        View Full Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <EmailPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}