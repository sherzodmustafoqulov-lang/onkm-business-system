'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Building2,
  Package,
  History,
  FileCheck,
  Phone,
  ChevronDown,
  RotateCcw,
  Check,
} from 'lucide-react';

interface TicketChatDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  onTicketUpdated: () => void;
}

const QUICK_TEMPLATES = [
  'Kassani 10 soniyaga elektrdan o\'chirib qayta yoqing.',
  'Termo-qog\'oz lentasini tekshiring va FEED tugmasi bilan test cheki chiqaring.',
  'Internet kabeli (Ethernet) yoki SIM-karta balansini tekshiring.',
  'Soliq portalida abonent to\'lovi faolligi tekshirildi, hammasi joyida.',
  'Texnik xodimimiz siz bilan 15 daqiqa ichida bog\'lanadi.',
];

export default function TicketChatDrawer({
  ticketId,
  onClose,
  onTicketUpdated,
}: TicketChatDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'CONTEXT'>('CHAT');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = React.useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${ticketId}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.ticket?.aiDiagnosis) {
          setAiOutput(json.ticket.aiDiagnosis);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    } else {
      setData(null);
      setAiOutput(null);
    }
  }, [ticketId, fetchTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.ticket?.messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!msgInput.trim() || !ticketId) return;

    setSendingMsg(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgInput,
          senderType: 'USER',
        }),
      });

      if (res.ok) {
        setMsgInput('');
        await fetchTicket();
        onTicketUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchTicket();
        onTicketUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunAiDiagnosis = async () => {
    if (!ticketId) return;
    setAiLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/ai-diagnose`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok && json.aiDiagnosis) {
        setAiOutput(json.aiDiagnosis);
        await fetchTicket();
        onTicketUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (!ticketId) return null;

  const ticket = data?.ticket;
  const context = data?.context360;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl lg:max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 min-w-0"
      >
        {/* Drawer Header */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-500/20 flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-slate-900">{ticket?.ticketNumber}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800">
                  {ticket?.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ticket?.priority === 'SHOSHILINCH'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {ticket?.priority}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                {ticket?.customer?.companyName} • {ticket?.deviceName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status Dropdown */}
            {ticket && (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                <option value="YANGI">Yangi</option>
                <option value="JARAYONDA">Jarayonda</option>
                <option value="JAVOB_KUTILMOQDA">Javob kutilmoqda</option>
                <option value="TEXNIKKA_BERILDI">Texnikka berildi</option>
                <option value="YECHILDI">Yechildi</option>
                <option value="YOPILDI">Yopildi</option>
              </select>
            )}

            <button
              onClick={onClose}
              title="Yopish (Esc)"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher: Chat vs 360 Context */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50/50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'CHAT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Jonli Chat & AI Maslahat</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-bold">
              {ticket?.messages?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('CONTEXT')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'CONTEXT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Mijoz 360° Tarixi & Qurilmalar</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-w-0">
          {activeTab === 'CHAT' ? (
            /* CHAT INTERFACE & AI DIAGNOSIS */
            <div className="flex-1 flex flex-col h-full bg-slate-50/40 min-w-0 overflow-hidden">
              {/* Issue Description Banner */}
              <div className="p-3.5 bg-amber-50/80 border-b border-amber-200/70 text-xs text-amber-900 flex items-start justify-between gap-3 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-800 mb-0.5">
                    Murojaat sababi:
                  </span>
                  <p className="text-xs text-slate-800 break-words leading-relaxed font-medium">
                    {ticket?.issue}
                  </p>
                </div>
                <button
                  onClick={handleRunAiDiagnosis}
                  disabled={aiLoading}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span className="whitespace-nowrap">{aiLoading ? 'Tahlil...' : 'AI Diagnostika'}</span>
                </button>
              </div>

              {/* AI Diagnosis Output Card (if generated) */}
              {aiOutput && (
                <div className="p-3.5 m-3 bg-purple-50/90 border border-purple-200 rounded-xl text-xs space-y-2 animate-in fade-in duration-150 flex-shrink-0">
                  <div className="flex items-center justify-between text-purple-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      AI Maslahat & Diagnostik Tahlil
                    </span>
                    <button
                      onClick={() => setMsgInput((prev) => (prev ? prev + '\n' + aiOutput : aiOutput))}
                      className="text-[11px] text-purple-700 hover:underline font-semibold cursor-pointer"
                    >
                      Chatga kiritish →
                    </button>
                  </div>
                  <pre className="text-slate-800 text-[11px] whitespace-pre-wrap break-words font-sans bg-white/80 p-2.5 rounded-lg border border-purple-100 max-h-52 overflow-y-auto leading-relaxed">
                    {aiOutput}
                  </pre>
                </div>
              )}

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-w-0">
                {ticket?.messages?.map((m: any) => {
                  const isUser = m.senderType === 'USER';
                  const isCustomer = m.senderType === 'CUSTOMER';
                  const isBot = m.senderType === 'BOT';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1 font-semibold">
                        <span>{m.senderName}</span>
                        <span>•</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs shadow-sm leading-relaxed break-words overflow-hidden ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : isCustomer
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                            : 'bg-purple-100 border border-purple-200 text-purple-900 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                        {m.attachmentUrl && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] underline flex items-center gap-1 font-semibold break-all"
                            >
                              <Paperclip className="w-3 h-3 flex-shrink-0" /> Biriktirilgan fayl / rasm
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Response Templates */}
              <div className="px-4 py-2 bg-white border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto text-[11px] w-full min-w-0 flex-shrink-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 whitespace-nowrap flex-shrink-0">
                  Shablonlar:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 w-full min-w-0">
                  {QUICK_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMsgInput(tmpl)}
                      title={tmpl}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-full whitespace-nowrap transition-colors border border-slate-200/60 text-[11px] flex-shrink-0 cursor-pointer"
                    >
                      {tmpl.length > 35 ? tmpl.slice(0, 35) + '…' : tmpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 w-full min-w-0 flex-shrink-0">
                <input
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Mijozga javob yoki ichki izoh yozing..."
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !msgInput.trim()}
                  className="flex-shrink-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Yuborish</span>
                </button>
              </form>
            </div>
          ) : (
            /* 360° CONTEXT & HISTORY VIEW */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
              {/* Customer Profile */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  Mijoz Rekvizitlari
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kompaniya:</span>
                    <span className="font-bold text-slate-900">{context?.customer?.companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">STIR:</span>
                    <span className="font-mono font-semibold text-slate-800">{context?.customer?.inn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Telefon:</span>
                    <span className="font-mono text-slate-700">{context?.customer?.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">OFD Holati:</span>
                    <span className="font-bold text-emerald-600">{context?.customer?.ofdStatus}</span>
                  </div>
                </div>
              </div>

              {/* Devices History */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  Mijozning Uskunalari (Apparatlar bazasi)
                </div>
                <div className="space-y-2">
                  {context?.devices?.serials?.map((s: any) => (
                    <div key={s.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{s.product?.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">Seriya: {s.serialNumber}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status}
                      </span>
                    </div>
                  ))}
                  {(!context?.devices?.serials || context.devices.serials.length === 0) && (
                    <div className="text-xs text-slate-400">Bog'langan apparatlar topilmadi</div>
                  )}
                </div>
              </div>

              {/* Previous Tickets */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  Oldingi Murojaatlar Tarixi
                </div>
                <div className="space-y-2">
                  {context?.previousTickets?.map((pt: any) => (
                    <div key={pt.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-600">{pt.ticketNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                          {pt.category}
                        </span>
                      </div>
                      <div className="text-slate-800 font-medium">{pt.issue}</div>
                      {pt.solution && (
                        <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-1.5 rounded">
                          Yechim: {pt.solution}
                        </div>
                      )}
                    </div>
                  ))}
                  {(!context?.previousTickets || context.previousTickets.length === 0) && (
                    <div className="text-xs text-slate-400">Oldingi chiptalar mavjud emas (Mijozning birinchi murojaati)</div>
                  )}
                </div>
              </div>

              {/* Installation History */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  O'rnatish & Servis Tarixi
                </div>
                <div className="space-y-2">
                  {context?.installationHistory?.map((inst: any) => (
                    <div key={inst.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800">{inst.taskNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {inst.completedAt ? new Date(inst.completedAt).toLocaleDateString('uz') : ''}
                        </span>
                      </div>
                      <div className="text-slate-700">{inst.deviceName} ({inst.serviceType})</div>
                      <div className="text-[11px] text-slate-500">Texnik: {inst.technician?.name || 'Mintaqaviy texnik'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
