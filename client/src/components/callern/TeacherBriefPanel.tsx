import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Clock, 
  Target, 
  BookOpen, 
  TrendingUp, 
  Edit3,
  Save,
  X,
  Calendar,
  Award,
  Brain,
  MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LastSessionLearned {
  grammar: string[];
  vocab: string[];
  pronunciation: string[];
}

interface RoadmapPosition {
  template_title: string;
  unit: string;
  lesson: string;
  activity: string;
  progress_percentage: number;
}

interface TeacherBriefData {
  student_name: string;
  history_brief: string;
  goal: string;
  deadline?: string;
  minutes_completed: number;
  hours_completed: number;
  last_session_learned: LastSessionLearned | null;
  roadmap_position: RoadmapPosition | null;
  micro_sessions_per_week: number;
  student_level: string;
  learning_style: string;
  areas_to_focus: string[];
}

interface TeacherBriefPanelProps {
  briefData: TeacherBriefData | null;
  isLoading?: boolean;
  onUpdateObjectives?: (objectives: string) => void;
  onStartSession?: () => void;
  className?: string;
}

export const TeacherBriefPanel: React.FC<TeacherBriefPanelProps> = ({
  briefData,
  isLoading = false,
  onUpdateObjectives,
  onStartSession,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState('');
  const [editedFocusAreas, setEditedFocusAreas] = useState<string[]>([]);

  // Initialize edit state
  React.useEffect(() => {
    if (briefData) {
      setEditedGoal(briefData.goal);
      setEditedFocusAreas(briefData.areas_to_focus);
    }
  }, [briefData]);

  const handleSaveEdits = () => {
    if (onUpdateObjectives) {
      onUpdateObjectives(editedGoal);
    }
    setIsEditing(false);
  };

  const handleCancelEdits = () => {
    if (briefData) {
      setEditedGoal(briefData.goal);
      setEditedFocusAreas(briefData.areas_to_focus);
    }
    setIsEditing(false);
  };

  const addFocusArea = () => {
    setEditedFocusAreas([...editedFocusAreas, '']);
  };

  const updateFocusArea = (index: number, value: string) => {
    const updated = [...editedFocusAreas];
    updated[index] = value;
    setEditedFocusAreas(updated);
  };

  const removeFocusArea = (index: number) => {
    setEditedFocusAreas(editedFocusAreas.filter((_, i) => i !== index));
  };

  if (!briefData && !isLoading) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className={`${className}`}>
          <User className="w-4 h-4 mr-2" />
          {t('callern:brief.studentBrief')}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left flex items-center gap-2">
            <User className="w-5 h-5" />
            {briefData ? briefData.student_name : t('callern:brief.loading')}
          </SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="text-gray-600">{t('callern:brief.loading')}</p>
            </div>
          </div>
        )}

        {briefData && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{briefData.hours_completed}h</p>
                  <p className="text-xs text-gray-600">{t('callern:brief.totalTime')}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="w-6 h-6 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{briefData.student_level}</p>
                  <p className="text-xs text-gray-600">{t('callern:brief.currentLevel')}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold">{briefData.micro_sessions_per_week}</p>
                  <p className="text-xs text-gray-600">{t('callern:brief.sessionsPerWeek')}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Brain className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                  <p className="text-sm font-bold capitalize">{briefData.learning_style}</p>
                  <p className="text-xs text-gray-600">{t('callern:brief.learningStyle')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Learning Goal */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    {t('callern:brief.learningGoal')}
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="goal">{t('callern:brief.goal')}</Label>
                      <Textarea
                        id="goal"
                        value={editedGoal}
                        onChange={(e) => setEditedGoal(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>{t('callern:brief.focusAreas')}</Label>
                      <div className="space-y-2 mt-2">
                        {editedFocusAreas.map((area, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={area}
                              onChange={(e) => updateFocusArea(index, e.target.value)}
                              placeholder={t('callern:brief.focusAreaPlaceholder')}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFocusArea(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addFocusArea}
                          className="w-full"
                        >
                          {t('callern:brief.addFocusArea')}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdits} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        {t('callern:brief.save')}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdits} size="sm">
                        {t('callern:brief.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-700">{briefData.goal}</p>
                    {briefData.deadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {t('callern:brief.deadline')}: {new Date(briefData.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {briefData.areas_to_focus.map((area, index) => (
                        <Badge key={index} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Roadmap Position */}
            {briefData.roadmap_position && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    {t('callern:brief.currentPosition')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{briefData.roadmap_position.template_title}</p>
                      <p className="text-sm text-gray-600">
                        {briefData.roadmap_position.unit} → {briefData.roadmap_position.lesson}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${briefData.roadmap_position.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {briefData.roadmap_position.progress_percentage}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Last Session Learned */}
            {briefData.last_session_learned && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    {t('callern:brief.lastSessionLearned')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {briefData.last_session_learned.grammar.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">{t('callern:brief.grammar')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {briefData.last_session_learned.grammar.map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {briefData.last_session_learned.vocab.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">{t('callern:brief.vocabulary')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {briefData.last_session_learned.vocab.map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {briefData.last_session_learned.pronunciation.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">{t('callern:brief.pronunciation')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {briefData.last_session_learned.pronunciation.map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  {t('callern:brief.recentHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{briefData.history_brief}</p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onStartSession}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {t('callern:brief.startNow')}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};