import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Calendar, 
  Clock, 
  Filter, 
  Search, 
  UserPlus,
  MessageCircle,
  GraduationCap,
  BookOpen,
  Globe,
  Target,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'wouter';

interface PeerSocializerGroup {
  id: number;
  groupName: string;
  language: string;
  proficiencyLevel: string;
  topic: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  genderMixPreference: string;
  curriculumLevel?: string;
}

interface MyGroup extends PeerSocializerGroup {
  participantStatus: string;
  joinedAt: string;
  participationRating?: number;
}

interface FilterState {
  language: string;
  proficiencyLevel: string;
  curriculumLevel: string;
  genderPreference: string;
  search: string;
}

export default function StudentPeerSocializer() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-groups' | 'create'>('browse');
  const [filters, setFilters] = useState<FilterState>({
    language: 'all',
    proficiencyLevel: 'all',
    curriculumLevel: 'all',
    genderPreference: 'mixed',
    search: ''
  });

  // Fetch available groups
  const { data: availableGroups, isLoading: loadingGroups } = useQuery<PeerSocializerGroup[]>({
    queryKey: ['/api/student/peer-socializer/groups', filters],
    queryFn: async () => {
      const response = await apiRequest('/api/student/peer-socializer/groups');
      return response || [];
    }
  });

  // Fetch user's groups
  const { data: myGroups } = useQuery<MyGroup[]>({
    queryKey: ['/api/student/peer-socializer/my-groups'],
    queryFn: async () => {
      const response = await apiRequest('/api/student/peer-socializer/my-groups');
      return response || [];
    }
  });

  // Join group mutation
  const joinGroup = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest(`/api/student/peer-socializer/join/${groupId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data, groupId) => {
      toast({
        title: t('student:peerSocializer.joinSuccess'),
        description: t('student:peerSocializer.joinSuccessDesc')
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/peer-socializer/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/peer-socializer/my-groups'] });
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:peerSocializer.joinError'),
        variant: 'destructive'
      });
    }
  });

  // Create match request mutation
  const createMatchRequest = useMutation({
    mutationFn: async (preferences: {
      language: string;
      proficiencyLevel: string;
      curriculumLevel?: string;
      interests: string[];
      preferredGender: string;
    }) => {
      return apiRequest('/api/student/peer-socializer/match-request', {
        method: 'POST',
        body: JSON.stringify(preferences)
      });
    },
    onSuccess: () => {
      toast({
        title: t('student:peerSocializer.matchRequestCreated'),
        description: t('student:peerSocializer.matchRequestCreatedDesc')
      });
      setActiveTab('my-groups');
      queryClient.invalidateQueries({ queryKey: ['/api/student/peer-socializer/my-groups'] });
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:peerSocializer.matchRequestError'),
        variant: 'destructive'
      });
    }
  });

  // Filter groups based on current filters
  const filteredGroups = availableGroups?.filter(group => {
    if (filters.language !== 'all' && group.language !== filters.language) return false;
    if (filters.proficiencyLevel !== 'all' && group.proficiencyLevel !== filters.proficiencyLevel) return false;
    if (filters.curriculumLevel !== 'all' && group.curriculumLevel !== filters.curriculumLevel) return false;
    if (filters.search && !group.groupName.toLowerCase().includes(filters.search.toLowerCase()) 
        && !group.topic.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }) || [];

  const languages = [
    { value: 'all', label: t('common:all') },
    { value: 'English', label: 'English' },
    { value: 'Persian', label: 'فارسی' },
    { value: 'Arabic', label: 'العربية' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Français' }
  ];

  const proficiencyLevels = [
    { value: 'all', label: t('common:all') },
    { value: 'A1', label: 'A1 - Beginner' },
    { value: 'A2', label: 'A2 - Elementary' },
    { value: 'B1', label: 'B1 - Intermediate' },
    { value: 'B2', label: 'B2 - Upper Intermediate' },
    { value: 'C1', label: 'C1 - Advanced' },
    { value: 'C2', label: 'C2 - Proficient' }
  ];

  const curriculumLevels = [
    { value: 'all', label: t('common:all') },
    { value: 'Beginner English', label: 'Beginner English' },
    { value: 'Business English A2', label: 'Business English A2' },
    { value: 'IELTS Speaking B2', label: 'IELTS Speaking B2' },
    { value: 'Academic English', label: 'Academic English' },
    { value: 'Conversation Practice', label: 'Conversation Practice' }
  ];

  const formatScheduledTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    return date.toLocaleString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('common:back')}
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {t('student:peerSocializer.title')}
                </h1>
                <p className="text-sm text-gray-500">
                  {t('student:peerSocializer.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-8 border-b border-gray-200 mb-8">
          <button
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'browse'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('browse')}
            data-testid="tab-browse-groups"
          >
            <Search className="h-4 w-4 inline mr-2" />
            {t('student:peerSocializer.browseGroups')}
          </button>
          <button
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-groups'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('my-groups')}
            data-testid="tab-my-groups"
          >
            <Users className="h-4 w-4 inline mr-2" />
            {t('student:peerSocializer.myGroups')}
          </button>
          <button
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('create')}
            data-testid="tab-create-request"
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            {t('student:peerSocializer.findPartners')}
          </button>
        </div>

        {/* Browse Groups Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Filter className="h-5 w-5 mr-2" />
                  {t('student:peerSocializer.filters')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('student:peerSocializer.language')}
                    </label>
                    <Select
                      value={filters.language}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger data-testid="filter-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('student:peerSocializer.proficiencyLevel')}
                    </label>
                    <Select
                      value={filters.proficiencyLevel}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, proficiencyLevel: value }))}
                    >
                      <SelectTrigger data-testid="filter-proficiency-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {proficiencyLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('student:peerSocializer.curriculumLevel')}
                    </label>
                    <Select
                      value={filters.curriculumLevel}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, curriculumLevel: value }))}
                    >
                      <SelectTrigger data-testid="filter-curriculum-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {curriculumLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('student:peerSocializer.search')}
                    </label>
                    <Input
                      placeholder={t('student:peerSocializer.searchPlaceholder')}
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full"
                      data-testid="search-groups"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Groups */}
            <div className="space-y-4">
              {loadingGroups ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">{t('common:loading')}</p>
                </div>
              ) : filteredGroups.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('student:peerSocializer.noGroupsFound')}</p>
                  </CardContent>
                </Card>
              ) : (
                filteredGroups.map(group => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{group.groupName}</h3>
                            <Badge className={getStatusBadgeColor(group.status)}>
                              {group.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{group.topic}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-1" />
                              {group.language}
                            </div>
                            <div className="flex items-center">
                              <GraduationCap className="h-4 w-4 mr-1" />
                              {group.proficiencyLevel}
                            </div>
                            {group.curriculumLevel && (
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                {group.curriculumLevel}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {group.currentParticipants}/{group.maxParticipants}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {group.durationMinutes} min
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatScheduledTime(group.scheduledAt)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button 
                            onClick={() => joinGroup.mutate(group.id)}
                            disabled={group.currentParticipants >= group.maxParticipants || joinGroup.isPending}
                            data-testid={`join-group-${group.id}`}
                          >
                            {joinGroup.isPending ? t('common:loading') : t('student:peerSocializer.joinGroup')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* My Groups Tab */}
        {activeTab === 'my-groups' && (
          <div className="space-y-4">
            {!myGroups || myGroups.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t('student:peerSocializer.noMyGroups')}</p>
                </CardContent>
              </Card>
            ) : (
              myGroups.map(group => (
                <Card key={group.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{group.groupName}</h3>
                          <Badge className={getStatusBadgeColor(group.status)}>
                            {group.status}
                          </Badge>
                          <Badge variant="outline">
                            {group.participantStatus}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{group.topic}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-1" />
                            {group.language}
                          </div>
                          <div className="flex items-center">
                            <GraduationCap className="h-4 w-4 mr-1" />
                            {group.proficiencyLevel}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Joined: {new Date(group.joinedAt).toLocaleDateString()}
                          </div>
                          {group.participationRating && (
                            <div className="flex items-center">
                              <Target className="h-4 w-4 mr-1" />
                              Rating: {group.participationRating}/5
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Create Match Request Tab */}
        {activeTab === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('student:peerSocializer.findPartners')}</CardTitle>
              <CardDescription>
                {t('student:peerSocializer.findPartnersDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('student:peerSocializer.language')}
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Persian">فارسی</SelectItem>
                        <SelectItem value="Arabic">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('student:peerSocializer.proficiencyLevel')}
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1 - Beginner</SelectItem>
                        <SelectItem value="A2">A2 - Elementary</SelectItem>
                        <SelectItem value="B1">B1 - Intermediate</SelectItem>
                        <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                        <SelectItem value="C1">C1 - Advanced</SelectItem>
                        <SelectItem value="C2">C2 - Proficient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('student:peerSocializer.curriculumLevel')}
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select curriculum level (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner English">Beginner English</SelectItem>
                      <SelectItem value="Business English A2">Business English A2</SelectItem>
                      <SelectItem value="IELTS Speaking B2">IELTS Speaking B2</SelectItem>
                      <SelectItem value="Academic English">Academic English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  disabled={createMatchRequest.isPending}
                  onClick={() => createMatchRequest.mutate({
                    language: 'English',
                    proficiencyLevel: 'B1',
                    interests: ['conversation', 'grammar'],
                    preferredGender: 'mixed'
                  })}
                  data-testid="create-match-request"
                >
                  {createMatchRequest.isPending ? t('common:loading') : t('student:peerSocializer.createMatchRequest')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}