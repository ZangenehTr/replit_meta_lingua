import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  MessageSquare, User, Phone, Clock, Send, Bot, Headphones, Settings,
  Star, Users, BarChart3, Zap, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminVisitorChatPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = ['fa', 'ar'].includes(language);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('chats');

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ['/api/visitor-chat/admin/sessions'],
    refetchInterval: 5000
  });

  const { data: stats } = useQuery<any>({
    queryKey: ['/api/visitor-chat/admin/stats']
  });

  const { data: settings } = useQuery<any>({
    queryKey: ['/api/visitor-chat/settings']
  });

  const { data: selectedChat } = useQuery<any>({
    queryKey: ['/api/visitor-chat/admin/sessions', selectedSessionId],
    enabled: !!selectedSessionId,
    refetchInterval: 3000
  });

  const updateSettings = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('/api/visitor-chat/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-chat/settings'] });
      toast({ title: t('common:saved', 'Saved'), description: t('admin:chatSettingsUpdated', 'Chat settings updated') });
    }
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!selectedSessionId || !replyMessage.trim()) return;
      const res = await apiRequest(`/api/visitor-chat/sessions/${selectedSessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyMessage,
          senderType: 'admin',
          senderName: 'Support Team'
        })
      });
      return res.json();
    },
    onSuccess: () => {
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-chat/admin/sessions', selectedSessionId] });
    }
  });

  const closeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest(`/api/visitor-chat/admin/sessions/${sessionId}/close`, { method: 'PATCH' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-chat/admin/sessions'] });
      setSelectedSessionId(null);
      toast({ title: t('common:success', 'Success'), description: t('admin:chatClosed', 'Chat closed') });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  const formatTime = (date: string) => {
    try { return format(new Date(date), 'HH:mm'); } catch { return ''; }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('admin:visitorChat', 'Visitor Chat')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin:manageLiveChats', 'Manage live visitor chats and AI settings')}</p>
        </div>
        <div className="flex gap-2">
          {stats && (
            <>
              <Badge variant="outline" className="gap-1"><MessageSquare className="h-3 w-3" /> {stats.activeSessions} {t('common:active', 'Active')}</Badge>
              <Badge variant="outline" className="gap-1"><Star className="h-3 w-3" /> {stats.averageRating}</Badge>
              <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> {stats.identifiedVisitors} {t('admin:identified', 'Identified')}</Badge>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="chats" className="gap-1">
            <MessageSquare className="h-4 w-4" />
            {t('admin:liveChats', 'Live Chats')}
            {sessions.length > 0 && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{sessions.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1">
            <Settings className="h-4 w-4" />
            {t('admin:chatSettings', 'Settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 240px)' }}>
            <Card className="lg:col-span-1 flex flex-col overflow-hidden">
              <CardHeader className="py-3 px-4 shrink-0 border-b">
                <CardTitle className="text-sm">{t('admin:activeSessions', 'Active Sessions')}</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                {sessions.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {t('admin:noActiveSessions', 'No active chat sessions')}
                  </div>
                ) : (
                  <div className="divide-y">
                    {sessions.map((session: any) => (
                      <button
                        key={session.sessionId}
                        onClick={() => setSelectedSessionId(session.sessionId)}
                        className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${selectedSessionId === session.sessionId ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs ${session.matchedUser ? 'bg-blue-500' : 'bg-gray-400'}`}>
                              {session.matchedUser ? <User className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {session.visitorName || session.matchedUser?.firstName || t('admin:anonymous', 'Anonymous')}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {session.visitorPhone || session.visitorEmail || session.sessionId.substring(0, 8)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {session.unreadCount > 0 && (
                              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500">{session.unreadCount}</Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">{formatTime(session.lastMessageAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {session.chatMode === 'ai' ? <Bot className="h-2.5 w-2.5 me-0.5" /> : <Headphones className="h-2.5 w-2.5 me-0.5" />}
                            {session.chatMode}
                          </Badge>
                          {session.matchedUser && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">{t('admin:identified', 'Identified')}</Badge>
                          )}
                          {session.rating && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" /> {session.rating}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>

            <Card className="lg:col-span-2 flex flex-col overflow-hidden">
              {!selectedSessionId || !selectedChat ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t('admin:selectChat', 'Select a chat to view messages')}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-b px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white ${selectedChat.matchedUser ? 'bg-blue-500' : 'bg-gray-400'}`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {selectedChat.session?.visitorName || selectedChat.matchedUser?.firstName || t('admin:anonymous', 'Anonymous')}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {selectedChat.session?.visitorPhone && (
                            <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> {selectedChat.session.visitorPhone}</span>
                          )}
                          {selectedChat.matchedUser && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">{selectedChat.matchedUser.role}</Badge>
                          )}
                          {selectedChat.matchedLead && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">{t('admin:lead', 'Lead')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => closeSession.mutate(selectedSessionId)}
                      className="text-xs"
                    >
                      {t('admin:closeChat', 'Close')}
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 px-4 py-3 bg-gray-50">
                    <div className="space-y-3">
                      {selectedChat.messages?.map((msg: any, index: number) => (
                        <div
                          key={msg.id || index}
                          className={`flex ${msg.senderType === 'visitor' ? 'justify-start' : msg.senderType === 'system' ? 'justify-center' : 'justify-end'}`}
                        >
                          {msg.senderType === 'system' ? (
                            <p className="text-[11px] text-gray-400 bg-gray-100 rounded-full px-3 py-1">{msg.message}</p>
                          ) : (
                            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                              msg.senderType === 'visitor'
                                ? 'bg-white border border-gray-200 text-gray-800'
                                : msg.senderType === 'ai'
                                ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 text-gray-800'
                                : 'bg-blue-600 text-white'
                            }`}>
                              <div className="flex items-center gap-1 mb-0.5">
                                {msg.senderType === 'ai' && <Bot className="h-3 w-3 text-blue-500" />}
                                {msg.senderType === 'admin' && <Headphones className="h-3 w-3 text-white/70" />}
                                <span className={`text-[10px] font-semibold ${msg.senderType === 'admin' ? 'text-white/70' : 'text-blue-500'}`}>
                                  {msg.senderName}
                                </span>
                                <span className={`text-[10px] ${msg.senderType === 'admin' ? 'text-white/50' : 'text-gray-400'}`}>
                                  {formatTime(msg.createdAt)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="border-t px-3 py-2.5 shrink-0">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('admin:typeReply', 'Type your reply...')}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply.mutate(); } }}
                        className="flex-1 h-9 text-sm rounded-full px-4"
                      />
                      <Button
                        onClick={() => sendReply.mutate()}
                        disabled={!replyMessage.trim() || sendReply.isPending}
                        size="icon"
                        className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700"
                        aria-label="ارسال پیام"
                      >
                        <Send className={`h-4 w-4 ${isRTL ? 'scale-x-[-1]' : ''}`} aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  {t('admin:aiChatMode', 'AI Chat Mode')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">{t('admin:chatMode', 'Chat Mode')}</Label>
                  <Select
                    value={settings?.chatMode || 'hybrid'}
                    onValueChange={(val) => updateSettings.mutate({ chatMode: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai">
                        <span className="flex items-center gap-2"><Bot className="h-4 w-4" /> {t('admin:aiOnly', 'AI Only')}</span>
                      </SelectItem>
                      <SelectItem value="human">
                        <span className="flex items-center gap-2"><Headphones className="h-4 w-4" /> {t('admin:humanOnly', 'Human Only')}</span>
                      </SelectItem>
                      <SelectItem value="hybrid">
                        <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> {t('admin:hybrid', 'Hybrid (AI + Human)')}</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {settings?.chatMode === 'ai' && t('admin:aiModeDesc', 'AI handles all conversations automatically')}
                    {settings?.chatMode === 'human' && t('admin:humanModeDesc', 'Only human agents respond to chats')}
                    {settings?.chatMode === 'hybrid' && t('admin:hybridModeDesc', 'AI responds when no human is available')}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">{t('admin:collectContactFirst', 'Collect contact info first')}</Label>
                    <p className="text-xs text-muted-foreground">{t('admin:collectContactDesc', 'Ask for phone/name before chatting')}</p>
                  </div>
                  <Switch
                    checked={settings?.collectContactFirst ?? true}
                    onCheckedChange={(val) => updateSettings.mutate({ collectContactFirst: val })}
                  />
                </div>

                <div>
                  <Label className="text-sm">{t('admin:autoEscalate', 'Auto-escalate after (messages)')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={settings?.autoEscalateAfter || 3}
                    onChange={(e) => updateSettings.mutate({ autoEscalateAfter: parseInt(e.target.value) || 3 })}
                    className="mt-1 w-24"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('admin:autoEscalateDesc', 'Escalate to human after N AI messages')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  {t('admin:businessHours', 'Business Hours')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">{t('admin:startTime', 'Start Time')}</Label>
                    <Input
                      type="time"
                      value={settings?.businessHoursStart || '09:00'}
                      onChange={(e) => updateSettings.mutate({ businessHoursStart: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">{t('admin:endTime', 'End Time')}</Label>
                    <Input
                      type="time"
                      value={settings?.businessHoursEnd || '18:00'}
                      onChange={(e) => updateSettings.mutate({ businessHoursEnd: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">{t('admin:timezone', 'Timezone')}</Label>
                  <Select
                    value={settings?.timezone || 'Asia/Tehran'}
                    onValueChange={(val) => updateSettings.mutate({ timezone: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Tehran">Asia/Tehran (IRST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                      <SelectItem value="Europe/Istanbul">Europe/Istanbul (TRT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">{t('admin:aiPersonality', 'AI Personality')}</Label>
                  <Select
                    value={settings?.aiPersonality || 'professional'}
                    onValueChange={(val) => updateSettings.mutate({ aiPersonality: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">{t('admin:professional', 'Professional')}</SelectItem>
                      <SelectItem value="friendly">{t('admin:friendly', 'Friendly')}</SelectItem>
                      <SelectItem value="casual">{t('admin:casual', 'Casual')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  {t('admin:chatStatistics', 'Chat Statistics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats?.activeSessions || 0}</p>
                    <p className="text-xs text-blue-600/70">{t('admin:activeSessions', 'Active')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-gray-600">{stats?.closedSessions || 0}</p>
                    <p className="text-xs text-gray-500">{t('admin:closedSessions', 'Closed')}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats?.averageRating || '0.0'}</p>
                    <p className="text-xs text-yellow-600/70">{t('admin:avgRating', 'Avg Rating')}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats?.identifiedVisitors || 0}</p>
                    <p className="text-xs text-green-600/70">{t('admin:identifiedVisitors', 'Identified')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
