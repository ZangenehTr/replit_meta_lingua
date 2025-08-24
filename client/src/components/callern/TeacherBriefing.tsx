import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  BookOpen,
  Target,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  Phone,
  PhoneOff,
  FileText,
  Languages,
  TrendingUp,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

interface StudentInfo {
  id: number;
  name: string;
  level: string;
  course: string;
  language: string;
  previousSessions: number;
  averageScore: number;
  strengths: string[];
  weaknesses: string[];
  learningGoals: string[];
  preferredTopics: string[];
  mood?: string;
  lastSessionNotes?: string;
}

interface TeacherBriefingProps {
  studentInfo: StudentInfo;
  roomId: string;
  onAccept: () => void;
  onReject: () => void;
  isVisible: boolean;
}

export function TeacherBriefing({ 
  studentInfo, 
  roomId, 
  onAccept, 
  onReject, 
  isVisible 
}: TeacherBriefingProps) {
  const { t } = useTranslation();
  const [timeToDecide, setTimeToDecide] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [briefingData, setBriefingData] = useState<any>(null);

  useEffect(() => {
    if (!isVisible) return;

    // Countdown timer
    const timer = setInterval(() => {
      setTimeToDecide(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(); // Auto-reject if no response
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Fetch additional briefing data
    fetchBriefingData();

    return () => clearInterval(timer);
  }, [isVisible]);

  const fetchBriefingData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/callern/teacher-briefing/${studentInfo.id}`);
      const data = await response.json();
      setBriefingData(data);
    } catch (error) {
      console.error('Error fetching briefing data:', error);
    }
    setIsLoading(false);
  };

  const handleAccept = () => {
    onAccept();
  };

  const handleReject = () => {
    onReject();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl"
        >
          <Card className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-500/20 shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Phone className="w-8 h-8 text-green-400 animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Incoming Callern Request</h2>
                    <p className="text-sm text-purple-300">Review student profile before accepting</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-mono text-white">{timeToDecide}s</div>
                  <Progress value={(timeToDecide / 30) * 100} className="w-24 h-2 mt-1" />
                </div>
              </div>

              {/* Student Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Basic Info */}
                <Card className="bg-black/30 backdrop-blur border-white/10 p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <User className="w-5 h-5 text-blue-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">Student Profile</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Name:</span>
                          <span className="text-sm text-white font-medium">{studentInfo.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Level:</span>
                          <Badge variant="outline" className="text-xs">
                            {studentInfo.level}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Course:</span>
                          <span className="text-sm text-white">{studentInfo.course}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Language:</span>
                          <span className="text-sm text-white flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            {studentInfo.language}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Previous Performance */}
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Performance History</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Sessions:</span>
                      <span className="text-sm text-white">{studentInfo.previousSessions}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">Avg Score:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-sm text-white">{studentInfo.averageScore}/100</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Learning Profile */}
                <Card className="bg-black/30 backdrop-blur border-white/10 p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <BookOpen className="w-5 h-5 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">Learning Profile</h3>
                      
                      {/* Strengths */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Strengths:</p>
                        <div className="flex flex-wrap gap-1">
                          {studentInfo.strengths.map((strength, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-green-500/20 text-green-300">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Weaknesses */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Areas to Improve:</p>
                        <div className="flex flex-wrap gap-1">
                          {studentInfo.weaknesses.map((weakness, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-300">
                              {weakness}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Goals */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Today's Goals:</p>
                        <div className="space-y-1">
                          {studentInfo.learningGoals.slice(0, 3).map((goal, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Target className="w-3 h-3 text-purple-400" />
                              <span className="text-xs text-white">{goal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Session Recommendations */}
              <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white mb-2">AI Recommendations for this Session</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-white">Focus on conversational practice</p>
                          <p className="text-xs text-gray-400">Student needs more speaking confidence</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-white">Use visual aids and examples</p>
                          <p className="text-xs text-gray-400">Student learns better with visuals</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-white">Practice past tense verbs</p>
                          <p className="text-xs text-gray-400">Identified as weakness in last session</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-white">Keep energy high and engaging</p>
                          <p className="text-xs text-gray-400">Student responds well to enthusiasm</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Previous Session Notes */}
              {studentInfo.lastSessionNotes && (
                <Card className="bg-black/20 border-white/10 p-3 mb-6">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Notes from last session:</p>
                      <p className="text-xs text-white/80 italic">"{studentInfo.lastSessionNotes}"</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Accept Call ({timeToDecide}s)
                </Button>
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  size="lg"
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}