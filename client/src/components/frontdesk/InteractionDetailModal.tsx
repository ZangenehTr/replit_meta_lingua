import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Flag
} from 'lucide-react';
import { format, parseISO, formatDuration, intervalToDuration } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
  callStartTime?: string;
  callEndTime?: string;
  
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

const updateNotesSchema = z.object({
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.string().optional(),
  outcome: z.string().optional(),
  urgencyLevel: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().optional(),
  actionItems: z.string().optional(),
  nextSteps: z.string().optional(),
  customerSatisfaction: z.number().min(1).max(5).optional()
});

type UpdateNotesFormData = z.infer<typeof updateNotesSchema>;

interface InteractionDetailModalProps {
  interaction: CustomerInteraction;
  onClose: () => void;
  onUpdate: () => void;
}

export function InteractionDetailModal({ interaction, onClose, onUpdate }: InteractionDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'edit' | 'followup'>('details');

  const form = useForm<UpdateNotesFormData>({
    resolver: zodResolver(updateNotesSchema),
    defaultValues: {
      notes: interaction.notes || '',
      tags: interaction.tags || [],
      status: interaction.status,
      outcome: interaction.outcome,
      urgencyLevel: interaction.urgencyLevel,
      followUpRequired: interaction.followUpRequired || false,
      followUpDate: interaction.followUpDate || '',
      actionItems: interaction.actionItems || '',
      nextSteps: interaction.nextSteps || '',
      customerSatisfaction: interaction.customerSatisfaction
    }
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (data: UpdateNotesFormData) => {
      return apiRequest(`/api/front-desk/interactions/${interaction.id}/notes`, {
        method: 'PUT',
        body: {
          ...data,
          type: interaction.type
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Updated Successfully",
        description: "Interaction details have been updated."
      });
      setIsEditing(false);
      onUpdate();
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/interactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/analytics'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update interaction. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return apiRequest(`/api/front-desk/interactions/${interaction.id}/create-task`, {
        method: 'POST',
        body: {
          ...taskData,
          type: interaction.type
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Task Created",
        description: "Follow-up task has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/interactions'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: UpdateNotesFormData) => {
    updateNotesMutation.mutate(data);
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'phone_call': return <Phone className="h-5 w-5" />;
      case 'walk_in': return <Users className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'sms': return <MessageSquare className="h-5 w-5" />;
      case 'task': return <CheckCircle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
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

  const formatCallDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    
    const interval = intervalToDuration({ start: 0, end: duration * 1000 });
    return formatDuration(interval, { format: ['hours', 'minutes', 'seconds'] });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white",
                interaction.type === 'phone_call' ? 'bg-blue-500' :
                interaction.type === 'walk_in' ? 'bg-green-500' :
                interaction.type === 'email' ? 'bg-purple-500' :
                interaction.type === 'sms' ? 'bg-yellow-500' :
                'bg-gray-500'
              )}>
                {getInteractionIcon(interaction.type)}
              </div>
              
              <div>
                <DialogTitle className="text-lg" data-testid="interaction-title">
                  {interaction.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} with {interaction.customerName}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {format(parseISO(interaction.interactionTime), 'MMM dd, yyyy HH:mm')} • Handled by {interaction.handlerName}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(interaction.status)} data-testid="interaction-status">
                {interaction.status.replace('_', ' ')}
              </Badge>
              
              <Badge variant="outline" data-testid="interaction-urgency">
                {interaction.urgencyLevel}
              </Badge>
              
              {(interaction.convertedToLead || interaction.convertedToStudent) && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Target className="h-3 w-3 mr-1" />
                  Converted
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="edit" data-testid="tab-edit">Edit</TabsTrigger>
            <TabsTrigger value="followup" data-testid="tab-followup">Follow-up</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="details" className="space-y-4 mt-0">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Name</Label>
                    <p className="mt-1 font-medium" data-testid="customer-name">{interaction.customerName}</p>
                  </div>
                  
                  {interaction.customerPhone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</Label>
                      <p className="mt-1 font-medium flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {interaction.customerPhone}
                      </p>
                    </div>
                  )}
                  
                  {interaction.customerEmail && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</Label>
                      <p className="mt-1 font-medium flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {interaction.customerEmail}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Interaction Type</Label>
                    <p className="mt-1 font-medium capitalize">{interaction.type.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</Label>
                    <p className="mt-1 font-medium">{format(parseISO(interaction.interactionTime), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Handled By</Label>
                    <p className="mt-1 font-medium">{interaction.handlerName}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Phone Call Specific Details */}
              {interaction.type === 'phone_call' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Call Type</Label>
                      <div className="mt-1 flex items-center">
                        {getCallTypeIcon(interaction.callType)}
                        <span className="ml-2 font-medium capitalize">{interaction.callType}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</Label>
                      <p className="mt-1 font-medium">{formatCallDuration(interaction.callDuration)}</p>
                    </div>
                    
                    {interaction.callResult && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Call Result</Label>
                        <p className="mt-1 font-medium capitalize">{interaction.callResult.replace('_', ' ')}</p>
                      </div>
                    )}
                    
                    {interaction.customerSatisfaction && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Satisfaction</Label>
                        <div className="mt-1 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn(
                                "h-4 w-4",
                                i < (interaction.customerSatisfaction || 0) 
                                  ? "text-yellow-400 fill-current" 
                                  : "text-gray-300"
                              )} 
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">
                            {interaction.customerSatisfaction}/5
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Walk-in Specific Details */}
              {interaction.type === 'walk_in' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Visit Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {interaction.visitType && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Visit Type</Label>
                        <p className="mt-1 font-medium capitalize">{interaction.visitType.replace('_', ' ')}</p>
                      </div>
                    )}
                    
                    {interaction.visitPurpose && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Purpose</Label>
                        <p className="mt-1 font-medium">{interaction.visitPurpose}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes and Content */}
              {interaction.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed" data-testid="interaction-notes">
                      {interaction.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Action Items & Next Steps */}
              {(interaction.actionItems || interaction.nextSteps) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Action Items & Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {interaction.actionItems && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Action Items</Label>
                        <p className="mt-1 text-sm">{interaction.actionItems}</p>
                      </div>
                    )}
                    
                    {interaction.nextSteps && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Steps</Label>
                        <p className="mt-1 text-sm">{interaction.nextSteps}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {interaction.tags && interaction.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {interaction.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" data-testid={`tag-${tag}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Follow-up Information */}
              {interaction.followUpRequired && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Follow-up Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interaction.followUpDate && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Scheduled for {format(parseISO(interaction.followUpDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="edit" className="space-y-4 mt-0">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Edit Interaction</CardTitle>
                    <CardDescription>Update notes, status, and other details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <RichTextEditor
                        content={form.watch('notes') || ''}
                        onChange={(content) => form.setValue('notes', content)}
                        placeholder="Add detailed notes about this interaction..."
                        collaborativeId={`interaction-notes-${interaction.id}`}
                        autoSave={true}
                        onSave={(content) => {
                          console.log('Auto-saving notes:', content);
                          // Auto-save will be triggered automatically
                        }}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value)}>
                          <SelectTrigger data-testid="edit-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="follow_up_needed">Follow-up Needed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="urgencyLevel">Urgency Level</Label>
                        <Select value={form.watch('urgencyLevel')} onValueChange={(value) => form.setValue('urgencyLevel', value)}>
                          <SelectTrigger data-testid="edit-urgency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="actionItems">Action Items</Label>
                      <Textarea
                        id="actionItems"
                        {...form.register('actionItems')}
                        placeholder="List any action items or commitments made..."
                        data-testid="edit-action-items"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nextSteps">Next Steps</Label>
                      <Textarea
                        id="nextSteps"
                        {...form.register('nextSteps')}
                        placeholder="Describe recommended next steps..."
                        data-testid="edit-next-steps"
                      />
                    </div>

                    {interaction.type === 'phone_call' && (
                      <div>
                        <Label htmlFor="customerSatisfaction">Customer Satisfaction (1-5)</Label>
                        <Select 
                          value={form.watch('customerSatisfaction')?.toString() || ''} 
                          onValueChange={(value) => form.setValue('customerSatisfaction', parseInt(value))}
                        >
                          <SelectTrigger data-testid="edit-satisfaction">
                            <SelectValue placeholder="Rate customer satisfaction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Very Unsatisfied</SelectItem>
                            <SelectItem value="2">2 - Unsatisfied</SelectItem>
                            <SelectItem value="3">3 - Neutral</SelectItem>
                            <SelectItem value="4">4 - Satisfied</SelectItem>
                            <SelectItem value="5">5 - Very Satisfied</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab('details')}
                    data-testid="cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateNotesMutation.isPending}
                    data-testid="save-changes"
                  >
                    {updateNotesMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="followup" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Create Follow-up</CardTitle>
                  <CardDescription>Generate tasks or schedule follow-up actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Plus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Follow-up creation form will be implemented here</p>
                    <p className="text-sm">Task scheduling and automation features</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default InteractionDetailModal;