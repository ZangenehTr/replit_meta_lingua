import React from "react";
import { MobileCard, MobileCardContent, MobileCardFooter } from "@/components/ui/mobile-card";
import { MobileButton } from "@/components/ui/mobile-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Edit, 
  Trash2, 
  User,
  GraduationCap,
  Clock
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
}

interface MobileStudentCardProps {
  student: Student;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onContact: (id: number) => void;
  onCall?: (id: number) => void;
  className?: string;
}

export function MobileStudentCard({ 
  student, 
  onEdit, 
  onDelete, 
  onContact, 
  onCall,
  className 
}: MobileStudentCardProps) {
  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();
  
  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const getLevelColor = (level?: string) => {
    if (!level) return "bg-gray-100 text-gray-800";
    
    switch (level.toLowerCase()) {
      case 'beginner':
      case 'a1':
      case 'a2':
        return "bg-blue-100 text-blue-800";
      case 'intermediate':
      case 'b1':
      case 'b2':
        return "bg-yellow-100 text-yellow-800";
      case 'advanced':
      case 'c1':
      case 'c2':
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <MobileCard 
      variant="interactive" 
      size="comfortable" 
      role="student"
      className={cn("mobile-transition", className)}
      swipeable
      onSwipeLeft={() => onEdit(student.id)}
      onSwipeRight={() => onDelete(student.id)}
    >
      <MobileCardContent>
        {/* Header Section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={`/api/avatars/${student.id}`} alt={fullName} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">
                {fullName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", getStatusColor(student.isActive))}>
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
                {student.level && (
                  <Badge variant="outline" className={cn("text-xs", getLevelColor(student.level))}>
                    {student.level}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{student.email}</span>
          </div>
          
          {student.phoneNumber && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{student.phoneNumber}</span>
            </div>
          )}
        </div>

        {/* Course Information */}
        {student.courses && student.courses.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <GraduationCap className="h-4 w-4 mr-2" />
              <span>Enrolled Courses ({student.courses.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {student.courses.slice(0, 2).map((course, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {course}
                </Badge>
              ))}
              {student.courses.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{student.courses.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Last Activity */}
        {student.lastActivity && (
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Last active: {student.lastActivity}</span>
          </div>
        )}
      </MobileCardContent>

      <MobileCardFooter>
        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full">
          {/* Contact Actions */}
          <div className="flex gap-1 flex-1">
            <MobileButton
              variant="outline"
              size="sm"
              onClick={() => onContact(student.id)}
              leftIcon={<MessageSquare className="h-4 w-4" />}
              className="flex-1"
            >
              Chat
            </MobileButton>
            
            {student.phoneNumber && onCall && (
              <MobileButton
                variant="outline"
                size="sm"
                onClick={() => onCall(student.id)}
                leftIcon={<Phone className="h-4 w-4" />}
                className="flex-1"
              >
                Call
              </MobileButton>
            )}
          </div>

          {/* Management Actions */}
          <div className="flex gap-1">
            <MobileButton
              variant="ghost"
              size="sm"
              onClick={() => onEdit(student.id)}
              leftIcon={<Edit className="h-4 w-4" />}
              className="px-2"
            />
            
            <MobileButton
              variant="ghost"
              size="sm"
              onClick={() => onDelete(student.id)}
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="px-2 text-destructive hover:text-destructive"
            />
          </div>
        </div>
      </MobileCardFooter>
    </MobileCard>
  );
}

export default MobileStudentCard;