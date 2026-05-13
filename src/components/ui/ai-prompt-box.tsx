import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, X } from 'lucide-react';

interface PromptInputBoxProps {
  onSend: (message: string, files: File[]) => void;
  placeholder?: string;
}

export function PromptInputBox({ onSend, placeholder = 'Ask me anything...' }: PromptInputBoxProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSend(message, files);
      setMessage('');
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto flex flex-col bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-400 transition-all duration-300">
      
      {/* Attached Files Preview */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 pb-0">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-sm group">
              <div className="w-8 h-8 rounded bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <Paperclip className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 truncate font-medium text-xs">{file.name}</p>
                <p className="text-gray-400 text-[10px]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full max-h-[200px] min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none px-3 py-3 text-gray-700 text-[15px] placeholder:text-gray-400"
          rows={1}
        />

        <div className="flex items-center gap-2 shrink-0 pb-1 pr-1">
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() && files.length === 0}
            className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
              message.trim() || files.length > 0
                ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700 hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
