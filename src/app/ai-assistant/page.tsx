'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Zap,
  Lock,
  Cpu,
  Database,
  Building,
  BarChart,
  Package,
  Headphones,
  Users,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: Array<{ name: string; success: boolean }>;
  timestamp: string;
}

export default function AiAssistantPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const userRole = currentUser?.role || 'ADMIN';

  useEffect(() => {
    if (currentUser && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Assalomu alaykum, **${currentUser.name}**!\n\n` +
            `Men **ONKM Business ERP** aqlli yordamchisiman. Siz tizimda **${currentUser.roleDisplayName || userRole}** sifatida tizimga kirdingiz.\n\n` +
            `AI vositalari (tools) sizning RBAC ruxsatnomalaringiz asosida himoyalangan. To'g'ridan-to'g'ri ochiq SQL so'rovlariga yo'l qo'yilmaydi.\n\n` +
            `Menga korxona ma'lumotlari, savdolar, qoldiqlar, fiskal modullar yoki support ticketlar bo'yicha savollaringizni berishingiz mumkin.`,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [currentUser, userRole, messages.length]);

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
      if (!res.ok) throw new Error(data.error || 'Server xatosi');

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
          content: `❌ Xatolik: ${err.message || 'Xatolik yuz berdi'}`,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const roleLibraries = [
    {
      role: 'ADMIN',
      title: 'Administrator Savollari',
      icon: ShieldCheck,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      questions: [
        'Bugungi savdo qancha?',
        'Bugungi foyda qancha?',
        'Qaysi filialda FM kam?',
        'Qaysi mahsulot kam qolgan?',
        'Ochiq supportlar nechta?',
        'Qaysi menejerning savdosi qancha?',
      ],
    },
    {
      role: 'MANAGER',
      title: 'Menejer Savollari',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      questions: [
        'Mening mijozlarim',
        'Mening buyurtmalarim',
        'Mening bugungi savdom',
        'Mening vazifalarim',
        'Mening supportlarim',
      ],
    },
    {
      role: 'WAREHOUSE',
      title: 'Omborchi Savollari',
      icon: Package,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      questions: [
        'Qaysi mahsulot kamaygan?',
        'FM qoldig\'i qancha?',
        'Qaysi filialda mahsulot bor?',
      ],
    },
    {
      role: 'SUPPORT',
      title: 'Support Operator Savollari',
      icon: Headphones,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      questions: [
        'Mening ticketlarim',
        'Kechikkan ticketlar',
        'Bugungi ticketlar',
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  ONKM AI Enterprise Assistant
                </h1>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                  v8.0 RBAC
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kompaniya ma'lumotlarini tabiiy tilda so'rash, tahlil qilish va nazorat qilish vositasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rol: <strong>{currentUser?.roleDisplayName || userRole}</strong></span>
            </div>
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'reset',
                    role: 'assistant',
                    content: `Muloqot yangilandi. Hurmatli **${currentUser?.name || 'Foydalanuvchi'}**, qanday ma'lumot kerak?`,
                    timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tozalash
            </button>
          </div>
        </div>

        {/* Main Grid: Left Prompt/Security Library + Right Chat Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Prompts & Architecture Guardrails (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Architecture Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Database className="w-4 h-4 text-blue-600" />
                Xavfsiz AI Service Layer
              </div>
              <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>9 ta Himoyalangan Tool:</strong> getCustomers, getOrders, getSales, getPayments, getStock, getFiscalModules, getSupportTickets, getInstallations, getReports.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>No Unrestricted SQL:</strong> Barcha so'rovlar qat'iy parametrli Prisma API orqali bajariladi.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Rol Izolyatsiyasi:</strong> Foydalanuvchi faqat o'ziga ruxsat etilgan ma'lumotni ko'ra oladi.</span>
                </p>
              </div>
            </div>

            {/* Quick Prompt Libraries for Roles */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
                Rollar bo'yicha tayyor savollar
              </div>

              {roleLibraries.map((lib, idx) => {
                const Icon = lib.icon;
                const isCurrentRole = lib.role === userRole;

                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                      isCurrentRole ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${lib.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{lib.title}</span>
                      </div>
                      {isCurrentRole && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Sizning rolingiz
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {lib.questions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSendMessage(q)}
                          className="text-[11px] font-medium bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-all text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Chat Terminal (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[700px] overflow-hidden">
            {/* Terminal Header */}
            <div className="h-14 px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono tracking-wider text-slate-200">
                  ONKM_AI_TERMINAL // LIVE_SESSION
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-mono text-slate-400">ONLINE</span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {m.role === 'assistant' ? (
                      <>
                        <Bot className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-700">ONKM AI Assistant</span>
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-bold text-slate-700">{currentUser?.name || 'Siz'}</span>
                      </>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {m.content}

                    {m.toolsUsed && m.toolsUsed.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          Ijro etilgan vositalar:
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
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">ONKM AI Assistant</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 rounded-bl-xs shadow-xs flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></div>
                    <span className="text-xs text-slate-500 font-medium">
                      RBAC tekshiruvi amalga oshirilmoqda va javob tayyorlanmoqda...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  placeholder="Savolingizni kiriting (masalan: Bugungi savdo qancha? yoki Mening mijozlarim)..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-2 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Yuborish</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
