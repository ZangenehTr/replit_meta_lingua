import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Clock,
  BookOpen,
  Target,
  Bell,
  Send,
  Archive,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  GraduationCap,
  Languages,
  Mic,
  PenTool,
  MessageSquare
} from "lucide-react";

interface Prospect {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  interestedIn: string[];
  skillLevel: string;
  notes: string;
  status: 'waiting' | 'contacted' | 'scheduled' | 'not_interested';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  lastContactDate?: string;
  preferredSchedule?: string;
  budget?: string;
  source: string;
  followUpDate?: string;
  notificationsSent: {
    sms: boolean;
    push: boolean;
    email: boolean;
  };
}

interface CourseTemplate {
  id: number;
  name: string;
  type: string;
  description: string;
  skillsFocus: string[];
  level: string;
  duration: string;
  price: number;
}

export default function ProspectsPage() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [interestedInFilter, setInterestedInFilter] = useState('all');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProspectData, setNewProspectData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    interestedIn: [],
    skillLevel: '',
    notes: '',
    priority: 'medium',
    source: '',
    budget: '',
    preferredSchedule: ''
  });

  // Fetch prospects
  const { data: prospects = [], isLoading } = useQuery<Prospect[]>({
    queryKey: ["/api/callcenter/prospects"],
  });

  // Fetch available course templates
  const { data: courseTemplates = [] } = useQuery<CourseTemplate[]>({
    queryKey: ["/api/courses/templates"],
  });

  // Create prospect mutation
  const createProspectMutation = useMutation({
    mutationFn: async (prospectData: any) => {
      return apiRequest("/api/callcenter/prospects", {
        method: "POST",
        body: prospectData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Prospect Added",
        description: "New prospect has been added to the waiting list.",
      });
      setIsCreateDialogOpen(false);
      setNewProspectData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        interestedIn: [],
        skillLevel: '',
        notes: '',
        priority: 'medium',
        source: '',
        budget: '',
        preferredSchedule: ''
      });
      queryClient.invalidateQueries({ queryKey: ["/api/callcenter/prospects"] });
    },
  });

  // Send notifications mutation
  const sendNotificationsMutation = useMutation({
    mutationFn: async ({ prospectIds, notificationType }: { prospectIds: number[], notificationType: string }) => {
      return apiRequest("/api/callcenter/prospects/notify", {
        method: "POST",
        body: { prospectIds, notificationType },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Notifications Sent",
        description: `Successfully sent ${data.sent} notifications.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/callcenter/prospects"] });
    },
  });

  // Auto-match prospects to new courses
  const autoMatchProspectsMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return apiRequest("/api/callcenter/prospects/auto-match", {
        method: "POST",
        body: { courseId },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Auto-Match Complete",
        description: `Found ${data.matchedCount} prospects for this course.`,
      });
    },
  });

  // Interest areas for prospects
  const interestAreas = [
    { value: 'free_discussion', label: 'Free Discussion Classes', icon: MessageSquare },
    { value: 'verbal_writing', label: 'Verbal-Writing Skills', icon: PenTool },
    { value: 'advanced_conversation', label: 'Advanced Conversation', icon: Mic },
    { value: 'business_english', label: 'Business English', icon: GraduationCap },
    { value: 'ielts_preparation', label: 'IELTS Preparation', icon: Target },
    { value: 'grammar_focus', label: 'Grammar Focus', icon: BookOpen },
    { value: 'pronunciation', label: 'Pronunciation', icon: Mic },
    { value: 'listening_skills', label: 'Listening Skills', icon: Languages }
  ];

  // Filter prospects
  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = `${prospect.firstName} ${prospect.lastName} ${prospect.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prospect.status === statusFilter;
    const matchesInterest = interestedInFilter === 'all' || prospect.interestedIn.includes(interestedInFilter);
    return matchesSearch && matchesStatus && matchesInterest;
  });

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'scheduled': return 'bg-green-500';
      case 'not_interested': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Send automated notifications
  const sendAutomatedNotifications = (prospectIds: number[], delay: number, type: string) => {
    setTimeout(() => {
      sendNotificationsMutation.mutate({ prospectIds, notificationType: type });
    }, delay);
  };

  // Handle prospect interest matching
  const handleInterestMatch = (courseTemplate: CourseTemplate) => {
    const matchingProspects = prospects.filter(prospect => 
      prospect.interestedIn.some(interest => 
        courseTemplate.skillsFocus.includes(interest) || 
        courseTemplate.type.toLowerCase().includes(interest.toLowerCase())
      )
    );

    if (matchingProspects.length > 0) {
      // Send SMS immediately
      sendAutomatedNotifications(matchingProspects.map(p => p.id), 0, 'sms');
      
      // Send push notification after 24 hours
      sendAutomatedNotifications(matchingProspects.map(p => p.id), 24 * 60 * 60 * 1000, 'push');
      
      // Send call reminder after 48 hours
      sendAutomatedNotifications(matchingProspects.map(p => p.id), 48 * 60 * 60 * 1000, 'call_reminder');
      
      toast({
        title: "Auto-Match Triggered",
        description: `${matchingProspects.length} prospects will be notified about the new course.`,
      });
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Prospects Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Archive and manage students waiting for specific courses
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Prospect
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Prospect</DialogTitle>
                    <DialogDescription>
                      Archive a student who is waiting for a specific course type
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newProspectData.firstName}
                        onChange={(e) => setNewProspectData({ ...newProspectData, firstName: e.target.value })}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newProspectData.lastName}
                        onChange={(e) => setNewProspectData({ ...newProspectData, lastName: e.target.value })}
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newProspectData.email}
                        onChange={(e) => setNewProspectData({ ...newProspectData, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newProspectData.phone}
                        onChange={(e) => setNewProspectData({ ...newProspectData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Interested In</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {interestAreas.map((area) => (
                          <label key={area.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newProspectData.interestedIn.includes(area.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewProspectData({
                                    ...newProspectData,
                                    interestedIn: [...newProspectData.interestedIn, area.value]
                                  });
                                } else {
                                  setNewProspectData({
                                    ...newProspectData,
                                    interestedIn: newProspectData.interestedIn.filter(i => i !== area.value)
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{area.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="skillLevel">Current Level</Label>
                      <Select value={newProspectData.skillLevel} onValueChange={(value) => setNewProspectData({ ...newProspectData, skillLevel: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                          <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                          <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="budget">Budget Range</Label>
                      <Input
                        id="budget"
                        value={newProspectData.budget}
                        onChange={(e) => setNewProspectData({ ...newProspectData, budget: e.target.value })}
                        placeholder="e.g., 2-3 million IRR"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newProspectData.notes}
                        onChange={(e) => setNewProspectData({ ...newProspectData, notes: e.target.value })}
                        placeholder="What specific courses or skills are they looking for?"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createProspectMutation.mutate(newProspectData)}
                      disabled={createProspectMutation.isPending}
                    >
                      {createProspectMutation.isPending ? 'Adding...' : 'Add Prospect'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="prospects" className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prospects">Prospects ({prospects.length})</TabsTrigger>
              <TabsTrigger value="matching">Auto-Match</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="prospects" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Search prospects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={interestedInFilter} onValueChange={setInterestedInFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by interest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Interests</SelectItem>
                    {interestAreas.map(area => (
                      <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prospects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProspects.map((prospect) => (
                  <Card key={prospect.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{prospect.firstName} {prospect.lastName}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {prospect.email}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusBadgeColor(prospect.status)}>
                          {prospect.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4" />
                          <span>{prospect.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="w-4 h-4" />
                          <span>{prospect.skillLevel}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Interested In:</div>
                          <div className="flex flex-wrap gap-1">
                            {prospect.interestedIn.map((interest) => (
                              <Badge key={interest} variant="secondary" className="text-xs">
                                {interestAreas.find(area => area.value === interest)?.label || interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {prospect.notes && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {prospect.notes}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1">
                            <Phone className="w-4 h-4 mr-1" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredProspects.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No prospects found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add prospects who are waiting for specific course types.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="matching" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Match Prospects to New Courses</CardTitle>
                  <CardDescription>
                    When a new course is created, automatically notify matching prospects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseTemplates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                          <div className="flex gap-2 mt-2">
                            {template.skillsFocus.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleInterestMatch(template)}
                          variant="outline"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Match Prospects
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Automated Notification System</CardTitle>
                  <CardDescription>
                    SMS, Push, and Call reminders for prospects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="w-5 h-5 text-blue-500" />
                          <span className="font-semibold">SMS Notifications</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Immediate SMS when matching course is created
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="w-5 h-5 text-yellow-500" />
                          <span className="font-semibold">Push Notifications</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          24 hours later if no response
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-5 h-5 text-green-500" />
                          <span className="font-semibold">Call Reminders</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          48 hours later for high-priority prospects
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}