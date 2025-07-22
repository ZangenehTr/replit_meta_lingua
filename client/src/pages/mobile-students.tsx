import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MobileStudentCard from "@/components/mobile/mobile-student-card";
import { useLocation } from "wouter";
import { 
  Search, 
  Filter, 
  Plus, 
  SortAsc, 
  SortDesc,
  Users,
  Phone,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  level?: string;
  isActive: boolean;
  courses?: string[];
  lastActivity?: string;
  role: string;
}

export function MobileStudents() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "activity" | "level">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch students data
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
    queryFn: async () => {
      const response = await fetch("/api/admin/students", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    }
  });

  // Filter and sort students
  const filteredStudents = React.useMemo(() => {
    let result = students;

    // Filter by search term
    if (searchTerm) {
      result = result.filter(student =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by active status
    if (filterActive !== null) {
      result = result.filter(student => student.isActive === filterActive);
    }

    // Sort students
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "activity":
          // Mock sorting by last activity (in real app, would use actual lastActivity field)
          comparison = a.id - b.id;
          break;
        case "level":
          comparison = (a.level || "").localeCompare(b.level || "");
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [students, searchTerm, filterActive, sortBy, sortOrder]);

  const handleStudentEdit = (id: number) => {
    setLocation(`/admin/students/${id}/edit`);
  };

  const handleStudentDelete = (id: number) => {
    // TODO: Implement delete functionality with confirmation dialog
    console.log("Delete student:", id);
  };

  const handleStudentContact = (id: number) => {
    setLocation(`/admin/communications?student=${id}`);
  };

  const handleStudentCall = (id: number) => {
    setLocation(`/admin/voip?student=${id}`);
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            {filteredStudents.length} of {students.length} students
          </p>
        </div>
        <MobileButton
          variant="default"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setLocation("/admin/students/create")}
        >
          Add
        </MobileButton>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {/* Active Status Filter */}
          <div className="flex gap-1 flex-shrink-0">
            <MobileButton
              variant={filterActive === null ? "default" : "outline"}
              size="xs"
              onClick={() => setFilterActive(null)}
            >
              All
            </MobileButton>
            <MobileButton
              variant={filterActive === true ? "default" : "outline"}
              size="xs"
              onClick={() => setFilterActive(true)}
            >
              Active
            </MobileButton>
            <MobileButton
              variant={filterActive === false ? "default" : "outline"}
              size="xs"
              onClick={() => setFilterActive(false)}
            >
              Inactive
            </MobileButton>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-1 flex-shrink-0">
            <MobileButton
              variant={sortBy === "name" ? "default" : "outline"}
              size="xs"
              onClick={() => setSortBy("name")}
            >
              Name
            </MobileButton>
            <MobileButton
              variant={sortBy === "level" ? "default" : "outline"}
              size="xs"
              onClick={() => setSortBy("level")}
            >
              Level
            </MobileButton>
            <MobileButton
              variant="outline"
              size="xs"
              onClick={toggleSort}
              leftIcon={sortOrder === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
            />
          </div>
        </div>
      </div>

      {/* Statistics Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {students.filter(s => s.isActive).length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.courses && s.courses.length > 0).length}
            </div>
            <div className="text-xs text-muted-foreground">Enrolled</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {students.filter(s => s.phoneNumber).length}
            </div>
            <div className="text-xs text-muted-foreground">Contactable</div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No students found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchTerm ? "Try adjusting your search or filters" : "Start by adding your first student"}
            </p>
            <MobileButton
              variant="default"
              onClick={() => setLocation("/admin/students/create")}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Student
            </MobileButton>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <MobileStudentCard
              key={student.id}
              student={{
                ...student,
                courses: ["Persian Basics", "Advanced Conversation"], // Mock courses for demo
                lastActivity: "2 hours ago" // Mock activity for demo
              }}
              onEdit={handleStudentEdit}
              onDelete={handleStudentDelete}
              onContact={handleStudentContact}
              onCall={student.phoneNumber ? handleStudentCall : undefined}
            />
          ))
        )}
      </div>

      {/* Load More Button (if pagination needed) */}
      {filteredStudents.length > 0 && filteredStudents.length < students.length && (
        <div className="text-center pt-4">
          <MobileButton variant="outline" size="lg">
            Load More Students
          </MobileButton>
        </div>
      )}

      {/* Floating Action Button for Quick Actions */}
      <div className="fixed bottom-20 right-4 z-30 space-y-2">
        <MobileButton
          variant="outline"
          size="fab"
          className="shadow-lg bg-background"
          onClick={() => setLocation("/admin/communications")}
          leftIcon={<MessageSquare className="h-5 w-5" />}
        />
        <MobileButton
          variant="outline"
          size="fab"
          className="shadow-lg bg-background"
          onClick={() => setLocation("/admin/voip")}
          leftIcon={<Phone className="h-5 w-5" />}
        />
        <MobileButton
          variant="default"
          size="fab"
          className="shadow-lg"
          onClick={() => setLocation("/admin/students/create")}
          leftIcon={<Plus className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}

export default MobileStudents;