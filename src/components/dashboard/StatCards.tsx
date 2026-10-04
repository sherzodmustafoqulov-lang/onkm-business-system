'use client';

import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Coins,
  Users,
  ShoppingCart,
  Wrench,
  Headphones,
  AlertTriangle,
  Package,
} from 'lucide-react';

interface StatCardsProps {
  kpis: {
    totalSalesVolume: number;
    totalReceipts: number;
    estimatedProfit: number;
    totalCustomers: number;
    totalOrders: number;
    openTicketsCount: number;
    pendingInstallationsCount: number;
    totalCustomerDebt: number;
    lowStockProductsCount: number;
  };
}

export default function StatCards({ kpis }: StatCardsProps) {
  const formatUZS = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val) + ' so\'m';
  };

  const cards = [
    {
      title: 'Umumiy Savdo',
      value: formatUZS(kpis.totalSalesVolume || 0),
      subtitle: 'Rasmiylashtirilgan buyurtmalar',
      icon: TrendingUp,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      badge: '+14% o\'sish',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Jami Tushum',
      value: formatUZS(kpis.totalReceipts || 0),
      subtitle: 'Bank, Click, Naqd tushumlar',
      icon: CreditCard,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      badge: '98% kassa',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Kutilayotgan Foyda',
      value: formatUZS(kpis.estimatedProfit || 0),
      subtitle: 'Sof marja (~28%)',
      icon: Coins,
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      badge: 'Rejada',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: 'Mijozlar Qarzdorligi',
      value: formatUZS(kpis.totalCustomerDebt || 0),
      subtitle: 'Nasiya / To\'lanmagan summa',
      icon: AlertTriangle,
      color: 'from-amber-600 to-red-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      badge: 'Nazoratda',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Mijozlar Bazasi',
      value: `${kpis.totalCustomers || 0} ta`,
      subtitle: 'MCHJ, XK, YaTT tashkilotlar',
      icon: Users,
      color: 'from-cyan-600 to-blue-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      badge: 'Faol',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    {
      title: 'Buyurtmalar Soni',
      value: `${kpis.totalOrders || 0} ta`,
      subtitle: 'Shartnomalar va aktlar',
      icon: ShoppingCart,
      color: 'from-sky-600 to-blue-700',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-600',
      badge: 'Jarayonda',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'O\'rnatish & Servis',
      value: `${kpis.pendingInstallationsCount || 0} ta`,
      subtitle: 'Texniklar vazifasi',
      icon: Wrench,
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      badge: 'Bugun',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      title: 'Ochiq Supportlar',
      value: `${kpis.openTicketsCount || 0} ta`,
      subtitle: 'Operatorlar tekshiruvida',
      icon: Headphones,
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
      badge: 'Kutuvda',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`p-2 rounded-lg ${c.bgColor} ${c.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-xl font-bold text-slate-900 tracking-tight mb-1">
              {c.value}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">
                {c.subtitle}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.badgeColor}`}>
                {c.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
