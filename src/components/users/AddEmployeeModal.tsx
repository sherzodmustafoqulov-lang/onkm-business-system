'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  User,
  Briefcase,
  Lock,
  CheckCircle,
  Eye,
  EyeOff,
  Wand2,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { generateOnkmLogin, generateTempPassword } from '@/lib/sms';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [activeSection, setActiveSection] = useState('personal'); // personal, work, access
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [sendSms, setSendSms] = useState(true);
  const [copied, setCopied] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    gender: 'ERKAK',
    phone: '',
    extraPhone: '',
    email: '',
    telegram: '',
    address: '',

    branchId: '',
    roleId: '',
    departmentId: '',
    positionId: '',
    managerId: '',
    workType: "TO'LIQ_STAVKA",
    employmentStatus: 'FAOL',
    hireDate: '',
    notes: '',
    baseSalary: '',
    currency: 'UZS',
    rate: '1',

    login: '',
    password: '',
    passwordConfirm: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/roles')
        .then((res) => res.json())
        .then((data) => setRoles(Array.isArray(data) ? data : []))
        .catch(console.error);
      fetch('/api/branches')
        .then((res) => res.json())
        .then((data) => setBranches(data.branches || []))
        .catch(console.error);

      // Auto-generate initial password
      const initialPass = generateTempPassword();
      setFormData((prev) => ({
        ...prev,
        password: initialPass,
        passwordConfirm: initialPass,
      }));
      setCreatedEmployee(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-generate @onkm.uz login when first or last name changes
  const handleNameChange = (field: 'firstName' | 'lastName' | 'middleName', value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const autoLogin = generateOnkmLogin(updated.firstName, updated.lastName);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      email: autoLogin,
      login: autoLogin,
    }));
  };

  const handleGenerateCustomLogin = () => {
    const login = generateOnkmLogin(formData.firstName, formData.lastName);
    setFormData((prev) => ({
      ...prev,
      email: login,
      login: login,
    }));
  };

  const handleGeneratePassword = () => {
    const newPass = generateTempPassword();
    setFormData((prev) => ({
      ...prev,
      password: newPass,
      passwordConfirm: newPass,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyCredentials = () => {
    const text = `ONKM Tizimi Kirish Ma'lumotlari:\nLogin: ${formData.email}\nParol: ${formData.password}\nSayt: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      alert('Parollar bir-biriga mos kelmadi!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          avatar: avatarPreview,
          sendSms,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCreatedEmployee({
          ...created,
          plainPassword: formData.password,
          login: formData.email,
          smsSent: created.smsSent,
        });
        onSuccess();
      } else {
        const error = await res.json();
        alert(`Xatolik: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Tizim xatosi yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/30">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Yangi xodim qo'shish
            </h2>
            <p className="text-xs text-slate-500">
              Kompaniya bazasiga xodim kiritish, @onkm.uz login va SMS orqali bir martalik parol yaratish
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View if created */}
        {createdEmployee ? (
          <div className="p-8 text-center space-y-6 flex-1 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Xodim muvaffaqiyatli yaratildi!
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Foydalanuvchi ma'lumotlari bazaga saqlandi va login parol biriktirildi.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-5 text-left shadow-sm space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Yaratilgan kirish ma'lumotlari:
              </div>

              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">ONKM Login:</div>
                  <div className="text-sm font-bold text-blue-600">{createdEmployee.login}</div>
                </div>
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                  @onkm.uz
                </span>
              </div>

              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">Bir martalik parol:</div>
                  <div className="text-sm font-mono font-bold text-slate-800">
                    {createdEmployee.plainPassword}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Nusxa olindi' : 'Nusxa olish'}
                </button>
              </div>

              {createdEmployee.smsSent && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                  <Smartphone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Bir martalik parol xodimning telefon raqamiga <b>SMS orqali muvaffaqiyatli yuborildi</b>!
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Nusxa olindi!' : "Ma'lumotlarni nusxalash"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-500/20"
              >
                Tugatish
              </button>
            </div>
          </div>
        ) : (
          /* Modal Body */
          <div className="flex-1 overflow-y-auto flex">
            {/* Sidebar Tabs */}
            <div className="w-64 border-r border-slate-200 bg-slate-50/70 p-4 space-y-2 hidden md:block">
              <button
                type="button"
                onClick={() => setActiveSection('personal')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeSection === 'personal'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-5 h-5" />
                Shaxsiy ma'lumotlar
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('work')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeSection === 'work'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                Ish ma'lumotlari
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('access')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeSection === 'access'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Lock className="w-5 h-5" />
                Login & SMS Parol
              </button>

              <div className="pt-6 px-2">
                <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-blue-800">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Xavfsizlik qoidasi:
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-700">
                    Login @onkm.uz korporativ pochtasi bo'lib, bir martalik parol telefon raqamiga SMS
                    qilib boradi.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-6 bg-white overflow-y-auto">
              <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
                {/* SECTION: PERSONAL */}
                {activeSection === 'personal' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      1. Shaxsiy ma'lumotlar
                    </h3>

                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-2 shadow-sm">
                          <Upload className="w-4 h-4" />
                          Rasm yuklash
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleAvatarUpload}
                          />
                        </label>
                        <p className="text-xs text-slate-500 mt-2">JPG, PNG yoki WEBP. Max: 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Familiya <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="lastName"
                          placeholder="Mustafaqulov"
                          value={formData.lastName}
                          onChange={(e) => handleNameChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ism <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="firstName"
                          placeholder="Xayrulla"
                          value={formData.firstName}
                          onChange={(e) => handleNameChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Otasining ismi
                        </label>
                        <input
                          type="text"
                          name="middleName"
                          value={formData.middleName}
                          onChange={(e) => handleNameChange('middleName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Generated Login Preview */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Avtomatik yaratiladigan @onkm.uz login:
                        </p>
                        <p className="text-sm font-bold text-blue-700 flex items-center gap-1.5">
                          <span>{formData.email || 'ism.familiya@onkm.uz'}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateCustomLogin}
                        className="text-xs bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Yangilash
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tug'ilgan sana
                        </label>
                        <input
                          type="date"
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Jinsi</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="ERKAK">Erkak</option>
                          <option value="AYOL">Ayol</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Telefon (SMS yuborish uchun) <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="phone"
                          placeholder="+998901234567"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Qo'shimcha telefon
                        </label>
                        <input
                          type="text"
                          name="extraPhone"
                          placeholder="+998"
                          value={formData.extraPhone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Telegram Username
                        </label>
                        <input
                          type="text"
                          name="telegram"
                          placeholder="@username"
                          value={formData.telegram}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Yashash manzili
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      ></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveSection('work')}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Keyingisi (Ish ma'lumotlari) →
                      </button>
                    </div>
                  </div>
                )}

                {/* SECTION: WORK */}
                {activeSection === 'work' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      2. Ish ma'lumotlari
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Filial
                        </label>
                        <select
                          name="branchId"
                          value={formData.branchId}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="">Barcha / Markaz</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ishga kirgan sana
                        </label>
                        <input
                          type="date"
                          name="hireDate"
                          value={formData.hireDate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ish turi
                        </label>
                        <select
                          name="workType"
                          value={formData.workType}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="TO'LIQ_STAVKA">To'liq stavka</option>
                          <option value="YARIM_STAVKA">Yarim stavka</option>
                          <option value="SHARTNOMA">Shartnoma asosida</option>
                          <option value="SINOV">Sinov muddati</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Bandlik holati
                        </label>
                        <select
                          name="employmentStatus"
                          value={formData.employmentStatus}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="FAOL">Faol</option>
                          <option value="SINOV">Sinov muddati</option>
                          <option value="TA'TIL">Ta'tilda</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Izohlar (HR uchun)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      ></textarea>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveSection('personal')}
                        className="text-slate-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 border border-slate-200"
                      >
                        ← Orqaga
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection('access')}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Keyingisi (Login & SMS Parol) →
                      </button>
                    </div>
                  </div>
                )}

                {/* SECTION: ACCESS & CREDENTIALS */}
                {activeSection === 'access' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      3. Tizimga kirish, @onkm.uz Login va SMS Parol
                    </h3>

                    {/* Role & Login */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Rol (Vakolat) <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          name="roleId"
                          value={formData.roleId}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="">Rolni tanlang...</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.displayName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Korporativ Login (@onkm.uz) <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGenerateCustomLogin}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                          >
                            <Wand2 className="w-3 h-3" />
                            Qayta yaratish
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            required
                            type="text"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="x.familiya@onkm.uz"
                            className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 rounded-lg text-sm font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Xodim ushbu login bilan tizimga kiradi.
                        </p>
                      </div>
                    </div>

                    {/* Password Generator & Inputs */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-emerald-600" />
                            Bir martalik parol (Telefon raqamiga yuboriladi)
                          </h4>
                          <p className="text-xs text-slate-500">
                            Xodim kirganidan so'ng o'z xohishiga ko'ra yangi parolga o'zgartira oladi.
                            Admin panelida ham saqlanadi.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-400 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-blue-600" />
                          Yangi parol generatsiya qilish
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Bir martalik parol <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              required
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Parolni tasdiqlash <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              required
                              type={showPassword ? 'text' : 'password'}
                              name="passwordConfirm"
                              value={formData.passwordConfirm}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SMS Toggle Option */}
                      <label className="flex items-start gap-3 p-3 bg-white border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={sendSms}
                          onChange={(e) => setSendSms(e.target.checked)}
                          className="w-4 h-4 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            Xodim telefon raqamiga ({formData.phone || '+998...'}) bir martalik SMS
                            yuborish
                          </span>
                          <span className="text-slate-500 block mt-0.5">
                            SMS matnida login va vaqtinchalik parol taqdim etiladi. Xodim birinchi marta
                            kirgach yangi parolini o'zi belgilashi mumkin.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Salary & Finance (Optional) */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        Oylik maosh va stavka (HR / Maxfiy)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Oylik maosh (Base Salary)
                          </label>
                          <div className="flex">
                            <input
                              type="number"
                              name="baseSalary"
                              value={formData.baseSalary}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="0.00"
                            />
                            <select
                              name="currency"
                              value={formData.currency}
                              onChange={handleChange}
                              className="px-3 py-2 border border-l-0 border-slate-200 rounded-r-lg bg-slate-100 text-xs font-semibold text-slate-700"
                            >
                              <option value="UZS">UZS</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Stavka (Rate)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            max="1"
                            name="rate"
                            value={formData.rate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="1.0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveSection('work')}
                        className="text-slate-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 border border-slate-200"
                      >
                        ← Orqaga
                      </button>

                      <button
                        type="submit"
                        form="employee-form"
                        disabled={isLoading}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95"
                      >
                        {isLoading ? (
                          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Xodimni saqlash va SMS yuborish
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
