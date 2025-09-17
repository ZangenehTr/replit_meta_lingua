import { useRoute } from "wouter";
import CoursePlayer from "./course-player";

export default function CourseDetail() {
  const [match, params] = useRoute("/course/:courseId");
  
  if (!match || !params?.courseId) {
    return <div>Course not found</div>;
  }

  return <CoursePlayer courseId={params.courseId} />;
}