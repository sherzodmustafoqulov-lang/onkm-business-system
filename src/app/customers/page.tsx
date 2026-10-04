'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import CreateCustomerModal from '@/components/customers/CreateCustomerModal';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import {
  Users,
  Search,
  Plus,
  Building,
  Filter,
  ArrowRight,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ofdFilter, setOfdFilter] = useState('ALL');
  const [debtOnly, setDebtOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Fetch branches
  useEffect(() => {
    fetch('/api/branches')
      .then((res) => res.json())
      .then((data) => {
        if (data.branches) setBranches(data.branches);
      });
  }, []);

  // Fetch customers with debounce
  const fetchCustomers = () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: search,
      branchId: branchFilter,
      status: statusFilter,
      ofdStatus: ofdFilter,
      debtOnly: debtOnly ? 'true' : 'false',
      page: String(currentPage),
      limit: '8',
    });

    fetch(`/api/customers?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.customers) {
          setCustomers(data.customers);
          setPagination(data.pagination);
        }
      })
      .catch((err) => console.error('Fetch customers error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, branchFilter, statusFilter, ofdFilter, debtOnly, currentPage]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham "${name}" korxonasini arxivlamoqchimisiz?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomers();
      } else {
        const data = await res.json();
        alert(data.error || 'O\'chirishda xatolik yuz berdi');
      }
    } catch {
      alert('Server bilan aloqa uzildi');
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mijozlar Bazasi</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {pagination.total} ta korxona
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Online Nazorat Kassa Mashinalari (ONKM), POS va fiskal modullar biriktirilgan mijozlar
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCustomers()}
            title="Yangilash"
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Mijoz Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidiruv: Nomi, STIR (INN), Telefon, Mas'ul..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Branch Filter */}
          <div className="md:col-span-3">
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">🏢 Barcha Filiallar</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  📍 {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Holati: Barchasi</option>
              <option value="FAOL">🟢 Faol</option>
              <option value="KUTILMOQDA">🟡 Kutilmoqda</option>
              <option value="BLOKLANGAN">🔴 Bloklangan</option>
            </select>
          </div>

          {/* OFD Status Filter */}
          <div className="md:col-span-2">
            <select
              value={ofdFilter}
              onChange={(e) => {
                setOfdFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">OFD: Barchasi</option>
              <option value="ULANGAN">🟢 Ulangan</option>
              <option value="ULANMAGAN">⚪ Ulanmagan</option>
              <option value="MUDDATI_OTGAN">🔴 Muddati o'tgan</option>
            </select>
          </div>

          {/* Debt Checkbox */}
          <div className="md:col-span-1 flex items-center justify-end">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={debtOnly}
                onChange={(e) => {
                  setDebtOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Qarzdor</span>
            </label>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden mb-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Mijozlar bazasi yuklanmoqda...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Hech qanday mijoz topilmadi. Qidiruv parametrlarini o'zgartirib ko'ring.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Korxona Nomi / STIR</th>
                  <th className="py-3 px-4">Filial & Manzil</th>
                  <th className="py-3 px-4">Aloqa & Mas'ul</th>
                  <th className="py-3 px-4 text-center">ONKM / FM / POS</th>
                  <th className="py-3 px-4">Qarzdorlik</th>
                  <th className="py-3 px-4">Holat / OFD</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block text-sm"
                      >
                        {c.companyName}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-semibold">{c.companyType}</span>
                        <span>STIR: <strong className="text-slate-800">{c.inn}</strong></span>
                        {c.tradeMark && (
                          <span className="text-blue-600 truncate max-w-[140px]">({c.tradeMark})</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{c.branch?.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[190px]">{c.address}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{c.contactPerson || c.director || '—'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.phone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700">
                        <span className="text-indigo-700 font-extrabold flex items-center gap-1">
                          <span>🖥🧩</span>
                          <span>{c.pairedDevices ?? Math.min(c._count.productSerials, c._count.fiscalModules)} ta qurilma</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({c._count.productSerials} ONKM / {c._count.fiscalModules} FM)
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.debt > 0 ? (
                        <div className="font-bold text-rose-600">
                          {new Intl.NumberFormat('uz-UZ').format(c.debt)} so'm
                        </div>
                      ) : (
                        <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          Qarz yo'q
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {c.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          OFD: {c.ofdStatus === 'ULANGAN' ? '🟢 Faol' : '🔴 Oflayn'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingCustomer(c)}
                          title="Tahrirlash"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(c.id, c.companyName)}
                          title="O'chirish"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/customers/${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors ml-1"
                        >
                          <span>Karta</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
          <div>
            Jami: <strong className="text-slate-800">{pagination.total}</strong> ta mijozdan{' '}
            {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} ko'rsatilmoqda
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchCustomers()}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={!!editingCustomer}
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSuccess={() => fetchCustomers()}
      />
    </AppLayout>
  );
}
