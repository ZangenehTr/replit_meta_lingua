import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, GraduationCap } from "lucide-react";
import { TeacherNameLink } from "@/components/ui/teacher-name-link";

interface TeacherPerformanceRecord {
  teacherId: number;
  teacherName?: string;
  averageRating?: number;
  totalSessions?: number;
  lastObservation?: string;
}

interface TeacherPerformanceGridProps {
  teacherPerformance: TeacherPerformanceRecord[];
  onScheduleObservation: (teacherId: number) => void;
}

export function TeacherPerformanceGrid({ teacherPerformance, onScheduleObservation }: TeacherPerformanceGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {teacherPerformance?.length > 0 ? teacherPerformance.map((teacher: TeacherPerformanceRecord) => (
        <Card key={teacher.teacherId} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <TeacherNameLink teacherId={teacher.teacherId} fullName={teacher.teacherName} variant="subtle" />
            </CardTitle>
            <CardDescription className="text-xs">Performance Overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Rating", <div className="flex items-center space-x-1" key="rating"><Star className="h-3 w-3 text-yellow-400 fill-current" /><span className="text-sm font-semibold">{(teacher.averageRating || 0).toFixed(1)}</span></div>],
              ["Sessions", teacher.totalSessions],
              ["Last Observation", teacher.lastObservation || "Never"],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between items-center">
                <span className="text-xs text-gray-600">{label as string}</span>
                {typeof value === "object" ? value : <span className="text-sm font-semibold">{value}</span>}
              </div>
            ))}
            <div className="pt-2 border-t">
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onScheduleObservation(teacher.teacherId)}>
                Schedule Observation
              </Button>
            </div>
          </CardContent>
        </Card>
      )) : (
        <div className="col-span-full text-center py-8">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No teacher performance data available</p>
        </div>
      )}
    </div>
  );
}
