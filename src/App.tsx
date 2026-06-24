import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from './useAppState';
import { getHijriDate } from './utils';

// Import Section Views and Modals
import HomeSection from './components/HomeSection';
import NewJobSection from './components/NewJobSection';
import DailyStatementSection from './components/DailyStatementSection';
import ShopManagementSection from './components/ShopManagementSection';
import DebtsSection from './components/DebtsSection';
import TrustsSection from './components/TrustsSection';
import VaultSection from './components/VaultSection';
import ReportsSection from './components/ReportsSection';
import ArchiveSection from './components/ArchiveSection';
import SettingsModal from './components/SettingsModal';

import { 
  Home, PlusCircle, Calendar, BookOpen, Clock, 
  HelpCircle, Settings, Eye, EyeOff, LayoutGrid, Scale, 
  Coins, Wallet, HeartHandshake, ShieldAlert, FileText, ChevronLeft, ChevronRight 
} from 'lucide-react';

const PAGES = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'new_job', label: 'شغل جديد', icon: PlusCircle },
  { id: 'daily', label: 'الكشف اليومي', icon: Calendar },
  { id: 'shops_ledger', label: 'كشف وإدارة المحلات', icon: BookOpen },
  { id: 'debts', label: 'الديون', icon: Wallet },
  { id: 'trusts', label: 'الأمانات', icon: HeartHandshake },
  { id: 'vault', label: 'الخزنة', icon: Coins },
  { id: 'reports', label: 'التقارير', icon: LayoutGrid },
  { id: 'archives', label: 'الأرشيف', icon: FileText }
];

export default function App() {
  const {
    shops,
    transactions,
    trusts,
    vaultTransactions,
    metalTransactions,
    archives,
    settings,
    camouflage,
    toggleCamouflage,
    addShop,
    editShop,
    addWorker,
    deleteWorker,
    editWorker,
    addTransaction,
    deliverDebt,
    updateDebtStatus,
    addTrust,
    deliverTrust,
    addExternalTrust,
    deliverExternalTrust,
    addVaultOutflow,
    addMetalTransaction,
    archiveShopActiveTransactions,
    closeMarketDay,
    saveSettings,
    isWorkerNameUnique,
    commitments,
    disburseCommitment,
    carryOverCommitment,
    updateCommitmentRate,
    addCommitment,
    resetAllData,
    resetAllExceptDebts
  } = useAppState();

  // Navigation management
  const [activePage, setActivePage] = useState<string>('home');
  const [prevPageIndex, setPrevPageIndex] = useState<number>(0);

  const [showMarketClosingModal, setShowMarketClosingModal] = useState(false);
  const [closeFormInputs, setCloseFormInputs] = useState<{[txId: string]: {
    customerName: string;
    workDetail: string;
    itemDescription: string;
    estimatedValue: number;
    notes: string;
  }}>({});

  // Gather pending unarchived, active external credit transactions
  const pendingExternalClosingTxs = transactions.filter(t => 
    t.type === 'external' && 
    t.paymentMethod === 'credit' && 
    t.receivedAmount < t.amount && 
    !t.isTransferredToTrust
  );

  // Initialize form options whenever the modal opens
  useEffect(() => {
    if (showMarketClosingModal) {
      const initialForm: {[txId: string]: any} = {};
      pendingExternalClosingTxs.forEach(t => {
        initialForm[t.id] = {
          customerName: 'زبون خارجي مستقل',
          workDetail: t.description,
          itemDescription: t.description,
          estimatedValue: t.amount - t.receivedAmount,
          notes: ''
        };
      });
      setCloseFormInputs(initialForm);
    }
  }, [showMarketClosingModal, transactions]);

  // Midnight Auto Closing scheduler
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 2) {
        // If there are pending transactions, trigger modal!
        const pending = transactions.filter(t => 
          t.type === 'external' && 
          t.paymentMethod === 'credit' && 
          t.receivedAmount < t.amount && 
          !t.isTransferredToTrust
        );
        if (pending.length > 0) {
          setShowMarketClosingModal(true);
        }
      }
    };
    const interval = setInterval(checkMidnight, 30000); // Check half minute
    return () => clearInterval(interval);
  }, [transactions]);

  // Swipe gesture navigation listener
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Skip swipe if on horizontal scrollables, inputs, interactive widgets
      if (
        target.closest('input') || 
        target.closest('textarea') || 
        target.closest('select') || 
        target.closest('.overflow-x-auto') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.no-swipe')
      ) {
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Threshold: 80px horizontal swipe, and X diff must be twice the Y diff
      if (Math.abs(diffX) > 80 && Math.abs(diffX) > Math.abs(diffY) * 1.8) {
        const currentIndex = PAGES.findIndex(p => p.id === activePage);
        if (currentIndex === -1) return;

        if (diffX < 0) {
          // Swipe Left -> Go to PREVIOUS page (Index backward)
          if (currentIndex > 0) {
            const prevPageId = PAGES[currentIndex - 1].id;
            setPrevPageIndex(currentIndex);
            setActivePage(prevPageId);
          }
        } else {
          // Swipe Right -> Go to NEXT page (Index forward)
          if (currentIndex < PAGES.length - 1) {
            const nextPageId = PAGES[currentIndex + 1].id;
            setPrevPageIndex(currentIndex);
            setActivePage(nextPageId);
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activePage]);
  
  // High quality vertical positioning of floating button (top value in percentage)
  const [floatingBtnTop, setFloatingBtnTop] = useState<number>(50);

  // Dragging support refs for touch and cursor finger movement
  const isDraggingBtn = useRef(false);
  const dragStartY = useRef(0);
  const dragStartTopPct = useRef(50);
  const dragHasMoved = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingBtn.current = true;
    dragStartY.current = e.clientY;
    dragStartTopPct.current = floatingBtnTop;
    dragHasMoved.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingBtn.current) return;
    const deltaY = e.clientY - dragStartY.current;
    if (Math.abs(deltaY) > 5) {
      dragHasMoved.current = true;
      const windowH = window.innerHeight || 800;
      const pctChange = (deltaY / windowH) * 100;
      const newPct = Math.max(10, Math.min(90, dragStartTopPct.current + pctChange));
      setFloatingBtnTop(newPct);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingBtn.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDraggingBtn.current = false;
  };

  // Settings gear popover
  const [showSettings, setShowSettings] = useState(false);

  // Search horizontal sliding container ref for tabs
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Set page and determine sliding direction
  const handlePageChange = (pageId: string) => {
    const nextIdx = PAGES.findIndex(p => p.id === pageId);
    const currIdx = PAGES.findIndex(p => p.id === activePage);
    setPrevPageIndex(currIdx);
    setActivePage(pageId);

    // Auto-scroll the menu tab into view if clicked
    try {
      const activeTabEl = document.getElementById(`tab-${pageId}`);
      if (activeTabEl && tabsScrollRef.current) {
        tabsScrollRef.current.scrollTo({
          left: activeTabEl.offsetLeft - tabsScrollRef.current.clientWidth / 2,
          behavior: 'smooth'
        });
      }
    } catch (e) {
      // safe fallback
    }
  };

  const activeIndex = PAGES.findIndex(p => p.id === activePage);
  const swipeDirection = activeIndex >= prevPageIndex ? 'right' : 'left';

  const getThemeVars = () => {
    switch (settings.themeColor) {
      case 'black':
        return {
          bg: 'bg-black text-slate-100',
          headerBg: 'bg-zinc-950/95 border-zinc-800',
          cardBg: 'bg-zinc-900 border-zinc-800 text-white',
          primary: '#fbbf24',
          primaryHover: '#f59e0b',
          primaryLight: 'rgba(251, 191, 36, 0.08)',
          primaryBorder: 'rgba(251, 191, 36, 0.2)',
          text: '#fbbf24',
          primaryText: '#000000',
          selectionBg: 'rgba(251, 191, 36, 0.15)',
          gradientFrom: '#fbbf24',
          gradientTo: '#d97706',
          badgeText: '#fef08a',
          badgeBg: '#713f12'
        };
      case 'gray':
        return {
          bg: 'bg-slate-600 text-slate-100',
          headerBg: 'bg-slate-700/95 border-slate-600',
          cardBg: 'bg-slate-800 border-slate-700 text-slate-100',
          primary: '#fbbf24',
          primaryHover: '#f59e0b',
          primaryLight: 'rgba(251, 191, 36, 0.08)',
          primaryBorder: 'rgba(251, 191, 36, 0.2)',
          text: '#fbbf24',
          primaryText: '#0f172a',
          selectionBg: 'rgba(251, 191, 36, 0.15)',
          gradientFrom: '#94a3b8',
          gradientTo: '#475569',
          badgeText: '#fef08a',
          badgeBg: '#1e293b'
        };
      case 'brown':
        return {
          bg: 'bg-[#402e20] text-[#fbf6f0]',
          headerBg: 'bg-[#5c4331]/95 border-[#785842]/40',
          cardBg: 'bg-[#4e3828] border-[#5c4331] text-[#fbf6f0]',
          primary: '#eab308',
          primaryHover: '#ca8a04',
          primaryLight: 'rgba(234, 179, 8, 0.08)',
          primaryBorder: 'rgba(234, 179, 8, 0.2)',
          text: '#eab308',
          primaryText: '#402e20',
          selectionBg: 'rgba(234, 179, 8, 0.15)',
          gradientFrom: '#bf8040',
          gradientTo: '#5c4331',
          badgeText: '#fef08a',
          badgeBg: '#451a03'
        };
      case 'white':
      default:
        return {
          bg: 'bg-[#ffffff] text-slate-800',
          headerBg: 'bg-white/95 border-slate-200/80',
          cardBg: 'bg-white border-slate-200 text-slate-800 shadow-sm',
          primary: '#f59e0b',
          primaryHover: '#d97706',
          primaryLight: 'rgba(245, 158, 11, 0.08)',
          primaryBorder: 'rgba(245, 158, 11, 0.2)',
          text: '#b45309',
          primaryText: '#0f172a',
          selectionBg: 'rgba(245, 158, 11, 0.15)',
          gradientFrom: '#fbbf24',
          gradientTo: '#d97706',
          badgeText: '#78350f',
          badgeBg: '#fef3c7'
        };
    }
  };

  const themeVars = getThemeVars();

  return (
    <div className={`min-h-screen ${themeVars.bg} flex flex-col relative overflow-x-hidden pb-12 font-sans`} dir="rtl" data-theme={settings.themeColor || 'white'}>
      
      {/* 1. Global Master Top Navigation Header */}
      <header className={`sticky top-0 z-40 ${themeVars.headerBg} backdrop-blur-md border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 border-b border-slate-200/40">
            {/* Left side: clean and streamlined local status indicator */}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350 font-bold text-xs select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>جاهز ومتصل</span>
            </div>

            {/* Header Left menu actions (positioned elegantly in RTL layout) */}
            <div className="flex items-center gap-2.5">
              <span 
                className="text-xs sm:text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl select-none"
              >
                دفتري الذكي ✨
              </span>

              {camouflage && (
                <span 
                  className="text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse"
                  style={{
                    backgroundColor: themeVars.badgeBg,
                    color: themeVars.badgeText
                  }}
                >
                  <ShieldAlert size={11} />
                  تمويه
                </span>
              )}
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-1 px-2.5 text-slate-600 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-zinc-700"
                title="افتح إعدادات الموازنة والتاريخ الهجري"
                id="global-header-settings-trigger"
              >
                <Settings size={16} className="text-slate-500" />
                <span className="text-xs font-black">الإعدادات</span>
              </button>
            </div>
          </div>

          {/* 2. Page Switcher Menus */}
          <div className="relative flex items-center">
            {/* Scroll indicators */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 flex items-center pr-1 text-slate-400 sm:hidden">
              <ChevronRight size={14} />
            </div>
            
            <div 
              ref={tabsScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2.5 w-full mx-1 select-none scroll-smooth snap-x"
              id="horizontal-scroll-tabs-bar"
            >
              {PAGES.map((page, index) => {
                const Icon = page.icon;
                const isActive = page.id === activePage;
                return (
                  <button
                    key={page.id}
                    id={`tab-${page.id}`}
                    onClick={() => handlePageChange(page.id)}
                    className="snap-center flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 border cursor-pointer"
                    style={
                      isActive
                        ? {
                            backgroundColor: themeVars.primary,
                            borderColor: themeVars.primary,
                            color: themeVars.primaryText,
                            boxShadow: `0 4px 10px ${themeVars.primaryLight}`,
                            transform: 'scale(1.02)'
                          }
                        : {
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            color: '#475569'
                          }
                    }
                  >
                    <Icon size={14} className={isActive ? 'stroke-[2.5]' : ''} />
                    <span>{page.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10 flex items-center pl-1 text-slate-400 sm:hidden">
              <ChevronLeft size={14} />
            </div>
          </div>
        </div>
      </header>

      {/* 3. Sliding Content Sections Display Deck */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex-1 w-full relative">
        <div 
          className="transition-all duration-300 transform"
          style={{
            animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          key={activePage} // Trigger animation on active page change
        >
          {activePage === 'home' && (
            <HomeSection
              transactions={transactions}
              metalTransactions={metalTransactions}
              vaultTransactions={vaultTransactions}
              addMetalTransaction={addMetalTransaction}
              settings={settings}
              camouflage={camouflage}
              toggleCamouflage={toggleCamouflage}
              onNavigate={handlePageChange}
              onTriggerMarketClosing={() => setShowMarketClosingModal(true)}
              addTransaction={addTransaction}
              addTrust={addTrust}
              addVaultOutflow={addVaultOutflow}
              shops={shops}
            />
          )}

          {activePage === 'new_job' && (
            <NewJobSection
              shops={shops}
              addTransaction={addTransaction}
              settings={settings}
              saveSettings={saveSettings}
            />
          )}

          {activePage === 'daily' && (
            <DailyStatementSection
              transactions={transactions}
              vaultTransactions={vaultTransactions}
              metalTransactions={metalTransactions}
              trusts={trusts}
              shops={shops}
              settings={settings}
              camouflage={camouflage}
              commitments={commitments}
              onTriggerMarketClosing={() => setShowMarketClosingModal(true)}
            />
          )}

          {activePage === 'shops_ledger' && (
            <ShopManagementSection
              shops={shops}
              transactions={transactions}
              addShop={addShop}
              editShop={editShop}
              addWorker={addWorker}
              deleteWorker={deleteWorker}
              editWorker={editWorker}
              archiveShopActiveTransactions={archiveShopActiveTransactions}
              deliverDebt={deliverDebt}
              isWorkerNameUnique={isWorkerNameUnique}
              camouflage={camouflage}
            />
          )}

          {activePage === 'debts' && (
            <DebtsSection
              transactions={transactions}
              shops={shops}
              deliverDebt={deliverDebt}
              updateDebtStatus={updateDebtStatus}
              camouflage={camouflage}
              addTransaction={addTransaction}
            />
          )}

          {activePage === 'trusts' && (
            <TrustsSection
              trusts={trusts}
              addTrust={addTrust}
              deliverTrust={deliverTrust}
              addExternalTrust={addExternalTrust}
              deliverExternalTrust={deliverExternalTrust}
              camouflage={camouflage}
            />
          )}

          {activePage === 'vault' && (
            <VaultSection
              transactions={transactions}
              vaultTransactions={vaultTransactions}
              addVaultOutflow={addVaultOutflow}
              camouflage={camouflage}
              settings={settings}
              metalTransactions={metalTransactions}
              commitments={commitments}
              disburseCommitment={disburseCommitment}
              carryOverCommitment={carryOverCommitment}
              updateCommitmentRate={updateCommitmentRate}
              addCommitment={addCommitment}
              saveSettings={saveSettings}
            />
          )}

          {activePage === 'reports' && (
            <ReportsSection
              transactions={transactions}
              shops={shops}
              metalTransactions={metalTransactions}
              vaultTransactions={vaultTransactions}
              settings={settings}
              camouflage={camouflage}
              commitments={commitments}
              trusts={trusts}
            />
          )}

          {activePage === 'archives' && (
            <ArchiveSection
              archives={archives}
              transactions={transactions}
              camouflage={camouflage}
            />
          )}
        </div>
      </main>

      {/* 5. Settings Modal dialog overlay */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
          onReset={resetAllData}
          onResetExceptDebts={resetAllExceptDebts}
        />
      )}

      {/* Fixed global floating circular button (💍) to trigger a New Job with light-touch scaling feedback */}
      <button
        onClick={() => handlePageChange('new_job')}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center text-3xl shadow-2xl transition duration-150 cursor-pointer hover:scale-110 active:scale-95 text-slate-950 ring-4 ring-amber-500/15"
        title="تسجيل شغل جديد سريع 💍"
        id="global-floating-ring-btn"
      >
        💍
      </button>

      {/* 6. Daily Market Closing Modal */}
      {showMarketClosingModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 text-slate-100 animate-scale-up" dir="rtl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                  <span className="text-xl">🔐</span>
                </div>
                <div>
                  <h4 className="text-md sm:text-lg font-extrabold text-slate-100">إغلاق السوق اليومي والترحيل المباشر</h4>
                  <p className="text-xs text-slate-400">مراجعة وترحيل الحسابات المعلقة للزبائن الخارجيين فقط كأمانات للمتابعة.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMarketClosingModal(false)}
                className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs cursor-pointer"
              >
                تراجع
              </button>
            </div>

            {pendingExternalClosingTxs.length === 0 ? (
              <div className="text-center py-10 space-y-4">
                <div className="text-5xl">🎉</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-emerald-400">ممتاز! لا توجد حركات معلقة للزبائن</h5>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    كافة عمليات الزبائن الخارجيين لليوم مسددة بالكامل أو مستلمة، أو تم ترحيلها مسبقاً. يمكنك تأكيد إغلاق السوق مباشرة للانتهاء.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const res = closeMarketDay();
                    setShowMarketClosingModal(false);
                    alert(`تم إغلاق السوق وحسابات اليوم بنجاح كامل!\n\n📊 تفاصيل الترحيل المالي والدورة المحاسبية:\n` +
                          `• إجمالي الدخل المستلم اليوم: ${res.income.toLocaleString()} ريال\n` +
                          `• مصروفات اليوم المخصومة (من الدخل): ${res.outflows.toLocaleString()} ريال\n` +
                          `• المال الحر اليومي الناتج: ${res.freeMoney.toLocaleString()} ريال\n\n` +
                          `⚙️ تفصيل تغطية الالتزامات اليومية المتراكمة:\n` +
                          `• إجمالي المحجوز للالتزامات اليومية: ${res.reserved.toLocaleString()} ريال\n` +
                          `• مسحوب من الخزنة لتغطية العجز: ${res.drawnFromVault.toLocaleString()} ريال\n` +
                          `• متبقي متأخر مسجل كنقص متراكم للغد: ${res.totalDeficit.toLocaleString()} ريال\n\n` +
                          `📥 الرصيد المرحل النهائي:\n` +
                          `• المتبقي المُرحل للخزنة كسيولة حرة: ${res.netTransferred.toLocaleString()} ريال`);
                  }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-lg"
                >
                  تأكيد إغلاق السوق لليوم
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-500/5 border border-yellow-500/15 p-4 rounded-xl flex items-start gap-2.5">
                  <span className="text-yellow-500 text-lg">💡</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    العمليات المدرجة أدناه هي &quot;شغل مباشر لزبائن خارجيين&quot; لم يتم دفع كامل قيمتها بعد. عند ترحيلها للأمانات، يتم عزلها عن صفحة الديون والتقارير المالية والتحصيل المباشر بالخزنة كذمم عائلية/أكثر خصوصية، وستظهر حصرياً في &quot;أمانات الزبون الخارجي&quot; لتبسيط كشف ذمم المحلات.
                  </p>
                </div>

                <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                  {pendingExternalClosingTxs.map(tx => {
                    const input = closeFormInputs[tx.id] || {
                      customerName: 'زبون خارجي مستقل',
                      workDetail: tx.description,
                      itemDescription: tx.description,
                      estimatedValue: tx.amount - tx.receivedAmount,
                      notes: ''
                    };

                    const updateInput = (field: string, value: any) => {
                      setCloseFormInputs(prev => ({
                        ...prev,
                        [tx.id]: {
                          ...prev[tx.id],
                          [field]: value
                        }
                      }));
                    };

                    return (
                      <div key={tx.id} className="bg-slate-955 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                          <div className="text-xs">
                            <span className="text-rose-400 font-bold">عملية معلقة:</span>{' '}
                            <span className="text-slate-200 font-mono font-bold">{tx.description}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            الحساب الكامل: {tx.amount} | المتبقي الآجل:{' '}
                            <span className="text-yellow-400 font-bold">{tx.amount - tx.receivedAmount} ريال</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold">اسم الزبون الخارجي</label>
                            <input
                              type="text"
                              value={input.customerName || ''}
                              onChange={e => updateInput('customerName', e.target.value)}
                              placeholder="اسم الزبون للمتابعة..."
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-yellow-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold">تفاصيل العمل للزبون</label>
                            <input
                              type="text"
                              value={input.workDetail || ''}
                              onChange={e => updateInput('workDetail', e.target.value)}
                              placeholder="مثال: لحام طقم، صيانة عيار..."
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-yellow-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold">وصف القطعة / الأمانة العهدة</label>
                            <input
                              type="text"
                              value={input.itemDescription || ''}
                              onChange={e => updateInput('itemDescription', e.target.value)}
                              placeholder="مثال: خاتم فضة عيار 925"
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-yellow-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold">القيمة التقديرية (ريال)</label>
                            <input
                              type="number"
                              value={input.estimatedValue || 0}
                              onChange={e => updateInput('estimatedValue', Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-yellow-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold">ملاحظات إيضاحية إضافية</label>
                          <textarea
                            value={input.notes || ''}
                            onChange={e => updateInput('notes', e.target.value)}
                            placeholder="أدخل أي تفاصيل تضمن الحفاظ على الأمانة ومراعاتها..."
                            rows={1}
                            className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-800 justify-end">
                  <button
                    onClick={() => {
                      // Process all the transfers
                      pendingExternalClosingTxs.forEach(tx => {
                        const input = closeFormInputs[tx.id] || {
                          customerName: 'زبون خارجي مستقل',
                          workDetail: tx.description,
                          itemDescription: tx.description,
                          estimatedValue: tx.amount - tx.receivedAmount,
                          notes: ''
                        };

                        addExternalTrust(
                          input.customerName || 'زبون خارجي مستقل',
                          input.workDetail || tx.description,
                          input.itemDescription || tx.description,
                          input.estimatedValue || (tx.amount - tx.receivedAmount),
                          input.notes || '',
                          tx.id
                        );
                      });

                      const res = closeMarketDay();
                      setShowMarketClosingModal(false);
                      alert(`تم إنهاء وإغلاق الحسابات بنجاح!\n` +
                            `• تم ترحيل كافة عمليات الزبائن الخارجيين المعلقة إلى قسم "أمانات الزبون الخارجي" بنجاح وعزلها آلياً عن الديون التجارية.\n\n` +
                            `📊 تفاصيل الترحيل المالي والدورة المحاسبية:\n` +
                            `• إجمالي الدخل المستعلم اليوم: ${res.income.toLocaleString()} ريال\n` +
                            `• مصروفات اليوم المخصومة (من الدخل): ${res.outflows.toLocaleString()} ريال\n` +
                            `• المال الحر اليومي الناتج: ${res.freeMoney.toLocaleString()} ريال\n\n` +
                            `⚙️ تفصيل تغطية الالتزامات اليومية المتراكمة:\n` +
                            `• إجمالي المحجوز للالتزامات اليومية: ${res.reserved.toLocaleString()} ريال\n` +
                            `• مسحوب من الخزنة لتغطية العجز: ${res.drawnFromVault.toLocaleString()} ريال\n` +
                            `• متبقي متأخر مسجل كنقص متراكم للغد: ${res.totalDeficit.toLocaleString()} ريال\n\n` +
                            `📥 الرصيد المرحل النهائي:\n` +
                            `• المتبقي المُرحل للخزنة كسيولة حرة: ${res.netTransferred.toLocaleString()} ريال`);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 font-black text-white px-5 py-3 rounded-xl text-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    🚀 <span>تأكيد الميناء وترحيل {pendingExternalClosingTxs.length} عمليات للأمانات وبدء إغلاق السوق</span>
                  </button>
                  <button
                    onClick={() => setShowMarketClosingModal(false)}
                    className="bg-slate-800 hover:bg-slate-750 font-bold text-slate-300 px-4 py-3 rounded-xl text-xs transition cursor-pointer"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Custom Keyframed sliding animation style tags directly injected to guarantee pure transitions */}
      <style>{`
        :root {
          --theme-primary: ${themeVars.primary};
          --theme-primary-hover: ${themeVars.primaryHover};
          --theme-primary-light: ${themeVars.primaryLight};
          --theme-primary-border: ${themeVars.primaryBorder};
          --theme-text: ${themeVars.text};
          --theme-primary-text: ${themeVars.primaryText};
          --theme-selection-bg: ${themeVars.selectionBg};
          --theme-gradient-from: ${themeVars.gradientFrom};
          --theme-gradient-to: ${themeVars.gradientTo};
        }
        ::selection {
          background-color: var(--theme-selection-bg) !important;
          color: #0f172a !important;
        }
        @keyframes slideIn {
          from {
            transform: translateX(${swipeDirection === 'right' ? '40px' : '-40px'});
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
