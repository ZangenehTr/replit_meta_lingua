import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Paperclip, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TicketMessage {
  id: number;
  ticketId: number;
  message: string;
  senderType: "student" | "staff";
  senderName: string;
  sentAt: string;
}

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  category: string;
  studentId: number;
  studentName: string;
  createdAt: string;
  messages: TicketMessage[];
}

interface Props {
  tickets: SupportTicket[];
  isLoading: boolean;
  selectedTicket: SupportTicket | null;
  onSelectTicket: (ticket: SupportTicket) => void;
  ticketReply: string;
  onReplyChange: (value: string) => void;
  onSendReply: () => void;
  isSending: boolean;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent": return "bg-red-100 text-red-800 border-red-200";
    case "high": return "bg-orange-100 text-orange-800 border-orange-200";
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low": return "bg-green-100 text-green-800 border-green-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "open": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
    case "resolved": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "closed": return <XCircle className="h-4 w-4 text-gray-500" />;
    default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
};

export function TicketsTab({ tickets, isLoading, selectedTicket, onSelectTicket, ticketReply, onReplyChange, onSendReply, isSending }: Props) {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search tickets..." className="ps-10" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin:communications.allTickets")}</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin:communications.supportTickets")}</CardTitle>
            <CardDescription>{t("admin:communications.manageStudentRequests")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">{t("admin:communications.loadingTickets")}</div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">{t("admin:communications.noTickets")}</div>
                ) : tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedTicket?.id === ticket.id ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200" : ""}`}
                    onClick={() => onSelectTicket(ticket)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <h4 className="font-medium">{ticket.title}</h4>
                      </div>
                      <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ticket.description.substring(0, 80)}...</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>by {ticket.studentName}</span>
                      <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "Unknown"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin:communications.ticketDetails")}</CardTitle>
            <CardDescription>{selectedTicket ? `#${selectedTicket.id}` : t("admin:communications.selectTicket")}</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTicket ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTicket.status)}
                    <span className="font-medium">{selectedTicket.status.replace("_", " ")}</span>
                  </div>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority} priority</Badge>
                </div>
                <div>
                  <h3 className="font-medium mb-2">{selectedTicket.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTicket.description}</p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">{t("admin:communications.messages")}</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {selectedTicket.messages.map((message) => (
                        <div key={message.id} className={`p-3 rounded-lg ${message.senderType === "staff" ? "bg-blue-50 dark:bg-blue-900/20 ms-4" : "bg-gray-50 dark:bg-gray-800 me-4"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{message.senderName}</span>
                            <span className="text-xs text-gray-500">{message.sentAt ? new Date(message.sentAt).toLocaleString() : "Just now"}</span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="border-t pt-4">
                  <Textarea placeholder={t("admin:communications.typeMessage")} className="mb-2" value={ticketReply} onChange={(e) => onReplyChange(e.target.value)} />
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto h-10">
                      <Paperclip className="h-4 w-4 me-2" />{t("admin:communications.attachFile")}
                    </Button>
                    <Button size="sm" className="w-full sm:w-auto h-10" onClick={onSendReply} disabled={!ticketReply.trim() || isSending}>
                      <Send className="h-4 w-4 me-2" />
                      {isSending ? t("admin:communications.sending") : t("admin:communications.sendReply")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">{t("admin:communications.selectTicketToRespond")}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
