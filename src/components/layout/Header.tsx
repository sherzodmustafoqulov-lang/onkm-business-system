'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Building,
  Sparkles,
  Shield,
  HelpCircle,
  Key,
  Lock,
  ChevronDown,
} from 'lucide-react';
import ChangePasswordModal from '@/components/users/ChangePasswordModal';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  currentBranchId: string;
  onBranchChange: (branchId: string) => void;
  userName?: string;
  roleDisplayName?: string;
  userAvatar?: string;
  mustChangePassword?: boolean;
  onOpenAi?: () => void;
}

export default function Header({
  currentBranchId,
  onBranchChange,
  userName = 'Admin',
  roleDisplayName = 'Administrator',
  userAvatar,
  mustChangePassword,
  onOpenAi,
}: HeaderProps) {
  const { branches: authBranches } = useAuth();
  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>(authBranches || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (authBranches && authBranches.length > 0) {
      setBranches(authBranches);
    } else {
      fetch('/api/branches')
        .then((res) => res.json())
        .then((data) => {
          if (data.branches) {
            setBranches(data.branches);
          }
        })
        .catch((err) => console.error('Failed to load branches:', err));
    }
  }, [authBranches]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-20 flex items-center justify-between px-6">
      {/* Left: Global Quick Search & Branch Selector */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        {/* Branch Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1.5 shadow-sm">
          <Building className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <select
            value={currentBranchId}
            onChange={(e) => onBranchChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-2"
          >
            <option value="ALL">🏢 Barcha filiallar (Respublika)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                📍 {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Global Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Qidiruv: Mijoz, STIR (INN), Telefon, ONKM/FM seriya, Buyurtma..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg pl-9 pr-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Right Action Icons & User Info */}
      <div className="flex items-center gap-3">
        {/* AI Assistant Quick Pill */}
        <button
          onClick={onOpenAi}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>ONKM AI</span>
        </button>

        {/* Notification Bell */}
        <button
          title="Bildirishnomalar"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        {/* System Help */}
        <button
          title="Texnik qo'llanma"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* User Info Capsule with Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-all text-left"
          >
            <div className="relative">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover shadow-sm shadow-blue-500/30"
                />
              ) : (
                <div
                  suppressHydrationWarning
                  className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-blue-500/30"
                >
                  {userName.charAt(0)}
                </div>
              )}
              {mustChangePassword && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white"></span>
              )}
            </div>

            <div className="hidden md:block text-left">
              <div suppressHydrationWarning className="text-xs font-bold text-slate-800 flex items-center gap-1">
                {userName}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div suppressHydrationWarning className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-blue-500" />
                {roleDisplayName}
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <div suppressHydrationWarning className="text-xs font-bold text-slate-800">{userName}</div>
                <div suppressHydrationWarning className="text-[11px] text-slate-500">{roleDisplayName}</div>
              </div>

              {mustChangePassword && (
                <div className="mx-2 my-1.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
                  ⚠️ Bir martalik parol o'zgartirilishi tavsiya etiladi.
                </div>
              )}

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2.5 transition-colors"
              >
                <Key className="w-4 h-4 text-blue-600" />
                Parolni o'zgartirish
              </button>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
}
