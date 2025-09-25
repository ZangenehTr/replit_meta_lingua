import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing,
  Mail, 
  MessageSquare, 
  Users, 
  User,
  Calendar,
  Clock,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Tag,
  Activity,
  Target,
  Plus,
  Trash2,
  Link,
  ExternalLink,
  History,
  Bell,
  Flag,
  TrendingUp,
  TrendingDown,
  UserPlus,
  DollarSign,
  Award,
  Zap,
  Heart
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  
  // Additional details
  actionItems?: string;
  nextSteps?: string;
  customerSatisfaction?: number;
  leadSource?: string;
  interestedLanguage?: string;
  currentLevel?: string;
  budget?: number;
}

interface CustomerProfile {
  customerKey: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalInteractions: number;
  firstInteractionDate: string;
  lastInteractionDate: string;
  conversionStatus: string;
  leadSource?: string;
  interestedLanguages: string[];
  currentLevel?: string;
  budget?: number;
  tags: string[];
  notes: string;
  lifetimeValue: number;
  conversionProbability: number;
  preferredContactMethod: string;
  bestTimeToContact: string;
  languagePreference: string;
  
  // Analytics
  interactionTypes: Record<string, number>;
  outcomeBreakdown: Record<string, number>;
  conversionFunnel: Array<{ stage: string; achieved: boolean; date?: string }>;
  satisfactionScores: number[];
  averageSatisfaction: number;
  
  // Related customers
  relatedCustomers: Array<{
    name: string;
    relationship: string;
    phone?: string;
    email?: string;
  }>;
  
  // Recent activity
  recentActivity: Array<{
    type: string;
    description: string;
    date: string;
    handlerName: string;
  }>;
}

interface CustomerDetailSidebarProps {
  customerKey: string;
  interactions: CustomerInteraction[];
  customerProfile?: CustomerProfile;
  onClose: () => void;
  onInteractionSelect: (interaction: CustomerInteraction) => void;
}

export function CustomerDetailSidebar({ 
  customerKey, 
  interactions, 
  customerProfile,
  onClose, 
  onInteractionSelect 
}: CustomerDetailSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'analytics' | 'notes'>('overview');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [customerNotes, setCustomerNotes] = useState(customerProfile?.notes || '');

  // Get the latest interaction for basic info
  const latestInteraction = interactions[0];

  // Calculate basic stats
  const totalInteractions = interactions.length;
  const conversions = interactions.filter(i => i.convertedToLead || i.convertedToStudent).length;
  const conversionRate = totalInteractions > 0 ? (conversions / totalInteractions) * 100 : 0;
  const avgSatisfaction = interactions
    .filter(i => i.customerSatisfaction)
    .reduce((sum, i) => sum + (i.customerSatisfaction || 0), 0) / 
    interactions.filter(i => i.customerSatisfaction).length;

  // Group interactions by type
  const interactionsByType = interactions.reduce((acc, interaction) => {
    if (!acc[interaction.type]) {
      acc[interaction.type] = [];
    }
    acc[interaction.type].push(interaction);
    return acc;
  }, {} as Record<string, CustomerInteraction[]>);

  // Update customer notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await fetch(`/api/front-desk/customer-profile/${customerKey}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ notes })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notes');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notes Updated",
        description: "Customer notes have been saved successfully."
      });
      setIsEditingNotes(false);
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/customer-profile', customerKey] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notes. Please try again.",
        variant: "destructive"
      });
    }
  });

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

  const getCallTypeIcon = (callType?: string) => {
    switch (callType) {
      case 'incoming': return <PhoneIncoming className="h-4 w-4 text-green-500" />;
      case 'outgoing': return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
      case 'missed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  const saveNotes = () => {
    updateNotesMutation.mutate(customerNotes);
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[700px] p-0 flex flex-col" data-testid="customer-detail-sidebar">
        <SheetHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-500 text-white text-lg font-semibold">
                  {latestInteraction?.customerName?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <SheetTitle className="text-lg" data-testid="customer-name">
                  {latestInteraction?.customerName || 'Unknown Customer'}
                </SheetTitle>
                <SheetDescription className="mt-1">
                  <div className="flex items-center space-x-4 text-sm">
                    {latestInteraction?.customerPhone && (
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {latestInteraction.customerPhone}
                      </span>
                    )}
                    {latestInteraction?.customerEmail && (
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {latestInteraction.customerEmail}
                      </span>
                    )}
                  </div>
                </SheetDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {conversions > 0 && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Target className="h-3 w-3 mr-1" />
                  Converted
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                data-testid="close-sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Quick Stats */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="total-interactions">
                {totalInteractions}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Interactions</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="conversions">
                {conversions}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Conversions</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="conversion-rate">
                {conversionRate.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="satisfaction-score">
                {avgSatisfaction ? avgSatisfaction.toFixed(1) : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 m-6 mb-0">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="interactions" data-testid="tab-interactions">History</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-6 pt-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</Label>
                      <p className="mt-1">{latestInteraction?.customerPhone || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</Label>
                      <p className="mt-1">{latestInteraction?.customerEmail || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">First Contact</Label>
                      <p className="mt-1">
                        {format(parseISO(interactions[interactions.length - 1]?.interactionTime), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Contact</Label>
                      <p className="mt-1">
                        {formatDistanceToNow(parseISO(interactions[0]?.interactionTime), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interaction Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Interaction Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(interactionsByType).map(([type, typeInteractions]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getInteractionIcon(type)}
                          <span className="text-sm capitalize" data-testid={`interaction-type-${type}`}>
                            {type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{typeInteractions.length}</span>
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ 
                                width: `${(typeInteractions.length / totalInteractions) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <History className="h-4 w-4 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {interactions.slice(0, 3).map((interaction, index) => (
                      <div 
                        key={interaction.id}
                        className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => onInteractionSelect(interaction)}
                        data-testid={`recent-activity-${index}`}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white",
                          interaction.type === 'phone_call' ? 'bg-blue-500' :
                          interaction.type === 'walk_in' ? 'bg-green-500' :
                          interaction.type === 'email' ? 'bg-purple-500' :
                          interaction.type === 'sms' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        )}>
                          {getInteractionIcon(interaction.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium capitalize">
                              {interaction.type.replace('_', ' ')}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(parseISO(interaction.interactionTime), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {interaction.notes ? 
                              interaction.notes.substring(0, 60) + (interaction.notes.length > 60 ? '...' : '') :
                              `${interaction.status} - ${interaction.outcome}`
                            }
                          </p>
                          
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getStatusColor(interaction.status))}
                            >
                              {interaction.status.replace('_', ' ')}
                            </Badge>
                            
                            {interaction.convertedToLead || interaction.convertedToStudent ? (
                              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <Target className="h-2 w-2 mr-1" />
                                Converted
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {interactions.length > 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setActiveTab('interactions')}
                        data-testid="view-all-interactions"
                      >
                        View All {totalInteractions} Interactions
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    
                    <Button variant="outline" size="sm" className="justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    
                    <Button variant="outline" size="sm" className="justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      SMS
                    </Button>
                    
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4 mt-0">
              <div className="space-y-3">
                {interactions.map((interaction, index) => (
                  <Card 
                    key={interaction.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onInteractionSelect(interaction)}
                    data-testid={`interaction-card-${index}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0",
                          interaction.type === 'phone_call' ? 'bg-blue-500' :
                          interaction.type === 'walk_in' ? 'bg-green-500' :
                          interaction.type === 'email' ? 'bg-purple-500' :
                          interaction.type === 'sms' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        )}>
                          {getInteractionIcon(interaction.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm capitalize">
                              {interaction.type.replace('_', ' ')}
                              {interaction.callType && (
                                <span className="ml-2 inline-flex items-center">
                                  {getCallTypeIcon(interaction.callType)}
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(parseISO(interaction.interactionTime), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Handled by {interaction.handlerName}
                          </p>
                          
                          {interaction.notes && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                              {interaction.notes}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getStatusColor(interaction.status))}
                              >
                                {interaction.status.replace('_', ' ')}
                              </Badge>
                              
                              <Badge variant="outline" className="text-xs">
                                {interaction.urgencyLevel}
                              </Badge>
                            </div>
                            
                            {(interaction.convertedToLead || interaction.convertedToStudent) && (
                              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <Target className="h-2 w-2 mr-1" />
                                Converted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Conversion Rate</span>
                        <span className="text-sm">{conversionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={conversionRate} className="h-2" />
                    </div>
                    
                    {avgSatisfaction && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Average Satisfaction</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">{avgSatisfaction.toFixed(1)}</span>
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          </div>
                        </div>
                        <Progress value={(avgSatisfaction / 5) * 100} className="h-2" />
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Engagement Score</span>
                        <span className="text-sm">{Math.min(totalInteractions * 10, 100)}%</span>
                      </div>
                      <Progress value={Math.min(totalInteractions * 10, 100)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Interaction Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Interactive timeline charts will be implemented here</p>
                    <p className="text-sm">Using Chart.js or Recharts for visualization</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Customer Notes
                    </CardTitle>
                    
                    {!isEditingNotes ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingNotes(true)}
                        data-testid="edit-notes-button"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditingNotes(false);
                            setCustomerNotes(customerProfile?.notes || '');
                          }}
                          data-testid="cancel-notes-edit"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveNotes}
                          disabled={updateNotesMutation.isPending}
                          data-testid="save-notes-button"
                        >
                          {updateNotesMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingNotes ? (
                    <Textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Add notes about this customer..."
                      className="min-h-[200px] resize-none"
                      data-testid="customer-notes-textarea"
                    />
                  ) : (
                    <div className="min-h-[200px]">
                      {customerNotes ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" data-testid="customer-notes-display">
                          {customerNotes}
                        </p>
                      ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No notes yet</p>
                          <p className="text-xs">Click Edit to add customer notes</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {/* Collect all unique tags from interactions */}
                    {Array.from(new Set(interactions.flatMap(i => i.tags || []))).map((tag, index) => (
                      <Badge key={index} variant="outline" data-testid={`customer-tag-${tag}`}>
                        {tag}
                      </Badge>
                    ))}
                    
                    {interactions.flatMap(i => i.tags || []).length === 0 && (
                      <div className="text-center w-full py-4 text-gray-500 dark:text-gray-400">
                        <Tag className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tags assigned</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default CustomerDetailSidebar;