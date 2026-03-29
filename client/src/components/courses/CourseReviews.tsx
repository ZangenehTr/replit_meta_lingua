import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Star, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Review {
  id: number;
  courseId: number;
  studentId: number;
  rating: number;
  reviewText: string;
  status: "pending" | "approved" | "rejected";
  isAnonymous: boolean;
  helpfulCount: number;
  createdAt: string;
  studentFirstName?: string;
  studentLastName?: string;
}

interface CourseReviewsProps {
  courseId: number;
  isEnrolled?: boolean;
}

function StarRating({
  rating,
  onChange,
  readonly = false,
}: {
  rating: number;
  onChange?: (r: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 transition-colors ${
            star <= (readonly ? rating : hover || rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          } ${!readonly ? "cursor-pointer" : ""}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        />
      ))}
    </div>
  );
}

export default function CourseReviews({ courseId, isEnrolled = false }: CourseReviewsProps) {
  const { toast } = useToast();
  const { currentLanguage, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const t = (fa: string, en: string) => currentLanguage === "fa" ? fa : en;

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: [`/api/courses/${courseId}/reviews`],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, reviewText, isAnonymous }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/reviews`] });
      setShowForm(false);
      setRating(0);
      setReviewText("");
      toast({
        title: t("نظر ارسال شد", "Review Submitted"),
        description: t(
          "نظر شما پس از تأیید مدیر نمایش داده خواهد شد.",
          "Your review will be visible after admin approval."
        ),
      });
    },
    onError: (err: any) => {
      toast({
        title: t("خطا", "Error"),
        description: err?.message ?? t("خطا در ارسال نظر", "Failed to submit review"),
        variant: "destructive",
      });
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      return apiRequest(`/api/courses/${courseId}/reviews/${reviewId}/helpful`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/reviews`] });
    },
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("نظرات دانشجویان", "Student Reviews")}
            {reviews.length > 0 && (
              <Badge variant="secondary">{reviews.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center justify-center p-4">
                <span className="text-5xl font-bold text-yellow-500">{avgRating}</span>
                <StarRating rating={Math.round(Number(avgRating))} readonly />
                <span className="text-sm text-gray-500 mt-1">
                  {reviews.length} {t("نظر", "reviews")}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                {ratingDistribution.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-center">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">{t("هنوز نظری ثبت نشده است", "No reviews yet")}</p>
          )}

          {isEnrolled && !showForm && (
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Star className="h-4 w-4 mr-2" />
              {t("ثبت نظر", "Write a Review")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Review form */}
      {showForm && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">{t("ثبت نظر جدید", "Write Your Review")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">{t("امتیاز شما:", "Your Rating:")}</p>
              <StarRating rating={rating} onChange={setRating} />
            </div>
            <Textarea
              placeholder={t("نظر خود را بنویسید...", "Write your review...")}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              {t("ناشناس ارسال شود", "Submit anonymously")}
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={rating === 0 || submitMutation.isPending}
              >
                {t("ارسال نظر", "Submit Review")}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                {t("انصراف", "Cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                      {review.isAnonymous
                        ? "?"
                        : `${review.studentFirstName?.[0] ?? ""}${review.studentLastName?.[0] ?? ""}`}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {review.isAnonymous
                          ? t("کاربر ناشناس", "Anonymous")
                          : `${review.studentFirstName ?? ""} ${review.studentLastName ?? ""}`.trim()}
                      </span>
                      <StarRating rating={review.rating} readonly />
                      {review.status === "approved" && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{review.reviewText}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(review.createdAt).toLocaleDateString(
                          currentLanguage === "fa" ? "fa-IR" : "en-US"
                        )}
                      </span>
                      {review.helpfulCount > 0 && (
                        <span>
                          {review.helpfulCount} {t("نفر مفید دانستند", "found helpful")}
                        </span>
                      )}
                      <button
                        className="text-blue-500 hover:underline"
                        onClick={() => helpfulMutation.mutate(review.id)}
                      >
                        {t("مفید بود", "Helpful")}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
