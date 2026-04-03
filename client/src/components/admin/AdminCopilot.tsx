import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Trash2, Bot, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "tool_result" | "confirmation_required";
  toolName?: string;
  toolResult?: unknown;
  pendingToolCall?: { name: string; params: Record<string, unknown> };
}

function useCopilot() {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const data = await apiRequest<{ messages: {
        id: number;
        conversationId: string;
        role: string;
        content: string;
        requiresConfirmation: boolean;
        confirmed: boolean;
        toolName?: string;
        toolResult?: unknown;
        pendingToolCall?: { name: string; params: Record<string, unknown> };
      }[] }>("/api/admin/copilot/history");
      if (data.messages && data.messages.length > 0) {
        const convId = data.messages[0].conversationId;
        setConversationId(convId);
        setMessages(
          data.messages.map(m => ({
            id: String(m.id),
            role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.content,
            type: (m.requiresConfirmation && !m.confirmed ? "confirmation_required" : "text") as CopilotMessage["type"],
            toolName: m.toolName,
            toolResult: m.toolResult,
            pendingToolCall: m.pendingToolCall,
          }))
        );
      }
    } catch (err) {
      console.error("[AdminCopilot] Failed to load history:", err);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMsg: CopilotMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: message,
      type: "text",
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await apiRequest<{
        conversationId: string;
        response: {
          role: string;
          content: string;
          type?: CopilotMessage["type"];
          toolName?: string;
          toolResult?: unknown;
          pendingToolCall?: { name: string; params: Record<string, unknown> };
        };
      }>("/api/admin/copilot/chat", {
        method: "POST",
        body: { message, conversationId },
      });

      if (data.conversationId) setConversationId(data.conversationId);

      const assistantMsg: CopilotMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.response.content,
        type: data.response.type || "text",
        toolName: data.response.toolName,
        toolResult: data.response.toolResult,
        pendingToolCall: data.response.pendingToolCall,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("[AdminCopilot] Failed to send message:", err);
      const errorMsg: CopilotMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "I encountered an error processing your request. Please try again.",
        type: "text",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const confirmAction = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{
        conversationId: string;
        response: {
          role: string;
          content: string;
          type?: CopilotMessage["type"];
          toolName?: string;
          toolResult?: unknown;
        };
      }>("/api/admin/copilot/chat", {
        method: "POST",
        body: { message: "", conversationId, confirmPending: true },
      });

      if (data.conversationId) setConversationId(data.conversationId);

      setMessages(prev =>
        prev.map(m =>
          m.type === "confirmation_required" ? { ...m, type: "text" } : m
        )
      );

      const resultMsg: CopilotMessage = {
        id: `result_${Date.now()}`,
        role: "assistant",
        content: data.response.content,
        type: "tool_result",
        toolName: data.response.toolName,
        toolResult: data.response.toolResult,
      };
      setMessages(prev => [...prev, resultMsg]);
    } catch {
      const errorMsg: CopilotMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "Failed to execute the action. Please try again.",
        type: "text",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const cancelAction = useCallback(async () => {
    if (!conversationId) {
      setMessages(prev =>
        prev.map(m =>
          m.type === "confirmation_required"
            ? { ...m, type: "text" as const, content: m.content + "\n\n❌ Action cancelled." }
            : m
        )
      );
      return;
    }
    try {
      await apiRequest("/api/admin/copilot/cancel", {
        method: "POST",
        body: { conversationId },
      });
    } catch {
      // Best-effort — still dismiss on the client side
    }
    setMessages(prev =>
      prev.map(m =>
        m.type === "confirmation_required"
          ? { ...m, type: "text" as const, content: m.content + "\n\n❌ Action cancelled." }
          : m
      )
    );
  }, [conversationId]);

  const clearHistory = useCallback(async () => {
    try {
      await apiRequest("/api/admin/copilot/history", { method: "DELETE" });
      setMessages([]);
      setConversationId(null);
    } catch (err) {
      console.error("[AdminCopilot] Failed to clear history:", err);
    }
  }, []);

  return { messages, conversationId, isLoading, loadHistory, sendMessage, confirmAction, cancelAction, clearHistory };
}

function MessageBubble({
  message,
  onConfirm,
  onCancel,
  isLoading,
}: {
  message: CopilotMessage;
  onConfirm?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}) {
  const isUser = message.role === "user";
  const isConfirmation = message.type === "confirmation_required";
  const isToolResult = message.type === "tool_result";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1 mr-2">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? "order-first" : ""}`}>
        {isConfirmation ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
              Confirmation Required
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3 whitespace-pre-wrap">
              {message.content}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <CheckCircle className="w-3 h-3 mr-1" />
                )}
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                onClick={onCancel}
                disabled={isLoading}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : isToolResult ? (
          <div className={`rounded-lg p-3 text-sm ${
            message.content.startsWith("✅")
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300"
          }`}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          <div className={`rounded-lg px-3 py-2 text-sm ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          }`}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCopilot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, loadHistory, sendMessage, confirmAction, cancelAction, clearHistory } = useCopilot();

  const isAdmin = user?.role === "Admin" || user?.role === "admin";

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isAdmin) return null;

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasPendingConfirmation = messages.some(m => m.type === "confirmation_required");

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="Open AI Copilot"
          data-testid="copilot-toggle-button"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-0 right-0 z-50 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl"
          style={{ width: "400px", height: "100vh", maxHeight: "100dvh" }}
          data-testid="copilot-panel"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <p className="text-sm font-semibold">Admin Copilot</p>
                <p className="text-xs opacity-75">AI-powered admin assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearHistory}
                className="p-1.5 hover:bg-blue-700 rounded transition-colors"
                title="Clear history"
                aria-label="Clear conversation history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-blue-700 rounded transition-colors"
                aria-label="Close copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 py-12">
                <Bot className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm font-medium">Hi! I'm your Admin Copilot</p>
                <p className="text-xs mt-1 max-w-[260px]">
                  Ask me to create courses, manage students, list leads, or get platform statistics.
                </p>
                <div className="mt-4 text-left space-y-2">
                  {[
                    "Get platform summary",
                    "List all teachers",
                    "Create a B2 course",
                    "Search for student Ali",
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        setInputValue(suggestion);
                        inputRef.current?.focus();
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onConfirm={confirmAction}
                onCancel={cancelAction}
                isLoading={isLoading}
              />
            ))}

            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasPendingConfirmation
                    ? "Confirm or cancel the action above..."
                    : "Ask me anything..."
                }
                disabled={isLoading || hasPendingConfirmation}
                className="text-sm h-9"
                data-testid="copilot-input"
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim() || hasPendingConfirmation}
                className="h-9 px-3 bg-blue-600 hover:bg-blue-700"
                data-testid="copilot-send-button"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Powered by AI · Admin access only
            </p>
          </div>
        </div>
      )}
    </>
  );
}
