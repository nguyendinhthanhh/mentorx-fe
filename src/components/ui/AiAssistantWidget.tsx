import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';

export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 hover:scale-105 transition-all duration-300 z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right z-50 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-primary-600 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">MentorX AI</h3>
              <p className="text-xs text-primary-100">Ask me anything</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Area (Empty for now) */}
        <div className="h-[300px] bg-gray-50 p-4 overflow-y-auto flex flex-col gap-4">
           <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 max-w-[85%] text-sm text-gray-700">
              Hi there! I'm MentorX AI Assistant. How can I help you today?
           </div>
        </div>

        {/* Input Area using PromptInputBox */}
        <div className="p-3 bg-white border-t border-gray-100">
          <PromptInputBox
            onSend={(message, files) => {
              console.log("Message:", message);
              console.log("Files:", files);
            }}
            placeholder="Ask me anything..."
          />
        </div>
      </div>
    </>
  );
}
