import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Clock, DollarSign } from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  progress?: number;
  language: string;
  level: string;
  price?: number;
  duration?: string;
  instructorId?: number;
  isActive?: boolean;
  enrolledAt?: string;
  nextLesson?: string;
  completedLessons?: number;
  totalLessons?: number;
}

export function CourseProgress() {
  const queryClient = useQueryClient();
  
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses/my"],
  });

  const { data: availableCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) throw new Error("Failed to enroll");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/my"] });
    }
  });

  const progressMutation = useMutation({
    mutationFn: async ({ courseId, lessonId }: { courseId: number; lessonId: number }) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/courses/${courseId}/progress`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ lessonId, completed: true })
      });
      if (!response.ok) throw new Error("Failed to update progress");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/my"] });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Course Progress & Enrollment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enrolled Courses */}
        {courses && courses.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">MY COURSES</h3>
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-4">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{course.title}</h4>
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{course.language}</Badge>
                      <Badge variant="secondary">{course.level}</Badge>
                      {course.progress !== undefined && (
                        <Badge>{course.progress}% Complete</Badge>
                      )}
                    </div>
                    {course.nextLesson && (
                      <p className="text-xs text-blue-600 mt-2">
                        Next: {course.nextLesson}
                      </p>
                    )}
                  </div>
                </div>
                {course.progress !== undefined && (
                  <Progress value={course.progress} className="h-2" />
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => progressMutation.mutate({ 
                      courseId: course.id, 
                      lessonId: (course.completedLessons || 0) + 1 
                    })}
                    disabled={progressMutation.isPending}
                  >
                    {progressMutation.isPending ? "Updating..." : "Continue Learning"}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available Courses */}
        {availableCourses && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">AVAILABLE COURSES</h3>
            {availableCourses
              .filter(course => !courses?.some(enrolled => enrolled.id === course.id))
              .map((course) => (
              <div key={course.id} className="border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full sm:w-16 h-32 sm:h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 w-full">
                    <h4 className="font-medium">{course.title}</h4>
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline">{course.language}</Badge>
                      <Badge variant="secondary">{course.level}</Badge>
                      {course.duration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {course.duration}
                        </div>
                      )}
                      {course.price && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          {course.price.toLocaleString()} تومان
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => enrollMutation.mutate(course.id)}
                    disabled={enrollMutation.isPending}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!courses?.length && !availableCourses?.length && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No courses available at the moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
