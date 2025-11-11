import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { Target, Plus, UserCheck, Clock, TrendingUp, Search, Filter, Phone, Mail, Eye, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';
import { faIR } from 'date-fns/locale';

interface Prospect {
  id: number;
  leadId?: number;
  userId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  source?: string;
  status?: string;
  priority?: string;
  interestedLanguage?: string;
  level?: string;
  lastContact?: string;
  followUpDate?: string;
  createdAt?: string;
  notes?: string;
  budget?: number;
  preferredFormat?: string;
}

interface UnifiedViewResponse {
  success: boolean;
  prospects: Prospect[];
  stats: {
    totalLeads: number;
    convertedToUsers: number;
    conversionRate: number;
    sourceBreakdown: Record<string, number>;
  };
  filters: {
    sources: string[];
    statuses: string[];
    priorities: string[];
  };
}

export default function AdminProspectsPage() {
  const { t, i18n } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  
  const [newProspectData, setNewProspectData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    interestedLanguage: 'english',
    level: '',
    notes: '',
    priority: 'normal',
    source: 'manual',
    status: 'new',
    budget: '',
    preferredFormat: ''
  });

  // Use ProspectLifecycle unified view
  const { data: prospectData, isLoading } = useQuery<UnifiedViewResponse>({
    queryKey: ['/api/prospect-lifecycle/unified-view'],
  });
  
  const prospects = prospectData?.prospects || [];

  // Create prospect mutation using ProspectLifecycle
  const createProspectMutation = useMutation({
    mutationFn: async (prospectData: any) => {
      return apiRequest("/api/prospect-lifecycle/get-or-create", {
        method: "POST",
        body: prospectData,
      });
    },
    onSuccess: () => {
      toast({
        title: t('callcenter:prospects.addedSuccess'),
        description: t('callcenter:prospects.addedDescription'),
      });
      setIsAddDialogOpen(false);
      setNewProspectData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        interestedLanguage: 'english',
        level: '',
        notes: '',
        priority: 'normal',
        source: 'manual',
        status: 'new',
        budget: '',
        preferredFormat: ''
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prospect-lifecycle/unified-view"] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: t('callcenter:prospects.addedError'),
        variant: "destructive",
      });
    },
  });
  
  // Filter prospects based on search and selections
  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = searchQuery === '' || 
      `${prospect.firstName} ${prospect.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prospect.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prospect.phoneNumber?.includes(searchQuery);
      
    const matchesSource = selectedSource === 'all' || prospect.source === selectedSource;
    const matchesStatus = selectedStatus === 'all' || prospect.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || prospect.priority === selectedPriority;
    
    return matchesSearch && matchesSource && matchesStatus && matchesPriority;
  });
  
  // Compute stats from prospects data
  const stats = {
    totalLeads: prospects.filter(p => !p.userId).length,
    convertedToUsers: prospects.filter(p => p.userId).length,
    conversionRate: prospects.length > 0 
      ? (prospects.filter(p => p.userId).length / prospects.length) * 100 
      : 0,
    pendingFollowUp: prospects.filter(p => p.status === 'contacted' || p.status === 'qualified').length
  };
  
  // Get unique values for filters
  const uniqueSources = [...new Set(prospects.map(p => p.source).filter(Boolean))];
  const uniqueStatuses = [...new Set(prospects.map(p => p.status).filter(Boolean))];
  const uniquePriorities = [...new Set(prospects.map(p => p.priority).filter(Boolean))];
  
  // Helper functions for badges
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'hot': return 'destructive';
      case 'warm': return 'outline'; // Changed from 'warning' to 'outline'
      case 'cold': return 'secondary';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'secondary';
      case 'qualified': return 'outline';
      case 'negotiating': return 'default';
      case 'lost': return 'destructive';
      case 'converted': return 'secondary'; // Changed from 'success' to 'secondary'
      default: return 'default';
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: t('callcenter:prospects.name'),
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('callcenter:prospects.status'),
      cell: ({ row }: any) => {
        const status = row.original.status;
        const colors: any = {
          active: 'success',
          inactive: 'secondary',
          pending: 'warning',
        };
        return <Badge variant={colors[status] || 'default'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'type',
      header: t('callcenter:prospects.type'),
    },
    {
      accessorKey: 'level',
      header: t('callcenter:prospects.level'),
    },
    {
      accessorKey: 'interest',
      header: t('callcenter:prospects.interest'),
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            {t('callcenter:prospects.view')}
          </Button>
          <Button size="sm" variant="outline">
            {t('callcenter:prospects.contact')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('callcenter:prospects.title')}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('callcenter:prospects.addProspect')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:prospects.totalProspects')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:prospects.allStatuses')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:prospects.activeProspects')}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.convertedToUsers}</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:prospects.convertedToStudents')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:prospects.pendingFollowUp')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFollowUp}</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:prospects.requiresAction')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:prospects.conversionRate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:prospects.overall')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('callcenter:prospects.prospectsList')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('callcenter:prospects.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('callcenter:prospects.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-prospect-search"
              />
            </div>
            
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[180px]" data-testid="select-source-filter">
                <SelectValue placeholder={t('callcenter:prospects.source')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('callcenter:prospects.allSources')}</SelectItem>
                {uniqueSources.map(source => (
                  <SelectItem key={source} value={source}>
                    {t(`callcenter:sources.${source}`, source)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder={t('callcenter:prospects.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('callcenter:prospects.allStatuses')}</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {t(`callcenter:statuses.${status}`, status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[180px]" data-testid="select-priority-filter">
                <SelectValue placeholder={t('callcenter:prospects.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('callcenter:prospects.allPriorities')}</SelectItem>
                {uniquePriorities.map(priority => (
                  <SelectItem key={priority} value={priority}>
                    {t(`callcenter:priorities.${priority}`, priority)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setSelectedSource('all');
              setSelectedStatus('all');
              setSelectedPriority('all');
            }} data-testid="button-clear-filters">
              <Filter className="h-4 w-4 mr-2" />
              {t('callcenter:prospects.clear')}
            </Button>
          </div>
          {isLoading ? (
            <div className="text-center py-8">{t('common:loading')}</div>
          ) : filteredProspects.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('callcenter:prospects.name')}</TableHead>
                  <TableHead>{t('callcenter:prospects.contact')}</TableHead>
                  <TableHead>{t('callcenter:prospects.source')}</TableHead>
                  <TableHead>{t('callcenter:prospects.status')}</TableHead>
                  <TableHead>{t('callcenter:prospects.priority')}</TableHead>
                  <TableHead>{t('callcenter:prospects.language')}</TableHead>
                  <TableHead>{t('callcenter:prospects.interest')}</TableHead>
                  <TableHead>{t('callcenter:prospects.budget')}</TableHead>
                  <TableHead>{t('callcenter:prospects.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.map((prospect) => (
                  <TableRow key={`${prospect.leadId || 'lead'}-${prospect.userId || 'user'}-${prospect.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {prospect.userId && (
                          <UserCheck className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          {`${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || 'N/A'}
                          {prospect.userId && (
                            <div className="text-xs text-muted-foreground">
                              {t('callcenter:prospects.studentId')}: {prospect.userId}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {prospect.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {prospect.email}
                          </div>
                        )}
                        {prospect.phoneNumber && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {prospect.phoneNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {prospect.source || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(prospect.status)}>
                        {prospect.status || 'New'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(prospect.priority)}>
                        {prospect.priority || 'Normal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {prospect.interestedLanguage && (
                          <div>{prospect.interestedLanguage}</div>
                        )}
                        {prospect.level && (
                          <div className="text-muted-foreground">{prospect.level}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {prospect.preferredFormat || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {prospect.budget || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            toast({
                              title: t('callcenter:prospects.prospectDetails'),
                              description: `${prospect.firstName} ${prospect.lastName}`,
                            });
                          }}
                          data-testid={`button-view-prospect-${prospect.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!prospect.userId && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              toast({
                                title: t('callcenter:prospects.convertToStudent'),
                                description: t('callcenter:prospects.conversionStarted'),
                              });
                            }}
                            data-testid={`button-convert-prospect-${prospect.id}`}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('callcenter:prospects.noProspects')}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('callcenter:prospects.addNewProspect')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('callcenter:prospects.lastName')}</Label>
                <Input 
                  value={newProspectData.lastName}
                  onChange={(e) => setNewProspectData({...newProspectData, lastName: e.target.value})}
                  placeholder={t('callcenter:prospects.enterLastName')} 
                />
              </div>
              <div>
                <Label>{t('callcenter:prospects.firstName')}</Label>
                <Input 
                  value={newProspectData.firstName}
                  onChange={(e) => setNewProspectData({...newProspectData, firstName: e.target.value})}
                  placeholder={t('callcenter:prospects.enterFirstName')} 
                />
              </div>
            </div>
            
            <div>
              <Label>{t('callcenter:prospects.phone')}</Label>
              <Input 
                value={newProspectData.phoneNumber}
                onChange={(e) => setNewProspectData({...newProspectData, phoneNumber: e.target.value})}
                placeholder={t('callcenter:prospects.enterPhoneNumber')} 
              />
            </div>
            
            <div>
              <Label>{t('callcenter:prospects.email')}</Label>
              <Input 
                type="email" 
                value={newProspectData.email}
                onChange={(e) => setNewProspectData({...newProspectData, email: e.target.value})}
                placeholder={t('callcenter:prospects.enterEmailAddress')} 
              />
            </div>
            
            <div>
              <Label>{t('callcenter:prospects.interestedLanguage')}</Label>
              <Select value={newProspectData.interestedLanguage} onValueChange={(value) => setNewProspectData({...newProspectData, interestedLanguage: value})}>
                <SelectTrigger>
                  <SelectValue placeholder={t('callcenter:prospects.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">{t('common:languages.english')}</SelectItem>
                  <SelectItem value="spanish">{t('common:languages.spanish')}</SelectItem>
                  <SelectItem value="french">{t('common:languages.french')}</SelectItem>
                  <SelectItem value="german">{t('common:languages.german')}</SelectItem>
                  <SelectItem value="italian">{t('common:languages.italian')}</SelectItem>
                  <SelectItem value="chinese">{t('common:languages.chinese')}</SelectItem>
                  <SelectItem value="arabic">{t('common:languages.arabic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('callcenter:prospects.budgetRange')}</Label>
                <Input 
                  value={newProspectData.budget}
                  onChange={(e) => setNewProspectData({...newProspectData, budget: e.target.value})}
                  placeholder={t('callcenter:prospects.eg23MillionIRR')} 
                />
              </div>
              <div>
                <Label>{t('callcenter:prospects.currentLevel')}</Label>
                <Select value={newProspectData.level} onValueChange={(value) => setNewProspectData({...newProspectData, level: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('callcenter:prospects.selectLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t('callcenter:prospects.beginner')}</SelectItem>
                    <SelectItem value="intermediate">{t('callcenter:prospects.intermediate')}</SelectItem>
                    <SelectItem value="advanced">{t('callcenter:prospects.advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>{t('callcenter:prospects.notes')}</Label>
              <Textarea 
                value={newProspectData.notes}
                onChange={(e) => setNewProspectData({...newProspectData, notes: e.target.value})}
                placeholder={t('callcenter:prospects.whatSpecificCourses')} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button 
              onClick={() => createProspectMutation.mutate(newProspectData)}
              disabled={createProspectMutation.isPending}
            >
              {createProspectMutation.isPending ? t('common:creating') : t('callcenter:prospects.addProspect')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}