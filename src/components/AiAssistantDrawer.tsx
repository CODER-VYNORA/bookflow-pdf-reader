import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Trash2, X, RefreshCw, Copy, Check } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  pageNumber: number;
  pageText: string;
  activeContextText?: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  bookTitle,
  pageNumber,
  pageText,
  activeContextText,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Hello! I'm your Gemini AI reading companion for **${bookTitle}**. Ask me questions about Page ${pageNumber}, request summaries, or highlight any complex passage to get clear explanations!`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-fill prompt if activeContextText arrives
  useEffect(() => {
    if (activeContextText && isOpen) {
      setInput(`Please explain this passage from Page ${pageNumber}: "${activeContextText.slice(0, 150)}..."`);
    }
  }, [activeContextText, isOpen, pageNumber]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: activeContextText,
          pageText,
          bookTitle,
          pageNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const modelMessage: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply || "I couldn't process that reading query.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Error connecting to Gemini assistant: ${err.message}. Please verify server connection.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    `Summarize Page ${pageNumber}`,
    'Explain key concepts simply',
    'Generate 3 quiz questions from this page',
  ];

  return (
    <div
      className="fixed inset-y-0 right-0 w-96 max-w-[92vw] bg-white border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 leading-none">AI Reading Companion</h3>
            <span className="text-[11px] text-slate-400 font-mono">Page {pageNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  id: 'welcome',
                  role: 'model',
                  content: `Conversation reset. Reading **${bookTitle}** (Page ${pageNumber}). How can I assist you?`,
                  timestamp: Date.now(),
                },
              ])
            }
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'model' && (
              <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`relative group max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{m.content}</div>

              {m.role === 'model' && (
                <button
                  type="button"
                  onClick={() => handleCopy(m.id, m.content)}
                  className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded-sm bg-white/80 transition-opacity"
                  title="Copy response"
                >
                  {copiedId === m.id ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>Gemini is reading and formulating an answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-200 shrink-0 bg-white"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this page or concepts..."
            className="w-full text-xs pl-3 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 p-1.5 bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-700 rounded-md transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
