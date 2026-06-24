import React, { useState, useEffect } from 'react';
import { Shop, AppSettings } from '../types';
import { Check, Store, User, Receipt, PlusCircle, AlertCircle, Sparkles } from 'lucide-react';

interface NewJobSectionProps {
  shops: Shop[];
  addTransaction: (params: {
    type: 'shop' | 'external' | 'side';
    shopId?: string;
    workerName?: string;
    description: string;
    amount: number;
    points?: number;
    metalType: 'gold' | 'silver' | 'none';
    paymentMethod: 'cash' | 'credit';
    receivedAmount: number;
    date?: string;
    time?: string;
  }) => void;
  settings: AppSettings;
  saveSettings: (updated: AppSettings) => void;
}

const SIDE_DEFAULT_TASKS = ['تغيير بطارية ساعة', 'بيع علبة قطيفة', 'لحام نظارة طبية', 'صيانة قفل ساعة', 'بيع إكسسوار فضي مستورد'];

export default function NewJobSection({ shops, addTransaction, settings, saveSettings }: NewJobSectionProps) {
  const [activeTab, setActiveTab] = useState<'shop' | 'external' | 'side'>('shop');

  // Common Fields
  const [description, setDescription] = useState('');
  const [metalType, setMetalType] = useState<'gold' | 'silver' | 'none'>('gold');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('credit');
  const [amount, setAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  
  // Custom Date Overrides 
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  // Shop job fields
  const [workerName, setWorkerName] = useState('');
  const [points, setPoints] = useState('1'); // default 1 point
  const [pricePerPoint, setPricePerPoint] = useState(500);

  // Custom Success popup & dua
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [randomDua, setRandomDua] = useState('');

  // Dynamic colors matching general theme vars
  const getThemeVars = () => {
    switch (settings.themeColor) {
      case 'black':
        return {
          primary: '#d97706',
          primaryHover: '#b45309',
          primaryLight: 'rgba(217, 119, 6, 0.08)',
          primaryBorder: 'rgba(217, 119, 6, 0.2)',
          text: '#f59e0b',
          primaryText: '#ffffff',
          gradientFrom: '#fbbf24',
          gradientTo: '#b45309',
          badgeText: '#fef3c7',
          badgeBg: '#1e1b4b',
          ring: 'focus:ring-amber-500'
        };
      case 'gray':
        return {
          primary: '#3b82f6',
          primaryHover: '#2563eb',
          primaryLight: 'rgba(59, 130, 246, 0.08)',
          primaryBorder: 'rgba(59, 130, 246, 0.2)',
          text: '#60a5fa',
          primaryText: '#ffffff',
          gradientFrom: '#60a5fa',
          gradientTo: '#2563eb',
          badgeText: '#e0f2fe',
          badgeBg: '#1e293b',
          ring: 'focus:ring-blue-500'
        };
      case 'brown':
        return {
          primary: '#eab308',
          primaryHover: '#ca8a04',
          primaryLight: 'rgba(234, 179, 8, 0.08)',
          primaryBorder: 'rgba(234, 179, 8, 0.2)',
          text: '#fef08a',
          primaryText: '#fefefe',
          gradientFrom: '#fef08a',
          gradientTo: '#ca8a04',
          badgeText: '#fef9c3',
          badgeBg: '#451a03',
          ring: 'focus:ring-yellow-500'
        };
      case 'white':
      default:
        return {
          primary: '#f59e0b',
          primaryHover: '#d97706',
          primaryLight: 'rgba(245, 158, 11, 0.08)',
          primaryBorder: 'rgba(245, 158, 11, 0.2)',
          text: '#b45309',
          primaryText: '#0f172a',
          gradientFrom: '#fbbf24',
          gradientTo: '#d97706',
          badgeText: '#78350f',
          badgeBg: '#fef3c7',
          ring: 'focus:ring-amber-500'
        };
    }
  };

  const themeVars = getThemeVars();

  // Get up to 10 frequently used worker names across all shops (using round-robin to ensure diversity)
  const popularWorkers = React.useMemo(() => {
    const workersList: string[] = [];
    let maxWorkersCount = 0;
    shops.forEach(s => {
      if (s.workers && s.workers.length > maxWorkersCount) {
        maxWorkersCount = s.workers.length;
      }
    });

    for (let i = 0; i < maxWorkersCount; i++) {
      shops.forEach(s => {
        if (s.workers && s.workers[i]) {
          const w = s.workers[i].trim();
          if (w && !workersList.includes(w)) {
            workersList.push(w);
          }
        }
      });
    }

    return workersList.slice(0, 10);
  }, [shops]);

  // Fallback preset tasks
  const presetTasks = settings.presetTasks && settings.presetTasks.length > 0
    ? settings.presetTasks
    : ['تقصير خاتم', 'تقصير محبس', 'لحام عراوي', 'لحام سلس', 'لحام قطب', 'لحام بدلة'];

  const displayedPresetTasks = presetTasks.slice(0, 15);
  const remainingPresetTasks = presetTasks.slice(15);

  const [lastWorkerName, setLastWorkerName] = useState('');

  // Points calculation helper based on selected worker's shop pricePerPoint
  useEffect(() => {
    if (activeTab === 'shop') {
      const trimmedWorker = workerName.trim();
      if (trimmedWorker !== lastWorkerName) {
        setLastWorkerName(trimmedWorker);
        const matchedShop = shops.find(shop => 
          shop.workers && shop.workers.some(w => w.trim().toLowerCase() === trimmedWorker.toLowerCase())
        );
        const matchedPrice = matchedShop ? matchedShop.pricePerPoint : (shops[0]?.pricePerPoint || 500);
        setPricePerPoint(matchedPrice);

        const computed = (Number(points) || 1) * matchedPrice;
        setAmount(computed.toString());
      } else {
        // Recompute with current points and pricePerPoint without overwriting manual price changes
        const computed = (Number(points) || 1) * pricePerPoint;
        setAmount(computed.toString());
      }
    }
  }, [points, workerName, pricePerPoint, activeTab, shops, lastWorkerName]);

  // Handle Cash/Credit Received Defaults
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setReceivedAmount(amount);
    } else {
      setReceivedAmount('0'); // Default to 0 for credit
    }
  }, [paymentMethod, amount]);

  const resetFormState = () => {
    setDescription('');
    setPoints('1');
    setCustomDate('');
    setCustomTime('');
    setAmount('');
    setReceivedAmount('');
    setPaymentMethod('credit');
    setWorkerName('');
    setLastWorkerName('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('يجب إدخال تفاصيل العمل!');
      return;
    }

    let finalShopId = undefined;
    let finalWorkerName = undefined;

    if (activeTab === 'shop') {
      const trimmedWorker = workerName.trim();
      if (!trimmedWorker) {
        alert('لا يمكن ترحيل العملية: يجب توفير أو تحديد اسم العامل!');
        return;
      }

      // Find shop matching this worker
      const matchedShop = shops.find(shop => 
        shop.workers && shop.workers.some(w => w.trim().toLowerCase() === trimmedWorker.toLowerCase())
      );

      if (!matchedShop) {
        alert('خطأ: يرجى إضافة العمال إلى محل أولاً من كشف وإدارة المحلات!');
        return;
      }

      finalWorkerName = trimmedWorker;
      finalShopId = matchedShop.id;
    }

    const txAmount = Number(amount);
    const txReceived = Number(receivedAmount);

    if (isNaN(txAmount) || txAmount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح للعملية!');
      return;
    }

    if (txReceived > txAmount) {
      alert('المبلغ المستلم لا يمكن أن يكون أكبر من مبلغ العملية الإجمالي!');
      return;
    }

    // Call addTransaction
    addTransaction({
      type: activeTab,
      shopId: finalShopId,
      workerName: finalWorkerName,
      description: description.trim(),
      amount: txAmount,
      points: activeTab === 'shop' ? Number(points) : undefined,
      metalType: activeTab === 'side' ? 'none' : metalType,
      paymentMethod,
      receivedAmount: txReceived,
      date: customDate ? customDate : undefined,
      time: customTime ? customTime : undefined
    });

    // Auto-save any newly introduced description to settings presetTasks automatically as requested!
    const introducedTask = description.trim();
    if (introducedTask && !presetTasks.includes(introducedTask)) {
      const updatedTasks = [...presetTasks, introducedTask];
      saveSettings({
        ...settings,
        presetTasks: updatedTasks
      });
    }

    // Set custom randomized dua and show popup for 1.5 seconds
    const prayers = ['اللهم بارك لي', 'اللهم ارزقني', 'ماشاء الله'];
    const chosenPrayer = prayers[Math.floor(Math.random() * prayers.length)];
    setRandomDua(chosenPrayer);
    setShowSuccessPopup(true);
    resetFormState();

    setTimeout(() => {
      setShowSuccessPopup(false);
      // Trigger quick page reload after timeout or state change if shops updated
      if (activeTab === 'shop' && !shops.some(s => s.workers.includes(workerName.trim()))) {
        window.location.reload();
      }
    }, 1500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 max-w-3xl mx-auto shadow-sm animate-fade-in text-slate-800" dir="rtl">
      
      {/* 1. Tab Switchers */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => {
            setActiveTab('shop');
            setMetalType('gold');
            resetFormState();
          }}
          className="flex-1 py-1.5 text-xs font-extrabold rounded-lg transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
          style={activeTab === 'shop' ? {
            backgroundColor: themeVars.primary,
            color: themeVars.primaryText,
          } : {
            color: '#64748b'
          }}
          id="newjob-tab-shop"
        >
          <Store size={14} />
          <span>شغل المحلات</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('external');
            setMetalType('gold');
            resetFormState();
          }}
          className="flex-1 py-1.5 text-xs font-extrabold rounded-lg transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
          style={activeTab === 'external' ? {
            backgroundColor: themeVars.primary,
            color: themeVars.primaryText,
          } : {
            color: '#64748b'
          }}
          id="newjob-tab-external"
        >
          <User size={14} />
          <span>زبون خارجي مباشر</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('side');
            setMetalType('none');
            resetFormState();
          }}
          className="flex-1 py-1.5 text-xs font-extrabold rounded-lg transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
          style={activeTab === 'side' ? {
            backgroundColor: themeVars.primary,
            color: themeVars.primaryText,
          } : {
            color: '#64748b'
          }}
          id="newjob-tab-side"
        >
          <Receipt size={14} />
          <span>الدخل الجانبي والخدمات</span>
        </button>
      </div>

      {/* 2. Main Form container */}
      <form onSubmit={handleFormSubmit} className="space-y-3.5">
        
        {/* Worker Info block (Only for Shop Job) */}
        {activeTab === 'shop' && (
          <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-slate-700 block">اسم العامل المكلف بالاستلام</label>
              
              {/* Dynamic Warning Indicator / Associated Shop display */}
              {(() => {
                const trimmed = workerName.trim();
                if (!trimmed) return null;
                const matchedShop = shops.find(shop => 
                  shop.workers && shop.workers.some(w => w.trim().toLowerCase() === trimmed.toLowerCase())
                );
                if (matchedShop) {
                  return (
                    <span className="text-[10px] text-slate-400 font-bold">
                      🏪 مرتبط بـ: {matchedShop.name}
                    </span>
                  );
                } else {
                  return (
                    <span className="text-[10px] text-rose-600 font-black flex items-center gap-0.5 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 animate-pulse">
                      <AlertCircle size={10} />
                      خطأ: يرجى إضافة العمال إلى محل
                    </span>
                  );
                }
              })()}
            </div>
            
            <input
              type="text"
              value={workerName}
              onChange={e => setWorkerName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-bold focus:outline-none focus:border-amber-500 focus:ring-0"
              required
              id="worker-manual-input"
              placeholder="اكتب اسم العامل المكلف بالاستلام..."
            />

            {/* Popular Workers Selection Chips - EXACTLY 10 DIVERSE REGISTERED WORKERS */}
            {popularWorkers.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-extrabold block">اختر من أسماء العمال المكلفين (أكثر 10 تكراراً):</span>
                <div className="flex flex-wrap gap-1">
                  {popularWorkers.map(worker => {
                    const associatedShop = shops.find(shop => 
                      shop.workers && shop.workers.some(w => w.trim().toLowerCase() === worker.toLowerCase())
                    );
                    return (
                      <button
                        type="button"
                        key={worker}
                        onClick={() => setWorkerName(worker)}
                        className="text-[10px] px-2 py-0.5 rounded-md border transition font-bold flex flex-col items-center justify-center cursor-pointer"
                        style={{
                          backgroundColor: workerName === worker ? themeVars.badgeBg : '#ffffff',
                          borderColor: workerName === worker ? themeVars.primary : '#e2e8f0',
                          color: workerName === worker ? themeVars.badgeText : '#475569'
                        }}
                      >
                        <span>{worker}</span>
                        {associatedShop && (
                          <span className="text-[8px] opacity-70 font-normal">({associatedShop.name})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description inputs */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 block">تفاصيل وتوصيف العمل</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-850 text-xs font-bold focus:outline-none focus:border-amber-500 focus:ring-0"
            required
            id="job-description-input"
            placeholder="مثال: تقصير خاتم، لحام كسر، صيانة..."
          />

          {/* Preset Chips (Only first 15, the rest are in select dropdown to save space) */}
          <div className="flex flex-wrap gap-1 items-center pt-0.5">
            <span className="text-[9px] text-slate-400 font-extrabold ml-1">الأوصاف الشائعة:</span>
            {(activeTab === 'side' ? SIDE_DEFAULT_TASKS : displayedPresetTasks).map(task => (
              <button
                type="button"
                key={task}
                onClick={() => setDescription(task)}
                className={`text-[9px] border px-2 py-0.5 rounded transition duration-150 font-bold cursor-pointer ${
                  description === task 
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700' 
                    : 'bg-white text-slate-600 border-slate-250 hover:border-slate-300'
                }`}
              >
                {task}
              </button>
            ))}

            {/* Remaining Presets in Dropdown to eliminate screen clutter */}
            {activeTab !== 'side' && remainingPresetTasks.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setDescription(e.target.value);
                    e.target.value = ''; 
                  }
                }}
                className="text-[9px] bg-slate-50 text-slate-600 font-extrabold border border-slate-300 rounded px-1.5 py-0.5 cursor-pointer max-w-[140px]"
              >
                <option value="">باقي قائمة الأوصاف ({remainingPresetTasks.length})...</option>
                {remainingPresetTasks.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Metal and Points selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Metal type (Hidden/Disabled for Side tasks) */}
          {activeTab !== 'side' ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">نوع المعدن</label>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMetalType('gold')}
                  className="flex-1 py-1 text-xs font-extrabold rounded-md transition cursor-pointer"
                  style={{
                    backgroundColor: metalType === 'gold' ? themeVars.primary : 'transparent',
                    color: metalType === 'gold' ? themeVars.primaryText : '#64748b'
                  }}
                  id="metaltype-gold-btn"
                >
                  ذهب 🪙
                </button>
                <button
                  type="button"
                  onClick={() => setMetalType('silver')}
                  className="flex-1 py-1 text-xs font-extrabold rounded-md transition cursor-pointer"
                  style={{
                    backgroundColor: metalType === 'silver' ? '#cbd5e1' : 'transparent',
                    color: metalType === 'silver' ? '#0f172a' : '#64748b'
                  }}
                  id="metaltype-silver-btn"
                >
                  فضة 💍
                </button>
                <button
                  type="button"
                  onClick={() => setMetalType('none')}
                  className="flex-1 py-1 text-xs font-extrabold rounded-md transition cursor-pointer"
                  style={{
                    backgroundColor: metalType === 'none' ? '#64748b' : 'transparent',
                    color: metalType === 'none' ? '#ffffff' : '#64748b'
                  }}
                  id="metaltype-none-btn"
                >
                  بلا معدن
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">نوع المعدن</label>
              <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-500 font-bold">
                الدخل الجانبي لا يستند لحسابات المعادن
              </div>
            </div>
          )}

          {/* Points calculation for Shop jobs, otherwise absolute custom amount input */}
          {activeTab === 'shop' ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">عدد النقاط (الحبات)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={points}
                  onChange={e => setPoints(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 text-xs font-extrabold font-mono text-center focus:outline-none focus:border-amber-500"
                  required
                  id="job-points-input"
                />
                
                {/* Manual point price override input field */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold">السعر:</span>
                  <input
                    type="number"
                    value={pricePerPoint}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setPricePerPoint(val);
                    }}
                    className="w-16 bg-white border border-slate-300 rounded px-1 py-0.5 text-center font-mono font-extrabold text-[11px] focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[9px] text-slate-400 font-bold">ر.ي</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">سعر وقيمة العمل (ريال)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 text-xs font-extrabold font-mono focus:outline-none focus:border-amber-500"
                required
                id="job-custom-amount-input"
              />
            </div>
          )}
        </div>

        {/* Output Amount Highlight: COMPACT & CLEAR */}
        <div className="flex flex-col items-center justify-center bg-amber-50/20 border border-amber-100 py-2.5 rounded-xl text-center space-y-0.5 my-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400">إجمالي الحساب المالي للعملية</span>
          <div 
            className="text-2xl font-black font-mono tracking-tight"
            style={{
              color: themeVars.primary
            }}
          >
            {Number(amount) || 0} ريال
          </div>
        </div>

        {/* Payment Method and Received details */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Payment Method select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">طريقة الدفع</label>
              <div className="flex bg-white p-0.5 rounded-lg border border-slate-250 shadow-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className="flex-1 py-1 text-xs font-bold rounded transition cursor-pointer"
                  style={{
                    backgroundColor: paymentMethod === 'cash' ? themeVars.primary : 'transparent',
                    color: paymentMethod === 'cash' ? themeVars.primaryText : '#64748b'
                  }}
                  id="payment-method-cash"
                >
                  مسلم
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className="flex-1 py-1 text-xs font-bold rounded transition cursor-pointer"
                  style={{
                    backgroundColor: paymentMethod === 'credit' ? themeVars.primary : 'transparent',
                    color: paymentMethod === 'credit' ? themeVars.primaryText : '#64748b'
                  }}
                  id="payment-method-credit"
                >
                  أجل
                </button>
              </div>
            </div>

            {/* Received Amount Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {paymentMethod === 'cash' ? 'المبلغ المستلم الفعلي (مغلق)' : 'المستلم كعربون'}
              </label>
              <input
                type="number"
                value={receivedAmount}
                onChange={e => setReceivedAmount(e.target.value)}
                disabled={paymentMethod === 'cash'}
                className={`w-full bg-white border rounded-lg px-2.5 py-1 text-slate-800 text-xs font-extrabold font-mono focus:outline-none focus:border-amber-500 ${
                  paymentMethod === 'cash' ? 'opacity-60 border-slate-200' : 'border-slate-300'
                }`}
                required
                id="received-amount-input"
              />
            </div>
          </div>

          {paymentMethod === 'credit' && (
            <div className="text-[10px] text-rose-600 flex items-center gap-1 font-bold">
              <AlertCircle size={10} className="shrink-0 text-rose-500" />
              <span>سيتم ترحيل دين قدره {(Number(amount) || 0) - (Number(receivedAmount) || 0)} ر.ي إلى كشف ديون المعنيين تلقائياً.</span>
            </div>
          )}
        </div>

        {/* Optional Custom Timing inputs */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              if (customDate) {
                setCustomDate('');
                setCustomTime('');
              } else {
                setCustomDate(new Date().toISOString().split('T')[0]);
                setCustomTime(new Date().toTimeString().split(' ')[0].substring(0,5));
              }
            }}
            className="text-[9px] text-blue-600 hover:underline hover:text-blue-500 font-bold block"
          >
            {customDate ? '← إلغاء التعديل والتخصيص' : '+ تعديل تاريخ ووقت العملية بشكل يدوي'}
          </button>

          {customDate !== '' && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold">تاريخ العملية اليدوي</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold">وقت العملية اليدوي</label>
                <input
                  type="time"
                  value={customTime}
                  onChange={e => setCustomTime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Submit Button */}
        <button
          type="submit"
          className="w-full font-black py-2.5 px-4 rounded-xl transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 text-xs shadow-md cursor-pointer"
          style={{
            backgroundColor: themeVars.primary,
            color: themeVars.primaryText,
          }}
          id="add-job-button"
        >
          <PlusCircle size={15} />
          <span>تأكيد وتسجيل العملية بالنظام</span>
        </button>
      </form>

      {/* Beautiful eye-comfortable success popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 border border-slate-150 dark:border-zinc-800 text-center max-w-[280px] select-none animate-scale-up">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm"
              style={{ backgroundColor: `${themeVars.primary}15`, color: themeVars.primary }}
            >
              ✨
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-zinc-50 leading-tight">
                تم حفظ العملية بنجاح!
              </h4>
              <p className="text-sm font-extrabold px-4 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/15">
                {randomDua}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
