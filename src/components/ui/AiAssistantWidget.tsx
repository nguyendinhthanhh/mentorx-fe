import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Trash2, Loader2 } from "lucide-react";
import { useGeminiChat, type ChatMessage } from "@/hooks/useGeminiChat";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary-600 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-800 rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span
          className={`block mt-1 text-[10px] ${isUser ? "text-primary-200" : "text-gray-400"}`}
        >
          {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, clearMessages } = useGeminiChat();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendLockRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading || sendLockRef.current) return;
    sendLockRef.current = true;
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    sendMessage(text);
    setTimeout(() => {
      sendLockRef.current = false;
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (messages.length <= 1) return;
    clearMessages();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 hover:scale-105 hover:shadow-xl transition-all duration-300 z-40 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open AI Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[400px] max-[440px]:w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right z-50 ${
          isOpen
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 pointer-events-none"
        }`}
        style={{ height: "min(600px, calc(100vh - 80px))" }}
      >
        {/* Header */}
        <div className="bg-primary-600 px-4 py-3 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">MentorX AI</h3>
              <p className="text-[11px] text-primary-100">
                {isLoading ? "Đang trả lời..." : "Hỏi về nền tảng MentorX"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <button
                onClick={handleClear}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                aria-label="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-gray-50">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                  <span className="text-sm text-gray-500">
                    Đang suy nghĩ...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-200 shrink-0">
          <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none max-h-[120px] leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                input.trim() && !isLoading
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">
            Trợ lý AI có thể mắc lỗi. Kiểm tra thông tin quan trọng.
          </p>
        </div>
      </div>
    </>
  );
}
