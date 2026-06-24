import React, { useState } from 'react';
import { Trust } from '../types';
import { getShareTextForTrust } from '../utils';
import { 
  Lock, Unlock, ShieldCheck, Search, PlusCircle, Share2, 
  Calendar, CheckCircle, AlertOctagon, User, Sparkles, CheckCircle2,
  X, Coins, AlertTriangle, ArrowUpRight
} from 'lucide-react';

interface TrustsSectionProps {
  trusts: Trust[];
  addTrust: (
    type: 'cash' | 'item', 
    description: string, 
    amount: number, 
    party: string, 
    date?: string, 
    time?: string,
    currency?: 'YER' | 'SAR' | 'USD' | 'gold' | 'silver' | 'asset',
    caliber?: string,
    weight?: number,
    assetName?: string,
    isDebtAlayya?: boolean
  ) => any;
  deliverTrust: (trustId: string, date?: string, time?: string) => void;
  addExternalTrust?: (customerName: string, workDetail: string, itemDescription: string, estimatedValue: number, notes: string, originalTxId?: string, date?: string, time?: string) => void;
  deliverExternalTrust?: (trustId: string, amountReceivedLater: number, notes?: string, date?: string, time?: string) => void;
  camouflage: boolean;
}

export default function TrustsSection({
  trusts,
  addTrust,
  deliverTrust,
  addExternalTrust,
  deliverExternalTrust,
  camouflage
}: TrustsSectionProps) {
  // Navigation tabs: 'general' (الأمانات العامة والديون علينا) | 'external' (أمانات الزبائن الخارجيين)
  const [activeTab, setActiveTab] = useState<'general' | 'external'>('general');
  
  // Navigation internal filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'delivered'>('all');
  const [searchText, setSearchText] = useState('');

  // General Trusts & Debts on us Form states
  const [isAddingGeneralTrust, setIsAddingGeneralTrust] = useState(false);
  const [generalType, setGeneralType] = useState<'cash' | 'item'>('cash');
  const [generalDesc, setGeneralDesc] = useState('');
  const [generalAmount, setGeneralAmount] = useState('');
  const [generalParty, setGeneralParty] = useState('');
  
  // Multi-currency and metal additions
  const [isDebtAlayya, setIsDebtAlayya] = useState(false);
  const [currency, setCurrency] = useState<'YER' | 'SAR' | 'USD' | 'gold' | 'silver' | 'asset'>('YER');
  const [caliber, setCaliber] = useState('21');
  const [weight, setWeight] = useState('');
  const [assetName, setAssetName] = useState('');

  // External Customer Trusts Form states
  const [isAddingExternalTrust, setIsAddingExternalTrust] = useState(false);
  const [extCustomerName, setExtCustomerName] = useState('');
  const [extWorkDetail, setExtWorkDetail] = useState('');
  const [extItemDescription, setExtItemDescription] = useState('');
  const [extEstimatedValue, setExtEstimatedValue] = useState('');
  const [extNotes, setExtNotes] = useState('');

  // Delivery of External Trust state
  const [deliveringExternalId, setDeliveringExternalId] = useState<string | null>(null);
  const [receivedLaterAmount, setReceivedLaterAmount] = useState('');
  const [updatedNotes, setUpdatedNotes] = useState('');

  // Submit General Trust & Debt on us Form
  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalDesc.trim()) {
      alert('الرجاء إدخال وصف تفاصيل الأمانة أو الدين المستحق!');
      return;
    }
    if (!generalParty.trim()) {
      alert('الرجاء إدخال اسم الدائن أو المودع صاحب الحق!');
      return;
    }

    let amt = Number(generalAmount) || 0;
    let wt = Number(weight) || 0;

    if (currency === 'gold' || currency === 'silver') {
      if (wt <= 0) {
        alert('الرجاء تحديد وزن الأصل الذهب أو الفضة بالجرام لتوثيقه!');
        return;
      }
      if (amt <= 0) amt = wt; // fallback
    } else {
      if (amt <= 0 && currency !== 'asset') {
        alert('الرجاء إدخال مبلغ الالتزام المالي المستحق!');
        return;
      }
    }

    addTrust(
      generalType,
      generalDesc.trim(),
      amt,
      generalParty.trim(),
      undefined,
      undefined,
      currency,
      caliber,
      wt,
      assetName.trim() || undefined,
      isDebtAlayya
    );

    setIsAddingGeneralTrust(false);
    setGeneralDesc('');
    setGeneralAmount('');
    setGeneralParty('');
    setIsDebtAlayya(false);
    setCurrency('YER');
    setCaliber('21');
    setWeight('');
    setAssetName('');
    alert(isDebtAlayya 
      ? 'تم تسجيل ذمة الالتزام/الدين الذي علينا بنجاح؛ ولن يخصم النقد إلا بعد سداده!' 
      : 'تم قيد وتسجيل العهد الأمانة للأصلاء بنجاح في قاعدة البيانات!'
    );
  };

  // Submit External Trust Form
  const handleExternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extCustomerName.trim() || !extWorkDetail.trim() || !extItemDescription.trim()) {
      alert('الرجاء تعبئة كافة الحقول الأساسية لتوثيق أمانة الزبون الخارجي!');
      return;
    }

    if (addExternalTrust) {
      addExternalTrust(
        extCustomerName.trim(),
        extWorkDetail.trim(),
        extItemDescription.trim(),
        Number(extEstimatedValue) || 0,
        extNotes.trim()
      );

      setIsAddingExternalTrust(false);
      setExtCustomerName('');
      setExtWorkDetail('');
      setExtItemDescription('');
      setExtEstimatedValue('');
      setExtNotes('');
      alert('تم بنجاح تحرير وعزل أطقم/أمانات الزبون الخارجي منعاً لخلطها بكشوف الأرباح!');
    } else {
      alert('الخدمة غير متوفرة حالياً.');
    }
  };

  // Handle Deliver General Trust / Debt
  const handleDeliverGeneralClick = (trustId: string) => {
    const isConfirmed = window.confirm('هل تود تأكيد سداد/إرجاع العهدة المعنية وتحديث الخزنة تلقائياً بمقدار هذه الذمة؟');
    if (isConfirmed) {
      deliverTrust(trustId);
      alert('تم التسليم/السداد وتحديث أرصدة الخزنة بنجاح تماشياً مع حركات الإخراج!');
    }
  };

  // Trigger External delivery dialog
  const handleDeliverExternalTrigger = (trust: Trust) => {
    setDeliveringExternalId(trust.id);
    setReceivedLaterAmount((trust.amount || 0).toString());
    setUpdatedNotes(trust.notes || '');
  };

  const handleDeliverExternalConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringExternalId) return;

    if (deliverExternalTrust) {
      deliverExternalTrust(
        deliveringExternalId,
        Number(receivedLaterAmount) || 0,
        updatedNotes.trim()
      );
      setDeliveringExternalId(null);
      alert('تم تسجيل تسليم العمل واستلام المقبوض الفعلي لاحقاً وإقفال الأمانة بنجاح!');
    }
  };

  // Share template
  const handleShareTrust = (trust: Trust) => {
    const text = getShareTextForTrust(trust);
    navigator.clipboard.writeText(text);
    alert('تم نسخ السند الموثق للأمانات والالتزامات لمشاركته على وسائل التواصل!');
  };

  // Format Helper
  const formatCurrency = (val: number, cur: string = 'YER') => {
    if (cur === 'YER') return `${val.toLocaleString()} ر.ي`;
    if (cur === 'SAR') return `${val.toLocaleString()} ريال سعودي`;
    if (cur === 'USD') return `$${val.toLocaleString()}`;
    return `${val.toLocaleString()} وحدة`;
  };

  // Filter local lists
  const filteredTrusts = trusts.filter(t => {
    // Tab filters
    if (activeTab === 'general') {
      // Show general trusts or "الدين علي"
      if (t.isExternalCustomer) return false;
    } else {
      // Show external customer trusts
      if (!t.isExternalCustomer) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    // Search filter
    if (searchText.trim() !== '') {
      const q = searchText.toLowerCase();
      const descMatches = t.description.toLowerCase().includes(q);
      const partyMatches = t.party.toLowerCase().includes(q);
      const guestMatches = t.customerName && t.customerName.toLowerCase().includes(q);
      const workMatches = t.workDetail && t.workDetail.toLowerCase().includes(q);

      if (!descMatches && !partyMatches && !guestMatches && !workMatches) return false;
    }

    return true;
  });

  // Calculate separate outstanding obligations "الدين عليّ"
  const myObligationsYER = trusts
    .filter(t => t.status === 'available' && !t.isExternalCustomer && t.isDebtAlayya && (!t.currency || t.currency === 'YER'))
    .reduce((sum, t) => sum + t.amount, 0);

  const myObligationsSAR = trusts
    .filter(t => t.status === 'available' && !t.isExternalCustomer && t.isDebtAlayya && t.currency === 'SAR')
    .reduce((sum, t) => sum + t.amount, 0);

  const myObligationsUSD = trusts
    .filter(t => t.status === 'available' && !t.isExternalCustomer && t.isDebtAlayya && t.currency === 'USD')
    .reduce((sum, t) => sum + t.amount, 0);

  const myObligationsGold = trusts
    .filter(t => t.status === 'available' && !t.isExternalCustomer && t.isDebtAlayya && t.currency === 'gold')
    .reduce((acc, t) => {
      const cal = t.caliber || '21';
      acc[cal] = (acc[cal] || 0) + (t.weight ?? t.amount);
      return acc;
    }, {} as Record<string, number>);

  const activeMyGoldCalibers = Object.keys(myObligationsGold).filter(cal => myObligationsGold[cal] > 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-100" dir="rtl">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Lock className="text-yellow-500 animate-pulse" size={24} />
            <span>كشف الأمانات والالتزامات المدمرة ("الدين عليّ والعهدة")</span>
          </h2>
          <p className="text-xs text-slate-400">نظام إدارة الأمانات المودعة لدينا والالتزامات المالية للآخرين معزولة ومستقلة بالكامل</p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'general' ? (
            <button
              onClick={() => setIsAddingGeneralTrust(!isAddingGeneralTrust)}
              className="bg-yellow-500 hover:bg-yellow-600 font-extrabold text-slate-950 px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {isAddingGeneralTrust ? <X size={15} /> : <PlusCircle size={15} />}
              <span>{isAddingGeneralTrust ? 'إغلاق النموذج' : 'تسجيل أمانة / دين علينا'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddingExternalTrust(!isAddingExternalTrust)}
              className="bg-purple-500 hover:bg-purple-600 font-extrabold text-white px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {isAddingExternalTrust ? <X size={15} /> : <PlusCircle size={15} />}
              <span>{isAddingExternalTrust ? 'إغلاق النموذج' : 'تسجيل أمانة زبون خارجي (مستقلة)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bento grid showing accumulated obligations on us */}
      <h3 className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-[-10px] pb-1.5 border-b border-slate-850/30">📊 إجمالي الالتزامات المستحقة علينا حالياً للآخرين ("الدين عليّ")</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* YER debts on us */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 block">ديون علينا (ريال يمني)</span>
          <span className="text-sm font-black font-mono text-rose-450 block text-rose-400 mt-1">
            {camouflage ? '••••••' : myObligationsYER.toLocaleString()} YER
          </span>
        </div>

        {/* SAR debts on us */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 block">ديون علينا (ريال سعودي)</span>
          <span className="text-sm font-black font-mono text-amber-500 block mt-1">
            {camouflage ? '••••••' : myObligationsSAR.toLocaleString()} SAR
          </span>
        </div>

        {/* USD debts on us */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 block">ديون علينا (دولار أمريكي)</span>
          <span className="text-sm font-black font-mono text-sky-400 block mt-1">
            {camouflage ? '••••••' : myObligationsUSD.toLocaleString()} USD
          </span>
        </div>

        {/* Gold debts on us */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 block">ذمم ذهب عينية علينا للآخرين</span>
          <div className="space-y-0.5 mt-1">
            {activeMyGoldCalibers.length === 0 ? (
              <span className="text-slate-600 text-[10px] block font-semibold">لا يوجد</span>
            ) : (
              activeMyGoldCalibers.map(cal => (
                <div key={cal} className="flex justify-between text-[11px] font-mono text-yellow-500 font-bold">
                  <span>عيار {cal}:</span>
                  <span>{camouflage ? '••' : myObligationsGold[cal]} جم</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trust Registration: General Trust and LIABILITY */}
      {activeTab === 'general' && isAddingGeneralTrust && (
        <form onSubmit={handleGeneralSubmit} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-2xl mx-auto animate-scale-up">
          <h3 className="text-xs font-black text-amber-500 block pb-1 border-b border-slate-900">✏️ تسجيل أمانة عامة لدينا أو دين مالي علينا</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Debt on us switch */}
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">نوع المعاملة والقيد الأساسي</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDebtAlayya(false)}
                  className={`py-1.5 text-xs font-bold rounded-md transition ${!isDebtAlayya ? 'bg-yellow-500 text-slate-950' : 'text-slate-400'}`}
                >
                  📥 أمانة مودعة لدينا للغير
                </button>
                <button
                  type="button"
                  onClick={() => setIsDebtAlayya(true)}
                  className={`py-1.5 text-xs font-bold rounded-md transition ${isDebtAlayya ? 'bg-rose-500 text-white' : 'text-slate-405 text-slate-400'}`}
                >
                  🚨 دين/التزام علينا للآخرين
                </button>
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">طبيعة العهدة</label>
              <select
                value={generalType}
                onChange={e => setGeneralType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="cash">💵 أمانة/التزام نقدي مالي (مبلغ كاش)</option>
                <option value="item">📦 أمانة/التزام عيني (قطعة عينية أو كسر)</option>
              </select>
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 font-sans">العملة / قيمة الالتزام</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-205 text-slate-200 focus:outline-none focus:border-yellow-500 font-bold"
              >
                <option value="YER">💵 ريال يمني (YER)</option>
                <option value="SAR">🇸🇦 ريال سعودي (SAR)</option>
                <option value="USD">🇺🇸 دولار أمريكي (USD)</option>
                <option value="gold">💎 ذهب بالجرامات والعيار</option>
                <option value="silver">🔗 فضة بالجرامات وعيارها</option>
                <option value="asset">📦 أصل عيني محدد</option>
              </select>
            </div>

            {/* Creditor / depositor */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-300">
                {isDebtAlayya ? 'صاحب الدين / الدائن المستحق للحق' : 'اسم المودع الأمانة (الجهة المقترنة)'}
              </label>
              <input
                type="text"
                placeholder="اسم العميل أو الجهة المعنية الموثق للذمة..."
                value={generalParty}
                onChange={e => setGeneralParty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-550 focus:border-yellow-500"
                required
              />
            </div>

            {/* If Asset chosen */}
            {currency === 'asset' && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300">اسم ووصف الأصل العيني</label>
                <input
                  type="text"
                  placeholder="مثال: ساعة ذهبية، مصحف عثماني مرهون، إلخ..."
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
            )}

            {/* If Gold/Silver chosen */}
            {(currency === 'gold' || currency === 'silver') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">العيار التقني لقيمة العهدة</label>
                  <input
                    type="text"
                    placeholder={currency === 'gold' ? "21" : "925"}
                    value={caliber}
                    onChange={e => setCaliber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 font-sans">الوزن الصافي المعلق بالجرام</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>
              </>
            )}

            {/* Numeric currency amount value */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-300">
                {currency === 'gold' || currency === 'silver' ? 'القيمة التقديرية باليمني (اختياري)' : 'قيمة ومبلغ الالتزام المالي / المقبوض'}
              </label>
              <input
                type="number"
                placeholder="0"
                value={generalAmount}
                onChange={e => setGeneralAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                required={currency !== 'gold' && currency !== 'silver' && currency !== 'asset'}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300">تفاصيل توضيحية لسبب القيد والأمانة</label>
            <textarea
              placeholder="مثال: دين علينا مقابل تصفية حساب ذهب، أو أمانة محفوظة باسم ورثة..."
              value={generalDesc}
              onChange={e => setGeneralDesc(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
              required
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-900 justify-end">
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              حفظ السند وتوثيق المعاملة
            </button>
            <button
              type="button"
              onClick={() => setIsAddingGeneralTrust(false)}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              تراجع
            </button>
          </div>
        </form>
      )}

      {/* Trust Creation Form: EXTERNAL CUSTOMER TRUST */}
      {activeTab === 'external' && isAddingExternalTrust && (
        <form onSubmit={handleExternalSubmit} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-2xl mx-auto animate-scale-up">
          <h3 className="text-xs font-black text-purple-400 block pb-1 border-b border-slate-905">👤 عزل شغل زبون خارجي (لحين الاستلام والتسوية المباشرة)</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">اسم الزبون الخارجي</label>
              <input
                type="text"
                placeholder="اسم الزبون المودع..."
                value={extCustomerName}
                onChange={e => setExtCustomerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">تفاصيل الشغل والعمل المطلوب</label>
              <input
                type="text"
                placeholder="مثال: طقم ذهب عيار 21، تفصيل خاتم..."
                value={extWorkDetail}
                onChange={e => setExtWorkDetail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">وصف القطعة / العين المرهونة كضمان</label>
              <input
                type="text"
                placeholder="مثال: إسوارة مكسورة، خاتم فضة..."
                value={extItemDescription}
                onChange={e => setExtItemDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 font-sans">القيمة التقديرية الآجلة للمعاملة</label>
              <input
                type="number"
                placeholder="0"
                value={extEstimatedValue}
                onChange={e => setExtEstimatedValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300">ملاحظات توضيحية للمتابعة العائلية</label>
            <textarea
              placeholder="اكتب ملاحظات بخصوص شروط القبض أو عزل المبالغ..."
              value={extNotes}
              onChange={e => setExtNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-205 text-slate-200"
            />
          </div>

          <div className="flex gap-2 justify-end border-t border-slate-900 pt-3">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              حفظ وتوثيق الأمانة المباشرة 👤
            </button>
            <button
              type="button"
              onClick={() => setIsAddingExternalTrust(false)}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              تراجع
            </button>
          </div>
        </form>
      )}

      {/* Navigation sub tabs */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full md:max-w-md mx-auto">
        <button
          onClick={() => {
            setActiveTab('general');
            setSearchText('');
          }}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition ${
            activeTab === 'general'
              ? 'bg-yellow-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔐 الأمانات العامة والديون التي علينا
        </button>

        <button
          onClick={() => {
            setActiveTab('external');
            setSearchText('');
          }}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition ${
            activeTab === 'external'
              ? 'bg-purple-500 text-white font-black'
              : 'text-slate-405 text-slate-400 hover:text-slate-200'
          }`}
        >
          👤 أمانات الزبائن الخارجيين
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={activeTab === 'general' ? 'البحث باسم المودع، الدائن أو تفاصيل الأمانة...' : 'البحث باسم الزبون الخارجي، تفاصيل الشغل ومتابعة التسليم...'}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs focus:outline-none focus:border-yellow-500 text-slate-205"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-300 focus:outline-none font-bold"
        >
          <option value="all">كل الحالات المعروضة</option>
          <option value="available">أمانات وذمم سارية ومحفوظة (🔒)</option>
          <option value="delivered">أمانات تم تسليمها/سدادها مكتملة (✅)</option>
        </select>
      </div>

      {/* Grid of cards showing matching elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrusts.map(trust => {
          const isCollected = trust.status === 'delivered';
          const isDebt = trust.isDebtAlayya;
          const trustCurrency = trust.currency || 'YER';

          return (
            <div key={trust.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 group">
              <div className="space-y-3 animate-fade-in">
                {/* Header info */}
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black ${
                    trust.isExternalCustomer 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                      : isDebt 
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-505/10'
                  }`}>
                    {trust.isExternalCustomer 
                      ? '👤 أمانة زبون خارجي'
                      : isDebt 
                        ? '🚨 التزام/دين علينا للغير' 
                        : '📥 أمانة أصلية عهدة لدينا'}
                  </span>

                  {isCollected ? (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20">
                      <CheckCircle2 size={10} />
                      تم إعادتها ومكتملة
                    </span>
                  ) : (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                      isDebt
                        ? 'bg-rose-500/10 text-rose-400 border-rose-550/20'
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      <Lock size={10} />
                      {isDebt ? 'عالق بالذمة مستحق' : 'محفوظة ومحرزة'}
                    </span>
                  )}
                </div>

                {/* Main Card Description */}
                <div className="space-y-1.5">
                  {trust.isExternalCustomer ? (
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-450 text-slate-400 flex items-center gap-1">
                        <span className="text-slate-500">اسم الزبون:</span>
                        <span className="text-slate-100 font-extrabold">{trust.customerName}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        <span className="text-slate-500 font-medium">العمل المطلوب:</span> {trust.workDetail}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed font-bold">
                        <span className="text-slate-500 font-medium">القطعة الأمانة:</span> {trust.itemDescription}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-200 leading-relaxed min-h-[36px]">
                        {trust.description}
                      </p>
                      {trust.assetName && (
                        <p className="text-[10px] text-emerald-450 text-emerald-400">
                          <span className="text-slate-500 font-medium font-sans">الأصل العيني:</span> {trust.assetName}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Metadata details list */}
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 space-y-1.5 text-[10px]">
                  {!trust.isExternalCustomer ? (
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <User size={11} className="text-slate-500" />
                      <span>{isDebt ? 'الدائن مستحق الحق:' : 'المودع:'}</span>
                      <span className="text-slate-200 font-black">{trust.party || 'جهة عامة'}</span>
                    </div>
                  ) : (
                    trust.notes && (
                      <div className="text-slate-450 text-slate-400">
                        <span className="text-slate-500 font-medium">ملاحظات:</span>{' '}
                        <span className="text-slate-300 italic">{trust.notes}</span>
                      </div>
                    )
                  )}

                  {/* Financial displays */}
                  {!trust.isExternalCustomer ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-500">المبلغ / الوزن معلق بالذمة:</span>
                        <span className={`font-black ${isDebt ? 'text-rose-400' : 'text-green-400'}`}>
                          {trust.weight ? `${trust.weight} جرام` : formatCurrency(trust.amount, trustCurrency)}
                        </span>
                      </div>
                      
                      {trust.caliber && (
                        <div className="flex items-center gap-1 text-[9px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded w-max">
                          <span>العيار التقني المعدني لقيمة الأمانة: {trust.caliber}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="font-mono text-slate-400 flex items-center gap-1">
                        <span className="text-slate-500">المبلغ التقديري:</span>
                        <span className="text-yellow-400 font-black">{formatCurrency(trust.amount || 0, 'YER')}</span>
                      </div>
                      {isCollected && (
                        <div className="font-mono text-emerald-400 flex items-center gap-1 font-bold">
                          <span>المبلغ المستلم لاحقاً بالدولاب الفعلي:</span>
                          <span>{formatCurrency(trust.amountReceivedLater || 0, 'YER')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamps */}
                <div className="text-[9px] font-mono text-slate-500 space-y-0.5 pt-1.5 border-t border-slate-850/50">
                  <p>تاريخ تسجيل مستند القيد: {trust.date} في {trust.time}</p>
                  {isCollected && (
                    <p className="text-emerald-500 font-black">
                      تاريخ السداد والتسوية الفعلي: {trust.deliveredDate} {trust.deliveredTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Functional actions footer footer */}
              <div className="flex gap-2 border-t border-slate-800 pt-3">
                {!isCollected && (
                  trust.isExternalCustomer ? (
                    <button
                      onClick={() => handleDeliverExternalTrigger(trust)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-lg text-[10px] transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Unlock size={11} />
                      <span>تسليم الحساب وإتمام المعاملة 👤</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeliverGeneralClick(trust.id)}
                      className={`flex-1 font-extrabold p-2 rounded-lg text-[10px] transition duration-150 flex items-center justify-center gap-1 cursor-pointer ${
                        isDebt 
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow shadow-rose-950'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black'
                      }`}
                    >
                      <Unlock size={11} />
                      <span>{isDebt ? 'تسجيل سداد وإجلاء الدين 🚨' : 'إعادة وتصفية الأمانة لأصيالها'}</span>
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => handleShareTrust(trust)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-305 text-slate-300 rounded-lg transition border border-slate-700 text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                  title="نسخ ومشاركة قالب إيصال السند"
                >
                  <Share2 size={11} />
                  <span>سند</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredTrusts.length === 0 && (
          <div className="col-span-1 md:col-span-3 text-center py-20 bg-slate-900 border border-slate-800 border-dashed rounded-2xl text-slate-405 text-slate-450 text-slate-500 text-xs">
            لا توجد أي سندات عهد أو بطاقات ديون مسجلة مطابقة للفلاتر الحالية.
          </div>
        )}
      </div>

      {/* External customer trust delivery dialog popup */}
      {deliveringExternalId && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleDeliverExternalConfirm} className="bg-slate-900 border border-slate-850 rounded-2xl p-6 max-w-md w-full text-slate-100 space-y-4 animate-scale-up" dir="rtl">
            <h4 className="text-md sm:text-lg font-black text-slate-100 flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <Unlock className="text-purple-500 animate-pulse" size={18} />
              <span>تسليم مستحقات الزبون الخارجي وإتمام التسوية الحقيقية</span>
            </h4>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">المبلغ الفعلي المقبوض الآن بالريال اليمني (YER)</label>
                <input
                  type="number"
                  value={receivedLaterAmount}
                  onChange={e => setReceivedLaterAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold font-sans">تحديث ملاحظات وتفاصيل تسوية التسليم</label>
                <textarea
                  value={updatedNotes}
                  onChange={e => setUpdatedNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  placeholder="مثال: تم التسليم للأخ الأكبر وتمام محاسبة الجهد..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800 justify-end">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 font-bold text-white px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                تأكيد التسليم وتأصيل المقبوض بانتظام!
              </button>
              <button
                type="button"
                onClick={() => setDeliveringExternalId(null)}
                className="bg-slate-800 hover:bg-slate-750 font-bold text-slate-300 px-3 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
