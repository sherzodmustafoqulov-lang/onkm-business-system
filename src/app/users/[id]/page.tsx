'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  User,
  Briefcase,
  TrendingUp,
  History,
  FileText,
  ArrowLeft,
  Activity,
  Edit,
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import EditEmployeeModal from '@/components/users/EditEmployeeModal';
import AdminResetPasswordModal from '@/components/users/AdminResetPasswordModal';

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Umumiy');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const tabs = ['Umumiy', 'HR', 'KPI', 'Savdo', 'Vazifalar', 'Faoliyat tarixi', 'Hujjatlar'];

  const fetchEmployee = async () => {
    try {
      const res = await fetch(`/api/employees/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      }
    } catch (err) {
      console.error('Failed to fetch employee', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  if (isLoading) return <AppLayout><div className="p-8 text-center">Yuklanmoqda...</div></AppLayout>;
  if (!employee) return <AppLayout><div className="p-8 text-center text-red-500">Xodim topilmadi!</div></AppLayout>;

  const profile = employee.employeeProfile || {};
  const salary = profile.salary;
  const kpiResults = profile.kpiResults || [];
  const latestKpi = kpiResults[0]?.totalScore || 0;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.push('/users')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Xodim Profili</h1>
          <p className="text-sm text-slate-500">Batafsil ma'lumotlar, KPI va tarix</p>
        </div>
        <button onClick={() => setIsEditModalOpen(true)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
          <Edit className="w-4 h-4" />
          Tahrirlash
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 flex flex-col md:flex-row gap-6 items-start shadow-sm">
        <div className="w-24 h-24 rounded-full border-4 border-slate-50 bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-400">
          {employee.avatar ? (
             <img src={employee.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
             <User className="w-12 h-12" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-slate-900">{employee.name}</h2>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${profile.employmentStatus === 'FAOL' || employee.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {profile.employmentStatus || (employee.isActive ? 'FAOL' : 'NOFAOL')}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mb-4">
            <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {employee.position?.name || 'Lavozim belgilanmagan'}</div>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {employee.department?.name || 'Bo\'lim belgilanmagan'}</div>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {employee.branch?.name || 'Markaziy filial'}</div>
            <div className="flex items-center gap-1.5 font-semibold text-blue-700 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] uppercase tracking-wider">{employee.role?.displayName || employee.role?.name}</div>
          </div>

          <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-semibold mb-1">So'nggi KPI natijasi</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-emerald-600">{latestKpi}%</span>
                <span className="text-sm text-slate-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500"/> Yuqori</span>
              </div>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-semibold mb-1">Ishga kirgan sana</p>
              <div className="text-lg font-bold text-slate-700">
                {profile.hireDate ? new Date(profile.hireDate).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
              </div>
            </div>
            {salary && (
              <>
                <div className="w-px bg-slate-200"></div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Base Salary / Bonus</p>
                  <div className="text-lg font-bold text-slate-700">
                    {salary.baseSalary.toLocaleString()} <span className="text-xs">{salary.currency}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6 border border-slate-200 overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 whitespace-nowrap rounded-md text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm min-h-[400px]">
        {activeTab === 'Umumiy' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Shaxsiy ma'lumotlar
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex"><span className="w-32 text-slate-500">Tug'ilgan sana:</span><span className="font-semibold text-slate-800">{profile.birthDate ? new Date(profile.birthDate).toLocaleDateString() : '-'}</span></li>
                  <li className="flex"><span className="w-32 text-slate-500">Jinsi:</span><span className="font-semibold text-slate-800">{profile.gender === 'ERKAK' ? 'Erkak' : profile.gender === 'AYOL' ? 'Ayol' : '-'}</span></li>
                  <li className="flex"><span className="w-32 text-slate-500">Manzil:</span><span className="font-semibold text-slate-800">{profile.address || '-'}</span></li>
                  <li className="flex"><span className="w-32 text-slate-500">Telefon:</span><span className="font-semibold text-slate-800">{employee.phone}</span></li>
                  <li className="flex"><span className="w-32 text-slate-500">Qo'shimcha tel:</span><span className="font-semibold text-slate-800">{profile.extraPhone || '-'}</span></li>
                  <li className="flex"><span className="w-32 text-slate-500">Telegram:</span><span className="font-semibold text-blue-600">{profile.telegram || '-'}</span></li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Ish ma'lumotlari
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex"><span className="w-32 text-slate-500">Ish turi:</span><span className="font-semibold text-slate-800">{profile.workType || '-'}</span></li>
                  <li className="flex"><span className="w-32 text-slate-500">Holati:</span><span className="font-semibold text-slate-800">{profile.employmentStatus || '-'}</span></li>
                  <li className="flex"><span className="w-32 text-slate-500">Rahbar:</span><span className="font-semibold text-slate-800">{profile.manager?.name || '-'}</span></li>
                  <li className="flex"><span className="w-32 text-slate-500">Izoh:</span><span className="font-semibold text-slate-800">{profile.notes || '-'}</span></li>
                </ul>
              </div>
            </div>

            {/* Admin Credentials & Security Card */}
            <div className="mt-6 p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Tizimga kirish ma'lumotlari (ADMIN nazorati)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xodimning korporativ @onkm.uz pochtasi va vaqtinchalik/saqlangan paroli
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Yangi parol o'rnatish & SMS yuborish
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Login */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400">Korporativ Login:</div>
                    <div className="text-sm font-mono font-bold text-blue-700">{employee.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(employee.email);
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Nusxa olish"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400">Vaqtinchalik / Saqlangan parol:</div>
                    <div className="text-sm font-mono font-bold text-slate-800">
                      {employee.tempPassword
                        ? showPassword
                          ? employee.tempPassword
                          : '••••••••'
                        : 'Xodim shaxsiy paroliga o\'zgartirgan'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {employee.tempPassword && (
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        title={showPassword ? 'Yashirish' : 'Ko\'rish'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    {employee.tempPassword && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(employee.tempPassword);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Nusxa olish"
                      >
                        {copiedPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'KPI' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">KPI Tarixi va Natijalari</h3>
              <button className="text-sm font-semibold text-blue-600 hover:underline">To'liq hisobotni yuklab olish</button>
            </div>
            {kpiResults.length === 0 ? (
              <div className="text-center py-10 text-slate-500 flex flex-col items-center">
                <TrendingUp className="w-10 h-10 text-slate-300 mb-2" />
                <p>KPI natijalari hali shakllanmagan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Davr</th>
                      <th className="py-3 px-4">Natija (%)</th>
                      <th className="py-3 px-4">Bonus Summasi</th>
                      <th className="py-3 px-4">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kpiResults.map((kpi: any) => (
                      <tr key={kpi.id}>
                        <td className="py-3 px-4 font-semibold">{new Date(kpi.periodStart).toLocaleDateString()} - {new Date(kpi.periodEnd).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{kpi.totalScore}%</td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">{kpi.totalBonus.toLocaleString()} UZS</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-200">{kpi.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {['HR', 'Savdo', 'Vazifalar', 'Faoliyat tarixi', 'Hujjatlar'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Activity className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-600">{activeTab} moduli</h3>
            <p className="text-sm mt-1 max-w-md text-center">Ushbu modul xodim bilan bog'liq haqiqiy biznes ma'lumotlarini (buyurtmalar, o'rnatishlar, hujjatlar) jamlaydi. Keyingi bosqichda to'liq ishga tushiriladi.</p>
          </div>
        )}
      </div>

      <EditEmployeeModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={() => {
          fetchEmployee();
        }}
        employeeId={id}
      />

      <AdminResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        employee={employee}
        onSuccess={() => {
          fetchEmployee();
        }}
      />
    </AppLayout>
  );
}
