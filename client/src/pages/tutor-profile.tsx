import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Star,
  Users,
  Bell,
  BellOff,
  Video,
  ArrowLeft,
  Clock,
  Award,
  Phone,
  Globe,
} from "lucide-react";

interface TeacherProfile {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  profileImageUrl?: string;
  bio?: string;
  introVideoUrl?: string;
  specializations: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  followerCount: number;
  isCallernAuthorized: boolean;
  hourlyRate?: number;
  successRate?: number | null;
}

type PresenceStatus = "available" | "teaching" | "offline";

function PresenceBadge({ status }: { status: PresenceStatus }) {
  if (status === "available") {
    return (
      <Badge className="bg-green-100 text-green-800 border border-green-300 gap-1">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
        آماده مکالمه
      </Badge>
    );
  }
  if (status === "teaching") {
    return (
      <Badge className="bg-amber-100 text-amber-800 border border-amber-300 gap-1">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
        در حال تدریس
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
      آفلاین
    </Badge>
  );
}

export default function TutorProfilePage() {
  const [, params] = useRoute("/tutors/:id");
  const teacherId = parseInt(params?.id ?? "0", 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(["common"]);

  const { data: profile, isLoading } = useQuery<TeacherProfile>({
    queryKey: [`/api/teachers/${teacherId}/profile`],
    enabled: !isNaN(teacherId) && teacherId > 0,
  });

  const { data: followStatus } = useQuery<{ following: boolean }>({
    queryKey: [`/api/teachers/${teacherId}/follow-status`],
    enabled: !isNaN(teacherId) && teacherId > 0 && user?.role === "student",
  });

  // Get the teacher's current presence status from the online-teachers list
  const { data: onlineTeachers = [] } = useQuery<Array<{ id: number; status: PresenceStatus }>>({
    queryKey: ["/api/callern/online-teachers"],
    enabled: user?.role === "student",
    staleTime: 30 * 1000,
  });
  const teacherPresence = (onlineTeachers.find((t) => t.id === teacherId)?.status ?? "offline") as PresenceStatus;

  const followMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/teachers/${teacherId}/follow`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teachers/${teacherId}/follow-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/teachers/${teacherId}/profile`] });
      toast({ title: "اطلاع‌رسانی فعال شد", description: "وقتی این مدرس آنلاین شود به شما اطلاع می‌دهیم" });
    },
    onError: (err: any) => {
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/teachers/${teacherId}/follow`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teachers/${teacherId}/follow-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/teachers/${teacherId}/profile`] });
      toast({ title: "اطلاع‌رسانی غیرفعال شد" });
    },
    onError: (err: any) => {
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    },
  });

  const isFollowing = followStatus?.following ?? false;

  const handleFollowToggle = () => {
    if (!user) {
      toast({ title: "ورود الزامی", description: "برای دنبال کردن مدرس ابتدا وارد شوید", variant: "destructive" });
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </MobileLayout>
    );
  }

  if (!profile) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">مدرس یافت نشد</p>
          <Link href="/callern">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 me-2" />
              بازگشت
            </Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  const canCall =
    user?.role === "student" && teacherPresence === "available" && profile.isCallernAuthorized;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <MobileLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-2xl">
        {/* Back button */}
        <Link href="/callern">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            بازگشت به CallerN
          </Button>
        </Link>

        {/* Hero card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center gap-4">
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile.fullName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                  {(profile.firstName?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <PresenceBadge status={teacherPresence} />
                  {profile.isCallernAuthorized && (
                    <Badge className="bg-white/20 text-white text-xs">CallerN</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-bold text-gray-900">
                    {profile.rating > 0 ? profile.rating.toFixed(1) : "–"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{profile.reviewCount} نظر</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="font-bold text-gray-900">{profile.followerCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">دنبال‌کننده</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="font-bold text-gray-900">
                    {profile.successRate != null ? `${profile.successRate}%` : "–"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">موفقیت</p>
              </div>
            </div>

            {/* Action buttons */}
            {user?.role === "student" && (
              <div className="flex gap-2">
                {canCall && (
                  <Link href="/callern" className="flex-1">
                    <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                      <Phone className="h-4 w-4" />
                      شروع مکالمه
                    </Button>
                  </Link>
                )}
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  disabled={isPending}
                  className={`gap-2 ${canCall ? "" : "flex-1"}`}
                >
                  {isFollowing ? (
                    <>
                      <BellOff className="h-4 w-4" />
                      لغو اطلاع‌رسانی
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      {teacherPresence === "offline" ? "اطلاع‌رسانی آنلاین" : "دنبال کردن"}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bio */}
        {profile.bio && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">درباره مدرس</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Intro video */}
        {profile.introVideoUrl && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4" />
                ویدیو معرفی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <video
                src={profile.introVideoUrl}
                controls
                className="w-full rounded-lg max-h-60 bg-black"
              />
            </CardContent>
          </Card>
        )}

        {/* Specializations */}
        {profile.specializations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />
                تخصص‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profile.specializations.map((s, i) => (
                <Badge key={i} variant="secondary">
                  {s}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Languages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              زبان‌های تدریس
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.languages.map((lang, i) => (
              <Badge key={i} variant="outline">
                {lang}
              </Badge>
            ))}
          </CardContent>
        </Card>

        {/* Hourly rate */}
        {profile.hourlyRate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                نرخ ساعتی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-blue-700">
                {profile.hourlyRate.toLocaleString("fa-IR")} تومان / ساعت
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
