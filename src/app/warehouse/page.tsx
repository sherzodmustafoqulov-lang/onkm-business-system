'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  Package,
  Layers,
  Cpu,
  ArrowRightLeft,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Warehouse,
  TrendingUp,
  DollarSign,
  Building2,
  CheckCircle2,
  Clock,
  History,
  Eye,
  ShieldAlert,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  X,
  Boxes,
  Barcode,
  Truck,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import CreateProductModal from '@/components/warehouse/CreateProductModal';
import StockMovementModal from '@/components/warehouse/StockMovementModal';
import CreateSerialModal from '@/components/warehouse/CreateSerialModal';
import CreateFMModal from '@/components/warehouse/CreateFMModal';

interface StatsData {
  totalProducts: number;
  lowStockCount: number;
  totalStockUnits: number;
  totalValuePurchase: number;
  totalValueSelling: number;
  branchesStock: Array<{
    id: string;
    name: string;
    code: string;
    isMain: boolean;
    totalUnits: number;
    totalValuePurchase: number;
  }>;
  fmStats: {
    total: number;
    inStock: number;
    active: number;
    reserved: number;
    broken: number;
    byStatus: Record<string, number>;
  };
}

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState<'products' | 'serials' | 'fm' | 'movements' | 'branches' | 'inventory'>('products');
  
  // Data states
  const [stats, setStats] = useState<StatsData | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [serials, setSerials] = useState<any[]>([]);
  const [fiscalModules, setFiscalModules] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementInitialType, setMovementInitialType] = useState('KIRIM');
  const [movementInitialProductId, setMovementInitialProductId] = useState('');
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [isFMModalOpen, setIsFMModalOpen] = useState(false);

  // History detail modal state
  const [selectedItemHistory, setSelectedItemHistory] = useState<{
    title: string;
    serial: string;
    history: any[];
  } | null>(null);

  // Format currency
  const formatUZS = (val: number) => {
    return (val || 0).toLocaleString('uz-UZ') + " so'm";
  };

  // Fetch all warehouse data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, productsRes, serialsRes, fmRes, movementsRes] = await Promise.all([
        fetch('/api/warehouse/stats'),
        fetch('/api/warehouse/products'),
        fetch('/api/warehouse/serials'),
        fetch('/api/warehouse/fiscal-modules'),
        fetch('/api/warehouse/movements'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (productsRes.ok) {
        const pData = await productsRes.json();
        setProducts(pData.products || []);
        setCategories(pData.categories || []);
        setBranches(pData.branches || []);
      }
      if (serialsRes.ok) {
        const sData = await serialsRes.json();
        setSerials(sData.serials || []);
      }
      if (fmRes.ok) {
        const fmData = await fmRes.json();
        setFiscalModules(fmData.fiscalModules || []);
      }
      if (movementsRes.ok) {
        const mData = await movementsRes.json();
        setMovements(mData.movements || []);
      }
    } catch (err) {
      console.error('Ombor ma\'lumotlarini yuklashda xatolik:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.model && p.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = !selectedCategory || p.categoryId === selectedCategory;
      const matchLowStock = !onlyLowStock || p.isLowStock;

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [products, searchQuery, selectedCategory, onlyLowStock]);

  // Filtered Serials
  const filteredSerials = useMemo(() => {
    return serials.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer?.companyName && s.customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBranch = !selectedBranch || s.branchId === selectedBranch;
      const matchStatus = !statusFilter || s.status === statusFilter;

      return matchSearch && matchBranch && matchStatus;
    });
  }, [serials, searchQuery, selectedBranch, statusFilter]);

  // Filtered Fiscal Modules
  const filteredFiscalModules = useMemo(() => {
    return fiscalModules.filter((fm) => {
      const matchSearch =
        !searchQuery ||
        fm.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fm.kkmSerialNumber && fm.kkmSerialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (fm.customer?.companyName && fm.customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBranch = !selectedBranch || fm.branchId === selectedBranch;
      const matchStatus = !statusFilter || fm.status === statusFilter;

      return matchSearch && matchBranch && matchStatus;
    });
  }, [fiscalModules, searchQuery, selectedBranch, statusFilter]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch =
        !searchQuery ||
        m.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.docNumber && m.docNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.serialNumbers && m.serialNumbers.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = !statusFilter || m.movementType === statusFilter;
      const matchBranch = !selectedBranch || m.branchId === selectedBranch || m.targetBranchId === selectedBranch;

      return matchSearch && matchStatus && matchBranch;
    });
  }, [movements, searchQuery, statusFilter, selectedBranch]);

  // Open movement modal for specific product
  const handleOpenMovement = (type: string, productId: string = '') => {
    setMovementInitialType(type);
    setMovementInitialProductId(productId);
    setIsMovementModalOpen(true);
  };

  // Movement type label and badge styling
  const renderMovementBadge = (type: string) => {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      KIRIM: { label: 'Kirim', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      CHIQIM: { label: 'Chiqim', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
      TRANSFER: { label: "Ko'chirish", bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
      REZERV: { label: 'Rezerv', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      UNRESERVE: { label: 'Rezervdan', bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-700' },
      MIJOZGA_BERISH: { label: 'Mijozga berish', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
      QAYTARISH: { label: 'Qaytarish', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
      INVENTARIZATSIYA: { label: 'Inventarizatsiya', bg: 'bg-slate-100 border-slate-300', text: 'text-slate-800' },
    };
    const c = config[type] || { label: type, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  // Serial status badge
  const renderSerialBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      OMBORDA: { label: 'Omborda', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      REZERV: { label: 'Rezervda', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      SOTILGAN: { label: 'Mijozda (Sotilgan)', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
      TAMIRDA: { label: "Ta'mirda", bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
      NOSOZ: { label: 'Nosoz / Yaroqsiz', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
    };
    const c = config[status] || { label: status, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  // FM status badge
  const renderFMBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      OMBORDA: { label: 'Omborda yangi', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      KKMGA_ORMATILGAN: { label: "KKMga o'rnatilgan", bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
      FAOL: { label: 'OFDda Faol', bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
      BLOKLANGAN: { label: 'Bloklangan', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      NOSOZ: { label: 'Nosoz', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
      MUDDATI_OTGAN: { label: "Muddati o'tgan", bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700' },
    };
    const c = config[status] || { label: status, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <AppLayout>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ombor & Mahsulotlar Boshqaruvi</h1>
              <p className="text-xs text-slate-500">
                ONKM, POS terminallar, fiskal modullar, seriya raqamlari va omborlararo harakatlar
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => handleOpenMovement('KIRIM')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Harakat (Kirim/Chiqim/Transfer)</span>
          </button>

          <button
            onClick={() => setIsSerialModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Cpu className="w-4 h-4" />
            <span>+ Seriya Kiritish</span>
          </button>

          <button
            onClick={() => setIsFMModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Layers className="w-4 h-4" />
            <span>+ FM Kiritish</span>
          </button>

          <button
            onClick={() => setIsProductModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi Mahsulot</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards as requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Card 1: Jami Mahsulot & Qoldiq */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Jami Mahsulot</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats?.totalProducts ?? 0} <span className="text-xs font-medium text-slate-500">tur</span></div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{stats?.totalStockUnits ?? 0} dona</span> umumiy qoldiq
          </div>
        </div>

        {/* Card 2: Kam Qolgan Mahsulotlar */}
        <div
          onClick={() => {
            setActiveTab('products');
            setOnlyLowStock(true);
          }}
          className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
            stats?.lowStockCount && stats.lowStockCount > 0
              ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300 hover:bg-rose-50'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kam Qolgan (Kritik)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats?.lowStockCount ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold ${stats?.lowStockCount ? 'text-rose-600' : 'text-slate-900'}`}>
            {stats?.lowStockCount ?? 0} <span className="text-xs font-medium text-slate-500">tovar</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-rose-600 font-semibold underline">Filtrlash uchun bosing</span>
          </div>
        </div>

        {/* Card 3: Ombordagi Tovar Qiymati */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ombordagi Qiymat</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 truncate" title={formatUZS(stats?.totalValuePurchase || 0)}>
            {formatUZS(stats?.totalValuePurchase || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate" title={`Sotuv bahosi: ${formatUZS(stats?.totalValueSelling || 0)}`}>
            Sotuvda: <span className="font-semibold text-blue-600">{formatUZS(stats?.totalValueSelling || 0)}</span>
          </div>
        </div>

        {/* Card 4: Filiallar Bo'yicha Qoldiq */}
        <div
          onClick={() => setActiveTab('branches')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Filiallar Qoldig'i</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{branches.length} <span className="text-xs font-medium text-slate-500">ombor</span></div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            Asosiy: <span className="font-semibold text-teal-600">{branches.find(b => b.isMain)?.name || 'Bosh ombor'}</span>
          </div>
        </div>

        {/* Card 5: FM Qoldig'i */}
        <div
          onClick={() => setActiveTab('fm')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">FM Qoldig'i</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-700">{stats?.fmStats?.inStock ?? 0} <span className="text-xs font-medium text-slate-500">omborda</span></div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-green-600 font-semibold">{stats?.fmStats?.active ?? 0} faol</span>
            <span>•</span>
            <span className="text-slate-500">{stats?.fmStats?.total ?? 0} jami</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="border-b border-slate-200 px-4 flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('products');
              setStatusFilter('');
            }}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Mahsulotlar & Qoldiq</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('serials');
              setStatusFilter('');
            }}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'serials'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Seriya Raqamlari</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
              {serials.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('fm');
              setStatusFilter('');
            }}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'fm'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fiskal Modullar (FM)</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-700 font-bold">
              {fiscalModules.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('movements');
              setStatusFilter('');
            }}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'movements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Tovar Harakatlari (Audit)</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
              {movements.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('branches');
              setStatusFilter('');
            }}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'branches'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Filiallar Kesimida Qoldiq</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('inventory');
              setStatusFilter('');
            }}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Inventarizatsiya</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center flex-1 gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'products'
                    ? "Mahsulot nomi, SKU, model yoki ishlab chiqaruvchi bo'yicha qidiruv..."
                    : activeTab === 'serials'
                    ? "Seriya raqami, model yoki mijoz nomi bo'yicha..."
                    : activeTab === 'fm'
                    ? "FM seriya, KKM seriya yoki mijoz..."
                    : "Hujjat raqami, tovar yoki seriya raqami..."
                }
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category filter for products */}
            {activeTab === 'products' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">Barcha kategoriyalar</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* Branch filter */}
            {(activeTab === 'serials' || activeTab === 'fm' || activeTab === 'movements') && (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">Barcha filiallar</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isMain ? '(Bosh ombor)' : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Status filter for Serials, FM, or Movements */}
            {activeTab === 'serials' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">Barcha holatlar</option>
                <option value="OMBORDA">Omborda</option>
                <option value="REZERV">Rezervda</option>
                <option value="SOTILGAN">Mijozda (Sotilgan)</option>
                <option value="TAMIRDA">Ta'mirda</option>
                <option value="NOSOZ">Nosoz / Yaroqsiz</option>
              </select>
            )}

            {activeTab === 'fm' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">Barcha holatlar</option>
                <option value="OMBORDA">Omborda yangi</option>
                <option value="KKMGA_ORMATILGAN">KKMga o'rnatilgan</option>
                <option value="FAOL">OFDda Faol</option>
                <option value="BLOKLANGAN">Bloklangan</option>
                <option value="NOSOZ">Nosoz</option>
              </select>
            )}

            {activeTab === 'movements' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">Barcha harakat turlari</option>
                <option value="KIRIM">Kirim</option>
                <option value="CHIQIM">Chiqim</option>
                <option value="TRANSFER">Ko'chirish (Transfer)</option>
                <option value="REZERV">Rezerv qilish</option>
                <option value="UNRESERVE">Rezervdan chiqarish</option>
                <option value="MIJOZGA_BERISH">Mijozga berish</option>
                <option value="QAYTARISH">Qaytarish</option>
                <option value="INVENTARIZATSIYA">Inventarizatsiya</option>
              </select>
            )}
          </div>

          {/* Quick low stock toggle for products */}
          {activeTab === 'products' && (
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className={onlyLowStock ? 'text-rose-600 font-bold' : ''}>Faqat kam qolgan tovarlar</span>
            </label>
          )}
        </div>

        {/* TAB 1: Mahsulotlar & Qoldiqlar */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mahsulot & SKU</th>
                  <th className="py-3 px-4">Kategoriya</th>
                  <th className="py-3 px-4">Model & Ishlab chiqaruvchi</th>
                  <th className="py-3 px-4 text-right">Xarid Narxi</th>
                  <th className="py-3 px-4 text-right">Sotuv Narxi</th>
                  <th className="py-3 px-4 text-center">Seriyali?</th>
                  <th className="py-3 px-4 text-center">Min. Qoldiq</th>
                  <th className="py-3 px-4 text-center">Umumiy Qoldiq</th>
                  <th className="py-3 px-4 text-center">Holat</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-400">
                      Hech qanday mahsulot topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">SKU: {p.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                          {p.category?.name || 'Umumiy'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{p.model || '-'}</div>
                        <div className="text-[11px] text-slate-500">{p.manufacturer || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatUZS(p.purchasePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatUZS(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.hasSerial ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold border border-indigo-200">
                            HA ({p.warrantyMonths || 12} oy)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Yo'q</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {p.minStock} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-slate-900 text-sm">
                          {p.totalStock} <span className="text-xs font-normal text-slate-500">{p.unit}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Kam qolgan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Yetarli
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenMovement('KIRIM', p.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded text-[11px] border border-emerald-200 transition-colors"
                          >
                            + Kirim
                          </button>
                          <button
                            onClick={() => handleOpenMovement('TRANSFER', p.id)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded text-[11px] border border-blue-200 transition-colors"
                          >
                            Transfer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Seriya Raqamlari */}
        {activeTab === 'serials' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Seriya Raqami</th>
                  <th className="py-3 px-4">Mahsulot & Model</th>
                  <th className="py-3 px-4">Joylashuv (Filial)</th>
                  <th className="py-3 px-4">Mijoz / Biriktirilgan KKM</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Kafolat Muddati</th>
                  <th className="py-3 px-4 text-right">Tarix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSerials.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Hech qanday seriya raqami topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredSerials.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {s.serialNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{s.product?.name}</div>
                        <div className="text-[11px] text-slate-500">{s.product?.model || s.product?.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.branch?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {s.customer ? (
                          <div>
                            <div className="font-medium text-slate-900">{s.customer.companyName}</div>
                            <div className="text-[11px] text-slate-500">{s.customer.phone || '-'}</div>
                          </div>
                        ) : s.kkmNumber ? (
                          <div className="font-mono text-xs text-blue-700">KKM: {s.kkmNumber}</div>
                        ) : (
                          <span className="text-slate-400 italic">Biriktirilmagan</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderSerialBadge(s.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {s.warrantyEnd ? new Date(s.warrantyEnd).toLocaleDateString('uz-UZ') : `${s.warrantyMonths || 12} oy`}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setSelectedItemHistory({
                              title: `${s.product?.name} seriya harakat tarixi`,
                              serial: s.serialNumber,
                              history: s.history || [],
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded border border-indigo-200 text-[11px] font-semibold transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Tarix ({s.history?.length || 0})</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: Fiskal Modullar (FM) */}
        {activeTab === 'fm' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">FM Seriya Raqami</th>
                  <th className="py-3 px-4">Biriktirilgan KKM</th>
                  <th className="py-3 px-4">Filial / Ombor</th>
                  <th className="py-3 px-4">Mijoz (Tashkilot)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Ro'yxatdan o'tgan</th>
                  <th className="py-3 px-4">Kafolat Tugashi</th>
                  <th className="py-3 px-4 text-right">Harakat Tarixi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiscalModules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Hech qanday fiskal modul topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredFiscalModules.map((fm) => (
                    <tr key={fm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
                          {fm.serialNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {fm.kkmSerialNumber ? (
                          <span className="font-mono font-medium text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                            {fm.kkmSerialNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">O'rnatilmagan</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{fm.branch?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {fm.customer ? (
                          <div>
                            <div className="font-medium text-slate-900">{fm.customer.companyName}</div>
                            <div className="text-[11px] text-slate-500">{fm.customer.phone || '-'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Mijozsiz</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderFMBadge(fm.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {fm.registeredAt ? new Date(fm.registeredAt).toLocaleDateString('uz-UZ') : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {fm.warrantyEnd ? new Date(fm.warrantyEnd).toLocaleDateString('uz-UZ') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setSelectedItemHistory({
                              title: `FM ${fm.serialNumber} harakat va ro'yxat tarixi`,
                              serial: fm.serialNumber,
                              history: fm.history || [],
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded border border-purple-200 text-[11px] font-semibold transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Tarix ({fm.history?.length || 0})</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: Tovar Harakatlari (Audit Log) */}
        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Sana & Vaqt</th>
                  <th className="py-3 px-4">Harakat Turi</th>
                  <th className="py-3 px-4">Hujjat №</th>
                  <th className="py-3 px-4">Mahsulot</th>
                  <th className="py-3 px-4 text-center">Miqdor</th>
                  <th className="py-3 px-4">Qayerdan / Qayerga</th>
                  <th className="py-3 px-4">Mas'ul Xodim</th>
                  <th className="py-3 px-4">Sabab / Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Hech qanday ombor harakati yozuvi topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {new Date(m.createdAt).toLocaleDateString('uz-UZ')}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(m.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {renderMovementBadge(m.movementType)}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {m.docNumber || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.product?.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">SKU: {m.product?.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-900 text-sm">
                          {m.movementType === 'CHIQIM' || m.movementType === 'REZERV' ? `-${m.quantity}` : `+${m.quantity}`}
                        </span>{' '}
                        <span className="text-[11px] text-slate-500">{m.product?.unit || 'dona'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{m.branch?.name}</div>
                        {m.targetBranch && (
                          <div className="text-[11px] text-blue-600 flex items-center gap-1 mt-0.5">
                            <ChevronRight className="w-3 h-3" />
                            <span>{m.targetBranch.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {m.user?.name || m.user?.username || 'Tizim'}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-500" title={m.reason || ''}>
                        {m.reason || '-'}
                        {m.serialNumbers && (
                          <div className="text-[10px] font-mono text-indigo-600 truncate mt-0.5">
                            SN: {m.serialNumbers}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: Filiallar Kesimida Qoldiq Matrix */}
        {activeTab === 'branches' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 sticky left-0 bg-slate-50 z-10 shadow-sm">Mahsulot Nomi</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Jami Qoldiq</th>
                  {branches.map((b) => (
                    <th key={b.id} className="py-3 px-4 text-center">
                      <div>{b.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal lowercase">
                        {b.isMain ? '(Bosh ombor)' : b.code}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 sticky left-0 bg-white z-10">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                        {p.totalStock} {p.unit}
                      </span>
                    </td>
                    {branches.map((b) => {
                      const branchStock = p.stocks?.find((s: any) => s.branchId === b.id);
                      const qty = branchStock?.quantity || 0;
                      return (
                        <td key={b.id} className="py-3 px-4 text-center">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-xs ${
                              qty === 0
                                ? 'text-slate-300'
                                : qty < 3
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'text-slate-800'
                            }`}
                          >
                            {qty}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenMovement('TRANSFER', p.id)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded text-[11px] border border-blue-200 transition-colors"
                      >
                        Taqsimlash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: Inventarizatsiya & Taftish */}
        {activeTab === 'inventory' && (
          <div className="p-6">
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Ombor Inventarizatsiyasi va Audit Taftishi</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Ushbu bo'limda haqiqiy jismoniy qoldiqni tizimdagi qoldiq bilan taqqoslash va nomutanosibliklarni
                  (kamomad yoki ortiqcha tovar) avtomatik to'g'rilash harakati amalga oshiriladi. Har bir o'zgarish
                  bosh hisobchi va admin audit logiga qat'iy yoziladi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase">So'nggi Inventarizatsiya</div>
                <div className="text-lg font-bold text-slate-900 mt-1">2026-09-20</div>
                <div className="text-xs text-emerald-600 mt-0.5">Toshkent Bosh Omborida o'tkazilgan</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase">Taftish Qamrovi</div>
                <div className="text-lg font-bold text-slate-900 mt-1">100% (20 ta tovar turi)</div>
                <div className="text-xs text-slate-500 mt-0.5">Barcha 6 ta regional filiallar</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase">Harakat Kiritish</div>
                <button
                  onClick={() => handleOpenMovement('INVENTARIZATSIYA')}
                  className="mt-2 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  + Yangi Taftish Hujjatini Kiritish
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
                Inventarizatsiya bo'yicha so'nggi harakatlar
              </div>
              <div className="divide-y divide-slate-100">
                {movements
                  .filter((m) => m.movementType === 'INVENTARIZATSIYA')
                  .slice(0, 5)
                  .map((m) => (
                    <div key={m.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-900">{m.product?.name}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Filial: <span className="font-medium text-slate-700">{m.branch?.name}</span> • Hujjat: {m.docNumber || 'INV-001'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{m.quantity} {m.product?.unit || 'dona'}</div>
                        <div className="text-[11px] text-slate-500">{new Date(m.createdAt).toLocaleDateString('uz-UZ')}</div>
                      </div>
                    </div>
                  ))}
                {movements.filter((m) => m.movementType === 'INVENTARIZATSIYA').length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Inventarizatsiya bo'yicha harakatlar hali kiritilmagan. Yuqoridagi tugma orqali boshlang.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History Inspection Modal */}
      {selectedItemHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedItemHistory.title}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Seriya: {selectedItemHistory.serial}</p>
              </div>
              <button
                onClick={() => setSelectedItemHistory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 max-h-[60vh] overflow-y-auto space-y-4">
              {selectedItemHistory.history.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Ushbu qurilma bo'yicha tarixiy o'zgarishlar mavjud emas
                </div>
              ) : (
                selectedItemHistory.history.map((h, i) => (
                  <div key={h.id || i} className="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-transparent last:pb-0">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{h.action}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(h.createdAt).toLocaleString('uz-UZ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Holat: <span className="font-semibold text-slate-800">{h.fromStatus || 'BOSHLANGICH'}</span> →{' '}
                      <span className="font-semibold text-emerald-600">{h.toStatus}</span>
                    </div>
                    {h.notes && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                        {h.notes}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1">
                      Amalga oshirdi: {h.user?.name || 'Tizim xodimi'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedItemHistory(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={() => {
          setIsProductModalOpen(false);
          fetchData();
        }}
        categories={categories}
        branches={branches}
      />

      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={() => {
          setIsMovementModalOpen(false);
          fetchData();
        }}
        products={products}
        branches={branches}
        defaultType={movementInitialType}
        defaultProductId={movementInitialProductId}
      />

      <CreateSerialModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={() => {
          setIsSerialModalOpen(false);
          fetchData();
        }}
        products={products}
        branches={branches}
      />

      <CreateFMModal
        isOpen={isFMModalOpen}
        onClose={() => setIsFMModalOpen(false)}
        onSuccess={() => {
          setIsFMModalOpen(false);
          fetchData();
        }}
        branches={branches}
      />
    </AppLayout>
  );
}
