'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Building,
  UserCheck,
  Download,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface FilterBarProps {
  dateFilter: string;
  onDateFilterChange: (val: string) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  branchId: string;
  onBranchChange: (val: string) => void;
  managerId: string;
  onManagerChange: (val: string) => void;
  branches: Array<{ id: string; name: string; code: string }>;
  managers: Array<{ id: string; name: string }>;
  onRefresh: () => void;
  refreshing: boolean;
  onExport: () => void;
}

export default function DashboardFilterBar({
  dateFilter,
  onDateFilterChange,
  startDate,
  endDate,
  onCustomDateChange,
  branchId,
  onBranchChange,
  managerId,
  onManagerChange,
  branches = [],
  managers = [],
  onRefresh,
  refreshing,
  onExport,
}: FilterBarProps) {
  const [customStart, setCustomStart] = useState(startDate || '');
  const [customEnd, setCustomEnd] = useState(endDate || '');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const dateOptions = [
    { id: 'today', label: 'Bugun' },
    { id: 'yesterday', label: 'Kecha' },
    { id: '7days', label: '7 kun' },
    { id: '30days', label: '30 kun' },
    { id: 'this_month', label: 'Bu oy' },
    { id: 'last_month', label: 'O\'tgan oy' },
    { id: 'custom', label: 'Custom' },
  ];

  const handleDateClick = (id: string) => {
    if (id === 'custom') {
      setShowCustomModal(true);
    } else {
      onDateFilterChange(id);
    }
  };

  const applyCustomDates = () => {
    if (onCustomDateChange && customStart && customEnd) {
      onCustomDateChange(customStart, customEnd);
      onDateFilterChange('custom');
      setShowCustomModal(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs mb-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-100 p-1 rounded-xl">
          <Calendar className="w-4 h-4 text-slate-500 ml-2 mr-1 flex-shrink-0" />
          {dateOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleDateClick(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                dateFilter === opt.id
                  ? 'bg-white text-blue-700 shadow-2xs font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters (Branch & Manager) + Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Building className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <select
              value={branchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-1"
            >
              <option value="ALL">🏢 Barcha filiallar</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  📍 {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Manager Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <select
              value={managerId}
              onChange={(e) => onManagerChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-1"
            >
              <option value="ALL">👤 Barcha menejerlar</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Ma'lumotlarni yangilash"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Export button */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksport (CSV)</span>
          </button>
        </div>
      </div>

      {/* Custom Date Modal/Bar if triggered */}
      {showCustomModal && (
        <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            Maxsus muddatni tanlang:
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600 font-medium">Boshlanish:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600 font-medium">Tugash:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={applyCustomDates}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Qo'llash
            </button>
            <button
              onClick={() => setShowCustomModal(false)}
              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
