import { useState, useRef, useCallback } from "react";
import { aiApi, type AiChatMessage } from "@/api/aiApi";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function useGeminiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý ảo của MentorX. Tôi có thể giúp bạn tìm hiểu về nền tảng MentorX, các tính năng, hướng dẫn sử dụng, chính sách và giải đáp thắc mắc. Bạn cần hỗ trợ gì?",
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  const buildHistory = useCallback(
    (msgs: ChatMessage[]): AiChatMessage[] => {
      const history: AiChatMessage[] = [];
      for (const msg of msgs) {
        if (msg.id === "welcome" || msg.id.endsWith("-err")) continue;
        if (msg.role !== "user" && msg.role !== "assistant") continue;
        history.push({
          role: msg.role === "user" ? "USER" : "ASSISTANT",
          content: msg.content,
        });
      }
      return history;
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text) return;
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const history = buildHistory(messages);
        const response = await aiApi.chat(
          { message: text, history },
          abortController.signal
        );

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-resp`,
          role: "assistant",
          content: response.message,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.name === "AbortError" || "code" in err && err.code === "ERR_CANCELED")
        ) {
          return;
        }
        const errorMsg = "Không thể gửi câu hỏi lúc này. Vui lòng thử lại sau.";
        setError(errorMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-err`,
            role: "assistant",
            content: `❌ ${errorMsg}`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
        abortRef.current = null;
      }
    },
    [messages, buildHistory]
  );

  const clearMessages = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    isLoadingRef.current = false;
    setIsLoading(false);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Xin chào! Tôi là trợ lý ảo của MentorX. Tôi có thể giúp bạn tìm hiểu về nền tảng MentorX, các tính năng, hướng dẫn sử dụng, chính sách và giải đáp thắc mắc. Bạn cần hỗ trợ gì?",
        timestamp: Date.now(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
