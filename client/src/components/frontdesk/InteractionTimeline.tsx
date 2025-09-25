import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Users, 
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  ZoomIn,
  ZoomOut,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Edit,
  Tag,
  TrendingUp,
  FileText,
  MapPin
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimelineInteraction {
  id: number;
  type: 'phone_call' | 'walk_in' | 'email' | 'sms' | 'task';
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  interactionTime: string;
  status: string;
  outcome: string;
  urgencyLevel: string;
  handlerName: string;
  notes?: string;
  tags: string[];
  convertedToLead?: boolean;
  convertedToStudent?: boolean;
  followUpRequired?: boolean;
  callType?: 'incoming' | 'outgoing' | 'missed';
  callDuration?: number;
  visitType?: string;
  taskType?: string;
  priority?: string;
}

interface InteractionTimelineProps {
  interactions: TimelineInteraction[];
  onInteractionClick?: (interaction: TimelineInteraction) => void;
  onFilterChange?: (filters: any) => void;
  className?: string;
}

type ZoomLevel = 'hour' | 'day' | 'week' | 'month';

export function InteractionTimeline({ 
  interactions, 
  onInteractionClick, 
  onFilterChange,
  className 
}: InteractionTimelineProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Get icon for interaction type
  const getTypeIcon = (interaction: TimelineInteraction) => {
    switch (interaction.type) {
      case 'phone_call':
        switch (interaction.callType) {
          case 'incoming': return <PhoneIncoming className="h-4 w-4" />;
          case 'outgoing': return <PhoneOutgoing className="h-4 w-4" />;
          case 'missed': return <PhoneMissed className="h-4 w-4" />;
          default: return <Phone className="h-4 w-4" />;
        }
      case 'walk_in': return <Users className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'task': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Get color for interaction type
  const getTypeColor = (interaction: TimelineInteraction) => {
    switch (interaction.type) {
      case 'phone_call':
        switch (interaction.callType) {
          case 'incoming': return 'bg-green-500';
          case 'outgoing': return 'bg-blue-500';
          case 'missed': return 'bg-red-500';
          default: return 'bg-gray-500';
        }
      case 'walk_in': return 'bg-purple-500';
      case 'email': return 'bg-indigo-500';
      case 'sms': return 'bg-cyan-500';
      case 'task': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'successful':
      case 'converted': 
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending':
      case 'in_progress':
      case 'follow_up_required':
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
      case 'failed':
      case 'unsuccessful':
      case 'no_response':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  // Get urgency badge color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high':
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
      case 'normal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter interactions based on selected filters
  const filteredInteractions = useMemo(() => {
    let filtered = interactions;

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(interaction => selectedTypes.includes(interaction.type));
    }

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(interaction => selectedStatuses.includes(interaction.status));
    }

    return filtered.sort((a, b) => 
      new Date(b.interactionTime).getTime() - new Date(a.interactionTime).getTime()
    );
  }, [interactions, selectedTypes, selectedStatuses]);

  // Group interactions by time period
  const groupedInteractions = useMemo(() => {
    const groups: { [key: string]: TimelineInteraction[] } = {};

    filteredInteractions.forEach(interaction => {
      const date = parseISO(interaction.interactionTime);
      let key: string;

      switch (zoomLevel) {
        case 'hour':
          key = format(date, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          key = format(date, 'yyyy-\'W\'ww');
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(interaction);
    });

    return groups;
  }, [filteredInteractions, zoomLevel]);

  // Format group header
  const formatGroupHeader = (key: string) => {
    switch (zoomLevel) {
      case 'hour':
        const hourDate = parseISO(key + ':00');
        return format(hourDate, 'MMM d, yyyy - HH:mm');
      case 'day':
        const dayDate = parseISO(key);
        if (isToday(dayDate)) return 'Today';
        if (isYesterday(dayDate)) return 'Yesterday';
        return format(dayDate, 'EEEE, MMM d, yyyy');
      case 'week':
        return `Week ${key.split('W')[1]}, ${key.split('-')[0]}`;
      case 'month':
        const monthDate = parseISO(key + '-01');
        return format(monthDate, 'MMMM yyyy');
      default:
        return key;
    }
  };

  const handleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedStatuses([]);
  };

  const uniqueTypes = [...new Set(interactions.map(i => i.type))];
  const uniqueStatuses = [...new Set(interactions.map(i => i.status))];

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Interaction Timeline
          </CardTitle>
          
          {/* Timeline Controls */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel('hour')}
                className={cn(zoomLevel === 'hour' && 'bg-muted')}
                data-testid="zoom-hour"
              >
                Hour
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel('day')}
                className={cn(zoomLevel === 'day' && 'bg-muted')}
                data-testid="zoom-day"
              >
                Day
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel('week')}
                className={cn(zoomLevel === 'week' && 'bg-muted')}
                data-testid="zoom-week"
              >
                Week
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel('month')}
                className={cn(zoomLevel === 'month' && 'bg-muted')}
                data-testid="zoom-month"
              >
                Month
              </Button>
            </div>

            {/* Auto-play Control */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoPlay(!autoPlay)}
              data-testid="auto-play-toggle"
            >
              {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            {/* Reset Filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              data-testid="reset-filters"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 mt-4">
          {/* Type Filters */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Types:</span>
            {uniqueTypes.map(type => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => handleTypeFilter(type)}
                className={cn(
                  "text-xs",
                  selectedTypes.includes(type) && "bg-primary text-primary-foreground"
                )}
                data-testid={`filter-type-${type}`}
              >
                {type.replace('_', ' ')}
              </Button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Status Filters */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Status:</span>
            {uniqueStatuses.map(status => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => handleStatusFilter(status)}
                className={cn(
                  "text-xs",
                  selectedStatuses.includes(status) && "bg-primary text-primary-foreground"
                )}
                data-testid={`filter-status-${status}`}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-6">
            {Object.entries(groupedInteractions).map(([groupKey, groupInteractions]) => (
              <div key={groupKey} className="space-y-4">
                {/* Group Header */}
                <div className="sticky top-0 bg-background/95 backdrop-blur z-10 py-2 border-b">
                  <h3 className="font-semibold text-lg">{formatGroupHeader(groupKey)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {groupInteractions.length} interaction{groupInteractions.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Timeline Items */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-4">
                    {groupInteractions.map((interaction, index) => (
                      <div
                        key={interaction.id}
                        className="relative flex items-start gap-4 group"
                      >
                        {/* Timeline Node */}
                        <div className={cn(
                          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white z-10 shadow-lg",
                          getTypeColor(interaction)
                        )}>
                          {getTypeIcon(interaction)}
                        </div>

                        {/* Interaction Card */}
                        <Card 
                          className="flex-1 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => onInteractionClick?.(interaction)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{interaction.customerName}</h4>
                                  {getStatusIcon(interaction.status)}
                                  <Badge 
                                    variant="outline"
                                    className={cn("text-xs", getUrgencyColor(interaction.urgencyLevel))}
                                  >
                                    {interaction.urgencyLevel}
                                  </Badge>
                                  {interaction.convertedToLead && (
                                    <Badge className="text-xs bg-blue-100 text-blue-800">
                                      Lead
                                    </Badge>
                                  )}
                                  {interaction.convertedToStudent && (
                                    <Badge className="text-xs bg-green-100 text-green-800">
                                      Student
                                    </Badge>
                                  )}
                                </div>

                                {/* Details */}
                                <div className="text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {format(parseISO(interaction.interactionTime), 'HH:mm')}
                                    </span>
                                    <span>Handled by {interaction.handlerName}</span>
                                    {interaction.callDuration && (
                                      <span>{Math.floor(interaction.callDuration / 60)}min</span>
                                    )}
                                  </div>
                                  {interaction.customerPhone && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Phone className="h-3 w-3" />
                                      {interaction.customerPhone}
                                    </div>
                                  )}
                                </div>

                                {/* Outcome/Notes */}
                                {interaction.outcome && (
                                  <p className="text-sm mb-2">
                                    <span className="font-medium">Outcome:</span> {interaction.outcome}
                                  </p>
                                )}

                                {interaction.notes && (
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {interaction.notes}
                                  </p>
                                )}

                                {/* Tags */}
                                {interaction.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {interaction.tags.map((tag, tagIndex) => (
                                      <Badge
                                        key={tagIndex}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        <Tag className="h-3 w-3 mr-1" />
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Action Icons */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Follow-up indicator */}
                            {interaction.followUpRequired && (
                              <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm text-yellow-800">Follow-up required</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {Object.keys(groupedInteractions).length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No interactions found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or date range to see more interactions.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}