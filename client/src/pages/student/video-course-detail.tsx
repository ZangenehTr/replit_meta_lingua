import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PlayCircle, Clock, CheckCircle, Lock, 
  BookOpen, FileText, Download, ChevronRight 
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";

export default function VideoCoursDetail() {
  const { courseId } = useParams();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["/api/courses/" + courseId],
  });

  // Fetch video lessons for this course
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: [`/api/student/courses/${courseId}/video-lessons`],
  });

  // Group lessons by module
  const lessonsByModule = lessons?.reduce((acc: any, lesson: any) => {
    const moduleId = lesson.moduleId || 0;
    if (!acc[moduleId]) {
      acc[moduleId] = [];
    }
    acc[moduleId].push(lesson);
    return acc;
  }, {}) || {};

  const modules = Object.keys(lessonsByModule).map(moduleId => ({
    id: parseInt(moduleId),
    name: moduleId === "0" ? "General Lessons" : `Module ${moduleId}`,
    lessons: lessonsByModule[moduleId]
  }));

  // Calculate overall progress
  const totalLessons = lessons?.length || 0;
  const completedLessons = lessons?.filter((l: any) => l.progress?.completed).length || 0;
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (courseLoading || lessonsLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        {/* Course Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{course?.name}</h1>
          <p className="text-gray-600 mb-4">{course?.description}</p>
          
          <div className="flex items-center gap-4 mb-6">
            <Badge>{course?.level}</Badge>
            <Badge variant="outline">{course?.language}</Badge>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{totalLessons} lessons</span>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="max-w-xl">
            <div className="flex justify-between text-sm mb-2">
              <span>Course Progress</span>
              <span>{completedLessons} of {totalLessons} completed</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </div>

        {/* Course Content */}
        <Tabs defaultValue="lessons" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Module Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Modules</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-1 p-4">
                        {modules.map((module) => {
                          const moduleCompleted = module.lessons.filter((l: any) => l.progress?.completed).length;
                          const moduleTotal = module.lessons.length;
                          
                          return (
                            <Button
                              key={module.id}
                              variant={selectedModule === module.id ? "secondary" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => setSelectedModule(module.id)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm">{module.name}</span>
                                <span className="text-xs text-gray-500">
                                  {moduleCompleted}/{moduleTotal}
                                </span>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Lesson List */}
              <div className="lg:col-span-3 space-y-4">
                {modules
                  .filter(m => selectedModule === null || m.id === selectedModule)
                  .map((module) => (
                    <div key={module.id}>
                      <h3 className="text-xl font-semibold mb-4">{module.name}</h3>
                      <div className="space-y-3">
                        {module.lessons.map((lesson: any) => {
                          const isCompleted = lesson.progress?.completed;
                          const watchProgress = lesson.progress?.watchTime 
                            ? (lesson.progress.watchTime / lesson.duration) * 100 
                            : 0;

                          return (
                            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  {/* Thumbnail */}
                                  <div className="relative w-32 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                    {lesson.thumbnailUrl ? (
                                      <img 
                                        src={lesson.thumbnailUrl} 
                                        alt={lesson.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                        <PlayCircle className="h-8 w-8 text-white" />
                                      </div>
                                    )}
                                    {isCompleted && (
                                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Lesson Info */}
                                  <div className="flex-1">
                                    <h4 className="font-semibold mb-1">{lesson.title}</h4>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                      {lesson.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{formatDuration(lesson.duration)}</span>
                                      </div>
                                      {lesson.skillFocus && (
                                        <Badge variant="outline" className="text-xs">
                                          {lesson.skillFocus}
                                        </Badge>
                                      )}
                                    </div>

                                    {watchProgress > 0 && !isCompleted && (
                                      <div className="mt-2">
                                        <Progress value={watchProgress} className="h-1" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Button */}
                                  <Link href={`/video-player/${lesson.id}`}>
                                    <Button size="sm">
                                      {isCompleted ? (
                                        <>Watch Again</>
                                      ) : watchProgress > 0 ? (
                                        <>Continue</>
                                      ) : (
                                        <>Start</>
                                      )}
                                      <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Materials</CardTitle>
                <CardDescription>
                  Download supplementary materials for this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lessons?.filter((l: any) => l.materialsUrl).map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{lesson.title} - Materials</p>
                          <p className="text-sm text-gray-500">PDF Document</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                  
                  {!lessons?.some((l: any) => l.materialsUrl) && (
                    <p className="text-center text-gray-500 py-8">
                      No materials available for this course yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Discussion</CardTitle>
                <CardDescription>
                  Join the conversation with other students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">
                  Discussion forum coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}