import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import {
  GraduationCap,
  BookOpen,
  Video,
  Trophy,
  Star,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";

interface OnlineTeacher {
  id: number;
  firstName: string;
  lastName: string;
  status: "available" | "teaching" | "offline";
  rating: number;
  languages?: string[];
  specializations?: string[];
}

interface Course {
  id: number;
  title: string;
  level?: string;
  language?: string;
  price: number;
  thumbnailUrl?: string;
  description?: string;
}

interface PlacementResult {
  cefrLevel?: string;
  language?: string;
}

export default function StudentWelcomePage() {
  const { user } = useAuth();
  const { t } = useTranslation(["common", "callern"]);
  const [, navigate] = useLocation();

  // Check if student already has enrollments — redirect if so
  const { data: myCourses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/student/courses"],
    retry: false,
  });

  useEffect(() => {
    if (!coursesLoading && myCourses.length > 0) {
      navigate("/dashboard");
    }
  }, [myCourses, coursesLoading, navigate]);

  // Fetch live CallerN teachers
  const { data: onlineTeachers = [] } = useQuery<OnlineTeacher[]>({
    queryKey: ["/api/callern/online-teachers"],
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Fetch available courses (optionally filtered by placement result)
  const { data: availableCourses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch placement test result if available
  const { data: placementResult } = useQuery<PlacementResult>({
    queryKey: ["/api/placement-test/my-result"],
    retry: false,
  });

  // Filter by placement level/language when available, fall back to all courses
  const displayedCourses = (() => {
    const all = availableCourses as Course[];
    if (!placementResult?.cefrLevel) return all.slice(0, 6);
    const level = placementResult.cefrLevel.toLowerCase();
    const lang = placementResult.language?.toLowerCase();
    const filtered = all.filter((c) => {
      const levelMatch = c.level ? c.level.toLowerCase() === level : true;
      const langMatch = lang && c.language ? c.language.toLowerCase() === lang : true;
      return levelMatch && langMatch;
    });
    return (filtered.length >= 3 ? filtered : all).slice(0, 6);
  })();
  const availableTeachers = (onlineTeachers as OnlineTeacher[]).filter((t) => t.status === "available");
  const teachingTeachers = (onlineTeachers as OnlineTeacher[]).filter((t) => t.status === "teaching");

  if (coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background" dir="rtl">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-14 text-center">
        <div className="text-5xl mb-4">🌟</div>
        <h1 className="text-3xl font-bold mb-3">
          خوش آمدید، {user?.firstName}!
        </h1>
        <p className="text-white/85 text-lg max-w-xl mx-auto">
          به Meta Lingua خوش آمدید. برای شروع یادگیری، یک دوره انتخاب کنید یا مستقیماً با یک مدرس آنلاین ارتباط برقرار کنید.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Live Teacher Wall */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-6 h-6 text-primary" />
                مدرسان آنلاین — همین الان آماده‌اند
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                با یک کلیک با مدرس انتخابی خود مکالمه شروع کنید
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/callern")}>
              دیدن همه مدرسان
              <ArrowRight className="w-4 h-4 mr-1" />
            </Button>
          </div>

          {onlineTeachers.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <WifiOff className="w-10 h-10 mx-auto mb-3 opacity-40" />
                در حال حاضر مدرسی آنلاین نیست
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(onlineTeachers as OnlineTeacher[]).slice(0, 6).map((teacher) => (
                <Card
                  key={teacher.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/tutors/${teacher.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                        {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{teacher.firstName} {teacher.lastName}</span>
                          {teacher.status === "available" && (
                            <Badge className="bg-green-500 text-white text-xs px-2">
                              <Wifi className="w-3 h-3 ml-1" />
                              آنلاین
                            </Badge>
                          )}
                          {teacher.status === "teaching" && (
                            <Badge className="bg-amber-500 text-white text-xs px-2">
                              در حال تدریس
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span>{teacher.rating?.toFixed(1) || "جدید"}</span>
                        </div>
                        {teacher.languages && teacher.languages.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {teacher.languages.slice(0, 2).map((lang) => (
                              <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {teacher.status === "available" && (
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate("/callern"); }}
                      >
                        <Zap className="w-4 h-4 ml-1" />
                        شروع مکالمه
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Placement Test CTA */}
        <section>
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  سطح زبان خود را رایگان بسنجید
                </h3>
                <p className="text-blue-700 text-sm mt-1">
                  آزمون تعیین سطح ما فقط ۱۵ دقیقه طول می‌کشد و سطح CEFR شما را مشخص می‌کند
                </p>
                {placementResult?.cefrLevel && (
                  <div className="mt-2">
                    <Badge className="bg-blue-600 text-white">سطح فعلی شما: {placementResult.cefrLevel}</Badge>
                  </div>
                )}
              </div>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                onClick={() => navigate("/mst")}
              >
                شروع آزمون رایگان
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Course Catalog Teaser */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-primary" />
                {placementResult?.cefrLevel
                  ? `دوره‌های پیشنهادی برای سطح ${placementResult.cefrLevel}`
                  : "دوره‌های محبوب"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                انتخاب دوره مناسب اولین قدم در مسیر یادگیری شماست
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/courses")}>
              همه دوره‌ها
              <ArrowRight className="w-4 h-4 mr-1" />
            </Button>
          </div>

          {displayedCourses.length === 0 ? (
            <p className="text-muted-foreground">دوره‌ای یافت نشد</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCourses.map((course) => (
                <Card
                  key={course.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      {course.level && <Badge variant="secondary" className="text-xs">{course.level}</Badge>}
                      {course.language && <Badge variant="outline" className="text-xs">{course.language}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {course.description && (
                      <p className="text-muted-foreground text-xs line-clamp-2 mb-3">{course.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {course.price === 0 ? "رایگان" : `${course.price.toLocaleString("fa-IR")} تومان`}
                      </span>
                      <Button size="sm" variant="outline">
                        مشاهده دوره
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* LinguaQuest Gamification Preview */}
        <section>
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-purple-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  LinguaQuest — یادگیری را به بازی تبدیل کنید
                </h3>
                <p className="text-purple-700 text-sm mt-1 max-w-md">
                  با سیستم گیمیفیکیشن ما امتیاز کسب کنید، سطح بالا بروید، و با یادگیرندگان دیگر رقابت کنید
                </p>
                <div className="flex gap-3 mt-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">XP</div>
                    <div className="text-xs text-purple-500">امتیاز کسب کنید</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">🏆</div>
                    <div className="text-xs text-purple-500">دستاوردها</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">🔥</div>
                    <div className="text-xs text-purple-500">رقابت روزانه</div>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap"
                onClick={() => navigate("/linguaquest")}
              >
                یک درس رایگان امتحان کنید
                <Zap className="w-4 h-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Certificate Mockup */}
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              گواهینامه با نام شما
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              پس از اتمام هر دوره، گواهینامه رسمی با نام شما صادر می‌شود
            </p>
          </div>

          <div className="border-4 border-yellow-400 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 p-8 text-center max-w-2xl mx-auto shadow-lg relative overflow-hidden">
            <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-yellow-300 rounded-xl pointer-events-none" />
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-amber-700 text-sm uppercase tracking-widest mb-2">گواهینامه افتخاری</p>
            <h3 className="text-3xl font-bold text-amber-900 mb-2">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-amber-700 text-sm mb-4">
              این گواهینامه برای اتمام دوره زبان‌آموزی در
            </p>
            <p className="text-2xl font-bold text-primary mb-4">Meta Lingua Academy</p>
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-4 italic">
              * این یک نمونه گواهینامه است. گواهینامه واقعی پس از اتمام دوره صادر می‌شود.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center pb-8">
          <h2 className="text-2xl font-bold mb-3">آماده شروع هستید؟</h2>
          <p className="text-muted-foreground mb-6">
            همین الان یک دوره انتخاب کنید و اولین قدم در مسیر یادگیری زبان خود را بردارید
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/courses")}>
              <GraduationCap className="w-5 h-5 ml-2" />
              مشاهده همه دوره‌ها
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/callern")}>
              <Video className="w-5 h-5 ml-2" />
              مکالمه با مدرس آنلاین
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
