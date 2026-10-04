'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  Smartphone,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  DollarSign,
  TrendingUp,
  Cpu,
  Layers,
  Building2,
  Bot,
  Shield,
  Sliders,
  AlertCircle,
  HelpCircle,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface DeviceModel {
  id: string;
  modelName: string;
  deviceType: string;
  manufacturer: string | null;
  monthlyFee: number;
  yearlyFee: number | null;
  billingCycle: string;
  gracePeriodDays: number;
  description: string | null;
  isActive: boolean;
  activeDevicesCount?: number;
  projectedMonthlyRevenue?: number;
}

interface Stats {
  totalModels: number;
  activeModels: number;
  totalActiveDevices: number;
  totalProjectedMRR: number;
  averageFee: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'device_models' | 'company' | 'telegram' | 'security'>('device_models');
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<DeviceModel | null>(null);
  const [formData, setFormData] = useState({
    modelName: '',
    deviceType: 'ONKM',
    manufacturer: '',
    monthlyFee: '',
    yearlyFee: '',
    billingCycle: 'MONTHLY',
    gracePeriodDays: 5,
    description: '',
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Inline Fee Edit State
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineFeeValue, setInlineFeeValue] = useState<string>('');
  const [inlineSaving, setInlineSaving] = useState(false);

  // Fetch device models & stats
  const fetchDeviceModels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/device-models');
      const data = await res.json();
      if (data.success) {
        setModels(data.models || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load device models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceModels();
  }, []);

  const openCreateModal = () => {
    setEditingModel(null);
    setFormData({
      modelName: '',
      deviceType: 'ONKM',
      manufacturer: '',
      monthlyFee: '70000',
      yearlyFee: '700000',
      billingCycle: 'MONTHLY',
      gracePeriodDays: 5,
      description: '',
      isActive: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (model: DeviceModel) => {
    setEditingModel(model);
    setFormData({
      modelName: model.modelName,
      deviceType: model.deviceType,
      manufacturer: model.manufacturer || '',
      monthlyFee: model.monthlyFee.toString(),
      yearlyFee: model.yearlyFee ? model.yearlyFee.toString() : '',
      billingCycle: model.billingCycle || 'MONTHLY',
      gracePeriodDays: model.gracePeriodDays || 5,
      description: model.description || '',
      isActive: model.isActive,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelName.trim()) {
      setFormError('Model nomi kiritilishi shart');
      return;
    }
    const fee = parseFloat(formData.monthlyFee);
    if (isNaN(fee) || fee < 0) {
      setFormError('Oylik abonent to\'lovi to\'g\'ri kiritilishi shart');
      return;
    }

    try {
      setIsSaving(true);
      setFormError('');

      const url = editingModel
        ? `/api/settings/device-models/${editingModel.id}`
        : '/api/settings/device-models';
      const method = editingModel ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: formData.modelName,
          deviceType: formData.deviceType,
          manufacturer: formData.manufacturer,
          monthlyFee: fee,
          yearlyFee: formData.yearlyFee ? parseFloat(formData.yearlyFee) : null,
          billingCycle: formData.billingCycle,
          gracePeriodDays: formData.gracePeriodDays,
          description: formData.description,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Xatolik yuz berdi');
        return;
      }

      setIsModalOpen(false);
      fetchDeviceModels();
    } catch (err: any) {
      setFormError(err.message || 'Server bilan bog\'lanishda xatolik');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModel = async (id: string, name: string) => {
    if (!confirm(`"${name}" modelini va uning abonent to'lovi sozlamasini o'chirishga ishonchingiz komilmi?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/settings/device-models/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDeviceModels();
      } else {
        const data = await res.json();
        alert(data.error || 'O\'chirishda xatolik yuz berdi');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleToggleActive = async (model: DeviceModel) => {
    try {
      const res = await fetch(`/api/settings/device-models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !model.isActive }),
      });
      if (res.ok) {
        setModels((prev) =>
          prev.map((m) => (m.id === model.id ? { ...m, isActive: !m.isActive } : m))
        );
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  // Start Inline Edit
  const startInlineEdit = (model: DeviceModel) => {
    setInlineEditId(model.id);
    setInlineFeeValue(model.monthlyFee.toString());
  };

  // Save Inline Edit
  const saveInlineEdit = async (id: string) => {
    const fee = parseFloat(inlineFeeValue);
    if (isNaN(fee) || fee < 0) {
      alert('Iltimos, to\'g\'ri summa kiriting');
      return;
    }

    try {
      setInlineSaving(true);
      const res = await fetch(`/api/settings/device-models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyFee: fee }),
      });

      if (res.ok) {
        setInlineEditId(null);
        fetchDeviceModels();
      } else {
        const data = await res.json();
        alert(data.error || 'Yangilashda xatolik');
      }
    } catch (err) {
      console.error('Inline fee update error:', err);
    } finally {
      setInlineSaving(false);
    }
  };

  // Filtered models
  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.modelName.toLowerCase().includes(search.toLowerCase()) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(search.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || m.deviceType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getDeviceTypeBadge = (type: string) => {
    switch (type) {
      case 'ONKM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">🖥 ONKM Kassa</span>;
      case 'POS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">💻 POS Monoblok</span>;
      case 'FISKAL_MODUL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">🧩 Fiskal Modul (FM)</span>;
      case 'TERMINAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">💳 Bank Terminali</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">📦 {type}</span>;
    }
  };

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tizim Sozlamalari & Tariflar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Qurilmalar modeli, mijozlardan olinadigan oylik abonent to'lovlari, kompaniya parametrlari va integratsiyalar
          </p>
        </div>

        {activeTab === 'device_models' && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/30 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Qurilma Modeli Qo'shish</span>
          </button>
        )}
      </div>

      {/* Main Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('device_models')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'device_models'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Qurilmalar Modellari & Abonent To'lovlari</span>
          {stats && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'device_models' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {stats.totalModels}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'company'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Kompaniya Rekvizitlari</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'telegram'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Telegram Bot & Xabarnomalar</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Xavfsizlik & Zaxira</span>
        </button>
      </div>

      {/* TAB 1: DEVICE MODELS & SUBSCRIPTION FEES */}
      {activeTab === 'device_models' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jami Qurilma Modellari</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {stats?.totalModels || 0} <span className="text-xs font-medium text-slate-400">ta tur</span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{stats?.activeModels || 0} ta model faol xizmatda</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">O'rtacha Oylik To'lov</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {new Intl.NumberFormat('uz-UZ').format(stats?.averageFee || 0)}{' '}
                <span className="text-xs font-semibold text-slate-500">so'm/oy</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Har bir faol qurilma uchun o'rtacha</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faol Biriktirilgan</span>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {stats?.totalActiveDevices || 0} <span className="text-xs font-medium text-slate-400">ta qurilma</span>
              </div>
              <div className="text-[11px] text-purple-600 font-semibold mt-1">Mijozlar foydalanmoqda</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kutilayotgan Oylik Tushum</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-blue-600">
                {new Intl.NumberFormat('uz-UZ').format(stats?.totalProjectedMRR || 0)}{' '}
                <span className="text-xs font-semibold text-slate-500">so'm</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Oylik abonent tushumlari (MRR)</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Model nomi, ishlab chiqaruvchi bo'yicha qidiruv..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 whitespace-nowrap">Turi:</span>
              {[
                { id: 'ALL', label: 'Barchasi' },
                { id: 'ONKM', label: 'ONKM' },
                { id: 'POS', label: 'POS' },
                { id: 'FISKAL_MODUL', label: 'Fiskal Modul' },
                { id: 'TERMINAL', label: 'Terminal' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setTypeFilter(btn.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    typeFilter === btn.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Device Models Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Qurilmalar va Oylik Abonent To'lovlari Jadvali</h3>
                <p className="text-xs text-slate-500">
                  Har bir qurilma modeli uchun mijoz balansidan yechiladigan oylik abonent to'lovi summalari
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {filteredModels.length} ta model ko'rsatilmoqda
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Qurilmalar modellari yuklanmoqda...
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-700">Qurilma modellari topilmadi</div>
                <p className="text-[11px] text-slate-400 mt-1">Yangi model qo'shish uchun yuqoridagi tugmani bosing</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Model & Ishlab Chiqaruvchi</th>
                      <th className="py-3 px-4">Qurilma Turi</th>
                      <th className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span>Oylik Abonent To'lovi</span>
                          <span className="text-[10px] text-blue-600 font-normal">(so'm / oy)</span>
                        </div>
                      </th>
                      <th className="py-3 px-4">Yillik To'lov</th>
                      <th className="py-3 px-4 text-center">Biriktirilgan Qurilmalar</th>
                      <th className="py-3 px-4 text-right">Kutilayotgan Tushum</th>
                      <th className="py-3 px-4 text-center">Holati</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredModels.map((m) => {
                      const isEditingInline = inlineEditId === m.id;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Model & Manufacturer */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                🖥
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 text-xs">{m.modelName}</div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {m.manufacturer || 'Ko\'rsatilmagan'}
                                </div>
                              </div>
                            </div>
                            {m.description && (
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 max-w-xs">
                                {m.description}
                              </p>
                            )}
                          </td>

                          {/* Device Type */}
                          <td className="py-3.5 px-4">{getDeviceTypeBadge(m.deviceType)}</td>

                          {/* Monthly Fee with Quick Inline Edit */}
                          <td className="py-3.5 px-4">
                            {isEditingInline ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={inlineFeeValue}
                                  onChange={(e) => setInlineFeeValue(e.target.value)}
                                  className="w-28 px-2 py-1 text-xs font-bold border border-blue-400 rounded-md focus:outline-none bg-blue-50/50"
                                  autoFocus
                                  disabled={inlineSaving}
                                />
                                <button
                                  onClick={() => saveInlineEdit(m.id)}
                                  disabled={inlineSaving}
                                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                                  title="Saqlash"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setInlineEditId(null)}
                                  disabled={inlineSaving}
                                  className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                                  title="Bekor qilish"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="group flex items-center gap-1.5">
                                <span className="font-extrabold text-emerald-600 text-xs bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                                  {new Intl.NumberFormat('uz-UZ').format(m.monthlyFee)} so'm
                                </span>
                                <button
                                  onClick={() => startInlineEdit(m)}
                                  title="Tezkor tahrirlash"
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Yearly Fee */}
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                            {m.yearlyFee ? (
                              <div>
                                <span>{new Intl.NumberFormat('uz-UZ').format(m.yearlyFee)} so'm</span>
                                <span className="text-[10px] text-emerald-600 block">chegirma bilan</span>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* Active Devices Count */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs">
                              {m.activeDevicesCount || 0} ta
                            </span>
                          </td>

                          {/* Projected Monthly Revenue */}
                          <td className="py-3.5 px-4 text-right font-bold text-blue-600">
                            {new Intl.NumberFormat('uz-UZ').format(m.projectedMonthlyRevenue || 0)} so'm
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleActive(m)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                                m.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {m.isActive ? 'Faol' : 'Nofaol'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(m)}
                                title="Batafsil tahrirlash"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteModel(m.id, m.modelName)}
                                title="O'chirish"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY REQUISITES */}
      {activeTab === 'company' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm max-w-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Kompaniya Rekvizitlari</h3>
          <p className="text-xs text-slate-500">Mijoz shartnomalari va hisob-fakturalarda aks etuvchi korxona rekvizitlari</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Korxona Nomi</label>
              <input
                type="text"
                defaultValue="ONKM BUSINESS SYSTEM MCHJ"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">STIR (INN)</label>
              <input
                type="text"
                defaultValue="309123456"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Xizmat Ko'rsatuvchi Bank</label>
              <input
                type="text"
                defaultValue="ATIB Ipoteka Bank Chilonzor filiali"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Hisob Raqam (H/R)</label>
              <input
                type="text"
                defaultValue="20208000900123456001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">MFO Kodi</label>
              <input
                type="text"
                defaultValue="00450"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Telefon</label>
              <input
                type="text"
                defaultValue="+998 71 200-00-00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={() => alert('Kompaniya rekvizitlari muvaffaqiyatli saqlandi!')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              O'zgarishlarni Saqlash
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: TELEGRAM BOT */}
      {activeTab === 'telegram' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm max-w-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Telegram Bot & Bildirishnomalar Sozlamasi</h3>
          <p className="text-xs text-slate-500">Mijozlarga oylik abonent to'lovi, qarzdorlik va kassa xabarlarini yuborish</p>

          <div className="space-y-3 text-xs pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Telegram Bot Token</label>
              <input
                type="text"
                defaultValue="7123456789:AAHxxxxx_xxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Kompaniya Kanal / Admin Guruhi ID</label>
              <input
                type="text"
                defaultValue="-1001987654321"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="autoNotifyDebt" defaultChecked className="rounded text-blue-600" />
              <label htmlFor="autoNotifyDebt" className="text-xs font-semibold text-slate-700">
                Abonent to'lovi kechikkan mijozlarga avtomatik eslatma yuborish
              </label>
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={() => alert('Telegram bot parametrlari saqlandi!')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Botni Saqlash & Tekshirish
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & BACKUP */}
      {activeTab === 'security' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm max-w-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Xavfsizlik & Zaxira Nusxalari</h3>
          <p className="text-xs text-slate-500">Tizim seanslari, ma'lumotlar bazasi va audit nazorati</p>

          <div className="space-y-3 text-xs pt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Avtomatik Kunlik Zaxira (Backup)</div>
                <div className="text-[11px] text-slate-400">Har kecha soat 03:00 da SQLite / PostgreSQL zaxiralanadi</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Faol
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Foydalanuvchi Seansi Muddati</div>
                <div className="text-[11px] text-slate-400">Harakat bo'lmaganda 12 soatdan so'ng avtomatik chiqish</div>
              </div>
              <span className="font-mono font-semibold text-slate-700">12 soat</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT DEVICE MODEL & MONTHLY FEE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingModel ? 'Qurilma Modelini Tahrirlash' : 'Yangi Qurilma Modeli & Abonent To\'lovi'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Mijozlardan olinadigan oylik to'lov summasini kiriting</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModel} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Model Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Model Nomi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: PAX A930"
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Qurilma Turi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="ONKM">🖥 ONKM (Online Kassa)</option>
                    <option value="POS">💻 POS Monoblok Tizim</option>
                    <option value="FISKAL_MODUL">🧩 Fiskal Modul (FM)</option>
                    <option value="TERMINAL">💳 Bank To'lov Terminali</option>
                    <option value="PRINTER">🖨 Chek Printer</option>
                    <option value="BOSHQA">📦 Boshqa Qurilma</option>
                  </select>
                </div>
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ishlab Chiqaruvchi / Brend
                </label>
                <input
                  type="text"
                  placeholder="Masalan: PAX Technology, Telpo, Sunmi, PosBank"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Monthly Fee & Yearly Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div>
                  <label className="block text-[11px] font-bold text-blue-900 mb-1">
                    Oylik Abonent To'lovi (so'm) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      placeholder="Masalan: 70000"
                      value={formData.monthlyFee}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseFloat(val) || 0;
                        setFormData({
                          ...formData,
                          monthlyFee: val,
                          yearlyFee: num > 0 ? (num * 10).toString() : '',
                        });
                      }}
                      className="w-full pl-3 pr-12 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold text-blue-700 text-sm"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      so'm/oy
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Mijoz balansidan har oy yechiladi</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Yillik To'lov (chegirmali)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Masalan: 700000"
                      value={formData.yearlyFee}
                      onChange={(e) => setFormData({ ...formData, yearlyFee: e.target.value })}
                      className="w-full pl-3 pr-12 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      so'm/yil
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                    Avtomatik: 10 oylik narxda
                  </span>
                </div>
              </div>

              {/* Grace Period & Active status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Imtiyozli Muddat (Kunlar)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.gracePeriodDays}
                    onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Qarz bo'lganda bloklashdan oldin</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Model Holati
                  </label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="modelIsActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                    <label htmlFor="modelIsActive" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Tarif faol va xizmatga ochiq
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Abonent To'loviga Kiritilgan Xizmatlar / Izoh
                </label>
                <textarea
                  rows={2}
                  placeholder="Masalan: OFD uzatish, texnik qo'llab-quvvatlash, kassa dasturi yangilanishi va ehtiyot qismlar kafolati"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
