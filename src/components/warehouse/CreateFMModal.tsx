'use client';

import React, { useState } from 'react';
import { X, Layers, Save, AlertCircle } from 'lucide-react';

interface CreateFMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branches: any[];
}

export default function CreateFMModal({
  isOpen,
  onClose,
  onSuccess,
  branches,
}: CreateFMModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    serialNumber: '',
    branchId: '',
    status: 'OMBORDA',
    kkmSerialNumber: '',
    notes: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        branchId: prev.branchId || (branches.length > 0 ? branches[0].id : ''),
      }));
    }
  }, [isOpen, branches]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/warehouse/fiscal-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'FM saqlashda xatolik');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Server bilan aloqa uzildi');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-600 text-white shadow-sm shadow-purple-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Fiskal Modul (FM) Kirimi</h2>
              <p className="text-[11px] text-slate-500">Davlat soliq qo'mitasi sertifikatlangan modul</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              FM Seriya Raqami <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              placeholder="FM998001025"
              className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Filial</label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Boshlang'ich Holat</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="OMBORDA">OMBORDA</option>
                <option value="FILIALDA">FILIALDA</option>
                <option value="REZERV">REZERV</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Biriktirilgan KKM (Ixtiyoriy)</label>
            <input
              type="text"
              value={formData.kkmSerialNumber}
              onChange={(e) => setFormData({ ...formData, kkmSerialNumber: e.target.value })}
              placeholder="ACLAS-CRV-2001"
              className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Izoh</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Davlat Belgisi partiyasi #4"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Bekor Qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-purple-600/30 disabled:opacity-60"
            >
              {loading ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>FM Saqlash</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
