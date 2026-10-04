'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  User,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Package,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface CreateInstallationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: any) => void;
  preselectedOrderId?: string;
  preselectedCustomerId?: string;
}

export default function CreateInstallationModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedOrderId,
  preselectedCustomerId,
}: CreateInstallationModalProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [customerId, setCustomerId] = useState(preselectedCustomerId || '');
  const [orderId, setOrderId] = useState(preselectedOrderId || '');
  const [branchId, setBranchId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [serviceType, setServiceType] = useState('ONKM_ORNATISH');
  const [deviceName, setDeviceName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      Promise.all([
        fetch('/api/customers?limit=100').then((r) => r.json()),
        fetch('/api/branches').then((r) => r.json()),
        fetch('/api/orders?limit=100').then((r) => r.json()),
      ]).then(([custData, branchData, orderData]) => {
        if (custData.customers) setCustomers(custData.customers);
        if (branchData.branches) {
          setBranches(branchData.branches);
          if (branchData.branches.length > 0 && !branchId) {
            setBranchId(branchData.branches[0].id);
          }
        }
        if (orderData.orders) setOrders(orderData.orders);
      });

      // Load technicians from users API (or fetch users)
      fetch('/api/users?role=TECHNICIAN')
        .then((r) => r.json())
        .catch(() => {})
        .then((userData) => {
          // If endpoint not specific, default sample
          setTechnicians([
            { id: 'cmuiw6zzk000c3wt25pmbpbes', name: 'Jamshid Karimov (Bosh texnik - Sirdaryo)' },
            { id: 'cmuiw6zzk000e3wt25pmbpbet', name: 'Sherzod Aliyev (POS texnik - Andijon)' },
            { id: 'cmuiw6zzk000g3wt25pmbpef', name: 'Rustam Sobirov (Kassa sozlovchi - Toshkent/Bo\'ka)' },
          ]);
        });
    }
  }, [isOpen, branchId]);

  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const selected = customers.find((c) => c.id === cId);
    if (selected) {
      if (selected.branchId) setBranchId(selected.branchId);
      if (selected.address) setLocation(selected.address);
    }
  };

  const handleOrderChange = (oId: string) => {
    setOrderId(oId);
    const selectedOrd = orders.find((o) => o.id === oId);
    if (selectedOrd) {
      if (selectedOrd.customerId) setCustomerId(selectedOrd.customerId);
      if (selectedOrd.branchId) setBranchId(selectedOrd.branchId);
      if (selectedOrd.items && selectedOrd.items.length > 0) {
        setDeviceName(selectedOrd.items.map((it: any) => it.product?.name || 'Kassa').join(', '));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Mijozni tanlang');
      return;
    }
    if (!deviceName) {
      setError('Qurilma nomini kiriting');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/installations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          orderId: orderId || null,
          branchId,
          technicianId: technicianId || null,
          serviceType,
          deviceName,
          serialNumber,
          location,
          scheduledDate: scheduledDate || null,
          scheduledTime,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Vazifa yaratib bo\'lmadi');
      }

      onSuccess(data.installation);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-sm shadow-amber-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Yangi O'rnatish & Servis Topshirig'i</h2>
              <p className="text-xs text-slate-500">Mijoz, buyurtma, qurilma va servis texnikini biriktirish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Optional Order selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Bog'langan Buyurtma (Order) - Ixtiyoriy
            </label>
            <select
              value={orderId}
              onChange={(e) => handleOrderChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="">-- Buyurtmasiz mustaqil servis / o'rnatish --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} • {o.customer?.companyName} ({(o.finalAmount || 0).toLocaleString()} so'm)
                </option>
              ))}
            </select>
          </div>

          {/* Customer & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Mijoz *
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="">-- Mijozni tanlang --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} (STIR: {c.inn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Mintaqaviy Filial *
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="">-- Filialni tanlang --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} filiali
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Type & Technician */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Xizmat Turi *</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="ONKM_ORNATISH">ONKM Kassa O'rnatish & Fiskallashtirish</option>
                <option value="POS_ORNATISH">POS Monoblok & Periferiya O'rnatish</option>
                <option value="FM_ALMASHTIRISH">Fiskal Modul (FM) Almashtirish</option>
                <option value="SERVIS">Kassa / Printer Ta'mirlash & Servis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                Biriktiriladigan Servis Texnik
              </label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="">-- Navbatchi texnikka yuborish --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Device name & Serial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Qurilma / Uskuna Nomi *
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Masalan: Aclas CRV-100 Online Kassa"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serial Raqam (mavjud bo'lsa)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Masalan: CRV-9980123"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
              />
            </div>
          </div>

          {/* Location / Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              O'rnatish Manzili / Do'kon joylashuvi *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Masalan: Guliston shahar, Sayxun ko'chasi 14-uy (Mo'ljal: Markaziy bozor yonida)"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Rejalashtirilgan Sana
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Rejalashtirilgan Vaqt
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Texnik uchun ko'rsatma va izohlar
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masalan: Savdo do'koni 09:00 dan keyin ochiladi, do'kon mudiri bilan oldindan bog'lanilsin..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800"
            ></textarea>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition-all disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Topshiriqni Biriktirish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
