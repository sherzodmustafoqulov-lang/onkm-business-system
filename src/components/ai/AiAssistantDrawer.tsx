'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User as UserIcon,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Zap,
} from 'lucide-react';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id: string;
    name: string;
    role: string;
    roleDisplayName?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: Array<{ name: string; success: boolean }>;
  timestamp: string;
}

export default function AiAssistantDrawer({
  isOpen,
  onClose,
  currentUser,
}: AiAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userRole = currentUser?.role || 'ADMIN';

  // Role bo'yicha tayyor savollar
  const getRoleQuickPrompts = () => {
    switch (userRole) {
      case 'ADMIN':
        return [
          'Bugungi savdo qancha?',
          'Bugungi foyda qancha?',
          'Qaysi filialda FM kam?',
          'Qaysi mahsulot kam qolgan?',
          'Ochiq supportlar nechta?',
          'Qaysi menejerning savdosi qancha?',
        ];
      case 'MANAGER':
        return [
          'Mening mijozlarim',
          'Mening buyurtmalarim',
          'Mening bugungi savdom',
          'Mening vazifalarim',
          'Mening supportlarim',
        ];
      case 'WAREHOUSE':
        return [
          'Qaysi mahsulot kamaygan?',
          'FM qoldig\'i qancha?',
          'Qaysi filialda mahsulot bor?',
        ];
      case 'SUPPORT':
        return [
          'Mening ticketlarim',
          'Kechikkan ticketlar',
          'Bugungi ticketlar',
        ];
      default:
        return [
          'Mening vazifalarim',
          'Qurilmalar holati',
        ];
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Boshlang'ich kutib olish xabari
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Assalomu alaykum, **${currentUser?.name || 'Foydalanuvchi'}**!\n\n` +
            `Men **ONKM Business ERP** aqlli yordamchisiman. Siz tizimda **${currentUser?.roleDisplayName || userRole}** sifatida faoliyat yuritmoqdasiz.\n\n` +
            `Barcha ma'lumotlar real vaqt rejimida va sizning ruxsatlaringiz (RBAC) doirasida taqdim etiladi. Quyidagi tayyor savollardan birini tanlashingiz yoki o'zingiz yozishingiz mumkin:`,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, currentUser, userRole, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server xatosi');
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        toolsUsed: data.toolsUsed,
        timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ Xatolik: ${err.message || 'So\'rovni bajarib bo\'lmadi'}`,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Muloqot yangilandi. Hurmatli **${currentUser?.name || 'Foydalanuvchi'}**, qanday savolingiz bor?`,
        timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="h-16 px-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">ONKM AI Assistant</span>
                <span className="text-[10px] font-semibold bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                  {currentUser?.roleDisplayName || userRole}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                RBAC Xavfsiz Service Layer Faol
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              title="Chatni tozalash"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
            <Zap className="w-3 h-3 text-amber-500" />
            Tezkor:
          </span>
          {getRoleQuickPrompts().map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="flex-shrink-0 text-xs font-medium bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-3 py-1 rounded-full transition-all shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {m.role === 'assistant' ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px] font-semibold text-slate-600">ONKM AI</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-semibold text-slate-600">{currentUser?.name || 'Siz'}</span>
                  </>
                )}
                <span className="text-[10px] text-slate-400">{m.timestamp}</span>
              </div>

              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                }`}
              >
                {m.content}

                {/* Tools executed indicator */}
                {m.toolsUsed && m.toolsUsed.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Terminal className="w-2.5 h-2.5" />
                      Tools:
                    </span>
                    {m.toolsUsed.map((t, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                          t.success
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {t.success ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        ) : (
                          <ShieldAlert className="w-2.5 h-2.5 text-red-600" />
                        )}
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <Bot className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-semibold text-slate-600">ONKM AI</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 rounded-bl-xs shadow-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                <span className="text-xs text-slate-500 font-medium">
                  Ruxsatlar tekshirilmoqda va ma'lumotlar tahlil qilinmoqda...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Savol bering (masalan: "${getRoleQuickPrompts()[0]}")...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/20 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1.5 text-center text-[10px] text-slate-400">
            🔒 Xavfsiz RBAC: AI faqat sizning rolingiz ruxsat bergan ma'lumotlarni chiqaradi.
          </div>
        </div>
      </div>
    </div>
  );
}
