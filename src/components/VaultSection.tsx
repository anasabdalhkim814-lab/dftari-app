import React, { useState } from 'react';
import { Transaction, VaultTransaction, AppSettings, MetalTransaction, Commitment } from '../types';
import { getShareTextForVault } from '../utils';
import { 
  DollarSign, ArrowUpRight, ArrowDownLeft, Search, Share2, PlusCircle, 
  X, ShieldAlert, Coins, Info, Calendar, RefreshCw, Eye, EyeOff, ClipboardList,
  Lock, Unlock, Layers, Activity, ShieldCheck, TrendingUp, TrendingDown
} from 'lucide-react';

interface VaultSectionProps {
  transactions: Transaction[];
  vaultTransactions: VaultTransaction[];
  addVaultOutflow: (reason: string, amount: number, source?: 'free_vault' | 'collected' | 'both', date?: string, time?: string) => void;
  camouflage: boolean;
  settings: AppSettings;
  metalTransactions: MetalTransaction[];
  commitments: Commitment[];
  disburseCommitment: (id: string, amount: number) => void;
  carryOverCommitment: (id: string) => void;
  updateCommitmentRate: (id: string, rate: number) => void;
  addCommitment: (name: string, dailyRate: number) => void;
  saveSettings: (settings: AppSettings) => void;
}

export default function VaultSection({
  transactions,
  vaultTransactions,
  addVaultOutflow,
  camouflage,
  settings,
  metalTransactions,
  commitments,
  disburseCommitment,
  carryOverCommitment,
  updateCommitmentRate,
  addCommitment,
  saveSettings
}: VaultSectionProps) {
  // Search parameters
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');

  // Register Outflow expense form state
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseTime, setExpenseTime] = useState('');

  // Dialog and setup states
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [opYemeni, setOpYemeni] = useState(settings.openingBalanceYemeni?.toString() || '0');
  const [opSaudi, setOpSaudi] = useState(settings.openingBalanceSaudi?.toString() || '0');
  const [opUsd, setOpUsd] = useState(settings.openingBalanceUsd?.toString() || '0');

  // Edit daily rates state
  const [editingCommitmentId, setEditingCommitmentId] = useState<string | null>(null);
  const [newRateValue, setNewRateValue] = useState('');

  // Daily Movement Modal state
  const [showTodayMovement, setShowTodayMovement] = useState(false);

  // Helper inside Vault for Date mapping
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];
  const todayStr = getTodayDateStr();

  // Sort transitions
  const sortedTransitions = [...vaultTransactions].reverse();
  const filteredTrans = sortedTransitions.filter(log => {
    const searchLower = searchText.toLowerCase();
    const reasonMatches = log.reason.toLowerCase().includes(searchLower);
    const dateMatches = log.date.includes(searchLower);
    const matchesSearch = reasonMatches || dateMatches;
    const matchesType = typeFilter === 'all' ? true : log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // 1. Initial Opening Balances from settings
  const openingYemeni = settings.openingBalanceYemeni || 0;
  const openingSaudi = settings.openingBalanceSaudi || 0;
  const openingUsd = settings.openingBalanceUsd || 0;
  const sarConvRate = settings.sarRate || 380;
  const usdConvRate = settings.usdRate || 1420;

  // 2. Subsequent cumulative transactions (strictly for YER currency vault)
  const cumulativeInflows = vaultTransactions
    .filter(t => t.type === 'in')
    .reduce((sum, t) => sum + t.amount, 0);

  const cumulativeOutflows = vaultTransactions
    .filter(t => t.type === 'out')
    .reduce((sum, t) => {
      if (t.source === 'collected') return sum;
      if (t.source === 'both') return sum + (t.vaultAmount ?? Math.round(t.amount / 2));
      return sum + t.amount;
    }, 0);

  // Physical Yemeni Rial (YER) in Vault is strictly independent
  const physicalCashYER = openingYemeni + cumulativeInflows - cumulativeOutflows;

  // 3. Independent Reserved Funds & Commitments Calculations (bookkeeping ledger account)
  const allocatedCommitments = commitments.map(c => {
    const withheld = c.accumulatedBalance ?? 0;
    const unwithheld = c.accumulatedDeficit ?? 0;
    const due = withheld + unwithheld;
    return {
      ...c,
      days: 0,
      due,
      withheld,
      unwithheld
    };
  });

  const totalReserved = allocatedCommitments.reduce((sum, c) => sum + c.withheld, 0);
  const totalUnwithheld = allocatedCommitments.reduce((sum, c) => sum + c.unwithheld, 0);

  // 4. Daily Free Cash (المال الحر اليومي)
  // received during today's work/side/external transactions, remaining separate from the vault until daily closing
  const todayTransactionsIn = transactions.filter(t => t.date === todayStr);
  const todayIncome = todayTransactionsIn.reduce((sum, t) => sum + t.receivedAmount, 0);

  const todayCollectedOutflows = vaultTransactions
    .filter(vt => vt.date === todayStr && vt.type === 'out')
    .reduce((sum, vt) => {
      if (vt.source === 'collected') return sum + vt.amount;
      if (vt.source === 'both') return sum + (vt.collectedAmount ?? Math.round(vt.amount / 2));
      return sum;
    }, 0);

  const dailyFreeCash = Math.max(0, todayIncome - todayCollectedOutflows);

  // 5. Vault Free Cash (المال الحر بالخزنة)
  // For each currency, it remains according to its type, showing actual physical belongings
  const freeCashYER = Math.max(0, physicalCashYER - totalReserved); // displayed physical YER cash minus reserved commitments
  const freeCashSAR = openingSaudi; // displayed physical Saudi cash drawer
  const freeCashUSD = openingUsd; // displayed physical USD cash drawer

  // 4. Metals Inventory (Gold & Silver Stocks)
  const goldBoughtWeight = metalTransactions
    .filter(t => t.metalType === 'gold' && t.type === 'buy')
    .reduce((sum, t) => sum + t.weight, 0);
  const goldSoldWeight = metalTransactions
    .filter(t => t.metalType === 'gold' && t.type === 'sell')
    .reduce((sum, t) => sum + t.weight, 0);
  const activeGoldInventory = Math.max(0, goldBoughtWeight - goldSoldWeight);

  const silverBoughtWeight = metalTransactions
    .filter(t => t.metalType === 'silver' && t.type === 'buy')
    .reduce((sum, t) => sum + t.weight, 0);
  const silverSoldWeight = metalTransactions
    .filter(t => t.metalType === 'silver' && t.type === 'sell')
    .reduce((sum, t) => sum + t.weight, 0);
  const activeSilverInventory = Math.max(0, silverBoughtWeight - silverSoldWeight);

  // Group gold and silver stocks strictly by caliber (العتبة العيارية للأصول)
  const goldWeightsByPurity = metalTransactions
    .filter(t => t.metalType === 'gold')
    .reduce((acc, t) => {
      const p = t.purity.trim();
      if (!acc[p]) acc[p] = 0;
      if (t.type === 'buy') acc[p] += t.weight;
      else if (t.type === 'sell') acc[p] -= t.weight;
      return acc;
    }, {} as Record<string, number>);

  const silverWeightsByPurity = metalTransactions
    .filter(t => t.metalType === 'silver')
    .reduce((acc, t) => {
      const p = t.purity.trim();
      if (!acc[p]) acc[p] = 0;
      if (t.type === 'buy') acc[p] += t.weight;
      else if (t.type === 'sell') acc[p] -= t.weight;
      return acc;
    }, {} as Record<string, number>);

  const activeGoldPurities = Object.keys(goldWeightsByPurity).filter(p => goldWeightsByPurity[p] > 0);
  const activeSilverPurities = Object.keys(silverWeightsByPurity).filter(p => silverWeightsByPurity[p] > 0);

  // Today's movement calculations
  const todayTransactions = vaultTransactions.filter(vt => vt.date === todayStr);
  const todayIn = todayTransactions
    .filter(vt => vt.type === 'in')
    .reduce((sum, vt) => sum + vt.amount, 0);
  const todayOut = todayTransactions
    .filter(vt => vt.type === 'out')
    .reduce((sum, vt) => sum + vt.amount, 0);
  const todayNet = todayIn - todayOut;

  // Save initial balance handler
  const handleSaveOpening = (e: React.FormEvent) => {
    e.preventDefault();
    const y = Number(opYemeni);
    const s = Number(opSaudi);
    const u = Number(opUsd);

    if (isNaN(y) || y < 0 || isNaN(s) || s < 0 || isNaN(u) || u < 0) {
      alert('الرجاء إدخال مبالغ صحيحة وموجبة!');
      return;
    }

    saveSettings({
      ...settings,
      openingBalanceYemeni: y,
      openingBalanceSaudi: s,
      openingBalanceUsd: u,
      hasEnteredOpeningBalance: true
    });

    setShowOpeningModal(false);
    alert('تم إعداد وحفظ الرصيد الافتتاحي المقسم للخزنة بنجاح!');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!expenseReason.trim()) {
      alert('يجب كتابة سبب المصروف!');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      alert('الرجاء إدخال مبلغ صحيح وموجب للمصروف!');
      return;
    }

    // Check availability from purely free cash
    if (amt > freeCashYER) {
      alert(`عذراً! لا يمكن صرف المبلغ المطلوب لأن رصيد السيولة الحرة المتاحة بالخزنة (${freeCashYER.toLocaleString()} ريال) لا يكفي لتغطية هذا الصرف وهو أقل من القيمة المطلوبة (${amt.toLocaleString()} ريال). المبالغ الأخرى محجوزة تماماً للالتزامات بضوابط صارمة.`);
      return;
    }

    addVaultOutflow(
      expenseReason.trim(),
      amt,
      expenseDate ? expenseDate : undefined,
      expenseTime ? expenseTime : undefined
    );

    setIsAddingExpense(false);
    setExpenseReason('');
    setExpenseAmount('');
    alert('تم تدوين المصروف بنجاح من حر الخزنة!');
  };

  const handleShareVault = () => {
    const rawVal = physicalCashYER;
    const txt = getShareTextForVault(vaultTransactions, rawVal);
    navigator.clipboard.writeText(txt);
    alert('تم نسخ مطبوعة جرد حركة الخزنة بالكامل بنسخة منسقة لمشاركتها كتقرير مالي!');
  };

  const cashLabel = (val: number) => {
    if (camouflage) return '••••• YER';
    return `${Math.floor(val).toLocaleString()} ريال YER`;
  };

  // Check if at least one commitment has due > 0 and day of month is >= 28 (End of Month Alert)
  const todayDayOfMonth = new Date().getDate();
  const showEndOfMonthAlert = todayDayOfMonth >= 28 && allocatedCommitments.some(c => c.due > 0);

  const isDark = settings.themeColor === 'black' || settings.themeColor === 'gray' || settings.themeColor === 'brown';
  const cardBgClass = settings.themeColor === 'black' 
    ? 'bg-zinc-900/90 border-zinc-800 text-white' 
    : (settings.themeColor === 'gray' ? 'bg-slate-700/95 border-slate-605 text-slate-100' : (settings.themeColor === 'brown' ? 'bg-[#5c4331] border-[#7d5c45] text-[#fbf6f0]' : 'bg-white border-slate-150 text-slate-800 shadow-sm'));
  const titleTextClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-zinc-100" dir="rtl">
      
      {/* 0. FORCE INITIAL OPENING BALANCE INPUT IF NOT YET ENTERED */}
      {!settings.hasEnteredOpeningBalance && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 text-white rounded-3xl p-6 max-w-lg w-full space-y-5 animate-scale-up">
            <div className="flex items-center gap-3 border-b border-zinc-850 pb-3">
              <Coins className="text-amber-500 animate-bounce animate-spin-slow" size={28} />
              <div>
                <h4 className="text-base font-bold text-slate-100">تهيئة الأرصدة الافتتاحية للخزنة</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">ضبط مستقل للعملات والمعادن الثمينة لضمان دقة التنظيم المالي</p>
              </div>
            </div>

            <form onSubmit={handleSaveOpening} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">1. الرصيد بالريال اليمني (YER) 🇾🇪</label>
                <input
                  type="number"
                  value={opYemeni}
                  onChange={e => setOpYemeni(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">2. الرصيد بالريال السعودي (SAR) 🇸🇦</label>
                <input
                  type="number"
                  value={opSaudi}
                  onChange={e => setOpSaudi(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">3. الرصيد بالدولار الأمريكي (USD) 🇺🇸</label>
                <input
                  type="number"
                  value={opUsd}
                  onChange={e => setOpUsd(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="0"
                  required
                />
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850 text-[10px] text-zinc-450 space-y-1">
                <p>💡 يتم ضرب العملات الأجنبية بسعر الصرف المعتمد في إعدادات التطبيق لترصيد الخزنة آلياً.</p>
                <p className="font-semibold text-amber-500">معدل الصرف الحالي: السعودي ({sarConvRate}) | الدولار ({usdConvRate})</p>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition duration-150 cursor-pointer shadow-md"
              >
                تأكيد واعتماد رصيد الخزنة المبدئي
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header section with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coins size={22} className="text-amber-500 animate-pulse" />
            <h3 className={`text-xl font-bold ${titleTextClass}`}>خزانة السيولة والأصول المستقلة</h3>
          </div>
          <p className={`text-xs ${textMutedClass}`}>الخزنة تتغذى كلياً من المعاملات المغلقة والتسويات المحجوزة للالتزامات دون تداخل محاسبي.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Edit opening balance button */}
          <button
            onClick={() => {
              setOpYemeni(openingYemeni.toString());
              setOpSaudi(openingSaudi.toString());
              setOpUsd(openingUsd.toString());
              setShowOpeningModal(true);
            }}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 font-bold text-slate-800 dark:text-zinc-100 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-slate-200 dark:border-zinc-800"
            title="تعديل الرصيد الافتتاحي البدئي للخزنة"
          >
            <RefreshCw size={13} />
            <span>تحديث الأرصدة البدئية</span>
          </button>

          <button
            onClick={() => {
              setIsAddingExpense(!isAddingExpense);
              setExpenseDate(new Date().toISOString().split('T')[0]);
              setExpenseTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
            }}
            className="bg-rose-500 hover:bg-rose-600 font-black text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <PlusCircle size={15} />
            <span>{isAddingExpense ? 'تراجع' : 'تقييد وصرف خارجي'}</span>
          </button>
        </div>
      </div>

      {/* 📊 SECTIONS: OVERVIEW CARD FOR CORE FINANCIAL STATES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* State 1: المال الحر اليومي (المقبوضات الحالية قبل الإغلاق) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-slate-500/0 dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-transparent border border-emerald-500/20 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-6 -left-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase">المال الحر اليومي (قبل الإغلاق)</h4>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
              المقبوضات المستلمة اليوم الجارية من المعاملات والدخل الجانبي معلقة بالصندوق الجاري ومستقلة حتى ترحيل اليوم وإغلاق السوق.
            </p>
          </div>
          <div className="pt-2 flex justify-between items-end border-t border-emerald-500/10">
            <span className="text-[9px] text-slate-400 font-bold">الرصيد الجاري بالصندوق:</span>
            <span className="text-sm sm:text-base font-mono font-black text-emerald-500 tracking-tight">
              {camouflage ? '••••' : `${Math.floor(dailyFreeCash).toLocaleString()} ر.ي`}
            </span>
          </div>
        </div>

        {/* State 2: المال الحر في الخزنة (الفائض المرحل بعد الإغلاق) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-500/0 dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent border border-amber-500/20 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-6 -left-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase">المال الحر في الخزنة (بعد الإغلاق)</h4>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
              الفائض المتراكم الصافي من السيولة بالريال اليمني المتاح للتصرف والصرف الخارجي بعد حسم واقتطاع كافة العهد والمخصصات.
            </p>
          </div>
          <div className="pt-2 flex justify-between items-end border-t border-amber-500/10">
            <span className="text-[9px] text-slate-400 font-bold">السيولة الحرة الصافية:</span>
            <span className="text-sm sm:text-base font-mono font-black text-amber-500 tracking-tight">
              {camouflage ? '••••' : `${Math.floor(freeCashYER).toLocaleString()} ر.ي`}
            </span>
          </div>
        </div>

        {/* State 3: الالتزامات كقسم مستقل بالخزنة */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-slate-500/0 dark:from-rose-500/10 dark:via-rose-500/5 dark:to-transparent border border-rose-500/20 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-6 -left-6 w-20 h-20 bg-rose-500/10 rounded-full blur-xl" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock size={12} className="text-rose-500 animate-pulse" />
              <h4 className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase">مخصص الالتزامات المستقلة (دفترياً)</h4>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
              إجمالي العهد والمبالغ المحجوزة في الخزانة والمخصصة لسداد الالتزامات والعهد التراكمية، ولا يجوز المساس بها إطلاقاً.
            </p>
          </div>
          <div className="pt-2 flex justify-between items-end border-t border-rose-500/10">
            <span className="text-[9px] text-slate-400 font-bold">المحجوز الفعلي بالخزانة:</span>
            <span className="text-sm sm:text-base font-mono font-black text-rose-500 tracking-tight">
              {camouflage ? '••••' : `${Math.floor(totalReserved).toLocaleString()} ر.ي`}
            </span>
          </div>
        </div>
      </div>

      {/* THREE REQUIRED REFACTORED VAULT CARDS WITH THE EXACT STATED SEPARATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
         {/* CARD 1: السيولة والعملات النقدية بالخزنة - أرصدة منفصلة كلياً وحساب السيولة الصافية بدقة */}
         <div className={`${cardBgClass} border border-slate-205 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm`}>
           <div>
             <div className="flex items-center justify-between border-b border-slate-200/5 dark:border-zinc-800/20 pb-3">
               <div className="flex items-center gap-2">
                 <span className="text-base">💵</span>
                 <span className="text-[13px] font-black tracking-wide">السيولة والعملات المستقلة</span>
               </div>
               <button
                 onClick={() => setShowTodayMovement(true)}
                 className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] sm:text-xs px-3 py-1.5 rounded-lg font-black transition cursor-pointer"
               >
                 كشف وتفاصيل اليومية
               </button>
             </div>

             <div className="space-y-3 mt-4">
               {/* Currency YER */}
               <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 rounded-xl space-y-2 border border-slate-100 dark:border-zinc-900/50">
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-black text-slate-700 dark:text-zinc-200 flex items-center gap-1.5">
                     <span>🇾🇪</span>
                     <span>الريال اليمني (YER)</span>
                   </span>
                   <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                     {camouflage ? '••••' : `${Math.floor(physicalCashYER).toLocaleString()} ر.ي`}
                   </span>
                 </div>
                 <div className="grid grid-cols-2 gap-2 text-[9px] pt-1.5 border-t border-dashed border-slate-200 dark:border-zinc-800 text-center font-bold">
                   <div className="bg-amber-500/5 p-1 rounded-lg">
                     <span className="text-slate-450 block">حُر للتصرف:</span>
                     <span className="text-amber-500 font-mono">{camouflage ? '••' : Math.floor(freeCashYER).toLocaleString()} ر.ي</span>
                   </div>
                   <div className="bg-rose-500/5 p-1 rounded-lg">
                     <span className="text-rose-450 block">التزامات محجوزة:</span>
                     <span className="text-rose-500 font-mono">{camouflage ? '••' : Math.floor(totalReserved).toLocaleString()} ر.ي</span>
                   </div>
                 </div>
               </div>

               {/* Currency SAR */}
               <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 rounded-xl flex items-center justify-between border border-slate-100 dark:border-zinc-900/50">
                 <span className="text-xs font-black text-slate-700 dark:text-zinc-200 flex items-center gap-1.5">
                   <span>🇸🇦</span>
                   <span>الريال السعودي (SAR)</span>
                 </span>
                 <span className="font-mono font-black text-sm text-amber-500">
                   {camouflage ? '••••' : `${freeCashSAR.toLocaleString()} ر.س`}
                 </span>
               </div>

               {/* Currency USD */}
               <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 rounded-xl flex items-center justify-between border border-slate-100 dark:border-zinc-900/50">
                 <span className="text-xs font-black text-slate-700 dark:text-zinc-200 flex items-center gap-1.5">
                   <span>🇺🇸</span>
                   <span>الدولار الأمريكي (USD)</span>
                 </span>
                 <span className="font-mono font-black text-sm text-blue-500 text-left">
                   {camouflage ? '••••' : `$${freeCashUSD.toLocaleString()}`}
                 </span>
               </div>
             </div>
           </div>

           <div className="border-t border-slate-150 dark:border-zinc-800/10 pt-2.5 text-[9px] text-zinc-400 font-bold flex items-center gap-1 mt-2">
             <ShieldCheck size={11} className="text-emerald-500" />
             <span>عملات معزولة لا يجوز خلطها أو دمجها إطلاقاً دفترياً</span>
           </div>
         </div>
 
         {/* CARD 2: مخزون المعادن في الخزنة - مفصلة تماماً حسب العيار بدون قيمة تقديرية موحدة */}
         <div className={`${cardBgClass} border p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[190px] transition duration-150 shadow-sm`}>
           <div className="flex-1 flex flex-col justify-between h-full">
             <div>
               <div className="flex items-center gap-2 border-b border-slate-200/5 pb-2.5 mb-2">
                 <span className="text-sm">🪙</span>
                 <span className="text-[13px] font-black tracking-wide">جرد المعادن الثمينة (العيار والوزن)</span>
               </div>
               
               <div className="space-y-3 mt-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                 {/* Gold by Purity */}
                 <div className="space-y-1">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5">
                       <span>🟡 مخزون الذهب الكلي:</span>
                     </span>
                     <span className="font-mono font-black text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                       {camouflage ? '••••' : `${activeGoldInventory.toFixed(2)} جم`}
                     </span>
                   </div>
                   
                   {activeGoldPurities.length === 0 ? (
                     <div className="text-[10px] text-zinc-500 bg-slate-500/5 p-1 px-2 rounded-lg mr-2">
                       لا توجد سبيكة ذهب مسجلة بالخزنة حتى اللحظة.
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 gap-1.5 pr-2">
                       {activeGoldPurities.map(pur => (
                         <div key={pur} className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-900/40 p-1.5 rounded-lg flex justify-between items-center text-[10px] font-sans">
                           <span className="font-black text-slate-800 dark:text-zinc-300">عيار {pur}:</span>
                           <span className="font-mono font-black text-amber-500">
                             {camouflage ? '••••' : `${goldWeightsByPurity[pur].toFixed(2)} جم`}
                           </span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
 
                 {/* Silver by Purity */}
                 <div className="pt-2 border-t border-slate-200/5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-0.5">
                        <span>⚪ مخزون الفضة الكلي:</span>
                      </span>
                      <span className="font-mono font-black text-xs text-slate-400 bg-slate-400/10 px-1.5 py-0.5 rounded-md">
                        {camouflage ? '••••' : `${activeSilverInventory.toFixed(2)} جم`}
                      </span>
                    </div>

                   {activeSilverPurities.length === 0 ? (
                     <div className="text-[10px] text-zinc-500 bg-slate-500/5 p-1 px-2 rounded-lg mr-2">
                       لا توجد فضة مسجلة بالخزنة حتى اللحظة.
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 gap-1.5 pr-2">
                       {activeSilverPurities.map(pur => (
                         <div key={pur} className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-900/40 p-1.5 rounded-lg flex justify-between items-center text-[10px] font-sans">
                           <span className="font-black text-slate-800 dark:text-zinc-300">عيار {pur}:</span>
                           <span className="font-mono font-black text-slate-400">
                             {camouflage ? '••••' : `${silverWeightsByPurity[pur].toFixed(2)} جم`}
                           </span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
             </div>
           </div>
 
           <div className="border-t border-slate-200/10 pt-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-2">
             <Activity size={11} />
             <span>شراء الأصول يتم حصراً من السيولة الحرة المتاحة</span>
           </div>
         </div>
 
         {/* CARD 3: الأموال المحجوزة والالتزامات ومراقبة الفيد الحسابية */}
         <div className={`${cardBgClass} border p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[190px] transition duration-150 shadow-sm`}>
           <div className="space-y-3">
             <div className="flex items-center justify-between border-b border-slate-200/5 pb-2.5">
               <span className="text-[13px] font-black tracking-wide flex items-center gap-2">
                 <Lock className="text-rose-500" size={14} />
                 <span>الالتزامات الضخمة والمحجوزات</span>
               </span>
               <span className="text-[9px] bg-red-500/15 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded font-black">
                 الحل المربوط
               </span>
             </div>
 
             <div className="mt-1 flex items-center gap-3 bg-rose-500/5 dark:bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
               <div className="p-2 bg-rose-500/10 rounded-lg">
                 <Lock className="text-rose-500" size={18} />
               </div>
               <div>
                 <span className={`text-[10px] sm:text-xs block font-bold ${textMutedClass}`}>السيولة والمحجوزات الفعلية بالخزنة:</span>
                 <p className="text-base sm:text-xl font-mono font-black tracking-tight text-rose-500">
                   {camouflage ? '•••••' : `${Math.floor(totalReserved).toLocaleString()} ر.ي`}
                 </p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
               <div className="bg-slate-100 dark:bg-zinc-950/30 p-2 rounded-xl">
                 <span className="text-zinc-450 block text-[9px]">المتأخرات المتراكمة لليوم:</span>
                 <span className="text-amber-500 font-black">{camouflage ? '••' : `${Math.floor(totalUnwithheld).toLocaleString()}`} ر.ي</span>
               </div>
               <div className="bg-slate-100 dark:bg-zinc-950/30 p-2 rounded-xl">
                 <span className="text-zinc-450 block text-[9px]">إجمالي المستحق الكلي:</span>
                 <span className="text-slate-800 dark:text-zinc-200 font-black">{camouflage ? '••' : `${Math.floor(totalReserved + totalUnwithheld).toLocaleString()}`} ر.ي</span>
               </div>
             </div>
           </div>
 
           <div className="border-t border-slate-200/10 pt-2 text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-2">
             <ShieldAlert size={11} className="text-rose-500" />
             <span>الأموال المحجوزة محمية ومخصصة تفصيلياً</span>
           </div>
         </div>
      </div>

      {/* END OF MONTH ALERT/NOTIFICATION */}
      {showEndOfMonthAlert && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl shadow-sm text-slate-900 dark:text-slate-150 flex flex-col md:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={20} className="text-amber-500 shrink-0" />
            <p className="text-xs font-bold leading-relaxed">
              <strong>إشعار نهاية الدورة الشهرية:</strong> توجد أرصدة ومخصصات للالتزامات تراكمت بشكل كافٍ لخدمة وتسوية الأغراض المحددة لها.
            </p>
          </div>
          <span className="text-[10px] opacity-75 font-sans font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-lg">اليوم {todayDayOfMonth} من الشهر</span>
        </div>
      )}

      {/* COMMITMENTS ACCRUED DETAILS SECTION PANEL */}
      <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 bg-white dark:bg-zinc-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-500" />
            <span className="text-sm font-black">دفتر ومخصصات الالتزامات اليومية المتراكمة</span>
          </div>
          <span className="text-[10px] text-zinc-400">تحتسب الالتزامات اليومية وتُقتطع آلياً عند إغلاق السوق في المساء</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allocatedCommitments.map((c) => {
            const progressPercent = c.due > 0 ? Math.min(100, (c.withheld / c.due) * 100) : 0;
            const isEditing = editingCommitmentId === c.id;

            return (
              <div 
                key={c.id} 
                className="bg-slate-50/50 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-900/60 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-zinc-850 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-150">{c.name}</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-zinc-950/60 px-2 py-0.5 rounded-md font-sans text-slate-600 dark:text-zinc-400 font-bold">
                      {c.dailyRate.toLocaleString()} ر.ي / يومياً
                    </span>
                  </div>

                  {/* Calculations Details */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] mt-3 font-bold text-center">
                    <div className="bg-slate-100 dark:bg-zinc-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-zinc-850">
                      <span className="text-[8px] block text-zinc-450 mb-0.5">المستحق</span>
                      <span className="text-amber-500 font-black">{camouflage ? '••' : c.due.toLocaleString()}</span>
                    </div>
                    <div className="bg-emerald-500/5 p-1.5 rounded-lg border border-emerald-500/10">
                      <span className="text-[8px] block text-emerald-500 opacity-80 mb-0.5">المحجوز ✅</span>
                      <span className="text-emerald-500 font-black">{camouflage ? '••' : c.withheld.toLocaleString()}</span>
                    </div>
                    <div className="bg-red-500/5 p-1.5 rounded-lg border border-red-500/10">
                      <span className="text-[8px] block text-rose-400 opacity-85 mb-0.5">العجز المطلوب ⚠️</span>
                      <span className="text-rose-450 font-black">{camouflage ? '••' : (c.unwithheld > 0 ? `-${c.unwithheld.toLocaleString()}` : '0')}</span>
                    </div>
                  </div>

                  {/* Withheld Progress bar */}
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-[9px] text-[#94a3b8] font-bold">
                      <span>نسبة امتلاء الخزانة:</span>
                      <span>{Math.floor(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions Control */}
                <div className="border-t border-slate-100 dark:border-zinc-900/50 pt-2.5 flex flex-wrap gap-1 items-center justify-between text-[10px]">
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        if (c.withheld <= 0) {
                          alert('لا يوجد أي رصيد محجوز جاهز للصرف في هذا الالتزام!');
                          return;
                        }
                        if (confirm(`هل أنت متأكد من صرف مبلغ ${c.withheld.toLocaleString()} ريال لهذا الالتزام؟ سيتم إدراج العملية بالخزنة وتصفير التراكم.`)) {
                          disburseCommitment(c.id, c.withheld);
                          alert('تم صرف وتفريع الالتزام بالخزنة وإعادة تصفير العداد التراكمي للالتزام بنجاح!');
                        }
                      }}
                      className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-slate-950 font-extrabold rounded-lg transition text-[9px] cursor-pointer"
                    >
                      صرف الالتزام
                    </button>
                    <button
                      onClick={() => {
                        carryOverCommitment(c.id);
                        alert('تم ترحيل الالتزام وتمديد يومية التراكم للشهر القادم دون تغيير.');
                      }}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg transition text-[9px] cursor-pointer"
                    >
                      ترحيل
                    </button>
                    <button
                      onClick={() => {
                        alert('تم الإبقاء والاحتفاظ بحساب هذا الالتزام ومحجوزاته كما هي بالخزنة.');
                      }}
                      className="px-2 py-1 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-lg transition text-[9px] cursor-pointer"
                    >
                      إبقاء
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="flex gap-1 items-center">
                      <input
                        type="number"
                        value={newRateValue}
                        onChange={e => setNewRateValue(e.target.value)}
                        placeholder="1500"
                        className="w-12 bg-white dark:bg-zinc-950 text-[10px] text-right font-mono rounded-lg border p-0.5 border-amber-500"
                      />
                      <button
                        onClick={() => {
                          const rateNum = Number(newRateValue);
                          if (isNaN(rateNum) || rateNum < 0) return;
                          updateCommitmentRate(c.id, rateNum);
                          setEditingCommitmentId(null);
                        }}
                        className="p-1 px-1.5 bg-green-500 hover:bg-green-600 text-slate-950 rounded-lg font-bold"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingCommitmentId(c.id);
                        setNewRateValue(c.dailyRate.toString());
                      }}
                      className="text-amber-500 hover:underline font-extrabold text-[9px]"
                    >
                      تعديل المعدل
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAILY MOVEMENT EXPANDABLE MODAL PANEL (حركة الخزنة اليوم) */}
      {showTodayMovement && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-805 text-white rounded-3xl p-6 max-w-xl w-full space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="text-amber-500" size={20} />
                <h4 className="text-sm font-bold">تقرير تفاصيل حركة الخزنة اليوم: {todayStr}</h4>
              </div>
              <button 
                onClick={() => setShowTodayMovement(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* In, Out, Clean movement metrics row */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] text-emerald-500 block font-bold">إجمالي الدخول اليوم</span>
                <span className="text-base font-black font-mono text-emerald-405">+{camouflage ? '••••' : `${todayIn.toLocaleString()}`}</span>
              </div>
              <div className="bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                <span className="text-[10px] text-rose-450 block font-bold">إجمالي الخروج اليوم</span>
                <span className="text-base font-black font-mono text-rose-405">-{camouflage ? '••••' : `${todayOut.toLocaleString()}`}</span>
              </div>
              <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                <span className="text-[10px] text-amber-500 block font-bold">صافي الحركة اليوم</span>
                <span className={`text-base font-black font-mono ${todayNet >= 0 ? 'text-emerald-400' : 'text-rose-405'}`}>
                  {camouflage ? '••••' : `${todayNet >= 0 ? '+' : ''}${todayNet.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* List of today's activities detailing time, direction, cause and amount */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <p className="text-[10px] font-bold text-slate-400">بيان تفاصيل حركات الخزنة اليوم:</p>
              {todayTransactions.length > 0 ? (
                todayTransactions.map((tx) => {
                  const isTxIn = tx.type === 'in';
                  return (
                    <div 
                      key={tx.id} 
                      className="bg-zinc-950 p-3 rounded-xl text-xs flex justify-between items-center gap-3 border border-zinc-850"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${isTxIn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {isTxIn ? 'دخل' : 'خرج'}
                          </span>
                          <span className="font-extrabold text-slate-200">{tx.reason}</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono block">⏰ التوقيت: الساعة {tx.time}</span>
                      </div>
                      <span className={`font-mono font-black text-sm whitespace-nowrap ${isTxIn ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isTxIn ? '+' : '-'}{camouflage ? '•••' : `${tx.amount.toLocaleString()} ر.ي`}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  لا توجد أي عمليات أو حركات مالية مسجلة في الخزنة اليومية حتى الآن.
                </div>
              )}
            </div>

            <button
              onClick={() => setShowTodayMovement(false)}
              className="w-full bg-slate-800 hover:bg-slate-750 font-bold py-2 rounded-xl text-xs text-white text-center cursor-pointer"
            >
              إغلاق التقارير
            </button>
          </div>
        </div>
      )}

      {/* EDITING INTERACTIVE OPENING BALANCE MODAL OVERLAY */}
      {showOpeningModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="text-amber-500 animate-pulse" size={20} />
                <h4 className="text-sm font-bold text-slate-100">تعديل الأرصدة الافتتاحية للموازنة</h4>
              </div>
              <button onClick={() => setShowOpeningModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOpening} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">الريال اليمني (YER) 🇾🇪</label>
                <input
                  type="number"
                  value={opYemeni}
                  onChange={e => setOpYemeni(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">الريال السعودي (SAR) 🇸🇦</label>
                <input
                  type="number"
                  value={opSaudi}
                  onChange={e => setOpSaudi(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">الدولار الأمريكي (USD) 🇺🇸</label>
                <input
                  type="number"
                  value={opUsd}
                  onChange={e => setOpUsd(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  حفظ وتحديث الأرصدة
                </button>
                <button
                  type="button"
                  onClick={() => setShowOpeningModal(false)}
                  className="px-4 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Outflow Addition Form block */}
      {isAddingExpense && (
        <form onSubmit={handleCreateExpense} className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 max-w-xl mx-auto space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-850">
            <span className="text-xs font-black text-rose-500">منصرف وخارج مباشر من السيولة الحرة النقدية بالخزنة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">بيان وصرف المعاملة</label>
              <input
                type="text"
                value={expenseReason}
                onChange={e => setExpenseReason(e.target.value)}
                placeholder="مثال: تسديد صيانة المعمل أو مصاريف دورية طارئة"
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-zinc-100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">قيمة الصرف الفعلي (بالريال اليمني - من السيولة الحرة)</label>
              <input
                type="number"
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-zinc-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">التاريخ</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-[10px] rounded p-1 w-full border border-slate-200 dark:border-zinc-800"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">الوقت</label>
                <input
                  type="time"
                  value={expenseTime}
                  onChange={e => setExpenseTime(e.target.value)}
                  className="bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-[10px] rounded p-1 w-full border border-slate-200 dark:border-zinc-800"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-900 justify-end">
            <button
              type="submit"
              className="bg-rose-500 hover:bg-rose-600 font-extrabold text-slate-950 rounded-xl px-4 py-2 text-xs cursor-pointer active:scale-95 transition"
            >
              تأكيد الصرف المباشر
            </button>
            <button
              type="button"
              onClick={() => setIsAddingExpense(false)}
              className="bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl border border-slate-200 dark:border-zinc-750 px-4 py-2 text-xs cursor-pointer text-center"
            >
              إلغاء والتراجع
            </button>
          </div>
        </form>
      )}

      {/* Directory search and preset status filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="البحث برقم القيد أو وصف المعاملة بالخزنة..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-zinc-100 rounded-xl pr-8 pl-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2 self-stretch sm:self-center">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-zinc-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer font-bold"
          >
            <option value="all">كل المعاملات بالحركات</option>
            <option value="in">إيرادات ومقبوضات الخزنة (📥)</option>
            <option value="out">منصرفات ومخرجات الخزنة (📤)</option>
          </select>

          <button
            onClick={handleShareVault}
            className="bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs py-1.5 px-3.5 rounded-xl font-bold transition flex items-center gap-1 border border-slate-200 dark:border-zinc-800 cursor-pointer"
          >
            <Share2 size={13} />
            <span>تصدير تقرير الحركة</span>
          </button>
        </div>
      </div>

      {/* Double-entry Ledger Logs list table */}
      <div className="overflow-hidden border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm bg-white dark:bg-zinc-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="p-3">نوع الحركة</th>
                <th className="p-3">قيد وسبب المعاملة</th>
                <th className="p-3">مبلغ القيد باليمني</th>
                <th className="p-3">الرصيد الكلي بعدها</th>
                <th className="p-3 text-left">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-zinc-850 font-medium">
              {filteredTrans.map(log => {
                const isIn = log.type === 'in';
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 text-slate-800 dark:text-zinc-200 transition">
                    <td className="p-3 font-semibold">
                      {isIn ? (
                        <span className="text-emerald-500 font-extrabold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          توريد / مقبوض 📥
                        </span>
                      ) : (
                        <span className="text-rose-500 font-extrabold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          صرف / منصرف 📤
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-950 dark:text-white font-extrabold">
                      {log.reason}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {isIn ? (
                        <span className="text-emerald-500">+{cashLabel(log.amount)}</span>
                      ) : (
                        <span className="text-rose-500">-{cashLabel(log.amount)}</span>
                      )}
                    </td>
                    {/* true cumulative double-entry audit check with balanceAfter! */}
                    <td className="p-3 font-mono font-black text-slate-500 dark:text-zinc-400">
                      {cashLabel(log.balanceAfter)}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-zinc-400 text-left font-mono text-[10px]">
                      <div>{log.date}</div>
                      <div>{log.time}</div>
                    </td>
                  </tr>
                );
              })}
              {filteredTrans.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-zinc-500 font-bold">
                    لا توجد أي حركات مالية مسجلة في كشف حساب الخزنة حالياً تماشي هذا الفلتر.
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
