import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Clock, BookOpen, Filter } from "lucide-react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";

export default function StudentVideoCourses() {
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");

  // Fetch available video courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/student/video-courses", languageFilter, levelFilter, skillFilter],
    queryFn: async ({ queryKey }) => {
      const [url, language, level, skill] = queryKey;
      const params = new URLSearchParams();
      if (language !== "all") params.append("language", language);
      if (level !== "all") params.append("level", level);
      if (skill !== "all") params.append("skillFocus", skill);
      params.append("isPublished", "true");
      
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    }
  });

  // Fetch user's enrolled courses
  const { data: enrollments } = useQuery({
    queryKey: ["/api/student/enrollments"],
  });

  const isEnrolled = (courseId: number) => {
    return enrollments?.some((e: any) => e.courseId === courseId && e.status === "active");
  };

  const getProgressForCourse = (courseId: number) => {
    // In a real app, this would come from the API
    return Math.floor(Math.random() * 100);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Video Courses</h1>
          <p className="text-gray-600">Browse and watch language learning video courses</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="persian">Persian</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="arabic">Arabic</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="A1">A1 - Beginner</SelectItem>
              <SelectItem value="A2">A2 - Elementary</SelectItem>
              <SelectItem value="B1">B1 - Intermediate</SelectItem>
              <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
              <SelectItem value="C1">C1 - Advanced</SelectItem>
              <SelectItem value="C2">C2 - Proficient</SelectItem>
            </SelectContent>
          </Select>

          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Skill Focus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              <SelectItem value="speaking">Speaking</SelectItem>
              <SelectItem value="listening">Listening</SelectItem>
              <SelectItem value="grammar">Grammar</SelectItem>
              <SelectItem value="vocabulary">Vocabulary</SelectItem>
              <SelectItem value="pronunciation">Pronunciation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course: any) => {
            const enrolled = isEnrolled(course.id);
            const progress = enrolled ? getProgressForCourse(course.id) : 0;

            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="aspect-video bg-gray-200 rounded mb-4 relative overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                        <BookOpen className="h-12 w-12 text-white" />
                      </div>
                    )}
                    {enrolled && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500">Enrolled</Badge>
                      </div>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{course.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.videoCount || 0} videos</span>
                    </div>
                    <Badge variant="secondary">{course.level}</Badge>
                    <Badge variant="outline">{course.language}</Badge>
                  </div>
                  
                  {enrolled && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {enrolled ? (
                    <Link href={`/video-courses/${course.id}`} className="w-full">
                      <Button className="w-full">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Enroll to Access
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {!courses || courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No video courses found matching your filters.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}