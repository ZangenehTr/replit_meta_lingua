import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map,
  Plus,
  Target,
  Clock,
  BookOpen,
  Trophy,
  ChevronRight,
  Edit,
  Trash2,
  Save,
  X,
  GraduationCap,
  Users,
  Globe,
  Lock,
  Sparkles,
  Zap,
  Star,
  Flag,
  Milestone,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
  TrendingUp,
  Award,
  FileText,
  Link2,
  BarChart
} from 'lucide-react';
import "../styles/glossy-ai-fantasy.css";

interface Roadmap {
  id: number;
  title: string;
  description: string;
  targetLanguage: string;
  targetLevel: string;
  estimatedWeeks: number;
  weeklyHours: number;
  difficulty: string;
  prerequisites: string[];
  isPublic: boolean;
  isActive: boolean;
  milestones?: RoadmapMilestone[];
}

interface RoadmapMilestone {
  id?: number;
  roadmapId: number;
  title: string;
  description: string;
  orderIndex: number;
  weekNumber: number;
  primarySkill: string;
  secondarySkills: string[];
  assessmentType: string;
  passingScore: number;
  iconName?: string;
  badgeImageUrl?: string;
  steps?: RoadmapStep[];
}

interface RoadmapStep {
  id?: number;
  milestoneId: number;
  title: string;
  description: string;
  orderIndex: number;
  estimatedMinutes: number;
  contentType: string;
  courseId?: number;
  contentUrl?: string;
  isRequired: boolean;
  objectives: string[];
}

export default function RoadmapDesigner() {
  const { t } = useTranslation(['admin']);
  const { toast } = useToast();
  
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<RoadmapMilestone | null>(null);
  const [editingStep, setEditingStep] = useState<RoadmapStep | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<RoadmapMilestone | null>(null);
  
  // Form states
  const [roadmapForm, setRoadmapForm] = useState({
    title: '',
    description: '',
    targetLanguage: 'english',
    targetLevel: 'B1',
    estimatedWeeks: 12,
    weeklyHours: 10,
    difficulty: 'intermediate',
    prerequisites: [] as string[],
    isPublic: true
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    orderIndex: 1,
    weekNumber: 1,
    primarySkill: 'speaking',
    secondarySkills: [] as string[],
    assessmentType: 'quiz',
    passingScore: 70,
    iconName: 'target',
    badgeImageUrl: ''
  });

  const [stepForm, setStepForm] = useState({
    title: '',
    description: '',
    orderIndex: 1,
    estimatedMinutes: 30,
    contentType: 'lesson',
    courseId: undefined as number | undefined,
    contentUrl: '',
    isRequired: true,
    objectives: [] as string[]
  });

  // Fetch roadmaps
  const { data: roadmaps = [], isLoading: loadingRoadmaps } = useQuery({
    queryKey: ['/api/roadmaps']
  });

  // Fetch selected roadmap details
  const { data: roadmapDetails, refetch: refetchDetails } = useQuery({
    queryKey: selectedRoadmap ? [`/api/roadmaps/${selectedRoadmap.id}`] : [''],
    enabled: !!selectedRoadmap
  });

  // Fetch courses for content linking
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses']
  });

  // Create roadmap mutation
  const createRoadmap = useMutation({
    mutationFn: (data: typeof roadmapForm) => 
      apiRequest('/api/admin/roadmaps', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: t('admin:roadmapCreatedSuccess') });
      queryClient.invalidateQueries({ queryKey: ['/api/roadmaps'] });
      setShowCreateModal(false);
      resetRoadmapForm();
    },
    onError: () => {
      toast({ title: t('admin:roadmapCreatedError'), variant: "destructive" });
    }
  });

  // Add milestone mutation
  const addMilestone = useMutation({
    mutationFn: (data: typeof milestoneForm) => 
      apiRequest(`/api/roadmaps/${selectedRoadmap?.id}/milestones`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: t('admin:milestoneAddedSuccess') });
      refetchDetails();
      setShowMilestoneModal(false);
      resetMilestoneForm();
    },
    onError: () => {
      toast({ title: t('admin:milestoneAddedError'), variant: "destructive" });
    }
  });

  // Add step mutation
  const addStep = useMutation({
    mutationFn: (data: typeof stepForm) => 
      apiRequest(`/api/milestones/${selectedMilestone?.id}/steps`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: t('admin:stepAddedSuccess') });
      refetchDetails();
      setShowStepModal(false);
      resetStepForm();
    },
    onError: () => {
      toast({ title: t('admin:stepAddedError'), variant: "destructive" });
    }
  });

  // Delete roadmap mutation
  const deleteRoadmap = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/roadmaps/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({ title: t('admin:roadmapDeletedSuccess') });
      queryClient.invalidateQueries({ queryKey: ['/api/roadmaps'] });
      setSelectedRoadmap(null);
    },
    onError: () => {
      toast({ title: t('admin:roadmapDeletedError'), variant: "destructive" });
    }
  });

  const resetRoadmapForm = () => {
    setRoadmapForm({
      title: '',
      description: '',
      targetLanguage: 'english',
      targetLevel: 'B1',
      estimatedWeeks: 12,
      weeklyHours: 10,
      difficulty: 'intermediate',
      prerequisites: [],
      isPublic: true
    });
  };

  const resetMilestoneForm = () => {
    setMilestoneForm({
      title: '',
      description: '',
      orderIndex: ((roadmapDetails as any)?.milestones?.length || 0) + 1,
      weekNumber: 1,
      primarySkill: 'speaking',
      secondarySkills: [],
      assessmentType: 'quiz',
      passingScore: 70,
      iconName: 'target',
      badgeImageUrl: ''
    });
  };

  const resetStepForm = () => {
    setStepForm({
      title: '',
      description: '',
      orderIndex: 1,
      estimatedMinutes: 30,
      contentType: 'lesson',
      courseId: undefined,
      contentUrl: '',
      isRequired: true,
      objectives: []
    });
  };

  const skillOptions = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary'];
  const levelOptions = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const languageOptions = ['english', 'persian', 'arabic', 'spanish', 'french', 'german'];
  const contentTypes = ['lesson', 'video', 'exercise', 'reading', 'project', 'quiz'];
  const assessmentTypes = ['quiz', 'project', 'presentation', 'essay', 'conversation'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      <div className="animated-bg-overlay" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphism-card p-4 sm:p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="neon-icon-wrapper">
              <Map className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white neon-text">
                {t('admin:roadmapDesigner')}
              </h1>
              <p className="text-white/70 mt-1 text-sm sm:text-base">
                {t('admin:roadmapDesignerDescription')}
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="glossy-button-primary px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            {t('admin:createRoadmap')}
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roadmap List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="glassmorphism-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {t('admin:roadmaps')}
            </h2>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {loadingRoadmaps ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto" />
                </div>
              ) : roadmaps.length === 0 ? (
                <div className="text-center py-8">
                  <Map className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/50">{t('admin:noRoadmaps')}</p>
                </div>
              ) : (
                roadmaps.map((roadmap: Roadmap) => (
                  <motion.div
                    key={roadmap.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRoadmap(roadmap)}
                    className={`glassmorphism-card p-4 cursor-pointer transition-all ${
                      selectedRoadmap?.id === roadmap.id ? 'ring-2 ring-cyan-400 shadow-neon-cyan' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{roadmap.title}</h3>
                        <p className="text-sm text-white/60 mt-1">
                          {roadmap.targetLanguage} • {roadmap.targetLevel}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-white/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {roadmap.estimatedWeeks} weeks
                          </span>
                          <span className="text-xs text-white/50 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {roadmap.weeklyHours}h/week
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {roadmap.isPublic ? (
                          <Globe className="w-4 h-4 text-green-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Roadmap Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          {selectedRoadmap ? (
            <div className="glassmorphism-card p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedRoadmap.title}</h2>
                  <p className="text-white/70 mt-2">{selectedRoadmap.description}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className="glossy-badge-primary">
                      {selectedRoadmap.targetLanguage}
                    </span>
                    <span className="glossy-badge-success">
                      {selectedRoadmap.targetLevel}
                    </span>
                    <span className="glossy-badge-warning">
                      {selectedRoadmap.difficulty}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMilestoneModal(true)}
                    className="glossy-button-success p-2 rounded-lg"
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteRoadmap.mutate(selectedRoadmap.id)}
                    className="glossy-button-danger p-2 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Milestone className="w-5 h-5" />
                  {t('admin:milestones')}
                </h3>
                
                {(roadmapDetails as any)?.milestones?.length > 0 ? (
                  <div className="space-y-3">
                    {(roadmapDetails as any).milestones.map((milestone: RoadmapMilestone, index: number) => (
                      <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glassmorphism-card p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="neon-icon-wrapper-sm">
                                <Target className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{milestone.title}</h4>
                                <p className="text-sm text-white/60 mt-1">{milestone.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-xs glossy-badge-info">
                                Week {milestone.weekNumber}
                              </span>
                              <span className="text-xs glossy-badge-primary">
                                {milestone.primarySkill}
                              </span>
                              <span className="text-xs glossy-badge-warning">
                                {milestone.assessmentType}
                              </span>
                            </div>
                            
                            {/* Steps */}
                            {milestone.steps && milestone.steps.length > 0 && (
                              <div className="mt-4 pl-8 space-y-2">
                                {milestone.steps.map((step: RoadmapStep) => (
                                  <div key={step.id} className="flex items-center gap-2 text-sm text-white/70">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span>{step.title}</span>
                                    <span className="text-xs text-white/50">
                                      ({step.estimatedMinutes} min)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                setShowStepModal(true);
                              }}
                              className="glossy-button-primary p-1.5 rounded-lg"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="glossy-button-warning p-1.5 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Milestone className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/50">{t('admin:noMilestones')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glassmorphism-card p-12 text-center">
              <Map className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/50 text-lg">{t('admin:selectRoadmap')}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Roadmap Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glassmorphism-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {t('admin:createRoadmap')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-1 block">
                    {t('admin:title')}
                  </label>
                  <input
                    type="text"
                    value={roadmapForm.title}
                    onChange={(e) => setRoadmapForm({...roadmapForm, title: e.target.value})}
                    className="glossy-input w-full"
                    placeholder={t('admin:roadmapTitlePlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="text-white/80 text-sm mb-1 block">
                    {t('admin:description')}
                  </label>
                  <textarea
                    value={roadmapForm.description}
                    onChange={(e) => setRoadmapForm({...roadmapForm, description: e.target.value})}
                    className="glossy-input w-full min-h-[100px]"
                    placeholder={t('admin:roadmapDescriptionPlaceholder')}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:targetLanguage')}
                    </label>
                    <select
                      value={roadmapForm.targetLanguage}
                      onChange={(e) => setRoadmapForm({...roadmapForm, targetLanguage: e.target.value})}
                      className="glossy-input w-full"
                    >
                      {languageOptions.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:targetLevel')}
                    </label>
                    <select
                      value={roadmapForm.targetLevel}
                      onChange={(e) => setRoadmapForm({...roadmapForm, targetLevel: e.target.value})}
                      className="glossy-input w-full"
                    >
                      {levelOptions.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:estimatedWeeks')}
                    </label>
                    <input
                      type="number"
                      value={roadmapForm.estimatedWeeks}
                      onChange={(e) => setRoadmapForm({...roadmapForm, estimatedWeeks: parseInt(e.target.value)})}
                      className="glossy-input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:weeklyHours')}
                    </label>
                    <input
                      type="number"
                      value={roadmapForm.weeklyHours}
                      onChange={(e) => setRoadmapForm({...roadmapForm, weeklyHours: parseInt(e.target.value)})}
                      className="glossy-input w-full"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roadmapForm.isPublic}
                      onChange={(e) => setRoadmapForm({...roadmapForm, isPublic: e.target.checked})}
                      className="glossy-checkbox"
                    />
                    <span className="text-white/80">{t('admin:isPublic')}</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(false)}
                  className="glossy-button-secondary px-6 py-2 rounded-lg"
                >
                  {t('admin:cancel')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => createRoadmap.mutate(roadmapForm)}
                  className="glossy-button-primary px-6 py-2 rounded-lg"
                >
                  {t('admin:create')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Milestone Modal */}
      <AnimatePresence>
        {showMilestoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowMilestoneModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glassmorphism-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {t('admin:addMilestone')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-1 block">
                    {t('admin:title')}
                  </label>
                  <input
                    type="text"
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})}
                    className="glossy-input w-full"
                    placeholder={t('admin:milestoneTitlePlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="text-white/80 text-sm mb-1 block">
                    {t('admin:description')}
                  </label>
                  <textarea
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({...milestoneForm, description: e.target.value})}
                    className="glossy-input w-full min-h-[100px]"
                    placeholder={t('admin:milestoneDescriptionPlaceholder')}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:orderIndex')}
                    </label>
                    <input
                      type="number"
                      value={milestoneForm.orderIndex}
                      onChange={(e) => setMilestoneForm({...milestoneForm, orderIndex: parseInt(e.target.value)})}
                      className="glossy-input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:weekNumber')}
                    </label>
                    <input
                      type="number"
                      value={milestoneForm.weekNumber}
                      onChange={(e) => setMilestoneForm({...milestoneForm, weekNumber: parseInt(e.target.value)})}
                      className="glossy-input w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-white/80 text-sm mb-1 block">
                    {t('admin:primarySkill')}
                  </label>
                  <select
                    value={milestoneForm.primarySkill}
                    onChange={(e) => setMilestoneForm({...milestoneForm, primarySkill: e.target.value})}
                    className="glossy-input w-full"
                  >
                    {skillOptions.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:assessmentType')} <span className="text-white/40">(اختیاری)</span>
                    </label>
                    <select
                      value={milestoneForm.assessmentType || ''}
                      onChange={(e) => setMilestoneForm({...milestoneForm, assessmentType: e.target.value || null})}
                      className="glossy-input w-full"
                    >
                      <option value="">بدون ارزیابی</option>
                      {assessmentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:passingScore')}
                    </label>
                    <input
                      type="number"
                      value={milestoneForm.passingScore}
                      onChange={(e) => setMilestoneForm({...milestoneForm, passingScore: parseInt(e.target.value)})}
                      className="glossy-input w-full"
                      disabled={!milestoneForm.assessmentType}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMilestoneModal(false)}
                  className="glossy-button-secondary px-6 py-2 rounded-lg w-full sm:w-auto"
                >
                  {t('admin:cancel')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addMilestone.mutate(milestoneForm)}
                  className="glossy-button-primary px-6 py-2 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                  disabled={addMilestone.isPending}
                >
                  {addMilestone.isPending ? (
                    <>
                      <div className="loading-spinner-sm" />
                      {t('admin:saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('admin:save')}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Step Modal */}
      <AnimatePresence>
        {showStepModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowStepModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glassmorphism-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {t('admin:addStep')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-1 block">
                    {t('admin:title')}
                  </label>
                  <input
                    type="text"
                    value={stepForm.title}
                    onChange={(e) => setStepForm({...stepForm, title: e.target.value})}
                    className="glossy-input w-full"
                    placeholder={t('admin:stepTitlePlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="text-white/80 text-sm mb-1 block">
                    {t('admin:description')}
                  </label>
                  <textarea
                    value={stepForm.description}
                    onChange={(e) => setStepForm({...stepForm, description: e.target.value})}
                    className="glossy-input w-full min-h-[100px]"
                    placeholder={t('admin:stepDescriptionPlaceholder')}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:contentType')}
                    </label>
                    <select
                      value={stepForm.contentType}
                      onChange={(e) => setStepForm({...stepForm, contentType: e.target.value})}
                      className="glossy-input w-full"
                    >
                      {contentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-white/80 text-sm mb-1 block">
                      {t('admin:estimatedMinutes')}
                    </label>
                    <input
                      type="number"
                      value={stepForm.estimatedMinutes}
                      onChange={(e) => setStepForm({...stepForm, estimatedMinutes: parseInt(e.target.value)})}
                      className="glossy-input w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-white/80 text-sm mb-1 block">
                    {t('admin:linkToCourse')} ({t('admin:optional')})
                  </label>
                  <select
                    value={stepForm.courseId || ''}
                    onChange={(e) => setStepForm({...stepForm, courseId: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="glossy-input w-full"
                  >
                    <option value="">{t('admin:noCourse')}</option>
                    {courses.map((course: any) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stepForm.isRequired}
                      onChange={(e) => setStepForm({...stepForm, isRequired: e.target.checked})}
                      className="glossy-checkbox"
                    />
                    <span className="text-white/80">{t('admin:isRequired')}</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowStepModal(false)}
                  className="glossy-button-secondary px-6 py-2 rounded-lg"
                >
                  {t('admin:cancel')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addStep.mutate(stepForm)}
                  className="glossy-button-primary px-6 py-2 rounded-lg"
                  disabled={addStep.isPending}
                >
                  {addStep.isPending ? t('admin:saving') : t('admin:save')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}