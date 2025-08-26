import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BookOpen, Download, FileText, Clock, Target, MessageSquare, Home, CheckCircle } from "lucide-react";

interface LessonKit {
  id: string;
  sessionId: number;
  topic: string;
  level: string;
  objectives: string[];
  vocabulary: VocabularyItem[];
  exercises: Exercise[];
  speakingPrompts: string[];
  homework: HomeworkItem[];
  assessmentQuestions: AssessmentQuestion[];
  culturalNotes: string[];
  generatedAt: string;
}

interface VocabularyItem {
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
  difficulty: string;
}

interface Exercise {
  type: string;
  title: string;
  instructions: string;
  content: string;
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
  type: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export function LessonKitGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("intermediate");
  const [duration, setDuration] = useState(60);
  const [selectedKit, setSelectedKit] = useState<LessonKit | null>(null);

  // Query for fetching existing lesson kits
  const { data: lessonKits, isLoading: kitsLoading } = useQuery({
    queryKey: ['/api/teacher/lesson-kits'],
  });

  // Mutation for generating new lesson kit
  const generateKitMutation = useMutation({
    mutationFn: async (params: any) => {
      return apiRequest('/api/teacher/lesson-kit/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Lesson kit generated successfully!",
      });
      setSelectedKit(data);
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/lesson-kits'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate lesson kit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!topic) {
      toast({
        title: "Required Field",
        description: "Please enter a topic for the lesson kit.",
        variant: "destructive",
      });
      return;
    }

    generateKitMutation.mutate({
      topic,
      level,
      duration,
      sessionId: Date.now(),
    });
  };

  const downloadKit = (kit: LessonKit) => {
    const content = JSON.stringify(kit, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-kit-${kit.topic.replace(/\s+/g, '-')}-${kit.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Lesson Kit</CardTitle>
          <CardDescription>
            Automatically generate comprehensive lesson materials for your teaching sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Business English, Travel, Daily Routines"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (A1-A2)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                  <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                min={30}
                max={120}
                step={15}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleGenerate} 
            disabled={generateKitMutation.isPending}
            className="w-full md:w-auto"
          >
            {generateKitMutation.isPending ? "Generating..." : "Generate Lesson Kit"}
          </Button>
        </CardContent>
      </Card>

      {/* Display Generated Kit */}
      {selectedKit && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{selectedKit.topic}</CardTitle>
                <CardDescription>
                  {selectedKit.level} Level • Generated {new Date(selectedKit.generatedAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button onClick={() => downloadKit(selectedKit)} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="objectives" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="objectives">Objectives</TabsTrigger>
                <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
                <TabsTrigger value="exercises">Exercises</TabsTrigger>
                <TabsTrigger value="speaking">Speaking</TabsTrigger>
                <TabsTrigger value="homework">Homework</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="objectives" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Learning Objectives
                  </h3>
                  <ul className="space-y-1">
                    {selectedKit.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-sm">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {selectedKit.culturalNotes.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Cultural Notes</h3>
                    <ul className="space-y-1">
                      {selectedKit.culturalNotes.map((note, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="vocabulary">
                <ScrollArea className="h-[400px] w-full">
                  <div className="space-y-3">
                    {selectedKit.vocabulary.map((item, i) => (
                      <Card key={i}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-lg">{item.word}</h4>
                              <span className="text-xs px-2 py-1 bg-muted rounded">
                                {item.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.pronunciation}</p>
                            <p className="text-sm">{item.definition}</p>
                            <p className="text-sm italic">"{item.example}"</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="exercises">
                <ScrollArea className="h-[400px] w-full">
                  <div className="space-y-4">
                    {selectedKit.exercises.map((exercise, i) => (
                      <Card key={i}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold">{exercise.title}</h4>
                              <span className="text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {exercise.duration} min
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
                            <p className="text-sm whitespace-pre-wrap">{exercise.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="speaking">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Discussion Prompts
                  </h3>
                  {selectedKit.speakingPrompts.map((prompt, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <p className="text-sm">{i + 1}. {prompt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="homework">
                <div className="space-y-4">
                  {selectedKit.homework.map((hw, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              {hw.title}
                            </h4>
                            <span className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {hw.estimatedTime} min
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{hw.description}</p>
                          {hw.resources.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold">Resources:</p>
                              <ul className="text-xs text-muted-foreground">
                                {hw.resources.map((res, j) => (
                                  <li key={j}>• {res}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="assessment">
                <ScrollArea className="h-[400px] w-full">
                  <div className="space-y-4">
                    {selectedKit.assessmentQuestions.map((q, i) => (
                      <Card key={i}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs px-2 py-1 bg-muted rounded">
                                {q.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs font-semibold">
                                {q.points} points
                              </span>
                            </div>
                            <p className="text-sm font-medium">{q.question}</p>
                            {q.options && (
                              <ul className="text-sm space-y-1">
                                {q.options.map((opt, j) => (
                                  <li key={j} className={opt === q.correctAnswer ? "font-semibold text-green-600" : ""}>
                                    {String.fromCharCode(65 + j)}. {opt}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {q.correctAnswer && q.type !== 'multiple_choice' && (
                              <p className="text-sm text-green-600">Answer: {q.correctAnswer}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Previous Lesson Kits */}
      {lessonKits && lessonKits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Lesson Kits</CardTitle>
            <CardDescription>Access your previously generated lesson materials</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {lessonKits.map((kit: LessonKit) => (
                  <div
                    key={kit.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => setSelectedKit(kit)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{kit.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {kit.level} • {new Date(kit.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => {
                      e.stopPropagation();
                      downloadKit(kit);
                    }}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}