import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { UserPlus, Phone, Mail, Target } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function AdminLeadsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [showNewLeadForm, setShowNewLeadForm] = React.useState(false);
  const [newLeadData, setNewLeadData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    source: '',
    status: 'new',
    priority: 'medium',
    interestedLanguage: '',
    interestedLevel: '',
    preferredFormat: '',
    budget: '',
    notes: ''
  });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['/api/leads'],
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      return apiRequest("/api/leads", {
        method: "POST",
        body: JSON.stringify(leadData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setShowNewLeadForm(false);
      setNewLeadData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        source: '',
        status: 'new',
        priority: 'medium',
        interestedLanguage: '',
        interestedLevel: '',
        preferredFormat: '',
        budget: '',
        notes: ''
      });
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    }
  });

  // Handle create lead
  const handleCreateLead = () => {
    if (!newLeadData.firstName || !newLeadData.lastName || !newLeadData.phoneNumber) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in first name, last name, and phone number.",
        variant: "destructive",
      });
      return;
    }

    createLeadMutation.mutate(newLeadData);
  };

  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch = searchTerm === '' || 
      lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      accessorKey: 'name',
      header: t('admin:leads.name'),
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.firstName} {row.original.lastName}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'phoneNumber',
      header: t('admin:leads.phone'),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {row.original.phoneNumber}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('admin:leads.status'),
      cell: ({ row }: any) => {
        const status = row.original.status;
        const colors: any = {
          new: 'default',
          contacted: 'secondary',
          qualified: 'success',
          converted: 'success',
          lost: 'destructive',
        };
        return <Badge variant={colors[status] || 'default'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'source',
      header: t('admin:leads.source'),
    },
    {
      accessorKey: 'interestedLanguage',
      header: t('admin:leads.interestedLanguage'),
    },
    {
      accessorKey: 'priority',
      header: t('admin:leads.priority'),
      cell: ({ row }: any) => {
        const priority = row.original.priority;
        const colors: any = {
          high: 'destructive',
          medium: 'secondary',
          low: 'default',
        };
        return <Badge variant={colors[priority] || 'default'}>{priority}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('admin:leads.title')}</h1>
        <Dialog open={showNewLeadForm} onOpenChange={setShowNewLeadForm}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              {t('admin:leads.addLead')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('admin:leads.createLead')}</DialogTitle>
              <DialogDescription>
                {t('admin:leads.createLeadDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t('admin:leads.firstName')} *</Label>
                <Input
                  id="firstName"
                  value={newLeadData.firstName}
                  onChange={(e) => setNewLeadData({...newLeadData, firstName: e.target.value})}
                  placeholder={t('admin:leads.firstNamePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t('admin:leads.lastName')} *</Label>
                <Input
                  id="lastName"
                  value={newLeadData.lastName}
                  onChange={(e) => setNewLeadData({...newLeadData, lastName: e.target.value})}
                  placeholder={t('admin:leads.lastNamePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">{t('admin:leads.phoneNumber')} *</Label>
                <Input
                  id="phoneNumber"
                  value={newLeadData.phoneNumber}
                  onChange={(e) => setNewLeadData({...newLeadData, phoneNumber: e.target.value})}
                  placeholder={t('admin:leads.phoneNumberPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="email">{t('admin:leads.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLeadData.email}
                  onChange={(e) => setNewLeadData({...newLeadData, email: e.target.value})}
                  placeholder={t('admin:leads.emailPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="source">{t('admin:leads.source')}</Label>
                <Select value={newLeadData.source} onValueChange={(value) => setNewLeadData({...newLeadData, source: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin:leads.selectSource')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">{t('admin:leads.sourceWebsite')}</SelectItem>
                    <SelectItem value="social_media">{t('admin:leads.sourceSocialMedia')}</SelectItem>
                    <SelectItem value="referral">{t('admin:leads.sourceReferral')}</SelectItem>
                    <SelectItem value="advertisement">{t('admin:leads.sourceAdvertisement')}</SelectItem>
                    <SelectItem value="walk_in">{t('admin:leads.sourceWalkIn')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">{t('admin:leads.priority')}</Label>
                <Select value={newLeadData.priority} onValueChange={(value) => setNewLeadData({...newLeadData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin:leads.selectPriority')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('admin:leads.priorityLow')}</SelectItem>
                    <SelectItem value="medium">{t('admin:leads.priorityMedium')}</SelectItem>
                    <SelectItem value="high">{t('admin:leads.priorityHigh')}</SelectItem>
                    <SelectItem value="urgent">{t('admin:leads.priorityUrgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interestedLanguage">{t('admin:leads.interestedLanguage')}</Label>
                <Select value={newLeadData.interestedLanguage} onValueChange={(value) => setNewLeadData({...newLeadData, interestedLanguage: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin:leads.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="persian">{t('admin:leads.languagePersian')}</SelectItem>
                    <SelectItem value="english">{t('admin:leads.languageEnglish')}</SelectItem>
                    <SelectItem value="arabic">{t('admin:leads.languageArabic')}</SelectItem>
                    <SelectItem value="french">{t('admin:leads.languageFrench')}</SelectItem>
                    <SelectItem value="german">{t('admin:leads.languageGerman')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="preferredFormat">{t('admin:leads.preferredFormat')}</Label>
                <Select value={newLeadData.preferredFormat} onValueChange={(value) => setNewLeadData({...newLeadData, preferredFormat: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin:leads.selectFormat')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">{t('admin:leads.formatGroup')}</SelectItem>
                    <SelectItem value="individual">{t('admin:leads.formatIndividual')}</SelectItem>
                    <SelectItem value="online">{t('admin:leads.formatOnline')}</SelectItem>
                    <SelectItem value="in_person">{t('admin:leads.formatInPerson')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget">{t('admin:leads.budget')}</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newLeadData.budget}
                  onChange={(e) => setNewLeadData({...newLeadData, budget: e.target.value})}
                  placeholder={t('admin:leads.budgetPlaceholder')}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">{t('admin:leads.notes')}</Label>
                <Textarea
                  id="notes"
                  value={newLeadData.notes}
                  onChange={(e) => setNewLeadData({...newLeadData, notes: e.target.value})}
                  placeholder={t('admin:leads.notesPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewLeadForm(false)}>
                {t('common:cancel')}
              </Button>
              <Button 
                onClick={handleCreateLead}
                disabled={createLeadMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createLeadMutation.isPending ? t('admin:leads.creating') : t('admin:leads.createLead')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:leads.totalLeads')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:leads.newLeads')}
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l: any) => l.status === 'new').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:leads.qualified')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l: any) => l.status === 'qualified').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:leads.converted')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l: any) => l.status === 'converted').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('admin:leads.leadsList')}</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder={t('admin:leads.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('admin:leads.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin:leads.allStatuses')}</SelectItem>
                  <SelectItem value="new">{t('admin:leads.new')}</SelectItem>
                  <SelectItem value="contacted">{t('admin:leads.contacted')}</SelectItem>
                  <SelectItem value="qualified">{t('admin:leads.qualified')}</SelectItem>
                  <SelectItem value="converted">{t('admin:leads.converted')}</SelectItem>
                  <SelectItem value="lost">{t('admin:leads.lost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common:loading')}</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin:leads.name')}</TableHead>
                  <TableHead>{t('admin:leads.phone')}</TableHead>
                  <TableHead>{t('admin:leads.status')}</TableHead>
                  <TableHead>{t('admin:leads.source')}</TableHead>
                  <TableHead>{t('admin:leads.interestedLanguage')}</TableHead>
                  <TableHead>{t('admin:leads.priority')}</TableHead>
                  <TableHead>{t('admin:leads.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead: any) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {lead.phoneNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        lead.status === 'new' ? 'default' :
                        lead.status === 'contacted' ? 'secondary' :
                        lead.status === 'qualified' || lead.status === 'converted' ? 'default' :
                        lead.status === 'lost' ? 'destructive' : 'default'
                      }>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.source}</TableCell>
                    <TableCell>{lead.interestedLanguage}</TableCell>
                    <TableCell>
                      <Badge variant={
                        lead.priority === 'high' ? 'destructive' :
                        lead.priority === 'medium' ? 'secondary' : 'default'
                      }>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2">
                        <Button size="sm" variant="outline" className="p-1 sm:p-2">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="p-1 sm:p-2">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}