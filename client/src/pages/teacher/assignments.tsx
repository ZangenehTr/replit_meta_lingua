import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Edit, Eye, FileText, Clock, User, ArrowLeft, Upload, Trash2, Mic, MicOff, Play, Pause, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { API_ENDPOINTS } from "@/services/endpoints";
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  assignmentType: z.enum(['writing', 'speaking', 'reading', 'listening', 'general']).default('general'),
  studentId: z.number().min(1, 'Student is required'),
  courseId: z.number().min(1, 'Course is required'),
  dueDate: z.coerce.date().refine(
    (date) => date > new Date(),
    "Due date must be in the future"
  ),
  maxScore: z.number().min(1, 'Max score must be positive'),
  instructions: z.string().optional()
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export default function TeacherAssignmentsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const { isRTL } = useLanguage();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackAudioFiles, setFeedbackAudioFiles] = useState<File[]>([]);
  const [score, setScore] = useState<number>(0);
  const [viewAssignmentId, setViewAssignmentId] = useState<number | null>(null);
  const [assignmentType, setAssignmentType] = useState<string>('general');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Word counter state
  const [wordCount, setWordCount] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // Tiptap editor for Writing assignments
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your assignment instructions here...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Sync editor content to form
      const html = editor.getHTML();
      form.setValue('instructions', html);
      
      // Update word count
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    },
  });

  // Handle URL parameters for viewing specific assignment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam && !isNaN(parseInt(viewParam))) {
      setViewAssignmentId(parseInt(viewParam));
    } else {
      setViewAssignmentId(null); // Clear when no view parameter
    }
    
    // Debug logging for button visibility (development only)
    if (process.env.NODE_ENV === 'development') {

    }
  }, [location]);

  // Cleanup recording on dialog close or component unmount
  useEffect(() => {
    // Cleanup function runs on unmount or when dialog closes
    return () => {
      if (isRecording) {
        // Stop recording and cleanup
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          
          // Stop all media tracks
          if (mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
        }
        
        // Clear interval
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        setIsRecording(false);
        setRecordingTime(0);
        audioChunksRef.current = [];
      }
    };
  }, [isRecording]);

  // Additional cleanup when dialog closes
  useEffect(() => {
    if (!createDialogOpen && isRecording) {
      // Trigger stop recording
      stopRecording();
    }
  }, [createDialogOpen]);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      assignmentType: 'general',
      studentId: 0,
      courseId: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      maxScore: 100,
      instructions: ''
    }
  });

  // Audio file handlers for Speaking assignments
  const handleAudioFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (audioFiles.length + files.length > 5) {
      toast({
        title: "Too Many Files",
        description: "Maximum 5 audio files allowed per assignment",
        variant: "destructive"
      });
      return;
    }

    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm'];
    const invalidFiles = files.filter(file => !audioTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Type",
        description: "Only audio files are allowed (MP3, WAV, OGG, WebM)",
        variant: "destructive"
      });
      return;
    }

    setAudioFiles(prev => [...prev, ...files]);
  };

  const removeAudioFile = (index: number) => {
    setAudioFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Use callback to check current state, not stale closure
        setAudioFiles(prev => {
          if (prev.length >= 5) {
            toast({
              title: "Maximum Files Reached",
              description: "You can only have 5 audio files",
              variant: "destructive"
            });
            return prev; // Don't add file
          }
          
          toast({
            title: "Recording Saved",
            description: "Audio recording added successfully"
          });
          return [...prev, audioFile];
        });
        
        stream.getTracks().forEach(track => track.stop());
        
        // Clear interval defensively (handles unexpected recorder stops)
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Speak into your microphone"
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio feedback handlers for teacher
  const handleFeedbackAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (feedbackAudioFiles.length + files.length > 5) {
      toast({
        title: "Too Many Files",
        description: "Maximum 5 audio files allowed",
        variant: "destructive"
      });
      return;
    }

    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm'];
    const invalidFiles = files.filter(file => !audioTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Type",
        description: "Only audio files are allowed",
        variant: "destructive"
      });
      return;
    }

    setFeedbackAudioFiles(prev => [...prev, ...files]);
  };

  const removeFeedbackAudioFile = (index: number) => {
    setFeedbackAudioFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.teacher.assignments]
  });

  // Fetch teacher's classes for student/course selection
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.teacher.classes]
  });

  // Create assignment mutation with audio file support
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      // If it's a speaking assignment with audio files, use FormData
      if (assignmentType === 'speaking' && audioFiles.length > 0) {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('assignmentType', data.assignmentType);
        formData.append('studentId', data.studentId.toString());
        formData.append('courseId', data.courseId.toString());
        formData.append('dueDate', data.dueDate.toISOString());
        formData.append('maxScore', data.maxScore.toString());
        if (data.instructions) {
          formData.append('instructions', data.instructions);
        }
        
        // Append audio files
        audioFiles.forEach((file) => {
          formData.append('audioFiles', file);
        });
        
        return apiRequest(API_ENDPOINTS.teacher.assignments, {
          method: 'POST',
          body: formData
        });
      }
      
      // Otherwise, use standard JSON
      return apiRequest(API_ENDPOINTS.teacher.assignments, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.teacher.assignments] });
      toast({
        title: 'Success',
        description: 'Assignment created successfully'
      });
      setCreateDialogOpen(false);
      setAudioFiles([]);
      setAssignmentType('general');
      if (editor) {
        editor.commands.setContent('');
      }
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive'
      });
    }
  });

  // Submit feedback mutation with audio support
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ assignmentId, feedback, score }: { assignmentId: number; feedback: string; score: number }) => {
      // If there are audio files, use FormData
      if (feedbackAudioFiles.length > 0) {
        const formData = new FormData();
        formData.append('feedback', feedback);
        formData.append('score', score.toString());
        
        // Append audio files
        feedbackAudioFiles.forEach((file) => {
          formData.append('audioFeedback', file);
        });
        
        return apiRequest(`${API_ENDPOINTS.teacher.assignments}/${assignmentId}/feedback`, {
          method: 'POST',
          body: formData
        });
      }
      
      // Otherwise, use standard JSON
      return apiRequest(`${API_ENDPOINTS.teacher.assignments}/${assignmentId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback, score })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.teacher.assignments] });
      toast({
        title: 'Success',
        description: 'Feedback submitted successfully'
      });
      setFeedbackDialogOpen(false);
      setSelectedAssignment(null);
      setFeedback('');
      setFeedbackAudioFiles([]);
      setScore(0);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive'
      });
    }
  });

  const onCreateAssignment = (data: AssignmentFormData) => {
    createAssignmentMutation.mutate(data);
  };

  const handleBackToList = () => {
    setViewAssignmentId(null);
    // Clear URL parameters properly
    window.history.replaceState({}, '', '/teacher/assignments');
    setLocation('/teacher/assignments');
  };

  const handleFeedbackSubmit = () => {
    if (selectedAssignment && feedback) {
      submitFeedbackMutation.mutate({
        assignmentId: selectedAssignment.id,
        feedback,
        score
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique students from classes
  const students = classes.reduce((acc: any[], classItem: any) => {
    if (classItem.studentId && !acc.find(s => s.id === classItem.studentId)) {
      acc.push({
        id: classItem.studentId,
        name: classItem.studentName
      });
    }
    return acc;
  }, []);

  // Get unique courses from classes
  const courses = classes.reduce((acc: any[], classItem: any) => {
    if (classItem.courseId && !acc.find(c => c.id === classItem.courseId)) {
      acc.push({
        id: classItem.courseId,
        title: classItem.course
      });
    }
    return acc;
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }



  // Show individual assignment view
  if (viewAssignmentId) {
    const assignment = assignments.find((a: any) => a.id === viewAssignmentId);
    if (!assignment) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-red-600">Assignment not found</p>
                <Button onClick={handleBackToList} className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Assignment Detail Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Button>
            <Badge variant={
              assignment.status === 'submitted' ? 'default' :
              assignment.status === 'graded' ? 'secondary' : 'outline'
            }>
              {assignment.status}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Student: {assignment.studentName}</span>
                <span>Course: {assignment.courseName}</span>
                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{assignment.description}</p>
              </div>

              {assignment.submission && (
                <div>
                  <h3 className="font-semibold mb-2">Student Submission</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{assignment.submission}</p>
                  </div>
                </div>
              )}

              {assignment.feedback && (
                <div>
                  <h3 className="font-semibold mb-2">Feedback</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{assignment.feedback}</p>
                    {assignment.score && (
                      <div className="mt-2">
                        <Badge variant="secondary">Score: {assignment.score}/{assignment.maxScore || 100}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!assignment.feedback && assignment.status === 'submitted' && (
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setFeedbackDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Provide Feedback
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info - Hidden in production */}
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('teacher:assignments.title')}</h1>
            <p className="text-gray-600">{t('teacher:assignments.subtitle')}</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 lg:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateAssignment)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assignment title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the assignment requirements" 
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Type</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setAssignmentType(value);
                            if (value === 'writing' && editor) {
                              editor.commands.setContent('');
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-assignment-type">
                              <SelectValue placeholder="Select assignment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="writing">Writing (Rich Text Editor)</SelectItem>
                            <SelectItem value="speaking">Speaking (Audio Recorder)</SelectItem>
                            <SelectItem value="reading">Reading</SelectItem>
                            <SelectItem value="listening">Listening</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tiptap Editor for Writing Assignments */}
                  {assignmentType === 'writing' && editor && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Rich Text Instructions</Label>
                        <Badge variant="secondary" className="text-xs">
                          {wordCount} {wordCount === 1 ? 'word' : 'words'}
                        </Badge>
                      </div>
                      <div className="border rounded-lg">
                        {/* Tiptap Toolbar */}
                        <div className="flex items-center justify-between gap-1 p-2 border-b bg-gray-50">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={editor.isActive('bold') ? 'default' : 'ghost'}
                              onClick={() => editor.chain().focus().toggleBold().run()}
                              data-testid="button-bold"
                              title="Bold (Ctrl+B)"
                            >
                              <strong>B</strong>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={editor.isActive('italic') ? 'default' : 'ghost'}
                              onClick={() => editor.chain().focus().toggleItalic().run()}
                              data-testid="button-italic"
                              title="Italic (Ctrl+I)"
                            >
                              <em>I</em>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={editor.isActive('strike') ? 'default' : 'ghost'}
                              onClick={() => editor.chain().focus().toggleStrike().run()}
                              data-testid="button-strike"
                              title="Strikethrough"
                            >
                              <s>S</s>
                            </Button>
                            <div className="w-px h-6 bg-gray-300 mx-1"></div>
                            <Button
                              type="button"
                              size="sm"
                              variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
                              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                              data-testid="button-h1"
                              title="Heading 1"
                            >
                              H1
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
                              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                              data-testid="button-h2"
                              title="Heading 2"
                            >
                              H2
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
                              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                              data-testid="button-h3"
                              title="Heading 3"
                            >
                              H3
                            </Button>
                            <div className="w-px h-6 bg-gray-300 mx-1"></div>
                            <Button
                              type="button"
                              size="sm"
                              variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                              onClick={() => editor.chain().focus().toggleBulletList().run()}
                              data-testid="button-bullet-list"
                              title="Bullet List"
                            >
                              • List
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                              onClick={() => editor.chain().focus().toggleOrderedList().run()}
                              data-testid="button-ordered-list"
                              title="Numbered List"
                            >
                              1. List
                            </Button>
                            <div className="w-px h-6 bg-gray-300 mx-1"></div>
                            <Button
                              type="button"
                              size="sm"
                              variant={editor.isActive('highlight') ? 'default' : 'ghost'}
                              onClick={() => editor.chain().focus().toggleHighlight().run()}
                              data-testid="button-highlight"
                              title="Highlight"
                            >
                              Highlight
                            </Button>
                          </div>
                        </div>
                        {/* Editor Content - LTR forced */}
                        <EditorContent 
                          editor={editor} 
                          className="prose max-w-none p-4 min-h-[200px] focus:outline-none"
                          dir="ltr"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Use the rich text editor to create detailed writing instructions</span>
                        <span className="text-blue-600 font-medium">{wordCount} words</span>
                      </div>
                    </div>
                  )}

                  {/* Audio Recording & Upload for Speaking Assignments */}
                  {assignmentType === 'speaking' && (
                    <div className="space-y-4">
                      <Label>Audio Instructions ({audioFiles.length}/5)</Label>
                      
                      {/* Audio Recording Controls */}
                      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Mic className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Record Audio</span>
                          </div>
                          {isRecording && (
                            <Badge variant="destructive" className="animate-pulse">
                              Recording {formatRecordingTime(recordingTime)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {!isRecording ? (
                            <Button
                              type="button"
                              onClick={startRecording}
                              disabled={audioFiles.length >= 5}
                              className="flex-1"
                              data-testid="button-start-recording"
                            >
                              <Mic className="h-4 w-4 mr-2" />
                              Start Recording
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={stopRecording}
                              variant="destructive"
                              className="flex-1"
                              data-testid="button-stop-recording"
                            >
                              <Square className="h-4 w-4 mr-2" />
                              Stop & Save Recording
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Click to record audio instructions for your students
                        </p>
                      </div>

                      {/* Audio File Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">Or upload audio files</p>
                        <Input
                          type="file"
                          multiple
                          accept="audio/*"
                          onChange={handleAudioFileUpload}
                          className="mt-2"
                          data-testid="input-audio-upload"
                          disabled={audioFiles.length >= 5}
                        />
                      </div>

                      {audioFiles.length > 0 && (
                        <div className="space-y-2">
                          <Label>Uploaded Audio Files</Label>
                          <div className="space-y-2">
                            {audioFiles.map((file, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                                data-testid={`audio-file-${index}`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Mic className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  <span className="text-sm truncate">{file.name}</span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    ({(file.size / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAudioFile(index)}
                                  data-testid={`button-remove-audio-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students.map((student: any) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {courses.map((course: any) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                  {course.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(date);
                                  }
                                }}
                                disabled={(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today;
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="100" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional instructions for the student"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAssignmentMutation.isPending}>
                      {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                <p className="text-gray-600 mb-4">Create your first assignment to get started</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment: any) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold">{assignment.title}</h3>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{assignment.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>Student: {assignment.studentName}</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          <span>Course: {assignment.courseName}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {assignment.submittedAt && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Submitted on {new Date(assignment.submittedAt).toLocaleString()}
                          </p>
                          {assignment.score && (
                            <p className="text-sm text-blue-800">
                              Score: {assignment.score}/{assignment.maxScore}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-4 lg:mt-0 lg:ml-6">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setViewAssignmentId(assignment.id);
                          const newUrl = new URL(window.location.href);
                          newUrl.searchParams.set('view', assignment.id.toString());
                          window.history.pushState({}, '', newUrl.toString());
                          setLocation(`/teacher/assignments?view=${assignment.id}`);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {(assignment.status === 'submitted' || assignment.status === 'assigned') && !assignment.feedback && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setFeedbackDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          {assignment.status === 'submitted' ? 'Grade' : 'Provide Feedback'}
                        </Button>
                      )}

                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Feedback Dialog - Enhanced with Text + Audio */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Grade Assignment & Provide Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedback-score">Score</Label>
                <Input
                  id="feedback-score"
                  type="number"
                  placeholder="Enter score"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  max={selectedAssignment?.maxScore}
                  data-testid="input-feedback-score"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Max score: {selectedAssignment?.maxScore}
                </p>
              </div>
              
              <div>
                <Label htmlFor="feedback-text">Text Feedback</Label>
                <Textarea
                  id="feedback-text"
                  placeholder="Provide written feedback to the student"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-32"
                  data-testid="textarea-feedback"
                />
              </div>

              {/* Audio Feedback Upload */}
              <div className="space-y-2">
                <Label>Audio Feedback (Optional) ({feedbackAudioFiles.length}/5)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Mic className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload audio feedback for more personalized comments
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={handleFeedbackAudioUpload}
                    className="mt-2"
                    data-testid="input-feedback-audio"
                    disabled={feedbackAudioFiles.length >= 5}
                  />
                </div>

                {feedbackAudioFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Audio Feedback Files</Label>
                    <div className="space-y-2">
                      {feedbackAudioFiles.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                          data-testid={`feedback-audio-${index}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Mic className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeedbackAudioFile(index)}
                            data-testid={`button-remove-feedback-audio-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFeedbackDialogOpen(false);
                    setFeedback('');
                    setFeedbackAudioFiles([]);
                    setScore(0);
                  }}
                  data-testid="button-cancel-feedback"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleFeedbackSubmit}
                  disabled={!feedback || score === 0 || submitFeedbackMutation.isPending}
                  data-testid="button-submit-feedback"
                >
                  {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Grade & Feedback'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}