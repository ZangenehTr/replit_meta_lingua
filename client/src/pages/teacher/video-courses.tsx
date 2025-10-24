import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Video,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Clock,
  Globe,
  BookOpen,
  FileText,
  Users,
  PlayCircle,
} from "lucide-react";
import { formatDuration } from "date-fns";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";

interface VideoLesson {
  id: number;
  courseId: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  moduleId?: number;
  orderIndex: number;
  language: string;
  level: string;
  skillFocus?: string;
  transcriptUrl?: string;
  subtitlesUrl?: string;
  materialsUrl?: string;
  isFree: boolean;
  isPublished: boolean;
  viewCount?: number;
  completionRate?: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  language: string;
  level: string;
}

export default function TeacherVideoCourses() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const { t } = useTranslation(['teacher', 'common']);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<VideoLesson | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: 0,
    moduleId: 0,
    orderIndex: 1,
    language: "fa",
    level: "A1",
    skillFocus: "",
    transcriptUrl: "",
    subtitlesUrl: "",
    materialsUrl: "",
    isFree: false,
    isPublished: true,
  });

  // Fetch teacher's courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: [`/api/teacher/${user?.id}/courses`],
    enabled: !!user?.id,
  });

  // Fetch video lessons for selected course
  const { data: videoLessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: selectedCourse ? [`/api/courses/${selectedCourse}/video-lessons`] : null,
    enabled: !!selectedCourse,
  });

  // Create video lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/courses/${selectedCourse}/video-lessons`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video lesson created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourse}/video-lessons`] });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create video lesson",
        variant: "destructive",
      });
    },
  });

  // Update video lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/video-lessons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video lesson updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourse}/video-lessons`] });
      setEditingLesson(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update video lesson",
        variant: "destructive",
      });
    },
  });

  // Delete video lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/video-lessons/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video lesson deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourse}/video-lessons`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete video lesson",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      videoUrl: "",
      duration: 0,
      moduleId: 0,
      orderIndex: 1,
      language: "fa",
      level: "A1",
      skillFocus: "",
      transcriptUrl: "",
      subtitlesUrl: "",
      materialsUrl: "",
      isFree: false,
      isPublished: true,
    });
  };

  const handleCreateOrUpdate = () => {
    if (editingLesson) {
      updateLessonMutation.mutate({
        id: editingLesson.id,
        data: formData,
      });
    } else {
      createLessonMutation.mutate({
        ...formData,
        courseId: selectedCourse,
      });
    }
  };

  const handleEdit = (lesson: VideoLesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      videoUrl: lesson.videoUrl,
      duration: lesson.duration,
      moduleId: lesson.moduleId || 0,
      orderIndex: lesson.orderIndex,
      language: lesson.language,
      level: lesson.level,
      skillFocus: lesson.skillFocus || "",
      transcriptUrl: lesson.transcriptUrl || "",
      subtitlesUrl: lesson.subtitlesUrl || "",
      materialsUrl: lesson.materialsUrl || "",
      isFree: lesson.isFree,
      isPublished: lesson.isPublished,
    });
    setCreateDialogOpen(true);
  };

  const formatVideoTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-bold mb-6">Video Course Management</h1>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          {courses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No courses found. Create a course first.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Select a Course</h2>
                {courses.map((course: Course) => (
                  <Card
                    key={course.id}
                    className={`cursor-pointer transition-colors ${
                      selectedCourse === course.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedCourse(course.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>
                        {course.language === 'fa' ? 'Persian' : 'English'} • {course.level}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <div className="md:col-span-2">
                {selectedCourse ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Video Lessons</h2>
                      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => {
                            setEditingLesson(null);
                            resetForm();
                          }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Video Lesson
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {editingLesson ? 'Edit Video Lesson' : 'Create Video Lesson'}
                            </DialogTitle>
                            <DialogDescription>
                              Add video content to your course
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="title">Title</Label>
                              <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Lesson title"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What will students learn?"
                                rows={3}
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="videoUrl">Video URL</Label>
                              <Input
                                id="videoUrl"
                                value={formData.videoUrl}
                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                placeholder="https://example.com/video.mp4"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="duration">Duration (seconds)</Label>
                                <Input
                                  id="duration"
                                  type="number"
                                  value={formData.duration}
                                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                  placeholder="600"
                                />
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="orderIndex">Order</Label>
                                <Input
                                  id="orderIndex"
                                  type="number"
                                  value={formData.orderIndex}
                                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 1 })}
                                  min="1"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>Language</Label>
                                <Select
                                  value={formData.language}
                                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fa">Persian</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="ar">Arabic</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid gap-2">
                                <Label>Level</Label>
                                <Select
                                  value={formData.level}
                                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="A1">A1 - Beginner</SelectItem>
                                    <SelectItem value="A2">A2 - Elementary</SelectItem>
                                    <SelectItem value="B1">B1 - Intermediate</SelectItem>
                                    <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                                    <SelectItem value="C1">C1 - Advanced</SelectItem>
                                    <SelectItem value="C2">C2 - Proficient</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label>Skill Focus (Optional)</Label>
                              <Select
                                value={formData.skillFocus}
                                onValueChange={(value) => setFormData({ ...formData, skillFocus: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select skill focus" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  <SelectItem value="speaking">Speaking</SelectItem>
                                  <SelectItem value="listening">Listening</SelectItem>
                                  <SelectItem value="reading">Reading</SelectItem>
                                  <SelectItem value="writing">Writing</SelectItem>
                                  <SelectItem value="grammar">Grammar</SelectItem>
                                  <SelectItem value="vocabulary">Vocabulary</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="isFree"
                                  checked={formData.isFree}
                                  onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked as boolean })}
                                />
                                <Label htmlFor="isFree">Free preview lesson</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="isPublished"
                                  checked={formData.isPublished}
                                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked as boolean })}
                                />
                                <Label htmlFor="isPublished">Publish immediately</Label>
                              </div>
                            </div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCreateOrUpdate}
                              disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                            >
                              {editingLesson ? 'Update' : 'Create'} Lesson
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {lessonsLoading ? (
                      <div className="text-center py-8">
                        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                    ) : videoLessons.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No video lessons yet. Add your first video!</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {videoLessons.map((lesson: VideoLesson) => (
                          <Card key={lesson.id}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold">{lesson.title}</h3>
                                    {lesson.isFree && (
                                      <Badge variant="secondary">Free</Badge>
                                    )}
                                    {!lesson.isPublished && (
                                      <Badge variant="outline">Draft</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {lesson.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {formatVideoTime(lesson.duration)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-4 w-4" />
                                      {lesson.language === 'fa' ? 'Persian' : lesson.language === 'ar' ? 'Arabic' : 'English'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="h-4 w-4" />
                                      {lesson.level}
                                    </span>
                                    {lesson.skillFocus && (
                                      <Badge variant="outline" className="text-xs">
                                        {lesson.skillFocus}
                                      </Badge>
                                    )}
                                  </div>
                                  {lesson.viewCount !== undefined && (
                                    <div className="mt-2 text-sm text-muted-foreground">
                                      <Users className="h-4 w-4 inline mr-1" />
                                      {lesson.viewCount} views
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => window.open(lesson.videoUrl, '_blank')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(lesson)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this video lesson?')) {
                                        deleteLessonMutation.mutate(lesson.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a course to manage video lessons</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Video Analytics</CardTitle>
              <CardDescription>Track engagement and performance of your video lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}