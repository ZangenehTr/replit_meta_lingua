import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface TeacherNameLinkProps {
  teacherId: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  className?: string;
  variant?: "default" | "subtle" | "plain";
}

/**
 * A clickable teacher name that navigates to the public tutor profile page (/tutors/:id).
 * Use this everywhere a teacher name is displayed to give students easy profile access.
 */
export function TeacherNameLink({
  teacherId,
  firstName,
  lastName,
  fullName,
  className,
  variant = "default",
}: TeacherNameLinkProps) {
  const displayName = fullName ?? `${firstName ?? ""} ${lastName ?? ""}`.trim();

  const variantClass = {
    default: "text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors",
    subtle: "text-muted-foreground hover:text-foreground hover:underline transition-colors",
    plain: "hover:underline transition-colors",
  }[variant];

  return (
    <Link href={`/tutors/${teacherId}`} className={cn(variantClass, className)}>
      {displayName}
    </Link>
  );
}
