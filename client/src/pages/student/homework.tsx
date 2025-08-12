import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { 
  BookOpen,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Download,
  ChevronRight,
  Filter,
  Search,
  Star,
  MoreVertical,
  X,
  Send,
  Paperclip,
  Eye
} from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Assignment {
  id: number;
  title: string;
  description: string;
  courseName: string;
  courseId: number;
  teacherName: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue' | 'late';
  score?: number;
  feedback?: string;
  attachments?: string[];
  submittedAt?: string;
  submissionText?: string;
  submissionFiles?: string[];
}

export default function StudentHomework() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['/api/student/assignments'],
    queryFn: async () => {
      const response = await fetch('/api/student/assignments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Submit assignment mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, text, files }: { assignmentId: number; text: string; files: File[] }) => {
      const formData = new FormData();
      formData.append('text', text);
      files.forEach(file => formData.append('files', file));

      const response = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to submit assignment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:assignmentSubmitted', 'Assignment Submitted'),
        description: t('student:assignmentSubmittedDesc', 'Your assignment has been submitted successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/assignments'] });
      setSelectedAssignment(null);
      setSubmissionText('');
      setSubmissionFiles([]);
    },
    onError: () => {
      toast({
        title: t('common:error', 'Error'),
        description: t('student:submitError', 'Failed to submit assignment'),
        variant: 'destructive'
      });
    }
  });

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || assignment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Group assignments by status
  const pendingAssignments = filteredAssignments.filter(a => a.status === 'pending' || a.status === 'overdue');
  const submittedAssignments = filteredAssignments.filter(a => a.status === 'submitted');
  const gradedAssignments = filteredAssignments.filter(a => a.status === 'graded');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-400';
      case 'submitted': return 'bg-blue-400';
      case 'graded': return 'bg-green-400';
      case 'overdue': return 'bg-red-400';
      case 'late': return 'bg-orange-400';
      default: return 'bg-gray-400';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSubmissionFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="mobile-app-container min-h-screen">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animated-gradient-bg opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Mobile Header */}
        <motion.header 
          className="mobile-header"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white font-bold text-xl">{t('student:homework', 'Homework')}</h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-white/10 backdrop-blur"
              onClick={() => setFilterStatus(filterStatus === 'all' ? 'pending' : 'all')}
            >
              <Filter className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder={t('student:searchAssignments', 'Search assignments...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur rounded-xl text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {['all', 'pending', 'submitted', 'graded', 'overdue'].map((status) => (
              <motion.button
                key={status}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filterStatus === status 
                    ? 'bg-white text-purple-600' 
                    : 'bg-white/10 text-white/70 backdrop-blur'
                }`}
              >
                {t(`student:status.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
              </motion.button>
            ))}
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="mobile-content">
          {isLoading ? (
            // Loading Skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-4">
                  <div className="skeleton h-6 w-3/4 mb-2 rounded" />
                  <div className="skeleton h-4 w-1/2 mb-3 rounded" />
                  <div className="skeleton h-10 w-full rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <motion.div 
                className="grid grid-cols-3 gap-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="glass-card p-3 text-center">
                  <AlertCircle className="w-6 h-6 text-yellow-300 mx-auto mb-1" />
                  <p className="text-white text-2xl font-bold">{pendingAssignments.length}</p>
                  <p className="text-white/70 text-xs">{t('student:pending', 'Pending')}</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <CheckCircle className="w-6 h-6 text-blue-300 mx-auto mb-1" />
                  <p className="text-white text-2xl font-bold">{submittedAssignments.length}</p>
                  <p className="text-white/70 text-xs">{t('student:submitted', 'Submitted')}</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <Star className="w-6 h-6 text-green-300 mx-auto mb-1" />
                  <p className="text-white text-2xl font-bold">{gradedAssignments.length}</p>
                  <p className="text-white/70 text-xs">{t('student:graded', 'Graded')}</p>
                </div>
              </motion.div>

              {/* Assignments List */}
              <div className="space-y-4 mb-20">
                {filteredAssignments.length === 0 ? (
                  <motion.div 
                    className="glass-card p-8 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70">{t('student:noAssignments', 'No assignments found')}</p>
                  </motion.div>
                ) : (
                  filteredAssignments.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      className="glass-card p-4 cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(assignment.status)}`} />
                            <h3 className="text-white font-semibold text-lg">{assignment.title}</h3>
                          </div>
                          <p className="text-white/60 text-sm">{assignment.courseName}</p>
                        </div>
                        {assignment.score !== undefined && (
                          <Badge className="bg-white/20 text-white border-white/30">
                            {assignment.score}%
                          </Badge>
                        )}
                      </div>

                      <p className="text-white/80 text-sm mb-3 line-clamp-2">
                        {assignment.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white/60 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{t('student:due', 'Due')}: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          </div>
                          {assignment.attachments && assignment.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-4 h-4" />
                              <span>{assignment.attachments.length}</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/50" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assignment Detail Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAssignment(null)}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedAssignment.title}</h2>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('student:course', 'Course')}</p>
                  <p className="font-medium">{selectedAssignment.courseName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('student:teacher', 'Teacher')}</p>
                  <p className="font-medium">{selectedAssignment.teacherName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('student:dueDate', 'Due Date')}</p>
                  <p className="font-medium">{new Date(selectedAssignment.dueDate).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('student:description', 'Description')}</p>
                  <p className="text-gray-800">{selectedAssignment.description}</p>
                </div>

                {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{t('student:attachments', 'Attachments')}</p>
                    <div className="space-y-2">
                      {selectedAssignment.attachments.map((file, index) => (
                        <button
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg w-full hover:bg-gray-100"
                        >
                          <FileText className="w-5 h-5 text-gray-600" />
                          <span className="flex-1 text-left text-sm">{file}</span>
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAssignment.status === 'graded' && selectedAssignment.feedback && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      {t('student:teacherFeedback', 'Teacher Feedback')}
                    </p>
                    <p className="text-green-700">{selectedAssignment.feedback}</p>
                    {selectedAssignment.score !== undefined && (
                      <p className="text-green-800 font-bold mt-2">
                        {t('student:score', 'Score')}: {selectedAssignment.score}%
                      </p>
                    )}
                  </div>
                )}

                {(selectedAssignment.status === 'pending' || selectedAssignment.status === 'overdue') && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder={t('student:writeYourAnswer', 'Write your answer here...')}
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="min-h-[120px]"
                    />

                    <div>
                      <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <Paperclip className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          {submissionFiles.length > 0 
                            ? `${submissionFiles.length} file(s) selected`
                            : t('student:attachFiles', 'Attach files')}
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <Button
                      onClick={() => submitAssignmentMutation.mutate({
                        assignmentId: selectedAssignment.id,
                        text: submissionText,
                        files: submissionFiles
                      })}
                      disabled={submitAssignmentMutation.isPending || !submissionText.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitAssignmentMutation.isPending 
                        ? t('student:submitting', 'Submitting...') 
                        : t('student:submitAssignment', 'Submit Assignment')}
                    </Button>
                  </div>
                )}

                {selectedAssignment.status === 'submitted' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <p className="font-medium">{t('student:assignmentSubmittedOn', 'Submitted on')}</p>
                    </div>
                    <p className="text-blue-700">
                      {new Date(selectedAssignment.submittedAt || '').toLocaleString()}
                    </p>
                    {selectedAssignment.submissionText && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          {t('student:yourAnswer', 'Your Answer')}:
                        </p>
                        <p className="text-blue-700">{selectedAssignment.submissionText}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}