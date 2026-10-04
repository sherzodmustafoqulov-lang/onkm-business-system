'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Smartphone, Wand2, Eye, EyeOff, CheckCircle, Copy, Check } from 'lucide-react';
import { generateTempPassword } from '@/lib/sms';

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onSuccess?: () => void;
}

export default function AdminResetPasswordModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: AdminResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword(generateTempPassword());
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen || !employee) return null;

  const handleGenerate = () => {
    setNewPassword(generateTempPassword());
  };

  const handleCopy = () => {
    const text = `ONKM Tizimi Yangi Parol:\nLogin: ${employee.email}\nParol: ${newPassword}\nSayt: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          sendSms,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (onSuccess) onSuccess();
      } else {
        alert(data.error || 'Parolni yangilashda xatolik yuz berdi');
      }
    } catch (err) {
      console.error(err);
      alert('Tizimda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Parolni yangilash & SMS</h2>
              <p className="text-xs text-slate-500">{employee.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Parol muvaffaqiyatli yangilandi!
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
              <div className="text-xs text-slate-500 font-semibold">Yangi kirish ma'lumotlari:</div>
              <div className="text-xs font-bold text-slate-700">
                Login: <span className="text-blue-600 font-mono">{employee.email}</span>
              </div>
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <div>
                  Yangi parol: <span className="text-emerald-700 font-mono">{result.tempPassword}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Nusxa olindi' : 'Nusxalash'}
                </button>
              </div>
              {result.smsSent && (
                <div className="pt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 border-t border-slate-200">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Xodimning telefoniga SMS xabar yuborildi!
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1">
              <div className="font-bold text-blue-900 flex justify-between">
                <span>Login: {employee.email}</span>
                <span className="text-slate-500">{employee.phone || 'Telefon yo\'q'}</span>
              </div>
              <p className="text-blue-700 text-[11px]">
                Ushbu amal xodim uchun yangi parol belgilaydi va xohlasangiz uning telefon raqamiga SMS jo'natadi.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Yangi bir martalik parol
                </label>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  Yangi generatsiya
                </button>
              </div>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div className="text-xs text-emerald-900">
                <span className="font-bold flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Xodim telefon raqamiga SMS yuborish
                </span>
                <span className="text-[11px] text-emerald-700 block mt-0.5">
                  Raqam: {employee.phone || '(Raqam mavjud emas)'}
                </span>
              </div>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold border border-slate-200"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                {isLoading && (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                )}
                Parolni yangilash & SMS
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
