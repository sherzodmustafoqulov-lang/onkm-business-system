'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  BadgeDollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Smartphone,
  Banknote,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  Check,
  Copy,
  ShieldCheck,
  ShieldAlert,
  Save,
  X,
  Tag,
  DollarSign,
  Briefcase,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';

const METHOD_ICONS: Record<string, any> = {
  Naqd: Banknote,
  Bank: Building,
  Click: Smartphone,
  Payme: Smartphone,
  HUMO: CreditCard,
  Uzcard: CreditCard,
  Paynet: Smartphone,
  Boshqa: CreditCard,
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  ALL: { label: 'Barchasi', color: 'bg-slate-100 text-slate-700' },
  ABONENT: { label: 'Abonent To\'lovi', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ORNATISH: { label: 'Kassa O\'rnatish', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  DASTURIY: { label: 'Dasturiy Ta\'minot', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  SERVIS: { label: 'Texnik Servis', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  KONSULTATSIYA: { label: 'Konsultatsiya & Skaner', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  BOSHQA: { label: 'Boshqa Xizmatlar', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'services' | 'payments'>('services');

  // Stats Data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Services State
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoleName, setUserRoleName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Service Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    category: 'ABONENT',
    billingType: 'OYLIK',
    description: '',
    isActive: true,
  });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceError, setServiceError] = useState('');

  // Fetch Finance Stats
  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/finance/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load finance stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Services Catalog
  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const query = new URLSearchParams();
      if (searchQuery.trim()) query.set('q', searchQuery.trim());
      if (selectedCategory !== 'ALL') query.set('category', selectedCategory);

      const res = await fetch(`/api/finance/services?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setServices(json.services || []);
        setIsAdmin(Boolean(json.isAdmin));
        setUserRoleName(json.userRoleName || '');
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchServices();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices();
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingServiceId(null);
    setServiceForm({
      name: '',
      price: '',
      category: 'ABONENT',
      billingType: 'OYLIK',
      description: '',
      isActive: true,
    });
    setServiceError('');
    setIsServiceModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (service: any) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name || '',
      price: service.price ? service.price.toString() : '',
      category: service.category || 'ABONENT',
      billingType: service.billingType || 'OYLIK',
      description: service.description || '',
      isActive: service.isActive !== undefined ? service.isActive : true,
    });
    setServiceError('');
    setIsServiceModalOpen(true);
  };

  // Save Service (Create or Update)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setServiceSaving(true);
      setServiceError('');

      if (!serviceForm.name.trim()) {
        setServiceError('Xizmat nomi kiritilishi shart');
        return;
      }
      if (!serviceForm.price || Number(serviceForm.price) < 0) {
        setServiceError('Xizmat narxi to\'g\'ri kiritilishi shart');
        return;
      }

      const method = editingServiceId ? 'PUT' : 'POST';
      const payload = editingServiceId
        ? { id: editingServiceId, ...serviceForm }
        : serviceForm;

      const res = await fetch('/api/finance/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        setServiceError(resData.error || 'Xizmatni saqlashda xatolik');
        return;
      }

      setIsServiceModalOpen(false);
      setEditingServiceId(null);
      fetchServices();
    } catch (err: any) {
      setServiceError(err.message || 'Xatolik yuz berdi');
    } finally {
      setServiceSaving(false);
    }
  };

  // Delete Service
  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham "${name}" xizmatini o'chirmoqchimisiz?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/finance/services?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchServices();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Xizmatni o\'chirishda xatolik');
      }
    } catch (err) {
      console.error('Delete service error:', err);
    }
  };

  // Copy service details for other roles to use
  const handleCopyService = (s: any) => {
    const text = `${s.name} — Narxi: ${Number(s.price).toLocaleString()} so'm (${s.billingType === 'OYLIK' ? 'oylik' : s.billingType === 'YILLIK' ? 'yillik' : 'bir martalik'})\nTavsif: ${s.description || 'Standart tarif'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BadgeDollarSign className="w-6 h-6 text-blue-600" />
            <span>Moliya & Tahlil Boshqaruvi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xizmatlar katalogi va tariflar narxnomasi, kassa tushumlari va moliyaviy nazorat
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchStats();
              fetchServices();
            }}
            disabled={refreshing || servicesLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || servicesLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Xizmatlar Katalogi & Narxnoma</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'services' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {services.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Kassa Tushumlari & To'lovlar</span>
          {data?.kpis?.paymentCount ? (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'payments' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {data.kpis.paymentCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: XIZMATLAR RO'YXATI VA TARIFLAR (SERVICES CATALOG)        */}
      {/* ============================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Role Access Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0">
                {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight">Kompaniya Xizmatlari & Narxnoma Boshqaruvi</h2>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      isAdmin
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {isAdmin ? '👑 Administrator (To\'liq Ruxsat)' : `👤 ${userRoleName || 'Foydalanuvchi'} (Foydalanish Rejimi)`}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isAdmin
                    ? 'Yangi xizmat turlarini yaratish, narxlarni belgilash va mavjud tariflarni tahrirlash huquqiga egasiz.'
                    : 'Barcha xizmatlar narxi va shartlari bilan tanishib, mijozlar bilan muzokaralar va buyurtmalarda bemalol foydalanishingiz mumkin (yangi xizmat yaratish faqat Administratorga yuklangan).'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isAdmin ? (
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Yangi Xizmat Yaratish</span>
                </button>
              ) : (
                <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xizmat yaratish faqat Admin uchun</span>
                </div>
              )}
            </div>
          </div>

          {/* Search and Category Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Xizmat nomi yoki tavsifi bo'yicha qidiruv..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Qidirish
              </button>
            </form>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedCategory(catKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {catInfo.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services List / Cards */}
          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200"></div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Xizmatlar topilmadi</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Qidiruv so'rovi bo'yicha hech qanday xizmat topilmadi yoki hali xizmatlar kiritilmagan.
              </p>
              {isAdmin && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Birinchi Xizmatni Yaratish</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => {
                const catInfo = CATEGORY_LABELS[service.category] || CATEGORY_LABELS.BOSHQA;
                const isCopied = copiedId === service.id;

                return (
                  <div
                    key={service.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges & Status */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catInfo.color}`}
                        >
                          {catInfo.label}
                        </span>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            service.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {service.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </div>

                      {/* Service Title */}
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                        {service.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {service.description || 'Standart xizmat va tarif rejasi'}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {/* Price & Billing */}
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Xizmat Narxi:</span>
                          <span className="text-lg font-mono font-black text-blue-700">
                            {Number(service.price).toLocaleString()} so'm
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                          {service.billingType === 'OYLIK'
                            ? 'Oylik'
                            : service.billingType === 'YILLIK'
                            ? 'Yillik'
                            : 'Bir martalik'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        {/* Copy / Use Button for all roles */}
                        <button
                          type="button"
                          onClick={() => handleCopyService(service)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Xizmat ma'lumotlarini nusxalash"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Nusxalandi!' : 'Foydalanish'}</span>
                        </button>

                        {/* Admin-only edit & delete */}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(service)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteService(service.id, service.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: KASSA TUSHUMLARI VA TO'LOVLAR (PAYMENTS & CASH CONTROL)  */}
      {/* ============================================================== */}
      {activeTab === 'payments' && (
        <>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200"></div>
                ))}
              </div>
              <div className="h-64 bg-white rounded-2xl border border-slate-200"></div>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Jami Tushum (Kassa & Bank)</span>
                  <span className="text-2xl font-mono font-extrabold text-emerald-600 block mt-1">
                    {(data.kpis?.totalRevenue || 0).toLocaleString()} so'm
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {data.kpis?.paymentCount || 0} ta muvaffaqiyatli tranzaksiya
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Shartnomalar Umumiy Qiymati</span>
                  <span className="text-2xl font-mono font-extrabold text-slate-900 block mt-1">
                    {(data.kpis?.totalOrderValue || 0).toLocaleString()} so'm
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">Barcha faol buyurtmalar hisobi</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold uppercase text-rose-500 block">Mijozlar Qarzdorligi (Kutilmoqda)</span>
                  <span className="text-2xl font-mono font-extrabold text-rose-600 block mt-1">
                    {(data.kpis?.totalOutstandingDebt || 0).toLocaleString()} so'm
                  </span>
                  <span className="text-xs text-rose-500 mt-1 block">Undirilishi lozim bo'lgan mablag'</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold uppercase text-blue-600 block">Mablag' Qoplash Darajasi</span>
                  <span className="text-2xl font-mono font-extrabold text-blue-600 block mt-1">
                    {data.kpis?.collectionRate || 0}%
                  </span>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, data.kpis?.collectionRate || 0)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Payment Methods Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  To'lov Tizimlari & Usullari Taqsimoti
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {data.methodBreakdown?.map((item: any) => {
                    const Icon = METHOD_ICONS[item.method] || CreditCard;
                    return (
                      <div
                        key={item.method}
                        className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800">{item.method}</span>
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-extrabold text-slate-900">
                            {(item.total || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.count} ta to'lov</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Double Column Grid: Recent Payments & Top Debtors */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Payments Table (2 cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        So'nggi Qabul Qilingan To'lovlar Reyestri
                      </h3>
                      <p className="text-[11px] text-slate-400">Kassa va bank hisob raqamlariga kelib tushgan to'lovlar</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-4">To'lov No</th>
                          <th className="py-2.5 px-4">Mijoz / STIR</th>
                          <th className="py-2.5 px-4">Usul</th>
                          <th className="py-2.5 px-4">Qabul qiluvchi</th>
                          <th className="py-2.5 px-4 text-right">Summa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.recentPayments?.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{p.customer?.companyName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">STIR: {p.customer?.inn}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  p.method === 'BALANSDAN_YECHILDI'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {p.method === 'BALANSDAN_YECHILDI' ? '🔻 Xizmat uchun yechildi' : p.method}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{p.receivedBy?.name || 'Kassir'}</td>
                            <td
                              className={`py-3 px-4 text-right font-mono font-bold ${
                                p.method === 'BALANSDAN_YECHILDI' ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {p.method === 'BALANSDAN_YECHILDI' ? '-' : '+'}
                              {(p.amount || 0).toLocaleString()} so'm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Debtors Card (1 col) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Eng Yirik Qarzdor Mijozlar (Top Debet)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tezkor to'lov talab qilinadigan subyektlar</p>
                  </div>

                  <div className="space-y-3">
                    {data.topDebtors?.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{c.companyName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            STIR: {c.inn} • {c.branch?.name || ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono font-extrabold text-rose-600">
                            {(c.debt || 0).toLocaleString()} so'm
                          </div>
                        </div>
                      </div>
                    ))}
                    {data.topDebtors?.length === 0 && (
                      <div className="text-center py-6 text-xs text-slate-400">
                        Qarzdor mijozlar mavjud emas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* ============================================================== */}
      {/* MODAL: YANGI XIZMAT YARATISH / TAHRIRLASH (ADMIN ONLY)         */}
      {/* ============================================================== */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingServiceId ? 'Xizmat Ma\'lumotlarini Tahrirlash' : 'Yangi Xizmat Yaratish'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Administrator tomonidan xizmat nomi va narxini kiritish
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 text-xs">
              {serviceError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{serviceError}</span>
                </div>
              )}

              {/* Xizmat Nomi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Xizmat Nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: OFD Yillik Abonent Integratsiyasi"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-semibold text-slate-900"
                />
              </div>

              {/* Xizmat Narxi va To'lov Davri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Xizmat Narxi (so'mda) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      placeholder="Masalan: 480000"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-mono font-bold text-blue-700"
                    />
                    <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-semibold pointer-events-none">
                      UZS
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    To'lov Davriyligi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={serviceForm.billingType}
                    onChange={(e) => setServiceForm({ ...serviceForm, billingType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="OYLIK">Oylik abonent</option>
                    <option value="BIR_MARTALIK">Bir martalik to'lov</option>
                    <option value="YILLIK">Yillik tarif</option>
                    <option value="SOATLIK">Soatlik ish haqi</option>
                  </select>
                </div>
              </div>

              {/* Kategoriya va Holat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Xizmat Kategoriyasi
                  </label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="ABONENT">Abonent To'lovi</option>
                    <option value="ORNATISH">Kassa O'rnatish</option>
                    <option value="DASTURIY">Dasturiy Ta'minot</option>
                    <option value="SERVIS">Texnik Servis & Ta'mirlash</option>
                    <option value="KONSULTATSIYA">Konsultatsiya & Skaner</option>
                    <option value="BOSHQA">Boshqa xizmatlar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Xizmat Holati
                  </label>
                  <select
                    value={serviceForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="true">Faol (Foydalanish mumkin)</option>
                    <option value="false">Nofaol (Vaqtincha to'xtatilgan)</option>
                  </select>
                </div>
              </div>

              {/* Qisqacha Tavsif */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Xizmat Tavsifi va Qamrovi
                </label>
                <textarea
                  rows={3}
                  placeholder="Xizmat nimalarni o'z ichiga oladi, mijozga qanday qulaylik beradi..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={serviceSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{serviceSaving ? 'Saqlanmoqda...' : (editingServiceId ? 'O\'zgarishlarni Saqlash' : 'Xizmatni Yaratish')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
