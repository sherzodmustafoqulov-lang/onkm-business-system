'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, Send, CheckCircle2, Clock } from 'lucide-react';

export default function SmsLogsTab() {
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSmsLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sms');
      if (res.ok) {
        const data = await res.json();
        setSmsLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load SMS logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSmsLogs();
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            SMS Xabarlar jurnali (Bir martalik parollar)
          </h3>
          <p className="text-xs text-slate-500">
            Xodimlarga yuborilgan barcha login va bir martalik parollar tarixi
          </p>
        </div>
        <button
          onClick={fetchSmsLogs}
          className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          title="Yangilash"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Qabul qiluvchi xodim</th>
                <th className="py-3 px-4">Telefon raqam</th>
                <th className="py-3 px-4">Xabar matni</th>
                <th className="py-3 px-4">Parol (Kodi)</th>
                <th className="py-3 px-4">Yuborilgan vaqt</th>
                <th className="py-3 px-4">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && smsLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    SMS xabarlar yuklanmoqda...
                  </td>
                </tr>
              ) : smsLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    Hozircha yuborilgan SMS xabarlar mavjud emas.
                  </td>
                </tr>
              ) : (
                smsLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 text-xs">
                      {log.user?.name || 'Yangi xodim'}
                      <div className="text-[11px] text-blue-600 font-normal">
                        {log.user?.email || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">
                      {log.phone}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-md">
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] leading-relaxed">
                        {log.message}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {log.code ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-800 font-mono font-bold text-xs rounded border border-emerald-200">
                          {log.code}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString('uz-UZ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Yuborildi
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
