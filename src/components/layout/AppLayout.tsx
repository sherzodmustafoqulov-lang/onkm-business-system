'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AiAssistantDrawer from '../ai/AiAssistantDrawer';
import ChangePasswordModal from '../users/ChangePasswordModal';
import { useAuth } from '@/context/AuthContext';
import { Sparkles } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, setCurrentUser, currentBranchId, setCurrentBranchId, loading } = useAuth();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);


  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        userRole={currentUser?.role}
        userName={currentUser?.name}
        userEmail={currentUser?.email}
        roleDisplayName={currentUser?.roleDisplayName}
        userPermissions={currentUser?.permissions}
      />

      {/* Main Container */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          currentBranchId={currentBranchId}
          onBranchChange={setCurrentBranchId}
          userName={currentUser?.name}
          roleDisplayName={currentUser?.roleDisplayName}
          userAvatar={currentUser?.avatar}
          mustChangePassword={currentUser?.mustChangePassword}
          onOpenAi={() => setIsAiOpen(true)}
        />

        {/* Temporary password notification banner if required */}
        {currentUser?.mustChangePassword && (
          <div className="mt-16 mx-8 mt-20 mb-[-1rem] p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🔐</span>
              <span>
                <b>Xavfsizlik ogohlantirishi:</b> Siz tizimga bir martalik parol bilan kirdingiz.
                Iltimos, o'zingizga qulay shaxsiy parolni o'rnating.
              </span>
            </div>
            <button
              onClick={() => setIsChangePassOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-xs"
            >
              Parolni o'zgartirish
            </button>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 pt-20 px-8 pb-12">
          {children}
        </main>
      </div>

      {/* Global AI Assistant Floating Action Button */}
      <button
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white p-3.5 rounded-full shadow-xl shadow-blue-500/30 flex items-center gap-2 group transition-all transform hover:scale-105"
        title="ONKM AI Assistant"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pr-1">
          ONKM AI
        </span>
      </button>

      {/* Global AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        currentUser={currentUser}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        onSuccess={() => {
          setCurrentUser((prev: any) => ({ ...prev, mustChangePassword: false }));
        }}
      />
    </div>
  );
}
