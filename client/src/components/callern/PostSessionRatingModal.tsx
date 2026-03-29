import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";

interface PostSessionRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  teacherId?: number;
  studentId?: number;
  teacherName: string;
  userRole: "student" | "teacher";
}

function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-8 w-8 transition-colors ${
            star <= (readonly ? rating : hover || rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          } ${!readonly ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        />
      ))}
    </div>
  );
}

export default function PostSessionRatingModal({
  isOpen,
  onClose,
  sessionId,
  teacherId,
  studentId,
  teacherName,
  userRole,
}: PostSessionRatingModalProps) {
  const { toast } = useToast();
  const { currentLanguage, isRTL } = useLanguage();
  const t = (fa: string, en: string) => currentLanguage === "fa" ? fa : en;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/callern/rate", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          role: userRole,
          score: rating,
          comment: comment || undefined,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: t("ممنون از بازخورد شما", "Thank you for your feedback"),
        description: t("امتیاز شما با موفقیت ثبت شد", "Your rating has been recorded"),
      });
      onClose();
    },
    onError: () => {
      toast({
        title: t("خطا", "Error"),
        description: t("ثبت امتیاز با خطا مواجه شد", "Failed to submit rating"),
        variant: "destructive",
      });
    },
  });

  const handleSkip = () => onClose();

  const targetName = userRole === "student" ? teacherName : t("دانشجو", "Student");
  const promptLabel = userRole === "student"
    ? t(`تجربه شما با ${teacherName} چطور بود؟`, `How was your session with ${teacherName}?`)
    : t("تجربه شما با این دانشجو چطور بود؟", "How was your session with this student?");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={`max-w-md ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {t("جلسه پایان یافت", "Session Complete")}
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {promptLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-gray-600">
              {t(`امتیاز به ${targetName}`, `Rate ${targetName}`)}
            </p>
            <StarRating rating={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-sm text-yellow-600 font-medium">
                {["", t("خیلی بد", "Very Poor"), t("بد", "Poor"), t("متوسط", "Average"), t("خوب", "Good"), t("عالی", "Excellent")][rating]}
              </p>
            )}
          </div>

          <div>
            <Textarea
              placeholder={t("نظر اختیاری خود را بنویسید...", "Add an optional comment...")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => submitMutation.mutate()}
              disabled={rating === 0 || submitMutation.isPending}
            >
              {submitMutation.isPending ? t("در حال ارسال...", "Submitting...") : t("ثبت امتیاز", "Submit Rating")}
            </Button>
            <Button variant="outline" onClick={handleSkip}>
              {t("رد کردن", "Skip")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
