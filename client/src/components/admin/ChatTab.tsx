import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Send, Search, Plus, ArrowLeft, Users, Bell } from "lucide-react";

interface ChatConversation {
  id: number;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  type: "direct" | "group";
  title?: string;
  isOnline?: boolean;
}

interface ChatMessage {
  id: number;
  conversationId: number;
  message: string;
  senderName: string;
  senderId: number;
  sentAt: string;
  isOwnMessage?: boolean;
}

export interface SearchedUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}

interface Props {
  conversations: ChatConversation[];
  conversationsLoading: boolean;
  messages: ChatMessage[];
  messagesLoading: boolean;
  selectedConversation: ChatConversation | null;
  onSelectConversation: (c: ChatConversation | null) => void;
  chatInput: string;
  onChatInputChange: (v: string) => void;
  sendNotification: boolean;
  onSendNotificationChange: (v: boolean) => void;
  customNotificationText: string;
  onCustomNotificationTextChange: (v: string) => void;
  userSearchQuery: string;
  onUserSearchQueryChange: (v: string) => void;
  searchedUsers: SearchedUser[];
  onCreateConversation: (userId: number) => void;
  onSendMessage: () => void;
  isSending: boolean;
  currentUserId?: number;
}

function ConversationsList({ conversations, conversationsLoading, selectedConversation, onSelectConversation, userSearchQuery, onUserSearchQueryChange, searchedUsers, onCreateConversation }: Pick<Props, "conversations" | "conversationsLoading" | "selectedConversation" | "onSelectConversation" | "userSearchQuery" | "onUserSearchQueryChange" | "searchedUsers" | "onCreateConversation">) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Conversations</CardTitle>
        <CardDescription>Staff internal messaging</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search users by name or role..." className="ps-10" value={userSearchQuery} onChange={(e) => onUserSearchQueryChange(e.target.value)} />
          </div>
          {userSearchQuery && <div className="text-xs text-gray-500">Search across all roles</div>}
        </div>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pe-4">
            {userSearchQuery && searchedUsers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Search Results</p>
                {searchedUsers.map((u: SearchedUser) => (
                  <div key={u.id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border border-gray-200 mb-2" onClick={() => onCreateConversation(u.id)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{u.firstName?.[0] || u.email?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.role} • {u.email}</p>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {conversationsLoading ? (
              <div className="text-center py-8">Loading conversations...</div>
            ) : conversations.length === 0 && !userSearchQuery ? (
              <div className="text-center py-8 text-gray-500">No conversations yet.</div>
            ) : conversations.map((conversation) => (
              <div key={conversation.id} className={`p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${selectedConversation?.id === conversation.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`} onClick={() => onSelectConversation(conversation)}>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {conversation.type === "group" ? <Users className="h-5 w-5" /> : conversation.participants[0]?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.isOnline && <div className="absolute bottom-0 end-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-medium truncate">{conversation.title || conversation.participants.join(", ")}</p>
                      {conversation.unreadCount > 0 && <Badge variant="destructive" className="text-xs px-1 py-0">{conversation.unreadCount}</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                    <p className="text-xs text-gray-400">{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "No messages"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ChatPanel({ selectedConversation, messages, messagesLoading, chatInput, onChatInputChange, sendNotification, onSendNotificationChange, customNotificationText, onCustomNotificationTextChange, onSendMessage, isSending, currentUserId, onBack }: Omit<Props, "conversations" | "conversationsLoading" | "userSearchQuery" | "onUserSearchQueryChange" | "searchedUsers" | "onCreateConversation" | "onSelectConversation"> & { onBack?: () => void }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex flex-row items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        )}
        <div>
          <CardTitle className="text-base">{selectedConversation?.title || selectedConversation?.participants?.join(", ") || "Select a conversation"}</CardTitle>
          <CardDescription>{selectedConversation ? "Live chat" : "No conversation selected"}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {!selectedConversation ? (
              <div className="text-center py-12 text-gray-500">Select a conversation to start chatting</div>
            ) : messagesLoading ? (
              <div className="text-center py-8">Loading messages...</div>
            ) : !messages || messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No messages yet. Start the conversation!</div>
            ) : messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${isOwn ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                    {!isOwn && <p className="text-xs font-medium mb-1">{message.senderName}</p>}
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>{new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="border-t p-4 space-y-3">
          <div className="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" />
                <Label className="text-sm font-semibold text-blue-900">Send Notification</Label>
              </div>
              <Checkbox checked={sendNotification} onCheckedChange={(checked) => onSendNotificationChange(!!checked)} className="data-[state=checked]:bg-blue-500 border-blue-400" />
            </div>
            {sendNotification && (
              <Input placeholder="Notification text..." value={customNotificationText} onChange={(e) => onCustomNotificationTextChange(e.target.value)} className="bg-white text-sm" />
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyPress={(e) => { if (e.key === "Enter" && !e.shiftKey && chatInput.trim() && selectedConversation) onSendMessage(); }}
              className="flex-1"
              disabled={!selectedConversation}
            />
            <Button onClick={onSendMessage} disabled={!chatInput.trim() || !selectedConversation || isSending}>
              {isSending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChatTab(props: Props) {
  return (
    <>
      {/* Mobile: stack vertically */}
      <div className="flex flex-col gap-4 lg:hidden">
        {!props.selectedConversation ? (
          <ConversationsList {...props} />
        ) : (
          <Card className="fixed inset-0 z-50 bg-white dark:bg-gray-900 m-0 rounded-none flex flex-col">
            <ChatPanel {...props} onBack={() => props.onSelectConversation(null)} />
          </Card>
        )}
      </div>

      {/* Desktop: resizable panels */}
      <div className="hidden lg:block h-[600px]">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel defaultSize={35} minSize={25} maxSize={50}>
            <ConversationsList {...props} />
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
          <Panel defaultSize={65} minSize={50}>
            <ChatPanel {...props} />
          </Panel>
        </PanelGroup>
      </div>
    </>
  );
}
