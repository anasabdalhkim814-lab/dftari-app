import React, { useState } from 'react';
import { Transaction, Shop, MetalTransaction, AppSettings, Commitment, Trust } from '../types';
import { 
  BarChart3, TrendingUp, TrendingDown, Coins, Award, Users, 
  Calendar, Scale, PieChart, ShieldAlert, Zap, BookOpen, 
  Layers, CheckCircle2, AlertCircle, RefreshCw, FolderClosed, 
  ListOrdered, Banknote, ChevronLeft, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

interface ReportsSectionProps {
  transactions: Transaction[];
  shops: Shop[];
  metalTransactions: MetalTransaction[];
  vaultTransactions: any[];
  settings: AppSettings;
  camouflage: boolean;
  commitments?: Commitment[];
  trusts?: Trust[];
}

export default function ReportsSection({
  transactions,
  shops,
  metalTransactions,
  vaultTransactions,
  settings,
  camouflage,
  commitments = [],
  trusts = []
}: ReportsSectionProps) {
  // Active Analytical Report Tab
  const [activeTab, setActiveTab] = useState<'profits' | 'vault' | 'commitments' | 'debts' | 'assets' | 'daily_archive'>('profits');
  
  // Period filter for general timeframes ('today' | 'week' | 'month' | 'year' | 'all')
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');

  // Filter list by selected period
  const filterByPeriod = <T extends { date: string }>(list: T[]): T[] => {
    if (period === 'all') return list;

    const now = new Date();
    return list.filter(item => {
      const itemDate = new Date(item.date);
      const diffMs = now.getTime() - itemDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (period === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        return item.date === todayStr;
      } else if (period === 'week') {
        return diffDays <= 7;
      } else if (period === 'month') {
        return diffDays <= 30;
      } else if (period === 'year') {
        return diffDays <= 365;
      }
      return true;
    });
  };

  // Period-specific datasets
  const periodTx = filterByPeriod(transactions);
  const periodVault = filterByPeriod(vaultTransactions.filter(t => t.id !== 'vt-init')); // skip initialization
  const periodMetal = filterByPeriod(metalTransactions);

  // Formatting Helpers
  const formatMoneyYemeni = (val: number) => {
    return `${Math.floor(val).toLocaleString()} ر.ي`;
  };

  const formatMoneyCustom = (val: number, cur: string) => {
    return `${val.toLocaleString()} ${cur}`;
  };

  const formatWeight = (val: number) => {
    const rounded = Number(val.toFixed(3));
    return `${rounded} جرام`;
  };

  // ==========================================
  // 1. Operational Profits (الأرباح التشغيلية)
  // ==========================================
  // دخل العمل الفعلي: Actual cash received from standard job transactions (type: shop, external, side)
  // that do not represent gold/silver debts or direct asset trades.
  const operatingActualIncome = periodTx
    .filter(tx => tx.type === 'shop' || tx.type === 'external' || tx.type === 'side')
    .filter(tx => !['gold', 'silver', 'asset'].includes(tx.currency || ''))
    .reduce((sum, tx) => sum + (tx.receivedAmount ?? 0), 0);

  // المصروفات التشغيلية الفعلية: Outflows from vault excluding non-operating parameters
  const operatingExpensesList = periodVault.filter(vt => {
    if (vt.type !== 'out') return false;
    const reason = vt.reason || '';
    
    // - شراء الذهب والفضة (buying gold / silver)
    if (
      reason.includes('شراء معدن') || 
      reason.includes('شراء ذهب') || 
      reason.includes('شراء فضة') || 
      reason.includes('شراء الذهب') || 
      reason.includes('شراء الفضة') ||
      reason.includes('تغذية الذهب') ||
      reason.includes('تغذية الفضة')
    ) {
      return false;
    }
    
    // - شراء العملات (buying currencies)
    if (
      reason.includes('شراء عملة') || 
      reason.includes('شراء سعودي') || 
      reason.includes('شراء دولار') || 
      reason.includes('تحويل عملة') ||
      reason.includes('صرف عملات')
    ) {
      return false;
    }
    
    // - بيع/شراء الأصول (selling/buying assets)
    if (
      reason.includes('شراء أصل') || 
      reason.includes('أصول') || 
      reason.includes('أصول عينية') || 
      reason.includes('أصل عيني')
    ) {
      return false;
    }
    
    // - تسديد الديون (debt settlements/repayments)
    if (
      reason.includes('تسديد دين') || 
      reason.includes('سداد دين') || 
      reason.includes('تسديد الديون') || 
      reason.includes('سداد الديون') || 
      reason.includes('وفاء دين') ||
      reason.includes('لصاحب الحق')
    ) {
      return false;
    }
    
    // - سحب الخزنة لتغطية الالتزامات (commitment covering)
    if (
      reason.includes('تغطية عجز') || 
      reason.includes('عجز التزام') || 
      reason.includes('التزامات') || 
      reason.includes('سداد التزام') ||
      reason.includes('صرف التزام')
    ) {
      return false;
    }
    
    return true;
  });

  const operatingActualExpenses = operatingExpensesList.reduce((sum, vt) => sum + vt.amount, 0);
  const operationalNetProfit = operatingActualIncome - operatingActualExpenses;

  // ==========================================
  // 2. Vault Balances (رصيد الخزنة الحالية)
  // ==========================================
  const openingYemeni = settings.openingBalanceYemeni || 0;
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

  const realBalanceYER = openingYemeni + cumulativeInflows - cumulativeOutflows;
  const realBalanceSAR = settings.openingBalanceSaudi || 0;
  const realBalanceUSD = settings.openingBalanceUsd || 0;

  // Gold weights by purity in live metalTransactions database
  const goldWeightsByPurity = metalTransactions
    .filter(t => t.metalType === 'gold')
    .reduce((acc, t) => {
      const p = t.purity.trim();
      if (!acc[p]) acc[p] = 0;
      if (t.type === 'buy') acc[p] += t.weight;
      else if (t.type === 'sell') acc[p] -= t.weight;
      return acc;
    }, {} as Record<string, number>);

  // Silver weights by purity
  const silverWeightsByPurity = metalTransactions
    .filter(t => t.metalType === 'silver')
    .reduce((acc, t) => {
      const p = t.purity.trim();
      if (!acc[p]) acc[p] = 0;
      if (t.type === 'buy') acc[p] += t.weight;
      else if (t.type === 'sell') acc[p] -= t.weight;
      return acc;
    }, {} as Record<string, number>);

  // ==========================================
  // 4. Debts Report Formulas
  // ==========================================
  // أ) الدين لي: Transactions where paymentMethod === 'credit'
  const debtsToMe = transactions.filter(t => t.paymentMethod === 'credit');

  const getDebtStatus = (received: number, total: number) => {
    if (received >= total) return { label: 'تم السداد', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (received > 0) return { label: 'متبقي', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'مفتوح', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  };

  // ب) الدين علي: Trusts where isDebtAlayya is true
  const debtsOnUs = trusts.filter(t => t.isDebtAlayya === true);

  // ==========================================
  // 5. Assets Report Formulas (Metal Assets Analysis)
  // ==========================================
  // Calculates average purchase cost and realized sales profit upon actual sale
  const uniqueCalibers = Array.from(new Set([
    ...metalTransactions.map(t => `${t.metalType}-${t.purity.trim()}`)
  ]));

  const caliberStatsList = uniqueCalibers.map(key => {
    const [metalType, purity] = key.split('-');
    const filtered = metalTransactions.filter(t => t.metalType === metalType && t.purity.trim() === purity);
    
    // Purchases
    const buys = filtered.filter(t => t.type === 'buy');
    const totalBuyWeight = buys.reduce((sum, t) => sum + t.weight, 0);
    const totalBuyCost = buys.reduce((sum, t) => sum + t.totalAmount, 0);
    const averageBuyPrice = totalBuyWeight > 0 ? totalBuyCost / totalBuyWeight : 0;

    // Sales
    const sells = filtered.filter(t => t.type === 'sell');
    const totalSellWeight = sells.reduce((sum, t) => sum + t.weight, 0);
    const totalSellValue = sells.reduce((sum, t) => sum + t.totalAmount, 0);
    const averageSellPrice = totalSellWeight > 0 ? totalSellValue / totalSellWeight : 0;

    const currentInventoryWeight = Math.max(0, totalBuyWeight - totalSellWeight);
    
    // Realized Profit only upon actual sale: Weight Sold * (Sale price - Cost price)
    const realizedGain = totalSellWeight * (averageSellPrice - averageBuyPrice);

    return {
      metalType,
      purity,
      totalBuyWeight,
      totalBuyCost,
      averageBuyPrice,
      totalSellWeight,
      totalSellValue,
      averageSellPrice,
      currentInventoryWeight,
      realizedGain
    };
  }).filter(stat => stat.totalBuyWeight > 0 || stat.totalSellWeight > 0);

  const totalAssetsRealizedProfit = caliberStatsList.reduce((sum, c) => sum + c.realizedGain, 0);

  // ==========================================
  // 6. Archived & Closed Daily Reports
  // ==========================================
  // Find all unique closure dates in vault history
  const closedDailyDates = Array.from(new Set(
    vaultTransactions
      .filter(vt => vt.reason === 'ترحيل صافي اليوم' || vt.reason.startsWith('إغلاق اليوم المالي'))
      .map(vt => vt.date)
  )).sort().reverse();

  const [selectedArchiveDate, setSelectedArchiveDate] = useState<string>(closedDailyDates[0] || '');

  // Calculate closure details for a selected archived day
  const getArchiveDaySummary = (chosenDate: string) => {
    if (!chosenDate) return null;

    // Daily income transactions on that date
    const dayJobs = transactions.filter(t => t.date === chosenDate);
    const operatingReceived = dayJobs.reduce((sum, t) => sum + (t.receivedAmount ?? 0), 0);

    // Vault outcomes logged on that day with source === 'collected' | 'both'
    const dayOutflows = vaultTransactions
      .filter(vt => vt.date === chosenDate && vt.type === 'out')
      .reduce((sum, vt) => {
        if (vt.source === 'collected') return sum + vt.amount;
        if (vt.source === 'both') return sum + (vt.collectedAmount ?? Math.round(vt.amount / 2));
        return sum;
      }, 0);

    // Initial free cash on that day (الصندوق وحركة اليوم الصافي)
    const dailyFreeCash = Math.max(0, operatingReceived - dayOutflows);

    // Commitments payments / withdrawals logged specifically on this day
    const drawnFromVault = vaultTransactions
      .filter(vt => vt.date === chosenDate && vt.type === 'out' && vt.reason.startsWith('تغطية عجز التزام من الخزنة'))
      .reduce((sum, vt) => sum + vt.amount, 0);

    // Net transferred surplus to vault on that day (ترحيل صافي اليوم)
    const transferredSurplus = vaultTransactions
      .filter(vt => vt.date === chosenDate && vt.reason === 'ترحيل صافي اليوم')
      .reduce((sum, vt) => sum + vt.amount, 0);

    // Check if the day ended with empty transfer
    const endedEmpty = vaultTransactions.some(vt => vt.date === chosenDate && vt.reason.startsWith('إغلاق اليوم المالي (لم يتبقَ ترحيل إيجابي'));

    return {
      chosenDate,
      operatingReceived,
      dayOutflows,
      dailyFreeCash,
      drawnFromVault,
      transferredSurplus,
      endedEmpty
    };
  };

  const selectedArchiveInfo = getArchiveDaySummary(selectedArchiveDate);

  // ==========================================
  // Leaderboards for Display (Profits Tab)
  // ==========================================
  // Shops Leaderboard based strictly on TOTAL RECEIVED/COLLECTED MONEY
  const shopLeaderboard = shops.map(shop => {
    const shopTxSet = transactions.filter(t => t.shopId === shop.id);
    const accumulatedCollected = shopTxSet.reduce((sum, t) => sum + (t.receivedAmount ?? 0), 0);
    const accumulatedDebt = shopTxSet.reduce((sum, t) => {
      if (t.paymentMethod === 'credit') {
        return sum + (t.amount - (t.receivedAmount ?? 0));
      }
      return sum;
    }, 0);
    
    return {
      ...shop,
      totalCollected: accumulatedCollected,
      totalDebts: accumulatedDebt,
      count: shopTxSet.length
    };
  }).sort((a, b) => b.totalCollected - a.totalCollected);

  // Workers Leaderboard based on job volume amount
  const workerVolumeMap: { [name: string]: { totalAmount: number; count: number; shopName: string } } = {};
  transactions.forEach(tx => {
    if (tx.type === 'shop' && tx.workerName) {
      const key = `${tx.workerName} (${tx.shopName})`;
      if (!workerVolumeMap[key]) {
        workerVolumeMap[key] = { totalAmount: 0, count: 0, shopName: tx.shopName || '' };
      }
      workerVolumeMap[key].totalAmount += tx.amount;
      workerVolumeMap[key].count += 1;
    }
  });

  const workerLeaderboard = Object.entries(workerVolumeMap)
    .map(([name, data]) => ({
      name,
      ...data
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800" dir="rtl">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={22} className="text-indigo-600" />
            <span>نظام الذكاء الحسابي والتقارير الموثقة</span>
          </h3>
          <p className="text-xs text-slate-500">الجرد المالي المتكامل للدفتر؛ أرباح التشغيل الحرة، عهد الخزائن المستقلة، الالتزامات والأصول العينية.</p>
        </div>

        {/* Analytical period filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          {(['all', 'today', 'week', 'month', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition duration-200 ${
                period === p 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {p === 'all' ? 'الكل' : p === 'today' ? 'اليوم' : p === 'week' ? 'الأسبوع' : p === 'month' ? 'الشهر' : 'السنة'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Report Categories Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('profits')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition duration-200 gap-1.5 ${
            activeTab === 'profits' 
              ? 'bg-white border-indigo-200 text-indigo-700 shadow-sm ring-2 ring-indigo-500/10 font-bold' 
              : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Zap size={16} className={activeTab === 'profits' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-xs">الأرباح التشغيلية</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition duration-200 gap-1.5 ${
            activeTab === 'vault' 
              ? 'bg-white border-amber-200 text-amber-700 shadow-sm ring-2 ring-amber-500/10 font-bold' 
              : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Coins size={16} className={activeTab === 'vault' ? 'text-amber-500' : 'text-slate-400'} />
          <span className="text-xs">تقرير عهد الخزنة</span>
        </button>

        <button
          onClick={() => setActiveTab('commitments')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition duration-200 gap-1.5 ${
            activeTab === 'commitments' 
              ? 'bg-white border-rose-200 text-rose-700 shadow-sm ring-2 ring-rose-500/10 font-bold' 
              : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Layers size={16} className={activeTab === 'commitments' ? 'text-rose-500' : 'text-slate-400'} />
          <span className="text-xs">الالتزامات والاحتياطي</span>
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition duration-200 gap-1.5 ${
            activeTab === 'debts' 
              ? 'bg-white border-blue-200 text-blue-700 shadow-sm ring-2 ring-blue-500/10 font-bold' 
              : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <BookOpen size={16} className={activeTab === 'debts' ? 'text-blue-500' : 'text-slate-400'} />
          <span className="text-xs">الذمم والديون</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition duration-200 gap-1.5 ${
            activeTab === 'assets' 
              ? 'bg-white border-teal-200 text-teal-700 shadow-sm ring-2 ring-teal-500/10 font-bold' 
              : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Scale size={16} className={activeTab === 'assets' ? 'text-teal-500' : 'text-slate-400'} />
          <span className="text-xs">حركة وجرد الأصول</span>
        </button>

        <button
          onClick={() => setActiveTab('daily_archive')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition duration-200 gap-1.5 ${
            activeTab === 'daily_archive' 
              ? 'bg-white border-emerald-200 text-emerald-700 shadow-sm ring-2 ring-emerald-500/10 font-bold' 
              : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <FolderClosed size={16} className={activeTab === 'daily_archive' ? 'text-emerald-500' : 'text-slate-400'} />
          <span className="text-xs">التقرير اليومي والأرشيف</span>
        </button>
      </div>

      {/* Main Tab Viewboard */}
      <div className="space-y-6">
        
        {/* ==================== TAB 1: OPERATIONAL PROFITS ==================== */}
        {activeTab === 'profits' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                  <Zap size={18} className="text-indigo-600 animate-pulse" />
                  <span>محرك الأرباح التشغيلية الفعلية للعمل</span>
                </h4>
                <p className="text-xs text-slate-450 text-slate-500 mt-1">
                  تُحسب الأرباح التشغيلية بدقة متناهية من: (إجمالي المقبوض النقدي الفعلي لأتعاب الصياغة - مصروفات الخزنة النثرية والتشغيلية المعتمدة). ويتم تلقائياً تصفية واستبعاد مبالغ الديون، وتحويلات وشراء المعادن أو عجز الالتزامات.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-[10px] text-slate-500 font-extrabold block">دخل المقبوضات الفعلي (العمل)</p>
                  <div className="text-xl font-bold font-mono text-emerald-600">
                    {formatMoneyYemeni(operatingActualIncome)}
                  </div>
                  <span className="text-[9px] text-slate-400">إيرادات شغل المناديب والمحلات والدخل الجانبي النقدي</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-[10px] text-slate-500 font-extrabold block">المصروفات التشغيلية المعتمدة</p>
                  <div className="text-xl font-bold font-mono text-rose-600">
                    {formatMoneyYemeni(operatingActualExpenses)}
                  </div>
                  <span className="text-[9px] text-slate-400">مجمل النثريات الفعلية للمطحنة والسبك (مستبعد منها المعادن والديون)</span>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-1 ring-1 ring-indigo-500/10">
                  <p className="text-[10px] text-indigo-700 font-extrabold block">صافي الربح التشغيلي المحقق</p>
                  <div className="text-xl font-black font-mono text-indigo-800">
                    {formatMoneyYemeni(operationalNetProfit)}
                  </div>
                  <span className="text-[9px] text-indigo-600">القيمة والربح التشغيلي الخالص للنشاط خلال المدة المحددة</span>
                </div>
              </div>

              {/* Sub-section: Operating Expenses List */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-bold text-slate-700">قائمة تفاصيل النفقات التشغيلية التي تم إدراجها:</h5>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3">بند النفقة</th>
                        <th className="p-3">التاريخ والوقت</th>
                        <th className="p-3">المستفيد أو السبب</th>
                        <th className="p-3 text-left">القيمة المخصومة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {operatingExpensesList.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-bold text-slate-800">مصروف تشغيلي</td>
                          <td className="p-3 font-mono opacity-80">{item.date} {item.time}</td>
                          <td className="p-3 text-slate-600">{item.reason}</td>
                          <td className="p-3 font-mono font-bold text-rose-600 text-left">{formatMoneyYemeni(item.amount)}</td>
                        </tr>
                      ))}
                      {operatingExpensesList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">لا توجد أي مصروفات تشغيلية مطابقة في هذه الفترة.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Leaderboards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3 space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Award size={18} className="text-amber-500" />
                    <span>ترتيب المحلات الأكثر فعالية (حسب المبالغ المستلمة نقداً)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500">تم ترتيب شركائكم من المحلات تنازلياً حسب مقدار الكاش المالي والتحصيل المستلم الفعلي.</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-100 font-bold">
                      <tr>
                        <th className="p-3 text-center">المركز</th>
                        <th className="p-3">اسم المحل</th>
                        <th className="p-3">المقبوض الفعلي المالي</th>
                        <th className="p-3 text-left">الآجل المستحق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shopLeaderboard.map((shop, idx) => (
                        <tr key={shop.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold text-slate-900">{shop.name}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">{formatMoneyYemeni(shop.totalCollected)}</td>
                          <td className="p-3 font-mono text-left font-bold text-rose-500">{formatMoneyYemeni(shop.totalDebts)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3 space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Users size={18} className="text-indigo-500" />
                    <span>ترتيب مناديب وفنيي المحلات (حسب حجم العمل)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500">ترتيب العمال والفنيين تنازلياً حسب إجمالي القيمة الإيجازية المطلقة للمهام المستلمة.</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-100 font-bold">
                      <tr>
                        <th className="p-3 text-center">الترتيب</th>
                        <th className="p-3">اسم الفني</th>
                        <th className="p-3">حجم العمل الإجمالي</th>
                        <th className="p-3 text-left">المهام</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workerLeaderboard.map((worker, idx) => (
                        <tr key={worker.name} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 text-center font-mono text-slate-400">#{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{worker.name}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{formatMoneyYemeni(worker.totalAmount)}</td>
                          <td className="p-3 text-left font-mono text-slate-500">{worker.count} مهام</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: VAULT BALANCES ==================== */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                  <Coins size={18} className="text-amber-500" />
                  <span>عهد وأرصدة الخزنة من الأيام السابقة (أرصدة حقيقية منفصلة)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  التقرير الحقيقي لأرصدة النقدية والمعادن الممنوحة في الخزان، معروضة بشكل منفرد بكل عيار وحجم، دون اللجوء لأي معادل تقريبي موحد حماية لخصوصية وحقيقة الأصول.
                </p>
              </div>

              {/* Grid of separate real currency accounts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* YER */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">الريال اليمني - YER</span>
                    <Banknote size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block pb-1">الرصيد الفعلي بالخزنة:</span>
                    <p className="text-2xl font-black font-mono text-slate-900">{formatMoneyYemeni(realBalanceYER)}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-150 text-[10px] text-slate-450 text-slate-500 grid grid-cols-2 gap-1 font-mono">
                    <div>افتاحي: {formatMoneyYemeni(openingYemeni)}</div>
                    <div>تدفقات (+) : {formatMoneyYemeni(cumulativeInflows)}</div>
                    <div className="col-span-2">مصروفات (-) : {formatMoneyYemeni(cumulativeOutflows)}</div>
                  </div>
                </div>

                {/* SAR */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">الريال السعودي - SAR</span>
                    <Banknote size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block pb-1">الرصيد الفعلي بالخزنة:</span>
                    <p className="text-2xl font-black font-mono text-slate-900">{formatMoneyCustom(realBalanceSAR, 'سعودي')}</p>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-5 leading-normal">
                    رصيد مستقل تماماً يمثل الكاش الفعلي المتوفر بمجموعات العملات السعودية في المحل.
                  </div>
                </div>

                {/* USD */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">الدولار الأمريكي - USD</span>
                    <Banknote size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block pb-1">الرصيد الفعلي بالخزنة:</span>
                    <p className="text-2xl font-black font-mono text-slate-900">{formatMoneyCustom(realBalanceUSD, '$')}</p>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-5 leading-normal">
                    السيولة المتوفرة بالدولار المستلمة والـمرحلة بشكل منفصل.
                  </div>
                </div>
              </div>

              {/* Physical Metal Balances Grouped */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Gold weights */}
                <div className="bg-amber-50/10 border border-amber-200 rounded-2xl p-5 space-y-3">
                  <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 border-b border-amber-200 pb-2">
                    <Scale size={14} className="text-amber-500" />
                    <span>مذكرة مستودع الذهب الفعلي بالأوزان والعيار:</span>
                  </h5>
                  <div className="space-y-2">
                    {Object.keys(goldWeightsByPurity).map(purity => {
                      const weight = goldWeightsByPurity[purity];
                      return (
                        <div key={purity} className="flex justify-between items-center bg-white/70 p-3 rounded-lg border border-slate-205">
                          <span className="text-xs font-bold text-slate-700">ذهب عيار {purity}</span>
                          <span className="text-xs font-mono font-black text-slate-950">{formatWeight(weight)}</span>
                        </div>
                      );
                    })}
                    {Object.keys(goldWeightsByPurity).length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">لا يوجد رصيد ذهب كسر متاح بالخزنة حالياً.</div>
                    )}
                  </div>
                </div>

                {/* Silver weights */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h5 className="text-xs font-bold text-slate-600 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Scale size={14} className="text-slate-400" />
                    <span>مذكرة مستودع الفضة الفعلي بالأوزان والعيار:</span>
                  </h5>
                  <div className="space-y-2">
                    {Object.keys(silverWeightsByPurity).map(purity => {
                      const weight = silverWeightsByPurity[purity];
                      return (
                        <div key={purity} className="flex justify-between items-center bg-white/70 p-3 rounded-lg border border-slate-205">
                          <span className="text-xs font-bold text-slate-700">فضة عيار {purity}</span>
                          <span className="text-xs font-mono font-black text-slate-950">{formatWeight(weight)}</span>
                        </div>
                      );
                    })}
                    {Object.keys(silverWeightsByPurity).length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">لا يوجد رصيد فضة كسر متاح بالخزنة حالياً.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: COMMITMENTS ==================== */}
        {activeTab === 'commitments' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers size={18} className="text-rose-500" />
                  <span>بيان وتصفية عهد الالتزامات المحجوزة</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  شرح تفصيلي للمبالغ التي تم حجزها يومياً للوفاء بالتزامات المطحنة (الإيجارات، رواتب الموظفين، المحروقات والخدمات الجانبية).
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">الالتزام والمصرف بالير</th>
                      <th className="p-3">معدل المستحق اليومي</th>
                      <th className="p-3">المبلغ المطلوب تراكمياً</th>
                      <th className="p-3">المحجوز الفعلي بالخزنة</th>
                      <th className="p-3">ما تم سداده وصرفه فعلاً</th>
                      <th className="p-3">العجز/النقص المتراكم للالتزام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commitments.map(c => {
                      const totalTargetAccrued = (c.accumulatedBalance || 0) + (c.accumulatedDeficit || 0);
                      const totalPaid = vaultTransactions
                        .filter(vt => vt.type === 'out' && vt.reason.startsWith(`صرف التزام: ${c.name}`))
                        .reduce((sum, vt) => sum + vt.amount, 0);

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-bold text-slate-800">{c.name}</td>
                          <td className="p-3 font-mono text-slate-500">{formatMoneyYemeni(c.dailyRate)} / يوم</td>
                          <td className="p-3 font-mono font-semibold">{formatMoneyYemeni(totalTargetAccrued)}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">{formatMoneyYemeni(c.accumulatedBalance ?? 0)}</td>
                          <td className="p-3 font-mono text-slate-700">{formatMoneyYemeni(totalPaid)}</td>
                          <td className="p-3 font-mono text-left">
                            {(c.accumulatedDeficit || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                <AlertCircle size={10} />
                                {formatMoneyYemeni(c.accumulatedDeficit || 0)}
                              </span>
                            ) : (
                              <span className="text-slate-400">لا يوجد عجز</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {commitments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                          لا توجد التزامات جارية حالياً على النظام.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: DEBTS ==================== */}
        {activeTab === 'debts' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                  <BookOpen size={18} className="text-blue-500" />
                  <span>دفاتر الديون والذمم المشتركة (دين لي / دين علي)</span>
                </h4>
                <p className="text-xs text-slate-400 text-slate-500 mt-1">
                  دفتر الذمم المستقل بمتابعة مديونيات الشركة والديون العالقة المستحقة لدى المحلات (دين لي)، والذمم المعلقة المطلوبة للجهة الأخرى (دين علي)، مع فرز دقيق لحالات الإغلاق.
                </p>
              </div>

              {/* قسم الديون لي */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>أولاً: الديون لنا (الدين لي) - المستحقات والأصول العالقة عند الآخرين:</span>
                </h5>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3">اسم المدين أو الجهة</th>
                        <th className="p-3">البيان وسبب الدين</th>
                        <th className="p-3">تاريخ القيد</th>
                        <th className="p-3">العملة العينية</th>
                        <th className="p-3">المبلغ الإجمالي</th>
                        <th className="p-3">التحصيل المسدد</th>
                        <th className="p-3">المتبقي المطلوب</th>
                        <th className="p-3 text-center">حالة السداد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {debtsToMe.map(tx => {
                        const status = getDebtStatus(tx.receivedAmount ?? 0, tx.amount);
                        const displayCurrency = tx.currency || 'YER';
                        const isMetal = displayCurrency === 'gold' || displayCurrency === 'silver';
                        const metric = isMetal ? 'جرام' : displayCurrency;

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-bold text-slate-905 text-slate-900">
                              {tx.shopName ? `محل ${tx.shopName}` : (tx.workerName || 'زبون خارجي')}
                            </td>
                            <td className="p-3 text-slate-650 text-slate-600">{tx.description}</td>
                            <td className="p-3 font-mono opacity-80">{tx.date}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isMetal ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {isMetal ? `${displayCurrency === 'gold' ? 'ذهب' : 'فضة'} (عيار ${tx.caliber || ''})` : displayCurrency}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold">
                              {isMetal ? formatWeight(tx.weight ?? tx.amount) : formatMoneyCustom(tx.amount, displayCurrency)}
                            </td>
                            <td className="p-3 font-mono text-emerald-600">
                              {isMetal ? formatWeight(tx.receivedAmount ?? 0) : formatMoneyCustom(tx.receivedAmount ?? 0, displayCurrency)}
                            </td>
                            <td className="p-3 font-mono text-rose-500 font-bold">
                              {isMetal 
                                ? formatWeight(Math.max(0, (tx.weight ?? tx.amount) - (tx.receivedAmount ?? 0))) 
                                : formatMoneyCustom(Math.max(0, tx.amount - (tx.receivedAmount ?? 0)), displayCurrency)}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {debtsToMe.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">لا توجد ديون مستحقة لنا حالياً.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* قسم الديون علينا */}
              <div className="space-y-3 pt-4">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>ثانياً: الديون علينا (الدين علي) - المطلوبات والذمم للآخرين:</span>
                </h5>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3">صاحب الدين (الدائن)</th>
                        <th className="p-3">البيان والتفاصيل</th>
                        <th className="p-3">تاريخ القيد</th>
                        <th className="p-3">العملة أو الأصل</th>
                        <th className="p-3">القيمة والكمية</th>
                        <th className="p-3 text-center">حالة السداد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {debtsOnUs.map(t => {
                        const isMetal = t.currency === 'gold' || t.currency === 'silver';
                        const isAsset = t.currency === 'asset';
                        const displayCurrency = t.currency || 'YER';

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-semibold text-slate-900">{t.party}</td>
                            <td className="p-3 text-slate-600">{t.description}</td>
                            <td className="p-3 font-mono opacity-80">{t.date}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                {isMetal ? `${displayCurrency === 'gold' ? 'ذهب' : 'فضة'} (عيار ${t.caliber || ''})` : isAsset ? `أصل عيني: ${t.assetName || ''}` : displayCurrency}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold">
                              {isMetal 
                                ? formatWeight(t.weight ?? t.amount) 
                                : isAsset 
                                  ? t.assetName 
                                  : formatMoneyCustom(t.amount, displayCurrency)}
                            </td>
                            <td className="p-3 text-center">
                              {t.status === 'delivered' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-250 font-bold">تم السداد</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 border border-rose-250 font-bold animate-pulse">مفتوح</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {debtsOnUs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">لا توجد أي ذمم أو ديون علينا للغير مسجلة.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: MATERIAL ASSETS ==================== */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                  <Scale size={18} className="text-teal-500" />
                  <span>تقرير جرد وجدوى الأصول العينية (الذهب والكسر والمخزون)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  يقوم هذا التقرير بحساب المشتريات والمبيعات للأصول، وتتبع "المتوسط المرجح للتكلفة". وامتثالأ لتعاليمكم، لا يتم إحصاء تغيرات الأسعار كأرباح أو خسائر غير محققة، ويقتصر إثبات الأرباح حصرياً عند لحظة البيع الفعلي.
                </p>
              </div>

              {/* Assets Profit metrics and values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 space-y-1">
                  <p className="text-[10px] text-teal-700 font-extrabold uppercase">الأرباح الفعلية المحققة من بيع الأصول</p>
                  <p className="text-2xl font-black font-mono text-teal-800">
                    {formatMoneyYemeni(totalAssetsRealizedProfit)}
                  </p>
                  <span className="text-[9px] text-teal-600">ناتج الفرق المباشر بين سعر مبيعات الذهب والكسر الفعلي وتكلفة شرائها المتوسطة</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-205 space-y-1 text-slate-600">
                  <p className="text-[10px] text-slate-500 font-extrabold pb-0.5">تذكير سياسة الجرد المحافظة</p>
                  <span className="text-[10px] leading-relaxed block text-slate-450 text-slate-500">
                    ⚠️ الأسعار الحالية للأوزان الباقية في الخزنة تعامل كأصول مستودعية بتكلفتها التاريخية الافتتاحية ولا تدرج في قائمة الأرباح التشغيلية اليومية حتى يتم تصفيتها وبيعها نقداً.
                  </span>
                </div>
              </div>

              {/* Grouped assets table with average purchase and current balance weight */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700">جدول الأصول ومخزون الكسر والعيارات المتاحة بالمتوسط المرجح:</h5>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3">صنف الأصل والقوة العيارية</th>
                        <th className="p-3">إجمالي وزن الشراء والمداد</th>
                        <th className="p-3">متوسط التكلفة للجرام (شراء)</th>
                        <th className="p-3">إجمالي وزن المبيع المنصرف</th>
                        <th className="p-3">متوسط سعر الجرام عند البيع</th>
                        <th className="p-3">الرصيد الفعلي الحالي بالجرام</th>
                        <th className="p-3 text-left">الربح الفعلي المحقق بالبيع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {caliberStatsList.map(stat => (
                        <tr key={`${stat.metalType}-${stat.purity}`} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-bold text-slate-900">
                            {stat.metalType === 'gold' ? '🟡 ذهب' : '⚪ فضة'} عيار {stat.purity}
                          </td>
                          <td className="p-3 font-mono">{formatWeight(stat.totalBuyWeight)}</td>
                          <td className="p-3 font-mono text-slate-504 text-slate-500">{formatMoneyYemeni(stat.averageBuyPrice)}</td>
                          <td className="p-3 font-mono">{formatWeight(stat.totalSellWeight)}</td>
                          <td className="p-3 font-mono text-slate-504 text-slate-500">{formatMoneyYemeni(stat.averageSellPrice)}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">{formatWeight(stat.currentInventoryWeight)}</td>
                          <td className="p-3 font-mono font-bold text-teal-600 text-left">
                            {stat.realizedGain > 0 ? `+${formatMoneyYemeni(stat.realizedGain)}` : stat.realizedGain < 0 ? formatMoneyYemeni(stat.realizedGain) : '0 ر.ي'}
                          </td>
                        </tr>
                      ))}
                      {caliberStatsList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">لا توجد حركة مشتريات أو مبيعات للأصول العينية حتى الآن.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 6: DAILY CLOSED ARCHIVE ==================== */}
        {activeTab === 'daily_archive' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                    <FolderClosed size={18} className="text-emerald-500" />
                    <span>سجلات الكشف والتقارير اليومية المؤرشفة</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    راجع أي يوم مالي سابق تم إغلاقه وإقفال دفاتره لتتبع التسلسل والالتزامات والمبلغ المرجوع للخزينة.
                  </p>
                </div>

                {/* Dropdown to choose a closed date selection */}
                {closedDailyDates.length > 0 ? (
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-bold text-slate-600">اختر كشف اليوم المغلق:</span>
                    <select
                      value={selectedArchiveDate}
                      onChange={e => setSelectedArchiveDate(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    >
                      {closedDailyDates.map(dateStr => (
                        <option key={dateStr} value={dateStr}>{dateStr}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-xs text-rose-500 font-extrabold">⚠️ عذراً! لم يتم تنفيذ أي عملية إغلاق يومي مالي بعد على النظام.</div>
                )}
              </div>

              {/* Display details of the chosen closed daily report */}
              {selectedArchiveInfo ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">تاريخ مراجعة الإقفال لليوم المالي:</span>
                      <p className="text-lg font-black font-mono text-slate-900">{selectedArchiveInfo.chosenDate}</p>
                    </div>
                    <div>
                      {selectedArchiveInfo.endedEmpty ? (
                        <span className="px-3 py-1 bg-yellow-100 border border-yellow-200 text-yellow-800 text-xs rounded-full font-bold">
                          إقـفال (تغطية عجز الالتزامات بالكامل)
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-100 border border-emerald-250 text-emerald-800 text-xs rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          تم ترحيل صافي الفائض بنجاح
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Flow Steps Checklist describing exactly what occurred during closure */}
                  <div className="space-y-4">
                    <span className="text-xs font-black block border-r-2 border-slate-900 pr-2">تدرج تسلسل تسقيف وإجراءات الإغلاق لليوم:</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* Step 1: Net Daily free cash */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 relative">
                        <span className="absolute top-2 right-2 text-[9px] font-bold text-slate-400">1</span>
                        <span className="text-[9px] text-slate-500 font-bold block">المال الحر اليومي (الصافي)</span>
                        <p className="text-xs font-semibold text-slate-900 pt-1">
                          {formatMoneyYemeni(selectedArchiveInfo.dailyFreeCash)}
                        </p>
                        <p className="text-[8px] text-slate-400 leading-normal pt-1">
                          (مقبوض العمل: {formatMoneyYemeni(selectedArchiveInfo.operatingReceived)} - خرج حركة اليوم: {formatMoneyYemeni(selectedArchiveInfo.dayOutflows)})
                        </p>
                      </div>

                      {/* Step 2: Cover from free cache */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 relative">
                        <span className="absolute top-2 right-2 text-[9px] font-bold text-slate-400">2</span>
                        <span className="text-[9px] text-slate-500 font-bold block">التغطية من المال الحر اليومي</span>
                        <p className="text-xs font-semibold text-slate-900 pt-1">
                          {formatMoneyYemeni(Math.min(selectedArchiveInfo.dailyFreeCash, selectedArchiveInfo.transferredSurplus + selectedArchiveInfo.drawnFromVault))} {/* Approximate cover proportional */}
                        </p>
                        <p className="text-[8px] text-slate-400 leading-normal pt-1 flex items-center gap-0.5">
                          توزيع وحجز فوري لتغذية حسابات الالتزامات الجارية أولاً.
                        </p>
                      </div>

                      {/* Step 3: Draw from vault to cover */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 relative">
                        <span className="absolute top-2 right-2 text-[9px] font-bold text-slate-400">3</span>
                        <span className="text-[9px] text-slate-500 font-bold block">السحب والمدد من الخزنة</span>
                        <p className={`text-xs font-bold pt-1 ${selectedArchiveInfo.drawnFromVault > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {formatMoneyYemeni(selectedArchiveInfo.drawnFromVault)}
                        </p>
                        <p className="text-[8px] text-slate-400 leading-normal pt-1">
                          مبالغ تم سحبها من الخزائن الحرة لتفادي عجز مستحقات الالتزام اليومية.
                        </p>
                      </div>

                      {/* Step 4: Shortage Deficit registered */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 relative">
                        <span className="absolute top-2 right-2 text-[9px] font-bold text-slate-400">4</span>
                        <span className="text-[9px] text-slate-500 font-bold block">النقص المتراكم المسجل</span>
                        <p className="text-xs font-semibold text-indigo-600 pt-1">
                          قيد آلي مع التصفية
                        </p>
                        <p className="text-[8px] text-slate-400 leading-normal pt-1">
                          يسجل أي نفص على حساب تبييت الالتزام كعهد مستحقة متراكمة.
                        </p>
                      </div>

                      {/* Step 5: Remaining transferred to vault */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 relative">
                        <span className="absolute top-2 right-2 text-[9px] font-bold text-slate-400">5</span>
                        <span className="text-[9px] text-amber-800 font-extrabold block">المتبقي المرحل للخزنة</span>
                        <p className="text-xs font-bold text-emerald-600 pt-1">
                          {formatMoneyYemeni(selectedArchiveInfo.transferredSurplus)}
                        </p>
                        <p className="text-[8px] text-slate-400 leading-normal pt-1">
                          صافي فائض اليوم المتبقي بالكامل بعد تسوية كافة التزامات اليوم.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active daily transactions snapshot of that day */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">عرض الكشوفات والعمليات المنفذة في هذا اليوم:</span>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-right text-xs bg-white">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold">
                          <tr>
                            <th className="p-3">وصف الحركة</th>
                            <th className="p-3">اسم المستفيد / المحل</th>
                            <th className="p-3">الوقت والجرية</th>
                            <th className="p-3">المبلغ الإجمالي للعملية</th>
                            <th className="p-3">الـمقبوض المتوفر نقداً</th>
                            <th className="p-3 text-left">شكل الحساب</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {transactions.filter(t => t.date === selectedArchiveInfo.chosenDate).map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-3 font-semibold text-slate-800">{t.description}</td>
                              <td className="p-3 text-slate-600">{t.shopName ? `محل ${t.shopName}` : (t.workerName || 'زبون خارجي')}</td>
                              <td className="p-3 font-mono opacity-80">{t.time}</td>
                              <td className="p-3 font-mono">{formatMoneyYemeni(t.amount)}</td>
                              <td className="p-3 font-mono text-emerald-600 font-bold">{formatMoneyYemeni(t.receivedAmount ?? 0)}</td>
                              <td className="p-3 text-left font-sans text-slate-500">
                                {t.paymentMethod === 'cash' ? '💵 نقدي' : '📝 ذمة آجلة'}
                              </td>
                            </tr>
                          ))}
                          {transactions.filter(t => t.date === selectedArchiveInfo.chosenDate).length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400">لا توجد عمليات مسجلة باليوم المذكور.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400">
                  يرجى تصفح أحد الأيام المغلقة المسجلة لمراجعتها الموثقة مع الأرشيف.
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
