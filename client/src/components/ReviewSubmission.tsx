import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { Star, Send, MessageSquare } from "lucide-react";

interface ReviewSubmissionProps {
  teacherId: number;
  teacherName: string;
  sessionId?: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  variant?: 'dialog' | 'inline';
}

export function ReviewSubmission({ 
  teacherId, 
  teacherName, 
  sessionId, 
  onSuccess,
  trigger,
  variant = 'dialog'
}: ReviewSubmissionProps) {
  const { language: currentLanguage, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewTextFa, setReviewTextFa] = useState("");
  const [reviewTextAr, setReviewTextAr] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getLocalizedText = (en: string, fa: string, ar?: string) => {
    if (currentLanguage === 'fa') return fa;
    if (currentLanguage === 'ar') return ar || fa;
    return en;
  };

  const submitReview = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          teacherId,
          rating,
          reviewText,
          reviewTextFa: reviewTextFa || reviewText,
          reviewTextAr: reviewTextAr || reviewText,
          sessionId: sessionId || null,
          isAnonymous
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/teacher', teacherId] });
      toast({
        title: getLocalizedText('Review Submitted', 'نظر ثبت شد', 'تم إرسال المراجعة'),
        description: getLocalizedText(
          'Your review will be visible after admin approval.',
          'نظر شما پس از تأیید مدیر نمایش داده می‌شود.',
          'ستكون مراجعتك مرئية بعد موافقة المسؤول.'
        )
      });
      resetForm();
      setDialogOpen(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: getLocalizedText('Error', 'خطا', 'خطأ'),
        description: getLocalizedText(
          'Failed to submit review. Please try again.',
          'ثبت نظر با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
          'فشل في إرسال المراجعة. يرجى المحاولة مرة أخرى.'
        ),
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setRating(0);
    setReviewText("");
    setReviewTextFa("");
    setReviewTextAr("");
    setIsAnonymous(false);
  };

  const renderStars = () => (
    <div className="flex items-center gap-1 justify-center mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
            }`}
          />
        </button>
      ))}
    </div>
  );

  const reviewForm = (
    <div className={`space-y-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">
          {getLocalizedText(
            `Rate your experience with ${teacherName}`,
            `تجربه خود با ${teacherName} را امتیاز دهید`,
            `قيم تجربتك مع ${teacherName}`
          )}
        </p>
        {renderStars()}
        {rating > 0 && (
          <p className="text-sm font-medium">
            {rating === 5 && getLocalizedText('Excellent!', 'عالی!', 'ممتاز!')}
            {rating === 4 && getLocalizedText('Very Good', 'خیلی خوب', 'جيد جداً')}
            {rating === 3 && getLocalizedText('Good', 'خوب', 'جيد')}
            {rating === 2 && getLocalizedText('Fair', 'متوسط', 'مقبول')}
            {rating === 1 && getLocalizedText('Poor', 'ضعیف', 'ضعيف')}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="reviewText">
          {getLocalizedText('Your Review (English)', 'نظر شما (انگلیسی)', 'مراجعتك (الإنجليزية)')}
        </Label>
        <Textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder={getLocalizedText(
            'Share your experience with this teacher...',
            'تجربه خود با این مربی را به اشتراک بگذارید...',
            'شارك تجربتك مع هذا المعلم...'
          )}
          rows={3}
          className="mt-1"
        />
      </div>

      {currentLanguage === 'fa' && (
        <div>
          <Label htmlFor="reviewTextFa">
            {getLocalizedText('Your Review (Farsi)', 'نظر شما (فارسی)', 'مراجعتك (الفارسية)')}
          </Label>
          <Textarea
            id="reviewTextFa"
            value={reviewTextFa}
            onChange={(e) => setReviewTextFa(e.target.value)}
            placeholder="نظر خود را به فارسی بنویسید..."
            rows={3}
            className="mt-1"
            dir="rtl"
          />
        </div>
      )}

      {currentLanguage === 'ar' && (
        <div>
          <Label htmlFor="reviewTextAr">
            {getLocalizedText('Your Review (Arabic)', 'نظر شما (عربی)', 'مراجعتك (العربية)')}
          </Label>
          <Textarea
            id="reviewTextAr"
            value={reviewTextAr}
            onChange={(e) => setReviewTextAr(e.target.value)}
            placeholder="اكتب مراجعتك بالعربية..."
            rows={3}
            className="mt-1"
            dir="rtl"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked === true)}
        />
        <Label htmlFor="anonymous" className="text-sm cursor-pointer">
          {getLocalizedText(
            'Post anonymously',
            'ارسال ناشناس',
            'نشر بشكل مجهول'
          )}
        </Label>
      </div>

      <Button
        onClick={() => submitReview.mutate()}
        disabled={rating === 0 || submitReview.isPending}
        className="w-full"
      >
        <Send className="h-4 w-4 mr-2" />
        {submitReview.isPending
          ? getLocalizedText('Submitting...', 'در حال ارسال...', 'جاري الإرسال...')
          : getLocalizedText('Submit Review', 'ثبت نظر', 'إرسال المراجعة')}
      </Button>

      <p className="text-xs text-center text-gray-500">
        {getLocalizedText(
          'Your review will be published after admin approval.',
          'نظر شما پس از تأیید مدیر منتشر خواهد شد.',
          'ستُنشر مراجعتك بعد موافقة المسؤول.'
        )}
      </p>
    </div>
  );

  if (variant === 'inline') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {getLocalizedText('Leave a Review', 'ثبت نظر', 'اترك مراجعة')}
          </CardTitle>
          <CardDescription>
            {getLocalizedText(
              'Share your experience to help other students',
              'تجربه خود را به اشتراک بگذارید تا به دیگران کمک کنید',
              'شارك تجربتك لمساعدة الطلاب الآخرين'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewForm}
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Star className="h-4 w-4 mr-2" />
            {getLocalizedText('Rate Teacher', 'امتیاز به معلم', 'قيم المعلم')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {getLocalizedText('Rate Your Teacher', 'امتیاز به معلم', 'قيم معلمك')}
          </DialogTitle>
          <DialogDescription>
            {getLocalizedText(
              'Your feedback helps improve our teaching quality',
              'نظر شما به بهبود کیفیت آموزش کمک می‌کند',
              'ملاحظاتك تساعد في تحسين جودة التدريس'
            )}
          </DialogDescription>
        </DialogHeader>
        {reviewForm}
      </DialogContent>
    </Dialog>
  );
}
