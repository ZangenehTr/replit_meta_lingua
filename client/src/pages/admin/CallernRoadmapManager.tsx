import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import AdvancedRoadmapEditor from '@/components/admin/AdvancedRoadmapEditor';
import { 
  Map,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Globe,
  Star,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  Download,
  Upload,
} from 'lucide-react';

interface RoadmapOverview {
  id: number;
  packageId: number;
  packageName?: string;
  roadmapName: string;
  description: string;
  totalSteps: number;
  estimatedHours: number;
  createdBy: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
  completionRate?: number;
}

interface Package {
  id: number;
  packageName: string;
  minutes: number;
}

export default function CallernRoadmapManager() {
  const { t } = useTranslation(['admin']);
  const { toast } = useToast();
  
  const [showEditor, setShowEditor] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapOverview | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPackage, setFilterPackage] = useState<number | null>(null);

  // Fetch roadmaps
  const { data: roadmaps = [], isLoading: loadingRoadmaps } = useQuery<RoadmapOverview[]>({
    queryKey: ['/api/callern/roadmaps']
  });

  // Fetch packages
  const { data: packages = [], isLoading: loadingPackages } = useQuery<Package[]>({
    queryKey: ['/api/callern/packages']
  });

  // Fetch selected roadmap details
  const { data: roadmapDetails } = useQuery({
    queryKey: selectedRoadmap ? [`/api/callern/roadmaps/${selectedRoadmap.id}`] : [''],
    enabled: !!selectedRoadmap
  });

  // Save roadmap mutation
  const saveRoadmap = useMutation({
    mutationFn: async (data: any) => {
      const url = selectedRoadmap 
        ? `/api/callern/roadmaps/${selectedRoadmap.id}`
        : '/api/callern/roadmaps';
      const method = selectedRoadmap ? 'PUT' : 'POST';
      
      return apiRequest(url, {
        method,
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: selectedRoadmap ? 'Roadmap updated!' : 'Roadmap created!' });
      queryClient.invalidateQueries({ queryKey: ['/api/callern/roadmaps'] });
      setShowEditor(false);
      setSelectedRoadmap(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Error saving roadmap', 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete roadmap mutation
  const deleteRoadmap = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/callern/roadmaps/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({ title: 'Roadmap deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/callern/roadmaps'] });
    },
    onError: () => {
      toast({ title: 'Failed to delete roadmap', variant: "destructive" });
    }
  });

  // Duplicate roadmap mutation
  const duplicateRoadmap = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/callern/roadmaps/${id}/duplicate`, {
        method: 'POST'
      }),
    onSuccess: () => {
      toast({ title: 'Roadmap duplicated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/callern/roadmaps'] });
    },
    onError: () => {
      toast({ title: 'Failed to duplicate roadmap', variant: "destructive" });
    }
  });

  const handleEditRoadmap = async (roadmap: RoadmapOverview) => {
    setSelectedRoadmap(roadmap);
    setShowEditor(true);
  };

  const handleCreateRoadmap = () => {
    setSelectedRoadmap(null);
    setShowEditor(true);
  };

  const handleSaveRoadmap = async (data: any) => {
    await saveRoadmap.mutateAsync(data);
  };

  const filteredRoadmaps = roadmaps.filter(roadmap => {
    const matchesSearch = roadmap.roadmapName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roadmap.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPackage = !filterPackage || roadmap.packageId === filterPackage;
    return matchesSearch && matchesPackage;
  });

  const stats = {
    totalRoadmaps: roadmaps.length,
    activeRoadmaps: roadmaps.filter(r => r.isActive).length,
    totalSteps: roadmaps.reduce((sum, r) => sum + r.totalSteps, 0),
    totalHours: roadmaps.reduce((sum, r) => sum + r.estimatedHours, 0),
  };

  if (showEditor) {
    return (
      <AdvancedRoadmapEditor
        roadmap={selectedRoadmap && roadmapDetails ? {
          ...(typeof roadmapDetails === 'object' ? roadmapDetails : {}),
          steps: (roadmapDetails as any)?.steps || []
        } : undefined}
        packages={packages}
        onSave={handleSaveRoadmap}
        onCancel={() => {
          setShowEditor(false);
          setSelectedRoadmap(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      <div className="animated-bg-overlay" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphism-card p-6 mb-6"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="neon-icon-wrapper">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white neon-text">
                Callern Roadmap Manager
              </h1>
              <p className="text-white/70 mt-1">
                Design and manage learning roadmaps for Callern packages
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateRoadmap}
            className="glossy-button-primary px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Roadmap
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glassmorphism-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Roadmaps</p>
              <p className="text-2xl font-bold text-white">{stats.totalRoadmaps}</p>
            </div>
            <BookOpen className="w-8 h-8 text-cyan-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glassmorphism-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Active Roadmaps</p>
              <p className="text-2xl font-bold text-white">{stats.activeRoadmaps}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glassmorphism-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Steps</p>
              <p className="text-2xl font-bold text-white">{stats.totalSteps}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glassmorphism-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Hours</p>
              <p className="text-2xl font-bold text-white">{stats.totalHours}h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glassmorphism-card p-4 mb-6"
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search roadmaps..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
          
          <select
            value={filterPackage || ''}
            onChange={(e) => setFilterPackage(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Packages</option>
            {packages.map(pkg => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.packageName}
              </option>
            ))}
          </select>

          <button className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition flex items-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </motion.div>

      {/* Roadmaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingRoadmaps ? (
          <div className="col-span-full text-center py-12">
            <div className="loading-spinner mx-auto" />
            <p className="text-white/50 mt-4">Loading roadmaps...</p>
          </div>
        ) : filteredRoadmaps.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Map className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/50 text-lg">
              {searchTerm || filterPackage ? 'No roadmaps found matching your filters' : 'No roadmaps yet. Create your first one!'}
            </p>
          </div>
        ) : (
          filteredRoadmaps.map((roadmap, index) => (
            <motion.div
              key={roadmap.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glassmorphism-card p-6 hover:shadow-neon-cyan transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">
                    {roadmap.roadmapName}
                  </h3>
                </div>
                {roadmap.isActive ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">
                    Inactive
                  </span>
                )}
              </div>
              
              <p className="text-white/60 text-sm mb-4 line-clamp-2">
                {roadmap.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50 flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    Steps
                  </span>
                  <span className="text-white">{roadmap.totalSteps}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Duration
                  </span>
                  <span className="text-white">{roadmap.estimatedHours} hours</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created
                  </span>
                  <span className="text-white">
                    {new Date(roadmap.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {roadmap.studentCount !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Students
                    </span>
                    <span className="text-white">{roadmap.studentCount}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEditRoadmap(roadmap)}
                  className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition flex items-center justify-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => duplicateRoadmap.mutate(roadmap.id)}
                  className="flex-1 px-3 py-2 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 transition flex items-center justify-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Clone
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this roadmap?')) {
                      deleteRoadmap.mutate(roadmap.id);
                    }
                  }}
                  className="px-3 py-2 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <style>{`
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #22d3ee;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .glassmorphism-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }
        
        .glossy-button-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          color: white;
          font-weight: 600;
        }
        
        .neon-icon-wrapper {
          padding: 12px;
          background: rgba(6, 182, 212, 0.2);
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
        }
        
        .neon-text {
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
        
        .shadow-neon-cyan {
          box-shadow: 0 0 30px rgba(6, 182, 212, 0.3);
        }
        
        .animated-bg-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.1;
          pointer-events: none;
          background: linear-gradient(45deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%);
          animation: gradientShift 10s ease infinite;
        }
        
        @keyframes gradientShift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-10px, -10px); }
        }
      `}</style>
    </div>
  );
}