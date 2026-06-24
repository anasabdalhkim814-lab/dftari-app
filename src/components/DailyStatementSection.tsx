import React, { useState } from 'react';
import { Transaction, VaultTransaction, MetalTransaction, Trust, Shop, AppSettings, Commitment } from '../types';
import { getHijriDate } from '../utils';
import { 
  Calendar, Search, Share2, Printer, CheckCircle2, AlertCircle, ShoppingBag, 
  Coins, DollarSign, Eye, EyeOff, TrendingUp, TrendingDown, ArrowUpRight, 
  ArrowDownLeft, HelpCircle, Activity, ChevronLeft, CalendarDays, RefreshCw, X, ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';

interface DailyStatementSectionProps {
  transactions: Transaction[];
  vaultTransactions: VaultTransaction[];
  metalTransactions: MetalTransaction[];
  trusts: Trust[];
  shops: Shop[];
  settings: AppSettings;
  camouflage: boolean;
  commitments?: Commitment[];
  onTriggerMarketClosing?: () => void;
}

export default function DailyStatementSection({
  transactions = [],
  vaultTransactions = [],
  metalTransactions = [],
  trusts = [],
  shops = [],
  settings,
  camouflage,
  commitments = [],
  onTriggerMarketClosing
}: DailyStatementSectionProps) {
  
  // Date Picker state - defaults to today
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Search and advanced filters state
  const [searchText, setSearchText] = useState('');
  const [selectedOpType, setSelectedOpType] = useState<string>('all'); // 'all' or categories
  const [selectedShopId, setSelectedShopId] = useState<string>('all');
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all'); // 'all', 'paid', 'unpaid'
  const [selectedOutflowSource, setSelectedOutflowSource] = useState<string>('all'); // 'free_vault', 'collected', 'both'

  // Clipboard notify feedback
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const triggerCopyFeedback = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // 1. Gregorian formatting
  const formattedMiladi = new Date(selectedDate).toLocaleDateString('ar-YE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // 2. Hijri formatting (Calculated relative to selected target date)
  const getHijriDateForTarget = (targetDateStr: string, offsetDays: number = 0): string => {
    try {
      const date = new Date(targetDateStr);
      if (offsetDays !== 0) {
        date.setDate(date.getDate() + offsetDays);
      }
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return formatter.format(date);
    } catch (e) {
      // Fallback
      return "١٩ ذو الحجة ١٤٤٧ هـ";
    }
  };

  const formattedHijri = getHijriDateForTarget(selectedDate, settings?.hijriDateOffset || 0);

  // Core filter arrays belonging to selectedDate
  const dayTransactions = transactions.filter(tx => tx.date === selectedDate);
  const dayVaultTransactions = vaultTransactions.filter(vt => vt.date === selectedDate);
  const dayMetalTransactions = metalTransactions.filter(mt => mt.date === selectedDate);
  const dayTrusts = trusts.filter(t => t.date === selectedDate || t.deliveredDate === selectedDate);

  // 1- عمليات شغل المحلات
  const dayShopTxs = dayTransactions.filter(tx => tx.type === 'shop');

  // 2- عمليات الزبون الخارجي
  const dayExternalTxs = dayTransactions.filter(tx => tx.type === 'external');

  // 3- الدخل الجانبي
  const daySideTxs = dayTransactions.filter(tx => tx.type === 'side');

  // 4- عمليات الديون المستلمة والمسددة
  // دين لي: Any vault transaction indicating a debt repayment on this day
  const debtsReceivedToday = dayVaultTransactions.filter(vt => 
    vt.type === 'in' && (vt.reason.includes('تسديد دين') || vt.reason.includes('دين سابق'))
  );

  // دين علي: Any General Trust of type 'cash' with reason starting with 'دين علينا' which has been delivered on this target selectedDate
  // Also list vault outs marked as paying a liability
  const debtsPaidTodayFromTrusts = trusts.filter(t => 
    t.type === 'cash' && 
    t.party !== '' && 
    t.description.includes('دين علينا') && 
    t.status === 'delivered' && 
    t.deliveredDate === selectedDate
  );

  const debtsPaidTodayFromVault = dayVaultTransactions.filter(vt => 
    vt.type === 'out' && (vt.reason.includes('تسديد دين علينا') || vt.reason.includes('سداد دين لـ'))
  );

  // Combined debts paid
  const debtsPaidToday = [
    ...debtsPaidTodayFromTrusts.map(t => ({
      id: t.id,
      reason: t.description + ` (لصاحب الحق: ${t.party})`,
      amount: t.amount,
      time: t.deliveredTime || t.time
    })),
    ...debtsPaidTodayFromVault.map(vt => ({
      id: vt.id,
      reason: vt.reason,
      amount: vt.amount,
      time: vt.time
    }))
  ];

  // 5- عمليات الخزنة (in/out impact on cashier today)
  const dayVaultOperations = dayVaultTransactions;

  // 6- المصروفات (outflows only)
  const dayOutflows = dayVaultTransactions.filter(vt => 
    vt.type === 'out' && 
    !vt.reason.includes('تغطية عجز التزام من الخزنة') &&
    !vt.reason.includes('تسديد دين علينا') &&
    !vt.reason.includes('سداد دين علينا') &&
    !vt.reason.includes('شراء معدن')
  );

  // 7- حركة المعادن
  const dayMetalTxs = dayMetalTransactions;

  // --- Financial calculations consistent with Home logic ---
  // Dels/Incomes
  const dayIncome = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Total Outflows - now strictly representing operational expenses (excluding metal buys & deficit coverages)
  const dayExpense = dayOutflows.reduce((sum, vt) => sum + vt.amount, 0);

  // Net received today
  const dayReceivedDirect = dayTransactions.reduce((sum, tx) => sum + tx.receivedAmount, 0);
  const dayReceivedDebtPay = debtsReceivedToday.reduce((sum, vt) => sum + vt.amount, 0);
  const dayReceived = dayReceivedDirect + dayReceivedDebtPay;

  // --- Core daily closing calculations ---
  const dayCollectedOutflows = dayVaultTransactions
    .filter(vt => vt.type === 'out')
    .reduce((sum, vt) => {
      if (vt.source === 'collected') return sum + vt.amount;
      if (vt.source === 'both') return sum + (vt.collectedAmount ?? Math.round(vt.amount / 2));
      return sum;
    }, 0);

  const netDailyFreeCash = Math.max(0, dayReceivedDirect - dayCollectedOutflows);

  // Closed/Closing state flags
  const todayStr = new Date().toISOString().split('T')[0];
  
  const isSelectedDateClosed = dayVaultTransactions.some(vt => 
    vt.reason === 'ترحيل صافي اليوم' || 
    vt.reason.includes('إغلاق اليوم المالي') || 
    vt.reason.includes('إغلاق السوق وحسابات اليوم')
  );

  const isTodayClosed = vaultTransactions.some(vt => 
    vt.date === todayStr && 
    (vt.reason === 'ترحيل صافي اليوم' || 
     vt.reason.includes('إغلاق اليوم المالي') || 
     vt.reason.includes('إغلاق السوق وحسابات اليوم'))
  );

  // Get available vault cash before closing
  const getPreCloseVaultCash = () => {
    const openingYemeni = settings.openingBalanceYemeni || 0;
    const cumulativeInflows = vaultTransactions
      .filter(t => t.type === 'in' && !(t.date === selectedDate && (t.reason === 'ترحيل صافي اليوم' || t.reason.includes('إغلاق اليوم المالي'))))
      .reduce((sum, t) => sum + t.amount, 0);
      
    const cumulativeOutflows = vaultTransactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => {
        if (t.date === selectedDate && t.reason.includes('تغطية عجز التزام من الخزنة')) return sum;
        if (t.source === 'collected') return sum;
        if (t.source === 'both') return sum + (t.vaultAmount ?? Math.round(t.amount / 2));
        return sum + t.amount;
      }, 0);
      
    return Math.max(0, openingYemeni + cumulativeInflows - cumulativeOutflows);
  };

  const preCloseVaultCash = getPreCloseVaultCash();

  // Re-simulate / reconstruct the commitments coverage sequence
  let remainingFree = netDailyFreeCash;
  let remainingVault = preCloseVaultCash;
  
  const simulatedCommitmentLogs = (commitments || []).map(c => {
    const dueToday = c.dailyRate + (c.accumulatedDeficit || 0);
    const coveredFromFree = Math.min(remainingFree, dueToday);
    remainingFree -= coveredFromFree;
    
    let stillDue = dueToday - coveredFromFree;
    let coveredFromVault = 0;
    
    if (stillDue > 0 && remainingVault > 0) {
      coveredFromVault = Math.min(remainingVault, stillDue);
      remainingVault -= coveredFromVault;
      stillDue -= coveredFromVault;
    }
    
    const finalDeficit = stillDue;
    const totalCovered = coveredFromFree + coveredFromVault;
    
    return {
      id: c.id,
      name: c.name,
      dailyRate: c.dailyRate,
      prevDeficit: c.accumulatedDeficit || 0,
      dueToday,
      coveredFromFree,
      coveredFromVault,
      finalDeficit,
      totalCovered
    };
  });

  const simulatedTotalDeficit = simulatedCommitmentLogs.reduce((sum, cl) => sum + cl.finalDeficit, 0);
  const simulatedTotalReserved = simulatedCommitmentLogs.reduce((sum, cl) => sum + cl.totalCovered, 0);
  const simulatedTotalDrawnFromVault = simulatedCommitmentLogs.reduce((sum, cl) => sum + cl.coveredFromVault, 0);
  const simulatedNetTransferred = remainingFree;

  // Get total workers list for filters
  const uniqueWorkers = Array.from(new Set(transactions.filter(t => t.workerName).map(t => t.workerName as string)));

  // --- Apply Filters on lists and groups for selective view ---
  const matchesSearch = (text: string) => {
    if (!searchText) return true;
    const lower = searchText.toLowerCase();
    return text.toLowerCase().includes(lower);
  };

  const filterShopTxs = dayShopTxs.filter(tx => {
    if (selectedShopId !== 'all' && tx.shopId !== selectedShopId) return false;
    if (selectedWorker !== 'all' && tx.workerName !== selectedWorker) return false;
    if (selectedPaymentStatus === 'paid' && tx.paymentMethod !== 'cash') return false;
    if (selectedPaymentStatus === 'unpaid' && tx.paymentMethod === 'cash') return false;
    return matchesSearch(tx.description || '') || matchesSearch(tx.shopName || '') || matchesSearch(tx.workerName || '');
  });

  const filterExternalTxs = dayExternalTxs.filter(tx => {
    if (selectedPaymentStatus === 'paid' && tx.receivedAmount < tx.amount) return false;
    if (selectedPaymentStatus === 'unpaid' && tx.receivedAmount >= tx.amount) return false;
    return matchesSearch(tx.description || '');
  });

  const filterSideTxs = daySideTxs.filter(tx => {
    return matchesSearch(tx.description || '');
  });

  const filterDebtsReceived = debtsReceivedToday.filter(vt => {
    return matchesSearch(vt.reason || '');
  });

  const filterDebtsPaid = debtsPaidToday.filter(vt => {
    return matchesSearch(vt.reason || '');
  });

  const filterVaultOps = dayVaultOperations.filter(vt => {
    return matchesSearch(vt.reason || '');
  });

  const filterOutflows = dayOutflows.filter(vt => {
    // Check if we can infer source (some reasons mention source or we display overall)
    if (selectedOutflowSource !== 'all') {
      const lowerReason = vt.reason.toLowerCase();
      if (selectedOutflowSource === 'free_vault' && !lowerReason.includes('حر')) return false;
      if (selectedOutflowSource === 'collected' && !lowerReason.includes('مقبوض')) return false;
    }
    return matchesSearch(vt.reason || '');
  });

  const filterMetalTxs = dayMetalTxs.filter(mt => {
    return matchesSearch(mt.notes || '') || matchesSearch(mt.purity) || matchesSearch(mt.metalType);
  });

  // Calculate currency string
  const formatCurrency = (val: number) => {
    return `${val.toLocaleString('ar-YE')} ر.ي`;
  };

  // --- REPORT GENERATION FOR WHATSAPP SHARE ---
  const handleCopyFullReportStr = () => {
    let reportText = `📜 *كشف وإجماليات نهاية يوم العمل - دفتري الذكي* 📜\n`;
    reportText += `📅 *التاريخ:* ${formattedMiladi}\n🌙 *هجرياً:* ${formattedHijri}\n`;
    reportText += `═`.repeat(25) + `\n`;
    
    if (camouflage) {
      reportText += `🔒 [الأرقام الحسابية مغلقة بغطاء التمويه]\n`;
    } else {
      reportText += `📊 *موجز التدفقات المالية:* \n`;
      reportText += `💰 *إجمالي الدخل:* ${formatCurrency(dayIncome)}\n`;
      reportText += `💸 *إجمالي الخرج:* ${formatCurrency(dayExpense)}\n`;
      reportText += `📈 *صافي المقبوض اليومي:* ${formatCurrency(dayReceived)}\n`;
      reportText += `🔢 *عدد العمليات المقيدة:* ${dayTransactions.length} عملية اليوم\n`;
    }
    reportText += `═`.repeat(25) + `\n\n`;

    // 1. شغل المحلات
    reportText += `🏬 *الأول: ورش وشغل المحلات:*\n`;
    if (dayShopTxs.length === 0) {
      reportText += `   _لا يوجد عمليات قيد للمحلات_\n`;
    } else {
      dayShopTxs.forEach((tx, idx) => {
        const payStatus = tx.paymentMethod === 'cash' ? '✅ نقداً مستلم' : `⏳ آجل (دين: ${tx.amount - tx.receivedAmount} ر.ي)`;
        reportText += `   ${idx + 1}. محل ${tx.shopName} (العامل: ${tx.workerName || '-'}) | ${tx.description}\n`;
        reportText += `      • نقاط: ${tx.points || 0} حبة × ${tx.pricePerPointHistorical || '-'} ر.ي | القيمة: ${formatCurrency(tx.amount)} (${payStatus})\n`;
      });
    }
    reportText += `\n`;

    // 2. الزبون الخارجي
    reportText += `👤 *الثاني: شغل الزبون الخارجي المباشر:*\n`;
    if (dayExternalTxs.length === 0) {
      reportText += `   _لا يوجد عمليات مع زبون خارجي_\n`;
    } else {
      dayExternalTxs.forEach((tx, idx) => {
        const deliveryStatus = tx.receivedAmount >= tx.amount ? '✅ مستلم خالص' : `⏳ معلق (تبقت: ${tx.amount - tx.receivedAmount} ر.ي)`;
        reportText += `   ${idx + 1}. بيان الشغل: ${tx.description}\n`;
        reportText += `      • القيمة الكلية: ${formatCurrency(tx.amount)} | المستلم: ${formatCurrency(tx.receivedAmount)} [${deliveryStatus}]\n`;
      });
    }
    reportText += `\n`;

    // 3. الدخل الجانبي
    reportText += `💜 *الثالث: الدخل الجانبي والخدمات الفورية:*\n`;
    if (daySideTxs.length === 0) {
      reportText += `   _لا توجد حركات مقيدة_\n`;
    } else {
      daySideTxs.forEach((tx, idx) => {
        reportText += `   ${idx + 1}. السبب: ${tx.description} | المبلغ: ${formatCurrency(tx.amount)} | 🕐 ${tx.time}\n`;
      });
    }
    reportText += `\n`;

    // 4. عمليات الديون
    reportText += `🤝 *الرابع: جرد وتسوية الديون:*\n`;
    reportText += `   *🟢 المتحصل لنا (دين لي):*\n`;
    if (debtsReceivedToday.length === 0) {
      reportText += `      _لا يوجد متحصلات اليوم_\n`;
    } else {
      debtsReceivedToday.forEach((vt, idx) => {
        reportText += `      ← ${idx + 1}. ${vt.reason} | القيمة: ${formatCurrency(vt.amount)} | 🕐 ${vt.time}\n`;
      });
    }
    reportText += `   *🔴 المسدد للغير (دين علي):*\n`;
    if (debtsPaidToday.length === 0) {
      reportText += `      _لا يوجد مسددات لليوم_\n`;
    } else {
      debtsPaidToday.forEach((vt, idx) => {
        reportText += `      → ${idx + 1}. ${vt.reason} | القيمة: ${formatCurrency(vt.amount)} | 🕐 ${vt.time}\n`;
      });
    }
    reportText += `\n`;

    // 5. حركة الخزنة
    reportText += `🗄️ *الخامس: حركات الخزنة والسيولة الفعالة:*\n`;
    if (dayVaultOperations.length === 0) {
      reportText += `   _لا توجد تداولات للخزنة_\n`;
    } else {
      dayVaultOperations.forEach((vt, idx) => {
        const sign = vt.type === 'in' ? '🟢 دخل' : '🔴 خرج';
        reportText += `   ${idx + 1}. [${sign}] ${vt.reason} | المبلغ: ${formatCurrency(vt.amount)} | 🕐 ${vt.time}\n`;
      });
    }
    reportText += `\n`;

    // 6. الخرج والمصروفات
    reportText += `💸 *السادس: الخرج والمصاريف التشغيلية لليومية:*\n`;
    if (dayOutflows.length === 0) {
      reportText += `   _لا يوجد مصروفات لليوم_\n`;
    } else {
      dayOutflows.forEach((vt, idx) => {
        reportText += `   ${idx + 1}. المصروف: ${vt.reason} | المبلغ: ${formatCurrency(vt.amount)} | 🕐 ${vt.time}\n`;
      });
    }
    reportText += `\n`;

    // 7. جرد المعادن
    reportText += `🪙 *السابع: حركة وإيداعات المعادن والأصول:*\n`;
    if (dayMetalTxs.length === 0) {
      reportText += `   _لا توجد حركات بيع أو شراء معادن لليوم_\n`;
    } else {
      dayMetalTxs.forEach((mt, idx) => {
        const sign = mt.type === 'buy' ? '📥 شراء' : '📤 بيع';
        const typeStr = mt.metalType === 'gold' ? 'ذهب' : 'فضة';
        reportText += `   ${idx + 1}. [${sign}] معدن ${typeStr} عيار ${mt.purity} | الوزن: ${mt.weight} جرام\n`;
        reportText += `      • القيمة الكلية: ${formatCurrency(mt.totalAmount)} | سعر الجرام: ${formatCurrency(mt.pricePerUnit)} | 🕐 ${mt.time}\n`;
      });
    }

    reportText += `\n_تم توليد وتوثيق التقرير الشامل آلياً بفضل نظام دفتري الذكي_`;

    navigator.clipboard.writeText(reportText);
    triggerCopyFeedback('تم نسخ الكشف اليومي بالكامل كنص منسق لمشاركته عبر واتساب بنجاح! 📋');
  };

  // SHARE SINGLE ITEM FORMATTER
  const handleCopySingleItem = (title: string, detail: string, amount: number, extraDetails: string) => {
    let text = `💎 *عملية مقيدة - دفتري الذكي* 💎\n`;
    text += `═`.repeat(25) + `\n`;
    text += `📌 *القسم:* ${title}\n`;
    text += `📝 *التفاصيل:* ${detail}\n`;
    text += `💰 *المبلغ:* ${camouflage ? '•••••' : formatCurrency(amount)}\n`;
    if (extraDetails) text += `${extraDetails}\n`;
    text += `📅 *التاريخ:* ${formattedMiladi}\n`;
    text += `═`.repeat(25) + `\n`;
    text += `_دفتري الذكي - دقة الحساب وأمان الحقوق_`;

    navigator.clipboard.writeText(text);
    triggerCopyFeedback('تم نسخ تفاصيل العملية بنجاح! يمكنك إرسالها الآن 📲');
  };

  // Visual filter matching indicators
  const activeExternalPendingCount = dayExternalTxs.filter(t => t.receivedAmount < t.amount).length;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in text-slate-100 pb-12" dir="rtl">
      
      {/* 1. Header with search and date picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        
        <div className="space-y-1.5 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-amber-500" size={24} />
            <h2 className="text-xl font-black text-white tracking-wide">كشف ومتابعة السجل اليومي</h2>
          </div>
          <p className="text-xs text-slate-400">
            شاهد وراقب وحلل مجمل التحركات المالية، صفقات المعادن، الديون، والمقبوضات ليوم العمل المحدد.
          </p>
        </div>

        {/* Date picking box and Trigger closing button */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full md:w-auto self-stretch md:self-auto">
          {onTriggerMarketClosing && new Date().getHours() >= 19 && !isTodayClosed && selectedDate === todayStr && (
            <button
              onClick={onTriggerMarketClosing}
              className="w-full sm:w-auto px-5 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-2xl transition duration-150 flex items-center justify-center gap-2 shadow-md cursor-pointer border border-rose-500/30 font-sans"
              id="statement-market-closing-btn"
            >
              🌙
              <span>إغلاق السوق اليومي</span>
              {activeExternalPendingCount > 0 && (
                <span className="bg-white text-rose-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-sans font-bold">
                  {activeExternalPendingCount}
                </span>
              )}
            </button>
          )}

          {isSelectedDateClosed && (
            <div className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-inner select-none">
              <CheckCircle2 size={15} />
              <span>اليوم مغلق ومرحل كامل للأرشيف</span>
            </div>
          )}

          <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800/80 w-full sm:w-auto justify-between">
            <span className="text-xs font-bold text-slate-400 shrink-0">التصفح التاريخي:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-mono text-slate-200"
              id="statement-date-picker"
            />
          </div>
        </div>

      </div>

      {/* --- Feedback Alert Toast --- */}
      {copyFeedback && (
        <div className="fixed bottom-6 left-6 bg-slate-900 border-2 border-emerald-500/80 text-emerald-400 px-5 py-3.5 rounded-2xl shadow-2xl z-50 animate-bounce flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 size={16} />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* 2. TOP TOTALS SUMMARY CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-5 mb-5 relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 select-none">
              📅 ملخص النشاط المالي لليوم المحدد
            </span>
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <h3 className="text-lg font-black text-slate-100">{formattedMiladi}</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850 font-serif">
                🌙 {formattedHijri}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Share Report */}
            <button
              onClick={handleCopyFullReportStr}
              disabled={dayTransactions.length === 0 && dayVaultTransactions.length === 0 && dayMetalTransactions.length === 0}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 text-xs font-extrabold rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 text-right font-sans"
            >
              <Share2 size={14} />
              <span>مشاركة الكشف بالكامل (واتساب)</span>
            </button>
          </div>
        </div>

        {/* Totals Indicators Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 relative z-10">
          
          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl relative">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-bold">إجمالي الدخل اليومي</span>
              <TrendingUp size={16} className="text-amber-500" />
            </div>
            <p className="text-md sm:text-lg md:text-xl font-black font-mono mt-2 transition text-amber-500">
              {camouflage ? '••••••' : formatCurrency(dayIncome)}
            </p>
            <span className="text-[10px] text-slate-500 block mt-1">كافة إيرادات العمليات والورش</span>
          </div>

          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl relative">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-bold">إجمالي الخرج اليومي</span>
              <TrendingDown size={16} className="text-rose-500" />
            </div>
            <p className="text-md sm:text-lg md:text-xl font-black font-mono mt-2 transition text-rose-500">
              {camouflage ? '••••••' : formatCurrency(dayExpense)}
            </p>
            <span className="text-[10px] text-slate-500 block mt-1">المصروفات والخامات الخارجة</span>
          </div>

          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl relative">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-bold">إجمالي المستلم والسيولة</span>
              <Coins size={16} className="text-emerald-500" />
            </div>
            <p className="text-md sm:text-lg md:text-xl font-black font-mono mt-2 transition text-emerald-400">
              {camouflage ? '••••••' : formatCurrency(dayReceived)}
            </p>
            <span className="text-[10px] text-slate-500 block mt-1">المستلم المباشر + تسديد الديون</span>
          </div>

          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl relative">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-bold">عدد القيود المقبولة</span>
              <Activity size={16} className="text-slate-400" />
            </div>
            <p className="text-md sm:text-lg md:text-xl font-black font-mono mt-2 transition text-slate-200">
              {dayTransactions.length} عمليات
            </p>
            <span className="text-[10px] text-slate-500 block mt-1">أشغال المحلات والمصانع والزبون</span>
          </div>

        </div>

      </div>

      {/* 2.5. BRAND NEW: APPROVED ACCOUNTING CLOSED MARKET BREAKDOWN BOARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl" />
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="font-extrabold text-sm text-yellow-500">جرد وتصفية الحسابات اليومية والدورة المحاسبية</h3>
              <p className="text-[10px] text-slate-400">التدفق الفعلي لتغطية الالتزامات وترحيل المال الحر المتبقي للخزنة</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-sans">
            {isSelectedDateClosed ? (
              <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                🔒 الدورة مقفلة ومؤرشفة
              </span>
            ) : (
              <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg border border-amber-500/20 animate-pulse">
                ⏳ محاكاة حية قيد الإغلاق
              </span>
            )}
          </div>
        </div>

        {/* Visual flow process banner */}
        <div className="bg-slate-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-slate-205 dark:border-zinc-800 space-y-3 mb-5">
          <span className="text-[10px] text-amber-600 dark:text-amber-500 font-extrabold uppercase tracking-wider block text-center md:text-right">الدورة المالية والتدفق المحاسبي المعتمد للسيولة والالتزامات:</span>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-[11px] font-black py-1 px-1">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-550/10 dark:border-amber-500/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>١. الدخل المستلم</span>
            </div>
            <span className="text-slate-400 dark:text-zinc-600 font-sans font-black">←</span>
            <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/10 dark:border-rose-500/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>٢. الخرج اليومي</span>
            </div>
            <span className="text-slate-400 dark:text-zinc-600 font-sans font-black">←</span>
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-555/10 dark:border-emerald-500/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-555 bg-emerald-500 animate-pulse" />
              <span>٣. المال الحر اليومي</span>
            </div>
            <span className="text-slate-400 dark:text-zinc-600 font-sans font-black">←</span>
            <div className="bg-indigo-500/10 text-indigo-555 dark:text-indigo-400 border border-indigo-500/10 dark:border-indigo-500/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-555 bg-indigo-500" />
              <span>٤. مخصصات الالتزامات</span>
            </div>
            <span className="text-slate-400 dark:text-zinc-600 font-sans font-black">←</span>
            <div className="bg-blue-500/10 text-blue-555 dark:text-blue-400 border border-blue-500/10 dark:border-blue-500/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-555 bg-blue-500" />
              <span>٥. ترحيل الفائض للخزنة</span>
            </div>
          </div>
        </div>

        {/* The 4 main calculated steps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Steps list column */}
          <div className="lg:col-span-4 space-y-3.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">تسلسل الترتيب المحاسبي المعتمد:</span>

            {/* Step 1 */}
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-bold flex items-center justify-center font-sans">١</span>
                <span className="text-xs text-slate-300 font-bold">إجمالي الدخل المستلم اليوم</span>
              </div>
              <span className="text-xs font-bold font-mono text-amber-500">
                {camouflage ? '••••••' : formatCurrency(dayReceivedDirect)}
              </span>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-bold flex items-center justify-center font-sans">٢</span>
                <span className="text-xs text-slate-300 font-bold">إجمالي الخرج اليومي (المسحوب)</span>
              </div>
              <span className="text-xs font-bold font-mono text-rose-455 text-rose-400">
                {camouflage ? '••••••' : `-${formatCurrency(dayCollectedOutflows)}`}
              </span>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/40 border border-emerald-500/15 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center justify-center font-sans">٣</span>
                <span className="text-xs text-slate-200 font-black">المال الحر اليومي الصافي</span>
              </div>
              <span className="text-xs font-black font-mono text-emerald-400">
                {camouflage ? '••••••' : formatCurrency(netDailyFreeCash)}
              </span>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-help" title="الالتزامات المغطاة اليوم من المال الحر والخزنة">
                <span className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center font-sans">٤</span>
                <span className="text-xs text-slate-300 font-bold">تغطية الالتزامات اليومية</span>
              </div>
              <span className="text-xs font-bold font-mono text-indigo-400">
                {camouflage ? '••••••' : formatCurrency(simulatedTotalReserved)}
              </span>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-950/40 border border-blue-500/20 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold flex items-center justify-center font-sans">٥</span>
                <span className="text-xs text-slate-205 text-blue-300 font-extrabold pb-0.5">الرصيد المتبقي المرحل للخزنة</span>
              </div>
              <span className="text-xs font-extrabold font-mono text-blue-300">
                {camouflage ? '••••••' : formatCurrency(simulatedNetTransferred)}
              </span>
            </div>

          </div>

          {/* Detailed commitments coverage breakout column */}
          <div className="lg:col-span-8 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-[11px] text-slate-400 font-extrabold">تفصيل تسوية وتغذية الالتزامات اليومية المتراكمة:</span>
              <span className="text-[10px] font-mono text-slate-500">
                العهد المتوفرة بالخزنة قبل التغطية: <span className="text-slate-300 font-bold">{camouflage ? '••••••' : formatCurrency(preCloseVaultCash)}</span>
              </span>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {simulatedCommitmentLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs italic">
                  لا توجد عهود التزام يومية معالجة في النظام حالياً.
                </div>
              ) : (
                simulatedCommitmentLogs.map(cl => (
                  <div key={cl.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/75 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-205 text-slate-200">{cl.name}</span>
                      <span className="font-mono font-extrabold text-amber-500">
                        المطلوب اليوم: {camouflage ? '••••••' : formatCurrency(cl.dueToday)}
                        <span className="text-[10px] text-slate-500 font-medium font-sans block text-left">
                          (المعدل: {formatCurrency(cl.dailyRate)} + السابق: {formatCurrency(cl.prevDeficit)})
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-950 text-center text-[10px]">
                      <div className="bg-slate-950/40 p-1.5 rounded-lg">
                        <span className="text-slate-500 block">من المال الحر اليومي</span>
                        <span className="font-mono font-bold text-emerald-450 text-emerald-450 text-emerald-450 text-emerald-400 block mt-0.5">
                          {camouflage ? '••••••' : formatCurrency(cl.coveredFromFree)}
                        </span>
                      </div>
                      <div className="bg-slate-950/40 p-1.5 rounded-lg">
                        <span className="text-slate-500 block">المغذي من الخزنة</span>
                        <span className="font-mono font-bold text-indigo-400 block mt-0.5">
                          {camouflage ? '••••••' : formatCurrency(cl.coveredFromVault)}
                        </span>
                      </div>
                      <div className="bg-slate-950/40 p-1.5 rounded-lg">
                        <span className="text-slate-500 block font-sans">العجز المتراكم للغد</span>
                        <span className="font-mono font-bold text-rose-455 text-rose-400 block mt-0.5">
                          {camouflage ? '••••••' : formatCurrency(cl.finalDeficit)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 text-xs font-medium space-y-2 leading-relaxed">
              <div className="flex items-start gap-1.5 text-slate-400 text-[11px] leading-relaxed">
                <span className="text-amber-500">💡</span>
                <p>
                  يتم تغطية وتسوية التزامات اليوم أولاً من {` `}
                  <span className="text-emerald-400 font-bold">المال الحر اليومي</span>. في حال حدوث عجز تغطية للالتزام تتدخل {` `}
                  <span className="text-indigo-400 font-bold">الخزنة الحرة</span> للتغطية ليبقى الالتزام سليماً ومغذياً.
                  وإذا لم تكفِ الخزنة يتم تسجيل الباقي كـ{` `}
                  <span className="text-rose-400 font-bold">عجز التزام متراكم مستحق للغد</span>.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. SEARCH AND ADVANCED FILTERS BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <span className="text-xs font-extrabold text-amber-500 block border-b border-slate-850 pb-2">🔍 أدوات التصفية الفورية والبحث المعمق لليوم:</span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute right-3.5 top-3 text-slate-500" size={15} />
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="ابحث بوصف العملية، المحل، العامل، أو البيان..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              id="statement-search-field"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedOpType}
            onChange={e => setSelectedOpType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">كل الأقسام الرئيسية والعمليات</option>
            <option value="shop">1- شغل وتفاصيل المحلات</option>
            <option value="external">2- شغل الزبون الخارجي</option>
            <option value="side">3- الدخل الجانبي والخدمات</option>
            <option value="debts">4- حركة تسوية الديون</option>
            <option value="vault">5- عمليات كشف الخزنة والسيولة</option>
            <option value="expense">6- المصروفات والخرج</option>
            <option value="metal">7- تداول حركة المعادن الثمينة</option>
          </select>

          {/* Payment Method/Status Filter */}
          <select
            value={selectedPaymentStatus}
            onChange={e => setSelectedPaymentStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none col-span-1 sm:col-span-2 lg:col-span-1"
          >
            <option value="all">كل حالات الدفع الموثقة</option>
            <option value="paid">مستلم خالص / نقدي</option>
            <option value="unpaid">آجل / متبقي معلق</option>
          </select>
        </div>

        {/* Dynamic extra contextual filters based on selection */}
        {selectedOpType === 'shop' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-850 animate-slide-up">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">تصفية حسب المحل:</label>
              <select
                value={selectedShopId}
                onChange={e => setSelectedShopId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">جميع المحلات والورش</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">تصفية حسب العامل المسؤول:</label>
              <select
                value={selectedWorker}
                onChange={e => setSelectedWorker(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">جميع العمال</option>
                {uniqueWorkers.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedOpType === 'expense' && (
          <div className="pt-2 border-t border-slate-850 animate-slide-up">
            <label className="text-[10px] text-slate-500 font-bold block mb-1">نوع ومصدر التمويل للخرج:</label>
            <select
              value={selectedOutflowSource}
              onChange={e => setSelectedOutflowSource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">كل مصادر الصرف والخرج</option>
              <option value="free_vault">تمويل من حر الخزنة فقط</option>
              <option value="collected">تمويل من مال المقبوضات فقط</option>
            </select>
          </div>
        )}

      </div>

      {/* 4. SEVEN SPECIFIC LAYOUT DIVISIONS LISTINGS */}
      <div className="space-y-6">

        {/* Division 1: عمليات شغل المحلات */}
        {(selectedOpType === 'all' || selectedOpType === 'shop') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg space-y-4 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏬</span>
                <div>
                  <h3 className="font-extrabold text-sm text-amber-500">1- كشف عمليات شغل المحلات</h3>
                  <p className="text-[10px] text-slate-500">الأشغال والورش المقيدة لحساب مندوبي المحلات وتفاصيلها المودعة</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-slate-950 text-amber-550 border border-slate-800 px-3 py-1 rounded-full">
                أشغال مسجلة: {filterShopTxs.length} عمليات
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-3">اسم المحل ومكان تواجده</th>
                    <th className="p-3">اسم العامل المكلف</th>
                    <th className="p-3">نوع وتفاصيل الشغل</th>
                    <th className="p-3 text-center">النقاط والعقد</th>
                    <th className="p-3 text-center">سعر النقطة التاريخي</th>
                    <th className="p-3 text-left">المبلغ الكلي</th>
                    <th className="p-3 text-center">حالة الدفع</th>
                    <th className="p-3 text-center">مشاركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filterShopTxs.map(tx => {
                    const extraStr = `🏬 محل: ${tx.shopName}\n👤 عامل: ${tx.workerName}\n🔘 عدد النقاط: ${tx.points || 0} نقاط\n🏷️ سعر النقطة: ${tx.pricePerPointHistorical || '-'} ر.ي`;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-850/30 transition duration-100">
                        <td className="p-3 font-semibold text-slate-100">{tx.shopName}</td>
                        <td className="p-3 text-slate-400 font-sans">{tx.workerName || 'غير مسند'}</td>
                        <td className="p-3 font-medium text-slate-200">{tx.description}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-500">{tx.points || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-400">{tx.pricePerPointHistorical ? `${tx.pricePerPointHistorical} ر.ي` : '-'}</td>
                        <td className="p-3 text-left font-mono font-extrabold text-slate-100">{formatCurrency(tx.amount)}</td>
                        <td className="p-3 text-center">
                          {tx.paymentMethod === 'cash' ? (
                            <span className="bg-emerald-500/10 text-emerald-500 font-black text-[9px] px-2.5 py-1 rounded-lg">مستلم</span>
                          ) : (
                            <span className="bg-rose-500/10 text-rose-500 font-black text-[9px] px-2.5 py-1 rounded-lg">آجل بالذمة</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleCopySingleItem('شغل محلات', `${tx.shopName} - الشغل ${tx.description}`, tx.amount, extraStr)}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition cursor-pointer"
                            title="نسخ لمشاركة هذه العملية"
                          >
                            <Share2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filterShopTxs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500 italic">لا توجد عمليات شغل محلات مطابقة.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Division 2: عمليات الزبون الخارجي */}
        {(selectedOpType === 'all' || selectedOpType === 'external') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <div>
                  <h3 className="font-extrabold text-sm text-blue-400">2- كشف وأمانات الزبائن الخارجيين</h3>
                  <p className="text-[10px] text-slate-500">الشغل الفوري المباشر مع زبائن خارج المحلات وآليتها المعلقة للأمانة</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-slate-950 text-blue-450 border border-slate-800 px-3 py-1 rounded-full">
                الزبائن الخارجيين: {filterExternalTxs.length} قيود
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-3">تفاصيل ومواصفات العمل</th>
                    <th className="p-3 text-left">المبلغ الإجمالي</th>
                    <th className="p-3 text-left">المستلم الفعلي</th>
                    <th className="p-3 text-center">التسليم والحالة</th>
                    <th className="p-3 text-center">البياض / التحويل التلقائي للأمانات</th>
                    <th className="p-3 text-center">مشاركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filterExternalTxs.map(tx => {
                    const isFullyPaid = tx.receivedAmount >= tx.amount;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-850/30 transition duration-100">
                        <td className="p-3 font-semibold text-slate-200">{tx.description}</td>
                        <td className="p-3 text-left font-mono font-bold text-slate-300">{formatCurrency(tx.amount)}</td>
                        <td className="p-3 text-left font-mono font-bold text-emerald-400 bg-slate-950/15">{formatCurrency(tx.receivedAmount)}</td>
                        <td className="p-3 text-center">
                          {isFullyPaid ? (
                            <span className="bg-emerald-500/15 text-emerald-450 font-black text-[9px] px-2 py-0.5 rounded-lg">مكتمل ومستلم</span>
                          ) : (
                            <span className="bg-orange-500/10 text-orange-400 font-extrabold text-[9px] px-2 py-0.5 rounded-lg">غير مكتمل / معلق</span>
                          )}
                        </td>
                        <td className="p-3 text-center text-[10px]">
                          {isFullyPaid ? (
                            <span className="text-slate-500">-</span>
                          ) : tx.isTransferredToTrust ? (
                            <span className="text-purple-400 font-extrabold flex items-center justify-center gap-1">
                              💜 تم الترحيل لقسم الأمانات
                            </span>
                          ) : (
                            <span className="text-rose-455 font-bold animate-pulse">
                              ⏳ يرحل تلقائياً للأمانات عند إغلاق السوق
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleCopySingleItem('زبون خارجي', tx.description, tx.amount, `💼 المقبوض: ${tx.receivedAmount} ر.ي\n🛡️ باقي الترحيل: ${tx.amount - tx.receivedAmount} ر.ي`)}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition cursor-pointer"
                          >
                            <Share2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filterExternalTxs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 italic">لا توجد عمليات زبائن خارجيين معروضة.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Division 3: الدخل الجانبي */}
        {(selectedOpType === 'all' || selectedOpType === 'side') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">💜</span>
                <div>
                  <h3 className="font-extrabold text-sm text-purple-400">3- كشف الدخل الجانبي والخدمات الفورية</h3>
                  <p className="text-[10px] text-slate-500">مجال المقبوضات والخدمات الفرعية التي تدر ريعاً جانبياً تلقائياً</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-slate-950 text-purple-450 border border-slate-800 px-3 py-1 rounded-full">
                إجمالي الأنشطة: {filterSideTxs.length} قيود
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-3">بيان الإيراد / الخدمة الجانبية</th>
                    <th className="p-3 text-left">مبلغ الإيراد</th>
                    <th className="p-3 text-center">الوقت والتاريخ</th>
                    <th className="p-3 text-center">مشاركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filterSideTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-850/30 transition duration-100">
                      <td className="p-3 font-semibold text-slate-200">{tx.description}</td>
                      <td className="p-3 text-left font-mono font-extrabold text-purple-400">{formatCurrency(tx.amount)}</td>
                      <td className="p-3 text-center font-mono text-slate-500">{tx.time} | {tx.date}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleCopySingleItem('دخل جانبي والخدمات المقبوضة', tx.description, tx.amount, `🕐 توقيت النشاط المالي: ${tx.time}`)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition cursor-pointer"
                        >
                          <Share2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filterSideTxs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 italic">لا توجد قيود دخل جانبي مقيدة في هذا اليوم.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Division 4: عمليات الديون */}
        {(selectedOpType === 'all' || selectedOpType === 'debts') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤝</span>
                <div>
                  <h3 className="font-extrabold text-sm text-red-400 font-black">4- عمليات الديون والالتزامات العائلية والتجارية</h3>
                  <p className="text-[10px] text-slate-500">الأقساط والتحصيلات التي تلج كدخل أو مسددات وتأثير الخزائن الفعلي</p>
                </div>
              </div>
            </div>

            {/* Sub-Section 1: دين لي */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 border-r-2 border-emerald-500 pr-2">
                🟢 مقبوضات وتحصيلات ديون سابقة (دين لي):
              </h4>
              <div className="overflow-x-auto border border-emerald-950/40 rounded-2xl bg-emerald-950/5">
                <table className="w-full text-right text-xs">
                  <thead className="bg-emerald-950/20 text-emerald-400">
                    <tr>
                      <th className="p-3">بيان ونوع السداد للدين المسترجع</th>
                      <th className="p-3 text-left">المبلغ المتحصل المودع</th>
                      <th className="p-3 text-center">الوقت والتاريخ</th>
                      <th className="p-3 text-center">مشاركة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/20 text-slate-300">
                    {filterDebtsReceived.map(vt => (
                      <tr key={vt.id} className="hover:bg-emerald-950/15 transition duration-100">
                        <td className="p-3 font-semibold text-slate-100">{vt.reason}</td>
                        <td className="p-3 text-left font-mono font-extrabold text-emerald-400">{formatCurrency(vt.amount)}</td>
                        <td className="p-3 text-center font-mono text-slate-500">{vt.time}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleCopySingleItem('تحصيل دين مسترجع لنا', vt.reason, vt.amount, `🕐 توقيت الاستلام: ${vt.time}`)}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition cursor-pointer"
                          >
                            <Share2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filterDebtsReceived.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 italic">لا توجد ديون محصلة في هذا اليوم.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-Section 2: دين علي */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 border-r-2 border-amber-500 pr-2">
                🔴 دفع وتسديد عهود والتزامات للغير (دين علي):
              </h4>
              <div className="overflow-x-auto border border-amber-950/40 rounded-2xl bg-amber-950/5">
                <table className="w-full text-right text-xs">
                  <thead className="bg-amber-950/20 text-amber-500">
                    <tr>
                      <th className="p-3">صاحب الحق المالي والسبب</th>
                      <th className="p-3 text-left">المبلغ الخارج والمسدد لحسابه</th>
                      <th className="p-3 text-center">الوقت والتاريخ</th>
                      <th className="p-3 text-center">مشاركة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-950/20 text-slate-300">
                    {filterDebtsPaid.map(vt => (
                      <tr key={vt.id} className="hover:bg-amber-950/15 transition duration-100">
                        <td className="p-3 font-semibold text-slate-100">{vt.reason}</td>
                        <td className="p-3 text-left font-mono font-extrabold text-amber-400">{formatCurrency(vt.amount)}</td>
                        <td className="p-3 text-center font-mono text-slate-500">{vt.time}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleCopySingleItem('سداد دين عهود مستحق علينا', vt.reason, vt.amount, `🕐 توقيت السداد: ${vt.time}`)}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition cursor-pointer"
                          >
                            <Share2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filterDebtsPaid.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 italic font-medium">لا توجد سدادات للالتزام للغير لليوم.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Division 5: عمليات الخزنة */}
        {(selectedOpType === 'all' || selectedOpType === 'vault') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗄️</span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-205">5- سجل عمليات وحركة الخزنة والسيولة اليومية</h3>
                  <p className="text-[10px] text-slate-500">حركات المال الداخل والخارج من وإلى الخزينة ومتابعة التدفقات</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800 px-3 py-1 rounded-full">
                العمليات لليوم: {filterVaultOps.length} حركات
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">سبب أو بيان التداول المالي بالخزينة</th>
                    <th className="p-3 text-left">القيمة المتداولة</th>
                    <th className="p-3 text-center">الوقت المسجل</th>
                    <th className="p-3 text-center">مشاركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filterVaultOps.map(vt => (
                    <tr key={vt.id} className="hover:bg-slate-850/30 transition duration-100">
                      <td className="p-3">
                        {vt.type === 'in' ? (
                          <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-0.5 rounded-lg font-black flex items-center gap-1 w-fit">
                            <ArrowDownLeft size={12} /> دخل الخزنة
                          </span>
                        ) : (
                          <span className="bg-rose-500/10 text-rose-500 text-[10px] px-2 py-0.5 rounded-lg font-black flex items-center gap-1 w-fit">
                            <ArrowUpRight size={12} /> خرج الخزنة
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-200">{vt.reason}</td>
                      <td className="p-3 text-left font-mono font-extrabold text-slate-100">{formatCurrency(vt.amount)}</td>
                      <td className="p-3 text-center font-mono text-slate-500">{vt.time}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleCopySingleItem('حركة مالية الخزنة', `[${vt.type === 'in' ? 'دخل' : 'خرج'}] ${vt.reason}`, vt.amount, `🕐 وقت المعاملة: ${vt.time}`)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition cursor-pointer"
                        >
                          <Share2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filterVaultOps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 italic">لا توجد حركات مقيدة بالخزنة لليوم.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Division 6: الخرج والمصروفات */}
        {(selectedOpType === 'all' || selectedOpType === 'expense') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💸</span>
                <div>
                  <h3 className="font-extrabold text-sm text-rose-500">6- المصروفات والخرج اليومي</h3>
                  <p className="text-[10px] text-slate-500">حركات المصروفات التشغيلية والخرج والخامات المتداولة</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-slate-950 text-rose-505 border border-slate-800 px-3 py-1 rounded-full">
                إجمالي الدفوعات: {filterOutflows.length} مصروفات
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-3">سبب أو بيان المصاريف والخامات المسجلة</th>
                    <th className="p-3 text-left">مبلغ الخرج</th>
                    <th className="p-3 text-center">مصدر الصرف الفعلي</th>
                    <th className="p-3 text-center">الوقت والتوقيت</th>
                    <th className="p-3 text-center">مشاركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filterOutflows.map(vt => {
                    // Check funding source label if specified inside reason
                    let sourceDisplay = (
                      <span className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded-lg font-bold text-[9px]">
                        المال الحر في الخزنة
                      </span>
                    );
                    if (vt.reason.toLowerCase().includes('مقبوضات') || vt.reason.toLowerCase().includes('مستلم')) {
                      sourceDisplay = (
                        <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg font-bold text-[9px]">
                          المال المستلم
                        </span>
                      );
                    } else if (vt.reason.toLowerCase().includes('اثنين') || vt.reason.toLowerCase().includes('مشترك')) {
                      sourceDisplay = (
                        <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg font-bold text-[9px]">
                          الخزنة الحرة والمستلم معاً
                        </span>
                      );
                    }

                    return (
                      <tr key={vt.id} className="hover:bg-slate-850/30 transition duration-100">
                        <td className="p-3 font-semibold text-slate-200">{vt.reason}</td>
                        <td className="p-3 text-left font-mono font-extrabold text-rose-550 text-rose-450">{formatCurrency(vt.amount)}</td>
                        <td className="p-3 text-center">{sourceDisplay}</td>
                        <td className="p-3 text-center font-mono text-slate-500">{vt.time}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleCopySingleItem('مصروفات وخرج اليوم', vt.reason, vt.amount, `🕐 التوقيت: ${vt.time}`)}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition cursor-pointer"
                          >
                            <Share2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filterOutflows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 italic">لا توجد مصروفات مسجلة لليوم.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Division 7: حركة المعادن */}
        {(selectedOpType === 'all' || selectedOpType === 'metal') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪙</span>
                <div>
                  <h3 className="font-extrabold text-sm text-yellow-500">7- حركة وتداولات المعادن والأصول الكسر</h3>
                  <p className="text-[10px] text-slate-500">جرد وتوثيق صفقات شراء وبيع الذهب عيار 21 والفضة الكسر لحساب الخزائن</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-slate-950 text-yellow-500 border border-slate-800 px-3 py-1 rounded-full">
                الصفقات: {filterMetalTxs.length} عمليات اليوم
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-3">نوع التداول</th>
                    <th className="p-3">المعدن وعيار الفئة</th>
                    <th className="p-3 text-center">الوزن بالجرامات</th>
                    <th className="p-3 text-center">سعر الجرام الواحد</th>
                    <th className="p-3 text-left">قيمة الصفقة</th>
                    <th className="p-3 text-center">مصدر التمويل المالي</th>
                    <th className="p-3">ملاحظات توضيحية</th>
                    <th className="p-3 text-center">مشاركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filterMetalTxs.map(mt => {
                    const extraStr = `🪙 معدن: ${mt.metalType === 'gold' ? 'الذهب عيار' : 'الفضة عيار'} ${mt.purity}\n⚖️ الوزن: ${mt.weight} جرام\n💰 سعر الجرام: ${mt.pricePerUnit} ريال`;
                    return (
                      <tr key={mt.id} className="hover:bg-slate-850/30 transition duration-100">
                        <td className="p-3">
                          {mt.type === 'buy' ? (
                            <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-2 py-0.5 rounded font-black flex items-center justify-center gap-0.5 w-fit">
                              📥 شراء المعادن
                            </span>
                          ) : (
                            <span className="bg-amber-500/15 text-amber-500 text-[9px] px-2 py-0.5 rounded font-black flex items-center justify-center gap-0.5 w-fit">
                              📤 بيع المعادن
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-205 text-slate-200">
                          {mt.metalType === 'gold' ? 'الذهب الكسر عيار' : 'فضة كسر فئة'} {mt.purity}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-550 text-amber-500">{mt.weight} جرام</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-400">{formatCurrency(mt.pricePerUnit)}</td>
                        <td className="p-3 text-left font-mono font-black text-slate-100">{formatCurrency(mt.totalAmount)}</td>
                        <td className="p-3 text-center">
                          {mt.type === 'buy' ? (
                            mt.fundingSource === 'free_vault' ? (
                              <span className="bg-rose-500/10 text-rose-500 text-[9px] px-2 rounded">
                                حر الخزنة ( out )
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-2 rounded">
                                مال المقبوضات
                              </span>
                            )
                          ) : (
                            <span className="bg-blue-500/10 text-blue-405 text-blue-400 text-[9px] px-2 rounded font-bold">
                              أثر ريع الخزنة ( entries )
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400 truncate max-w-[150px]" title={mt.notes}>{mt.notes || '-'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleCopySingleItem(`${mt.type === 'buy' ? 'شراء' : 'بيع'} كسر معادن`, `${mt.metalType === 'gold' ? 'الذهب' : 'الفضة'} عيار ${mt.purity}`, mt.totalAmount, extraStr)}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition cursor-pointer"
                          >
                            <Share2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filterMetalTxs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500 italic">لا توجد حركات تداول معادن لليوم.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
