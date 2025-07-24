import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Calendar, 
  User, 
  Star,
  Clock,
  FileText,
  Send,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface SupervisionObservation {
  id: number;
  sessionId: number;
  supervisorId: number;
  teacherId: number;
  observationType: string;
  joinTime: string | null;
  observationDuration: number | null;
  scores: {
    teachingMethodology: number;
    classroomManagement: number;
    studentEngagement: number;
    contentDelivery: number;
    languageSkills: number;
    timeManagement: number;
    technologyUse?: number;
  };
  overallScore: string;
  strengths: string | null;
  areasForImprovement: string | null;
  actionItems: string | null;
  followUpRequired: boolean;
  teacherNotified: boolean;
  notificationSentAt: string | null;
  createdAt: string;
  // New workflow fields
  teacherAcknowledged: boolean;
  teacherAcknowledgedAt: string | null;
  teacherResponse: string | null;
  teacherImprovementPlan: string | null;
  improvementPlanDeadline: string | null;
  followUpCompleted: boolean;
  followUpCompletedAt: string | null;
}

interface TeacherObservationResponse {
  id: number;
  observationId: number;
  teacherId: number;
  responseType: 'acknowledgment' | 'improvement_plan' | 'progress_update';
  content: string;
  submittedAt: string;
  supervisorReviewed: boolean;
  supervisorReviewedAt: string | null;
}

export default function TeacherObservationsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedObservation, setSelectedObservation] = useState<SupervisionObservation | null>(null);
  const [responseType, setResponseType] = useState<'acknowledgment' | 'improvement_plan' | 'progress_update'>('acknowledgment');
  const [responseContent, setResponseContent] = useState('');
  const [improvementPlan, setImprovementPlan] = useState('');
  const [improvementDeadline, setImprovementDeadline] = useState('');

  // Fetch teacher's observations
  const { data: observations, isLoading } = useQuery({
    queryKey: ['/api/teacher/observations'],
  });

  // Fetch unacknowledged observations for notification count
  const { data: unacknowledgedObservations } = useQuery({
    queryKey: ['/api/teacher/observations', 'unacknowledged'],
  });

  // Acknowledge observation mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (observationId: number) => {
      const response = await fetch(`/api/teacher/observations/${observationId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to acknowledge observation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/observations', 'unacknowledged'] });
      toast({
        title: "Observation Acknowledged",
        description: "You have successfully acknowledged this observation.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge observation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit response mutation
  const respondMutation = useMutation({
    mutationFn: async (data: { observationId: number; responseType: string; content: string }) => {
      const response = await fetch(`/api/teacher/observations/${data.observationId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responseType: data.responseType,
          content: data.content,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit response');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/observations'] });
      setResponseContent('');
      setSelectedObservation(null);
      toast({
        title: "Response Submitted",
        description: "Your response has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit improvement plan mutation
  const improvementPlanMutation = useMutation({
    mutationFn: async (data: { observationId: number; improvementPlan: string; deadline: string }) => {
      const response = await fetch(`/api/teacher/observations/${data.observationId}/improvement-plan`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          improvementPlan: data.improvementPlan,
          deadline: data.deadline,
        }),
      });
      if (!response.ok) throw new Error('Failed to update improvement plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/observations'] });
      setImprovementPlan('');
      setImprovementDeadline('');
      setSelectedObservation(null);
      toast({
        title: "Improvement Plan Updated",
        description: "Your improvement plan has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update improvement plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAcknowledge = (observationId: number) => {
    acknowledgeMutation.mutate(observationId);
  };

  const handleSubmitResponse = () => {
    if (!selectedObservation || !responseContent.trim()) return;
    
    respondMutation.mutate({
      observationId: selectedObservation.id,
      responseType,
      content: responseContent,
    });
  };

  const handleSubmitImprovementPlan = () => {
    if (!selectedObservation || !improvementPlan.trim()) return;
    
    improvementPlanMutation.mutate({
      observationId: selectedObservation.id,
      improvementPlan,
      deadline: improvementDeadline,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600 bg-green-50";
    if (score >= 3) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getObservationStatusBadge = (observation: SupervisionObservation) => {
    if (!observation.teacherAcknowledged) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Requires Acknowledgment
      </Badge>;
    }
    if (observation.followUpRequired && !observation.followUpCompleted) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Follow-up Required
      </Badge>;
    }
    return <Badge variant="default" className="flex items-center gap-1">
      <CheckCircle className="w-3 h-3" />
      Acknowledged
    </Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading observations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('teacher:observations.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('teacher:observations.subtitle')}
          </p>
        </div>
        {unacknowledgedObservations?.length > 0 && (
          <Badge variant="destructive" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {unacknowledgedObservations.length} Unacknowledged
          </Badge>
        )}
      </div>

      {!observations || observations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Observations Yet</h3>
            <p className="text-muted-foreground text-center">
              You don't have any teaching observations yet. When supervisors observe your classes,
              they will appear here for your review and response.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {observations.map((observation: SupervisionObservation) => (
            <Card key={observation.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Classroom Observation
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(observation.createdAt), 'PPP')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        Overall Score: {observation.overallScore}/5
                      </span>
                      {observation.observationDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {observation.observationDuration} minutes
                        </span>
                      )}
                    </div>
                  </div>
                  {getObservationStatusBadge(observation)}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Scores Section */}
                <div>
                  <h4 className="font-semibold mb-3">Assessment Scores</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Teaching Methodology</Label>
                      <div className={`px-3 py-2 rounded-lg text-center font-medium ${getScoreColor(observation.scores.teachingMethodology)}`}>
                        {observation.scores.teachingMethodology}/5
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Classroom Management</Label>
                      <div className={`px-3 py-2 rounded-lg text-center font-medium ${getScoreColor(observation.scores.classroomManagement)}`}>
                        {observation.scores.classroomManagement}/5
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Student Engagement</Label>
                      <div className={`px-3 py-2 rounded-lg text-center font-medium ${getScoreColor(observation.scores.studentEngagement)}`}>
                        {observation.scores.studentEngagement}/5
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Content Delivery</Label>
                      <div className={`px-3 py-2 rounded-lg text-center font-medium ${getScoreColor(observation.scores.contentDelivery)}`}>
                        {observation.scores.contentDelivery}/5
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Language Skills</Label>
                      <div className={`px-3 py-2 rounded-lg text-center font-medium ${getScoreColor(observation.scores.languageSkills)}`}>
                        {observation.scores.languageSkills}/5
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Time Management</Label>
                      <div className={`px-3 py-2 rounded-lg text-center font-medium ${getScoreColor(observation.scores.timeManagement)}`}>
                        {observation.scores.timeManagement}/5
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Feedback Sections */}
                <div className="space-y-4">
                  {observation.strengths && (
                    <div>
                      <h5 className="font-medium text-green-700 mb-2">Strengths</h5>
                      <p className="text-sm bg-green-50 p-3 rounded-lg">{observation.strengths}</p>
                    </div>
                  )}
                  
                  {observation.areasForImprovement && (
                    <div>
                      <h5 className="font-medium text-orange-700 mb-2">Areas for Improvement</h5>
                      <p className="text-sm bg-orange-50 p-3 rounded-lg">{observation.areasForImprovement}</p>
                    </div>
                  )}
                  
                  {observation.actionItems && (
                    <div>
                      <h5 className="font-medium text-blue-700 mb-2">Action Items</h5>
                      <p className="text-sm bg-blue-50 p-3 rounded-lg">{observation.actionItems}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {!observation.teacherAcknowledged && (
                    <Button 
                      onClick={() => handleAcknowledge(observation.id)}
                      disabled={acknowledgeMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {acknowledgeMutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
                    </Button>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedObservation(observation)}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Respond
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Respond to Observation</DialogTitle>
                        <DialogDescription>
                          Submit your response to this observation report.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="responseType">Response Type</Label>
                          <Select value={responseType} onValueChange={(value: any) => setResponseType(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="acknowledgment">Acknowledgment</SelectItem>
                              <SelectItem value="improvement_plan">Improvement Plan</SelectItem>
                              <SelectItem value="progress_update">Progress Update</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="responseContent">Your Response</Label>
                          <Textarea
                            id="responseContent"
                            value={responseContent}
                            onChange={(e) => setResponseContent(e.target.value)}
                            placeholder="Enter your response..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleSubmitResponse}
                          disabled={respondMutation.isPending || !responseContent.trim()}
                          className="flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {respondMutation.isPending ? 'Submitting...' : 'Submit Response'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {observation.followUpRequired && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedObservation(observation)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Improvement Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Submit Improvement Plan</DialogTitle>
                          <DialogDescription>
                            Create a detailed plan for addressing the areas of improvement.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="improvementPlan">Improvement Plan</Label>
                            <Textarea
                              id="improvementPlan"
                              value={improvementPlan}
                              onChange={(e) => setImprovementPlan(e.target.value)}
                              placeholder="Describe your plan for improvement..."
                              rows={6}
                            />
                          </div>
                          <div>
                            <Label htmlFor="improvementDeadline">Target Completion Date</Label>
                            <Input
                              id="improvementDeadline"
                              type="date"
                              value={improvementDeadline}
                              onChange={(e) => setImprovementDeadline(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleSubmitImprovementPlan}
                            disabled={improvementPlanMutation.isPending || !improvementPlan.trim()}
                            className="flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            {improvementPlanMutation.isPending ? 'Submitting...' : 'Submit Plan'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Show acknowledgment status */}
                {observation.teacherAcknowledged && observation.teacherAcknowledgedAt && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ Acknowledged on {format(new Date(observation.teacherAcknowledgedAt), 'PPp')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}