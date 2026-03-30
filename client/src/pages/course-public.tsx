import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CourseReviews from "@/components/courses/CourseReviews";
import {
  BookOpen,
  Clock,
  Users,
  Globe,
  Calendar,
  MapPin,
  ChevronRight,
  Star,
  ArrowLeft,
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  deliveryMode: string;
  classFormat?: string;
  targetLanguage: string;
  targetLevel?: string[];
  maxStudents?: number;
  currentStudents?: number;
  price: number;
  weekdays?: string[];
  startTime?: string;
  endTime?: string;
  instructorName: string;
  duration?: string;
  isActive: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export default function CoursePublicDetail() {
  const [match, params] = useRoute("/courses/:courseId");
  const { t } = useTranslation(["courses", "common"]);

  const courseId = params?.courseId;

  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  if (!match || !courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t("common:notFound", "صفحه یافت نشد")}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t("common:error", "خطا در بارگذاری اطلاعات")}
      </div>
    );
  }

  const priceDisplay =
    course.price === 0
      ? t("courses:free", "رایگان")
      : `${course.price.toLocaleString("fa-IR")} تومان`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link href="/courses">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-white font-bold text-lg truncate flex-1">{course.title}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Course Card */}
        <Card className="bg-white/5 border-white/10 text-white overflow-hidden">
          {course.thumbnail && (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
          )}
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">{course.title}</h2>
              <p className="text-white/60 text-sm mt-1 leading-relaxed">{course.description}</p>
            </div>

            {/* Rating summary */}
            {course.averageRating != null && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(course.averageRating!)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-white/20"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-yellow-400 font-semibold text-sm">
                  {course.averageRating.toFixed(1)}
                </span>
                {course.reviewCount != null && (
                  <span className="text-white/40 text-xs">
                    ({course.reviewCount} {t("courses:reviews", "نظر")})
                  </span>
                )}
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span>{course.targetLanguage}</span>
              </div>
              {course.targetLevel && course.targetLevel.length > 0 && (
                <div className="flex items-center gap-2 text-white/60">
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span>{course.targetLevel.join(", ")}</span>
                </div>
              )}
              {course.instructorName && (
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>{course.instructorName}</span>
                </div>
              )}
              {course.duration && (
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{course.duration}</span>
                </div>
              )}
              {course.weekdays && course.weekdays.length > 0 && (
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{course.weekdays.join("، ")}</span>
                </div>
              )}
              {course.deliveryMode === "in_person" && (
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{t("courses:inPerson", "حضوری")}</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/20 text-primary border-primary/30"
              >
                {course.deliveryMode === "online"
                  ? t("courses:online", "آنلاین")
                  : t("courses:inPerson", "حضوری")}
              </Badge>
              {course.maxStudents != null && (
                <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                  {course.currentStudents ?? 0}/{course.maxStudents}{" "}
                  {t("courses:students", "دانش‌آموز")}
                </Badge>
              )}
            </div>

            {/* Price + CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div>
                <p className="text-white/40 text-xs">{t("courses:price", "شهریه")}</p>
                <p className="text-white font-bold text-lg">{priceDisplay}</p>
              </div>
              <Link href="/login">
                <Button className="flex items-center gap-2">
                  {t("courses:enroll", "ثبت‌نام در دوره")}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Public Reviews Section */}
        <div>
          <h3 className="text-white font-bold text-lg mb-3">
            {t("courses:reviews", "نظرات دانش‌آموزان")}
          </h3>
          <CourseReviews courseId={Number(courseId)} isEnrolled={false} />
        </div>
      </div>
    </div>
  );
}
