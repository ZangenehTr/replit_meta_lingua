import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Calendar, Clock, CheckCircle, AlertCircle, Upload, Download, FileText, Mic, Play, Pause } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface Homework {
  id: number;
  title: string;
  description: string;
  instructions: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'reviewed' | 'completed';
  courseId: number;
  tutorId: number;
  maxScore: number;
  submittedAt?: Date;
  feedback?: string;
  score?: number;
  attachments: string[];
  course: {
    title: string;
    level: string;
  };
  tutor: {
    firstName: string;
    lastName: string;
  };
}

interface HomeworkSubmission {
  id: number;
  homeworkId: number;
  content: string;
  attachments: string[];
  submittedAt: Date;
  score?: number;
  feedback?: string;
}

export default function HomeworkPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: homework, isLoading, error } = useQuery({
    queryKey: ['/api/students/homework'],
    enabled: !!user
  });

  const submitHomeworkMutation = useMutation({
    mutationFn: async ({ homeworkId, content, attachments }: { 
      homeworkId: number; 
      content: string; 
      attachments: File[] 
    }) => {
      const formData = new FormData();
      formData.append('content', content);
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      const response = await fetch(`/api/homework/${homeworkId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to submit homework');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/homework'] });
      setSubmissionText("");
      setIsSubmitting(false);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading homework...</p>
        </div>
      </div>
    );
  }

  if (error || !homework) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading homework</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const pendingHomework = homework.filter((hw: Homework) => hw.status === 'pending');
  const submittedHomework = homework.filter((hw: Homework) => hw.status === 'submitted');
  const reviewedHomework = homework.filter((hw: Homework) => 
    hw.status === 'reviewed' || hw.status === 'completed'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'submitted': return 'default';
      case 'reviewed': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getProgressPercentage = () => {
    const total = homework.length;
    const completed = reviewedHomework.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const handleSubmitHomework = async (homeworkId: number, content: string, files: File[] = []) => {
    setIsSubmitting(true);
    try {
      await submitHomeworkMutation.mutateAsync({
        homeworkId,
        content,
        attachments: files
      });
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const HomeworkCard = ({ hw }: { hw: Homework }) => {
    const [showSubmission, setShowSubmission] = useState(false);
    const [localSubmissionText, setLocalSubmissionText] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    
    const isOverdue = new Date() > new Date(hw.dueDate) && hw.status === 'pending';
    const daysUntilDue = Math.ceil((new Date(hw.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : ''}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{hw.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                {hw.course.title} • {hw.course.level}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Instructor: {hw.tutor.firstName} {hw.tutor.lastName}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getStatusColor(hw.status)}>
                {hw.status}
              </Badge>
              {hw.score !== undefined && (
                <div className="text-sm font-medium">
                  Score: {hw.score}/{hw.maxScore}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {hw.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Due: {format(new Date(hw.dueDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className={isOverdue ? 'text-red-600' : daysUntilDue <= 1 ? 'text-orange-600' : ''}>
                  {isOverdue ? 'Overdue' : daysUntilDue <= 0 ? 'Due today' : `${daysUntilDue} days left`}
                </span>
              </div>
            </div>

            {hw.feedback && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Instructor Feedback:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{hw.feedback}</p>
              </div>
            )}

            {hw.attachments.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Resources:</h4>
                <div className="flex flex-wrap gap-2">
                  {hw.attachments.map((attachment, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(attachment, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      File {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {hw.status === 'pending' && (
                <Dialog open={showSubmission} onOpenChange={setShowSubmission}>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Homework
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Submit Homework: {hw.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Instructions:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {hw.instructions}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Your Response:</label>
                        <Textarea
                          placeholder="Type your homework response here..."
                          value={localSubmissionText}
                          onChange={(e) => setLocalSubmissionText(e.target.value)}
                          rows={6}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Upload Files (Optional):</label>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.mp3,.mp4"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setUploadedFiles(files);
                          }}
                        />
                        {uploadedFiles.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              {uploadedFiles.length} file(s) selected
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSubmitHomework(hw.id, localSubmissionText, uploadedFiles)}
                          disabled={!localSubmissionText.trim() || isSubmitting}
                          className="flex-1"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Homework'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowSubmission(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Homework Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Instructions:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{hw.instructions}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Course:</h4>
                      <p className="text-sm">{hw.course.title} ({hw.course.level})</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Due Date:</h4>
                      <p className="text-sm">{format(new Date(hw.dueDate), 'EEEE, MMMM d, yyyy at h:mm a')}</p>
                    </div>
                    {hw.submittedAt && (
                      <div>
                        <h4 className="font-medium mb-2">Submitted:</h4>
                        <p className="text-sm">{format(new Date(hw.submittedAt), 'EEEE, MMMM d, yyyy at h:mm a')}</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Homework & Assignments
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete your assignments and track your progress
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Completion</span>
                  <span>{Math.round(getProgressPercentage())}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">{pendingHomework.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{submittedHomework.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Submitted</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{reviewedHomework.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Homework Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              <AlertCircle className="h-4 w-4 mr-2" />
              Pending ({pendingHomework.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              <Clock className="h-4 w-4 mr-2" />
              Submitted ({submittedHomework.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed ({reviewedHomework.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {pendingHomework.length > 0 ? (
                pendingHomework.map((hw: Homework) => (
                  <HomeworkCard key={hw.id} hw={hw} />
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">All caught up! No pending homework.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="submitted" className="mt-6">
            <div className="space-y-4">
              {submittedHomework.length > 0 ? (
                submittedHomework.map((hw: Homework) => (
                  <HomeworkCard key={hw.id} hw={hw} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No submitted homework awaiting review</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="space-y-4">
              {reviewedHomework.length > 0 ? (
                reviewedHomework.map((hw: Homework) => (
                  <HomeworkCard key={hw.id} hw={hw} />
                ))
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No completed homework yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}