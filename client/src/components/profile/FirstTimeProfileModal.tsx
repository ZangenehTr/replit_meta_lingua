import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Target, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  User,
  Globe,
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FirstTimeProfileModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function FirstTimeProfileModal({ 
  isOpen, 
  onComplete, 
  onSkip 
}: FirstTimeProfileModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  const benefits = [
    {
      icon: Brain,
      title: t('student:profile.aiRoadmapTitle', 'AI-Powered Roadmap'),
      description: t('student:profile.aiRoadmapDesc', 'Personalized learning path based on your goals and level')
    },
    {
      icon: Target,
      title: t('student:profile.customContentTitle', 'Custom Content'),
      description: t('student:profile.customContentDesc', 'Tailored materials matching your learning style and interests')
    },
    {
      icon: BookOpen,
      title: t('student:profile.smartRecommendationsTitle', 'Smart Recommendations'),
      description: t('student:profile.smartRecommendationsDesc', 'AI suggests the best courses and activities for you')
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onSkip(); }}>
          <DialogContent 
            className={`max-w-sm sm:max-w-md mx-auto max-h-[85vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {t('student:profile.completeProfileTitle', 'Complete Your Learning Profile')}
                </DialogTitle>
                
                <DialogDescription className="text-gray-600 leading-relaxed">
                  {t('student:profile.completeProfileDesc', 'Help our AI create the perfect learning roadmap for you by sharing your goals, preferences, and background.')}
                </DialogDescription>

                <Badge variant="secondary" className="mx-auto">
                  <Brain className="h-3 w-3 mr-1" />
                  {t('student:profile.poweredByAI', 'Powered by AI')}
                </Badge>
              </DialogHeader>

              <div className="space-y-4 my-6">
                <h4 className="font-semibold text-gray-800 text-sm">
                  {t('student:profile.benefitsTitle', 'What you\'ll get:')}
                </h4>
                
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <benefit.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">
                        {benefit.title}
                      </h5>
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-800 text-sm font-medium">
                      {t('student:profile.privacyTitle', 'Your Privacy Matters')}
                    </p>
                    <p className="text-blue-700 text-xs">
                      {t('student:profile.privacyDesc', 'Your information is used only to personalize your learning experience and is kept secure.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  {t('student:profile.fillingSectionsHelp', 'Filling out the following sections will help the AI:')}
                </p>
                
                <div className="flex justify-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    {t('basicInfo')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {t('learning')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Settings className="h-3 w-3 mr-1" />
                    {t('preferences')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    {t('cultural')}
                  </Badge>
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 pt-6">
                <Button 
                  onClick={onComplete}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('student:profile.completeProfileNow', 'Complete Profile Now')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <Button 
                  onClick={onSkip}
                  variant="ghost"
                  className="w-full text-gray-500 hover:text-gray-700"
                  size="sm"
                >
                  {t('student:profile.skipForNow', 'Skip for now')}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}