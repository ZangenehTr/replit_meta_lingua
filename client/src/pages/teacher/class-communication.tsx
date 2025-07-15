import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  Video,
  Users,
  Settings,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Mic
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ClassInfo {
  id: number;
  name: string;
  description: string;
  level: string;
  language: string;
  studentsCount: number;
  students: Student[];
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string;
  email: string;
  level: string;
  isOnline: boolean;
  lastSeen: string;
}

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'system';
  timestamp: string;
  isRead: boolean;
  replyTo?: number;
  attachments?: Attachment[];
}

interface Attachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

export default function ClassCommunication() {
  const { classId } = useParams<{ classId: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { data: classInfo } = useQuery({
    queryKey: ['/api/teacher/class', classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/class/${classId}`);
      if (!response.ok) throw new Error('Failed to fetch class info');
      return response.json();
    }
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/teacher/class', classId, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/class/${classId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; messageType: string; attachments?: any[] }) => {
      const formData = new FormData();
      formData.append('content', messageData.content);
      formData.append('messageType', messageData.messageType);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      return apiRequest(`/api/teacher/class/${classId}/messages`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/class', classId, 'messages'] });
      setMessage('');
      setSelectedFile(null);
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() && !selectedFile) return;

    const messageType = selectedFile ? 'file' : 'text';
    sendMessageMutation.mutate({
      content: message,
      messageType,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Class Header */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {classInfo?.name || t('teacher.classChat')}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {classInfo?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {classInfo?.studentsCount || 0} {t('teacher.students')}
              </Badge>
              <Badge variant="outline">
                {classInfo?.level} {classInfo?.language}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col">
        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages?.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[70%] ${msg.senderId === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.senderAvatar} />
                  <AvatarFallback className="text-xs">
                    {msg.senderName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={`mx-3 ${msg.senderId === user?.id ? 'text-right' : 'text-left'}`}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {msg.senderName} • {getMessageTime(msg.timestamp)}
                  </div>
                  <div
                    className={`inline-block px-3 py-2 rounded-lg ${
                      msg.senderId === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.messageType === 'text' && (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.messageType === 'file' && msg.attachments && (
                      <div className="space-y-2">
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                        {msg.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{attachment.fileName}</span>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={attachment.fileUrl} download>
                                {t('common.download')}
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.messageType === 'image' && msg.attachments && (
                      <div className="space-y-2">
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                        {msg.attachments.map((attachment) => (
                          <img
                            key={attachment.id}
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                            className="max-w-full rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4">
          {selectedFile && (
            <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{selectedFile.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                ×
              </Button>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Textarea
                placeholder={t('teacher.typeMessage')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
                className="min-h-[40px] max-h-[120px] resize-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendMessage}
                disabled={!message.trim() && !selectedFile}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <input
            id="file-input"
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      </Card>
    </div>
  );
}