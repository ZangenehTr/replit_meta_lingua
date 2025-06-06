import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MapPin, Calendar, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AvailableCourse {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  deliveryMode: string;
  classFormat: string;
  targetLanguage: string;
  targetLevel: string[];
  maxStudents: number;
  currentStudents: number;
  price: number;
  weekdays: string[];
  startTime: string;
  endTime: string;
  instructorName: string;
  duration: string;
  isActive: boolean;
}

export function AvailableCourses() {
  const { toast } = useToast();
  
  const { data: availableCourses, isLoading } = useQuery<AvailableCourse[]>({
    queryKey: ["/api/courses/available"],
  });

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Group Courses</CardTitle>
          <CardDescription>Loading available courses...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availableCourses || availableCourses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Group Courses</CardTitle>
          <CardDescription>Courses matching your learning goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No courses match your current profile. Please complete your profile to see relevant recommendations.
            </p>
            <Button variant="outline">
              Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Group Courses</CardTitle>
        <CardDescription>Courses matching your learning goals and proficiency level</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {availableCourses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <Badge variant={course.deliveryMode === 'online' ? 'default' : 'secondary'}>
                      {course.deliveryMode === 'online' ? (
                        <><Globe className="w-3 h-3 mr-1" /> Online</>
                      ) : (
                        <><MapPin className="w-3 h-3 mr-1" /> In-Person</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{course.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{course.currentStudents}/{course.maxStudents} students</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{course.startTime} - {course.endTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{course.weekdays.map(formatDayName).join(', ')}</span>
                    </div>
                    
                    <div className="font-medium">
                      Duration: {course.duration}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Instructor: {course.instructorName}</p>
                      <p className="font-semibold text-lg">{formatPrice(course.price)}</p>
                    </div>
                    
                    <Button 
                      onClick={() => handleEnroll(course.id)}
                      disabled={course.currentStudents >= course.maxStudents}
                      className="px-6"
                    >
                      {course.currentStudents >= course.maxStudents ? 'Full' : 'Enroll Now'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}