import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'luxe_chat_history';
const DEFAULT_MESSAGES: Message[] = [
  { role: 'assistant', content: 'Xin chào! Tôi là trợ lý tư vấn của LUXE JEWELRY. Bạn cần tư vấn gì về trang sức?' },
];

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MESSAGES;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist messages to sessionStorage (cleared when tab/browser closes)
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Clear chat history on sign-in / sign-out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        sessionStorage.removeItem(STORAGE_KEY);
        setMessages(DEFAULT_MESSAGES);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { messages: newMessages.map(m => ({ role: m.role, content: m.content })) },
      });

      if (error) throw error;

      const assistantContent = data?.content || data?.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center"
        aria-label="Chat tư vấn"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-card border rounded-xl shadow-xl flex flex-col overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
            <MessageCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold text-sm">Tư vấn LUXE JEWELRY</p>
              <p className="text-xs opacity-80">AI trợ lý trang sức</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            const isInternal = href?.startsWith('/');
                            if (isInternal) {
                              return (
                                <Link to={href!} onClick={() => setOpen(false)} className="text-primary underline">
                                  {children}
                                </Link>
                              );
                            }
                            return (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-lg text-sm">
                  <span className="animate-pulse">Đang trả lời...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="p-3 border-t flex gap-2"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
