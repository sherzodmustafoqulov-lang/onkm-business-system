'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import TechnicianMobileView from '@/components/installations/TechnicianMobileView';
import CreateInstallationModal from '@/components/installations/CreateInstallationModal';
import InstallationDetailModal from '@/components/installations/InstallationDetailModal';
import {
  Wrench,
  Smartphone,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Navigation,
  MapPin,
  Package,
  User,
  Building2,
  Calendar,
  AlertCircle,
  Eye,
  FileCheck,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  YANGI: { label: 'Yangi', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  QABUL_QILINDI: { label: 'Qabul qilindi', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  YOLDA: { label: 'Yo\'lda', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ISH_BOSHLANDI: { label: 'Ish boshlandi', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ORNATILDI: { label: 'O\'rnatildi', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  TEST_QILINDI: { label: 'Test qilindi', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  YAKUNLANDI: { label: 'Yakunlandi', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  BEKOR_QILINDI: { label: 'Bekor qilindi', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function InstallationsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View Mode: 'desktop' or 'mobile'
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [branches, setBranches] = useState<any[]>([]);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Fetch current user
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
          // If logged-in user is a technician, default to mobile view!
          if (d.user.role === 'TECHNICIAN') {
            setViewMode('mobile');
          }
        }
      })
      .catch((e) => console.error(e));

    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        if (d.branches) setBranches(d.branches);
      });
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (serviceFilter !== 'ALL') params.set('serviceType', serviceFilter);
      if (branchFilter !== 'ALL') params.set('branchId', branchFilter);

      const res = await fetch(`/api/installations?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setTasks(data.installations || []);
        setKpis(data.kpis || null);
      }
    } catch (err) {
      console.error('Failed to load installations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, serviceFilter, branchFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <AppLayout>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-600" />
            <span>O'rnatishlar & Texnik Servis Moduli (Installation & Field Service)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Buyurtma → Vazifa biriktirish → Texnik yo'lda → O'rnatish & Test → Dalolatnoma & Yakunlash
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle: Desktop Table vs Technician Mobile */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'desktop'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Menejer (Desktop)</span>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'mobile'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Texnik Mobil Ko'rinish</span>
            </button>
          </div>

          <button
            onClick={fetchTasks}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>Yangilash</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-amber-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Topshiriq</span>
          </button>
        </div>
      </div>

      {/* Render Mobile View or Desktop View */}
      {viewMode === 'mobile' ? (
        <TechnicianMobileView tasks={tasks} currentUser={currentUser} onRefresh={fetchTasks} />
      ) : (
        <>
          {/* KPI Summary Cards */}
          {kpis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Jami Vazifalar</span>
                <span className="text-xl font-bold text-slate-900 block mt-0.5">{kpis.total} ta</span>
                <span className="text-[10px] text-slate-500 font-medium">Barcha topshiriqlar</span>
              </div>

              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Yangi / Biriktirilgan</span>
                <span className="text-xl font-bold text-blue-700 block mt-0.5">{kpis.yangi} ta</span>
                <span className="text-[10px] text-blue-600 font-medium">qabul qilinishi kutilmoqda</span>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Jarayonda (Yo'lda / Montaj)</span>
                <span className="text-xl font-bold text-amber-700 block mt-0.5">{kpis.jarayonda} ta</span>
                <span className="text-[10px] text-amber-600 font-medium">texnik xizmat jarayonida</span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Tugallangan (Akt qilingan)</span>
                <span className="text-xl font-bold text-emerald-700 block mt-0.5">{kpis.yakunlandi} ta</span>
                <span className="text-[10px] text-emerald-600 font-medium">chek chiqarib test qilingan</span>
              </div>

              <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Mening Vazifalarim</span>
                <span className="text-xl font-bold text-purple-700 block mt-0.5">{kpis.myTasks} ta</span>
                <span className="text-[10px] text-purple-600 font-medium">shaxsiy profilga oid</span>
              </div>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Vazifa No, Mijoz, STIR, Qurilma..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">Barcha Holatlar</option>
                  <option value="YANGI">Yangi</option>
                  <option value="QABUL_QILINDI">Qabul qilindi</option>
                  <option value="YOLDA">Yo'lda</option>
                  <option value="ISH_BOSHLANDI">Ish boshlandi</option>
                  <option value="ORNATILDI">O'rnatildi</option>
                  <option value="TEST_QILINDI">Test qilindi</option>
                  <option value="YAKUNLANDI">Yakunlandi</option>
                  <option value="BEKOR_QILINDI">Bekor qilindi</option>
                </select>
              </div>

              {/* Service Type */}
              <div>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">Barcha Xizmat Turlari</option>
                  <option value="ONKM_ORNATISH">ONKM O'rnatish</option>
                  <option value="POS_ORNATISH">POS Monoblok O'rnatish</option>
                  <option value="FM_ALMASHTIRISH">Fiskal Modul Almashtirish</option>
                  <option value="SERVIS">Kassa & Printer Servis</option>
                </select>
              </div>

              {/* Branch */}
              <div>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">Barcha Filiallar</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} filiali
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Data Grid Table */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm space-y-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-amber-100 mx-auto"></div>
              <p className="text-xs text-slate-400">Topshiriqlar ro'yxati yuklanmoqda...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">O'rnatish topshiriqlari topilmadi</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Filtr parametrlarini o'zgartiring yoki yangi texnik topshiriq biriktiring.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Topshiriq Yaratish</span>
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Vazifa No</th>
                      <th className="py-3 px-4">Mijoz / Manzil</th>
                      <th className="py-3 px-4">Qurilma / Xizmat</th>
                      <th className="py-3 px-4">Servis Texnik</th>
                      <th className="py-3 px-4">Sana & Vaqt</th>
                      <th className="py-3 px-4 text-center">Holat</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((t) => {
                      const statusConf = STATUS_CONFIG[t.status] || {
                        label: t.status,
                        badge: 'bg-slate-100 text-slate-700 border-slate-200',
                      };
                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          {/* Task No */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                              {t.taskNumber}
                            </div>
                            {t.order && (
                              <div className="text-[10px] font-mono text-blue-600 mt-0.5">
                                Buyurtma: {t.order.orderNumber}
                              </div>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{t.customer?.companyName}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                              <span>{t.location || t.customer?.address || 'Manzil ko\'rsatilmagan'}</span>
                            </div>
                          </td>

                          {/* Device & Service */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              <span>{t.deviceName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              {t.serviceType}
                              {t.serialNumber ? ` • № ${t.serialNumber}` : ''}
                            </div>
                          </td>

                          {/* Technician */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">
                              {t.technician?.name || 'Navbatchi (Biriktirilmagan)'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {t.technician?.phone || t.branch?.name + ' filiali'}
                            </div>
                          </td>

                          {/* Date & Time */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">
                              {t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString('uz') : 'Belgilanmagan'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {t.scheduledTime ? `soat ${t.scheduledTime}` : ''}
                            </div>
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
                              onClick={() => setSelectedTask(t)}
                              className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-lg transition-colors"
                              title="Batafsil ko'rish"
                            >
                              <Eye className="w-3.5 h-3.5" />
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
        </>
      )}

      {/* Modals */}
      <CreateInstallationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchTasks();
        }}
      />

      <InstallationDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={() => {
          fetchTasks();
          setSelectedTask(null);
        }}
      />
    </AppLayout>
  );
}
