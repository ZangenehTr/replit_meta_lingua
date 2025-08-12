import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Mic, Video, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CallRecordingConsentProps {
  callId: number;
  onConsentGiven: () => void;
  isStudent?: boolean;
}

export function CallRecordingConsent({ callId, onConsentGiven, isStudent = true }: CallRecordingConsentProps) {
  const [agreed, setAgreed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const consentMutation = useMutation({
    mutationFn: async (consent: boolean) => {
      return apiRequest(`/api/callern/${callId}/record/start`, 'POST', { consent });
    },
    onSuccess: (data) => {
      if (data.canRecord) {
        toast({
          title: "Recording Started",
          description: "Both parties have consented. The call is now being recorded.",
        });
        onConsentGiven();
      } else {
        toast({
          title: "Consent Recorded",
          description: data.message,
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/callern/${callId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record consent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConsent = () => {
    if (!agreed) {
      toast({
        title: "Please agree to the terms",
        description: "You must check the agreement box before proceeding.",
        variant: "destructive",
      });
      return;
    }
    consentMutation.mutate(true);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <CardTitle>Call Recording Consent</CardTitle>
        </div>
        <CardDescription>
          This call can be recorded for quality and training purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Audio recording</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Video recording (if enabled)</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <span className="text-sm">
              Recordings are used to generate transcripts, improve teaching quality, 
              and provide personalized learning recommendations
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <label
              htmlFor="consent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand and agree to the recording of this call for educational purposes
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleConsent}
            disabled={!agreed || consentMutation.isPending}
            className="flex-1"
          >
            {consentMutation.isPending ? "Processing..." : "Give Consent"}
          </Button>
          <Button
            variant="outline"
            onClick={() => consentMutation.mutate(false)}
            disabled={consentMutation.isPending}
            className="flex-1"
          >
            Decline
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Both parties must consent for recording to begin
        </p>
      </CardContent>
    </Card>
  );
}