'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import CreateOrderModal from '@/components/sales/CreateOrderModal';
import PaymentModal from '@/components/sales/PaymentModal';
import OrderDetailDrawer from '@/components/sales/OrderDetailDrawer';
import BitrixKanbanBoard from '@/components/sales/BitrixKanbanBoard';
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Wrench,
  AlertCircle,
  CreditCard,
  Building2,
  Package,
  Layers,
  LayoutGrid,
  List,
  Eye,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const ORDER_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  YANGI: { label: 'Yangi', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  TASDIQLANGAN: { label: 'Tasdiqlangan', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  TOLOV_KUTILMOQDA: { label: 'To\'lov kutilmoqda', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  QISMAN_TOLANGAN: { label: 'Qisman to\'langan', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  TOLANGAN: { label: 'To\'langan', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REZERV: { label: 'Rezerv', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  YETKAZILMOQDA: { label: 'Yetkazilmoqda', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  ORNATILMOQDA: { label: 'O\'rnatilmoqda', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  YAKUNLANDI: { label: 'Yakunlandi', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  BEKOR_QILINDI: { label: 'Bekor qilindi', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function SalesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pipelineFilter, setPipelineFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [branches, setBranches] = useState<any[]>([]);

  // View mode: 'pipeline' (Bitrix24 Kanban) or 'table'
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('pipeline');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);

  // Load branches
  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        if (d.branches) setBranches(d.branches);
      })
      .catch((e) => console.error(e));
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (pipelineFilter !== 'ALL') params.set('pipelineStage', pipelineFilter);
      if (branchFilter !== 'ALL') params.set('branchId', branchFilter);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        if (data.managers) setManagers(data.managers);
        setKpis(data.kpis || null);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, pipelineFilter, branchFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <AppLayout>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <span>Savdo & Buyurtmalar Moduli (Sales & Orders)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lead → Taklif → Buyurtma → To'lov → Ombordan Rezerv & Chiqarish → O'rnatish boshqaruvi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'pipeline'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Битрикс24 Канбан</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Jadval (Ro'yxat)</span>
            </button>
          </div>

          <button
            onClick={fetchOrders}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Yangilash</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Buyurtma</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Jami Buyurtmalar</span>
            <span className="text-lg font-bold text-slate-900 block mt-0.5">{kpis.totalOrders} ta</span>
            <span className="text-[10px] text-slate-500 font-medium">Barcha bosqichlar</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Umumiy Qiymat</span>
            <span className="text-sm font-mono font-extrabold text-slate-900 block mt-0.5">
              {(kpis.totalAmount || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">so'm (shartnomalar)</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Tushum (To'langan)</span>
            <span className="text-sm font-mono font-extrabold text-emerald-700 block mt-0.5">
              {(kpis.totalPaid || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">so'm kassa & bank</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Qarzdorlik (Debitorlik)</span>
            <span className="text-sm font-mono font-extrabold text-rose-700 block mt-0.5">
              {(kpis.totalDebt || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-600 font-medium">so'm kutilmoqda</span>
          </div>

          <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-purple-700 block">Omborda Rezerv</span>
            <span className="text-lg font-bold text-purple-700 block mt-0.5">{kpis.reservedCount} ta</span>
            <span className="text-[10px] text-purple-600 font-medium">band qilingan buyurtma</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">O'rnatish & Servis</span>
            <span className="text-lg font-bold text-amber-700 block mt-0.5">{kpis.activeInstallationCount} ta</span>
            <span className="text-[10px] text-amber-600 font-medium">texnik jarayonda</span>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buyurtma No, Mijoz, STIR, Telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Barcha Holatlar (Statuses)</option>
              <option value="YANGI">Yangi</option>
              <option value="TASDIQLANGAN">Tasdiqlangan</option>
              <option value="TOLOV_KUTILMOQDA">To'lov kutilmoqda</option>
              <option value="QISMAN_TOLANGAN">Qisman to'langan</option>
              <option value="TOLANGAN">To'langan</option>
              <option value="REZERV">Rezerv</option>
              <option value="YETKAZILMOQDA">Yetkazilmoqda</option>
              <option value="ORNATILMOQDA">O'rnatilmoqda</option>
              <option value="YAKUNLANDI">Yakunlandi</option>
              <option value="BEKOR_QILINDI">Bekor qilindi</option>
            </select>
          </div>

          {/* Pipeline Stage Filter */}
          <div>
            <select
              value={pipelineFilter}
              onChange={(e) => setPipelineFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Barcha Flow Bosqichlari</option>
              <option value="LEAD">Lead (Potensial)</option>
              <option value="TAKLIF">Taklif (Proposal)</option>
              <option value="BUYURTMA">Buyurtma</option>
              <option value="REZERV">Rezerv</option>
              <option value="CHIQARISH">Ombordan chiqarish</option>
              <option value="YETKAZISH">Yetkazish</option>
              <option value="ORNATISH">O'rnatish</option>
              <option value="YAKUNLANDI">Yakunlandi</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Main Content: Table or Pipeline */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm space-y-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-blue-100 mx-auto"></div>
          <p className="text-xs text-slate-400">Buyurtmalar ma'lumotlari yuklanmoqda...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Buyurtmalar topilmadi</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Qidiruv yoki filtrlarni o'zgartirib ko'ring yoki birinchi buyurtmani shakllantiring.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Buyurtma Yaratish</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Buyurtma No</th>
                  <th className="py-3 px-4">Mijoz / STIR</th>
                  <th className="py-3 px-4">Filial / Menejer</th>
                  <th className="py-3 px-4 text-center">Uskunalar</th>
                  <th className="py-3 px-4 text-right">Summa & To'lov</th>
                  <th className="py-3 px-4 text-center">Holat (Status)</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const statusConf = ORDER_STATUS_LABELS[o.status] || {
                    label: o.status,
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  const percentPaid = o.finalAmount > 0 ? Math.min(100, Math.round((o.paidAmount / o.finalAmount) * 100)) : 100;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrderId(o.id)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Order No & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          {o.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString('uz')}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{o.customer?.companyName}</div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                          <span>STIR: {o.customer?.inn}</span>
                          <span>•</span>
                          <span>{o.customer?.phone}</span>
                        </div>
                      </td>

                      {/* Branch & Manager */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{o.branch?.name} filiali</div>
                        <div className="text-[11px] text-slate-400">
                          Mas'ul: {o.manager?.name?.split(' ')[0] || 'Menejer'}
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          <Package className="w-3 h-3 text-slate-500" />
                          {o.items?.length || 0} xil
                        </span>
                      </td>

                      {/* Amount & Paid bar */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900">
                          {(o.finalAmount || 0).toLocaleString()} so'm
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${percentPaid}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{percentPaid}%</span>
                        </div>
                        {o.debtAmount > 0 && (
                          <div className="text-[10px] font-mono text-rose-600 font-semibold mt-0.5">
                            Qarz: {o.debtAmount.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConf.badge}`}>
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {o.debtAmount > 0 && o.status !== 'BEKOR_QILINDI' && (
                            <button
                              onClick={() => setPaymentOrder(o)}
                              title="To'lov qabul qilish"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrderId(o.id)}
                            title="Batafsil ko'rish"
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* BITRIX24 KANBAN FLOW VIEW */
        <BitrixKanbanBoard
          orders={orders}
          managers={managers}
          onOrderClick={(orderId) => setSelectedOrderId(orderId)}
          onRefresh={fetchOrders}
          onCreateFullOrder={() => setIsCreateOpen(true)}
          activeFilterSearch={search}
          onFilterSearchChange={(val) => setSearch(val)}
        />
      )}

      {/* Modals & Drawers */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newOrder) => {
          fetchOrders();
          setSelectedOrderId(newOrder.id);
        }}
      />

      <PaymentModal
        isOpen={Boolean(paymentOrder)}
        order={paymentOrder}
        onClose={() => setPaymentOrder(null)}
        onSuccess={() => {
          fetchOrders();
          if (selectedOrderId) {
            // will auto reload in drawer if open
          }
        }}
      />

      <OrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onOrderUpdated={fetchOrders}
        onOpenPayment={(ord) => setPaymentOrder(ord)}
      />
    </AppLayout>
  );
}
