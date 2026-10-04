'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import CreateTicketModal from '@/components/support/CreateTicketModal';
import TicketChatDrawer from '@/components/support/TicketChatDrawer';
import {
  Headphones,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  User,
  Building2,
  MessageSquare,
  Sparkles,
  Bot,
  Package,
} from 'lucide-react';

const CATEGORY_LIST = [
  'ALL',
  'KKM',
  'POS',
  'Terminal',
  'Fiskal modul',
  'OFD',
  'Bank',
  'Click',
  'Payme',
  'Paynet',
  'HUMO',
  'Dastur',
  'Internet',
  'Printer',
  'Scanner',
  'Boshqa',
];

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  YANGI: { label: 'Yangi', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  JARAYONDA: { label: 'Jarayonda', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  JAVOB_KUTILMOQDA: { label: 'Javob kutilmoqda', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  TEXNIKKA_BERILDI: { label: 'Texnikka berildi', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  YECHILDI: { label: 'Yechildi', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  YOPILDI: { label: 'Yopildi', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [branches, setBranches] = useState<any[]>([]);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        if (d.branches) setBranches(d.branches);
      });
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (branchFilter !== 'ALL') params.set('branchId', branchFilter);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
        setKpis(data.kpis || null);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, categoryFilter, priorityFilter, branchFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <AppLayout>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Headphones className="w-6 h-6 text-rose-600" />
            <span>Professional Support & Ticket Tizimi (Service Desk)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mijozlar texnik murojaatlari, jonli chat, 360° kontekst va AI diagnostika tizimi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTickets}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-rose-600' : ''}`} />
            <span>Yangilash</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Murojaat</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Jami Murojaatlar</span>
            <span className="text-xl font-bold text-slate-900 block mt-0.5">{kpis.total} ta</span>
            <span className="text-[10px] text-slate-500 font-medium">Barcha chiptalar</span>
          </div>

          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Yangi</span>
            <span className="text-xl font-bold text-blue-700 block mt-0.5">{kpis.yangi} ta</span>
            <span className="text-[10px] text-blue-600 font-medium">javob berilmagan</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Jarayonda</span>
            <span className="text-xl font-bold text-amber-700 block mt-0.5">{kpis.jarayonda} ta</span>
            <span className="text-[10px] text-amber-600 font-medium">operator ko'rib chiqmoqda</span>
          </div>

          <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-sky-700 block">Texnikka Berildi</span>
            <span className="text-xl font-bold text-sky-700 block mt-0.5">{kpis.texnikkaBerildi} ta</span>
            <span className="text-[10px] text-sky-600 font-medium">joyiga borib ko'riladi</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Yechilgan</span>
            <span className="text-xl font-bold text-emerald-700 block mt-0.5">{kpis.yechildi} ta</span>
            <span className="text-[10px] text-emerald-600 font-medium">muammo bartaraf etildi</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Shoshilinch</span>
            <span className="text-xl font-bold text-rose-700 block mt-0.5">{kpis.urgent} ta</span>
            <span className="text-[10px] text-rose-600 font-medium">zudlik bilan e'tibor</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Chipta No, Mijoz, STIR, Muammo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">Barcha Kategoriyalar</option>
              {CATEGORY_LIST.filter((c) => c !== 'ALL').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">Barcha Holatlar</option>
              <option value="YANGI">Yangi</option>
              <option value="JARAYONDA">Jarayonda</option>
              <option value="JAVOB_KUTILMOQDA">Javob kutilmoqda</option>
              <option value="TEXNIKKA_BERILDI">Texnikka berildi</option>
              <option value="YECHILDI">Yechildi</option>
              <option value="YOPILDI">Yopildi</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">Barcha Muhimlik</option>
              <option value="PAST">Past</option>
              <option value="ODDIY">Oddiy</option>
              <option value="YUQORI">Yuqori</option>
              <option value="SHOSHILINCH">Shoshilinch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm space-y-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-rose-100 mx-auto"></div>
          <p className="text-xs text-slate-400">Support chiptalari yuklanmoqda...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <Headphones className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Support chiptalari topilmadi</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Mijozdan yangi murojaat kelib tushganda yoki savol bo'lganda yangi chipta yarating.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Murojaat Qabul Qilish</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Chipta No</th>
                  <th className="py-3 px-4">Kategoriya</th>
                  <th className="py-3 px-4">Mijoz / Do'kon</th>
                  <th className="py-3 px-4">Muammo Mazmuni</th>
                  <th className="py-3 px-4 text-center">Muhimlik</th>
                  <th className="py-3 px-4 text-center">Holat</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => {
                  const statusConf = STATUS_CONFIG[t.status] || {
                    label: t.status,
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Ticket Number */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                          {t.ticketNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(t.createdAt).toLocaleDateString('uz')}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800">
                          {t.category}
                        </span>
                        {t.deviceName && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px] mt-0.5">
                            {t.deviceName}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{t.customer?.companyName}</div>
                        <div className="text-[10px] font-mono text-slate-400">STIR: {t.customer?.inn}</div>
                      </td>

                      {/* Issue snippet */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-800 font-medium line-clamp-1">{t.issue}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          <span>{t.messages?.length || 0} ta xabar</span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.priority === 'SHOSHILINCH'
                              ? 'bg-rose-100 text-rose-800'
                              : t.priority === 'YUQORI'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConf.badge}`}>
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedTicketId(t.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchTickets();
        }}
      />

      <TicketChatDrawer
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onTicketUpdated={fetchTickets}
      />
    </AppLayout>
  );
}
