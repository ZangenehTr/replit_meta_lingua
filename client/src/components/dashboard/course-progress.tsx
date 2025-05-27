import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  progress: number;
  language: string;
  level: string;
}

export function CourseProgress() {
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses/my"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Continue Learning</CardTitle>
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
        <div className="flex items-center justify-between">
          <CardTitle>Continue Learning</CardTitle>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!courses || courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No courses enrolled yet</p>
            <Button className="mt-4">Browse Courses</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">{course.title}</h3>
                    <div className="flex items-center space-x-4 mb-3">
                      <Progress value={course.progress} className="flex-1" />
                      <span className="text-sm text-muted-foreground">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {course.language.toUpperCase()}
                        </span>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          {course.level}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Continue <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
