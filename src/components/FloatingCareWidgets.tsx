import React, { useEffect, useRef, useState } from 'react';
import { Calendar, MessageCircle, Send, X } from 'lucide-react';
import { NISARGA_CONTACT } from '../data/nisargaContent';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface FloatingCareWidgetsProps {
  onBookAppointment: () => void;
}

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Namaste. Welcome to Nisarga Care, Bengaluru. I can help with Dementia & Alzheimer’s care, Stroke & Parkinson’s rehabilitation, 24/7 nursing admissions, visiting hours, or booking a campus visit. How may I assist your family today?',
};

const QUICK_QUESTIONS = [
  'What Dementia & Alzheimer’s care services do you offer?',
  'Tell me about rooms, meals, and daily routine',
  'What are your visiting hours and Bengaluru address?',
  'How do I book an admission assessment?',
];

function WhatsAppSvgIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m5.81 14.08c-.24.68-1.42 1.3-1.97 1.38-.5.07-1.15.1-1.85-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.93-4.3-5.08-4.5-.15-.2-1.22-1.62-1.22-3.09s.77-2.2 1.04-2.5c.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.52.25.6.84 2.05.91 2.2.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.77 1.27 1.65 2.06 1.14 1.02 2.1 1.33 2.4 1.48.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.08.13.08.73-.17 1.41Z" />
    </svg>
  );
}

export function FloatingCareWidgets({ onBookAppointment }: FloatingCareWidgetsProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen, sending]);

  const sendMessage = async (textOverride?: string) => {
    const trimmed = (textOverride ?? input).trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setInput('');
    setErrorText(null);
    setSending(true);

    try {
      const payload = nextHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Unable to reach the care assistant.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply!,
        },
      ]);
    } catch (err: unknown) {
      setErrorText(
        err instanceof Error
          ? err.message
          : 'Could not reach the assistant right now. Please call +91 9731256246.',
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {chatOpen && (
        <section
          aria-label="Nisarga Care Assistant"
          className="w-[min(390px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-8rem))] bg-white border border-[#D4DDD6] rounded-2xl shadow-xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[#135D43] text-white">
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold tracking-tight truncate">
                Nisarga Care Concierge
              </h2>
              <p className="text-xs text-white/80 truncate">
                Care programs · Visiting hours · Admissions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Close care assistant"
              className="p-2 rounded-lg text-white/90 hover:bg-white/15 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#FAF9F6]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#135D43] text-white'
                      : 'bg-white border border-[#E2E7E2] text-[#14221D]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-medium text-[#4A5D55]">Common family questions</p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      disabled={sending}
                      className="text-left text-xs text-[#14221D] bg-white border border-[#DCE3DD] hover:border-[#135D43] hover:text-[#135D43] rounded-lg px-3 py-2 transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E2E7E2] text-[#4A5D55] rounded-xl px-4 py-3 text-xs">
                  Preparing your response...
                </div>
              </div>
            )}

            {errorText && (
              <div
                role="alert"
                className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed"
              >
                {errorText}
              </div>
            )}

            <div ref={scrollEndRef} />
          </div>

          <div className="px-4 py-2.5 bg-white border-t border-[#E8EDE9] flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setChatOpen(false);
                onBookAppointment();
              }}
              className="inline-flex items-center gap-1.5 text-[#135D43] font-medium hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              Book Appointment
            </button>
            <a
              href={NISARGA_CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#15803D] font-medium hover:underline whitespace-nowrap shrink-0"
            >
              <WhatsAppSvgIcon className="w-3.5 h-3.5" />
              WhatsApp +91 97312 56246
            </a>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-[#E2E7E2] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={800}
              placeholder="Ask about care, rooms, or visits..."
              aria-label="Ask Nisarga Care assistant"
              className="flex-1 min-w-0 px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="p-2.5 rounded-lg bg-[#135D43] text-white hover:bg-[#0F4A35] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}

      <div className="flex items-center gap-2.5">
        <a
          href={NISARGA_CONTACT.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Nisarga Care on WhatsApp"
          title="WhatsApp Care Line (+91 97312 56246)"
          className="h-12 px-4 rounded-full bg-[#15803D] text-white shadow-lg hover:bg-[#166534] transition-transform hover:-translate-y-0.5 flex items-center gap-2 text-sm font-medium whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
        >
          <WhatsAppSvgIcon className="w-5 h-5 shrink-0" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={() => setChatOpen((prev) => !prev)}
          aria-expanded={chatOpen}
          aria-label={chatOpen ? 'Close Nisarga Care chatbot' : 'Open Nisarga Care chatbot'}
          className="h-12 px-4 rounded-full bg-[#14221D] text-white shadow-lg hover:bg-[#135D43] transition-transform hover:-translate-y-0.5 flex items-center gap-2 text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#135D43]"
        >
          {chatOpen ? (
            <>
              <X className="w-4 h-4 shrink-0" />
              <span>Close</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Care Assistant</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
