import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import CoursesMobile from "./courses-mobile";

import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock, Users, MapPin, Calendar, Globe, Search, Filter, BookOpen, Video, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  deliveryMode: string;
  classFormat: string;
  targetLanguage: string;
  targetLevel: string[];
  maxStudents?: number;
  currentStudents?: number;
  price: number;
  weekdays?: string[];
  startTime?: string;
  endTime?: string;
  instructorName: string;
  duration: string;
  isActive: boolean;
}

export default function Courses() {
  // Always show mobile UI for the course catalog
  return <CoursesMobile />;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("online");
  const { toast } = useToast();

  const { data: allCourses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Use real courses from API, fallback to empty array if not available
  const courses = allCourses || [];

  const handleEnroll = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Enrollment Successful",
          description: "You have successfully enrolled in the course!",
        });
      } else {
        throw new Error('Enrollment failed');
      }
    } catch (error) {
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll in the course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDayName = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'monday': 'دوشنبه',
      'tuesday': 'سه‌شنبه', 
      'wednesday': 'چهارشنبه',
      'thursday': 'پنج‌شنبه',
      'friday': 'جمعه',
      'saturday': 'شنبه',
      'sunday': 'یکشنبه'
    };
    return dayMap[day] || day;
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === "all" || course.targetLanguage === languageFilter;
    const matchesLevel = levelFilter === "all" || course.targetLevel.includes(levelFilter);
    
    return matchesSearch && matchesLanguage && matchesLevel;
  });

  const getCoursesForTab = (deliveryMode: string) => {
    return filteredCourses.filter(course => course.deliveryMode === deliveryMode);
  };

  const renderCourseCard = (course: Course) => (
    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-cover bg-center" style={{ backgroundImage: `url(${course.thumbnail})` }}>
        <div className="w-full h-full bg-black bg-opacity-40 flex items-end p-4">
          <div className="flex gap-2">
            <Badge variant={course.deliveryMode === 'online' ? 'default' : course.deliveryMode === 'in_person' ? 'secondary' : 'outline'}>
              {course.deliveryMode === 'online' && <Globe className="w-3 h-3 mr-1" />}
              {course.deliveryMode === 'in_person' && <MapPin className="w-3 h-3 mr-1" />}
              {course.deliveryMode === 'self_paced' && <BookOpen className="w-3 h-3 mr-1" />}
              {course.deliveryMode === 'online' ? 'Online' : 
               course.deliveryMode === 'in_person' ? 'In-Person' : 'Self-Paced'}
            </Badge>
            <Badge variant="outline" className="text-white border-white">
              {course.classFormat === 'group' && <Users className="w-3 h-3 mr-1" />}
              {course.classFormat === 'one_on_one' && <UserCheck className="w-3 h-3 mr-1" />}
              {course.classFormat === 'self_paced' && <Video className="w-3 h-3 mr-1" />}
              {course.classFormat === 'group' ? 'Group' :
               course.classFormat === 'one_on_one' ? 'One-on-One' : 'Self-Study'}
            </Badge>
          </div>
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Duration: {course.duration}</span>
          </div>
          
          {course.maxStudents && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{course.currentStudents}/{course.maxStudents} students</span>
            </div>
          )}
          
          {course.weekdays && course.startTime && (
            <>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{course.weekdays.map(formatDayName).join(', ')}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{course.startTime} - {course.endTime}</span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Instructor: {course.instructorName}</p>
            <p className="font-semibold text-lg">{formatPrice(course.price)}</p>
          </div>
          
          <Button 
            onClick={() => handleEnroll(course.id)}
            disabled={course.maxStudents && course.currentStudents && course.currentStudents >= course.maxStudents}
          >
            {course.maxStudents && course.currentStudents && course.currentStudents >= course.maxStudents ? 'Full' : 'Enroll Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Course Catalog</h1>
                <p className="text-muted-foreground">Choose from our diverse range of language learning options</p>
              </div>
              
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="persian">Persian</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="online" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Online Courses
                </TabsTrigger>
                <TabsTrigger value="in_person" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  In-Person Courses
                </TabsTrigger>
                <TabsTrigger value="self_paced" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Self-Paced Courses
                </TabsTrigger>
              </TabsList>

              <TabsContent value="online" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Online Language Courses</h2>
                  <p className="text-muted-foreground mb-6">
                    Join live online classes from anywhere. Interact with instructors and classmates in real-time.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getCoursesForTab("online").map(renderCourseCard)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="in_person" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">In-Person Language Courses</h2>
                  <p className="text-muted-foreground mb-6">
                    Experience immersive learning in our modern classrooms with face-to-face interaction.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getCoursesForTab("in_person").map(renderCourseCard)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="self_paced" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Self-Paced Language Courses</h2>
                  <p className="text-muted-foreground mb-6">
                    Learn at your own pace with interactive lessons, quizzes, and AI-powered feedback.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getCoursesForTab("self_paced").map(renderCourseCard)}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading courses...</p>
              </div>
            )}

            {!isLoading && filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}