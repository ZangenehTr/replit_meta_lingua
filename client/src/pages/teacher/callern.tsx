// This page redirects to the enhanced Callern dashboard
import { useLanguage } from "@/hooks/useLanguage";
import EnhancedTeacherCallernSystem from "./callern-enhanced";

export default function TeacherCallernSystem() {
  const { isRTL } = useLanguage();
  return <div dir={isRTL ? 'rtl' : 'ltr'}><EnhancedTeacherCallernSystem /></div>;
}