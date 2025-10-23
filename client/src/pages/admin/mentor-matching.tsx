import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  Users, 
  Star, 
  Clock,
  Languages,
  Target,
  BookOpen,
  Award,
  MessageSquare,
  Link2,
  CheckCircle,
  AlertCircle,
  UserPlus
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";

interface TeacherStudentBundle {
  id: string;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    level: string;
    language: string;
    learningGoals?: string[];
  };
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    specialization: string;
  };
  classType: string;
  schedule: {
    days: string[];
    time: string;
  };
  startDate: string;
  hasMentor: boolean;
  currentMentorId?: number;
}

interface Mentor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  specializations: string[];
  languages: string[];
  rating: number;
  activeStudents: number;
  maxStudents: number;
  availability: string;
  bio?: string;
}

interface MentorAssignment {
  id?: number;
  mentorId: number;
  studentId: number;
  status: 'active' | 'pending' | 'completed';
  goals?: string;
  notes?: string;
}

export default function MentorMatchingPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [selectedBundle, setSelectedBundle] = useState<TeacherStudentBundle | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [matchFormData, setMatchFormData] = useState({
    goals: "",
    notes: ""
  });

  // Fetch teacher-student bundles without mentors
  const { data: bundles = [], isLoading: bundlesLoading } = useQuery({
    queryKey: ['/api/admin/teacher-student-bundles'],
  });

  // Fetch available mentors
  const { data: mentors = [], isLoading: mentorsLoading } = useQuery({
    queryKey: ['/api/admin/mentors/available'],
  });

  // Fetch existing assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['/api/admin/mentor-assignments'],
  });

  // Create mentor assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: MentorAssignment) => {
      return await apiRequest('/api/admin/mentor-assignments', {
        method: 'POST',
        body: JSON.stringify(assignment)
      });
    },
    onSuccess: () => {
      toast({
        title: t('common:success'),
        description: t('admin:mentorMatching.successfullyMatched')
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-student-bundles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mentors/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mentor-assignments'] });
      setMatchDialogOpen(false);
      setMatchFormData({ goals: "", notes: "" });
      setSelectedBundle(null);
      setSelectedMentor(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || t('admin:mentorMatching.failedToCreate'),
        variant: "destructive",
      });
    },
  });

  // Filter bundles based on search and filters
  const filteredBundles = Array.isArray(bundles) ? bundles.filter((bundle: TeacherStudentBundle) => {
    const matchesSearch = searchTerm === "" || 
                         bundle.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bundle.student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bundle.teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bundle.teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === "all" || bundle.student.level.toLowerCase() === filterLevel.toLowerCase();
    const matchesLanguage = filterLanguage === "all" || bundle.student.language === filterLanguage;
    
    return matchesSearch && matchesLevel && matchesLanguage;
  }) : [];

  const handleCreateAssignment = () => {
    if (!selectedBundle || !selectedMentor) {
      toast({
        title: t('common:toast.error'),
        description: "Please select both a bundle and a mentor",
        variant: "destructive",
      });
      return;
    }

    createAssignmentMutation.mutate({
      mentorId: selectedMentor.id,
      studentId: selectedBundle.student.id,
      status: 'active',
      goals: matchFormData.goals,
      notes: matchFormData.notes
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4 sm:p-6 space-y-4 sm:space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header - Mobile First */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            {t('admin:mentorMatching.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            {t('admin:mentorMatching.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:mentorMatching.teacherStudentBundles')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(bundles) ? bundles.length : 0}</div>
            <p className="text-xs text-muted-foreground">{t('admin:mentorMatching.needMentors')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:mentorMatching.availableMentors')}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(mentors) ? mentors.length : 0}</div>
            <p className="text-xs text-muted-foreground">{t('admin:mentorMatching.haveCapacity')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:mentorMatching.activeMatches')}</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(assignments) ? assignments.filter((a: any) => a.status === 'active').length : 0}</div>
            <p className="text-xs text-muted-foreground">{t('admin:mentorMatching.ongoingMentorships')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:mentorMatching.successRate')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(assignments) && assignments.length > 0 
                ? `${Math.round((assignments.filter((a: any) => a.status === 'active').length / assignments.length) * 100)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">{t('admin:mentorMatching.matchSuccess')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin:mentorMatching.findTeacherStudentBundles')}</CardTitle>
          <CardDescription>{t('admin:mentorMatching.searchFilterDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('admin:mentorMatching.searchStudents')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin:mentorMatching.allLevels')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin:mentorMatching.allLevels')}</SelectItem>
                <SelectItem value="beginner">{t('admin:mentorMatching.beginner')}</SelectItem>
                <SelectItem value="intermediate">{t('admin:mentorMatching.intermediate')}</SelectItem>
                <SelectItem value="advanced">{t('admin:mentorMatching.advanced')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin:mentorMatching.allLanguages')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin:mentorMatching.allLanguages')}</SelectItem>
                <SelectItem value="Persian">Persian</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Arabic">Arabic</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-teal-200 hover:bg-teal-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('admin:mentorMatching.moreFilters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teacher-Student Bundles List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('admin:mentorMatching.bundlesNeedingMentors')}</h2>
        {bundlesLoading ? (
          <div className="text-center py-8">{t('admin:mentorMatching.loadingBundles')}</div>
        ) : filteredBundles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('admin:mentorMatching.noBundlesFound')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredBundles.map((bundle: TeacherStudentBundle) => (
              <Card 
                key={bundle.id}
                className={`cursor-pointer transition-all ${
                  selectedBundle?.id === bundle.id ? 'ring-2 ring-teal-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedBundle(bundle)}
              >
                <CardContent className="p-4">
                  <div className="mb-3 pb-3 border-b">
                    <p className="text-xs text-gray-500 mb-1">{t('admin:mentorMatching.teacher')}</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {bundle.teacher.firstName[0]}{bundle.teacher.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">
                          {bundle.teacher.firstName} {bundle.teacher.lastName}
                        </h4>
                        <p className="text-xs text-gray-600">{bundle.teacher.specialization}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('admin:mentorMatching.student')}</p>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {bundle.student.firstName[0]}{bundle.student.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {bundle.student.firstName} {bundle.student.lastName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {bundle.student.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {bundle.student.language}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBundle(bundle);
                          setMatchDialogOpen(true);
                        }}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Match</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Mentor Assignment Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Match Mentor with Student Bundle</DialogTitle>
            <DialogDescription>
              Assign a mentor to the selected teacher-student pair
            </DialogDescription>
          </DialogHeader>
          
          {selectedBundle && (
            <div className="py-4 space-y-4">
              <div className="bg-teal-50 p-4 rounded-lg">
                <h4 className="font-semibold">Selected Bundle:</h4>
                <p>Student: {selectedBundle.student.firstName} {selectedBundle.student.lastName}</p>
                <p>Teacher: {selectedBundle.teacher.firstName} {selectedBundle.teacher.lastName}</p>
                <p>Level: {selectedBundle.student.level}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goals">Learning Goals</Label>
                <Textarea
                  id="goals"
                  placeholder="Enter specific goals for this mentorship..."
                  value={matchFormData.goals}
                  onChange={(e) => setMatchFormData({ ...matchFormData, goals: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes or observations..."
                  value={matchFormData.notes}
                  onChange={(e) => setMatchFormData({ ...matchFormData, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment} disabled={createAssignmentMutation.isPending}>
              {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}