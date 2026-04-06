import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssignmentsData, useAssignmentMutations, type AssignmentRecord, type AssignmentFormValues } from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Eye, FileText, Clock, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/services/endpoints";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { FeedbackDialog } from "@/components/teacher/FeedbackDialog";
import { CreateAssignmentDialog } from "@/components/teacher/CreateAssignmentDialog";

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  assignmentType: z.enum(["writing", "speaking", "reading", "listening", "general"]).default("general"),
  studentId: z.number().min(1, "Student is required"),
  courseId: z.number().min(1, "Course is required"),
  dueDate: z.coerce.date().refine((d) => d > new Date(), "Due date must be in the future"),
  maxScore: z.number().min(1, "Max score must be positive"),
  instructions: z.string().optional(),
});

type AssignmentFormData = AssignmentFormValues;

const AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/webm"];

function getStatusColor(status: string) {
  switch (status) {
    case "submitted": return "bg-blue-100 text-blue-800";
    case "graded": return "bg-green-100 text-green-800";
    case "overdue": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export default function TeacherAssignmentsPage() {
  const { t } = useTranslation(["teacher", "common"]);
  const { isRTL } = useLanguage();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRecord | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackAudioFiles, setFeedbackAudioFiles] = useState<File[]>([]);
  const [score, setScore] = useState(0);
  const [viewAssignmentId, setViewAssignmentId] = useState<number | null>(null);
  const [assignmentType, setAssignmentType] = useState("general");
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Write your assignment instructions here..." }), TextAlign.configure({ types: ["heading", "paragraph"] }), Highlight],
    content: "",
    onUpdate: ({ editor }) => {
      form.setValue("instructions", editor.getHTML());
      const words = editor.getText().trim().split(/\s+/).filter((w) => w.length > 0);
      setWordCount(words.length);
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get("view");
    setViewAssignmentId(viewParam && !isNaN(parseInt(viewParam)) ? parseInt(viewParam) : null);
  }, [location]);

  useEffect(() => {
    if (!createDialogOpen && isRecording) stopRecording();
  }, [createDialogOpen]);

  useEffect(() => {
    return () => {
      if (isRecording) {
        if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setIsRecording(false);
        setRecordingTime(0);
        audioChunksRef.current = [];
      }
    };
  }, [isRecording]);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { title: "", description: "", assignmentType: "general", studentId: 0, courseId: 0, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), maxScore: 100, instructions: "" },
  });

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (audioFiles.length + files.length > 5) { toast({ title: "Too Many Files", description: "Maximum 5 audio files allowed", variant: "destructive" }); return; }
    if (files.some((f) => !AUDIO_TYPES.includes(f.type))) { toast({ title: "Invalid File Type", description: "Only audio files allowed", variant: "destructive" }); return; }
    setAudioFiles((prev) => [...prev, ...files]);
  };

  const handleFeedbackAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (feedbackAudioFiles.length + files.length > 5) { toast({ title: "Too Many Files", description: "Maximum 5 audio files allowed", variant: "destructive" }); return; }
    if (files.some((f) => !AUDIO_TYPES.includes(f.type))) { toast({ title: "Invalid File Type", description: "Only audio files allowed", variant: "destructive" }); return; }
    setFeedbackAudioFiles((prev) => [...prev, ...files]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        setAudioFiles((prev) => {
          if (prev.length >= 5) { toast({ title: "Maximum Files Reached", description: "You can only have 5 audio files", variant: "destructive" }); return prev; }
          toast({ title: "Recording Saved", description: "Audio recording added successfully" });
          return [...prev, audioFile];
        });
        stream.getTracks().forEach((t) => t.stop());
        if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
        setRecordingTime(0);
      };
      mediaRecorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
      toast({ title: "Recording Started", description: "Speak into your microphone" });
    } catch {
      toast({ title: "Recording Failed", description: "Could not access microphone. Please check permissions.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    }
  };

  const { assignments, isLoading, students, courses } = useAssignmentsData();
  const { createAssignmentMutation, submitFeedbackMutation } = useAssignmentMutations(
    assignmentType,
    audioFiles,
    feedbackAudioFiles,
    editor,
    () => { setCreateDialogOpen(false); setAudioFiles([]); setAssignmentType("general"); form.reset(); },
    () => { setFeedbackDialogOpen(false); setSelectedAssignment(null); setFeedback(""); setFeedbackAudioFiles([]); setScore(0); },
  );

  const handleBackToList = () => {
    setViewAssignmentId(null);
    window.history.replaceState({}, "", "/teacher/assignments");
    setLocation("/teacher/assignments");
  };

  const handleFeedbackSubmit = () => {
    if (selectedAssignment && feedback) submitFeedbackMutation.mutate({ assignmentId: selectedAssignment.id, feedback, score });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  }

  if (viewAssignmentId) {
    const assignment = assignments.find((a: AssignmentRecord) => a.id === viewAssignmentId);
    if (!assignment) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Card><CardContent className="p-8 text-center">
              <p className="text-red-600">Assignment not found</p>
              <Button onClick={handleBackToList} className="mt-4"><ArrowLeft className="w-4 h-4 me-2" />Back to Assignments</Button>
            </CardContent></Card>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={handleBackToList}><ArrowLeft className="w-4 h-4 me-2" />Back to Assignments</Button>
            <Badge variant={assignment.status === "submitted" ? "default" : assignment.status === "graded" ? "secondary" : "outline"}>{assignment.status}</Badge>
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
              <div><h3 className="font-semibold mb-2">Description</h3><p className="text-gray-700">{assignment.description}</p></div>
              {assignment.submission && <div><h3 className="font-semibold mb-2">Student Submission</h3><div className="bg-gray-50 p-4 rounded-lg"><p className="text-gray-700">{assignment.submission}</p></div></div>}
              {assignment.feedback && (
                <div><h3 className="font-semibold mb-2">Feedback</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{assignment.feedback}</p>
                    {assignment.score && <div className="mt-2"><Badge variant="secondary">Score: {assignment.score}/{assignment.maxScore || 100}</Badge></div>}
                  </div>
                </div>
              )}
              {!assignment.feedback && assignment.status === "submitted" && (
                <Button onClick={() => { setSelectedAssignment(assignment); setFeedbackDialogOpen(true); }}>
                  <Edit className="w-4 h-4 me-2" />Provide Feedback
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("teacher:assignments.title")}</h1>
            <p className="text-gray-600">{t("teacher:assignments.subtitle")}</p>
          </div>
          <CreateAssignmentDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            form={form}
            assignmentType={assignmentType}
            onAssignmentTypeChange={setAssignmentType}
            editor={editor}
            wordCount={wordCount}
            audioFiles={audioFiles}
            isRecording={isRecording}
            recordingTime={recordingTime}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onAudioUpload={handleAudioFileUpload}
            onRemoveAudio={(i) => setAudioFiles((p) => p.filter((_, j) => j !== i))}
            students={students}
            courses={courses}
            onSubmit={(d) => createAssignmentMutation.mutate(d)}
            isPending={createAssignmentMutation.isPending}
          />
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {assignments.length === 0 ? (
            <Card><CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
              <p className="text-gray-600 mb-4">Create your first assignment to get started</p>
              <Button onClick={() => setCreateDialogOpen(true)}><Plus className="w-4 h-4 me-2" />Create Assignment</Button>
            </CardContent></Card>
          ) : assignments.map((assignment: AssignmentRecord) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold">{assignment.title}</h3>
                      <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                    </div>
                    <p className="text-gray-600 mb-4">{assignment.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div className="flex items-center"><User className="w-4 h-4 me-2" /><span>Student: {assignment.studentName}</span></div>
                      <div className="flex items-center"><FileText className="w-4 h-4 me-2" /><span>Course: {assignment.courseName}</span></div>
                      <div className="flex items-center"><Clock className="w-4 h-4 me-2" /><span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span></div>
                    </div>
                    {assignment.submittedAt && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">Submitted on {new Date(assignment.submittedAt).toLocaleString()}</p>
                        {assignment.score && <p className="text-sm text-blue-800">Score: {assignment.score}/{assignment.maxScore}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 mt-4 lg:mt-0 lg:ms-6">
                    <Button size="sm" variant="outline" onClick={() => { setViewAssignmentId(assignment.id); setLocation(`/teacher/assignments?view=${assignment.id}`); }}>
                      <Eye className="w-3 h-3 me-1" />View
                    </Button>
                    {(assignment.status === "submitted" || assignment.status === "assigned") && !assignment.feedback && (
                      <Button size="sm" onClick={() => { setSelectedAssignment(assignment); setFeedbackDialogOpen(true); }}>
                        <Edit className="w-3 h-3 me-1" />{assignment.status === "submitted" ? "Grade" : "Provide Feedback"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <FeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          selectedAssignment={selectedAssignment}
          feedback={feedback}
          onFeedbackChange={setFeedback}
          score={score}
          onScoreChange={setScore}
          feedbackAudioFiles={feedbackAudioFiles}
          onAudioUpload={handleFeedbackAudioUpload}
          onRemoveAudio={(i) => setFeedbackAudioFiles((p) => p.filter((_, j) => j !== i))}
          onSubmit={handleFeedbackSubmit}
          isPending={submitFeedbackMutation.isPending}
        />
      </div>
    </div>
  );
}
