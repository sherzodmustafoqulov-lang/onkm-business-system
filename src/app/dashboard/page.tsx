'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import TopKpiCards from '@/components/dashboard/TopKpiCards';
import DashboardGraphs from '@/components/dashboard/DashboardGraphs';
import DashboardTables from '@/components/dashboard/DashboardTables';
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branchId, setBranchId] = useState('ALL');
  const [managerId, setManagerId] = useState('ALL');

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      params.set('dateFilter', dateFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (branchId !== 'ALL') params.set('branchId', branchId);
      if (managerId !== 'ALL') params.set('managerId', managerId);

      const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter, startDate, endDate, branchId, managerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Bugungi';
      case 'yesterday': return 'Kechagi';
      case '7days': return '7 Kunlik';
      case '30days': return '30 Kunlik';
      case 'this_month': return 'Bu Oylik';
      case 'last_month': return 'O\'tgan Oylik';
      case 'custom': return 'Oraliqdagi';
      default: return 'Bugungi';
    }
  };

  // CSV Export handler
  const handleExportCsv = () => {
    if (!data) return;

    const kpis = data.kpis;
    const rows = [
      ['ONKM BUSINESS ERP - BOSHQARUV PANELI HISOBOTI'],
      ['Sana oralig\'i:', getDateFilterLabel()],
      ['Eksport sanasi:', new Date().toLocaleString('uz-UZ')],
      ['Filial filtri:', branchId],
      ['Menejer filtri:', managerId],
      [],
      ['--- TOP KPI KO\'RSATKICHLARI ---'],
      ['Ko\'rsatkich', 'Qiymat'],
      ['Savdo Hajmi', kpis.bugungiSavdo],
      ['Undirilgan Tushum', kpis.bugungiTushum],
      ['Sof Foyda', kpis.bugungiFoyda],
      ['Rentabellik Marjasi', kpis.profitMargin],
      ['Yangi Mijozlar', kpis.yangiMijozlar],
      ['Yangi Buyurtmalar', kpis.yangiBuyurtmalar],
      ['O\'rnatishlar Soni', kpis.ornatishlar],
      ['Ochiq Supportlar', kpis.ochiqSupport],
      ['Jami Qarzdorlik', kpis.qarzdorlik],
      [],
      ['--- QARZDOR MIJOZLAR (TOP) ---'],
      ['Korxona Nomi', 'STIR', 'Telefon', 'Qarzdorlik'],
      ...(data.tables.qarzdorMijozlar || []).map((c: any) => [
        `"${c.companyName}"`,
        c.inn,
        c.phone,
        c.debt,
      ]),
      [],
      ['--- OXIRGI BUYURTMALAR ---'],
      ['Buyurtma №', 'Mijoz', 'Summa', 'Etap', 'Holat'],
      ...(data.tables.oxirgiBuyurtmalar || []).map((o: any) => [
        o.orderNumber,
        `"${o.customer?.companyName || 'Mijoz'}"`,
        o.finalAmount,
        o.pipelineStage,
        o.status,
      ]),
    ];

    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ONKM_Dashboard_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Administrator Boshqaruv Paneli (Executive Dashboard)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real vaqtdagi savdo, kassa tushumi, mahsulotlar tannarxi, foyda marjasi va filiallar integratsiyasi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => (window.location.href = '/sales')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yangi Savdo / Buyurtma</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        startDate={startDate}
        endDate={endDate}
        onCustomDateChange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
        branchId={branchId}
        onBranchChange={setBranchId}
        managerId={managerId}
        onManagerChange={setManagerId}
        branches={data?.filters?.availableBranches || []}
        managers={data?.filters?.availableManagers || []}
        onRefresh={fetchStats}
        refreshing={refreshing}
        onExport={handleExportCsv}
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
            ))}
          </div>
          <div className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
          <div className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* 1. TOP 8 KPIS */}
          {data?.kpis && (
            <TopKpiCards
              kpis={data.kpis}
              dateFilterLabel={getDateFilterLabel()}
            />
          )}

          {/* 2. 7 BUSINESS GRAPHS */}
          {data?.graphs && (
            <DashboardGraphs data={data.graphs} />
          )}

          {/* 3. 5 DETAILED REAL-DATA TABLES */}
          {data?.tables && (
            <DashboardTables tables={data.tables} />
          )}
        </>
      )}
    </AppLayout>
  );
}
