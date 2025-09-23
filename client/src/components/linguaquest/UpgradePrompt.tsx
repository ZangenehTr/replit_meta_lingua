import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Crown, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  X,
  Sparkles,
  Users,
  BookOpen,
  Award,
  Mic,
  Globe
} from "lucide-react";
import { guestProgress } from "@/lib/guest-progress";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  promptType: 'completion_modal' | 'progress_barrier' | 'feature_preview';
  promptPosition: 'lesson_end' | 'mid_session' | 'navigation';
  completedLessons?: number;
  currentLevel?: number;
  totalXp?: number;
}

const FEATURES = [
  {
    icon: Users,
    title: "Personal Tutor",
    description: "Get 1-on-1 guidance from expert language teachers",
    color: "text-blue-600"
  },
  {
    icon: BookOpen,
    title: "Advanced Curriculum",
    description: "Access professional-grade lessons and materials",
    color: "text-green-600"
  },
  {
    icon: Award,
    title: "Official Certificates",
    description: "Earn internationally recognized language certificates",
    color: "text-purple-600"
  },
  {
    icon: Mic,
    title: "Live Conversation",
    description: "Practice with native speakers in real-time",
    color: "text-orange-600"
  },
  {
    icon: Globe,
    title: "Multiple Languages",
    description: "Learn 15+ languages with expert support",
    color: "text-teal-600"
  },
  {
    icon: Sparkles,
    title: "AI-Powered Learning",
    description: "Personalized learning paths with AI technology",
    color: "text-pink-600"
  }
];

/**
 * LinguaQuest to Meta Lingua Upgrade Prompt Component
 * Strategic conversion modal with progress transfer
 */
export function UpgradePrompt({
  isOpen,
  onClose,
  promptType,
  promptPosition,
  completedLessons = 0,
  currentLevel = 1,
  totalXp = 0
}: UpgradePromptProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleUpgrade = async () => {
    // Track upgrade click
    await guestProgress.trackEvent('consideration', 'upgrade_clicked', {
      promptType,
      promptPosition,
      completedLessons,
      currentLevel,
      totalXp
    });

    // Record prompt interaction
    await guestProgress.recordUpgradePrompt(promptType, promptPosition);

    // Navigate to Meta Lingua signup with progress transfer
    const params = new URLSearchParams({
      source: 'linguaquest',
      transfer: 'true',
      lessons: completedLessons.toString(),
      level: currentLevel.toString(),
      xp: totalXp.toString()
    });

    window.location.href = `/signup?${params.toString()}`;
  };

  const handleDismiss = async () => {
    // Track dismissal
    await guestProgress.trackEvent('consideration', 'upgrade_dismissed', {
      promptType,
      promptPosition
    });

    onClose();
  };

  const getPromptTitle = () => {
    switch (promptType) {
      case 'completion_modal':
        return "🎉 Amazing Progress!";
      case 'progress_barrier':
        return "🚀 Ready for Advanced Learning?";
      case 'feature_preview':
        return "✨ Unlock Your Full Potential";
      default:
        return "🌟 Upgrade to Meta Lingua Pro";
    }
  };

  const getPromptDescription = () => {
    switch (promptType) {
      case 'completion_modal':
        return `You've completed ${completedLessons} lessons and reached Level ${currentLevel}! Take your learning to the next level with personalized tutoring and advanced features.`;
      case 'progress_barrier':
        return "You're making excellent progress! Unlock unlimited lessons, expert tutoring, and official certificates to accelerate your language journey.";
      case 'feature_preview':
        return "Experience the full power of language learning with Meta Lingua Pro's advanced features and personalized curriculum.";
      default:
        return "Transform your language learning experience with premium features designed for serious learners.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 border-0 bg-transparent">
        <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-2 border-purple-200 dark:border-purple-600">
          <CardHeader className="relative pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10"
              data-testid="button-close-upgrade-prompt"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                {getPromptTitle()}
              </CardTitle>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {getPromptDescription()}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Summary */}
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Your LinguaQuest Journey So Far
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">{completedLessons}</div>
                  <div className="text-sm text-gray-500">Lessons Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{currentLevel}</div>
                  <div className="text-sm text-gray-500">Current Level</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{totalXp}</div>
                  <div className="text-sm text-gray-500">XP Earned</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Badge className="bg-green-100 text-green-800 px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  All progress will transfer to Meta Lingua Pro!
                </Badge>
              </div>
            </div>

            {/* Features Grid */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                What You'll Unlock with Meta Lingua Pro
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURES.map((feature, index) => (
                  <div 
                    key={feature.title}
                    className="bg-white/80 dark:bg-gray-700/80 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center ${feature.color}`}>
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing & CTA */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    Special Offer
                  </span>
                  <Badge className="bg-red-100 text-red-800">
                    Limited Time
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Get 50% off your first month as a LinguaQuest graduate!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={handleUpgrade}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105"
                  data-testid="button-upgrade-to-pro"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Meta Lingua Pro
                  <ArrowRight className={`w-4 h-4 ml-2 transition-transform duration-200 ${isHovered ? 'translate-x-1' : ''}`} />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDismiss}
                  className="border-gray-300 hover:bg-gray-50"
                  data-testid="button-continue-free"
                >
                  Continue with Free Version
                </Button>
              </div>

              <div className="text-center mt-4">
                <p className="text-xs text-gray-500">
                  30-day money-back guarantee • Cancel anytime • No hidden fees
                </p>
              </div>
            </div>

            {/* Social Proof */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                  4.9/5 from 10,000+ learners
                </span>
              </div>
              <p className="text-sm text-gray-500">
                "Meta Lingua helped me become fluent in 6 months!" - Sarah M.
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}