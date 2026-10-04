'use client';

import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Percent,
  Users,
  ShoppingCart,
  Wrench,
  Headphones,
  AlertTriangle,
} from 'lucide-react';

interface TopKpiCardsProps {
  kpis: {
    bugungiSavdo: number;
    bugungiTushum: number;
    bugungiFoyda: number;
    profitMargin: string;
    yangiMijozlar: number;
    yangiBuyurtmalar: number;
    ornatishlar: number;
    ochiqSupport: number;
    qarzdorlik: number;
  };
  dateFilterLabel?: string;
}

export default function TopKpiCards({ kpis, dateFilterLabel = 'Bugun' }: TopKpiCardsProps) {
  const formatUZS = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val)) + " so'm";
  };

  const cards = [
    {
      title: `${dateFilterLabel} Savdo`,
      value: formatUZS(kpis.bugungiSavdo),
      subtitle: 'Rasmiylashtirilgan bitimlar',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200/80',
      badge: '+12.4%',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: `${dateFilterLabel} Tushum`,
      value: formatUZS(kpis.bugungiTushum),
      subtitle: 'Undirilgan to\'lovlar (Kassa/Bank)',
      icon: CreditCard,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/80',
      badge: 'Naqd/Bank/HUMO',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: `${dateFilterLabel} Foyda`,
      value: formatUZS(kpis.bugungiFoyda),
      subtitle: `Marja rentabelligi: ${kpis.profitMargin}`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200/80',
      badge: `Marja ${kpis.profitMargin}`,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Yangi Mijozlar',
      value: `${kpis.yangiMijozlar} ta`,
      subtitle: 'Tizimga qo\'shilgan korxonalar',
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200/80',
      badge: 'MCHJ / XK / YaTT',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      title: 'Yangi Buyurtmalar',
      value: `${kpis.yangiBuyurtmalar} ta`,
      subtitle: 'Faol savdo buyurtmalari',
      icon: Percent,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200/80',
      badge: 'Barcha etapdagi',
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    },
    {
      title: 'O\'rnatishlar (Servis)',
      value: `${kpis.ornatishlar} ta`,
      subtitle: 'Texniklar ijrosidagi vazifalar',
      icon: Wrench,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200/80',
      badge: 'ONKM & POS',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Ochiq Support',
      value: `${kpis.ochiqSupport} ta`,
      subtitle: 'Navbatdagi murojaatlar',
      icon: Headphones,
      color: kpis.ochiqSupport > 0 ? 'text-rose-600' : 'text-slate-600',
      bgColor: kpis.ochiqSupport > 0 ? 'bg-rose-50' : 'bg-slate-50',
      borderColor: kpis.ochiqSupport > 0 ? 'border-rose-200/80' : 'border-slate-200/80',
      badge: kpis.ochiqSupport > 0 ? 'Kutishda' : 'Barchasi yopiq',
      badgeColor: kpis.ochiqSupport > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Qarzdorlik (Debitorlik)',
      value: formatUZS(kpis.qarzdorlik),
      subtitle: 'Mijozlarning to\'lanmagan qarzi',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200/80',
      badge: 'Nazoratda',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white border ${card.borderColor} rounded-2xl p-4.5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                {card.title}
              </div>
              <div className="text-lg font-black text-slate-900 tracking-tight mt-1 truncate" title={card.value}>
                {card.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
