// Comprehensive Explorer Dashboard for Non-Enrolled Students
// This component provides a conversion-optimized dashboard with purple-to-blue theme

import { ExplorerDashboard } from "./ExplorerDashboard";
import type { EnrollmentStatus } from "@/hooks/use-enrollment-status";

interface Props {
  enrollmentStatus: EnrollmentStatus | undefined;
  user: any;
}

export function NonEnrolledStudentDashboard({ enrollmentStatus, user }: Props) {
  return <ExplorerDashboard enrollmentStatus={enrollmentStatus} user={user} />;
}