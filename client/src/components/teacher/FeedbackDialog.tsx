import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Trash2 } from "lucide-react";
import type { AssignmentRecord } from "@/hooks/useAssignments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssignment: AssignmentRecord | null;
  feedback: string;
  onFeedbackChange: (v: string) => void;
  score: number;
  onScoreChange: (n: number) => void;
  feedbackAudioFiles: File[];
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAudio: (index: number) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function FeedbackDialog({
  open, onOpenChange, selectedAssignment, feedback, onFeedbackChange,
  score, onScoreChange, feedbackAudioFiles, onAudioUpload, onRemoveAudio,
  onSubmit, isPending,
}: Props) {
  const handleCancel = () => {
    onOpenChange(false);
    onFeedbackChange("");
    onScoreChange(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Grade Assignment & Provide Feedback</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="feedback-score">Score</Label>
            <Input id="feedback-score" type="number" placeholder="Enter score" value={score} onChange={(e) => onScoreChange(parseInt(e.target.value))} max={selectedAssignment?.maxScore} data-testid="input-feedback-score" />
            <p className="text-sm text-gray-500 mt-1">Max score: {selectedAssignment?.maxScore}</p>
          </div>
          <div>
            <Label htmlFor="feedback-text">Text Feedback</Label>
            <Textarea id="feedback-text" placeholder="Provide written feedback to the student" value={feedback} onChange={(e) => onFeedbackChange(e.target.value)} className="min-h-32" data-testid="textarea-feedback" />
          </div>
          <div className="space-y-2">
            <Label>Audio Feedback (Optional) ({feedbackAudioFiles.length}/5)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Mic className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">Upload audio feedback for more personalized comments</p>
              <input type="file" multiple accept="audio/*" onChange={onAudioUpload} className="mt-2" data-testid="input-feedback-audio" disabled={feedbackAudioFiles.length >= 5} />
            </div>
            {feedbackAudioFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Audio Feedback Files</Label>
                {feedbackAudioFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200" data-testid={`feedback-audio-${index}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Mic className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveAudio(index)} data-testid={`button-remove-feedback-audio-${index}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-feedback">Cancel</Button>
            <Button onClick={onSubmit} disabled={!feedback || score === 0 || isPending} data-testid="button-submit-feedback">
              {isPending ? "Submitting..." : "Submit Grade & Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
