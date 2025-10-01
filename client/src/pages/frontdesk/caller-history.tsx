import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { InteractionTimeline } from '@/components/frontdesk/InteractionTimeline';
import { AnalyticsCharts } from '@/components/frontdesk/AnalyticsCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import AnalyticsView from '@/components/frontdesk/AnalyticsView';
import CustomerDetailSidebar from '@/components/frontdesk/CustomerDetailSidebar';
import InteractionDetailModal from '@/components/frontdesk/InteractionDetailModal';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing,
  Users, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageSquare,
  Mail,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  Printer,
  Share2,
  Star,
  Heart,
  Tag,
  Link,
  History,
  Zap,
  Target,
  Award,
  Settings,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar as CalendarDays,
  Activity,
  TrendingUpIcon,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, parseISO, addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

// Types for comprehensive caller history
interface CustomerInteraction {
  id: number;
  type: 'phone_call' | 'walk_in' | 'email' | 'sms' | 'task';
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  interactionTime: string;
  status: string;
  outcome: string;
  urgencyLevel: string;
  handledBy: number;
  handlerName: string;
  notes?: string;
  tags: string[];
  convertedToLead?: boolean;
  convertedToStudent?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
  
  // Phone call specific
  callType?: 'incoming' | 'outgoing' | 'missed';
  callDuration?: number;
  callResult?: string;
  
  // Walk-in specific
  visitType?: string;
  visitPurpose?: string;
  
  // Task specific
  taskType?: string;
  priority?: string;
  dueDate?: string;
  
  // Conversion tracking
  leadSource?: string;
  conversionStage?: string;
  revenueAttribution?: number;
}

interface SearchFilters {
  query: string;
  phoneNumber: string;
  email: string;
  dateFrom?: Date;
  dateTo?: Date;
  callType: string[];
  outcome: string[];
  urgencyLevel: string[];
  interactionType: string[];
  handledBy: string[];
  tags: string[];
  conversionStatus: string[];
}

interface AnalyticsData {
  totalInteractions: number;
  conversionRate: number;
  averageResponseTime: number;
  topPerformers: Array<{ name: string; interactions: number; conversions: number }>;
  conversionFunnel: Array<{ stage: string; count: number; rate: number }>;
  interactionTrends: Array<{ date: string; calls: number; walkIns: number; conversions: number }>;
  sourceAttribution: Array<{ source: string; count: number; revenue: number }>;
}

export default function CallerHistoryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // State for search and filters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    phoneNumber: '',
    email: '',
    dateFrom: subDays(new Date(), 30),
    dateTo: new Date(),
    callType: [],
    outcome: [],
    urgencyLevel: [],
    interactionType: [],
    handledBy: [],
    tags: [],
    conversionStatus: []
  });

  // UI state
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'analytics'>('list');
  const [selectedInteraction, setSelectedInteraction] = useState<CustomerInteraction | null>(null);
  const [timelineZoom, setTimelineZoom] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Debounced search for real-time searching
  const debouncedQuery = useDebounce(searchFilters.query, 300);
  const debouncedPhone = useDebounce(searchFilters.phoneNumber, 300);
  const debouncedEmail = useDebounce(searchFilters.email, 300);

  // Fetch customer interactions with comprehensive filtering
  const searchParams = useMemo(() => {
    const params: Record<string, any> = {};
    
    if (debouncedQuery) params.query = debouncedQuery;
    if (debouncedPhone) params.phone = debouncedPhone;
    if (debouncedEmail) params.email = debouncedEmail;
    if (searchFilters.dateFrom) params.dateFrom = searchFilters.dateFrom.toISOString();
    if (searchFilters.dateTo) params.dateTo = searchFilters.dateTo.toISOString();
    if (searchFilters.callType.length) params.callType = searchFilters.callType;
    if (searchFilters.outcome.length) params.outcome = searchFilters.outcome;
    if (searchFilters.urgencyLevel.length) params.urgencyLevel = searchFilters.urgencyLevel;
    if (searchFilters.interactionType.length) params.interactionType = searchFilters.interactionType;
    if (searchFilters.handledBy.length) params.handledBy = searchFilters.handledBy;
    if (searchFilters.tags.length) params.tag = searchFilters.tags;
    if (searchFilters.conversionStatus.length) params.conversionStatus = searchFilters.conversionStatus;
    
    return params;
  }, [
    debouncedQuery,
    debouncedPhone,
    debouncedEmail,
    searchFilters.dateFrom,
    searchFilters.dateTo,
    searchFilters.callType,
    searchFilters.outcome,
    searchFilters.urgencyLevel,
    searchFilters.interactionType,
    searchFilters.handledBy,
    searchFilters.tags,
    searchFilters.conversionStatus
  ]);

  const { 
    data: interactions = [], 
    isLoading: interactionsLoading, 
    error: interactionsError 
  } = useQuery({
    queryKey: ['/api/front-desk/interactions', searchParams],
    enabled: true
  });

  // Fetch analytics data
  const analyticsParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (searchFilters.dateFrom) params.dateFrom = searchFilters.dateFrom.toISOString();
    if (searchFilters.dateTo) params.dateTo = searchFilters.dateTo.toISOString();
    return params;
  }, [searchFilters.dateFrom, searchFilters.dateTo]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/front-desk/analytics', analyticsParams]
  });

  // Fetch staff members for filtering
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['/api/staff/front-desk']
  });

  // Customer profile data for unified view
  const { data: customerProfile } = useQuery({
    queryKey: ['/api/front-desk/customer-profile', selectedCustomer],
    enabled: !!selectedCustomer
  });

  // Export functionality
  const exportMutation = useMutation({
    mutationFn: async ({ format, filters }: { format: 'csv' | 'pdf' | 'excel'; filters: SearchFilters }) => {
      const params = new URLSearchParams();
      params.append('format', format);
      
      // Add all filters to export
      Object.entries(filters).forEach(([key, value]) => {
        if (value && (Array.isArray(value) ? value.length > 0 : true)) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/front-desk/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      return response.blob();
    },
    onSuccess: (blob, { format }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caller-history-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Your ${format.toUpperCase()} file has been downloaded.`
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Group interactions by customer for unified view
  const customerGroups = useMemo(() => {
    const groups: Record<string, CustomerInteraction[]> = {};
    
    interactions.forEach((interaction: CustomerInteraction) => {
      const key = interaction.customerPhone || interaction.customerEmail || interaction.customerName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(interaction);
    });
    
    // Sort interactions within each group by date
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(b.interactionTime).getTime() - new Date(a.interactionTime).getTime());
    });
    
    return groups;
  }, [interactions]);

  // Save search to recent searches
  const saveSearchToRecent = useCallback((query: string) => {
    if (query.trim() && !recentSearches.includes(query)) {
      const newRecent = [query, ...recentSearches.slice(0, 4)];
      setRecentSearches(newRecent);
      localStorage.setItem('recent_searches', JSON.stringify(newRecent));
    }
  }, [recentSearches]);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search when query changes
  useEffect(() => {
    if (debouncedQuery) {
      saveSearchToRecent(debouncedQuery);
    }
  }, [debouncedQuery, saveSearchToRecent]);

  // Filter functions
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setSearchFilters({
      query: '',
      phoneNumber: '',
      email: '',
      dateFrom: subDays(new Date(), 30),
      dateTo: new Date(),
      callType: [],
      outcome: [],
      urgencyLevel: [],
      interactionType: [],
      handledBy: [],
      tags: [],
      conversionStatus: []
    });
  };

  // Status and type helpers
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'phone_call': return <Phone className="h-4 w-4" />;
      case 'walk_in': return <Users className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
      case 'completed':
      case 'converted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'follow_up_needed':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
      case 'cancelled':
      case 'no_answer':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900" data-testid="caller-history-dashboard">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Caller History Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive customer interaction tracking and analytics
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <TabsList>
                  <TabsTrigger value="list" data-testid="view-list">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="timeline" data-testid="view-timeline">
                    <History className="h-4 w-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="analytics" data-testid="view-analytics">
                    <PieChart className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Export Options */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportMutation.mutate({ format: 'csv', filters: searchFilters })}
                  disabled={exportMutation.isPending}
                  data-testid="export-csv"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportMutation.mutate({ format: 'pdf', filters: searchFilters })}
                  disabled={exportMutation.isPending}
                  data-testid="export-pdf"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center space-x-4">
            {/* Main Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, phone, email, or notes..."
                value={searchFilters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
              
              {/* Recent Searches Dropdown */}
              {recentSearches.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mt-1 z-10 shadow-lg">
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    Recent Searches
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => updateFilter('query', search)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      data-testid={`recent-search-${index}`}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone Number Search */}
            <div className="w-48">
              <Input
                placeholder="Phone (09xxxxxxxxx)"
                value={searchFilters.phoneNumber}
                onChange={(e) => updateFilter('phoneNumber', e.target.value)}
                data-testid="phone-search"
              />
            </div>

            {/* Email Search */}
            <div className="w-48">
              <Input
                placeholder="Email address"
                value={searchFilters.email}
                onChange={(e) => updateFilter('email', e.target.value)}
                data-testid="email-search"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="date-from">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {searchFilters.dateFrom ? format(searchFilters.dateFrom, 'MMM dd') : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={searchFilters.dateFrom}
                    onSelect={(date) => updateFilter('dateFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="date-to">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {searchFilters.dateTo ? format(searchFilters.dateTo, 'MMM dd') : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={searchFilters.dateTo}
                    onSelect={(date) => updateFilter('dateTo', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              data-testid="toggle-advanced-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(searchFilters.callType.length > 0 || 
                searchFilters.outcome.length > 0 || 
                searchFilters.urgencyLevel.length > 0 ||
                searchFilters.interactionType.length > 0 ||
                searchFilters.handledBy.length > 0 ||
                searchFilters.tags.length > 0 ||
                searchFilters.conversionStatus.length > 0) && (
                <Badge variant="secondary" className="ml-2">
                  {[
                    ...searchFilters.callType,
                    ...searchFilters.outcome,
                    ...searchFilters.urgencyLevel,
                    ...searchFilters.interactionType,
                    ...searchFilters.handledBy,
                    ...searchFilters.tags,
                    ...searchFilters.conversionStatus
                  ].length}
                </Badge>
              )}
            </Button>

            {/* Reset Filters */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              data-testid="reset-filters"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Call Type Filter */}
                <div>
                  <Label className="text-sm font-medium">Call Type</Label>
                  <div className="mt-2 space-y-2">
                    {['incoming', 'outgoing', 'missed'].map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`call-type-${type}`}
                          checked={searchFilters.callType.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter('callType', [...searchFilters.callType, type]);
                            } else {
                              updateFilter('callType', searchFilters.callType.filter(t => t !== type));
                            }
                          }}
                          data-testid={`filter-call-type-${type}`}
                        />
                        <Label htmlFor={`call-type-${type}`} className="text-sm capitalize">
                          {type.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outcome Filter */}
                <div>
                  <Label className="text-sm font-medium">Outcome</Label>
                  <div className="mt-2 space-y-2">
                    {['successful', 'voicemail', 'no_answer', 'busy', 'callback'].map(outcome => (
                      <div key={outcome} className="flex items-center space-x-2">
                        <Checkbox
                          id={`outcome-${outcome}`}
                          checked={searchFilters.outcome.includes(outcome)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter('outcome', [...searchFilters.outcome, outcome]);
                            } else {
                              updateFilter('outcome', searchFilters.outcome.filter(o => o !== outcome));
                            }
                          }}
                          data-testid={`filter-outcome-${outcome}`}
                        />
                        <Label htmlFor={`outcome-${outcome}`} className="text-sm capitalize">
                          {outcome.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Urgency Level Filter */}
                <div>
                  <Label className="text-sm font-medium">Urgency</Label>
                  <div className="mt-2 space-y-2">
                    {['low', 'medium', 'high', 'urgent'].map(level => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={`urgency-${level}`}
                          checked={searchFilters.urgencyLevel.includes(level)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter('urgencyLevel', [...searchFilters.urgencyLevel, level]);
                            } else {
                              updateFilter('urgencyLevel', searchFilters.urgencyLevel.filter(l => l !== level));
                            }
                          }}
                          data-testid={`filter-urgency-${level}`}
                        />
                        <Label htmlFor={`urgency-${level}`} className="text-sm capitalize">
                          {level}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interaction Type Filter */}
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-2 space-y-2">
                    {['phone_call', 'walk_in', 'email', 'sms', 'task'].map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`interaction-${type}`}
                          checked={searchFilters.interactionType.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter('interactionType', [...searchFilters.interactionType, type]);
                            } else {
                              updateFilter('interactionType', searchFilters.interactionType.filter(t => t !== type));
                            }
                          }}
                          data-testid={`filter-type-${type}`}
                        />
                        <Label htmlFor={`interaction-${type}`} className="text-sm capitalize">
                          {type.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span data-testid="results-count">
                {interactionsLoading ? 'Loading...' : `${interactions.length} interactions found`}
              </span>
              {Object.keys(customerGroups).length > 0 && (
                <span data-testid="customers-count">
                  {Object.keys(customerGroups).length} unique customers
                </span>
              )}
              {analytics && (
                <span data-testid="conversion-rate">
                  {analytics.conversionRate}% conversion rate
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {interactionsLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {format(new Date(), 'HH:mm:ss')}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'list' && (
            <div className="p-6">
              {interactionsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(customerGroups).map(([customerKey, interactions]) => {
                    const latestInteraction = interactions[0];
                    const totalInteractions = interactions.length;
                    const conversions = interactions.filter(i => i.convertedToLead || i.convertedToStudent).length;
                    
                    return (
                      <Card 
                        key={customerKey} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedCustomer(customerKey)}
                        data-testid={`customer-card-${customerKey}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold">
                                {latestInteraction.customerName}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                <div className="flex items-center space-x-4">
                                  {latestInteraction.customerPhone && (
                                    <span className="flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {latestInteraction.customerPhone}
                                    </span>
                                  )}
                                  {latestInteraction.customerEmail && (
                                    <span className="flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {latestInteraction.customerEmail}
                                    </span>
                                  )}
                                </div>
                              </CardDescription>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={getStatusColor(latestInteraction.status)}
                                data-testid={`status-${latestInteraction.status}`}
                              >
                                {latestInteraction.status.replace('_', ' ')}
                              </Badge>
                              
                              <Badge 
                                variant="outline" 
                                className={getUrgencyColor(latestInteraction.urgencyLevel)}
                                data-testid={`urgency-${latestInteraction.urgencyLevel}`}
                              >
                                {latestInteraction.urgencyLevel}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-3">
                            {/* Latest Interaction Summary */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getInteractionIcon(latestInteraction.type)}
                                <span className="text-sm font-medium capitalize">
                                  {latestInteraction.type.replace('_', ' ')}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {format(parseISO(latestInteraction.interactionTime), 'MMM dd, HH:mm')}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                by {latestInteraction.handlerName}
                              </div>
                            </div>

                            {/* Interaction Stats */}
                            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                  {totalInteractions}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Interactions
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                  {conversions}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Conversions
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                  {conversions > 0 ? Math.round((conversions / totalInteractions) * 100) : 0}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Rate
                                </div>
                              </div>
                            </div>

                            {/* Recent Notes Preview */}
                            {latestInteraction.notes && (
                              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {latestInteraction.notes}
                                </p>
                              </div>
                            )}

                            {/* Tags */}
                            {latestInteraction.tags && latestInteraction.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {latestInteraction.tags.slice(0, 3).map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="text-xs"
                                    data-testid={`tag-${tag}`}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {latestInteraction.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{latestInteraction.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Mini Timeline */}
                            <div className="pt-2">
                              <div className="flex items-center space-x-1">
                                {interactions.slice(0, 5).map((interaction, index) => (
                                  <div
                                    key={index}
                                    className={cn(
                                      "w-3 h-3 rounded-full",
                                      interaction.type === 'phone_call' ? 'bg-blue-400' :
                                      interaction.type === 'walk_in' ? 'bg-green-400' :
                                      interaction.type === 'email' ? 'bg-purple-400' :
                                      interaction.type === 'sms' ? 'bg-yellow-400' :
                                      'bg-gray-400'
                                    )}
                                    title={`${interaction.type} - ${format(parseISO(interaction.interactionTime), 'MMM dd')}`}
                                    data-testid={`timeline-dot-${index}`}
                                  />
                                ))}
                                {interactions.length > 5 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                    +{interactions.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {viewMode === 'timeline' && (
            <InteractionTimeline
              interactions={interactions}
              onInteractionClick={setSelectedInteraction}
              className="m-6"
            />
          )}

          {viewMode === 'analytics' && (
            <div className="p-6">
              <AnalyticsCharts 
                analytics={analytics}
                interactions={interactions}
                loading={analyticsLoading}
                dateRange={{ from: searchFilters.dateFrom, to: searchFilters.dateTo }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Customer Detail Sidebar */}
      {selectedCustomer && (
        <CustomerDetailSidebar
          customerKey={selectedCustomer}
          interactions={customerGroups[selectedCustomer] || []}
          customerProfile={customerProfile}
          onClose={() => setSelectedCustomer(null)}
          onInteractionSelect={setSelectedInteraction}
        />
      )}

      {/* Interaction Detail Modal */}
      {selectedInteraction && (
        <InteractionDetailModal
          interaction={selectedInteraction}
          onClose={() => setSelectedInteraction(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/front-desk/interactions'] });
          }}
        />
      )}
    </div>
  );
}

// Timeline View Component
interface TimelineViewProps {
  interactions: CustomerInteraction[];
  customerGroups: Record<string, CustomerInteraction[]>;
  selectedCustomer: string | null;
  timelineZoom: 'day' | 'week' | 'month' | 'year';
  onZoomChange: (zoom: 'day' | 'week' | 'month' | 'year') => void;
  onInteractionSelect: (interaction: CustomerInteraction) => void;
}

function TimelineView({ 
  interactions, 
  customerGroups, 
  selectedCustomer, 
  timelineZoom, 
  onZoomChange, 
  onInteractionSelect 
}: TimelineViewProps) {
  const relevantInteractions = selectedCustomer 
    ? customerGroups[selectedCustomer] || []
    : interactions;

  // Group interactions by date for timeline display
  const timelineData = useMemo(() => {
    const groups: Record<string, CustomerInteraction[]> = {};
    
    relevantInteractions.forEach(interaction => {
      let dateKey: string;
      const date = parseISO(interaction.interactionTime);
      
      switch (timelineZoom) {
        case 'day':
          dateKey = format(date, 'yyyy-MM-dd HH:00');
          break;
        case 'week':
          dateKey = format(date, 'yyyy-MM-dd');
          break;
        case 'month':
          dateKey = format(date, 'yyyy-MM-dd');
          break;
        case 'year':
          dateKey = format(date, 'yyyy-MM');
          break;
        default:
          dateKey = format(date, 'yyyy-MM-dd');
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(interaction);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 50); // Limit to 50 entries for performance
  }, [relevantInteractions, timelineZoom]);

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Timeline View</CardTitle>
            <div className="flex items-center space-x-2">
              <Label className="text-sm">Zoom:</Label>
              <Select value={timelineZoom} onValueChange={onZoomChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      <div className="space-y-6">
        {timelineData.map(([dateKey, dayInteractions]) => (
          <Card key={dateKey} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {format(parseISO(dayInteractions[0].interactionTime), 
                  timelineZoom === 'day' ? 'MMM dd, yyyy HH:00' :
                  timelineZoom === 'week' || timelineZoom === 'month' ? 'MMM dd, yyyy' :
                  'MMM yyyy'
                )}
              </CardTitle>
              <CardDescription>
                {dayInteractions.length} interaction{dayInteractions.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {dayInteractions
                  .sort((a, b) => new Date(b.interactionTime).getTime() - new Date(a.interactionTime).getTime())
                  .map((interaction, index) => (
                    <div 
                      key={interaction.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => onInteractionSelect(interaction)}
                      data-testid={`timeline-interaction-${interaction.id}`}
                    >
                      {/* Timeline Indicator */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white",
                          interaction.type === 'phone_call' ? 'bg-blue-500' :
                          interaction.type === 'walk_in' ? 'bg-green-500' :
                          interaction.type === 'email' ? 'bg-purple-500' :
                          interaction.type === 'sms' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        )}>
                          {interaction.type === 'phone_call' && <Phone className="h-4 w-4" />}
                          {interaction.type === 'walk_in' && <Users className="h-4 w-4" />}
                          {interaction.type === 'email' && <Mail className="h-4 w-4" />}
                          {interaction.type === 'sms' && <MessageSquare className="h-4 w-4" />}
                          {interaction.type === 'task' && <CheckCircle className="h-4 w-4" />}
                        </div>
                        {index < dayInteractions.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 mt-2" />
                        )}
                      </div>

                      {/* Interaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {interaction.customerName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {format(parseISO(interaction.interactionTime), 'HH:mm')} - {interaction.type.replace('_', ' ')}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={cn("text-xs", getStatusColor(interaction.status))}>
                              {interaction.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={cn("text-xs", getUrgencyColor(interaction.urgencyLevel))}>
                              {interaction.urgencyLevel}
                            </Badge>
                          </div>
                        </div>

                        {interaction.notes && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {interaction.notes}
                          </p>
                        )}

                        {interaction.tags && interaction.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {interaction.tags.slice(0, 3).map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {interaction.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{interaction.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper function to get appropriate colors based on status
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'successful':
    case 'completed':
    case 'converted':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'pending':
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'follow_up_needed':
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'failed':
    case 'cancelled':
    case 'no_answer':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function getUrgencyColor(urgency: string): string {
  switch (urgency.toLowerCase()) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}