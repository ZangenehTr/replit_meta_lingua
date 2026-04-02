import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import CourseReviews from "@/components/courses/CourseReviews";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Clock,
  Users,
  Globe,
  Calendar,
  MapPin,
  ChevronRight,
  ChevronDown,
  Star,
  ArrowLeft,
  Tag,
  CheckCircle,
  AlertCircle,
  Loader2,
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

interface PromoValidation {
  valid: boolean;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  finalAmount?: number;
  message: string;
}

interface EnrollRequestBody {
  courseId: number;
  paymentMethod: string;
  promoCode?: string;
}

export default function CoursePublicDetail() {
  const [match, params] = useRoute("/courses/:courseId");
  const { t } = useTranslation(["courses", "common"]);
  const { user } = useAuth();
  const { toast } = useToast();

  const courseId = params?.courseId;

  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Enrollment dialog state
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [promoCode, setPromoCode] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoValidation, setPromoValidation] = useState<PromoValidation | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const handleOpenEnroll = () => {
    setPromoCode("");
    setPromoValidation(null);
    setPromoOpen(false);
    setPaymentMethod("wallet");
    setEnrollOpen(true);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !course) return;
    setPromoLoading(true);
    setPromoValidation(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          courseId: course.id,
          amount: course.price,
        }),
      });
      const data: PromoValidation = await res.json();
      setPromoValidation(data);
    } catch {
      setPromoValidation({ valid: false, message: t("courses:promoError", "خطا در بررسی کد تخفیف") });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;
    setEnrollLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const body: EnrollRequestBody = {
        courseId: course.id,
        paymentMethod,
      };
      if (promoValidation?.valid && promoCode.trim()) {
        body.promoCode = promoCode.trim().toUpperCase();
      }
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        }
        setEnrollOpen(false);
        toast({
          title: t("courses:enrollSuccess", "ثبت‌نام موفق"),
          description: t("courses:enrollSuccessDesc", "شما با موفقیت در دوره ثبت‌نام کردید"),
        });
      } else {
        toast({
          title: t("courses:enrollFailed", "ثبت‌نام ناموفق"),
          description: data.message || t("courses:enrollFailedDesc", "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید."),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("courses:enrollFailed", "ثبت‌نام ناموفق"),
        description: t("courses:enrollFailedDesc", "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید."),
        variant: "destructive",
      });
    } finally {
      setEnrollLoading(false);
    }
  };

  const displayedFinalPrice = promoValidation?.valid && promoValidation.finalAmount != null
    ? promoValidation.finalAmount
    : course?.price ?? 0;

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
      : `${course.price.toLocaleString("fa-IR")} ${t("courses:toman", "تومان")}`;

  const isFull = !!(course.maxStudents && course.currentStudents && course.currentStudents >= course.maxStudents);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link href="/courses">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" aria-label="Back to courses">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
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
              {user ? (
                <Button
                  onClick={handleOpenEnroll}
                  disabled={isFull}
                  className="flex items-center gap-2"
                >
                  {isFull
                    ? t("courses:full", "ظرفیت تکمیل")
                    : t("courses:enroll", "ثبت‌نام در دوره")}
                  {!isFull && <ChevronRight className="w-4 h-4" />}
                </Button>
              ) : (
                <Link href="/login">
                  <Button className="flex items-center gap-2">
                    {t("courses:enroll", "ثبت‌نام در دوره")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
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

      {/* Enrollment Confirmation Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("courses:enrollConfirmTitle", "تأیید ثبت‌نام")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Course name */}
            <div>
              <p className="text-xs text-muted-foreground">{t("courses:enrollCourse", "دوره")}</p>
              <p className="font-semibold text-sm leading-snug">{course.title}</p>
            </div>

            {/* Price display */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("courses:price", "شهریه")}</span>
              <div className="text-right">
                {promoValidation?.valid && promoValidation.discountAmount ? (
                  <>
                    <span className="text-sm line-through text-muted-foreground me-2">
                      {course.price.toLocaleString("fa-IR")} {t("courses:toman", "تومان")}
                    </span>
                    <span className="font-bold text-green-600">
                      {displayedFinalPrice.toLocaleString("fa-IR")} {t("courses:toman", "تومان")}
                    </span>
                  </>
                ) : (
                  <span className="font-bold">
                    {course.price === 0
                      ? t("courses:free", "رایگان")
                      : `${course.price.toLocaleString("fa-IR")} ${t("courses:toman", "تومان")}`}
                  </span>
                )}
              </div>
            </div>

            {/* Collapsible promo code section */}
            <Collapsible open={promoOpen} onOpenChange={setPromoOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between px-0 h-auto py-1 text-sm font-normal text-muted-foreground hover:text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {t("courses:promoCode", "کد تخفیف")}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${promoOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Input
                    id="promo-input"
                    placeholder={t("courses:promoPlaceholder", "کد تخفیف خود را وارد کنید")}
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoValidation(null);
                    }}
                    className="font-mono text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") handleApplyPromo(); }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim() || promoLoading}
                    className="shrink-0"
                  >
                    {promoLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("courses:applyPromo", "اعمال")
                    )}
                  </Button>
                </div>

                {/* Promo feedback */}
                {promoValidation && (
                  <div className={`flex items-start gap-2 text-xs rounded-md p-2 ${
                    promoValidation.valid
                      ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  }`}>
                    {promoValidation.valid ? (
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    )}
                    <span>{promoValidation.message}</span>
                  </div>
                )}

                {/* Discount breakdown */}
                {promoValidation?.valid && promoValidation.discountAmount != null && (
                  <div className="text-xs text-muted-foreground space-y-0.5 border-t pt-2">
                    <div className="flex justify-between">
                      <span>{t("courses:discount", "تخفیف")}</span>
                      <span className="text-green-600">
                        -{promoValidation.discountAmount.toLocaleString("fa-IR")} {t("courses:toman", "تومان")}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-foreground">
                      <span>{t("courses:finalPrice", "مبلغ نهایی")}</span>
                      <span>
                        {displayedFinalPrice.toLocaleString("fa-IR")} {t("courses:toman", "تومان")}
                      </span>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Payment method */}
            <div className="space-y-1.5">
              <Label className="text-sm">{t("courses:paymentMethod", "روش پرداخت")}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">{t("courses:wallet", "کیف پول")}</SelectItem>
                  <SelectItem value="zarinpal">{t("courses:zarinpal", "زرین‌پال")}</SelectItem>
                  <SelectItem value="idpay">{t("courses:idpay", "آیدی پی")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEnrollOpen(false)} disabled={enrollLoading}>
              {t("courses:cancel", "انصراف")}
            </Button>
            <Button onClick={handleEnroll} disabled={enrollLoading}>
              {enrollLoading && <Loader2 className="w-4 h-4 animate-spin me-2" />}
              {t("courses:confirmEnroll", "تأیید ثبت‌نام")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
