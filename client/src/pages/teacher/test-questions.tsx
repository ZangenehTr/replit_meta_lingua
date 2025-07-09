import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Upload, Volume2, Trash2, Edit, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface TestQuestion {
  id: number;
  testId: number;
  questionType: string;
  questionText: string;
  questionAudio?: string;
  questionImage?: string;
  points: number;
  order: number;
  options?: any;
  blanksData?: any;
  matchingPairs?: any;
  orderingItems?: any;
  modelAnswer?: string;
  skillCategory?: string;
  difficulty: string;
}

export default function TestQuestions() {
  const { testId } = useParams() as { testId: string };
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<TestQuestion | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [questionData, setQuestionData] = useState({
    questionType: 'multiple_choice',
    questionText: '',
    skillCategory: 'reading',
    difficulty: 'medium',
    points: 1,
    options: [
      { id: 1, text: '', isCorrect: false },
      { id: 2, text: '', isCorrect: false },
      { id: 3, text: '', isCorrect: false },
      { id: 4, text: '', isCorrect: false }
    ]
  });

  // Fetch test details
  const { data: test } = useQuery({
    queryKey: [`/api/teacher/tests/${testId}`],
  });

  // Fetch test questions
  const { data: questions = [], isLoading } = useQuery<TestQuestion[]>({
    queryKey: [`/api/teacher/tests/${testId}/questions`],
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest(`/api/teacher/tests/${testId}/questions`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/tests/${testId}/questions`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setQuestionData({
      questionType: 'multiple_choice',
      questionText: '',
      skillCategory: 'reading',
      difficulty: 'medium',
      points: 1,
      options: [
        { id: 1, text: '', isCorrect: false },
        { id: 2, text: '', isCorrect: false },
        { id: 3, text: '', isCorrect: false },
        { id: 4, text: '', isCorrect: false }
      ]
    });
    setAudioFile(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        toast({
          title: "Audio uploaded",
          description: `${file.name} ready for upload`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (MP3, WAV, etc.)",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('questionType', questionData.questionType);
    formData.append('questionText', questionData.questionText);
    formData.append('skillCategory', questionData.skillCategory);
    formData.append('difficulty', questionData.difficulty);
    formData.append('points', questionData.points.toString());
    formData.append('order', (questions.length + 1).toString());

    // Add audio file if uploaded
    if (audioFile) {
      formData.append('audio', audioFile);
    }

    // Add question-specific data based on type
    if (questionData.questionType === 'multiple_choice' || questionData.questionType === 'true_false') {
      formData.append('options', JSON.stringify(questionData.options));
    }

    createQuestionMutation.mutate(formData);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...questionData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestionData({ ...questionData, options: newOptions });
  };

  const renderQuestionTypeFields = () => {
    switch (questionData.questionType) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <Label>Answer Options</Label>
            {questionData.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  checked={option.isCorrect}
                  onCheckedChange={(checked) => updateOption(index, 'isCorrect', checked)}
                />
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) => updateOption(index, 'text', e.target.value)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        );
      
      case 'true_false':
        return (
          <div className="space-y-4">
            <Label>Correct Answer</Label>
            <Select 
              value={questionData.options[0]?.isCorrect ? 'true' : 'false'}
              onValueChange={(value) => {
                const newOptions = [
                  { id: 1, text: 'True', isCorrect: value === 'true' },
                  { id: 2, text: 'False', isCorrect: value === 'false' }
                ];
                setQuestionData({ ...questionData, options: newOptions });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'short_answer':
      case 'essay':
        return (
          <div className="space-y-4">
            <Label htmlFor="modelAnswer">Model Answer (Optional)</Label>
            <Textarea
              id="modelAnswer"
              placeholder="Provide a sample answer for grading reference..."
              rows={3}
            />
          </div>
        );

      case 'fill_blank':
        return (
          <div className="space-y-4">
            <Label>Instructions</Label>
            <p className="text-sm text-muted-foreground">
              Use underscores (_____) in your question text to indicate where students should fill in blanks.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Test Questions</h1>
        <p className="text-muted-foreground">
          {test ? `Managing questions for: ${test.title}` : 'Loading test...'}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Badge variant="outline">{questions.length} Questions</Badge>
          <Badge variant="outline">
            {questions.reduce((sum, q) => sum + q.points, 0)} Total Points
          </Badge>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Question</DialogTitle>
                <DialogDescription>
                  Add a new question to your test. For listening comprehension, upload an audio file.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {/* Question Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionType">Question Type</Label>
                    <Select 
                      value={questionData.questionType}
                      onValueChange={(value) => setQuestionData({ ...questionData, questionType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                        <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                        <SelectItem value="matching">Matching</SelectItem>
                        <SelectItem value="ordering">Ordering</SelectItem>
                        <SelectItem value="speaking">Speaking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skillCategory">Skill Category</Label>
                    <Select 
                      value={questionData.skillCategory}
                      onValueChange={(value) => setQuestionData({ ...questionData, skillCategory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="listening">🎧 Listening</SelectItem>
                        <SelectItem value="speaking">🗣️ Speaking</SelectItem>
                        <SelectItem value="reading">📖 Reading</SelectItem>
                        <SelectItem value="writing">✍️ Writing</SelectItem>
                        <SelectItem value="grammar">📝 Grammar</SelectItem>
                        <SelectItem value="vocabulary">📚 Vocabulary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Audio Upload for Listening Questions */}
                {questionData.skillCategory === 'listening' && (
                  <div className="space-y-2">
                    <Label>Audio File</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {audioFile ? `Selected: ${audioFile.name}` : 'Upload Audio File'}
                      </Button>
                      {audioFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setAudioFile(null)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload MP3, WAV, or other audio formats (max 10MB)
                    </p>
                  </div>
                )}

                {/* Question Text */}
                <div className="space-y-2">
                  <Label htmlFor="questionText">Question Text</Label>
                  <Textarea
                    id="questionText"
                    value={questionData.questionText}
                    onChange={(e) => setQuestionData({ ...questionData, questionText: e.target.value })}
                    placeholder={
                      questionData.skillCategory === 'listening' 
                        ? "Listen to the audio and answer: What is the main topic discussed?"
                        : "Enter your question here..."
                    }
                    rows={3}
                    required
                  />
                </div>

                {/* Difficulty and Points */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select 
                      value={questionData.difficulty}
                      onValueChange={(value) => setQuestionData({ ...questionData, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={questionData.points}
                      onChange={(e) => setQuestionData({ ...questionData, points: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>

                {/* Question-specific fields */}
                {renderQuestionTypeFields()}
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createQuestionMutation.isPending}>
                  {createQuestionMutation.isPending ? "Creating..." : "Create Question"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No questions added yet
              </p>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Question {index + 1}</span>
                      <Badge variant="outline">{question.questionType.replace('_', ' ')}</Badge>
                      <Badge variant="secondary">{question.skillCategory}</Badge>
                      {question.questionAudio && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Volume2 className="w-3 h-3 mr-1" />
                          Audio
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {question.points} point{question.points !== 1 ? 's' : ''} • {question.difficulty}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{question.questionText}</p>
                {question.questionAudio && (
                  <audio controls className="mt-2 w-full">
                    <source src={question.questionAudio} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}