'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@onkm.uz');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Kirishda xatolik yuz berdi');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err) {
      setError('Server bilan aloqa uzildi. Qaytadan urinib ko\'ring.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('admin123');
    handleSubmit(undefined, roleEmail, 'admin123');
  };

  const testAccounts = [
    { role: 'Administrator', email: 'admin@onkm.uz', desc: 'To\'liq tizim boshqaruvi', icon: '👑', color: 'border-red-200 hover:bg-red-50/50' },
    { role: 'Menejer', email: 'manager@onkm.uz', desc: 'Mijoz va savdolar', icon: '💼', color: 'border-blue-200 hover:bg-blue-50/50' },
    { role: 'Texnik xodim', email: 'tech@onkm.uz', desc: 'O\'rnatish va servis', icon: '🔧', color: 'border-amber-200 hover:bg-amber-50/50' },
    { role: 'Omborchi', email: 'warehouse@onkm.uz', desc: 'Qurilmalar va FM ombori', icon: '📦', color: 'border-emerald-200 hover:bg-emerald-50/50' },
    { role: 'Kassir / Buxgalter', email: 'accountant@onkm.uz', desc: 'To\'lovlar va kassa', icon: '💰', color: 'border-purple-200 hover:bg-purple-50/50' },
    { role: 'Support Operator', email: 'support@onkm.uz', desc: 'Texnik yordam va ticketlar', icon: '🎧', color: 'border-cyan-200 hover:bg-cyan-50/50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Form Panel */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-8 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-lg tracking-tight">
                ONKM BUSINESS SYSTEM
              </div>
              <div className="text-xs text-blue-600 font-semibold">
                ERP / CRM Professional Platforma
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-1">Xush kelibsiz</h2>
          <p className="text-xs text-slate-500 mb-6">
            Tizimga kirish uchun xizmat pochtasi va parolingizni kiriting
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>Avtorizatsiya muvaffaqiyatli! Boshqaruv paneliga o'tilmoqda...</span>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Xizmat Pochtasi (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@onkm.uz"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Parol</label>
                <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                  Unutdingizmi?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <span>Tizimga Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              256-bit SSL Shifrlangan
            </span>
            <span>v1.0.0 Enterprise</span>
          </div>
        </div>

        {/* Right 1-Click Role Login Selection Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-white mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <UserCheck className="w-4 h-4" />
              Tezkor Test Kirish (1-Click Demo)
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              Rolni tanlang va bir zumda kiring
            </h3>
            <p className="text-xs text-slate-400">
              Har bir xodim o'z roli va ruxsatnomalariga (RBAC) ko'ra tizim bilan ishlaydi
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {testAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickLogin(acc.email)}
                disabled={loading || success}
                className={`text-left p-3 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{acc.icon}</span>
                  <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    Kirish →
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                  {acc.role}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{acc.desc}</div>
                <div className="text-[9px] text-slate-500 font-mono mt-1 truncate">{acc.email}</div>
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-200/90 leading-relaxed">
            💡 <strong className="text-white">Standart parol:</strong> barcha test hisoblar uchun{' '}
            <code className="bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
              admin123
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
