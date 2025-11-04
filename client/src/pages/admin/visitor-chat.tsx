import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  MessageSquare,
  User,
  Mail,
  Phone,
  Clock,
  Filter,
  Search,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { VisitorChatSession, VisitorChatMessage } from '@shared/schema';
import { format } from 'date-fns';

export default function AdminVisitorChatPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSession, setSelectedSession] = useState<VisitorChatSession | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_contact' | 'no_contact'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all visitor chat sessions
  const { data: sessions = [], isLoading } = useQuery<VisitorChatSession[]>({
    queryKey: ['/api/visitor-chat/sessions/all'],
  });

  // Fetch messages for selected session
  const { data: messages = [] } = useQuery<VisitorChatMessage[]>({
    queryKey: ['/api/visitor-chat/sessions', selectedSession?.sessionId, 'messages'],
    enabled: !!selectedSession,
  });

  // Filter sessions based on search and status
  const filteredSessions = sessions.filter(session => {
    // Filter by status
    if (filterStatus === 'with_contact' && !session.visitorName && !session.visitorEmail && !session.visitorPhone) {
      return false;
    }
    if (filterStatus === 'no_contact' && (session.visitorName || session.visitorEmail || session.visitorPhone)) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = session.visitorName?.toLowerCase().includes(query);
      const emailMatch = session.visitorEmail?.toLowerCase().includes(query);
      const phoneMatch = session.visitorPhone?.toLowerCase().includes(query);
      return nameMatch || emailMatch || phoneMatch;
    }

    return true;
  });

  const getSessionStatus = (session: VisitorChatSession) => {
    const hasContact = !!(session.visitorName || session.visitorEmail || session.visitorPhone);
    return hasContact ? 'with_contact' : 'anonymous';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('visitorChat.title', 'Visitor Chat Management')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('visitorChat.subtitle', 'Manage and respond to visitor inquiries')}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <MessageSquare className="h-5 w-5 mr-2" />
          {filteredSessions.length} {t('visitorChat.sessions', 'Sessions')}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('visitorChat.filters', 'Filters')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('visitorChat.searchLabel', 'Search by name, email, or phone')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-sessions"
                  placeholder={t('visitorChat.searchPlaceholder', 'Search...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>{t('visitorChat.statusFilter', 'Status Filter')}</Label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('visitorChat.filterAll', 'All Sessions')}</SelectItem>
                  <SelectItem value="with_contact">{t('visitorChat.filterWithContact', 'With Contact Info')}</SelectItem>
                  <SelectItem value="no_contact">{t('visitorChat.filterNoContact', 'Anonymous')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('visitorChat.sessionsList', 'Chat Sessions')}</CardTitle>
            <CardDescription>
              {filteredSessions.length} {t('visitorChat.sessionsFound', 'sessions found')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('common.loading', 'Loading...')}
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('visitorChat.noSessions', 'No sessions found')}
                  </div>
                ) : (
                  filteredSessions.map((session) => {
                    const status = getSessionStatus(session);
                    const hasContact = status === 'with_contact';

                    return (
                      <Card
                        key={session.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedSession(session)}
                        data-testid={`card-session-${session.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                {hasContact ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-orange-600" />
                                )}
                                <span className="font-semibold">
                                  {session.visitorName || t('visitorChat.anonymous', 'Anonymous Visitor')}
                                </span>
                              </div>
                              
                              {session.visitorEmail && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {session.visitorEmail}
                                </div>
                              )}
                              
                              {session.visitorPhone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {session.visitorPhone}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(session.createdAt)}
                              </div>
                            </div>
                            
                            <Badge variant={hasContact ? 'default' : 'secondary'}>
                              {hasContact ? t('visitorChat.hasContact', 'Contact') : t('visitorChat.anonymous', 'Anonymous')}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Session Details & Messages */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedSession
                ? t('visitorChat.conversationTitle', 'Conversation')
                : t('visitorChat.selectSession', 'Select a session')}
            </CardTitle>
            {selectedSession && (
              <CardDescription>
                {selectedSession.visitorName || t('visitorChat.anonymous', 'Anonymous Visitor')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!selectedSession ? (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <MessageSquare className="h-12 w-12 mx-auto opacity-50" />
                  <p>{t('visitorChat.selectSessionPrompt', 'Select a chat session to view messages')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Contact Info */}
                {(selectedSession.visitorName || selectedSession.visitorEmail || selectedSession.visitorPhone) && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h3 className="font-semibold text-sm">{t('visitorChat.contactInfo', 'Contact Information')}</h3>
                    {selectedSession.visitorName && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        {selectedSession.visitorName}
                      </div>
                    )}
                    {selectedSession.visitorEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${selectedSession.visitorEmail}`} className="text-primary hover:underline">
                          {selectedSession.visitorEmail}
                        </a>
                      </div>
                    )}
                    {selectedSession.visitorPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${selectedSession.visitorPhone}`} className="text-primary hover:underline">
                          {selectedSession.visitorPhone}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="h-[450px]">
                  <div className="space-y-3 pr-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('visitorChat.noMessages', 'No messages yet')}
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.senderType === 'admin'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderType === 'admin'
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {formatDate(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Note */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm text-blue-900 dark:text-blue-100">
                  {t('visitorChat.responseNote', 'Note: Admin responses to visitor chats will be implemented in a future update. For now, use the contact information to reach out via email or phone.')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
