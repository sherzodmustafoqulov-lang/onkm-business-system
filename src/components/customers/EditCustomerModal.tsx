'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Save, AlertCircle } from 'lucide-react';

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCustomerModal({
  isOpen,
  customer,
  onClose,
  onSuccess,
}: EditCustomerModalProps) {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    inn: '',
    companyType: 'MCHJ',
    legalStatus: 'Faol',
    tradeMark: '',
    activityType: '',
    oked: '',
    address: '',
    phone: '',
    email: '',
    bank: '',
    accountNumber: '',
    mfo: '',
    director: '',
    contactPerson: '',
    branchId: '',
    status: 'FAOL',
    ofdStatus: 'ULANGAN',
    debt: 0,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        companyName: customer.companyName || '',
        inn: customer.inn || '',
        companyType: customer.companyType || 'MCHJ',
        legalStatus: customer.legalStatus || 'Faol',
        tradeMark: customer.tradeMark || '',
        activityType: customer.activityType || '',
        oked: customer.oked || '',
        address: customer.address || '',
        phone: customer.phone || '',
        email: customer.email || '',
        bank: customer.bank || '',
        accountNumber: customer.accountNumber || '',
        mfo: customer.mfo || '',
        director: customer.director || '',
        contactPerson: customer.contactPerson || '',
        branchId: customer.branchId || '',
        status: customer.status || 'FAOL',
        ofdStatus: customer.ofdStatus || 'ULANGAN',
        debt: customer.debt || 0,
      });
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/branches')
        .then((res) => res.json())
        .then((data) => {
          if (data.branches) setBranches(data.branches);
        });
    }
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Mijozni yangilashda xatolik yuz berdi');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Server bilan aloqa uzildi');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Mijoz Ma'lumotlarini Tahrirlash</h2>
              <p className="text-[11px] text-slate-500">{customer.companyName} (STIR: {customer.inn})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kompaniya Nomi</label>
              <input
                type="text"
                required
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">STIR (INN)</label>
              <input
                type="text"
                required
                name="inn"
                value={formData.inn}
                onChange={handleChange}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kompaniya Turi</label>
              <select
                name="companyType"
                value={formData.companyType}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="MCHJ">MCHJ</option>
                <option value="XK">XK</option>
                <option value="YaTT">YaTT</option>
                <option value="AJ">AJ</option>
                <option value="OK">OK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Savdo Belgisi</label>
              <input
                type="text"
                name="tradeMark"
                value={formData.tradeMark}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Filial</label>
              <select
                required
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Faoliyat Turi</label>
              <input
                type="text"
                name="activityType"
                value={formData.activityType}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OKED</label>
              <input
                type="text"
                name="oked"
                value={formData.oked}
                onChange={handleChange}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OFD Holati</label>
              <select
                name="ofdStatus"
                value={formData.ofdStatus}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ULANGAN">🟢 ULANGAN</option>
                <option value="ULANMAGAN">⚪ ULANMAGAN</option>
                <option value="MUDDATI_OTGAN">🔴 MUDDATI O'TGAN</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mijoz Statusi</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="FAOL">FAOL</option>
                <option value="KUTILMOQDA">KUTILMOQDA</option>
                <option value="BLOKLANGAN">BLOKLANGAN</option>
                <option value="NOFAOL">NOFAOL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon</label>
              <input
                type="text"
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qarzdorlik (so'm)</label>
              <input
                type="number"
                name="debt"
                value={formData.debt}
                onChange={handleChange}
                className="w-full text-xs font-bold text-rose-600 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Yuridik Manzil</label>
            <input
              type="text"
              required
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank</label>
              <input
                type="text"
                name="bank"
                value={formData.bank}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hisob Raqam</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">MFO</label>
              <input
                type="text"
                name="mfo"
                value={formData.mfo}
                onChange={handleChange}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Bekor Qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-600/30 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>O'zgarishlarni Saqlash</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
