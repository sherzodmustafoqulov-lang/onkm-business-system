'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Wrench,
  HeadphonesIcon,
  BadgeDollarSign,
  BarChart3,
  UserCog,
  Settings,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronRight,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
  roleDisplayName?: string;
  userPermissions?: any;
}

export default function Sidebar({
  userRole = 'ADMIN',
  userName = 'Foydalanuvchi',
  userEmail = '',
  roleDisplayName = 'Administrator',
}: SidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      title: 'Boshqaruv',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'WAREHOUSE', 'ACCOUNTANT', 'SUPPORT'] },
        { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'WAREHOUSE', 'ACCOUNTANT', 'SUPPORT'] },
        { name: 'Mijozlar', href: '/customers', icon: Users, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'SUPPORT'] },
        { name: 'Savdo & Buyurtmalar', href: '/sales', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      ],
    },
    {
      title: 'Texnik & Ombor',
      items: [
        { name: 'Ombor & Qurilmalar', href: '/warehouse', icon: Package, roles: ['ADMIN', 'WAREHOUSE', 'MANAGER'] },
        { name: 'O\'rnatishlar (Servis)', href: '/installations', icon: Wrench, roles: ['ADMIN', 'TECHNICIAN', 'MANAGER', 'SUPPORT'] },
        { name: 'Support (Ticketlar)', href: '/support', icon: HeadphonesIcon, roles: ['ADMIN', 'SUPPORT', 'MANAGER', 'TECHNICIAN'] },
      ],
    },
    {
      title: 'Moliya & Tahlil',
      items: [
        { name: 'Moliya & Xizmatlar', href: '/finance', icon: BadgeDollarSign, roles: ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'SUPPORT', 'TECHNICIAN'] },
        { name: 'Hisobotlar', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'ACCOUNTANT', 'MANAGER'] },
      ],
    },
    {
      title: 'Tizim',
      items: [
        { name: 'Filiallar', href: '/branches', icon: Building2, roles: ['ADMIN'] },
        { name: 'Xodimlar & Rollar', href: '/users', icon: UserCog, roles: ['ADMIN'] },
        { name: 'Sozlamalar', href: '/settings', icon: Settings, roles: ['ADMIN'] },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-30 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-white tracking-wide text-sm flex items-center gap-1.5">
            ONKM SYSTEM
            <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
              ERP
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">B2B Boshqaruv Tizimi</div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navigationItems.map((group, idx) => {
          // Filter items based on user role
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(userRole)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
                {group.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={true}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                            }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              suppressHydrationWarning
              className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/30 flex-shrink-0"
            >
              {userName.charAt(0)}
            </div>
            <div className="truncate">
              <div suppressHydrationWarning className="text-xs font-semibold text-white truncate">{userName}</div>
              <div suppressHydrationWarning className="text-[10px] text-blue-400 truncate flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                {roleDisplayName}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Tizimdan chiqish"
            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
