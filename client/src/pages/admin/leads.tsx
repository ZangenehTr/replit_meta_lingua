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
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>
                Add a new prospect to the system for follow-up and conversion.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newLeadData.firstName}
                  onChange={(e) => setNewLeadData({...newLeadData, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newLeadData.lastName}
                  onChange={(e) => setNewLeadData({...newLeadData, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={newLeadData.phoneNumber}
                  onChange={(e) => setNewLeadData({...newLeadData, phoneNumber: e.target.value})}
                  placeholder="+98 912 345 6789"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLeadData.email}
                  onChange={(e) => setNewLeadData({...newLeadData, email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="source">Lead Source</Label>
                <Select value={newLeadData.source} onValueChange={(value) => setNewLeadData({...newLeadData, source: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newLeadData.priority} onValueChange={(value) => setNewLeadData({...newLeadData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interestedLanguage">Interested Language</Label>
                <Select value={newLeadData.interestedLanguage} onValueChange={(value) => setNewLeadData({...newLeadData, interestedLanguage: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="persian">Persian</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="preferredFormat">Preferred Format</Label>
                <Select value={newLeadData.preferredFormat} onValueChange={(value) => setNewLeadData({...newLeadData, preferredFormat: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in_person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget">Budget (IRR)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newLeadData.budget}
                  onChange={(e) => setNewLeadData({...newLeadData, budget: e.target.value})}
                  placeholder="2000000"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newLeadData.notes}
                  onChange={(e) => setNewLeadData({...newLeadData, notes: e.target.value})}
                  placeholder="Additional notes about the lead..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewLeadForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLead}
                disabled={createLeadMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
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