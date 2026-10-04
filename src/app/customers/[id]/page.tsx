'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Headphones,
  Cpu,
  Layers,
  ShoppingBag,
  ArrowLeft,
  Copy,
  Check,
  Edit2,
  Plus,
  ExternalLink,
  Store,
  FolderOpen,
  DollarSign,
  HelpCircle,
  History,
  Briefcase,
  Monitor,
  Printer,
  ChevronRight,
  TrendingUp,
  Upload,
  Download,
  Eye,
  FileCheck,
  Wallet,
  Landmark,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [allServicesCatalog, setAllServicesCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedInn, setCopiedInn] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'onkm' | 'fm'>('all');

  // ==========================================
  // 1. Shartnoma Qo'shish (Contract Modal) State
  // ==========================================
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractForm, setContractForm] = useState({
    contractNumber: '',
    contractType: 'ONKM Xizmat Ko\'rsatish',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    amount: '',
    status: 'FAOL',
    notes: '',
  });
  const [contractPdfFile, setContractPdfFile] = useState<File | null>(null);
  const [contractSaving, setContractSaving] = useState(false);
  const [contractError, setContractError] = useState('');

  // ==========================================
  // 2. To'lov Kiritish (Payment Modal) State
  // ==========================================
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'NAQD', // NAQD, BANK, CLICK, PAYME, HUMO_UZCARD, ELEKTRON
    paymentNumber: '',
    paidAt: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // ==========================================
  // 3. Savdo Nuqtasi Yaratish (Outlet Modal) State
  // ==========================================
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [outletForm, setOutletForm] = useState({
    name: '',
    address: '',
    phone: '',
    landmark: '',
    status: 'FAOL',
  });
  const [editingOutletId, setEditingOutletId] = useState<string | null>(null);
  const [outletSaving, setOutletSaving] = useState(false);
  const [outletError, setOutletError] = useState('');

  // ==========================================
  // 3.5. Qurilma va FM Tahrirlash (Edit Device Modal) State
  // ==========================================
  const [isEditDeviceModalOpen, setIsEditDeviceModalOpen] = useState(false);
  const [editDeviceForm, setEditDeviceForm] = useState({
    deviceType: 'ONKM' as 'ONKM' | 'FM',
    id: '',
    serialNumber: '',
    kkmSerialNumber: '',
    outletName: '',
    userName: '',
    status: 'O\'RNATILDI',
    installedAt: '',
    registeredAt: '',
    warrantyEndDate: '',
    customNotes: '',
  });
  const [editDeviceSaving, setEditDeviceSaving] = useState(false);
  const [editDeviceError, setEditDeviceError] = useState('');

  // ==========================================
  // 4. Qurilma va FM Biriktirish (Device Modal) State
  // ==========================================
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [availableDevicesData, setAvailableDevicesData] = useState<{
    availableSerials: any[];
    availableFiscalModules: any[];
    outlets: any[];
  }>({ availableSerials: [], availableFiscalModules: [], outlets: [] });
  const [deviceForm, setDeviceForm] = useState({
    onkmSerialId: '',
    customOnkmSerial: '',
    fmModuleId: '',
    customFmSerial: '',
    outletName: '',
    userName: 'Admin (Yetakchi menejer)',
    installedAt: new Date().toISOString().split('T')[0],
    warrantyMonths: 12,
    notes: '',
  });
  const [deviceSaving, setDeviceSaving] = useState(false);
  const [deviceError, setDeviceError] = useState('');

  // ==========================================
  // 5. Hujjat Yuklash (Document Modal) State
  // ==========================================
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    docType: 'SHARTNOMA', // SHARTNOMA, GUVOHNOMA, IJARA, KADASTR, AKT, BOSHQA
    fileNumber: '',
    issuedDate: new Date().toISOString().split('T')[0],
  });
  const [docPdfFile, setDocPdfFile] = useState<File | null>(null);
  const [docSaving, setDocSaving] = useState(false);
  const [docError, setDocError] = useState('');

  // ==========================================
  // 6. Xizmat Biriktirish & Qo'shish (Service Modal) State
  // ==========================================
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    serviceId: '',
    outletId: '',
    customServiceName: '',
    customPrice: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [selectedCatalogService, setSelectedCatalogService] = useState<any | null>(null);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceError, setServiceError] = useState('');

  // Open Service Modal
  const openServiceModal = () => {
    setServiceError('');
    const defaultOutletId = customer?.outlets?.[0]?.id || 'ALL';
    const firstService = allServicesCatalog?.[0] || null;
    setSelectedCatalogService(firstService);
    setServiceForm({
      serviceId: firstService?.id || '',
      outletId: defaultOutletId,
      customServiceName: '',
      customPrice: firstService?.price ? String(firstService.price) : '',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsServiceModalOpen(true);
  };

  const handleServiceSelectChange = (serviceId: string) => {
    if (serviceId === 'CUSTOM') {
      setSelectedCatalogService(null);
      setServiceForm((prev) => ({
        ...prev,
        serviceId: 'CUSTOM',
        customServiceName: '',
        customPrice: '',
      }));
    } else {
      const srv = allServicesCatalog.find((s: any) => s.id === serviceId);
      setSelectedCatalogService(srv || null);
      setServiceForm((prev) => ({
        ...prev,
        serviceId,
        customServiceName: srv?.name || '',
        customPrice: srv?.price ? String(srv.price) : '',
      }));
    }
  };

  // Save Customer Service (Assign service & deduct price from balance)
  const handleSaveCustomerService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setServiceSaving(true);
      setServiceError('');

      const res = await fetch(`/api/customers/${customerId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setServiceError(data.error || 'Xizmatni biriktirishda xatolik');
        return;
      }

      setIsServiceModalOpen(false);
      fetchCustomerDetail();
      alert(data.message || 'Xizmat muvaffaqiyatli biriktirildi va to\'lov balansdan yechildi!');
    } catch (err: any) {
      setServiceError(err.message || 'Xatolik yuz berdi');
    } finally {
      setServiceSaving(false);
    }
  };

  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) {
        if (res.status === 404) alert('Mijoz topilmadi');
        router.push('/customers');
        return;
      }
      const data = await res.json();
      setCustomer(data.customer);
      setHistory(data.history || []);
      setAllServicesCatalog(data.allServicesCatalog || []);
    } catch (err) {
      console.error('Failed to load customer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetail();
    }
  }, [customerId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInn(true);
    setTimeout(() => setCopiedInn(false), 2000);
  };

  // Helper file uploader
  const uploadPdfFile = async (file: File, folder: string = 'documents') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Faylni yuklashda xatolik');
    return data;
  };

  // Open Contract Modal
  const openContractModal = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setContractForm({
      contractNumber: `SH-${new Date().getFullYear()}-${rand}`,
      contractType: 'ONKM Xizmat Ko\'rsatish',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      amount: '840000',
      status: 'FAOL',
      notes: '',
    });
    setContractPdfFile(null);
    setContractError('');
    setIsContractModalOpen(true);
  };

  // Save Contract
  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setContractSaving(true);
      setContractError('');

      let fileUrl = null;
      if (contractPdfFile) {
        const uploadRes = await uploadPdfFile(contractPdfFile, 'contracts');
        fileUrl = uploadRes.fileUrl;
      }

      const res = await fetch(`/api/customers/${customerId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contractForm,
          fileUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setContractError(data.error || 'Shartnomani saqlashda xatolik');
        return;
      }

      setIsContractModalOpen(false);
      fetchCustomerDetail();
    } catch (err: any) {
      setContractError(err.message || 'Xatolik yuz berdi');
    } finally {
      setContractSaving(false);
    }
  };

  // Open Payment Modal
  const openPaymentModal = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPaymentForm({
      amount: customer?.debt > 0 ? customer.debt.toString() : '70000',
      method: 'NAQD',
      paymentNumber: `KVT-${Date.now().toString().slice(-6)}`,
      paidAt: new Date().toISOString().split('T')[0],
      notes: 'Oylik abonent to\'lovi',
    });
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  // Save Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPaymentSaving(true);
      setPaymentError('');

      const res = await fetch(`/api/customers/${customerId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || 'To\'lovni kiritishda xatolik');
        return;
      }

      setIsPaymentModalOpen(false);
      fetchCustomerDetail();
    } catch (err: any) {
      setPaymentError(err.message || 'Xatolik yuz berdi');
    } finally {
      setPaymentSaving(false);
    }
  };

  // Open Outlet Modal (Create or Edit)
  const openOutletModal = (outlet?: any) => {
    if (outlet && outlet.id) {
      setEditingOutletId(outlet.id);
      setOutletForm({
        name: outlet.name || '',
        address: outlet.address || '',
        phone: outlet.phone || '',
        landmark: outlet.landmark || '',
        status: outlet.status || 'FAOL',
      });
    } else {
      setEditingOutletId(null);
      setOutletForm({
        name: '',
        address: customer?.address || '',
        phone: customer?.phone || '',
        landmark: '',
        status: 'FAOL',
      });
    }
    setOutletError('');
    setIsOutletModalOpen(true);
  };

  // Save Outlet (Create or Update)
  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setOutletSaving(true);
      setOutletError('');

      const method = editingOutletId ? 'PUT' : 'POST';
      const bodyPayload = editingOutletId
        ? { id: editingOutletId, ...outletForm }
        : outletForm;

      const res = await fetch(`/api/customers/${customerId}/outlets`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        setOutletError(data.error || 'Savdo nuqtasini saqlashda xatolik');
        return;
      }

      setIsOutletModalOpen(false);
      setEditingOutletId(null);
      fetchCustomerDetail();
    } catch (err: any) {
      setOutletError(err.message || 'Xatolik yuz berdi');
    } finally {
      setOutletSaving(false);
    }
  };

  // Open Edit Device Modal (ONKM or FM)
  const openEditDeviceModal = (item: any, type: 'ONKM' | 'FM') => {
    setEditDeviceError('');
    const outletName = item.notes?.includes('Savdo nuqtasi:')
      ? item.notes.split('Savdo nuqtasi:')[1]?.split('|')[0]?.trim()
      : (customer?.outlets?.[0]?.name || 'Markaziy savdo nuqtasi');

    const userName = item.notes?.includes('Biriktirdi:')
      ? item.notes.split('Biriktirdi:')[1]?.split('|')[0]?.trim()
      : (customer?.manager?.name || 'Bobur Mirzayev (Admin)');

    let installedAtStr = '';
    if (item.installedAt) {
      installedAtStr = new Date(item.installedAt).toISOString().split('T')[0];
    } else {
      installedAtStr = new Date().toISOString().split('T')[0];
    }

    let registeredAtStr = '';
    if (item.registeredAt) {
      registeredAtStr = new Date(item.registeredAt).toISOString().split('T')[0];
    }

    let warrantyStr = '';
    if (item.warrantyEndDate) {
      warrantyStr = new Date(item.warrantyEndDate).toISOString().split('T')[0];
    }

    setEditDeviceForm({
      deviceType: type,
      id: item.id,
      serialNumber: item.serialNumber || '',
      kkmSerialNumber: item.kkmSerialNumber || '',
      outletName,
      userName,
      status: item.status || 'O\'RNATILDI',
      installedAt: installedAtStr,
      registeredAt: registeredAtStr,
      warrantyEndDate: warrantyStr,
      customNotes: '',
    });
    setIsEditDeviceModalOpen(true);
  };

  // Save Edited Device (ONKM or FM)
  const handleSaveEditDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEditDeviceSaving(true);
      setEditDeviceError('');

      const res = await fetch(`/api/customers/${customerId}/devices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDeviceForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditDeviceError(data.error || 'Qurilma ma\'lumotlarini yangilashda xatolik');
        return;
      }

      setIsEditDeviceModalOpen(false);
      fetchCustomerDetail();
    } catch (err: any) {
      setEditDeviceError(err.message || 'Xatolik yuz berdi');
    } finally {
      setEditDeviceSaving(false);
    }
  };

  // Open Device & FM Modal
  const openDeviceModal = async () => {
    try {
      setDeviceError('');
      const res = await fetch(`/api/customers/${customerId}/devices`);
      const data = await res.json();
      if (data.success) {
        setAvailableDevicesData({
          availableSerials: data.availableSerials || [],
          availableFiscalModules: data.availableFiscalModules || [],
          outlets: data.outlets || [],
        });

        const firstOutletName = data.outlets?.[0]?.name || (customer?.outlets?.[0]?.name ?? 'Markaziy savdo nuqtasi');
        const firstSerialId = data.availableSerials?.[0]?.id || '';
        const firstFmId = data.availableFiscalModules?.[0]?.id || '';

        const defaultUserName = customer?.manager?.name || 'Bobur Mirzayev (Admin)';
        setDeviceForm({
          onkmSerialId: firstSerialId,
          customOnkmSerial: '',
          fmModuleId: firstFmId,
          customFmSerial: '',
          outletName: firstOutletName,
          userName: defaultUserName,
          installedAt: new Date().toISOString().split('T')[0],
          warrantyMonths: 12,
          notes: '',
        });
      }
      setIsDeviceModalOpen(true);
    } catch (err) {
      console.error('Failed to load available devices:', err);
    }
  };

  // Save Device & FM
  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDeviceSaving(true);
      setDeviceError('');

      const res = await fetch(`/api/customers/${customerId}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setDeviceError(data.error || 'Qurilmani biriktirishda xatolik');
        return;
      }

      setIsDeviceModalOpen(false);
      fetchCustomerDetail();
    } catch (err: any) {
      setDeviceError(err.message || 'Xatolik yuz berdi');
    } finally {
      setDeviceSaving(false);
    }
  };

  // Open Document Modal
  const openDocModal = () => {
    setDocForm({
      title: '',
      docType: 'SHARTNOMA',
      fileNumber: `DOC-${Date.now().toString().slice(-5)}`,
      issuedDate: new Date().toISOString().split('T')[0],
    });
    setDocPdfFile(null);
    setDocError('');
    setIsDocModalOpen(true);
  };

  // Save Document
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDocSaving(true);
      setDocError('');

      let fileUrl = null;
      let fileSize = '1.2 MB';

      if (docPdfFile) {
        const uploadRes = await uploadPdfFile(docPdfFile, 'documents');
        fileUrl = uploadRes.fileUrl;
        fileSize = uploadRes.fileSize;
      }

      const res = await fetch(`/api/customers/${customerId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...docForm,
          fileUrl,
          fileSize,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDocError(data.error || 'Hujjatni saqlashda xatolik');
        return;
      }

      setIsDocModalOpen(false);
      fetchCustomerDetail();
    } catch (err: any) {
      setDocError(err.message || 'Xatolik yuz berdi');
    } finally {
      setDocSaving(false);
    }
  };

  // Hisoblash: Faqat ONKM va FM ikkalasi biriktirilgandagina 1 ta to'liq qurilma deb hisoblanadi.
  // Faqat ONKM yoki faqat FM ni o'zi 1 ta deb hisoblanmaydi!
  const getPairedDevicesCount = () => {
    if (!customer) return 0;
    const onkmList = customer.productSerials || [];
    const fmList = customer.fiscalModules || [];
    if (onkmList.length === 0 || fmList.length === 0) return 0;

    const onkmSerials = new Set(onkmList.map((s: any) => s.serialNumber?.trim().toLowerCase()));
    const matched = fmList.filter((fm: any) =>
      fm.kkmSerialNumber && onkmSerials.has(fm.kkmSerialNumber.trim().toLowerCase())
    ).length;

    if (matched > 0) return matched;
    return Math.min(onkmList.length, fmList.length);
  };

  const tabs = [
    { id: 'overview', name: 'Umumiy', count: null },
    { id: 'contracts', name: 'Shartnomalar', count: customer?.contracts?.length || 0 },
    { id: 'payments', name: 'To\'lovlar', count: customer?.payments?.length || 0 },
    { id: 'outlets', name: 'Savdo nuqtalari', count: customer?.outlets?.length || 0 },
    {
      id: 'devices',
      name: 'ONKM & FM',
      count: getPairedDevicesCount(),
    },
    { id: 'documents', name: 'Hujjatlar', count: customer?.documents?.length || 0 },
    { id: 'services', name: 'Xizmatlar', count: customer?.services?.length || 0 },
    { id: 'support', name: 'Support', count: customer?.supportTickets?.length || 0 },
    { id: 'invoices', name: 'Hisob-fakturalar', count: customer?.invoices?.length || 0 },
    { id: 'cases', name: 'Keyslar', count: customer?.cases?.length || 0 },
    { id: 'history', name: 'Tarix', count: history.length },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Mijoz kartochkasi yuklanmoqda...
        </div>
      </AppLayout>
    );
  }

  if (!customer) return null;

  return (
    <AppLayout>
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Mijozlar Ro'yxatiga Qaytish</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Tahrirlash</span>
          </button>

          <button
            onClick={openPaymentModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>To'lov Kiritish</span>
          </button>
        </div>
      </div>

      {/* 🟢 TOP STATUS PANEL: Customer State Summary */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Mijoz holati */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mijoz Holati</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {customer.status}
            </span>
          </div>

          {/* Mijoz Balansi */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mijoz Balansi</span>
            <span className={`text-xs font-extrabold ${customer.balance > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
              {new Intl.NumberFormat('uz-UZ').format(customer.balance || 0)} so'm
            </span>
          </div>

          {/* Qarzdorlik */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Qarzdorlik</span>
            <span className={`text-xs font-extrabold ${customer.debt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {customer.debt > 0
                ? `${new Intl.NumberFormat('uz-UZ').format(customer.debt)} so'm`
                : 'Qarz yo\'q'}
            </span>
          </div>

          {/* To'liq Qurilmalar (ONKM + FM) */}
          <div className="pt-2 sm:pt-0 sm:px-2 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">To'liq Qurilma (ONKM+FM)</span>
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              🖥🧩 {getPairedDevicesCount()} ta qurilma
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">
              ({customer.productSerials?.length || 0} ONKM / {customer.fiscalModules?.length || 0} FM)
            </span>
          </div>

          {/* Ochiq support */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ochiq Support</span>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
              🎫 {customer.supportTickets?.filter((t: any) => t.status !== 'YOPILDI').length || 0} ta ticket
            </span>
          </div>

          {/* Savdo Nuqtalari */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Savdo Nuqtalari</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              🏪 {customer.outlets?.length || 0} ta filial
            </span>
          </div>

          {/* Shartnomalar */}
          <div className="pt-2 sm:pt-0 sm:px-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Shartnomalar</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              📑 {customer.contracts?.length || 0} ta faol
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Left Customer Profile | Right Consolidated Tabs */}
      <div className="flex flex-col md:flex-row items-start gap-5 w-full">
        {/* CHAP TOMON: Mijoz Rekvizitlari & Kartochkasi (Ixcham va doimiy yonma-yon) */}
        <div className="w-full md:w-[320px] lg:w-[340px] shrink-0 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {customer.companyType}
                </span>
                <h2 className="text-base font-extrabold text-slate-900 mt-1 leading-snug">
                  {customer.companyName}
                </h2>
                {customer.tradeMark && (
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">
                    Brend: {customer.tradeMark}
                  </div>
                )}
              </div>
            </div>

            {/* Rekvizitlar ro'yxati */}
            <div className="space-y-3 text-xs">
              {/* STIR with Copy Button */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">STIR (INN)</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{customer.inn}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(customer.inn)}
                  title="STIR nusxasini olish"
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-all cursor-pointer"
                >
                  {copiedInn ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Faoliyat turi & OKED */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Faoliyat turi</span>
                  <span className="font-medium text-slate-800 truncate block">
                    {customer.activityType || 'Ko\'rsatilmagan'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">OKED Kodi</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {customer.oked || '—'}
                  </span>
                </div>
              </div>

              {/* Manzil */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Yuridik Manzil</span>
                <div className="flex items-start gap-1.5 text-slate-700 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{customer.address}</span>
                </div>
              </div>

              {/* Telefon & Email */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Telefon</span>
                  <div className="flex items-center gap-1 text-slate-800 font-mono font-semibold">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{customer.phone}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                  <div className="flex items-center gap-1 text-slate-800 font-mono truncate">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{customer.email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Bank & Hisob raqam */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Rekvizitlari</span>
                <div className="font-semibold text-slate-800 mt-0.5">{customer.bank || 'Bank ko\'rsatilmagan'}</div>
                <div className="font-mono text-[11px] text-slate-600 mt-0.5">
                  H/R: {customer.accountNumber || '—'}
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  MFO: {customer.mfo || '—'}
                </div>
              </div>

              {/* Mas'ullar */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Direktor</span>
                  <span className="font-semibold text-slate-800">{customer.director || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mas'ul Shaxs</span>
                  <span className="font-semibold text-slate-800">{customer.contactPerson || '—'}</span>
                </div>
              </div>

              {/* Filial & Menejer */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Biriktirilgan Filial</span>
                  <span className="font-bold text-blue-600">{customer.branch?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mas'ul Menejer</span>
                  <span className="font-semibold text-slate-800">{customer.manager?.name || 'Menejer'}</span>
                </div>
              </div>

              {/* Statuslar & Ro'yxatdan o'tgan sana */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>OFD: <strong className="text-emerald-600">{customer.ofdStatus}</strong></span>
                <span>Ro'yxat: {new Date(customer.createdAt).toLocaleDateString('uz-UZ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* O'NG TOMON: IXCHAM TABLAR VA FUNKSIONAL BO'LIMLAR */}
        <div className="flex-1 w-full min-w-0 flex flex-col">
          {/* Scrollable Tabs Navigation Bar */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-1.5 shadow-sm mb-4 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.name}</span>
                    {tab.count !== null && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB CONTENTS CONTAINER */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex-1">
            {/* 1. UMUMIY TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Mijoz Umumiy Ko'rsatkichlari</h3>
                  <p className="text-xs text-slate-500">
                    Kompaniya bo'yicha integratsiya qilingan barcha kassa, fiskal modul va shartnomalar xulosasi
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                    <span className="text-[11px] font-bold text-blue-700 uppercase">Jami Xaridlar</span>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {new Intl.NumberFormat('uz-UZ').format(
                        customer.orders?.reduce((acc: number, o: any) => acc + o.finalAmount, 0) || 0
                      )}{' '}
                      so'm
                    </div>
                    <span className="text-[11px] text-slate-500">{customer.orders?.length || 0} ta buyurtma</span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">To'langan Summa</span>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {new Intl.NumberFormat('uz-UZ').format(
                        customer.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0
                      )}{' '}
                      so'm
                    </div>
                    <span className="text-[11px] text-slate-500">{customer.payments?.length || 0} ta to'lov</span>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[11px] font-bold text-purple-700 uppercase">To'liq Qurilmalar</span>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {getPairedDevicesCount()} ta komplekt
                    </div>
                    <span className="text-[11px] text-slate-500">
                      ONKM kassa va FM biriktirilgan (1 dona komplekt)
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Oxirgi Harakatlar</h4>
                  <div className="space-y-2">
                    {customer.orders?.slice(0, 3).map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-blue-600">{ord.orderNumber}</span> —{' '}
                          {new Intl.NumberFormat('uz-UZ').format(ord.finalAmount)} so'm
                          <div className="text-[11px] text-slate-400">Buyurtma holati: {ord.status}</div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. SHARTNOMALAR TAB (PDF YUKLASH IMKONI BILAN) */}
            {activeTab === 'contracts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Tuzilgan Shartnomalar ({customer.contracts?.length || 0})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mijoz bilan tuzilgan barcha shartnomalar va ularning PDF nusxalari
                    </p>
                  </div>
                  <button
                    onClick={openContractModal}
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm shadow-blue-600/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Shartnoma Qo'shish</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Shartnoma №</th>
                        <th className="py-2.5 px-3">Xizmat Turi</th>
                        <th className="py-2.5 px-3">Muddati</th>
                        <th className="py-2.5 px-3">Summasi</th>
                        <th className="py-2.5 px-3">Fayl (PDF)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customer.contracts && customer.contracts.length > 0 ? (
                        customer.contracts.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 font-bold text-blue-600">{c.contractNumber}</td>
                            <td className="py-3 px-3 font-medium text-slate-800">{c.contractType}</td>
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {new Date(c.startDate).toLocaleDateString('uz-UZ')} —{' '}
                              {c.endDate ? new Date(c.endDate).toLocaleDateString('uz-UZ') : 'Muddatsiz'}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {new Intl.NumberFormat('uz-UZ').format(c.amount)} so'm
                            </td>
                            <td className="py-3 px-3">
                              {c.fileUrl ? (
                                <a
                                  href={c.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors border border-blue-200"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  <span>PDF Ko'rish</span>
                                  <ExternalLink className="w-3 h-3 text-blue-400" />
                                </a>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">PDF yuklanmagan</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Shartnomalar mavjud emas. Yuqoridagi tugma orqali shartnoma qo'shing.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. TO'LOVLAR TAB (NAQD, BANK, ELEKTRON TO'LOV TANLOVLARI) */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Qilingan To'lovlar Tarixi ({customer.payments?.length || 0})
                    </h3>
                    <p className="text-xs text-slate-500">Naqd, bank o'tkazmasi va elektron to'lovlar kvitansiyalari</p>
                  </div>
                  <button
                    onClick={openPaymentModal}
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ To'lov Qabul Qilish</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Kvitansiya №</th>
                        <th className="py-2.5 px-3">Summasi</th>
                        <th className="py-2.5 px-3">To'lov Usuli</th>
                        <th className="py-2.5 px-3">Qabul Qildi</th>
                        <th className="py-2.5 px-3">Sana</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customer.payments && customer.payments.length > 0 ? (
                        customer.payments.map((p: any) => {
                          const isServiceDeduction =
                            p.method === 'BALANSDAN_YECHILDI' ||
                            p.method === 'XIZMAT_HAQI' ||
                            p.paymentNumber?.startsWith('XIZ-') ||
                            p.paymentNumber?.startsWith('SRV-') ||
                            p.notes?.toLowerCase().includes('xizmat haqi');

                          const getMethodBadge = (m: string) => {
                            if (isServiceDeduction) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                                  <span>🔻</span>
                                  <span>Xizmat uchun yechildi</span>
                                </span>
                              );
                            }
                            switch (m) {
                              case 'NAQD':
                                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">💵 Naqd pul</span>;
                              case 'BANK':
                                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">🏦 Pul ko'chirish</span>;
                              case 'CLICK':
                                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">⚡ Click</span>;
                              case 'PAYME':
                                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">📱 Payme</span>;
                              case 'HUMO_UZCARD':
                                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">💳 Karta (Humo/Uzcard)</span>;
                              default:
                                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">🌐 {m}</span>;
                            }
                          };

                          return (
                            <tr
                              key={p.id}
                              className={`transition-colors ${
                                isServiceDeduction
                                  ? 'bg-rose-50/30 hover:bg-rose-50/60 border-l-4 border-l-rose-500'
                                  : 'hover:bg-slate-50/70'
                              }`}
                            >
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-bold ${isServiceDeduction ? 'text-rose-800' : 'text-slate-800'}`}>
                                    {p.paymentNumber}
                                  </span>
                                  {isServiceDeduction && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                      XIZMAT
                                    </span>
                                  )}
                                </div>
                                {p.notes && (
                                  <div className={`text-[10px] mt-0.5 ${isServiceDeduction ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
                                    {p.notes}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <div className={`font-black text-sm tracking-tight ${
                                  isServiceDeduction ? 'text-rose-600' : 'text-emerald-600'
                                }`}>
                                  {isServiceDeduction ? '-' : '+'} {new Intl.NumberFormat('uz-UZ').format(p.amount)} so'm
                                </div>
                                {isServiceDeduction && (
                                  <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wide">
                                    Balansdan yechildi
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3">{getMethodBadge(p.method)}</td>
                              <td className="py-3 px-3 text-slate-600 font-medium">{p.receivedBy?.name || 'Tizim'}</td>
                              <td className="py-3 px-3 font-mono text-slate-500">
                                {new Date(p.paidAt).toLocaleDateString('uz-UZ')}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isServiceDeduction
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {isServiceDeduction ? 'YECHILGAN' : p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            To'lovlar kiritilmagan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. SAVDO NUQTALARI TAB (FILIAL NOMI, MANZILI, TELEFONI, MO'LJALI) */}
            {activeTab === 'outlets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Savdo Nuqtalari va Filiallari ({customer.outlets?.length || 0})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mijozning barcha savdo shoxobchalari, do'konlari va kassalari
                    </p>
                  </div>
                  <button
                    onClick={openOutletModal}
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm shadow-blue-600/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Nuqta Qo'shish</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.outlets && customer.outlets.length > 0 ? (
                    customer.outlets.map((out: any) => (
                      <div
                        key={out.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                              <Store className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-900 text-xs">{out.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {out.status}
                            </span>
                            <button
                              onClick={() => openOutletModal(out)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="Savdo nuqtasini tahrirlash"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span>{out.address}</span>
                          </div>
                          {out.landmark && (
                            <div className="text-[11px] text-slate-500 pl-5">
                              Mo'ljal: <strong>{out.landmark}</strong>
                            </div>
                          )}
                          {out.phone && (
                            <div className="flex items-center gap-1.5 pl-5 font-mono text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{out.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      Savdo nuqtalari mavjud emas. Yuqoridagi "+ Nuqta Qo'shish" tugmasini bosing.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5 & 6. ONKM & FM (QURILMA VA FM BIRIKTIRISH) TAB */}
            {activeTab === 'devices' && (
              <div className="space-y-6">
                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">ONKM va Fiskal Modullar (FM)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mijozga biriktirilgan onlayn kassa mashinalari va DSQ ro'yxatidan o'tgan fiskal modullar
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                      onClick={openDeviceModal}
                      className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm shadow-blue-600/30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Qurilma & FM Biriktirish</span>
                    </button>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => setDeviceFilter('all')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          deviceFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Barchasi ({(customer.productSerials?.length || 0) + (customer.fiscalModules?.length || 0)})
                      </button>
                      <button
                        onClick={() => setDeviceFilter('onkm')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          deviceFilter === 'onkm'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🖥 ONKM ({customer.productSerials?.length || 0})
                      </button>
                      <button
                        onClick={() => setDeviceFilter('fm')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          deviceFilter === 'fm'
                            ? 'bg-white text-purple-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🧩 FM ({customer.fiscalModules?.length || 0})
                      </button>
                    </div>
                  </div>
                </div>

                {/* ONKM Ro'yxati */}
                {(deviceFilter === 'all' || deviceFilter === 'onkm') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Online Kassa Apparatlari ({customer.productSerials?.length || 0} ta)
                        </h4>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Seriya Raqami</th>
                            <th className="py-2.5 px-3">Kassa Modeli</th>
                            <th className="py-2.5 px-3">Savdo Nuqtasi</th>
                            <th className="py-2.5 px-3">Biriktirgan Mas'ul</th>
                            <th className="py-2.5 px-3">O'rnatilgan Sana</th>
                            <th className="py-2.5 px-3">Kafolat Tugashi</th>
                            <th className="py-2.5 px-3 text-center">Holati</th>
                            <th className="py-2.5 px-3 text-center">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customer.productSerials && customer.productSerials.length > 0 ? (
                            customer.productSerials.map((sn: any) => (
                              <tr key={sn.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-3 font-mono font-bold text-blue-600">{sn.serialNumber}</td>
                                <td className="py-3 px-3 font-medium text-slate-800">
                                  {sn.product?.name || 'ONKM Qurilma'}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                    {sn.notes?.includes('Savdo nuqtasi:')
                                      ? sn.notes.split('Savdo nuqtasi:')[1]?.split('|')[0]?.trim()
                                      : 'Asosiy savdo nuqtasi'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                      👤
                                    </span>
                                    <span className="font-semibold text-slate-800 whitespace-nowrap">
                                      {sn.notes?.includes('Biriktirdi:')
                                        ? sn.notes.split('Biriktirdi:')[1]?.split('|')[0]?.trim()
                                        : (customer.manager?.name || 'Bobur Mirzayev (Admin)')}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-500">
                                  {sn.installedAt ? new Date(sn.installedAt).toLocaleDateString('uz-UZ') : '—'}
                                </td>
                                <td className="py-3 px-3 font-mono text-emerald-600">
                                  {sn.warrantyEndDate ? new Date(sn.warrantyEndDate).toLocaleDateString('uz-UZ') : '—'}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {sn.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => openEditDeviceModal(sn, 'ONKM')}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-[11px]"
                                    title="Tahrirlash"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Tahrirlash</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-slate-400">
                                Biriktirilgan ONKM qurilmasi yo'q. Yuqoridagi "+ Qurilma & FM Biriktirish" tugmasini bosing.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* FM (Fiskal Modullar) Ro'yxati */}
                {(deviceFilter === 'all' || deviceFilter === 'fm') && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Fiskal Modullar (FM) ({customer.fiscalModules?.length || 0} ta)
                        </h4>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">FM Seriya Raqami</th>
                            <th className="py-2.5 px-3">Ulangan KKM</th>
                            <th className="py-2.5 px-3">Savdo Nuqtasi</th>
                            <th className="py-2.5 px-3">Biriktirgan Mas'ul</th>
                            <th className="py-2.5 px-3">DSQ Ro'yxat Sanasi</th>
                            <th className="py-2.5 px-3">Kafolat</th>
                            <th className="py-2.5 px-3 text-center">Holati</th>
                            <th className="py-2.5 px-3 text-center">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customer.fiscalModules && customer.fiscalModules.length > 0 ? (
                            customer.fiscalModules.map((fm: any) => (
                              <tr key={fm.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-3 font-mono font-bold text-purple-600">{fm.serialNumber}</td>
                                <td className="py-3 px-3 font-mono text-slate-700">{fm.kkmSerialNumber || '—'}</td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                    {fm.notes?.includes('Savdo nuqtasi:')
                                      ? fm.notes.split('Savdo nuqtasi:')[1]?.split('|')[0]?.trim()
                                      : 'Asosiy savdo nuqtasi'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                                      👤
                                    </span>
                                    <span className="font-semibold text-slate-800 whitespace-nowrap">
                                      {fm.notes?.includes('Biriktirdi:')
                                        ? fm.notes.split('Biriktirdi:')[1]?.split('|')[0]?.trim()
                                        : (customer.manager?.name || 'Bobur Mirzayev (Admin)')}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-500">
                                  {fm.registeredAt ? new Date(fm.registeredAt).toLocaleDateString('uz-UZ') : '—'}
                                </td>
                                <td className="py-3 px-3 font-mono text-emerald-600">
                                  {fm.warrantyEndDate ? new Date(fm.warrantyEndDate).toLocaleDateString('uz-UZ') : '—'}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                                    {fm.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => openEditDeviceModal(fm, 'FM')}
                                    className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-[11px]"
                                    title="Tahrirlash"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Tahrirlash</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-slate-400">
                                Ro'yxatdan o'tgan fiskal modul yo'q.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 8. HUJJATLAR TAB (SHARTNOMA, GUVOHNOMA, IJARA, KADASTR TANLOVI VA PDF YUKLASH) */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Elektron Hujjatlar va Sertifikatlar ({customer.documents?.length || 0})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Guvohnoma, Ijara, Kadastr, Shartnoma va boshqa PDF hujjatlar arxivi
                    </p>
                  </div>
                  <button
                    onClick={openDocModal}
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm shadow-blue-600/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Hujjat Qo'shish</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {customer.documents && customer.documents.length > 0 ? (
                    customer.documents.map((doc: any) => {
                      const getDocTypeBadge = (t: string) => {
                        switch (t) {
                          case 'GUVOHNOMA':
                            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">📜 Guvohnoma</span>;
                          case 'SHARTNOMA':
                            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">📑 Shartnoma</span>;
                          case 'IJARA':
                            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">🏢 Ijara Shartnomasi</span>;
                          case 'KADASTR':
                            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">🗺 Kadastr Hujjati</span>;
                          case 'AKT':
                            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">📋 Qabul Akti</span>;
                          default:
                            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">🔖 {t}</span>;
                        }
                      };

                      return (
                        <div
                          key={doc.id}
                          className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{doc.title}</span>
                                {getDocTypeBadge(doc.docType)}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Hujjat № {doc.fileNumber || '—'} • {doc.fileSize || 'PDF'}
                              </div>
                            </div>
                          </div>
                          {doc.fileUrl ? (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ochish</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => alert(`Hujjat ko'rilmoqda: ${doc.title}`)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold transition-colors"
                            >
                              Ochish
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      Hujjatlar yuklanmagan. "+ Hujjat Qo'shish" tugmasi orqali PDF faylni yuklang.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 11. XIZMATLAR TAB (MOLIYA XIZMATLARIDAN FOYDALANISH VA SAVDO NUQTASIGA BIRIKTIRISH) */}
            {activeTab === 'services' && (
              <div className="space-y-5">
                {/* Header & Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100/80 rounded-2xl p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Mijozga Biriktirilgan Xizmatlar ({customer.services?.length || 0})
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        Katalog & Savdo Nuqtalari
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Moliya bo'limidagi narxnomadan xizmat tanlab, mijozning savdo nuqtasiga biriktiring. Narx avtomatik balansdan yechiladi.
                    </p>
                  </div>

                  <button
                    onClick={openServiceModal}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-blue-600/30 cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Xizmat Qo'shish</span>
                  </button>
                </div>

                {/* Balance & Financial Context Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Mijoz Balansi</span>
                    <div className="text-base font-extrabold text-emerald-600">
                      {new Intl.NumberFormat('uz-UZ').format(customer.balance || 0)} so'm
                    </div>
                    <span className="text-[11px] text-slate-400">Xizmatlar haqi shu hisobdan yechiladi</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Qarzdorlik</span>
                    <div className={`text-base font-extrabold ${customer.debt > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {customer.debt > 0 ? `${new Intl.NumberFormat('uz-UZ').format(customer.debt)} so'm` : '0 so\'m'}
                    </div>
                    <span className="text-[11px] text-slate-400">Muddati o'tgan yoki qarz summalar</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Savdo Nuqtalari Soni</span>
                    <div className="text-base font-extrabold text-blue-600">
                      {customer.outlets?.length || 0} ta filial
                    </div>
                    <span className="text-[11px] text-slate-400">Har bir xizmat muayyan nuqtaga bog'lanadi</span>
                  </div>
                </div>

                {/* Services Table */}
                <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Xizmat Nomi</th>
                        <th className="py-2.5 px-3">Biriktirilgan Savdo Nuqtasi</th>
                        <th className="py-2.5 px-3">Narxi (Yechilgan)</th>
                        <th className="py-2.5 px-3">Biriktirgan Xodim</th>
                        <th className="py-2.5 px-3">Boshlanish Sanasi</th>
                        <th className="py-2.5 px-3 text-center">Holati</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customer.services && customer.services.length > 0 ? (
                        customer.services.map((srv: any) => (
                          <tr key={srv.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{srv.serviceName}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {srv.serviceType || 'ABONENT'} {srv.notes ? `• ${srv.notes}` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                <Store className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>{srv.outletName || customer.outlets?.[0]?.name || 'Asosiy filial'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-extrabold text-slate-900 font-mono">
                                {new Intl.NumberFormat('uz-UZ').format(srv.price || srv.monthlyFee || 0)} so'm
                              </div>
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                ✓ Balansdan yechildi
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-slate-700 font-medium">
                                {srv.createdByName || customer.manager?.name || 'Menejer'}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {srv.startDate ? new Date(srv.startDate).toLocaleDateString('uz-UZ') : new Date(srv.createdAt).toLocaleDateString('uz-UZ')}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {srv.status || 'FAOL'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            <div className="max-w-sm mx-auto space-y-2">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                                <Briefcase className="w-5 h-5" />
                              </div>
                              <div className="font-semibold text-slate-700">Hozircha biriktirilgan xizmatlar mavjud emas</div>
                              <p className="text-[11px] text-slate-400">
                                Moliya bo'limida yaratilgan xizmatlarni mijozning savdo nuqtalariga biriktirish uchun yuqoridagi <strong>"+ Xizmat Qo'shish"</strong> tugmasini bosing.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 13. SUPPORT TAB */}
            {activeTab === 'support' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    Support Ticketlari ({customer.supportTickets?.length || 0})
                  </h3>
                  <button
                    onClick={() => alert('Yangi support ticket ochish')}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
                  >
                    + Yangi Ticket
                  </button>
                </div>

                <div className="space-y-3">
                  {customer.supportTickets?.map((tck: any) => (
                    <div key={tck.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-600">{tck.ticketNumber}</span>
                          <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            {tck.category}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {tck.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-medium mb-1">{tck.issue}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(tck.createdAt).toLocaleString('uz-UZ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 15. HISOB-FAKTURALAR TAB */}
            {activeTab === 'invoices' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Hisob-Fakturalar (Elektron Faktura) ({customer.invoices?.length || 0})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Faktura №</th>
                        <th className="py-2.5 px-3">Sana</th>
                        <th className="py-2.5 px-3">Summa</th>
                        <th className="py-2.5 px-3">QQS (12%)</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customer.invoices?.map((inv: any) => (
                        <tr key={inv.id}>
                          <td className="py-3 px-3 font-bold text-blue-600">{inv.invoiceNumber}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">
                            {new Date(inv.invoiceDate).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {new Intl.NumberFormat('uz-UZ').format(inv.amount)} so'm
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500">
                            {new Intl.NumberFormat('uz-UZ').format(inv.vatAmount)} so'm
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 16. KEYSLAR TAB */}
            {activeTab === 'cases' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Mijoz Keyslari & Maxsus Holatlar ({customer.cases?.length || 0})
                </h3>
                <div className="space-y-3">
                  {customer.cases?.map((c: any) => (
                    <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-purple-600">{c.caseNumber}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {c.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 mb-1">{c.title}</div>
                      <p className="text-xs text-slate-600 mb-2">{c.description}</p>
                      {c.solution && (
                        <div className="p-2.5 rounded bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 font-medium">
                          💡 Yechim: {c.solution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 17. TARIX (AUDIT LOG) TAB */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Audit Jurnali & O'zgarishlar Tarixi</h3>
                <div className="space-y-2">
                  {history.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          <span className="text-blue-600 font-bold">{log.userName || 'Tizim'}:</span> {log.action} —{' '}
                          {log.newValue || log.oldValue}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          IP: {log.ipAddress || '127.0.0.1'}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(log.createdAt).toLocaleString('uz-UZ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. MODAL: SHARTNOMA QO'SHISH (PDF FILE UPLOAD)                 */}
      {/* ============================================================== */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yangi Shartnoma Biriktirish</h3>
                  <p className="text-[11px] text-slate-500">Shartnoma ma'lumotlari va PDF faylini yuklang</p>
                </div>
              </div>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="p-6 space-y-4 text-xs">
              {contractError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{contractError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Shartnoma Raqami <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contractForm.contractNumber}
                    onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Xizmat Turi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={contractForm.contractType}
                    onChange={(e) => setContractForm({ ...contractForm, contractType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="ONKM Xizmat Ko'rsatish">ONKM Xizmat Ko'rsatish</option>
                    <option value="OFD Abonent Ulanish">OFD Abonent Ulanish</option>
                    <option value="Kassa Dasturi Litsenziyasi">Kassa Dasturi Litsenziyasi</option>
                    <option value="Arenda / Ijara">Arenda / Ijara</option>
                    <option value="Boshqa">Boshqa Kelishuv</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Boshlanish Sanasi</label>
                  <input
                    type="date"
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tugash Sanasi</label>
                  <input
                    type="date"
                    value={contractForm.endDate}
                    onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Shartnoma Summasi (so'm)</label>
                  <input
                    type="number"
                    placeholder="Masalan: 840000"
                    value={contractForm.amount}
                    onChange={(e) => setContractForm({ ...contractForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={contractForm.status}
                    onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="FAOL">FAOL</option>
                    <option value="KUTILMOQDA">KUTILMOQDA</option>
                    <option value="MUDDATI_OTGAN">MUDDATI_O'TGAN</option>
                  </select>
                </div>
              </div>

              {/* PDF File Upload Field */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                <label className="block text-[11px] font-bold text-blue-900">
                  Shartnoma Hujjati (PDF formatida)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-blue-200 hover:border-blue-400 rounded-lg text-xs font-semibold text-blue-700 transition-colors">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>{contractPdfFile ? contractPdfFile.name : 'PDF Faylni Tanlang...'}</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setContractPdfFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {contractPdfFile && (
                    <span className="text-[11px] font-mono text-emerald-600 font-bold">
                      {(contractPdfFile.size / 1024).toFixed(0)} KB
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Elektron imzolangan yoki skaner qilingan shartnoma PDF hujjati
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={contractSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{contractSaving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. MODAL: TO'LOV KIRITISH (NAQD, BANK, ELEKTRON TO'LOV)        */}
      {/* ============================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mijoz To'lovini Qabul Qilish</h3>
                  <p className="text-[11px] text-slate-500">Naqd, bank o'tkazmasi yoki elektron to'lov shakli</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  To'lov Summasi (so'm) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="Masalan: 70000"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-extrabold text-base text-emerald-700"
                />
                {customer?.debt > 0 && (
                  <span className="text-[11px] text-rose-600 mt-1 block">
                    Mijoz qarzdorligi: {new Intl.NumberFormat('uz-UZ').format(customer.debt)} so'm
                  </span>
                )}
              </div>

              {/* Payment Methods (NAQD, BANK, ELEKTRON) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  To'lov Turi (Shakli) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'NAQD', label: 'Naqd Pul', icon: '💵' },
                    { id: 'BANK', label: 'Pul Ko\'chirish', icon: '🏦' },
                    { id: 'CLICK', label: 'Click', icon: '⚡' },
                    { id: 'PAYME', label: 'Payme', icon: '📱' },
                    { id: 'HUMO_UZCARD', label: 'Humo / Uzcard', icon: '💳' },
                    { id: 'ELEKTRON', label: 'Boshqa Elektron', icon: '🌐' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, method: btn.id })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        paymentForm.method === btn.id
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 font-bold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <span className="text-base">{btn.icon}</span>
                      <span className="text-xs">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kvitansiya / Chek №</label>
                  <input
                    type="text"
                    value={paymentForm.paymentNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">To'lov Sanasi</label>
                  <input
                    type="date"
                    value={paymentForm.paidAt}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">To'lov Maqsadi / Izoh</label>
                <textarea
                  rows={2}
                  placeholder="Masalan: 2026-yil fevral oyi uchun ONKM abonent xizmati to'lovi"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{paymentSaving ? 'Qabul qilinmoqda...' : 'To\'lovni Qabul Qilish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MODAL: SAVDO NUQTASI QO'SHISH                               */}
      {/* ============================================================== */}
      {isOutletModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yangi Savdo Nuqtasi Yaratish</h3>
                  <p className="text-[11px] text-slate-500">Filial nomi, manzili, telefon raqami va mo'ljal</p>
                </div>
              </div>
              <button
                onClick={() => setIsOutletModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOutlet} className="p-6 space-y-4 text-xs">
              {outletError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{outletError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Filial / Savdo Nuqtasi Nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Chilonzor filiali yoki Markaziy do'kon"
                  value={outletForm.name}
                  onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Savdo Nuqtasi Manzili <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Toshkent sh., Chilonzor tumani, 9-mavze, 21-uy"
                  value={outletForm.address}
                  onChange={(e) => setOutletForm({ ...outletForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Telefon Raqami</label>
                  <input
                    type="text"
                    placeholder="Masalan: +998 90 123-45-67"
                    value={outletForm.phone}
                    onChange={(e) => setOutletForm({ ...outletForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mo'ljal (Landmark)</label>
                  <input
                    type="text"
                    placeholder="Masalan: Metro bekati yonida"
                    value={outletForm.landmark}
                    onChange={(e) => setOutletForm({ ...outletForm, landmark: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {editingOutletId && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Savdo Nuqtasi Holati
                  </label>
                  <select
                    value={outletForm.status}
                    onChange={(e) => setOutletForm({ ...outletForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="FAOL">FAOL</option>
                    <option value="NOFAOL">NOFAOL</option>
                    <option value="TA'MIRDA">TA'MIRDA</option>
                    <option value="YOPILGAN">YOPILGAN</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsOutletModalOpen(false); setEditingOutletId(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={outletSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{outletSaving ? 'Saqlanmoqda...' : (editingOutletId ? 'O\'zgarishlarni Saqlash' : 'Nuqtani Yaratish')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODAL: ONKM VA FM QURILMASINI BIRIKTIRISH                   */}
      {/* ============================================================== */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Qurilma va FM Modulini Biriktirish</h3>
                  <p className="text-[11px] text-slate-500">
                    Bazadagi ONKM va FM seriyalarini tanlab, savdo nuqtasiga biriktiring
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="p-6 space-y-4 text-xs">
              {deviceError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{deviceError}</span>
                </div>
              )}

              {/* Outlet Selection & Attached User */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Savdo Nuqtasi (Filial) <span className="text-rose-500">*</span>
                  </label>
                  {availableDevicesData.outlets.length > 0 ? (
                    <select
                      value={deviceForm.outletName}
                      onChange={(e) => setDeviceForm({ ...deviceForm, outletName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-semibold cursor-pointer"
                    >
                      {availableDevicesData.outlets.map((o: any) => (
                        <option key={o.id} value={o.name}>
                          {o.name} ({o.address})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Masalan: Markaziy savdo do'koni"
                      value={deviceForm.outletName}
                      onChange={(e) => setDeviceForm({ ...deviceForm, outletName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-semibold"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Biriktirgan Mas'ul / Foydalanuvchi</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 font-semibold">Static</span>
                  </label>
                  <input
                    type="text"
                    value={deviceForm.userName}
                    onChange={(e) => setDeviceForm({ ...deviceForm, userName: e.target.value })}
                    placeholder="Menejer yoki mas'ul xodim"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* ONKM Serial selection */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-blue-900">
                    🖥 Online Kassa (ONKM) Seriyasi
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">Ombordan tanlash</span>
                </div>

                {availableDevicesData.availableSerials.length > 0 ? (
                  <select
                    value={deviceForm.onkmSerialId}
                    onChange={(e) => setDeviceForm({ ...deviceForm, onkmSerialId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none font-mono font-bold text-blue-700 cursor-pointer"
                  >
                    <option value="">-- Ombordagi Kassa Seriyasini Tanlang --</option>
                    {availableDevicesData.availableSerials.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.serialNumber} — {s.product?.name || 'ONKM'} ({s.branch?.name || 'Ombor'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">Omborda bo'sh ONKM seriyasi topilmadi</p>
                )}

                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Yoki yangi seriya raqami kiriting:</span>
                  <input
                    type="text"
                    placeholder="Masalan: ACLAS-CRV-9999"
                    value={deviceForm.customOnkmSerial}
                    onChange={(e) => setDeviceForm({ ...deviceForm, customOnkmSerial: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* FM Serial selection */}
              <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-purple-900">
                    🧩 Fiskal Modul (FM) Seriyasi
                  </label>
                  <span className="text-[10px] text-purple-600 font-semibold">DSQ ro'yxatidan</span>
                </div>

                {availableDevicesData.availableFiscalModules.length > 0 ? (
                  <select
                    value={deviceForm.fmModuleId}
                    onChange={(e) => setDeviceForm({ ...deviceForm, fmModuleId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:outline-none font-mono font-bold text-purple-700 cursor-pointer"
                  >
                    <option value="">-- Ombordagi Fiskal Modulni Tanlang --</option>
                    {availableDevicesData.availableFiscalModules.map((fm: any) => (
                      <option key={fm.id} value={fm.id}>
                        {fm.serialNumber} ({fm.branch?.name || 'Ombor'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">Omborda bo'sh FM moduli topilmadi</p>
                )}

                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Yoki yangi FM seriyasi kiriting:</span>
                  <input
                    type="text"
                    placeholder="Masalan: FM998009999"
                    value={deviceForm.customFmSerial}
                    onChange={(e) => setDeviceForm({ ...deviceForm, customFmSerial: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">O'rnatilgan Sana</label>
                  <input
                    type="date"
                    value={deviceForm.installedAt}
                    onChange={(e) => setDeviceForm({ ...deviceForm, installedAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kafolat Muddati (Oy)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={deviceForm.warrantyMonths}
                    onChange={(e) => setDeviceForm({ ...deviceForm, warrantyMonths: parseInt(e.target.value) || 12 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={deviceSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{deviceSaving ? 'Biriktirilmoqda...' : 'Biriktirish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4.5. MODAL: ONKM VA FM QURILMASINI TAHRIRLASH                  */}
      {/* ============================================================== */}
      {isEditDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${editDeviceForm.deviceType === 'ONKM' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {editDeviceForm.deviceType === 'ONKM' ? <Monitor className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editDeviceForm.deviceType === 'ONKM' ? "Online Kassa (ONKM) Ma'lumotlarini Tahrirlash" : "Fiskal Modul (FM) Ma'lumotlarini Tahrirlash"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Seriya raqami, savdo nuqtasi, biriktirgan mas'ul va kafolat ma'lumotlarini yangilash
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditDeviceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDevice} className="p-6 space-y-4 text-xs">
              {editDeviceError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{editDeviceError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Seriya Raqami <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editDeviceForm.serialNumber}
                    onChange={(e) => setEditDeviceForm({ ...editDeviceForm, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                {editDeviceForm.deviceType === 'FM' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ulangan KKM Seriyasi
                    </label>
                    <input
                      type="text"
                      placeholder="KKM seriyasi"
                      value={editDeviceForm.kkmSerialNumber}
                      onChange={(e) => setEditDeviceForm({ ...editDeviceForm, kkmSerialNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Holati
                    </label>
                    <select
                      value={editDeviceForm.status}
                      onChange={(e) => setEditDeviceForm({ ...editDeviceForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="O'RNATILDI">O'RNATILDI</option>
                      <option value="FAOL">FAOL</option>
                      <option value="NOSOZ">NOSOZ</option>
                      <option value="OMBORDA">OMBORDA</option>
                      <option value="SERVISDA">SERVISDA</option>
                    </select>
                  </div>
                )}
              </div>

              {editDeviceForm.deviceType === 'FM' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Holati
                  </label>
                  <select
                    value={editDeviceForm.status}
                    onChange={(e) => setEditDeviceForm({ ...editDeviceForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="O'RNATILDI">O'RNATILDI</option>
                    <option value="FAOL">FAOL</option>
                    <option value="NOSOZ">NOSOZ</option>
                    <option value="OMBORDA">OMBORDA</option>
                  </select>
                </div>
              )}

              {/* Outlet and Attached User */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Savdo Nuqtasi (Filial)
                  </label>
                  {customer?.outlets && customer.outlets.length > 0 ? (
                    <select
                      value={editDeviceForm.outletName}
                      onChange={(e) => setEditDeviceForm({ ...editDeviceForm, outletName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Savdo nuqtasini tanlang --</option>
                      {customer.outlets.map((o: any) => (
                        <option key={o.id} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editDeviceForm.outletName}
                      onChange={(e) => setEditDeviceForm({ ...editDeviceForm, outletName: e.target.value })}
                      placeholder="Savdo nuqtasi nomi"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Biriktirgan Mas'ul</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 font-semibold">Static</span>
                  </label>
                  <input
                    type="text"
                    value={editDeviceForm.userName}
                    onChange={(e) => setEditDeviceForm({ ...editDeviceForm, userName: e.target.value })}
                    placeholder="Mas'ul xodim nomi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {editDeviceForm.deviceType === 'ONKM' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">O'rnatilgan Sana</label>
                    <input
                      type="date"
                      value={editDeviceForm.installedAt}
                      onChange={(e) => setEditDeviceForm({ ...editDeviceForm, installedAt: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">DSQ Ro'yxat Sanasi</label>
                    <input
                      type="date"
                      value={editDeviceForm.registeredAt}
                      onChange={(e) => setEditDeviceForm({ ...editDeviceForm, registeredAt: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kafolat Tugashi</label>
                  <input
                    type="date"
                    value={editDeviceForm.warrantyEndDate}
                    onChange={(e) => setEditDeviceForm({ ...editDeviceForm, warrantyEndDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditDeviceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={editDeviceSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editDeviceSaving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: HUJJAT YUKLASH (SHARTNOMA, GUVOHNOMA, IJARA, KADASTR) */}
      {/* ============================================================== */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yangi Hujjat Yuklash</h3>
                  <p className="text-[11px] text-slate-500">
                    Shartnoma, Guvohnoma, Ijara yoki Kadastr hujjati (PDF)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="p-6 space-y-4 text-xs">
              {docError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{docError}</span>
                </div>
              )}

              {/* Document Type Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Hujjat Turi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docForm.docType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let defaultTitle = docForm.title;
                    if (!defaultTitle || defaultTitle.includes('hujjati') || defaultTitle.includes('shartnomasi')) {
                      if (newType === 'GUVOHNOMA') defaultTitle = 'Davlat ro\'yxatidan o\'tganlik to\'g\'risida Guvohnoma';
                      else if (newType === 'SHARTNOMA') defaultTitle = 'Bosh hamkorlik shartnomasi';
                      else if (newType === 'IJARA') defaultTitle = 'Savdo maydoni ijara shartnomasi';
                      else if (newType === 'KADASTR') defaultTitle = 'Bino yoki joyning kadastr hujjati';
                      else if (newType === 'AKT') defaultTitle = 'Topshirish-qabul qilish dalolatnomasi (Akt)';
                    }
                    setDocForm({ ...docForm, docType: newType, title: defaultTitle });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="SHARTNOMA">📑 Shartnoma (Bosh kelishuv)</option>
                  <option value="GUVOHNOMA">📜 Guvohnoma (Davlat ro'yxati)</option>
                  <option value="IJARA">🏢 Ijara Shartnomasi</option>
                  <option value="KADASTR">🗺 Kadastr Hujjati</option>
                  <option value="AKT">📋 Qabul Akti (Dalolatnoma)</option>
                  <option value="BOSHQA">🔖 Boshqa Hujjat</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Hujjat Nomi / Tavsifi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Savdo maydoni ijara shartnomasi"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hujjat Raqami</label>
                  <input
                    type="text"
                    placeholder="Masalan: GV-2025/8812"
                    value={docForm.fileNumber}
                    onChange={(e) => setDocForm({ ...docForm, fileNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Berilgan Sana</label>
                  <input
                    type="date"
                    value={docForm.issuedDate}
                    onChange={(e) => setDocForm({ ...docForm, issuedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* PDF File Upload Field */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                <label className="block text-[11px] font-bold text-blue-900">
                  PDF Formatidagi Hujjat Fayli <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-blue-200 hover:border-blue-400 rounded-lg text-xs font-semibold text-blue-700 transition-colors">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>{docPdfFile ? docPdfFile.name : 'PDF Faylni Tanlang...'}</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setDocPdfFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {docPdfFile && (
                    <span className="text-[11px] font-mono text-emerald-600 font-bold">
                      {(docPdfFile.size / 1024).toFixed(0)} KB
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Yuklangan PDF fayli mijoz kartochkasida saqlanadi va istalgan vaqt ochib ko'rilishi mumkin
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={docSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{docSaving ? 'Yuklanmoqda...' : 'Hujjatni Saqlash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: XIZMAT BIRIKTIRISH & QO'SHISH (BALANSDAN YECHISH) */}
      {/* ======================================================== */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/30">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mijozga Xizmat Qo'shish & Biriktirish</h3>
                  <p className="text-[11px] text-slate-500">
                    Xizmat turini va savdo nuqtasini tanlang. Narx mijoz balansidan yechiladi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCustomerService} className="p-6 space-y-4 text-xs">
              {serviceError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{serviceError}</span>
                </div>
              )}

              {/* 1. Xizmat turi tanlash */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Xizmat Turi (Moliya & Tahlil Katalogidan) *
                </label>
                <select
                  value={serviceForm.serviceId}
                  onChange={(e) => handleServiceSelectChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  required
                >
                  <option value="">— Xizmatni tanlang —</option>
                  {allServicesCatalog?.map((srv: any) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} — {new Intl.NumberFormat('uz-UZ').format(srv.price)} so'm ({srv.category || 'Xizmat'})
                    </option>
                  ))}
                  <option value="CUSTOM">+ Boshqa maxsus xizmat (nomi va narxini kiritish)</option>
                </select>
              </div>

              {/* Custom Service Name & Price (agar CUSTOM tanlangan bo'lsa) */}
              {serviceForm.serviceId === 'CUSTOM' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Xizmat Nomi *</label>
                    <input
                      type="text"
                      placeholder="Xizmat nomini kiriting..."
                      value={serviceForm.customServiceName}
                      onChange={(e) => setServiceForm({ ...serviceForm, customServiceName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Xizmat Narxi (so'm) *</label>
                    <input
                      type="number"
                      placeholder="Masalan: 75000"
                      value={serviceForm.customPrice}
                      onChange={(e) => setServiceForm({ ...serviceForm, customPrice: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 2. Savdo Nuqtasi tanlash (Filial) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Aynan Qaysi Savdo Nuqtasi (Filial) Uchun? *
                </label>
                <select
                  value={serviceForm.outletId}
                  onChange={(e) => setServiceForm({ ...serviceForm, outletId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  required
                >
                  {customer.outlets && customer.outlets.length > 0 ? (
                    <>
                      {customer.outlets.map((outlet: any) => (
                        <option key={outlet.id} value={outlet.id}>
                          🏪 {outlet.name} — {outlet.address} {outlet.landmark ? `(${outlet.landmark})` : ''}
                        </option>
                      ))}
                      <option value="ALL">🌐 Barcha savdo nuqtalari uchun (Umumiy korxona)</option>
                    </>
                  ) : (
                    <option value="ALL">🏪 Asosiy savdo nuqtasi: {customer.companyName}</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mijozning ushbu filialiga xizmat ko'rsatish va hisobdorlik yuritiladi.
                </p>
              </div>

              {/* 3. Boshlanish Sanasi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Boshlanish Sanasi *
                </label>
                <input
                  type="date"
                  value={serviceForm.startDate}
                  onChange={(e) => setServiceForm({ ...serviceForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              {/* 4. Moliyaviy Yechim Ko'rsatkichi (Balans hisob-kitobi) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Mijozning joriy balansi:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {new Intl.NumberFormat('uz-UZ').format(customer.balance || 0)} so'm
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Xizmat narxi (yechiladigan summa):</span>
                  <span className="font-extrabold text-blue-600 font-mono">
                    {serviceForm.serviceId === 'CUSTOM'
                      ? `${new Intl.NumberFormat('uz-UZ').format(Number(serviceForm.customPrice) || 0)} so'm`
                      : selectedCatalogService
                      ? `${new Intl.NumberFormat('uz-UZ').format(selectedCatalogService.price)} so'm`
                      : '0 so\'m'}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Yechilgandan keyingi qoldiq balans:</span>
                  {(() => {
                    const price = serviceForm.serviceId === 'CUSTOM'
                      ? Number(serviceForm.customPrice) || 0
                      : (selectedCatalogService?.price || 0);
                    const bal = (customer.balance || 0) - price;
                    return (
                      <span className={`font-mono font-bold ${bal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {new Intl.NumberFormat('uz-UZ').format(bal >= 0 ? bal : 0)} so'm
                        {bal < 0 && ` (Qarz: ${new Intl.NumberFormat('uz-UZ').format(Math.abs(bal))} so'm)`}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* 5. Izoh */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Izoh yoki Qo'shimcha Ma'lumot (ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  placeholder="Shartnoma moddasi, maxsus talablar yoki sabab..."
                  value={serviceForm.notes}
                  onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={serviceSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {serviceSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Biriktirilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Xizmatni Biriktirish & Yechish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={isEditOpen}
        customer={customer}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => fetchCustomerDetail()}
      />
    </AppLayout>
  );
}
