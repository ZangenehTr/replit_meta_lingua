// client/src/pages/mst.tsx
import React, { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { Clock, MicOff, Play, Pause, Volume2, Map, Trophy, Target, BookOpen, CheckCircle, Users, Calendar, Zap, Brain } from "lucide-react";
import { 
  scoreSpeaking, 
  scoreWriting, 
  validateSpeakingResponse, 
  validateWritingResponse,
  performanceTracker,
  type QuickscoreResult,
  type SpeakingItem,
  type WritingItem,
  type SpeakingResponse,
  type WritingResponse
} from "@/lib/scoring";

const mstStyle = { direction: "ltr" as const, textAlign: "left" as const };

type MSTSkill = "listening" | "reading" | "speaking" | "writing";
type MSTStage = "core" | "upper" | "lower";

interface MSTSession {
  sessionId: string;
  skillOrder: MSTSkill[];
  perSkillSeconds: number;
  totalSeconds: number;
  status: "active" | "completed" | "expired";
}
interface MSTItem {
  id: string;
  skill: MSTSkill;
  stage: MSTStage;
  cefr: string;
  timing: {
    maxAnswerSec: number;
    audioSec?: number;
    prepSec?: number;
    recordSec?: number;
  };
  content: any;
  metadata?: Record<string, any>;
}

const PREP_SEC = 15;
const RECORD_SEC = 60;

// ---------- Utils
const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
const clearTimer = (ref: React.MutableRefObject<number | null>) => {
  if (ref.current != null) {
    clearInterval(ref.current);
    ref.current = null;
  }
};
function pickAudioMime(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4", // Safari
    "audio/mpeg",
  ];
  for (const t of candidates) {
    try {
      // @ts-ignore
      if (
        window.MediaRecorder &&
        MediaRecorder.isTypeSupported &&
        MediaRecorder.isTypeSupported(t)
      )
        return t;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

export default function MSTPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Session / flow
  const [testPhase, setTestPhase] = useState<"intro" | "testing" | "completed" | "goalSelection" | "generating" | "personalized">(
    "intro",
  );
  const [currentSession, setCurrentSession] = useState<MSTSession | null>(null);
  const [currentItem, setCurrentItem] = useState<MSTItem | null>(null);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [currentStage, setCurrentStage] = useState<MSTStage>("core");

  // Answer / timers
  const [currentResponse, setCurrentResponse] = useState<any>("");
  const [itemTimer, setItemTimer] = useState(0);
  const [guardTimer, setGuardTimer] = useState(0);
  const [actualTimerSeconds, setActualTimerSeconds] = useState(0); // Track actual timer value set

  // Listening validation
  const [hasPlayedListening, setHasPlayedListening] = useState(false);
  const [audioHasEnded, setAudioHasEnded] = useState(false);

  // Audio (listening / narration)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Speaking phases
  const [speakingPhase, setSpeakingPhase] = useState<
    "narration" | "preparation" | "recording" | "completed"
  >("narration");
  const [prepTimer, setPrepTimer] = useState(PREP_SEC);
  const [recordTimer, setRecordTimer] = useState(RECORD_SEC);
  const [prepTimeDisplay, setPrepTimeDisplay] = useState("00:15");
  const [recordTimeDisplay, setRecordTimeDisplay] = useState("01:00");
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [narrationPlayButton, setNarrationPlayButton] = useState(false);

  // Speaking recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);
  
  // Microphone management
  const currentStreamRef = useRef<MediaStream | null>(null);
  const [isMicrophoneDisabled, setIsMicrophoneDisabled] = useState(false);

  // Refs (browser timer IDs are numbers)
  const prepIntervalRef = useRef<number | null>(null);
  const recordIntervalRef = useRef<number | null>(null);
  const autoplayFallbackTimeoutRef = useRef<number | null>(null);

  // Guards
  const phaseRef = useRef<
    "narration" | "preparation" | "recording" | "completed"
  >("narration");
  const hasRecordingStartedRef = useRef(false);
  const hasStoppedRef = useRef(false);
  const audioStartedRef = useRef(false);
  const [isSubmissionLocked, setIsSubmissionLocked] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);

  // Watchdog overlay for slow backends
  const [isProcessingSubmission, setIsProcessingSubmission] = useState(false);
  const [submissionStartTime, setSubmissionStartTime] = useState<number>(0);

  // Speaking Q index
  const [speakingQuestionIndex, setSpeakingQuestionIndex] = useState(0);

  // Scores / routes per skill
  const [skillScores, setSkillScores] = useState<
    Record<
      string,
      {
        stage1Score?: number;
        stage2Score?: number;
        route?: "up" | "down" | "stay";
      }
    >
  >({});

  // Final results
  const [testResults, setTestResults] = useState<any>(null);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<any>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [timeAvailability, setTimeAvailability] = useState<number>(5);
  const [preferredPace, setPreferredPace] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [learningStyle, setLearningStyle] = useState<string>('interactive');

  // Client-side scoring state
  const [clientScoring, setClientScoring] = useState(true); // Enable client-side scoring
  const [scoringPerformance, setScoringPerformance] = useState<{computeTimeMs: number, serverLoadReduction: number} | null>(null);
  const [loadReductionStats, setLoadReductionStats] = useState<{totalResponses: number, clientScored: number, serverLoadReduced: number}>({
    totalResponses: 0,
    clientScored: 0,
    serverLoadReduced: 0
  });

  // ---------- CLIENT-SIDE SCORING UTILITIES ----------
  
  /**
   * Perform client-side scoring for speaking and writing items
   * Returns null for reading/listening (server-side only)
   */
  const performClientSideScoring = (item: MSTItem, response: any): QuickscoreResult | null => {
    if (!clientScoring) return null;
    
    try {
      if (item.skill === 'speaking') {
        // Convert item to SpeakingItem format
        const speakingItem: SpeakingItem = {
          id: item.id,
          skill: 'speaking',
          stage: item.stage,
          cefr: item.cefr as any,
          assets: {
            prompt: item.content?.prompt || '',
            keywords: item.content?.keywords,
            structure: item.content?.structure,
          },
          timing: {
            prepSec: item.timing.prepSec || PREP_SEC,
            recordSec: item.timing.recordSec || RECORD_SEC,
            maxAnswerSec: item.timing.maxAnswerSec,
          },
        };
        
        // Convert response to SpeakingResponse format
        const speakingResponse: SpeakingResponse = {
          audioUrl: response.audioUrl,
          audioBuffer: response.audioBlob,
          asr: response.transcript ? {
            text: response.transcript,
            confidence: response.asrConfidence || 0.8,
          } : undefined,
        };
        
        if (!validateSpeakingResponse(speakingItem, speakingResponse)) {
          console.warn('Invalid speaking response for client-side scoring');
          return null;
        }
        
        const result = scoreSpeaking(speakingItem, speakingResponse);
        performanceTracker.recordScore('speaking', result.computeTimeMs || 0);
        console.log('🎤 Client-side speaking score:', result);
        return result;
        
      } else if (item.skill === 'writing') {
        // Convert item to WritingItem format
        const writingItem: WritingItem = {
          id: item.id,
          skill: 'writing',
          stage: item.stage,
          cefr: item.cefr as any,
          assets: {
            prompt: item.content?.prompt || '',
            minWords: item.content?.minWords || 50,
            maxWords: item.content?.maxWords || 250,
            taskType: item.content?.taskType || 'opinion',
          },
        };
        
        // Handle both string and object response formats
        const writingResponse: WritingResponse | string = typeof response === 'string' 
          ? response 
          : response?.text || response || '';
        
        if (!validateWritingResponse(writingItem, writingResponse)) {
          console.warn('Invalid writing response for client-side scoring');
          return null;
        }
        
        const result = scoreWriting(writingItem, writingResponse);
        performanceTracker.recordScore('writing', result.computeTimeMs || 0);
        console.log('📝 Client-side writing score:', result);
        return result;
      }
      
      // Reading and listening still use server-side scoring
      return null;
    } catch (error) {
      console.error('Client-side scoring error:', error);
      return null;
    }
  };

  // ---------- API: start/status/submit/finalize
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/mst/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetLanguage: "english" }),
      });
      if (!r.ok) throw new Error("start failed");
      return r.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data);
      setTestPhase("testing");
      fetchFirstItem(data.sessionId);
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to start MST test.",
        variant: "destructive",
      }),
  });

  const { data: status } = useQuery({
    queryKey: ["mst-status", currentSession?.sessionId],
    queryFn: async () => {
      if (!currentSession?.sessionId) return null;
      const r = await fetch(
        `/api/mst/status?sessionId=${currentSession.sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        },
      );
      if (!r.ok) throw new Error("status failed");
      const data = await r.json();
      return data.success ? data : null;
    },
    enabled:
      !!currentSession?.sessionId &&
      testPhase === "testing" &&
      !isSubmissionLocked,
    refetchInterval: 1000,
  });

  const submitResponseMutation = useMutation({
    mutationFn: async (p: {
      sessionId: string;
      skill: MSTSkill;
      stage: MSTStage;
      itemId: string;
      responseData?: any;
      audioBlob?: Blob;
      timeSpentMs: number;
    }) => {
      setSubmissionStartTime(Date.now());
      
      // Try client-side scoring first for speaking and writing
      let clientScore: QuickscoreResult | null = null;
      
      if (currentItem && (p.skill === 'speaking' || p.skill === 'writing')) {
        const response = p.skill === 'speaking' 
          ? { audioBlob: p.audioBlob, transcript: p.responseData?.transcript, asrConfidence: p.responseData?.asrConfidence }
          : p.responseData;
          
        clientScore = performClientSideScoring(currentItem, response);
        
        if (clientScore) {
          console.log(`⚡ Client-side ${p.skill} scoring completed in ${clientScore.computeTimeMs}ms:`, {
            score: clientScore.p,
            route: clientScore.route,
            features: clientScore.features
          });
          
          // Update performance tracking
          const stats = performanceTracker.getStats();
          setScoringPerformance({
            computeTimeMs: clientScore.computeTimeMs || 0,
            serverLoadReduction: stats.estimatedServerLoadReduction
          });
        }
      }
      
      const form = new FormData();
      form.append("sessionId", p.sessionId);
      form.append("skill", p.skill);
      form.append("stage", p.stage);
      form.append("itemId", p.itemId);
      form.append("timeSpentMs", String(p.timeSpentMs));
      
      // Include client-side score for server validation
      if (clientScore) {
        form.append("clientScore", JSON.stringify({
          p: clientScore.p,
          route: clientScore.route,
          features: clientScore.features,
          computeTimeMs: clientScore.computeTimeMs,
          version: "1.0" // Must match server CLIENT_SCORING_VERSION
        }));
      }
      
      if (p.audioBlob)
        form.append("audio", p.audioBlob, "recording"); // accept any mime
      else form.append("responseData", JSON.stringify(p.responseData ?? null));
      
      const r = await fetch("/api/mst/response", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: form,
      });
      if (!r.ok) throw new Error("submit failed");
      
      const serverResponse = await r.json();
      
      // Use client score if available and valid, otherwise use server score
      if (clientScore && clientScore.p !== undefined) {
        console.log(`🎯 Using client-side score: ${clientScore.p} (route: ${clientScore.route})`);
        return {
          ...serverResponse,
          p: clientScore.p,
          route: clientScore.route,
          clientScored: true,
          serverValidated: true
        };
      }
      
      console.log(`🌐 Using server-side score: ${serverResponse.p} (route: ${serverResponse.route})`);
      return { ...serverResponse, clientScored: false };
    },
    onSuccess: async (data) => {
      setIsAutoAdvancing(false);
      setIsSubmissionLocked(false);
      setIsProcessingSubmission(false);
      setSubmissionStartTime(0);
      if (!data?.success || !currentItem) return;

      // Track load reduction performance for speaking/writing only
      const skill = currentItem.skill;
      if (skill === 'speaking' || skill === 'writing') {
        setLoadReductionStats(prev => {
          const newStats = {
            totalResponses: prev.totalResponses + 1,
            clientScored: prev.clientScored + (data.clientScored ? 1 : 0),
            serverLoadReduced: 0
          };
          
          // Calculate server load reduction percentage
          if (newStats.totalResponses > 0) {
            newStats.serverLoadReduced = Math.round((newStats.clientScored / newStats.totalResponses) * 100);
          }
          
          console.log(`📊 Load Reduction Stats (${skill}):`, newStats);
          return newStats;
        });
        
        // Update performance metrics if client scored
        if (data.clientScored && data.computeTimeMs !== undefined) {
          setScoringPerformance({
            computeTimeMs: data.computeTimeMs,
            serverLoadReduction: Math.round((loadReductionStats.clientScored + 1) / (loadReductionStats.totalResponses + 1) * 100)
          });
        }
      }

      // store p/route
      const key = currentItem.skill;
      const curr = skillScores[key] || {};
      const pValue = data.p ?? 0; // Keep as 0-1 range
      if (currentStage === "core") {
        curr.stage1Score = pValue;
        curr.route = data.route;
      } else {
        curr.stage2Score = pValue;
      }
      setSkillScores((prev) => ({ ...prev, [key]: curr }));

      // SPEAKING flow: Q1 -> Q2 (question-based), Q2 -> next skill (prefer writing)
      if (key === "speaking") {
        if (speakingQuestionIndex === 1) {
          // Q1 done - proceed to Q2 based on route decision
          let nextStage: MSTStage;
          if (data.route === "down") {
            nextStage = "lower";
          } else if (data.route === "up") {
            nextStage = "upper";
          } else {
            // route === "stay" - stay at core level
            nextStage = "core";
          }
          console.log(`🎙️ Q1 completed (route=${data.route}), advancing to Q2 with stage: ${nextStage}`);
          resetSpeakingState();
          setSpeakingQuestionIndex(2);
          setCurrentStage(nextStage);
          await fetchNextItemWithStage(nextStage);
          return;
        } else {
          // Q2 done - complete speaking skill and advance to next skill
          console.log(`🎙️ Q2 completed, completing speaking skill`);
          resetSpeakingState();
          setSpeakingQuestionIndex(0);
          // Disable microphone for remainder of test since speaking is complete
          disableMicrophoneForTest();
          
          // Get current scores for speaking skill to pass directly
          const existingScores = skillScores[key] || {};
          const completeScores = {
            stage1Score: existingScores.stage1Score ?? pValue,
            stage2Score: pValue, // Current Q2 score
            route: existingScores.route ?? data.route
          };
          
          console.log("🎙️ Speaking complete - passing scores directly to advanceToNextSkill:", completeScores);
          await advanceToNextSkill(completeScores);
          return;
        }
      }

      if (key === "writing") {
        // Prevent multiple submissions for writing
        if (isSubmissionLocked) {
          console.log("🔒 Writing submission blocked - already processing");
          return;
        }
        setIsSubmissionLocked(true);
        
        // Pass the actual computed scores directly instead of relying on React state
        console.log("📝 Writing complete - passing scores directly to advanceToNextSkill:", {
          pValue,
          stage1Score: pValue,
          route: data.route
        });
        await advanceToNextSkill({
          stage1Score: pValue,
          stage2Score: pValue, // Writing is single-stage, so stage2 = stage1
          route: data.route
        });
        return;
      }

      if (currentStage === "core") {
        // Q1 done for reading/listening - proceed to Q2 based on route decision
        let nextStage: MSTStage;
        if (data.route === "down") {
          nextStage = "lower";
        } else if (data.route === "up") {
          nextStage = "upper";
        } else {
          // route === "stay" - stay at core level
          nextStage = "core";
        }
        console.log(`📚 Q1 completed for ${key} (route=${data.route}), advancing to Q2 with stage: ${nextStage}`);
        setCurrentStage(nextStage);
        await fetchNextItemWithStage(nextStage);
      } else {
        // This is the second stage completion for reading/listening skills
        // Pass the current scores directly to prevent fallback to 0.5
        const existingScores = skillScores[key] || {};
        const completeScores = {
          stage1Score: existingScores.stage1Score ?? 0.5,
          stage2Score: pValue, // Current stage2 score
          route: existingScores.route ?? data.route
        };
        
        console.log("📚 Stage 2 complete for", key, "- passing scores directly to advanceToNextSkill:", completeScores);
        await advanceToNextSkill(completeScores);
      }

      setCurrentResponse("");
      setRecordingBlob(null);
      if (audioElement) {
        audioElement.pause?.();
        setAudioElement(null);
        setIsAudioPlaying(false);
        setAudioProgress(0);
      }
    },
    onError: () => {
      setIsAutoAdvancing(false);
      setIsSubmissionLocked(false);
      setIsProcessingSubmission(false);
      setSubmissionStartTime(0);
      toast({
        title: "Error",
        description: "Failed to submit response.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    let t: number | undefined;
    if (submitResponseMutation.isPending && submissionStartTime > 0) {
      t = window.setTimeout(() => {
        if (submitResponseMutation.isPending) setIsProcessingSubmission(true);
      }, 8000);
    }
    if (!submitResponseMutation.isPending && submissionStartTime > 0) {
      setIsProcessingSubmission(false);
      setSubmissionStartTime(0);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [submitResponseMutation.isPending, submissionStartTime]);

  // Component unmount cleanup - ensure microphone is always released
  useEffect(() => {
    return () => {
      console.log("🧹 MST component unmounting, cleaning up microphone");
      cleanupMicrophone();
    };
  }, []);

  // ---------- API: items
  const fetchFirstItem = async (sessionId: string) => {
    try {
      const r = await fetch(
        `/api/mst/item?skill=listening&stage=core&sessionId=${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        },
      );
      if (!r.ok) throw new Error("first item failed");
      const data = await r.json();
      setCurrentItem(data.item);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNextItemWithStage = async (stage: MSTStage) => {
    if (!currentSession || !status) return;
    try {
      const skill = status.session.skillOrder[currentSkillIndex];
      const r = await fetch(
        `/api/mst/item?skill=${skill}&stage=${stage}&sessionId=${currentSession.sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        },
      );
      if (!r.ok) throw new Error("next item failed");
      const data = await r.json();
      setCurrentItem(data.item);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNextItemWithSkillAndStage = async (
    idx: number,
    stage: MSTStage,
  ) => {
    if (!currentSession || !status) return;
    try {
      const skill = status.session.skillOrder[idx];
      const r = await fetch(
        `/api/mst/item?skill=${skill}&stage=${stage}&sessionId=${currentSession.sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        },
      );
      if (!r.ok) throw new Error("skill+stage item failed");
      const data = await r.json();
      setCurrentItem(data.item);
    } catch (e) {
      console.error(e);
    }
  };

  const advanceToNextSkill = async (providedScores?: {
    stage1Score?: number;
    stage2Score?: number;
    route?: "up" | "down" | "stay";
  }) => {
    if (!currentSession || !status) return;
    const currentSkill = status.session.skillOrder[currentSkillIndex];
    
    // Use provided scores if available, otherwise fall back to React state
    const scores = providedScores || skillScores[currentSkill] || {};
    
    console.log("📊 advanceToNextSkill called for", currentSkill, {
      providedScores,
      reactStateScores: skillScores[currentSkill],
      finalScores: scores
    });
    
    try {
      const payload = {
        sessionId: currentSession.sessionId,
        skill: currentSkill,
        stage1Score: scores.stage1Score ?? 0.5,
        stage2Score: scores.stage2Score ?? scores.stage1Score ?? 0.5,
        route: scores.route ?? "stay",
        timeSpentSec: 60,
      };
      
      console.log("🚀 Sending skill-complete with payload:", payload);
      
      await fetch("/api/mst/skill-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      /* non-fatal */
    }

    const nextIdx = currentSkillIndex + 1;
    if (nextIdx >= status.session.skillOrder.length) {
      setTestPhase("completed");
      await finalizeTest();
    } else {
      setCurrentSkillIndex(nextIdx);
      setCurrentStage("core");
      await fetchNextItemWithSkillAndStage(nextIdx, "core");
    }
  };

  const goToWritingOrNext = async () => {
    if (!currentSession || !status) return;
    const order = status.session.skillOrder;
    const i = order.indexOf("writing");
    if (i !== -1 && i > currentSkillIndex) {
      setCurrentSkillIndex(i);
      setCurrentStage("core");
      await fetchNextItemWithSkillAndStage(i, "core");
    } else {
      // This fallback uses React state since we don't have current response scores
      console.log("⚠️ goToWritingOrNext fallback - using React state scores (not critical path)");
      await advanceToNextSkill();
    }
  };

  const finalizeTest = async () => {
    if (!currentSession) return;
    
    // Ensure microphone is cleaned up when test is finalized
    console.log("🏁 Test finalizing, ensuring microphone cleanup");
    cleanupMicrophone();
    
    try {
      const r = await fetch("/api/mst/finalize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: currentSession.sessionId }),
      });
      if (!r.ok) throw new Error("finalize failed");
      const data = await r.json();
      if (data.success) {
        setTestResults(data.result);
        setTestPhase("goalSelection"); // Go to goal selection instead of showing results directly
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ---------- Per-item setup
  const startItemTimer = (max: number) => {
    setItemTimer(max);
    setGuardTimer(Math.min(2, max));
    setActualTimerSeconds(max); // Track the actual timer value for accurate calculations
  };

  useEffect(() => {
    if (!currentItem || testPhase !== "testing") return;

    if (audioElement && !audioElement.paused) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsAudioPlaying(false);
      setAudioProgress(0);
      setAudioElement(null);
    }

    // Clear all timers FIRST to prevent any stale timer callbacks
    clearTimer(prepIntervalRef);
    clearTimer(recordIntervalRef);
    if (autoplayFallbackTimeoutRef.current) {
      clearTimeout(autoplayFallbackTimeoutRef.current);
      autoplayFallbackTimeoutRef.current = null;
    }
    
    // Reset all refs and phases
    phaseRef.current = "narration";
    hasRecordingStartedRef.current = false;
    hasStoppedRef.current = false;
    audioStartedRef.current = false;
    
    // THEN unlock submissions after all state is clean
    console.log("🔄 Item changed - clearing state for", currentItem.skill, currentItem.id);
    setIsSubmissionLocked(false);
    setIsAutoAdvancing(false);
    
    // Reset listening validation state
    setHasPlayedListening(false);
    setAudioHasEnded(false);

    if (currentItem.skill === "speaking") {
      if (speakingQuestionIndex === 0) setSpeakingQuestionIndex(1);
      resetSpeakingState();
      const url = currentItem.content?.assets?.audio;
      if (url) autoPlayNarration(url);
      else {
        const prompt = currentItem.content?.assets?.prompt;
        if (prompt) {
          generateSpeakingTTS(prompt)
            .then((u) => {
              u ? autoPlayNarration(u) : startPreparationTimer();
            })
            .catch(() => startPreparationTimer());
        } else {
          startPreparationTimer();
        }
      }
    } else if (currentItem.skill === "writing") {
      startItemTimer(currentItem.timing.maxAnswerSec); // Use item's actual timing
    } else if (currentItem.skill === "reading") {
      startItemTimer(currentItem.timing.maxAnswerSec);
    } else if (currentItem.skill === "listening") {
      // For listening, reset validation state and start timer
      setHasPlayedListening(false);
      setAudioHasEnded(false);
      startItemTimer(currentItem.timing.maxAnswerSec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem, currentStage, testPhase]);

  // Generic per-item timer (non-speaking)
  useEffect(() => {
    if (currentItem?.skill === "speaking") {
      setItemTimer(0);
      setGuardTimer(0);
      return;
    }
    if (testPhase === "testing" && itemTimer > 0 && !isSubmissionLocked) {
      const id = window.setInterval(() => {
        setItemTimer((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
        setGuardTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(id);
    }
  }, [testPhase, itemTimer, currentItem?.skill, isSubmissionLocked]);

  const handleAutoSubmit = () => {
    if (!currentSession || !currentItem || isSubmissionLocked) return;
    setIsSubmissionLocked(true);
    setSubmissionStartTime(Date.now());
    // Use consistent time calculation based on actual elapsed time
    const timeSpentMs = (actualTimerSeconds - itemTimer) * 1000;
    submitResponseMutation.mutate({
      sessionId: currentSession.sessionId,
      skill: currentItem.skill,
      stage: currentItem.stage,
      itemId: currentItem.id,
      responseData: currentResponse || "Time expired",
      timeSpentMs,
    });
  };

  // ---------- Microphone management helpers
  const cleanupMicrophone = () => {
    console.log("🎤 Cleaning up microphone access");
    
    // Stop active recording if any
    if (mediaRecorder && mediaRecorder.state === "recording") {
      try {
        mediaRecorder.requestData();
        mediaRecorder.stop();
      } catch (e) {
        console.error("Error stopping MediaRecorder:", e);
      }
    }
    
    // Release current stream
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("🎤 Stopped microphone track:", track.kind);
      });
      currentStreamRef.current = null;
    }
    
    // Clear MediaRecorder reference
    setMediaRecorder(null);
    setIsRecording(false);
    
    console.log("✅ Microphone cleanup complete");
  };
  
  const disableMicrophoneForTest = () => {
    console.log("🚫 Disabling microphone for remainder of test");
    cleanupMicrophone();
    setIsMicrophoneDisabled(true);
  };

  // ---------- Speaking flow helpers
  const resetSpeakingState = () => {
    clearTimer(prepIntervalRef);
    clearTimer(recordIntervalRef);
    phaseRef.current = "narration";
    hasRecordingStartedRef.current = false;
    hasStoppedRef.current = false;
    setSpeakingPhase("narration");
    setPrepTimer(PREP_SEC);
    setRecordTimer(RECORD_SEC);
    setPrepTimeDisplay(formatTime(PREP_SEC));
    setRecordTimeDisplay(formatTime(RECORD_SEC));
    setIsRecording(false);
    setRecordingBlob(null);
    // CRITICAL: Clear stale blob from previous question to prevent duplicate submissions
    lastBlobRef.current = null;
    console.log("🔄 Speaking state reset: cleared recording blob and lastBlobRef");
  };

  const autoPlayNarration = async (audioUrl: string) => {
    // Prevent audio during writing questions to avoid unwanted notifications
    if (currentItem?.skill === "writing") {
      console.log("🔇 Skipping audio for writing question");
      return;
    }
    
    try {
      const audio = new Audio(audioUrl);
      audioStartedRef.current = false;

      if (autoplayFallbackTimeoutRef.current) {
        clearTimeout(autoplayFallbackTimeoutRef.current);
        autoplayFallbackTimeoutRef.current = null;
      }

      audio.addEventListener("play", () => {
        audioStartedRef.current = true;
        if (autoplayFallbackTimeoutRef.current) {
          clearTimeout(autoplayFallbackTimeoutRef.current);
          autoplayFallbackTimeoutRef.current = null;
        }
      });
      audio.addEventListener("timeupdate", () => {
        if (audio.duration)
          setAudioProgress((audio.currentTime / audio.duration) * 100);
      });
      audio.addEventListener("ended", () => {
        setIsAudioPlaying(false);
        setAudioProgress(0);
        setNarrationPlayButton(false);
        startPreparationTimer();
      });
      audio.addEventListener("error", () => {
        setIsAudioPlaying(false);
        setNarrationPlayButton(true);
        if (!audioStartedRef.current && phaseRef.current === "narration")
          startPreparationTimer();
      });

      setAudioElement(audio);
      autoplayFallbackTimeoutRef.current = window.setTimeout(() => {
        if (!audioStartedRef.current && phaseRef.current === "narration")
          startPreparationTimer();
      }, 3000);

      await audio.play();
      setIsAudioPlaying(true);
      setNarrationPlayButton(false);
    } catch {
      if (!audioStartedRef.current && phaseRef.current === "narration") {
        setIsAudioPlaying(false);
        if (!autoplayFallbackTimeoutRef.current) {
          autoplayFallbackTimeoutRef.current = window.setTimeout(() => {
            if (!audioStartedRef.current && phaseRef.current === "narration")
              startPreparationTimer();
          }, 1000);
        }
      }
    }
  };

  const playNarrationManually = async () => {
    if (!audioElement) return;
    try {
      await audioElement.play();
      setIsAudioPlaying(true);
      setNarrationPlayButton(false);
    } catch {
      startPreparationTimer();
    }
  };

  const startPreparationTimer = () => {
    if (phaseRef.current === "preparation") return;
    phaseRef.current = "preparation";
    setSpeakingPhase("preparation");

    clearTimer(prepIntervalRef);
    const deadline = Date.now() + PREP_SEC * 1000;
    setPrepTimer(PREP_SEC);
    setPrepTimeDisplay(formatTime(PREP_SEC));

    const tick = () => {
      const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setPrepTimer(remain);
      setPrepTimeDisplay(formatTime(remain));
      if (remain <= 0) {
        clearTimer(prepIntervalRef);
        playBeepAndStartRecording();
      }
    };
    prepIntervalRef.current = window.setInterval(tick, 100);
  };

  const playBeepAndStartRecording = () => {
    setSpeakingPhase("recording");
    setRecordTimer(RECORD_SEC);
    setRecordTimeDisplay(formatTime(RECORD_SEC));
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      /* noop */
    }
    setTimeout(() => {
      if (!isSubmissionLocked) {
        startRecording();
        startRecordingTimer();
      }
    }, 300);
  };

  const startRecording = async () => {
    // Prevent recording if microphone is disabled
    if (isMicrophoneDisabled) {
      console.log("🚫 Recording blocked - microphone disabled for test");
      return;
    }
    
    if (hasRecordingStartedRef.current || isRecording) return;

    hasRecordingStartedRef.current = true;
    hasStoppedRef.current = false;
    phaseRef.current = "recording";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Track the current stream for cleanup
      currentStreamRef.current = stream;
      console.log("🎤 New MediaStream created and tracked");

      const mimeType = pickAudioMime();
      const rec = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      // Snapshot at start (prevents stale state during onstop)
      const snap =
        currentItem && currentSession
          ? {
              sessionId: currentSession.sessionId,
              skill: currentItem.skill,
              stage: currentItem.stage,
              itemId: currentItem.id,
              mimeType: mimeType || "audio/webm",
            }
          : null;

      const chunks: BlobPart[] = [];
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) chunks.push(ev.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: snap?.mimeType || "audio/webm" });
        lastBlobRef.current = blob;
        setRecordingBlob(blob);
        setSpeakingPhase("completed");
        setIsRecording(false);

        // Stop all tracks from this recording session
        stream.getTracks().forEach((t) => t.stop());
        // Clear the tracked stream reference
        if (currentStreamRef.current === stream) {
          currentStreamRef.current = null;
        }
        clearTimer(recordIntervalRef);

        // Submit even if tiny blob; backend can validate
        if (!isAutoAdvancing) submitSpeakingBlob(blob, snap || undefined);
      };

      setMediaRecorder(rec);
      setIsRecording(true);

      // Timeslice ensures ondataavailable (Safari/Firefox)
      rec.start(1000);

      // Hard watchdog: force stop after limit + small buffer
      const length = (currentItem?.timing?.recordSec ?? RECORD_SEC) + 2;
      window.setTimeout(() => {
        if (rec.state === "recording") {
          try {
            rec.requestData();
          } catch {}
          rec.stop();
        }
      }, length * 1000);
    } catch (e) {
      hasRecordingStartedRef.current = false;
      phaseRef.current = "narration";
      setIsRecording(false);
      // Clear stream reference on error
      currentStreamRef.current = null;
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access and try again.",
        variant: "destructive",
      });
      console.error("startRecording failed:", e);
    }
  };

  const submitSpeakingBlob = (
    blob: Blob,
    snap?: {
      sessionId: string;
      skill: MSTSkill;
      stage: MSTStage;
      itemId: string;
      mimeType?: string;
    },
  ) => {
    console.log("🚀 submitSpeakingBlob called", {
      blobSize: blob.size,
      hasSnap: !!snap,
      snapItemId: snap?.itemId,
      currentItemId: currentItem?.id,
      isSubmissionLocked,
      speakingQuestionIndex,
      currentStage
    });
    
    const sessionId = snap?.sessionId || currentSession?.sessionId;
    const skill = snap?.skill || currentItem?.skill;
    const stage = snap?.stage || currentItem?.stage;
    const itemId = snap?.itemId || currentItem?.id;
    
    if (!sessionId || !skill || !stage || !itemId) {
      console.error("❌ Missing submission snapshot/state", {
        snap,
        currentItem,
        currentSession,
      });
      return;
    }
    
    if (isSubmissionLocked) {
      console.log("🚫 Submission locked, skipping duplicate");
      return;
    }

    console.log("📤 Proceeding with submission", {
      sessionId: sessionId.substring(0, 10) + "...",
      skill,
      stage,
      itemId,
      blobSize: blob.size
    });

    setIsSubmissionLocked(true);
    setIsAutoAdvancing(true);
    setSubmissionStartTime(Date.now());
    const timeSpentMs =
      ((currentItem?.timing?.prepSec ?? PREP_SEC) +
        (currentItem?.timing?.recordSec ?? RECORD_SEC)) *
      1000;

    submitResponseMutation.mutate({
      sessionId,
      skill,
      stage,
      itemId,
      audioBlob: blob,
      timeSpentMs,
    });
  };

  const finalizeRecordingAndSubmit = () => {
    console.log("🎙️ finalizeRecordingAndSubmit called", {
      isSubmissionLocked,
      hasStoppedRef: hasStoppedRef.current,
      mediaRecorderState: mediaRecorder?.state,
      recordingBlob: !!recordingBlob,
      lastBlobRef: !!lastBlobRef.current,
      speakingPhase,
      currentItemId: currentItem?.id
    });
    
    if (isSubmissionLocked || hasStoppedRef.current) {
      console.log("🚫 Submission blocked by guards");
      return;
    }
    
    if (mediaRecorder && mediaRecorder.state === "recording") {
      hasStoppedRef.current = true;
      console.log("🔴 Stopping active recording");
      try {
        mediaRecorder.requestData();
      } catch {}
      mediaRecorder.stop();
    } else {
      // CRITICAL: Only submit if we have a valid recording blob
      const blob = recordingBlob || lastBlobRef.current;
      if (!blob || blob.size === 0) {
        console.log("🚫 No valid recording blob to submit, skipping");
        return;
      }
      
      console.log("📤 Submitting speaking blob", {
        blobSize: blob.size,
        source: recordingBlob ? "recordingBlob" : "lastBlobRef"
      });
      submitSpeakingBlob(blob, undefined);
    }
  };

  const startRecordingTimer = () => {
    if (recordIntervalRef.current != null) return;
    const length = currentItem?.timing?.recordSec ?? RECORD_SEC;
    const deadline = Date.now() + length * 1000;
    setRecordTimer(length);
    setRecordTimeDisplay(formatTime(length));

    const tick = () => {
      const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRecordTimer(remain);
      setRecordTimeDisplay(formatTime(remain));
      if (remain <= 0) {
        clearTimer(recordIntervalRef);
        finalizeRecordingAndSubmit();
      }
    };
    recordIntervalRef.current = window.setInterval(tick, 100);
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      clearTimer(recordIntervalRef);
      if (!hasStoppedRef.current) {
        hasStoppedRef.current = true;
        mediaRecorder.stop();
      }
    }
  };

  // ---------- TTS (optional)
  const generateSpeakingTTS = async (text: string) => {
    if (!text || isGeneratingTTS) return null;
    setIsGeneratingTTS(true);
    try {
      const r = await fetch("/api/tts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ text, language: "english", speed: 1.0 }),
      });
      if (!r.ok) throw new Error("tts failed");
      const data = await r.json();
      if (data.success && data.audioUrl) {
        if (currentItem) {
          const next = {
            ...currentItem,
            content: {
              ...(currentItem.content || {}),
              assets: {
                ...(currentItem.content?.assets || {}),
                audio: data.audioUrl,
              },
            },
          };
          setCurrentItem(next);
        }
        return data.audioUrl;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  // ---------- Listening audio
  const playAudio = async () => {
    const src = currentItem?.content?.assets?.audio;
    if (!src) {
      toast({
        title: "Error",
        description: "No audio available for this item",
        variant: "destructive",
      });
      return;
    }
    try {
      if (!audioElement) {
        const audio = new Audio();
        audio.addEventListener("timeupdate", () => {
          if (audio.duration)
            setAudioProgress((audio.currentTime / audio.duration) * 100);
        });
        audio.addEventListener("ended", () => {
          setIsAudioPlaying(false);
          setAudioProgress(0);
          if (currentItem?.skill === "listening") {
            setAudioHasEnded(true);
            setHasPlayedListening(true);
            startItemTimer(currentItem.timing.maxAnswerSec);
          } else if (currentItem?.skill === "speaking") startPreparationTimer();
        });
        audio.addEventListener("play", () => {
          if (currentItem?.skill === "listening") {
            setHasPlayedListening(true);
          }
        });
        audio.addEventListener("error", () =>
          toast({
            title: "Audio Error",
            description: "Failed to load audio file",
            variant: "destructive",
          }),
        );
        audio.src = src;
        setAudioElement(audio);
        await audio.play();
        setIsAudioPlaying(true);
        if (currentItem?.skill === "listening") {
          setHasPlayedListening(true);
        }
      } else {
        if (isAudioPlaying) {
          audioElement.pause();
          setIsAudioPlaying(false);
        } else {
          await audioElement.play();
          setIsAudioPlaying(true);
          if (currentItem?.skill === "listening") {
            setHasPlayedListening(true);
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Playback Error",
        description: "Failed to play audio.",
        variant: "destructive",
      });
    }
  };

  // ---------- Submit (non-speaking)
  const isValidResponse = () => {
    if (!currentItem) return false;
    
    // Listening validation: check if audio has been played
    if (currentItem.skill === "listening" && !hasPlayedListening) {
      return false;
    }
    
    if (currentItem.skill === "listening" || currentItem.skill === "reading") {
      if (!currentResponse) return false;
      if (Array.isArray(currentResponse)) {
        const n = currentItem.content?.questions?.length || 0;
        return (
          currentResponse.length >= n &&
          currentResponse.every(
            (r: any) => r !== null && r !== undefined && r !== "",
          )
        );
      }
      return false;
    }
    if (currentItem.skill === "writing") {
      if (typeof currentResponse !== "string" || !currentResponse.trim())
        return false;
      const words = currentResponse.trim().split(/\s+/).filter(Boolean).length;
      return words >= 80;
    }
    return false;
  };

  const handleSubmit = () => {
    if (!currentSession || !currentItem || isSubmissionLocked)
      return;
    
    // Allow early submission for writing but warn about word count
    if (currentItem.skill === "writing" && guardTimer > 0) {
      const currentText = currentResponse?.toString() || "";
      const wordCount = currentText.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      if (wordCount < 80) {
        toast({
          title: "Low Word Count Warning",
          description: `You have ${wordCount} words. For better scoring, aim for at least 80 words.`,
          variant: "default",
        });
      }
    }
    
    // For non-writing skills, respect guard timer
    if (currentItem.skill !== "writing" && guardTimer > 0)
      return;
    
    // Listening validation: show toast if audio hasn't been played
    if (currentItem.skill === "listening" && !hasPlayedListening) {
      toast({
        title: "Audio Required",
        description: "Please listen to the audio file before submitting your answer.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmissionLocked(true);
    setSubmissionStartTime(Date.now());
    if (audioElement && !audioElement.paused) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    const timeSpentMs = (actualTimerSeconds - itemTimer) * 1000;
    submitResponseMutation.mutate({
      sessionId: currentSession.sessionId,
      skill: currentItem.skill,
      stage: currentItem.stage,
      itemId: currentItem.id,
      responseData: currentResponse,
      timeSpentMs,
    });
  };

  // ---------- Render
  if (testPhase === "intro") {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl" style={mstStyle}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              MST Placement Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-sm">
              Listening • Reading • Speaking • Writing • Auto-advance • 2 stages
              per skill
            </div>
            <div className="text-center">
              <Button
                onClick={() => startSessionMutation.mutate()}
                disabled={startSessionMutation.isPending}
                size="lg"
              >
                {startSessionMutation.isPending
                  ? "Starting..."
                  : "Start MST Test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testPhase === "completed") {
    if (!testResults) {
      return (
        <div
          className="container mx-auto p-4 sm:p-6 max-w-4xl"
          style={mstStyle}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Processing Results...
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p>Calculating your proficiency...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const getSkillIcon = (skill: string) => {
      switch (skill) {
        case 'speaking': return '🗣️';
        case 'listening': return '👂';
        case 'reading': return '📖';
        case 'writing': return '✍️';
        default: return '📚';
      }
    };

    const getSkillColor = (level: string) => {
      switch (level?.toUpperCase()) {
        case 'A1': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'A2': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        case 'B1': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'B2': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'C1': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case 'C2': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      }
    };

    const handleCreateRoadmap = () => {
      if (!testResults || !currentSession) {
        toast({
          title: "Error",
          description: "MST results not available. Please complete the test first.",
          variant: "destructive"
        });
        return;
      }

      // Create comprehensive placement results using actual MST data
      const placementResults = {
        overallBand: testResults.overallBand,
        overallCEFRLevel: testResults.overallBand,
        scores: {
          overall: testResults.overallConfidence ? Math.round(testResults.overallConfidence * 100) : 0,
          speaking: testResults.skills?.find(s => s.skill === 'speaking')?.confidence ? 
                   Math.round(testResults.skills.find(s => s.skill === 'speaking').confidence * 100) : 0,
          listening: testResults.skills?.find(s => s.skill === 'listening')?.confidence ? 
                    Math.round(testResults.skills.find(s => s.skill === 'listening').confidence * 100) : 0,
          reading: testResults.skills?.find(s => s.skill === 'reading')?.confidence ? 
                  Math.round(testResults.skills.find(s => s.skill === 'reading').confidence * 100) : 0,
          writing: testResults.skills?.find(s => s.skill === 'writing')?.confidence ? 
                  Math.round(testResults.skills.find(s => s.skill === 'writing').confidence * 100) : 0
        },
        levels: {
          speaking: testResults.skills?.find(s => s.skill === 'speaking')?.band || 
                   testResults.overallBand,
          listening: testResults.skills?.find(s => s.skill === 'listening')?.band || 
                    testResults.overallBand,
          reading: testResults.skills?.find(s => s.skill === 'reading')?.band || 
                  testResults.overallBand,
          writing: testResults.skills?.find(s => s.skill === 'writing')?.band || 
                  testResults.overallBand
        },
        confidence: {
          speaking: testResults.skills?.find(s => s.skill === 'speaking')?.confidence || 0,
          listening: testResults.skills?.find(s => s.skill === 'listening')?.confidence || 0,
          reading: testResults.skills?.find(s => s.skill === 'reading')?.confidence || 0,
          writing: testResults.skills?.find(s => s.skill === 'writing')?.confidence || 0
        },
        // Use MST session ID directly - roadmap will handle MST-specific logic
        sessionId: currentSession.sessionId,
        sessionType: 'mst', // Flag to indicate this is from MST, not placement test
        recommendations: testResults.recommendations || []
      };
      
      console.log('💾 Saving MST results for roadmap:', placementResults);
      localStorage.setItem('placementResults', JSON.stringify(placementResults));
      
      toast({
        title: "Results Saved",
        description: "Your MST results have been saved. Creating your personalized roadmap...",
      });
      
      // Navigate to roadmap page
      window.location.href = "/roadmap";
    };

    const handleRetakeTest = () => {
      // Reset all state and restart the test
      setTestPhase("intro");
      setCurrentSession(null);
      setCurrentItem(null);
      setCurrentSkillIndex(0);
      setCurrentStage("core");
      setTestResults(null);
      setCurrentResponse("");
      setItemTimer(0);
      setGuardTimer(0);
      setHasPlayedListening(false);
      setAudioHasEnded(false);
      setSpeakingPhase("narration");
      setIsRecording(false);
      setRecordedBlob(null);
      setSkillScores({});
      setLoadReductionStats({ totalResponses: 0, clientScored: 0, serverLoadReduced: 0 });
      setScoringPerformance({ computeTimeMs: 0, serverLoadReduction: 0 });
      
      toast({
        title: t("mst.retakeTest"),
        description: t("mst.retakeTestDesc"),
      });
    };

    const generateFarsiRecommendations = (testResults: any): string[] => {
      const recommendations: string[] = [];
      const skills = testResults.skills || [];
      
      // Analyze each skill individually with specific recommendations
      skills.forEach((skill: any) => {
        const band = skill.band || '';
        const confidence = Math.round((skill.confidence || 0) * 100);
        
        if (skill.skill === 'listening') {
          if (band.startsWith('A1') || band.startsWith('A2')) {
            recommendations.push(`📻 شنیداری (${band}): روزانه ۱۵ دقیقه پادکست مبتدی انگلیسی گوش دهید، از فیلم‌های انگلیسی با زیرنویس فارسی استفاده کنید`);
            recommendations.push(`🎵 آهنگ‌های ساده انگلیسی بشنوید و سعی کنید کلمات را تشخیص دهید`);
          } else if (band.startsWith('B1')) {
            recommendations.push(`📺 شنیداری (${band}): سریال‌های انگلیسی با زیرنویس انگلیسی ببینید، روزانه ۳۰ دقیقه اخبار BBC Learning English گوش دهید`);
          }
        }
        
        if (skill.skill === 'speaking') {
          if (band.startsWith('A1') || band.startsWith('A2')) {
            recommendations.push(`🗣️ گفتاری (${band}): روزانه ۱۰ دقیقه با خودتان انگلیسی صحبت کنید، صدای خود را ضبط کنید و گوش دهید`);
            recommendations.push(`📱 از اپلیکیشن Speechify یا Google Translate برای تمرین تلفظ استفاده کنید`);
            recommendations.push(`👥 در گروه‌های مکالمه آنلاین شرکت کنید (مثل HelloTalk، Tandem)`);
          } else if (band.startsWith('B1')) {
            recommendations.push(`🎯 گفتاری (${band}): ۲۰ دقیقه روزانه درباره موضوعات مختلف صحبت کنید، ویدیوهای کوتاه خودتان بسازید`);
          }
        }
        
        if (skill.skill === 'reading') {
          if (band.startsWith('A1') || band.startsWith('A2')) {
            recommendations.push(`📖 خواندن (${band}): کتاب‌های داستان ساده برای کودکان بخوانید، روزانه ۱۰ صفحه از graded readers`);
            recommendations.push(`📰 اخبار ساده از News in Levels (سطح ۱-۲) مطالعه کنید`);
          } else if (band.startsWith('C')) {
            recommendations.push(`📚 خواندن (${band}): مجلات تخصصی، کتاب‌های غیرداستانی و مقالات علمی بخوانید`);
          }
        }
        
        if (skill.skill === 'writing') {
          if (band.startsWith('A1') || band.startsWith('A2')) {
            recommendations.push(`✍️ نوشتن (${band}): روزانه ۱ پاراگراف درباره روزتان بنویسید، از Grammarly برای بررسی استفاده کنید`);
            recommendations.push(`📝 ایمیل‌های ساده و پیام‌های کوتاه انگلیسی بنویسید`);
          } else if (band.startsWith('C')) {
            recommendations.push(`🔍 نوشتن (${band}): مقالات نقدی، گزارش‌های تحلیلی و متون پیچیده بنویسید`);
          }
        }
      });
      
      // Add general recommendations based on overall performance
      const averageLevel = testResults.overallBand;
      if (averageLevel.startsWith('A')) {
        recommendations.push(`🎯 برنامه مطالعه: هفته‌ای ۳ ساعت کلاس آنلاین، ۲ ساعت تمرین شخصی`);
        recommendations.push(`📅 هدف کوتاه‌مدت: ظرف ۳ ماه به سطح A2 برسید`);
      } else if (averageLevel.startsWith('B')) {
        recommendations.push(`🎯 برنامه مطالعه: هفته‌ای ۴ ساعت مطالعه منظم، ۱ ساعت مکالمه با native speaker`);
        recommendations.push(`🏆 آماده شدن برای آزمون‌های IELTS یا TOEFL را در نظر بگیرید`);
      }
      
      // Add specific technical recommendations
      if (testResults.overallConfidence && testResults.overallConfidence < 0.7) {
        recommendations.push(`⚠️ توجه: اطمینان نتایج پایین است (${Math.round(testResults.overallConfidence * 100)}%) - بهتر است آزمون را مجدداً انجام دهید`);
      }
      
      return recommendations;
    };

    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl" style={mstStyle}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Trophy className="h-12 w-12 text-yellow-500" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MST Test Complete!
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300">Your English proficiency assessment results</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl font-bold mb-4">
                {testResults.overallBand}
              </div>
              <div className="text-xl font-semibold">{t("mst.overallCEFRLevel")}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("mst.confidence")}: {testResults.overallConfidence ? Math.round(testResults.overallConfidence * 100) : 'N/A'}%
              </div>
            </div>

            {/* Individual Skills Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center flex items-center justify-center gap-2">
                <Target className="h-5 w-5" />
                {t("mst.individualSkillsBreakdown")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['speaking', 'listening', 'reading', 'writing'].map((skill) => {
                  // Find the actual skill result from the MST calculation
                  const skillResult = testResults.skills?.find(s => s.skill === skill);
                  
                  // Use actual calculated band and confidence, with fallback to overall band only if skill not found
                  const level = skillResult?.band || testResults.overallBand || 'A1';
                  const confidence = skillResult?.confidence || 0;
                  const confidencePercent = Math.round(confidence * 100);
                  
                  return (
                    <div key={skill} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" data-testid={`icon-skill-${skill}`}>{getSkillIcon(skill)}</span>
                        <div>
                          <div className="font-medium" data-testid={`skill-name-${skill}`}>{t(`mst.${skill}`)}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400" data-testid={`skill-score-${skill}`}>
                            {skillResult ? `${t('mst.confidence')}: ${confidencePercent}%` : 'Not completed'}
                          </div>
                        </div>
                      </div>
                      <Badge className={getSkillColor(level)} data-testid={`skill-level-${skill}`}>
                        {level}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            {(() => {
              const farsiRecommendations = generateFarsiRecommendations(testResults);
              return farsiRecommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {t("mst.recommendations")}
                  </h3>
                  <ul className="space-y-2">
                    {farsiRecommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                size="lg"
                onClick={handleCreateRoadmap}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                data-testid="button-create-roadmap"
              >
                <Map className="w-5 h-5 mr-2" />
                {t("mst.createLearningRoadmap")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleRetakeTest}
                className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                data-testid="button-retake-test"
              >
                <Trophy className="w-5 h-5 mr-2" />
                {t("mst.retakeTest")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = "/dashboard")}
                className="flex-1"
                data-testid="button-return-dashboard"
              >
                {t("mst.returnToDashboard")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      key={`mst-${currentItem?.skill}-${currentStage}-${currentItem?.id}`}
      className="container mx-auto p-4 sm:p-6 max-w-4xl"
      style={mstStyle}
    >
      {isProcessingSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <h3 className="text-lg font-semibold">
                🎙️ Processing Speaking Response...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This may take up to 30 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">
                MST Test - {currentItem?.skill?.toUpperCase()}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentStage}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {currentItem?.cefr}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
              <div className="text-center sm:text-left">
                <div className="text-sm text-gray-600">Question Progress</div>
              </div>
              <div className="text-center sm:text-right">
                {currentItem?.skill === "speaking" ? (
                  speakingPhase === "preparation" ? (
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-orange-600">
                        {prepTimeDisplay}
                      </div>
                      <div className="text-xs text-orange-500">
                        Preparation Time
                      </div>
                    </div>
                  ) : speakingPhase === "recording" ? (
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-red-600">
                        {recordTimeDisplay}
                      </div>
                      <div className="text-xs text-red-500">Recording Time</div>
                    </div>
                  ) : speakingPhase === "narration" ? (
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-blue-600">
                        🎧 Listening
                      </div>
                      <div className="text-xs text-blue-500">
                        Question Audio
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-green-600">
                        ✓ Complete
                      </div>
                      <div className="text-xs text-green-500">
                        Recording Ready
                      </div>
                    </div>
                  )
                ) : (
                  <div>
                    <div
                      className={`text-lg sm:text-xl font-bold ${itemTimer > 0 && itemTimer <= 3 ? "text-red-600 animate-bounce" : itemTimer <= 10 && itemTimer > 0 ? "text-red-500 animate-pulse" : ""}`}
                    >
                      {formatTime(itemTimer)}
                    </div>
                    <div className="text-xs text-gray-500">Time Remaining</div>
                  </div>
                )}
              </div>
            </div>
            <Progress
              value={status ? (status.timing.totalElapsedSec / 600) * 100 : 0}
              className="h-2"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentItem && (
            <>
              {/* Listening */}
              {currentItem.skill === "listening" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <Button
                      onClick={playAudio}
                      variant="outline"
                      size="default"
                      className="w-full sm:w-auto min-h-[48px] font-medium"
                      data-testid="button-play-audio"
                      disabled={!currentItem?.content?.assets?.audio}
                    >
                      {isAudioPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {isAudioPlaying ? "Pause" : "Play"} Audio
                    </Button>
                    <div className="flex-1 flex items-center gap-2">
                      <Progress value={audioProgress} className="h-3 flex-1" />
                      <span className="text-xs text-gray-500 min-w-[3rem] text-right">
                        {audioProgress > 0 && `${Math.round(audioProgress)}%`}
                      </span>
                    </div>
                  </div>

                  {currentItem.content.questions?.map((q: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-medium">{q.stem}</h3>
                      <RadioGroup
                        value={currentResponse[idx]?.toString() || ""}
                        onValueChange={(value) => {
                          const arr = Array.isArray(currentResponse)
                            ? [...currentResponse]
                            : new Array(
                                currentItem.content.questions.length,
                              ).fill("");
                          arr[idx] = value;
                          setCurrentResponse(arr);
                        }}
                      >
                        {q.options?.map((opt: string, j: number) => {
                          const id = `l${idx}-opt${j}`;
                          return (
                            <div
                              key={j}
                              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[48px]"
                            >
                              <RadioGroupItem value={j.toString()} id={id} />
                              <Label
                                htmlFor={id}
                                className="cursor-pointer flex-1 leading-relaxed text-sm sm:text-base"
                              >
                                {opt}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              )}

              {/* Reading */}
              {currentItem.skill === "reading" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {currentItem.content.assets?.passage}
                    </p>
                  </div>

                  {currentItem.content.questions?.map((q: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-medium">{q.stem}</h3>
                      {q.type === "mcq_single" && (
                        <RadioGroup
                          value={currentResponse[idx]?.toString() || ""}
                          onValueChange={(value) => {
                            const arr = Array.isArray(currentResponse)
                              ? [...currentResponse]
                              : new Array(
                                  currentItem.content.questions.length,
                                ).fill("");
                            arr[idx] = value;
                            setCurrentResponse(arr);
                          }}
                        >
                          {q.options?.map((opt: string, j: number) => {
                            const id = `r${idx}-opt${j}`;
                            return (
                              <div
                                key={j}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem value={j.toString()} id={id} />
                                <Label htmlFor={id} className="cursor-pointer">
                                  {opt}
                                </Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      )}
                      {q.type === "mcq_multi" && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 mb-3">
                            Select all that apply:
                          </p>
                          {q.options?.map((opt: string, j: number) => {
                            const id = `rm${idx}-opt${j}`;
                            const checked =
                              currentResponse[idx] &&
                              Array.isArray(currentResponse[idx]) &&
                              currentResponse[idx].includes(j);
                            return (
                              <div
                                key={j}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[48px]"
                              >
                                <Checkbox
                                  id={id}
                                  checked={checked}
                                  onCheckedChange={(c) => {
                                    const arr = Array.isArray(currentResponse)
                                      ? [...currentResponse]
                                      : new Array(
                                          currentItem.content.questions.length,
                                        ).fill([]);
                                    let curr = Array.isArray(arr[idx])
                                      ? [...arr[idx]]
                                      : [];
                                    if (c) {
                                      if (!curr.includes(j)) curr.push(j);
                                    } else {
                                      curr = curr.filter(
                                        (x: number) => x !== j,
                                      );
                                    }
                                    arr[idx] = curr;
                                    setCurrentResponse(arr);
                                  }}
                                />
                                <Label
                                  htmlFor={id}
                                  className="cursor-pointer flex-1 leading-relaxed text-sm sm:text-base"
                                >
                                  {opt}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Speaking */}
              {currentItem.skill === "speaking" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Speaking Task</h3>
                    <p className="text-sm">
                      {currentItem.content.assets?.prompt}
                    </p>
                  </div>

                  <div className="text-center space-y-4">
                    {speakingPhase === "narration" && (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold text-blue-600">
                          🎧 Listen to the question
                        </div>
                        <p className="text-sm text-gray-600">
                          The question is being read to you...
                        </p>
                        {(narrationPlayButton ||
                          currentItem.content.assets?.audio) && (
                          <Button
                            onClick={
                              narrationPlayButton
                                ? playNarrationManually
                                : playAudio
                            }
                            disabled={isAudioPlaying || isGeneratingTTS}
                            size="lg"
                            className="w-full sm:w-auto min-h-[52px] text-base font-medium"
                            data-testid="button-play-narration"
                            variant={
                              narrationPlayButton ? "default" : "outline"
                            }
                          >
                            {isGeneratingTTS ? (
                              <>
                                <Volume2 className="w-5 h-5 mr-2 animate-pulse" />
                                Generating Audio...
                              </>
                            ) : isAudioPlaying ? (
                              <>
                                <Volume2 className="w-5 h-5 mr-2" />
                                Playing Question...
                              </>
                            ) : narrationPlayButton ? (
                              <>
                                <Play className="w-5 h-5 mr-2" />
                                Click to Play Question
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5 mr-2" />
                                Play Question
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    {speakingPhase === "preparation" && (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold text-orange-600">
                          ⏰ Preparation Time
                        </div>
                        <div className="text-4xl font-mono font-bold text-orange-600">
                          {prepTimeDisplay}
                        </div>
                        <p className="text-sm text-gray-600">
                          Recording will start automatically.
                        </p>
                      </div>
                    )}

                    {speakingPhase === "recording" && (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold text-red-600">
                          🎙️ Recording Now
                        </div>
                        <div className="text-4xl font-mono font-bold text-red-600">
                          {recordTimeDisplay}
                        </div>
                        <div className="flex justify-center">
                          <div className="animate-pulse bg-red-500 rounded-full w-6 h-6"></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Auto-stops at the time limit.
                        </p>
                        <Button
                          onClick={stopRecording}
                          variant="destructive"
                          size="lg"
                          className="w-full sm:w-auto min-h-[52px] text-base font-medium"
                          data-testid="button-stop-recording"
                        >
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording Early
                        </Button>
                      </div>
                    )}

                    {speakingPhase === "completed" && recordingBlob && (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold text-green-600">
                          ✅ Recording Complete
                        </div>
                        <p className="text-sm text-green-600">
                          Submitting automatically...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Writing */}
              {currentItem.skill === "writing" && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Writing Task</h3>
                    <p className="text-sm">
                      {currentItem.content.assets?.prompt}
                    </p>
                    <div className="mt-2 text-xs text-gray-600">
                      Minimum 80 words
                    </div>
                  </div>
                  <div>
                    <Textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      placeholder="Type your response here..."
                      className="min-h-[200px] text-base"
                      data-testid="textarea-writing"
                    />
                    <div className="mt-2 text-xs text-gray-600">
                      Words:{" "}
                      {currentResponse?.trim().split(/\s+/).filter(Boolean)
                        .length || 0}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit (hidden for speaking) */}
              {currentItem.skill !== "speaking" && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                    {guardTimer > 0 && currentItem?.skill !== "writing" && (
                      <span>
                        Please wait {guardTimer} seconds before submitting
                      </span>
                    )}
                    {currentItem?.skill === "writing" && (
                      <span className="text-green-600">
                        You may submit anytime. Minimum 80 words recommended for best scoring.
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      (currentItem?.skill !== "writing" && guardTimer > 0) ||
                      submitResponseMutation.isPending ||
                      isSubmissionLocked ||
                      !isValidResponse()
                    }
                    size="lg"
                    className="w-full sm:w-auto min-h-[52px] text-base font-medium"
                    data-testid="button-submit"
                  >
                    {submitResponseMutation.isPending
                      ? "Submitting..."
                      : currentItem?.skill === "writing" ? "Submit Writing" : "Submit Response"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
