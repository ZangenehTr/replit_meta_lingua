import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LessonFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  lessonId: number;
  sessionToken: string | null;
  userId?: number | null;
  completionTimeSeconds?: number;
  scorePercentage?: number;
  attemptNumber?: number;
}

export function LessonFeedbackModal({
  open,
  onClose,
  lessonId,
  sessionToken,
  userId,
  completionTimeSeconds,
  scorePercentage,
  attemptNumber = 1
}: LessonFeedbackModalProps) {
  const { t } = useTranslation("linguaquest");
  const { toast } = useToast();
  
  const [starRating, setStarRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [difficultyRating, setDifficultyRating] = useState<string>("");
  const [textFeedback, setTextFeedback] = useState("");
  const [wasHelpful, setWasHelpful] = useState<boolean | null>(null);

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      const response = await apiRequest('/api/linguaquest/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
        headers: { 'Content-Type': 'application/json' }
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('feedback.submitted', 'Feedback Submitted'),
        description: t('feedback.thankYou', 'Thank you for your feedback!'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/lessons', lessonId, 'stats'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: t('feedback.error', 'Error'),
        description: error instanceof Error ? error.message : t('feedback.submitError', 'Failed to submit feedback'),
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setStarRating(0);
    setDifficultyRating("");
    setTextFeedback("");
    setWasHelpful(null);
  };

  const handleSubmit = () => {
    if (starRating === 0) {
      toast({
        title: t('feedback.ratingRequired', 'Rating Required'),
        description: t('feedback.pleaseRate', 'Please select a star rating'),
        variant: 'destructive'
      });
      return;
    }

    const feedbackData = {
      lessonId,
      guestSessionToken: sessionToken,
      userId,
      starRating,
      difficultyRating: difficultyRating || null,
      textFeedback: textFeedback.trim() || null,
      wasHelpful,
      completionTimeSeconds,
      scorePercentage,
      attemptNumber
    };

    submitFeedbackMutation.mutate(feedbackData);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('feedback.title', 'How was this lesson?')}</DialogTitle>
          <DialogDescription>
            {t('feedback.description', 'Your feedback helps us improve the learning experience')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>{t('feedback.rating', 'Your Rating')} *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setStarRating(star)}
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredStar || starRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Rating */}
          <div className="space-y-2">
            <Label>{t('feedback.difficulty', 'Difficulty Level')}</Label>
            <RadioGroup value={difficultyRating} onValueChange={setDifficultyRating}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="too_easy" id="too_easy" data-testid="radio-too-easy" />
                <Label htmlFor="too_easy" className="cursor-pointer font-normal">
                  {t('feedback.tooEasy', 'Too Easy')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="just_right" id="just_right" data-testid="radio-just-right" />
                <Label htmlFor="just_right" className="cursor-pointer font-normal">
                  {t('feedback.justRight', 'Just Right')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="too_hard" id="too_hard" data-testid="radio-too-hard" />
                <Label htmlFor="too_hard" className="cursor-pointer font-normal">
                  {t('feedback.tooHard', 'Too Hard')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Was Helpful */}
          <div className="space-y-2">
            <Label>{t('feedback.helpful', 'Was this lesson helpful?')}</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={wasHelpful === true ? 'default' : 'outline'}
                onClick={() => setWasHelpful(true)}
                className="flex-1"
                data-testid="button-helpful-yes"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                {t('feedback.yes', 'Yes')}
              </Button>
              <Button
                type="button"
                variant={wasHelpful === false ? 'default' : 'outline'}
                onClick={() => setWasHelpful(false)}
                className="flex-1"
                data-testid="button-helpful-no"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                {t('feedback.no', 'No')}
              </Button>
            </div>
          </div>

          {/* Text Feedback */}
          <div className="space-y-2">
            <Label htmlFor="textFeedback">{t('feedback.comments', 'Comments (Optional)')}</Label>
            <Textarea
              id="textFeedback"
              placeholder={t('feedback.commentsPlaceholder', 'Share your thoughts about this lesson...')}
              value={textFeedback}
              onChange={(e) => setTextFeedback(e.target.value)}
              rows={4}
              maxLength={1000}
              data-testid="textarea-feedback"
            />
            <p className="text-xs text-muted-foreground">
              {textFeedback.length}/1000 {t('feedback.characters', 'characters')}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-testid="button-cancel-feedback"
          >
            {t('feedback.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitFeedbackMutation.isPending || starRating === 0}
            className="flex-1"
            data-testid="button-submit-feedback"
          >
            {submitFeedbackMutation.isPending 
              ? t('feedback.submitting', 'Submitting...') 
              : t('feedback.submit', 'Submit Feedback')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
