import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  MessageCircle, 
  BookOpen, 
  Clock, 
  Star, 
  Lightbulb,
  Globe,
  Zap,
  CheckCircle,
  AlertCircle,
  PuzzleIcon,
  HeartHandshake,
  Sparkles,
  Robot,
  Trophy,
  Compass
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Recommendation {
  type: 'course' | 'lesson' | 'practice' | 'cultural_insight';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  difficulty: string;
  culturalContext?: string;
}

interface ProgressAnalysis {
  progressAnalysis: string;
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
  culturalInsights: string[];
}

interface ConversationScenario {
  scenario: string;
  culturalContext: string;
  keyPhrases: Array<{
    persian: string;
    english: string;
    cultural_note: string;
  }>;
  practiceQuestions: string[];
}

export default function AIPersonalization() {
  const { t } = useTranslation(['admin', 'common']);
  const [activeTab, setActiveTab] = useState("recommendations");
  const [conversationMessage, setConversationMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("intermediate");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI recommendations
  const { data: recommendationsData, isLoading: isLoadingRecs } = useQuery({
    queryKey: ['/api/ai/recommendations'],
  });

  // Fetch progress analysis
  const { data: progressAnalysis, isLoading: isLoadingProgress } = useQuery<ProgressAnalysis>({
    queryKey: ['/api/ai/progress-analysis'],
  });

  // Generate conversation scenario
  const generateScenario = useMutation({
    mutationFn: async (data: { topic: string; difficulty: string }) => {
      return apiRequest('/api/ai/conversation-scenario', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "سناریو ایجاد شد! / Scenario Generated!",
        description: "سناریو مکالمه جدید آماده شد / New conversation scenario ready",
      });
    },
  });

  // AI conversation
  const sendMessage = useMutation({
    mutationFn: async (data: { message: string; context: any; proficiencyLevel: string }) => {
      return apiRequest('/api/ai/conversation', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      setConversationHistory(prev => [
        ...prev,
        { type: 'user', message: conversationMessage, timestamp: new Date() },
        { type: 'ai', ...response, timestamp: new Date() }
      ]);
      setConversationMessage("");
    },
  });

  // Generate adaptive quiz
  const generateQuiz = useMutation({
    mutationFn: async (data: { topic: string; weakAreas: string[] }) => {
      return apiRequest('/api/ai/adaptive-quiz', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  });

  const handleSendMessage = () => {
    if (!conversationMessage.trim()) return;
    
    sendMessage.mutate({
      message: conversationMessage,
      context: { topic: selectedTopic },
      proficiencyLevel: selectedDifficulty,
    });
  };

  const handleGenerateScenario = () => {
    if (!selectedTopic) {
      toast({
        title: "موضوع مورد نیاز / Topic Required",
        description: "لطفاً موضوع مکالمه را انتخاب کنید / Please select a conversation topic",
        variant: "destructive",
      });
      return;
    }
    
    generateScenario.mutate({
      topic: selectedTopic,
      difficulty: selectedDifficulty,
    });
  };

  const handleQuizSubmit = () => {
    setShowQuizResults(true);
    toast({
      title: "آزمون ارسال شد! / Quiz Submitted!",
      description: "نتایج شما تحلیل شد / Your results have been analyzed",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="h-4 w-4" />;
      case 'lesson': return <Target className="h-4 w-4" />;
      case 'practice': return <PuzzleIcon className="h-4 w-4" />;
      case 'cultural_insight': return <Globe className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  یادگیری هوشمند / AI-Powered Learning
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                مسیر یادگیری شخصی‌سازی شده با هوش مصنوعی / Personalized learning path with AI
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-bold text-blue-600">
                  سطح متوسط / Intermediate
                </span>
              </div>
              <p className="text-sm text-gray-500">پیشرفت امروز: +12 امتیاز</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="recommendations" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>توصیه‌ها / Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>تحلیل پیشرفت / Progress</span>
            </TabsTrigger>
            <TabsTrigger value="conversation" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>مکالمه هوشمند / AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center space-x-2">
              <HeartHandshake className="h-4 w-4" />
              <span>سناریوها / Scenarios</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center space-x-2">
              <PuzzleIcon className="h-4 w-4" />
              <span>آزمون تطبیقی / Adaptive Quiz</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Robot className="h-5 w-5 text-blue-600" />
                      <span>توصیه‌های شخصی‌سازی شده / Personalized Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRecs ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recommendationsData?.recommendations?.map((rec: Recommendation, index: number) => (
                          <Card key={index} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  {getTypeIcon(rec.type)}
                                  <div>
                                    <h4 className="font-semibold">{rec.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                      {rec.type.replace('_', ' ')} • {rec.difficulty}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={getPriorityColor(rec.priority)}>
                                    {rec.priority}
                                  </Badge>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {rec.estimatedTime}m
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                {rec.description}
                              </p>
                              
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  <strong>چرا این توصیه شده:</strong> {rec.reason}
                                </p>
                              </div>
                              
                              {rec.culturalContext && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg mb-3">
                                  <div className="flex items-center mb-1">
                                    <Globe className="h-4 w-4 text-purple-600 mr-2" />
                                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                      بینش فرهنگی / Cultural Insight
                                    </span>
                                  </div>
                                  <p className="text-sm text-purple-700 dark:text-purple-300">
                                    {rec.culturalContext}
                                  </p>
                                </div>
                              )}
                              
                              <Button size="sm" className="w-full">
                                شروع یادگیری / Start Learning
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Learning Profile Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">پروفایل یادگیری / Learning Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>زبان مادری / Native:</span>
                        <span>English</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>زبان هدف / Target:</span>
                        <span>Persian</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>سطح / Level:</span>
                        <Badge>Intermediate</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">اهداف یادگیری / Goals</h4>
                      <div className="space-y-1">
                        {["Business Communication", "Cultural Understanding", "Grammar Mastery"].map((goal, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                            {goal}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">نقاط قوت / Strengths</h4>
                      <div className="flex flex-wrap gap-1">
                        {["Vocabulary", "Pronunciation"].map((strength, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">نیاز به تمرین / Areas to Practice</h4>
                      <div className="flex flex-wrap gap-1">
                        {["Verb Conjugation", "Formal Speech"].map((weakness, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {weakness}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Progress Analysis Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>تحلیل پیشرفت / Progress Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingProgress ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        {progressAnalysis?.progressAnalysis}
                      </p>
                      
                      <div>
                        <h4 className="font-medium text-green-600 mb-2 flex items-center">
                          <Trophy className="h-4 w-4 mr-2" />
                          نقاط قوت / Strengths
                        </h4>
                        <ul className="space-y-1">
                          {progressAnalysis?.strengths?.map((strength, index) => (
                            <li key={index} className="flex items-center text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-orange-600 mb-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          نیاز به بهبود / Areas for Improvement
                        </h4>
                        <ul className="space-y-1">
                          {progressAnalysis?.areasForImprovement?.map((area, index) => (
                            <li key={index} className="flex items-center text-sm">
                              <AlertCircle className="h-3 w-3 text-orange-500 mr-2" />
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Compass className="h-5 w-5 text-blue-600" />
                    <span>مراحل بعدی / Next Steps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">اقدامات پیشنهادی / Recommended Actions</h4>
                      <ul className="space-y-2">
                        {progressAnalysis?.nextSteps?.map((step, index) => (
                          <li key={index} className="flex items-start">
                            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1 mr-3 mt-0.5">
                              <span className="text-xs font-bold text-blue-600 w-4 h-4 flex items-center justify-center">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-purple-600" />
                        بینش‌های فرهنگی / Cultural Insights
                      </h4>
                      <ul className="space-y-1">
                        {progressAnalysis?.culturalInsights?.map((insight, index) => (
                          <li key={index} className="text-sm text-purple-700 dark:text-purple-300">
                            • {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Conversation Tab */}
          <TabsContent value="conversation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <span>مکالمه با هوش مصنوعی / AI Conversation Practice</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="border rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50 dark:bg-gray-900">
                      {conversationHistory.length === 0 ? (
                        <div className="text-center text-gray-500 h-full flex items-center justify-center">
                          <div>
                            <Robot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>مکالمه خود را شروع کنید / Start your conversation</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {conversationHistory.map((msg, index) => (
                            <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-lg ${
                                msg.type === 'user' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white dark:bg-gray-800 border'
                              }`}>
                                <p className="text-sm">{msg.type === 'user' ? msg.message : msg.response}</p>
                                {msg.type === 'ai' && msg.feedback && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      <strong>بازخورد:</strong> {msg.feedback}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Input
                        placeholder="پیام خود را به فارسی بنویسید / Write your message in Persian..."
                        value={conversationMessage}
                        onChange={(e) => setConversationMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} disabled={sendMessage.isPending}>
                        {sendMessage.isPending ? "..." : "ارسال / Send"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        موضوع مکالمه / Conversation Topic
                      </label>
                      <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب موضوع / Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="restaurant">رستوران / Restaurant</SelectItem>
                          <SelectItem value="shopping">خرید / Shopping</SelectItem>
                          <SelectItem value="work">محل کار / Workplace</SelectItem>
                          <SelectItem value="travel">سفر / Travel</SelectItem>
                          <SelectItem value="family">خانواده / Family</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        سطح دشواری / Difficulty Level
                      </label>
                      <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">مبتدی / Beginner</SelectItem>
                          <SelectItem value="intermediate">متوسط / Intermediate</SelectItem>
                          <SelectItem value="advanced">پیشرفته / Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="font-medium mb-2">نکات مکالمه / Conversation Tips</h4>
                      <ul className="text-xs space-y-1 text-blue-800 dark:text-blue-200">
                        <li>• از جملات کامل استفاده کنید</li>
                        <li>• Use complete sentences</li>
                        <li>• هوش مصنوعی بازخورد می‌دهد</li>
                        <li>• AI will provide feedback</li>
                        <li>• نگران اشتباهات نباشید</li>
                        <li>• Don't worry about mistakes</li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HeartHandshake className="h-5 w-5 text-purple-600" />
                  <span>سناریوهای فرهنگی / Cultural Scenarios</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="flex space-x-2 mb-4">
                      <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="انتخاب موضوع / Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business_meeting">جلسه کاری / Business Meeting</SelectItem>
                          <SelectItem value="family_dinner">شام خانوادگی / Family Dinner</SelectItem>
                          <SelectItem value="shopping_bazaar">خرید از بازار / Shopping at Bazaar</SelectItem>
                          <SelectItem value="university">دانشگاه / University</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleGenerateScenario} disabled={generateScenario.isPending}>
                        {generateScenario.isPending ? "..." : "ایجاد سناریو / Generate"}
                      </Button>
                    </div>
                    
                    {generateScenario.data && (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">سناریو / Scenario</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {generateScenario.data.scenario}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <h4 className="font-medium mb-2 text-purple-800 dark:text-purple-200">
                            زمینه فرهنگی / Cultural Context
                          </h4>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            {generateScenario.data.culturalContext}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {generateScenario.data?.keyPhrases && (
                      <div className="space-y-4">
                        <h4 className="font-medium">عبارات کلیدی / Key Phrases</h4>
                        <div className="space-y-3">
                          {generateScenario.data.keyPhrases.map((phrase: any, index: number) => (
                            <Card key={index} className="p-3">
                              <div className="space-y-2">
                                <div className="text-lg font-medium text-right">{phrase.persian}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{phrase.english}</div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                  {phrase.cultural_note}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adaptive Quiz Tab */}
          <TabsContent value="quiz" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PuzzleIcon className="h-5 w-5 text-green-600" />
                  <span>آزمون تطبیقی / Adaptive Quiz</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="flex space-x-2 mb-6">
                      <Select defaultValue="grammar">
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grammar">دستور زبان / Grammar</SelectItem>
                          <SelectItem value="vocabulary">واژگان / Vocabulary</SelectItem>
                          <SelectItem value="culture">فرهنگ / Culture</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => generateQuiz.mutate({ topic: "grammar", weakAreas: ["Verb Conjugation"] })}
                        disabled={generateQuiz.isPending}
                      >
                        {generateQuiz.isPending ? "..." : "ایجاد آزمون / Generate Quiz"}
                      </Button>
                    </div>
                    
                    {generateQuiz.data && (
                      <div className="space-y-6">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                            دلیل انطباق / Adaptation Reason
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {generateQuiz.data.adaptationReason}
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          {generateQuiz.data.questions?.map((question: any, index: number) => (
                            <Card key={index} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium flex-1">
                                    {index + 1}. {question.question}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {question.difficulty}
                                  </Badge>
                                </div>
                                
                                {question.options && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {question.options.map((option: string, optIndex: number) => (
                                      <Button
                                        key={optIndex}
                                        variant={quizAnswers[question.id] === option ? "default" : "outline"}
                                        className="text-left justify-start h-auto p-3"
                                        onClick={() => setQuizAnswers({...quizAnswers, [question.id]: option})}
                                      >
                                        {option}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                                
                                {showQuizResults && (
                                  <div className="space-y-2 pt-3 border-t">
                                    <div className="text-sm">
                                      <strong>پاسخ صحیح:</strong> {question.correctAnswer}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <strong>توضیح:</strong> {question.explanation}
                                    </div>
                                    {question.culturalNote && (
                                      <div className="text-xs bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-purple-700 dark:text-purple-300">
                                        <strong>نکته فرهنگی:</strong> {question.culturalNote}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {!showQuizResults && generateQuiz.data.questions && (
                          <Button onClick={handleQuizSubmit} className="w-full">
                            ارسال آزمون / Submit Quiz
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-medium mb-3">آمار آزمون / Quiz Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>آزمون‌های تکمیل شده:</span>
                          <span>12</span>
                        </div>
                        <div className="flex justify-between">
                          <span>میانگین نمره:</span>
                          <span>85%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>بهترین نمره:</span>
                          <span>96%</span>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
                      <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                        نکات آزمون / Quiz Tips
                      </h4>
                      <ul className="text-xs space-y-1 text-yellow-700 dark:text-yellow-300">
                        <li>• آزمون بر اساس نقاط ضعف شما طراحی شده</li>
                        <li>• Quiz is designed based on your weaknesses</li>
                        <li>• سؤالات فرهنگی نیز شامل است</li>
                        <li>• Cultural questions are included</li>
                        <li>• بازخورد فوری دریافت می‌کنید</li>
                        <li>• You get immediate feedback</li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}