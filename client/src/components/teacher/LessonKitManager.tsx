// Teacher Lesson Kit Manager Component
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Clock, 
  BookOpen,
  Users,
  Target,
  MessageSquare,
  Home,
  CheckSquare,
  Globe,
  Printer,
  Share2,
  Calendar,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  FileDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface LessonKit {
  id: string;
  sessionId: number;
  teacherId: number;
  studentId: number;
  topic: string;
  level: string;
  objectives: string[];
  vocabulary: VocabularyItem[];
  exercises: Exercise[];
  speakingPrompts: string[];
  homework: HomeworkItem[];
  assessmentQuestions: AssessmentQuestion[];
  culturalNotes: string[];
  generatedAt: Date;
}

interface VocabularyItem {
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

interface Exercise {
  type: 'grammar' | 'listening' | 'reading' | 'writing';
  title: string;
  instructions: string;
  content: string;
  answers?: string[];
  duration: number;
}

interface HomeworkItem {
  title: string;
  description: string;
  estimatedTime: number;
  resources: string[];
}

interface AssessmentQuestion {
  question: string;
  type: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'speaking';
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export function LessonKitManager() {
  const { toast } = useToast();
  const [selectedKit, setSelectedKit] = useState<LessonKit | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    sessionId: '',
    studentId: '',
    topic: '',
    level: 'intermediate',
    duration: 60
  });

  // Fetch lesson kits
  const { data: lessonKits = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/teacher/lesson-kits'],
    queryFn: () => apiRequest('/api/teacher/lesson-kits', 'GET')
  });

  // Generate lesson kit mutation
  const generateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/teacher/lesson-kit/generate', 'POST', data),
    onSuccess: (newKit) => {
      toast({
        title: "Lesson Kit Generated!",
        description: `Successfully created lesson kit for ${newKit.topic}`,
        className: "bg-green-500 text-white"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/lesson-kits'] });
      setShowGenerateDialog(false);
      setSelectedKit(newKit);
      setShowPreviewDialog(true);
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate lesson kit. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Export to PDF function
  const exportToPDF = async (kit: LessonKit) => {
    try {
      const response = await fetch('/api/teacher/lesson-kit/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ kitId: kit.id })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lesson-kit-${kit.topic}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "PDF Exported",
          description: "Lesson kit has been exported as PDF",
          className: "bg-green-500 text-white"
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter lesson kits
  const filteredKits = lessonKits.filter((kit: LessonKit) => {
    const matchesSearch = kit.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || kit.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // Render lesson kit card
  const LessonKitCard = ({ kit }: { kit: LessonKit }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={() => {
        setSelectedKit(kit);
        setShowPreviewDialog(true);
      }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{kit.topic}</CardTitle>
              <CardDescription>
                {format(new Date(kit.generatedAt), 'MMM dd, yyyy')}
              </CardDescription>
            </div>
            <Badge variant={
              kit.level === 'basic' ? 'secondary' : 
              kit.level === 'intermediate' ? 'default' : 
              'outline'
            }>
              {kit.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Target className="w-4 h-4" />
            <span>{kit.objectives.length} Objectives</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <BookOpen className="w-4 h-4" />
            <span>{kit.vocabulary.length} Vocabulary Items</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckSquare className="w-4 h-4" />
            <span>{kit.exercises.length} Exercises</span>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={(e) => {
              e.stopPropagation();
              exportToPDF(kit);
            }}>
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button size="sm" variant="ghost">
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Lesson Kit Preview Dialog
  const LessonKitPreview = () => {
    if (!selectedKit) return null;

    return (
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedKit.topic}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => exportToPDF(selectedKit)}>
                  <FileDown className="w-4 h-4 mr-1" />
                  Export PDF
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button size="sm" variant="outline">
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Generated on {format(new Date(selectedKit.generatedAt), 'MMMM dd, yyyy')} • Level: {selectedKit.level}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="objectives" className="mt-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
              <TabsTrigger value="exercises">Exercises</TabsTrigger>
              <TabsTrigger value="speaking">Speaking</TabsTrigger>
              <TabsTrigger value="homework">Homework</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              <TabsContent value="objectives" className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Learning Objectives</h3>
                  <ul className="space-y-2">
                    {selectedKit.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Target className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedKit.culturalNotes.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Cultural Notes
                    </h3>
                    <ul className="space-y-2">
                      {selectedKit.culturalNotes.map((note, idx) => (
                        <li key={idx} className="pl-6">• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vocabulary" className="space-y-4">
                <h3 className="font-semibold text-lg">Vocabulary Items</h3>
                <div className="grid gap-4">
                  {selectedKit.vocabulary.map((item, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg">{item.word}</h4>
                          <Badge variant={
                            item.difficulty === 'basic' ? 'secondary' :
                            item.difficulty === 'intermediate' ? 'default' :
                            'outline'
                          }>
                            {item.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.pronunciation}
                        </p>
                        <p className="mb-2">{item.definition}</p>
                        <p className="text-sm italic bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          Example: {item.example}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="exercises" className="space-y-4">
                <h3 className="font-semibold text-lg">Practice Exercises</h3>
                <div className="space-y-4">
                  {selectedKit.exercises.map((exercise, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-md">{exercise.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge>{exercise.type}</Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {exercise.duration} min
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium mb-2">{exercise.instructions}</p>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                          <pre className="whitespace-pre-wrap text-sm">{exercise.content}</pre>
                        </div>
                        {exercise.answers && (
                          <div className="mt-3">
                            <p className="text-sm font-medium">Answer Key:</p>
                            <ul className="text-sm mt-1">
                              {exercise.answers.map((answer, ansIdx) => (
                                <li key={ansIdx}>• {answer}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="speaking" className="space-y-4">
                <h3 className="font-semibold text-lg">Speaking Discussion Prompts</h3>
                <div className="grid gap-3">
                  {selectedKit.speakingPrompts.map((prompt, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-primary mt-1" />
                          <p>{prompt}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="homework" className="space-y-4">
                <h3 className="font-semibold text-lg">Homework Assignments</h3>
                <div className="grid gap-4">
                  {selectedKit.homework.map((hw, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-md">{hw.title}</CardTitle>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {hw.estimatedTime} min
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-3">{hw.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {hw.resources.map((resource, resIdx) => (
                            <Badge key={resIdx} variant="outline">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="assessment" className="space-y-4">
                <h3 className="font-semibold text-lg">Assessment Questions</h3>
                <div className="space-y-4">
                  {selectedKit.assessmentQuestions.map((question, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <p className="font-medium">{idx + 1}. {question.question}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{question.type}</Badge>
                            <Badge>{question.points} pts</Badge>
                          </div>
                        </div>
                        {question.options && (
                          <ul className="space-y-1 ml-4">
                            {question.options.map((option, optIdx) => (
                              <li key={optIdx} className={`text-sm ${
                                option === question.correctAnswer ? 'font-semibold text-green-600 dark:text-green-400' : ''
                              }`}>
                                {String.fromCharCode(65 + optIdx)}. {option}
                              </li>
                            ))}
                          </ul>
                        )}
                        {question.correctAnswer && question.type !== 'multiple_choice' && (
                          <p className="text-sm mt-2 text-green-600 dark:text-green-400">
                            Answer: {question.correctAnswer}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  // Generate Lesson Kit Dialog
  const GenerateLessonKitDialog = () => (
    <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate New Lesson Kit</DialogTitle>
          <DialogDescription>
            Create a personalized lesson kit for your upcoming session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Session ID (Optional)</label>
            <Input
              placeholder="Leave empty for standalone kit"
              value={generateForm.sessionId}
              onChange={(e) => setGenerateForm({...generateForm, sessionId: e.target.value})}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Student ID (Optional)</label>
            <Input
              placeholder="Enter student ID for personalization"
              value={generateForm.studentId}
              onChange={(e) => setGenerateForm({...generateForm, studentId: e.target.value})}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Topic *</label>
            <Input
              placeholder="e.g., Business English, Daily Conversation"
              value={generateForm.topic}
              onChange={(e) => setGenerateForm({...generateForm, topic: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Level *</label>
            <Select
              value={generateForm.level}
              onValueChange={(value) => setGenerateForm({...generateForm, level: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic (A1-A2)</SelectItem>
                <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Session Duration (minutes) *</label>
            <Input
              type="number"
              min="30"
              max="180"
              value={generateForm.duration}
              onChange={(e) => setGenerateForm({...generateForm, duration: parseInt(e.target.value)})}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => generateMutation.mutate(generateForm)}
            disabled={!generateForm.topic || generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Kit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Lesson Kit Manager</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create, manage, and export comprehensive lesson materials
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search lesson kits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate New Kit
        </Button>
      </div>

      {/* Lesson Kits Grid/List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading lesson kits...</p>
        </div>
      ) : filteredKits.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No lesson kits found
            </p>
            <Button onClick={() => setShowGenerateDialog(true)}>
              Generate Your First Kit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
          "space-y-4"
        }>
          {filteredKits.map((kit: LessonKit) => (
            <LessonKitCard key={kit.id} kit={kit} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <GenerateLessonKitDialog />
      <LessonKitPreview />
    </div>
  );
}