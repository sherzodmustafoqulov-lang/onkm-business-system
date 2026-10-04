'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartProps {
  data: Array<{
    name: string;
    savdo: number;
    tushum: number;
    foyda: number;
  }>;
}

export default function SalesChart({ data }: ChartProps) {
  const formatUZS = (val: number) => {
    return `${(val / 1000000).toFixed(1)} mln`;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Haftalik Savdo, Tushum va Foyda Dinamikasi
          </h3>
          <p className="text-xs text-slate-500">
            Real vaqt rejimidagi moliyaviy oqim va kassa tushumi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            Savdo
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Tushum
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
            Foyda
          </span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSavdo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTushum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFoyda" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={formatUZS} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(val: number) => [new Intl.NumberFormat('uz-UZ').format(val) + ' so\'m']}
              contentStyle={{
                backgroundColor: '#0F172A',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="savdo"
              name="Savdo"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSavdo)"
            />
            <Area
              type="monotone"
              dataKey="tushum"
              name="Tushum"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTushum)"
            />
            <Area
              type="monotone"
              dataKey="foyda"
              name="Foyda"
              stroke="#6366F1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFoyda)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
