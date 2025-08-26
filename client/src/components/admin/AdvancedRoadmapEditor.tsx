import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Target,
  Clock,
  Award,
  BookOpen,
  Lightbulb,
  Tag,
  Globe,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

// CEFR Levels with descriptions
const CEFR_LEVELS = {
  'A1': { label: 'A1 - Beginner', color: 'bg-green-500', description: 'Can understand basic phrases' },
  'A2': { label: 'A2 - Elementary', color: 'bg-green-600', description: 'Can communicate simple tasks' },
  'B1': { label: 'B1 - Intermediate', color: 'bg-blue-500', description: 'Can handle most situations' },
  'B2': { label: 'B2 - Upper Intermediate', color: 'bg-blue-600', description: 'Can interact with fluency' },
  'C1': { label: 'C1 - Advanced', color: 'bg-purple-500', description: 'Can express fluently' },
  'C2': { label: 'C2 - Proficient', color: 'bg-purple-600', description: 'Near-native proficiency' },
};

const SKILL_TYPES = ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary', 'Pronunciation'];
const CONTENT_TYPES = ['Video', 'Exercise', 'Reading', 'Audio', 'Interactive', 'Project', 'Assessment'];

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  teacherAITips: string;
  estimatedMinutes: number;
  skillFocus: string[];
  contentType: string;
  cefrLevel: string;
  materials: {
    links: string[];
    documents: string[];
    exercises: any[];
  };
  assessmentCriteria: string;
}

interface RoadmapData {
  id?: number;
  packageId: number;
  roadmapName: string;
  description: string;
  totalSteps: number;
  estimatedHours: number;
  steps: RoadmapStep[];
}

interface AdvancedRoadmapEditorProps {
  roadmap?: RoadmapData;
  packages: any[];
  onSave: (data: RoadmapData) => Promise<void>;
  onCancel: () => void;
}

// Rich Text Editor Component
const RichTextEditor: React.FC<{
  content: string;
  placeholder?: string;
  onChange: (content: string) => void;
  className?: string;
}> = ({ content, placeholder, onChange, className = '' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Start typing...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className={`rich-text-editor ${className}`}>
      <div className="editor-toolbar glassmorphism-card p-2 mb-2 flex gap-2 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${editor.isActive('bold') ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${editor.isActive('italic') ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          1. List
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          ←
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          ↔
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          →
        </button>
      </div>
      <EditorContent 
        editor={editor} 
        className="glassmorphism-card p-4 min-h-[150px] prose prose-invert max-w-none"
      />
    </div>
  );
};

// Sortable Step Component
const SortableStep: React.FC<{
  step: RoadmapStep;
  index: number;
  onEdit: (step: RoadmapStep) => void;
  onDelete: (id: string) => void;
  onDuplicate: (step: RoadmapStep) => void;
}> = ({ step, index, onEdit, onDelete, onDuplicate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glassmorphism-card p-4 mb-3"
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab hover:bg-white/10 rounded p-1"
        >
          <GripVertical className="w-5 h-5 text-white/50" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-white/60">Step {index + 1}</span>
                <h3 className="font-semibold text-white">{step.title}</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs text-white ${CEFR_LEVELS[step.cefrLevel]?.color || 'bg-gray-500'}`}>
                    {step.cefrLevel}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-500/30 text-blue-200">
                    {step.estimatedMinutes} min
                  </span>
                </div>
              </div>

              <div 
                className="text-sm text-white/70 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: step.description }}
              />

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider">Skills Focus</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {step.skillFocus.map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/60 uppercase tracking-wider">Learning Objectives</label>
                    <ul className="mt-1 space-y-1">
                      {step.objectives.map((obj, idx) => (
                        <li key={idx} className="text-sm text-white/70 flex items-start gap-2">
                          <Target className="w-3 h-3 mt-0.5 text-green-400" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {step.teacherAITips && (
                    <div>
                      <label className="text-xs text-white/60 uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        AI Teacher Tips
                      </label>
                      <div 
                        className="mt-1 text-sm text-yellow-300/80 bg-yellow-500/10 p-2 rounded"
                        dangerouslySetInnerHTML={{ __html: step.teacherAITips }}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-white/10 rounded transition"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-white/70" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/70" />
                )}
              </button>
              <button
                onClick={() => onEdit(step)}
                className="p-1.5 hover:bg-white/10 rounded transition"
              >
                <Edit className="w-4 h-4 text-blue-400" />
              </button>
              <button
                onClick={() => onDuplicate(step)}
                className="p-1.5 hover:bg-white/10 rounded transition"
              >
                <Copy className="w-4 h-4 text-green-400" />
              </button>
              <button
                onClick={() => onDelete(step.id)}
                className="p-1.5 hover:bg-white/10 rounded transition"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Step Editor Modal
const StepEditor: React.FC<{
  step: RoadmapStep | null;
  onSave: (step: RoadmapStep) => void;
  onClose: () => void;
}> = ({ step, onSave, onClose }) => {
  const { t } = useTranslation(['admin']);
  const [formData, setFormData] = useState<RoadmapStep>(
    step || {
      id: `step-${Date.now()}`,
      title: '',
      description: '',
      objectives: [''],
      teacherAITips: '',
      estimatedMinutes: 30,
      skillFocus: [],
      contentType: 'Video',
      cefrLevel: 'B1',
      materials: { links: [], documents: [], exercises: [] },
      assessmentCriteria: '',
    }
  );

  const handleSave = () => {
    onSave(formData);
  };

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, ''],
    });
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, objectives: newObjectives });
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter((_, i) => i !== index),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glassmorphism-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          {step ? 'Edit Step' : 'Create New Step'}
        </h2>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/80 mb-2 block">Step Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                placeholder="e.g., Introduction to Past Tense"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-white/80 mb-2 block">CEFR Level</label>
                <select
                  value={formData.cefrLevel}
                  onChange={(e) => setFormData({ ...formData, cefrLevel: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                >
                  {Object.entries(CEFR_LEVELS).map(([level, info]) => (
                    <option key={level} value={level}>{info.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/80 mb-2 block">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  min="5"
                  max="120"
                />
              </div>

              <div>
                <label className="text-sm text-white/80 mb-2 block">Content Type</label>
                <select
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                >
                  {CONTENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rich Text Description */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Step Description</label>
            <RichTextEditor
              content={formData.description}
              placeholder="Provide a detailed description of this learning step..."
              onChange={(content) => setFormData({ ...formData, description: content })}
            />
          </div>

          {/* Skills Focus */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Skills Focus</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_TYPES.map(skill => (
                <button
                  key={skill}
                  onClick={() => {
                    const isSelected = formData.skillFocus.includes(skill);
                    setFormData({
                      ...formData,
                      skillFocus: isSelected
                        ? formData.skillFocus.filter(s => s !== skill)
                        : [...formData.skillFocus, skill]
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    formData.skillFocus.includes(skill)
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="text-sm text-white/80 mb-2 block flex items-center justify-between">
              Learning Objectives
              <button
                onClick={addObjective}
                className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm hover:bg-green-500/30"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Objective
              </button>
            </label>
            <div className="space-y-2">
              {formData.objectives.map((obj, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                    placeholder={`Objective ${index + 1}`}
                  />
                  <button
                    onClick={() => removeObjective(index)}
                    className="px-3 py-2 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Teacher Tips */}
          <div>
            <label className="text-sm text-white/80 mb-2 block flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              AI Teacher Tips
            </label>
            <RichTextEditor
              content={formData.teacherAITips}
              placeholder="Provide tips for AI to keep the lesson engaging..."
              onChange={(content) => setFormData({ ...formData, teacherAITips: content })}
              className="bg-yellow-500/5"
            />
          </div>

          {/* Assessment Criteria */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Assessment Criteria</label>
            <RichTextEditor
              content={formData.assessmentCriteria}
              placeholder="How should this step be evaluated?"
              onChange={(content) => setFormData({ ...formData, assessmentCriteria: content })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {step ? 'Update Step' : 'Create Step'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main Component
const AdvancedRoadmapEditor: React.FC<AdvancedRoadmapEditorProps> = ({
  roadmap,
  packages,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation(['admin']);
  const { toast } = useToast();
  const [formData, setFormData] = useState<RoadmapData>(
    roadmap || {
      packageId: packages[0]?.id || 0,
      roadmapName: '',
      description: '',
      totalSteps: 0,
      estimatedHours: 0,
      steps: [],
    }
  );
  const [editingStep, setEditingStep] = useState<RoadmapStep | null>(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = formData.steps.findIndex((step) => step.id === active.id);
      const newIndex = formData.steps.findIndex((step) => step.id === over?.id);

      setFormData({
        ...formData,
        steps: arrayMove(formData.steps, oldIndex, newIndex),
      });
    }
    setActiveId(null);
  };

  const handleSaveStep = (step: RoadmapStep) => {
    if (editingStep) {
      // Update existing step
      setFormData({
        ...formData,
        steps: formData.steps.map(s => s.id === step.id ? step : s),
      });
    } else {
      // Add new step
      setFormData({
        ...formData,
        steps: [...formData.steps, step],
      });
    }
    setShowStepEditor(false);
    setEditingStep(null);
  };

  const handleEditStep = (step: RoadmapStep) => {
    setEditingStep(step);
    setShowStepEditor(true);
  };

  const handleDeleteStep = (id: string) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter(s => s.id !== id),
    });
  };

  const handleDuplicateStep = (step: RoadmapStep) => {
    const newStep = {
      ...step,
      id: `step-${Date.now()}`,
      title: `${step.title} (Copy)`,
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep],
    });
  };

  const calculateTotals = () => {
    const totalMinutes = formData.steps.reduce((sum, step) => sum + step.estimatedMinutes, 0);
    return {
      totalSteps: formData.steps.length,
      estimatedHours: Math.round(totalMinutes / 60),
    };
  };

  const handleSave = async () => {
    const totals = calculateTotals();
    const dataToSave = {
      ...formData,
      ...totals,
    };
    await onSave(dataToSave);
    toast({ title: 'Roadmap saved successfully!' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism-card p-6 mb-6"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Globe className="w-8 h-8 text-cyan-400" />
                {roadmap ? 'Edit Roadmap' : 'Create New Roadmap'}
              </h1>
              
              <div className="space-y-4 mt-6">
                <div>
                  <label className="text-sm text-white/80 mb-2 block">Roadmap Name</label>
                  <input
                    type="text"
                    value={formData.roadmapName}
                    onChange={(e) => setFormData({ ...formData, roadmapName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g., Complete English Conversation Mastery"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/80 mb-2 block">Package</label>
                    <select
                      value={formData.packageId}
                      onChange={(e) => setFormData({ ...formData, packageId: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    >
                      {packages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.packageName} ({pkg.minutes} min)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/80 mb-2 block">Roadmap Stats</label>
                    <div className="flex gap-4 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                      <span className="text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        {formData.steps.length} Steps
                      </span>
                      <span className="text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-400" />
                        {calculateTotals().estimatedHours} Hours
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/80 mb-2 block">Description</label>
                  <RichTextEditor
                    content={formData.description}
                    placeholder="Describe the learning journey and expected outcomes..."
                    onChange={(content) => setFormData({ ...formData, description: content })}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Steps Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glassmorphism-card p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Roadmap Steps
            </h2>
            <button
              onClick={() => {
                setEditingStep(null);
                setShowStepEditor(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          {formData.steps.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/50 text-lg">No steps yet. Start building your roadmap!</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={formData.steps.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence>
                  {formData.steps.map((step, index) => (
                    <SortableStep
                      key={step.id}
                      step={step}
                      index={index}
                      onEdit={handleEditStep}
                      onDelete={handleDeleteStep}
                      onDuplicate={handleDuplicateStep}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div className="glassmorphism-card p-4 opacity-80">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-white/50" />
                      <span className="text-white">
                        {formData.steps.find(s => s.id === activeId)?.title}
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end gap-4 mt-6"
        >
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.roadmapName || formData.steps.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Roadmap
          </button>
        </motion.div>

        {/* Step Editor Modal */}
        <AnimatePresence>
          {showStepEditor && (
            <StepEditor
              step={editingStep}
              onSave={handleSaveStep}
              onClose={() => {
                setShowStepEditor(false);
                setEditingStep(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        .glassmorphism-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }
        .prose-invert {
          color: white;
        }
        .prose-invert strong {
          color: white;
        }
        .prose-invert a {
          color: #22d3ee;
        }
        .prose-invert mark {
          background-color: rgba(251, 191, 36, 0.3);
          color: white;
        }
      `}</style>
    </div>
  );
};

export default AdvancedRoadmapEditor;