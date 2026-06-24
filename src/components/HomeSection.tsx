import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Transaction, Trust, MetalTransaction, AppSettings, Shop } from '../types';
import { getHijriDate, getRandomSupplication } from '../utils';
import { 
  TrendingUp, ArrowDownLeft, ArrowUpRight, Scale, Clock, Compass, 
  Search, ShieldAlert, Sparkles, AlertCircle, Share2, Eye, EyeOff, Plus, Trash2, Coins, ChevronLeft,
  Lock, PlusCircle, X
} from 'lucide-react';

interface HomeSectionProps {
  transactions: Transaction[];
  metalTransactions: MetalTransaction[];
  vaultTransactions: any[];
  addMetalTransaction: (params: {
    type: 'buy' | 'sell';
    metalType: 'gold' | 'silver';
    purity: string;
    weight: number;
    pricePerUnit: number;
    totalAmount: number;
    fundingSource?: 'collected' | 'free_vault';
    notes?: string;
    date?: string;
    time?: string;
    count?: number;
  }) => { success: boolean; error?: string };
  settings: AppSettings;
  camouflage: boolean;
  toggleCamouflage: () => void;
  onNavigate?: (pageId: string) => void;
  onTriggerMarketClosing?: () => void;
  addTransaction?: (params: {
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
  addTrust?: (type: 'cash' | 'item', description: string, amount: number, party: string, customDate?: string, customTime?: string) => any;
  addVaultOutflow?: (
    reason: string,
    amount: number,
    source?: 'free_vault' | 'collected' | 'both',
    customDate?: string,
    customTime?: string,
    customCollectedAmount?: number,
    customVaultAmount?: number
  ) => void;
  shops?: Shop[];
}

export default function HomeSection({
  transactions,
  metalTransactions,
  vaultTransactions,
  addMetalTransaction,
  settings,
  camouflage,
  toggleCamouflage,
  onNavigate,
  onTriggerMarketClosing,
  addTransaction,
  addTrust,
  addVaultOutflow,
  shops = []
}: HomeSectionProps) {
  // Real-time ticking Clock without seconds
  const [currentRealTime, setCurrentRealTime] = useState('');
  const [greetingPrefix, setGreetingPrefix] = useState('بالتوفيق');
  const [supplication, setSupplication] = useState('');
  const [showMetalChoiceModal, setShowMetalChoiceModal] = useState(false);

  const downloadProjectZip = () => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'smart_ledger_project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentRealTime(now.toLocaleTimeString('ar-YE', { hour: 'numeric', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Warm friendly greeting setups on mount ("عند كل دخول")
    // pick from exactly: 'مساء الخير', 'صباح الخير', 'يوم سعيد', 'وفقك الله', 'بالتوفيق'
    const hours = new Date().getHours();
    const options = ['وفقك الله', 'بالتوفيق'];
    if (hours >= 5 && hours < 12) {
      options.push('صباح الخير');
      options.push('يوم سعيد');
    } else if (hours >= 12 && hours < 17) {
      options.push('يوم سعيد');
    } else {
      options.push('مساء الخير');
      options.push('يوم سعيد');
    }
    const chosen = options[Math.floor(Math.random() * options.length)];
    setGreetingPrefix(chosen);

    // Dynamic supplication setting
    setSupplication(getRandomSupplication());

    return () => clearInterval(timer);
  }, []);

  // Local states for CAMOUFLAGE (Enabled by default automatically, Reset to true on navigate away / unmount)
  const [camoDailyIncome, setCamoDailyIncome] = useState(true);
  const [camoDailyExpense, setCamoDailyExpense] = useState(true);
  const [camoDailyDebts, setCamoDailyDebts] = useState(true);
  const [camoDailyReceived, setCamoDailyReceived] = useState(true);
  const [camoGold, setCamoGold] = useState(true);
  const [camoSilver, setCamoSilver] = useState(true);

  // States for the new Debt modal & options
  const [showDebtChoiceModal, setShowDebtChoiceModal] = useState(false);
  const [debtActionType, setDebtActionType] = useState<'li' | 'alayya' | null>(null);
  
  // States for Adding Debt "دين لي"
  const [debtShopId, setDebtShopId] = useState('');
  const [debtDescription, setDebtDescription] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtReceivedAmount, setDebtReceivedAmount] = useState('');
  const [debtWorkerName, setDebtWorkerName] = useState('');

  // States for Adding Debt "دين علي"
  const [creditorName, setCreditorName] = useState('');
  const [liabilityDetail, setLiabilityDetail] = useState('');
  const [liabilityAmount, setLiabilityAmount] = useState('');

  // States for the new Outflow "الخرج الفوري" modal
  const [showOutflowModal, setShowOutflowModal] = useState(false);
  const [outflowReason, setOutflowReason] = useState('');
  const [outflowAmount, setOutflowAmount] = useState('');
  const [outflowSource, setOutflowSource] = useState<'free_vault' | 'collected' | 'both'>('free_vault');
  const [jointCollectedAmount, setJointCollectedAmount] = useState<string>('');
  const [jointVaultAmount, setJointVaultAmount] = useState<string>('');

  const handleOutflowAmountChange = (val: string) => {
    setOutflowAmount(val);
    const amt = Number(val);
    if (!isNaN(amt) && amt > 0) {
      if (outflowSource === 'both') {
        const coll = Math.round(amt / 2);
        setJointCollectedAmount(String(coll));
        setJointVaultAmount(String(amt - coll));
      }
    } else {
      setJointCollectedAmount('');
      setJointVaultAmount('');
    }
  };

  const handleOutflowSourceChange = (src: 'free_vault' | 'collected' | 'both') => {
    setOutflowSource(src);
    if (src === 'both') {
      const amt = Number(outflowAmount);
      if (!isNaN(amt) && amt > 0) {
        const coll = Math.round(amt / 2);
        setJointCollectedAmount(String(coll));
        setJointVaultAmount(String(amt - coll));
      }
    }
  };

  const handleJointCollectedChange = (val: string) => {
    setJointCollectedAmount(val);
    const tot = Number(outflowAmount) || 0;
    const coll = Number(val) || 0;
    if (coll <= tot) {
      setJointVaultAmount(String(tot - coll));
    }
  };

  const handleJointVaultChange = (val: string) => {
    setJointVaultAmount(val);
    const tot = Number(outflowAmount) || 0;
    const vlt = Number(val) || 0;
    if (vlt <= tot) {
      setJointCollectedAmount(String(tot - vlt));
    }
  };

  // Subpage switcher state for Assets (الأصول)
  const [showAssetsPage, setShowAssetsPage] = useState(false);

  // Management and movement of metals (gold/silver) collapsed by default and only shows tabs on click
  const [showMetalDetails, setShowMetalDetails] = useState(false);

  // Local state for Buy/Sell Form Toggle
  const [metalActionType, setMetalActionType] = useState<'buy' | 'sell'>('buy');
  
  // Buy Form parameters
  const [buyMetalType, setBuyMetalType] = useState<'gold' | 'silver'>('gold');
  const [buyPurity, setBuyPurity] = useState('21');
  const [buyWeight, setBuyWeight] = useState('');
  const [buyPricePerUnit, setBuyPricePerUnit] = useState('');
  const [buyCustomTotal, setBuyCustomTotal] = useState('');
  const [buyFundingSource, setBuyFundingSource] = useState<'collected' | 'free_vault'>('free_vault');
  const [buyNotes, setBuyNotes] = useState('');
  const [buyCount, setBuyCount] = useState('');

  // Sell Form parameters
  const [sellMetalType, setSellMetalType] = useState<'gold' | 'silver'>('gold');
  const [sellPurity, setSellPurity] = useState('21');
  const [sellWeight, setSellWeight] = useState('');
  const [sellPricePerUnit, setSellPricePerUnit] = useState('');
  const [sellCustomTotal, setSellCustomTotal] = useState('');
  const [sellNotes, setSellNotes] = useState('');
  const [sellCount, setSellCount] = useState('');

  // Search/Filters for History
  const [metalSearchText, setMetalSearchText] = useState('');
  const [filterMetal, setFilterMetal] = useState<'all' | 'gold' | 'silver'>('all');
  const [filterAction, setFilterAction] = useState<'all' | 'buy' | 'sell'>('all');

  // Daily supplication selection
  const activeSupplication = settings.useCustomSupplication && settings.customSupplication
    ? settings.customSupplication
    : (supplication || getRandomSupplication());

  // Calculate totals
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];
  const todayStr = getTodayDateStr();
  const todayTransactions = transactions.filter(tx => tx.date === todayStr);

  const todayIncome = todayTransactions.reduce((sum, tx) => sum + tx.receivedAmount, 0);
  
  const todayExpense = vaultTransactions
    .filter(vt => vt.type === 'out' && vt.date === todayStr)
    .reduce((sum, vt) => sum + vt.amount, 0);

  const todayDebts = todayTransactions
    .filter(tx => tx.paymentMethod === 'credit')
    .reduce((sum, tx) => sum + (tx.amount - tx.receivedAmount), 0);

  const todayReceivedDirect = todayTransactions.reduce((sum, tx) => sum + tx.receivedAmount, 0);
  const todayReceivedDebtPay = vaultTransactions
    .filter(vt => vt.type === 'in' && vt.date === todayStr && vt.reason.includes('دين'))
    .reduce((sum, vt) => sum + vt.amount, 0);
  const todayReceived = todayReceivedDirect + todayReceivedDebtPay;

  const todayOperationsCount = todayTransactions.length;
  const todayNewJobCount = todayTransactions.filter(tx => tx.source === 'new_job').length;

  const totalIncome = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalCollected = transactions.reduce((sum, tx) => sum + tx.receivedAmount, 0);
  const totalDebts = transactions.reduce((sum, tx) => {
    if (tx.paymentMethod === 'credit') {
      return sum + (tx.amount - tx.receivedAmount);
    }
    return sum;
  }, 0);

  const currentVaultVal = vaultTransactions.length > 0 
    ? vaultTransactions[vaultTransactions.length - 1].balanceAfter 
    : 0;

  // Calculators for metal stock balances
  const goldBoughtWeight = metalTransactions
    .filter(t => t.metalType === 'gold' && t.type === 'buy')
    .reduce((sum, t) => sum + t.weight, 0);
  const goldSoldWeight = metalTransactions
    .filter(t => t.metalType === 'gold' && t.type === 'sell')
    .reduce((sum, t) => sum + t.weight, 0);

  const silverBoughtWeight = metalTransactions
    .filter(t => t.metalType === 'silver' && t.type === 'buy')
    .reduce((sum, t) => sum + t.weight, 0);
  const silverSoldWeight = metalTransactions
    .filter(t => t.metalType === 'silver' && t.type === 'sell')
    .reduce((sum, t) => sum + t.weight, 0);

  const activeGoldInventory = Math.max(0, goldBoughtWeight - goldSoldWeight);
  const activeSilverInventory = Math.max(0, silverBoughtWeight - silverSoldWeight);

  // Compute calculated Total of buy or sell directly 
  const calculatedBuyTotal = (Number(buyWeight) || 0) * (Number(buyPricePerUnit) || 0);
  const finalBuyTotalDisplay = buyCustomTotal !== '' ? Number(buyCustomTotal) : calculatedBuyTotal;

  const calculatedSellTotal = (Number(sellWeight) || 0) * (Number(sellPricePerUnit) || 0);
  const finalSellTotalDisplay = sellCustomTotal !== '' ? Number(sellCustomTotal) : calculatedSellTotal;

  const handleRegisterBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyWeight || !buyPricePerUnit) return;

    const res = addMetalTransaction({
      type: 'buy',
      metalType: buyMetalType,
      purity: buyPurity,
      weight: Number(buyWeight),
      pricePerUnit: Number(buyPricePerUnit),
      totalAmount: finalBuyTotalDisplay,
      fundingSource: buyFundingSource,
      notes: buyNotes,
      count: buyCount ? Number(buyCount) : undefined
    });

    if (res && !res.success) {
      alert(res.error);
      return;
    }

    // Reset forms
    setBuyWeight('');
    setBuyPricePerUnit('');
    setBuyCustomTotal('');
    setBuyNotes('');
    setBuyCount('');
    alert('تم تسجيل عملية شراء المعدن بنجاح وربطها مالياً!');
  };

  const handleRegisterSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellWeight || !sellPricePerUnit) return;

    const res = addMetalTransaction({
      type: 'sell',
      metalType: sellMetalType,
      purity: sellPurity,
      weight: Number(sellWeight),
      pricePerUnit: Number(sellPricePerUnit),
      totalAmount: finalSellTotalDisplay,
      notes: sellNotes,
      count: sellCount ? Number(sellCount) : undefined
    });

    if (res && !res.success) {
      alert(res.error);
      return;
    }

    // Reset forms
    setSellWeight('');
    setSellPricePerUnit('');
    setSellCustomTotal('');
    setSellNotes('');
    setSellCount('');
    alert('تم تسجيل عملية بيع المعدن كدخل بالخزنة بنجاح!');
  };

  // Add Debt "دين لي" handler
  const handleAddDebtLi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtShopId) {
      alert('الرجاء اختيار المحل المستحق عليه الدين!');
      return;
    }
    const amt = Number(debtAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('الرجاء إدخال مبلغ صحيح للدين!');
      return;
    }
    const rec = Number(debtReceivedAmount) || 0;
    if (rec < 0 || rec >= amt) {
      alert('المبلغ المقبوض مقدماً يجب أن يكون موجباً وأقل من المبلغ الكلي للدين!');
      return;
    }

    if (addTransaction) {
      addTransaction({
        type: 'shop',
        shopId: debtShopId,
        workerName: debtWorkerName.trim() || undefined,
        description: debtDescription.trim() || 'قيد دين آجل مستحق',
        amount: amt,
        metalType: 'none',
        paymentMethod: 'credit',
        receivedAmount: rec
      });

      // Clear state
      setDebtShopId('');
      setDebtDescription('');
      setDebtAmount('');
      setDebtReceivedAmount('');
      setDebtWorkerName('');
      setDebtActionType(null);
      setShowDebtChoiceModal(false);
      alert('تم تسجيل ذمة الدين الآجل على المحل بنجاح وتوجيهه لكشف الحسابات!');
    } else {
      alert('هذه الميزة غير متوفرة حالياً!');
    }
  };

  // Add Debt "دين علي" handler
  const handleAddDebtAlayya = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditorName.trim()) {
      alert('الرجاء إدخال اسم الدائن صاحب الحق!');
      return;
    }
    const amt = Number(liabilityAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('الرجاء إدخال مبلغ صحيح للالتزام!');
      return;
    }

    if (addTrust) {
      const fullDesc = `دين علينا: ${liabilityDetail.trim() || 'التزام مالي فوري'}`;
      addTrust('cash', fullDesc, amt, creditorName.trim());

      // Clear state
      setCreditorName('');
      setLiabilityDetail('');
      setLiabilityAmount('');
      setDebtActionType(null);
      setShowDebtChoiceModal(false);
      alert('تم إدراج وتحريز الدين الذي علينا كعهدة مالية بالأمانات بنجاح للمتابعة والتسليم!');
    } else {
      alert('هذه الميزة غير متوفرة حالياً!');
    }
  };

  // Add Outflow "الخرج" handler
  const handleAddOutflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outflowReason.trim()) {
      alert('الرجاء إدخال سبب/بيان المصروف والخرج!');
      return;
    }
    const amt = Number(outflowAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('الرجاء إدخال مبلغ صحيح وموجب!');
      return;
    }

    let sourceLabel = '';
    if (outflowSource === 'free_vault') {
      sourceLabel = 'المال الحر في الخزنة';
    } else if (outflowSource === 'collected') {
      sourceLabel = 'المال المستلم';
    } else {
      sourceLabel = 'المال الحر والمال المستلم معاً';
    }

    const finalReason = `${outflowReason.trim()} [مصدر الخرج: ${sourceLabel}]`;

    const colAmt = outflowSource === 'both' ? Number(jointCollectedAmount) : 0;
    const vltAmt = outflowSource === 'both' ? Number(jointVaultAmount) : 0;

    if (outflowSource === 'both') {
      if (isNaN(colAmt) || isNaN(vltAmt) || (colAmt + vltAmt) !== amt) {
        alert('حدث خطأ! يجب أن يتطابق مجموع حسم المال المستمر والمال بالخزنة مع كلي المصروف المحقق.');
        return;
      }
    }

    if (addVaultOutflow) {
      addVaultOutflow(
        finalReason, 
        amt, 
        outflowSource, 
        undefined, 
        undefined,
        outflowSource === 'both' ? colAmt : undefined,
        outflowSource === 'both' ? vltAmt : undefined
      );

      // Clear state
      setOutflowReason('');
      setOutflowAmount('');
      setOutflowSource('free_vault');
      setJointCollectedAmount('');
      setJointVaultAmount('');
      setShowOutflowModal(false);
      alert('تم ترحيل وقيد المصروف بالخرج الجديد حسب النظام بنجاح!');
    } else {
      alert('هذه الميزة غير متوفرة حالياً!');
    }
  };

  const shareMetalTx = (tx: MetalTransaction) => {
    const textMsg = `📄 *عملية معادن - دفتري الذكي*\n` +
      `🔨 *العملية:* ${tx.type === 'buy' ? '📥 شراء معدن' : '📤 بيع معدن'}\n` +
      `🔑 *المعدن:* ${tx.metalType === 'gold' ? 'ذهب 🪙' : 'فضة 💍'} (عيار ${tx.purity})\n` +
      `⚖️ *الوزن:* ${tx.weight} جرام\n` +
      `💰 *سعر الجرام:* ${tx.pricePerUnit} ريال\n` +
      `🧾 *الإجمالي:* ${tx.totalAmount} ريال\n` +
      `${tx.fundingSource ? `💳 *مصدر التمويل:* ${tx.fundingSource === 'free_vault' ? 'خزنة حرة' : 'المقبوضات'}\n` : ''}` +
      `📅 *التوقيت:* ${tx.date} | ${tx.time}\n` +
      `${tx.notes ? `📝 *ملاحظات:* ${tx.notes}\n` : ''}` +
      `_تم التوليد تلقائياً عبر دفتري الذكي_`;
    
    navigator.clipboard.writeText(textMsg);
    alert('تم نسخ تفاصيل العملية بنجاح لمشاركتها كرسالة منسقة!');
  };

  // Filter history
  const filteredMetalHistory = metalTransactions.filter(item => {
    const matchSearch = item.notes?.toLowerCase().includes(metalSearchText.toLowerCase()) || 
                        item.purity.includes(metalSearchText);
    const matchMetal = filterMetal === 'all' || item.metalType === filterMetal;
    const matchAction = filterAction === 'all' || item.type === filterAction;
    return matchSearch && matchMetal && matchAction;
  });

  const isDark = settings.themeColor === 'black' || settings.themeColor === 'gray' || settings.themeColor === 'brown';
  const cardBgClass = settings.themeColor === 'black' ? 'bg-zinc-900 border-[#27272a] text-white' : (settings.themeColor === 'gray' ? 'bg-slate-700 border-slate-600 text-slate-100' : (settings.themeColor === 'brown' ? 'bg-[#5c4331] border-[#785842] text-[#fbf6f0]' : 'bg-white border-slate-200 text-slate-900 shadow-sm'));
  const titleTextClass = isDark ? 'text-zinc-100 font-black' : 'text-slate-955 font-black text-slate-950';
  const textMutedClass = isDark ? 'text-zinc-300 font-bold' : 'text-slate-750 font-extrabold text-slate-800';

  if (showAssetsPage) {
    return (
      <div className="space-y-6 animate-fade-in text-slate-800" dir="rtl">
        {/* Assets Management Subpage Header */}
        <div className={`p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border ${cardBgClass}`}>
          <div className="space-y-1">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${titleTextClass}`}>
              <Coins size={22} className="text-amber-500 animate-spin-slow" />
              <span>إدارة وتداول الأصول والاستثمارات (الذهب والفضة)</span>
            </h3>
            <p className={`text-xs ${textMutedClass}`}>التحكم التام في شراء وبيع بضاعة المعادن كأصول للشركة مع موازنة التمويل بالخزنة آلياً.</p>
          </div>

          <button
            onClick={() => setShowAssetsPage(false)}
            className="bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            id="back-to-home-btn"
          >
            <ChevronLeft size={15} />
            <span>العودة للرئيسية</span>
          </button>
        </div>

        {/* 2 Form Cards side-by-side: Buy Asset & Sell Asset */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form 1: Buy Asset */}
          <form onSubmit={handleRegisterBuy} className={`${cardBgClass} border p-5 rounded-2xl space-y-4`}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/10 mb-2">
              <span className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                <Plus size={16} />
                <span>شراء أصل معدني جديد (تغذية المخزون)</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold">نوع المعدن</label>
                <select
                  value={buyMetalType}
                  onChange={e => setBuyMetalType(e.target.value as 'gold' | 'silver')}
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-[11px] rounded-lg px-1.5 py-1 font-bold"
                >
                  <option value="gold">ذهب 🪙</option>
                  <option value="silver">فضة 💍</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold">العيار</label>
                <input
                  type="text"
                  value={buyPurity}
                  onChange={e => setBuyPurity(e.target.value)}
                  placeholder={buyMetalType === 'gold' ? '21' : '925'}
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold">الوزن بالجرام</label>
                <input
                  type="number"
                  step="any"
                  value={buyWeight}
                  onChange={e => setBuyWeight(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold">العدد (اختياري)</label>
                <input
                  type="number"
                  value={buyCount}
                  onChange={e => setBuyCount(e.target.value)}
                  placeholder="1"
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold">سعر الشراء بالجرام (ريال)</label>
                <input
                  type="number"
                  value={buyPricePerUnit}
                  onChange={e => setBuyPricePerUnit(e.target.value)}
                  placeholder="22000"
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold">تمويل الدفع</label>
                <select
                  value={buyFundingSource}
                  onChange={e => setBuyFundingSource(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-[11px] rounded-lg px-1.5 py-1 font-bold"
                >
                  <option value="free_vault">🏦 من حر الخزنة</option>
                  <option value="collected">💵 من المقبوضات</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold">تعديل الإجمالي الصافي (اختياري)</label>
              <input
                type="number"
                value={buyCustomTotal}
                onChange={e => setBuyCustomTotal(e.target.value)}
                placeholder={`حساب تلقائي: ${calculatedBuyTotal.toLocaleString()} ر.ي`}
                className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold">ملاحظات الصفقة</label>
              <input
                type="text"
                value={buyNotes}
                onChange={e => setBuyNotes(e.target.value)}
                placeholder="اسم التاجر أو تفاصيل كسر الذهب المعني..."
                className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200/10">
              <span className="text-[11px] font-black">الإجمالي المفترض: {finalBuyTotalDisplay.toLocaleString()} ريال</span>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition duration-150 active:scale-95 cursor-pointer"
              >
                + حفظ وحسم شراء بضاعة أصل
              </button>
            </div>
          </form>

          {/* Form 2: Sell Asset */}
          <form onSubmit={handleRegisterSell} className={`${cardBgClass} border p-5 rounded-2xl space-y-4`}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/10 mb-2">
              <span className="text-xs font-black text-emerald-500 flex items-center gap-1.5">
                <Scale size={16} />
                <span>بيع وتسييل أصول معدنية (تسييل المخزون)</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold">المعدن للتسييل</label>
                <select
                  value={sellMetalType}
                  onChange={e => setSellMetalType(e.target.value as 'gold' | 'silver')}
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-[11px] rounded-lg px-1.5 py-1 font-bold"
                >
                  <option value="gold">ذهب 🪙</option>
                  <option value="silver">فضة 💍</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold">العيار</label>
                <input
                  type="text"
                  value={sellPurity}
                  onChange={e => setSellPurity(e.target.value)}
                  placeholder="21"
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold">الوزن بالجرام</label>
                <input
                  type="number"
                  step="any"
                  value={sellWeight}
                  onChange={e => setSellWeight(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold">العدد (اختياري)</label>
                <input
                  type="number"
                  value={sellCount}
                  onChange={e => setSellCount(e.target.value)}
                  placeholder="1"
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold">سعر البيع بالجرام (ريال)</label>
                <input
                  type="number"
                  value={sellPricePerUnit}
                  onChange={e => setSellPricePerUnit(e.target.value)}
                  placeholder="24000"
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold">المبلغ الصافي المعدل (اختياري)</label>
                <input
                  type="number"
                  value={sellCustomTotal}
                  onChange={e => setSellCustomTotal(e.target.value)}
                  placeholder={`تلقائي: ${calculatedSellTotal.toLocaleString()} ر.ي`}
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold">المشتري / مرجع التسييل</label>
              <input
                type="text"
                value={sellNotes}
                onChange={e => setSellNotes(e.target.value)}
                placeholder="مسبك الصناديق أو كوشان محلي..."
                className="w-full bg-slate-100 dark:bg-zinc-855 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 font-bold"
              />
            </div>

            <div className="pt-2 text-[10px] text-amber-500/85 bg-amber-500/5 p-3 rounded-lg">
              * ملحوظة: بيع أصول المعادن وتسييلها سيعمل فورياً على تغذية وضخ السيولة النقدية الحرة داخل الخزنة.
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200/10">
              <span className="text-[11px] font-black">الإجمالي المحتسب: {finalSellTotalDisplay.toLocaleString()} ريال</span>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition duration-150 active:scale-95 cursor-pointer"
              >
                + حفظ وتسييل المعادن بالخزنة
              </button>
            </div>
          </form>
        </div>

        {/* Assets Transaction Log & Filters */}
        <div className={`${cardBgClass} border rounded-2xl p-5 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/10 pb-3">
            <span className="text-xs font-extrabold flex items-center gap-1.5 label text-slate-150">
              <Scale size={15} />
              <span>بيان وجدول حركة أصول المعادن الاستثمارية بالكامل</span>
            </span>

            <div className="flex flex-wrap gap-2">
              <select
                value={filterMetal}
                onChange={e => setFilterMetal(e.target.value as any)}
                className="bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2.5 py-1 focus:outline-none"
              >
                <option value="all">كل الأصول</option>
                <option value="gold">الذهب كأصل</option>
                <option value="silver">الفضة كأصل</option>
              </select>

              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value as any)}
                className="bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-2.5 py-1 focus:outline-none"
              >
                <option value="all">كل العمليات</option>
                <option value="buy">شراء أصل فقط</option>
                <option value="sell">بيع أصل فقط</option>
              </select>

              <input
                type="text"
                value={metalSearchText}
                onChange={e => setMetalSearchText(e.target.value)}
                placeholder="بحث بالعيار أو التفاصيل..."
                className="bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs rounded-lg px-3 py-1 focus:outline-none w-36"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/10">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/50 dark:bg-zinc-800 text-[11px] border-b border-slate-200/10">
                <tr>
                  <th className="p-3">صنف الأثر وبند الحركة</th>
                  <th className="p-3">المعدن / العيار</th>
                  <th className="p-3">الوزن الصافي</th>
                  <th className="p-3">سعر الجرام الحالي</th>
                  <th className="p-3">إجمالي القيمة</th>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">الأثر البنكي وخصم الخزينة</th>
                  <th className="p-3 text-center">خيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/10">
                {filteredMetalHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-100/5 dark:hover:bg-zinc-800/20 text-slate-800 dark:text-zinc-100">
                    <td className="p-3 font-bold">
                      {item.type === 'buy' ? (
                        <span className="text-amber-500 font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          📥 شراء أصل (تغذية المتبادل)
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          📤 بيع أصل (إعادة تسييل)
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-extrabold">{item.metalType === 'gold' ? 'الذهب خالص' : 'الفضة كسر'}</span> (عيار {item.purity})
                    </td>
                    <td className="p-3 font-mono font-black">{item.weight} جم</td>
                    <td className="p-3 font-mono">{item.pricePerUnit.toLocaleString()} ر.ي</td>
                    <td className="p-3 font-mono font-extrabold text-amber-500">{item.totalAmount.toLocaleString()} ر.ي</td>
                    <td className="p-3 whitespace-nowrap opacity-85">
                      <span className="font-sans font-bold block">{item.date}</span>
                      <span className="text-[10px] font-mono block opacity-60">{item.time}</span>
                    </td>
                    <td className="p-3 text-[11px] opacity-90">
                      {item.type === 'buy' ? (
                        <span>{item.fundingSource === 'free_vault' ? '🏦 حسم من حر الخزنة' : '💵 مجمع اليومية'}</span>
                      ) : (
                        <span className="text-emerald-500 font-bold">← ضخ نقود بالخزنة فورياً</span>
                      )}
                      {item.notes && <p className="text-[10px] font-normal truncate max-w-[130px] opacity-70" title={item.notes}>{item.notes}</p>}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => shareMetalTx(item)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded text-[9px] font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Share2 size={10} />
                        <span>مشاركة</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMetalHistory.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد عمليات جرد أصول مسجلة حتى الآن تماثل مرشحات البحث الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const clockBgClass = settings.themeColor === 'black' 
    ? 'bg-zinc-850 border-zinc-700/85 text-white' 
    : (settings.themeColor === 'gray' 
       ? 'bg-slate-800 border-slate-700/80 text-white' 
       : (settings.themeColor === 'brown' 
          ? 'bg-[#4a3626] border-[#553e2c] text-white' 
          : 'bg-zinc-900 border-zinc-800 text-white shadow-md'
         )
      );

  return (
    <div className="space-y-6 animate-fade-in text-slate-800" dir="rtl">
      {/* Top Welcome Header Panel */}
      <div className={`border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm ${cardBgClass}`}>
        <div className="space-y-4 w-full">
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-amber-500 tracking-tight leading-none mb-3 select-none">
              {greetingPrefix} {settings.userName || 'أنس'}
            </h2>
            
            {/* Hijri and Gregorian Dates followed by current real time (WITHOUT SECONDS) styled beautifully with medium font */}
            <div className="flex flex-wrap items-center gap-2.5 text-sm sm:text-base md:text-lg font-black text-slate-800 dark:text-zinc-100 mt-3 select-none">
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl shrink-0 border border-amber-500/20">
                🕌 {getHijriDate(settings.hijriDateOffset)}
              </span>
              <span className="opacity-30 hidden sm:inline text-lg">|</span>
              <span className="flex items-center gap-1.5 text-slate-900 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl shrink-0 border border-slate-200 dark:border-zinc-705">
                📅 {new Date().toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="opacity-30 hidden sm:inline text-lg">|</span>
              <span className={`flex items-center gap-2 px-5 py-2 rounded-xl font-mono font-black text-white text-lg sm:text-xl md:text-2xl shadow-sm border shrink-0 ${clockBgClass}`}>
                ⏰ {currentRealTime}
              </span>
            </div>
          </div>

          {/* Animated, beautifully legible dynamic supplication block */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/15 flex items-start gap-3 max-w-2xl select-none"
          >
            <Sparkles className="text-amber-500 shrink-0 mt-1 animate-pulse" size={20} />
            <p className={`text-base sm:text-lg md:text-xl leading-relaxed font-black ${isDark ? 'text-yellow-101' : 'text-slate-900'} tracking-wide`}>
              &quot; {activeSupplication} &quot;
            </p>
          </motion.div>
        </div>
      </div>

      {/* APK Compilation & Project Export Alert Banner Option */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-slate-800 dark:text-emerald-100`}>
        <div className="space-y-1.5 flex-1">
          <h4 className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
            <span>📦</span>
            <span>تحميل الكود المصدري الكامل للمشروع (ZIP) جاهزاً للـ APK</span>
          </h4>
          <p className="text-xs text-slate-650 dark:text-zinc-300 leading-relaxed font-medium">
            تم ضغط وتصدير كافة ملفات المشروع الحالية مع تفعيل <strong>Capacitor Android</strong> وإعدادات العمل الكامل بدون إنترنت وتخزين البيانات محلياً بشكل آمن. يمكنك تحميل الملف وبناؤه على هاتفك مباشرة!
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={downloadProjectZip}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white px-5 py-3 rounded-xl text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md select-none border-0"
            title="اضغط لتحميل الكود المصدري الكامل للمشروع كملف ZIP"
          >
            <TrendingUp size={15} />
            <span>تحميل ملف ZIP الكامل (جاهز للبناء)</span>
          </button>
        </div>
      </div>

      {/* Main Stats Controls 2x2 Grid */}
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          
          {/* Card 1: بطاقة الإجماليات اليومية */}
          <div 
            onClick={() => onNavigate?.('daily')}
            className={`${cardBgClass} border border-slate-250/80 dark:border-zinc-850 p-3 sm:p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between transition cursor-pointer hover:border-amber-500/50 hover:scale-[1.01] active:scale-[0.99] duration-200 shadow-sm col-span-1`}
          >
            <div>
              <div className="flex items-center justify-between border-b border-sidebar-border/10 pb-2 mb-2">
                <span className="text-xs sm:text-sm font-black text-amber-500 tracking-wide flex items-center gap-1">
                  📊 ملخص اليوم
                </span>
                
                {/* Camouflage Toggle Button embedded in totals card */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCamouflage();
                  }}
                  className={`p-1 rounded-lg transition duration-155 cursor-pointer border ${
                    camouflage 
                      ? 'bg-amber-500 border-amber-500 text-slate-950 ring-2 ring-amber-500/15' 
                      : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-705 text-slate-500 dark:text-zinc-400 hover:text-amber-500'
                  }`}
                  title={camouflage ? 'إلغاء التمويه' : 'تشغيل التمويه'}
                  id="card-level-camouflage-toggle"
                >
                  {camouflage ? <EyeOff size={12} className="animate-pulse" /> : <Eye size={12} />}
                </button>
              </div>
              
              <div className="space-y-1.5 font-sans">
                <div className="flex items-center justify-between border-b border-slate-100/5 pb-1">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400">دخل اليوم</span>
                  <span className="font-extrabold text-sm sm:text-base md:text-lg text-amber-500">
                    {camouflage ? '•••••' : `${todayIncome.toLocaleString('ar-YE')} ر.ي`}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100/5 pb-1">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400">خرج اليوم</span>
                  <span className="font-extrabold text-sm sm:text-base md:text-lg text-rose-500">
                    {camouflage ? '•••••' : `${todayExpense.toLocaleString('ar-YE')} ر.ي`}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100/5 pb-1">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400">الدين اليوم</span>
                  <span className="font-extrabold text-sm sm:text-base md:text-lg text-red-500">
                    {camouflage ? '•••••' : `${todayDebts.toLocaleString('ar-YE')} ر.ي`}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100/5 pb-1">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400">إجمالي المسلم</span>
                  <span className="font-extrabold text-sm sm:text-base md:text-lg text-emerald-500">
                    {camouflage ? '•••••' : `${todayReceived.toLocaleString('ar-YE')} ر.ي`}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-0.5">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400">عدد العمليات اليوم</span>
                  <span className="font-extrabold text-sm sm:text-base md:text-lg text-teal-500">
                    {camouflage ? '••' : `${todayNewJobCount}`}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-2 pt-1 text-center border-t border-slate-100/5 font-sans">
              اضغط للتفاصيل الكاملة 👈
            </p>
          </div>

          {/* Card 2: بطاقة الدين */}
          <div 
            onClick={() => setShowDebtChoiceModal(true)}
            className={`${cardBgClass} border border-slate-250/80 dark:border-zinc-850 p-4 sm:p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between transition cursor-pointer hover:border-red-500/50 hover:scale-[1.01] active:scale-[0.99] duration-200 shadow-md col-span-1`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100/10 pb-2.5">
                <span className="text-xs sm:text-sm md:text-base font-black text-red-400 tracking-wide flex items-center gap-1.5">
                  🤝 إدارة وثيقة الديون
                </span>
                <span className="text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full select-none hidden sm:inline">
                  الذمم والعهود
                </span>
              </div>
              
              <div className="py-1 text-center">
                <p className="text-xs sm:text-sm font-bold text-slate-350 leading-relaxed">
                  توثيق الديون العالقة المستحقة لنا (دين لي) أو الذمم للغير علينا (دين علي) وجرد الدفتر.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-3 font-sans">
                  <span className="text-[9px] sm:text-[10px] font-extrabold bg-emerald-500/10 text-emerald-450 px-2 py-0.5 rounded-lg">دين لنا</span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold bg-amber-500/10 text-amber-450 px-2 py-0.5 rounded-lg">دين علينا</span>
                </div>
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDebtChoiceModal(true);
              }}
              className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-201 border border-slate-750 font-black rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>تسجيل الديون المباشرة</span>
              <ChevronLeft size={12} />
            </button>
          </div>

          {/* Card 3: بطاقة الخرج */}
          <div 
            onClick={() => setShowOutflowModal(true)}
            className={`${cardBgClass} border border-slate-250/80 dark:border-zinc-850 p-4 sm:p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between transition cursor-pointer hover:border-rose-500/50 hover:scale-[1.01] active:scale-[0.99] duration-200 shadow-md col-span-1`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100/10 pb-2.5">
                <span className="text-xs sm:text-sm md:text-base font-black text-rose-500 tracking-wide flex items-center gap-1.5">
                  💸 تسجيل الخامات (الخرج)
                </span>
                <span className="text-[10px] font-bold bg-rose-500/10 text-rose-505 px-2 py-0.5 rounded-full select-none hidden sm:inline">
                  الخرج السريع
                </span>
              </div>
              
              <div className="py-1 text-center text-xs sm:text-sm font-bold text-slate-350 leading-relaxed">
                سجل المبالغ الخارجة والمصروفات التشغيلية وخسائر الخزائن بشكل فوري ومباشر لليوم.
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowOutflowModal(true);
              }}
              className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-rose-600/10"
            >
              <span>📥 قيد معاملة خرج فوري</span>
            </button>
          </div>

          {/* Card 4: بطاقة جرد وحركة المعادن */}
          <div 
            onClick={() => setShowMetalChoiceModal(true)}
            className={`${cardBgClass} border border-amber-500/20 p-4 sm:p-6 hover:border-amber-500/50 rounded-3xl relative overflow-hidden flex flex-col justify-between transition cursor-pointer hover:scale-[1.01] active:scale-[0.99] duration-200 shadow-md col-span-1`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100/10 pb-2.5">
                <span className="text-xs sm:text-sm md:text-base font-black text-amber-500 tracking-wide flex items-center gap-1.5">
                  🪙 حركة المعادن والأصول
                </span>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full select-none hidden sm:inline">
                  جرد المعادن
                </span>
              </div>
              
              <div className="space-y-2.5 font-mono">
                <div className="flex flex-col border-b border-slate-100/5 pb-1">
                  <span className="font-sans text-[10px] sm:text-xs font-bold text-slate-400">مخزون الذهب الكسر الحالي:</span>
                  <span className="font-black text-sm sm:text-lg md:text-xl text-amber-500">
                    {camouflage ? '•••••' : `${activeGoldInventory.toFixed(2)} جرام`}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] sm:text-xs font-bold text-slate-400">مخزون الفضة الكسر الحالي:</span>
                  <span className="font-black text-sm sm:text-lg md:text-xl text-slate-300">
                    {camouflage ? '•••••' : `${activeSilverInventory.toFixed(2)} جرام`}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMetalChoiceModal(true);
              }}
              className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-650 text-slate-950 font-extrabold rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-amber-500/15"
            >
              <span>🔑 بيع وشراء المعادن والأصول</span>
            </button>
          </div>

        </div>
      </div>

      {/* Choice & Forms Modal for Card 2 (الدين الجديد) */}
      {showDebtChoiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 text-slate-100 animate-scale-up" dir="rtl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-slate-100">⚖️ إدارة والتحكم في الديون</h4>
              <button 
                onClick={() => {
                  setShowDebtChoiceModal(false);
                  setDebtActionType(null);
                }}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {debtActionType === null ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-450 leading-relaxed text-center">اختر نوع الإجراء المطلوب لتسجيل دين أو التزام مالي جديد في النظام:</p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setDebtActionType('li')}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 font-black text-slate-950 rounded-2xl text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>➕ إضافة دين لي (مستحق على المحلات)</span>
                  </button>
                  
                  <button
                    onClick={() => setDebtActionType('alayya')}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 font-black text-slate-950 rounded-2xl text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>➖ إضافة دين علي (التزام لصاحب حق)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDebtChoiceModal(false);
                      onNavigate?.('debts');
                    }}
                    className="w-full py-3 bg-slate-805 hover:bg-slate-750 border border-slate-750 font-bold text-slate-200 rounded-2xl text-xs transition active:scale-95 cursor-pointer"
                  >
                    <span>📊 الانتقال لدفتر كشف الديون والذمم</span>
                  </button>
                </div>
              </div>
            ) : debtActionType === 'li' ? (
              <form onSubmit={handleAddDebtLi} className="space-y-4">
                <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mb-2 border-b border-slate-800 pb-2">
                  <span>➕ إضافة دين مستحق لنا على مشغل / محل</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-450 block">المحل والمشغل المدين *</label>
                  <select
                    required
                    value={debtShopId}
                    onChange={(e) => setDebtShopId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- اختر المحل المشغل --</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-455 block">اسم العامل / مرسل العملية (اختياري)</label>
                  <input
                    type="text"
                    value={debtWorkerName}
                    onChange={(e) => setDebtWorkerName(e.target.value)}
                    placeholder="مثال: وضاح الصائغ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-450 block">تفاصيل العمل ومواصفات الدين الآجل *</label>
                  <input
                    type="text"
                    required
                    value={debtDescription}
                    onChange={(e) => setDebtDescription(e.target.value)}
                    placeholder="مثال: تفصيل خاتم ذهب عيار 21 وسوار"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 block">المبلغ الكلي للعملية *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      placeholder="ريال"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 block">المقبوض كعربون (إن وجد)</label>
                    <input
                      type="number"
                      min="0"
                      value={debtReceivedAmount}
                      onChange={(e) => setDebtReceivedAmount(e.target.value)}
                      placeholder="0 ريال"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-800 mt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition duration-150 cursor-pointer"
                  >
                    حفظ وإدراج كدين
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtActionType(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    عودة للخلف
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddDebtAlayya} className="space-y-4">
                <div className="text-sm font-black text-amber-500 flex items-center gap-1.5 mb-2 border-b border-slate-800 pb-2">
                  <span>➖ إضافة دين يترتب علينا (دين علي)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-450 block">اسم الدائن (صاحب الحق المالي) *</label>
                  <input
                    type="text"
                    required
                    value={creditorName}
                    onChange={(e) => setCreditorName(e.target.value)}
                    placeholder="مثال: المورد أبو ماجد، أو الصائغ اليافعي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-450 block">سبب أو تفاصيل الالتزام المالي *</label>
                  <input
                    type="text"
                    required
                    value={liabilityDetail}
                    onChange={(e) => setLiabilityDetail(e.target.value)}
                    placeholder="مثال: قيمة فضة كسر، سلفة نقدية تشغيلية..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-450 block">قيمة الدين المستحق (ريال) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={liabilityAmount}
                    onChange={(e) => setLiabilityAmount(e.target.value)}
                    placeholder="ريال يمني"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-800 mt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition duration-150 cursor-pointer"
                  >
                    إدراج الأمانة (الالتزام)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtActionType(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    عودة للخلف
                  </button>
                </div>
              </form>
            )}

            <button
              onClick={() => {
                setShowDebtChoiceModal(false);
                setDebtActionType(null);
              }}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 font-black text-slate-450 rounded-xl text-xs transition cursor-pointer"
            >
              إلغاء وإغلاق النافذة
            </button>
          </div>
        </div>
      )}

      {/* Forms Modal for Card 3 (الخرج الفوري) */}
      {showOutflowModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 text-slate-100 animate-scale-up" dir="rtl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-rose-500 flex items-center gap-1.5">
                <span>💸 تسجيل خرج (مصروف) جديد فوري</span>
              </h4>
              <button 
                onClick={() => setShowOutflowModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddOutflow} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 block">بيان أو سبب صرف الخرج لليومية *</label>
                <input
                  type="text"
                  required
                  value={outflowReason}
                  onChange={(e) => setOutflowReason(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء المحل، أجور صائغ، مصاريف نقل..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 block">المبلغ المالي المخصوم (ريال) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={outflowAmount}
                  onChange={(e) => handleOutflowAmountChange(e.target.value)}
                  placeholder="ريال يمني"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">تحديد مصدر سحب الخرج المالي *</label>
                <div className="grid grid-cols-1 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <label className="flex items-center gap-3 px-2.5 py-2 hover:bg-slate-900 rounded-xl cursor-pointer text-xs font-bold text-slate-250 transition">
                    <input
                      type="radio"
                      name="outflowSource"
                      checked={outflowSource === 'free_vault'}
                      onChange={() => handleOutflowSourceChange('free_vault')}
                      className="accent-amber-500 h-4 w-4"
                    />
                    <div>
                      <span>من المال الحر في الخزنة</span>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">رصيد حساب الخزينة الحرة</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 px-2.5 py-2 hover:bg-slate-900 rounded-xl cursor-pointer text-xs font-bold text-slate-250 transition">
                    <input
                      type="radio"
                      name="outflowSource"
                      checked={outflowSource === 'collected'}
                      onChange={() => handleOutflowSourceChange('collected')}
                      className="accent-amber-500 h-4 w-4"
                    />
                    <div>
                      <span>من المال المستلم اليومي</span>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">من المقبوضات النقدية السائلة لليوم</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 px-2.5 py-2 hover:bg-slate-900 rounded-xl cursor-pointer text-xs font-bold text-slate-250 transition">
                    <input
                      type="radio"
                      name="outflowSource"
                      checked={outflowSource === 'both'}
                      onChange={() => handleOutflowSourceChange('both')}
                      className="accent-amber-500 h-4 w-4"
                    />
                    <div>
                      <span>من المصدرين معاً (الاثنين معاً)</span>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">سحب مدمج ومقيد بالنظام المالي للمصدرين</p>
                    </div>
                  </label>
                </div>
              </div>

              {outflowSource === 'both' && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 animate-fade-in">
                  <span className="text-[10px] text-amber-500 font-extrabold block">✍️ تفصيل توزيع المصروف المشترك (تعديل يدوي مرن):</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 block pb-0.5">من المقبوضات اليومية (ريال):</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max={outflowAmount}
                        value={jointCollectedAmount}
                        onChange={(e) => handleJointCollectedChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 block pb-0.5">من حر الخزنة (ريال):</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max={outflowAmount}
                        value={jointVaultAmount}
                        onChange={(e) => handleJointVaultChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500 text-right leading-normal">
                    * المجموع المحسوب: {(Number(jointCollectedAmount) || 0) + (Number(jointVaultAmount) || 0)} ريال، ويجب أن يطابق تماماً قيمة المصروف الكلية ({Number(outflowAmount) || 0} ريال).
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl text-xs transition duration-150 cursor-pointer shadow-md shadow-rose-500/10"
                >
                  حفظ وتسجيل ترحيل الخرج
                </button>
                <button
                  type="button"
                  onClick={() => setShowOutflowModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Choice Modal for Card 4 (حركة المعادن) */}
      {showMetalChoiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 text-slate-100 animate-scale-up" dir="rtl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                <Coins size={32} className="text-amber-500" />
              </div>
              <h4 className="text-xl font-bold text-slate-100">إدارة حركة المعادن والأصول الكسر</h4>
              <p className="text-xs text-slate-400">اختر نوع العملية التي تريد تسجيلها أو استعراضها الآن لتحديث مخزون وأصول الذهب والفضة.</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setMetalActionType('buy');
                  setShowAssetsPage(true);
                  setShowMetalChoiceModal(false);
                }}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-slate-950 rounded-2xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                📥 شراء أصل جديد (تغذية الذهب / الفضة)
              </button>
              
              <button
                onClick={() => {
                  setMetalActionType('sell');
                  setShowAssetsPage(true);
                  setShowMetalChoiceModal(false);
                }}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 font-extrabold text-white rounded-2xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                📤 بيع أصول كسر (شغل أونصات كسر)
              </button>

              <button
                onClick={() => {
                  setShowAssetsPage(true);
                  setShowMetalChoiceModal(false);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-755 font-extrabold text-slate-200 rounded-2xl text-xs transition duration-150 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                📊 استعراض سجل جرد وحركات المعادن
              </button>
            </div>

            <button
              onClick={() => setShowMetalChoiceModal(false)}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 font-black text-slate-400 rounded-2xl text-xs transition active:scale-95 cursor-pointer"
            >
              إلغاء وإغلاق النافذة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
