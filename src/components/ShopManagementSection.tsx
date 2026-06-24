import React, { useState } from 'react';
import { Shop, Transaction } from '../types';
import { 
  Building2, Users, UserPlus, Trash2, Edit2, Archive, CheckCircle, 
  AlertTriangle, DollarSign, Award, Clock, Phone, MapPin, Plus, Save, X, Share2, CornerDownLeft
} from 'lucide-react';
import { getShareTextForStatement } from '../utils';

interface ShopManagementSectionProps {
  shops: Shop[];
  transactions: Transaction[];
  addShop: (name: string, city?: string, phone?: string, pricePerPoint?: number) => void;
  editShop: (id: string, name: string, city?: string, phone?: string, pricePerPoint?: number) => void;
  addWorker: (shopId: string, workerName: string) => { success: boolean; error?: string };
  deleteWorker: (shopId: string, workerName: string) => void;
  editWorker: (shopId: string, oldName: string, newName: string) => { success: boolean; error?: string };
  archiveShopActiveTransactions: (shopId: string) => void;
  deliverDebt: (transactionId: string, amountReceived: number, date?: string, time?: string) => void;
  isWorkerNameUnique: (workerName: string, ignoreShopId?: string) => boolean;
  camouflage: boolean;
}

export default function ShopManagementSection({
  shops,
  transactions,
  addShop,
  editShop,
  addWorker,
  deleteWorker,
  editWorker,
  archiveShopActiveTransactions,
  deliverDebt,
  isWorkerNameUnique,
  camouflage
}: ShopManagementSectionProps) {
  // Navigation tabs inside Shop page: "كشوفات الحسابات" vs "إدارة وإعدادات المحلات"
  const [internalTab, setInternalTab] = useState<'statements' | 'settings'>('statements');

  // Currently Selected Shop for Account viewing
  const [activeShopId, setActiveShopId] = useState<string>(shops[0]?.id || '');

  // Form states for creating / editing shops
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopCity, setNewShopCity] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopPrice, setNewShopPrice] = useState('500');

  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [editShopName, setEditShopName] = useState('');
  const [editShopCity, setEditShopCity] = useState('');
  const [editShopPhone, setEditShopPhone] = useState('');
  const [editShopPrice, setEditShopPrice] = useState('500');

  // Workers management states
  const [selectedAdminShopId, setSelectedAdminShopId] = useState<string>(shops[0]?.id || '');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [editingWorkerOldName, setEditingWorkerOldName] = useState<string | null>(null);
  const [editingWorkerNewName, setEditingWorkerNewName] = useState('');
  const [workerToDelete, setWorkerToDelete] = useState<{shopId: string, name: string} | null>(null);

  // Expand states
  const [showPrevDebts, setShowPrevDebts] = useState(false);

  // Clearing a previous debt element state
  const [clearingTxId, setClearingTxId] = useState<string | null>(null);
  const [clearingPaymentInput, setClearingPaymentInput] = useState('');

  // Get active shop entity
  const targetShop = shops.find(s => s.id === (internalTab === 'statements' ? activeShopId : selectedAdminShopId));

  // Switcher support
  React.useEffect(() => {
    if (shops.length > 0) {
      if (!activeShopId) setActiveShopId(shops[0].id);
      if (!selectedAdminShopId) setSelectedAdminShopId(shops[0].id);
    }
  }, [shops, activeShopId, selectedAdminShopId]);

  // Calculations for current selected Active Statement (unarchived)
  const activeTx = transactions.filter(t => t.shopId === activeShopId && !t.isArchived);
  const totalActiveAmount = activeTx.reduce((sum, t) => sum + t.amount, 0);
  const totalActiveCollected = activeTx.reduce((sum, t) => sum + t.receivedAmount, 0);
  const totalActiveDebt = activeTx.reduce((sum, t) => {
    if (t.paymentMethod === 'credit') {
      return sum + (t.amount - t.receivedAmount);
    }
    return sum;
  }, 0);

  // Calculated Points Summary
  const totalActivePoints = activeTx.reduce((sum, t) => sum + (t.points || 0), 0);

  // Calculations for Historical Previous Debts (unpaid in archived OR unarchived previous operations)
  // The system rules: "الدين السابق تظهر العمليات السابقة حتى ولو تم أرشفة الكشف... تظهر فقط إذا يوجد دين سابق"
  // Previous debts means credit tx where remaining amount > 0.
  const previousDebtsList = transactions.filter(t => 
    t.shopId === activeShopId && 
    t.paymentMethod === 'credit' && 
    t.receivedAmount < t.amount
  );
  const totalPreviousDebtsVal = previousDebtsList.reduce((sum, t) => sum + (t.amount - t.receivedAmount), 0);

  // Shop Creation
  const handleAddNewShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;

    addShop(
      newShopName.trim(),
      newShopCity.trim(),
      newShopPhone.trim(),
      Number(newShopPrice) || 500
    );

    setIsAddingShop(false);
    setNewShopName('');
    setNewShopCity('');
    setNewShopPhone('');
    setNewShopPrice('500');
    alert('تم إضافة المحل الجديد وبطاقة الأسعار بنجاح!');
  };

  // Shop Editing
  const handleEditShopClick = (shop: Shop) => {
    setEditingShopId(shop.id);
    setEditShopName(shop.name);
    setEditShopCity(shop.city || '');
    setEditShopPhone(shop.phone || '');
    setEditShopPrice(shop.pricePerPoint.toString());
  };

  const handleSaveShopEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShopId || !editShopName.trim()) return;

    editShop(
      editingShopId,
      editShopName.trim(),
      editShopCity.trim(),
      editShopPhone.trim(),
      Number(editShopPrice) || 500
    );

    setEditingShopId(null);
    alert('تم تعديل بيانات المحل وسعر النقاط التاريخية بنجاح!');
  };

  // Workers adding
  const handleAddWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminShopId) {
      alert('الرجاء تحديد محل لإضافة العامل تحته!');
      return;
    }
    if (!newWorkerName.trim()) return;

    const res = addWorker(selectedAdminShopId, newWorkerName.trim());
    if (res.success) {
      setNewWorkerName('');
      alert('تم إضافة العامل وتأكيد تفرده بالنظام بنجاح!');
    } else {
      alert(`خطأ: ${res.error}`);
    }
  };

  // Workers editing
  const handleStartWorkerEdit = (worker: string) => {
    setEditingWorkerOldName(worker);
    setEditingWorkerNewName(worker);
  };

  const handleSaveWorkerEdit = (shopId: string) => {
    if (!editingWorkerOldName || !editingWorkerNewName.trim()) return;

    const res = editWorker(shopId, editingWorkerOldName, editingWorkerNewName.trim());
    if (res.success) {
      setEditingWorkerOldName(null);
      alert('تم تحديث اسم العامل وتعديله في السجلات التاريخية بنجاح!');
    } else {
      alert(`خطأ: ${res.error}`);
    }
  };

  // Close Statement and Archive it
  const handleArchiveStatement = () => {
    if (activeTx.length === 0) {
      alert('لا توجد عمليات جارية معلقة لإقفالها حالياً!');
      return;
    }

    const conf = window.confirm(`هل أنت متأكد من ترحيل وإقفال كشف حساب محل "${targetShop?.name}" وأرشنة العمليات الجارية بالكامل؟`);
    if (!conf) return;

    archiveShopActiveTransactions(activeShopId);
    alert('تم إقفال الكشف وأرشفته بنجاح، وتصفير شاشة العمليات الجارية بالمحل!');
  };

  // Clearing previous debt inline
  const handleClearDebtInline = (txId: string) => {
    const amt = Number(clearingPaymentInput);
    const targetTx = transactions.find(t => t.id === txId);
    if (!targetTx) return;

    const maxAmt = targetTx.amount - targetTx.receivedAmount;
    if (isNaN(amt) || amt <= 0 || amt > maxAmt) {
      alert(`الرجاء إدخال مبلغ دفع صحيح (بين 1 و ${maxAmt} ريال)!`);
      return;
    }

    deliverDebt(txId, amt);
    setClearingTxId(null);
    setClearingPaymentInput('');
    alert('تم قيد التسليم، وتوثيق السداد في العملية الأصلية، وتغذية رصيد الخزنة بالسيولة الفورية!');
  };

  const handleShareStatement = () => {
    if (!targetShop) return;
    const totals = {
      totalCollected: totalActiveCollected,
      totalDebt: totalActiveDebt,
      totalAmount: totalActiveAmount
    };
    const formatted = getShareTextForStatement(targetShop.name, activeTx, totals);
    navigator.clipboard.writeText(formatted);
    alert('تم نسخ كافية كشف العمليات النشطة لمشاركتها كرسالة!');
  };

  const cashLabelFormatter = (val: number) => {
    return `${val.toLocaleString()} ريال`;
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100" dir="rtl">
      {/* Top Navigation toggle inside page */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full md:max-w-md mx-auto">
        <button
          onClick={() => setInternalTab('statements')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors duration-150 ${
            internalTab === 'statements'
              ? 'bg-yellow-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          id="shop-tab-ledgers"
        >
          📂 كشوفات حساب المحلات
        </button>

        <button
          onClick={() => setInternalTab('settings')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors duration-150 ${
            internalTab === 'settings'
              ? 'bg-yellow-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          id="shop-tab-settings"
        >
          🔧 إعدادات ودليل عمال المحلات
        </button>
      </div>

      {internalTab === 'statements' ? (
        /* ======================== TAB 1: SHOP ACCOUNT STATEMENTS ======================== */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Shop Selector column sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
              اختر المحل للحسابات
            </h4>
            
            <div className="space-y-1.5 overflow-y-auto max-h-[350px] pr-1" id="shop-selector-sidebar">
              {shops.map(shop => {
                const isActive = shop.id === activeShopId;
                return (
                  <button
                    key={shop.id}
                    onClick={() => {
                      setActiveShopId(shop.id);
                      setShowPrevDebts(false);
                    }}
                    className={`w-full text-right p-3 rounded-xl transition duration-150 flex items-center justify-between border ${
                      isActive
                        ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500 font-bold'
                        : 'bg-slate-950/20 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={16} />
                      <span className="text-xs">{shop.name}</span>
                    </div>
                    {shop.city && <span className="text-[10px] text-slate-500 block font-normal">{shop.city}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Details main workspace */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            {targetShop ? (
              <>
                {/* Shop title metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Building2 size={22} className="text-yellow-500 animate-pulse" />
                      <span>كشف حساب: {targetShop.name}</span>
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                      {targetShop.city && <span className="flex items-center gap-1"><MapPin size={12} /> مدينة {targetShop.city}</span>}
                      {targetShop.phone && <span className="flex items-center gap-1"><Phone size={12} /> {targetShop.phone}</span>}
                      <span className="flex items-center gap-1 text-yellow-500"><Award size={12} /> تسعير النقطة: {targetShop.pricePerPoint} ر.ي</span>
                    </div>
                  </div>

                  {/* Top Action Options: Archive & Share */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleShareStatement}
                      className="p-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition duration-150 flex items-center gap-1.5 border border-slate-700"
                    >
                      <Share2 size={14} />
                      <span>مشاركة الكشف الجاري</span>
                    </button>

                    <button
                      onClick={handleArchiveStatement}
                      disabled={activeTx.length === 0}
                      className="p-2 px-4 bg-yellow-500 disabled:opacity-50 hover:bg-yellow-600 active:scale-95 text-slate-950 rounded-xl text-xs font-bold transition duration-150 flex items-center gap-1.5"
                      id="close-archive-shop-statement-btn"
                    >
                      <Archive size={14} />
                      <span>أرشفة وإقفال الكشف الحالي</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Panel: الدين السابق (Previous Debt) Warning banner */}
                {totalPreviousDebtsVal > 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-400">
                        <AlertTriangle size={18} />
                        <span className="text-sm font-bold">تنبيه: يتوجب على هذا المحل دين مستحق سابق للشركة!</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-rose-400 font-mono">
                          {cashLabelFormatter(totalPreviousDebtsVal)}
                        </span>
                        <button
                          onClick={() => setShowPrevDebts(!showPrevDebts)}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-lg transition duration-150"
                        >
                          {showPrevDebts ? 'إخفاء التفاصيل' : 'عرض وتحصيل الديون السابقة 📑'}
                        </button>
                      </div>
                    </div>

                    {/* Expandable historical debts detail */}
                    {showPrevDebts && (
                      <div className="bg-slate-950 p-4 rounded-xl space-y-3 border border-slate-850 max-h-[300px] overflow-y-auto">
                        <p className="text-[11px] text-slate-400">
                          عمليات معلقة سابقة (تضم الفواتير والعمليات النشطة أو الكشوف المؤرشفة والمقفلة والتي لم تسدد بالكامل):
                        </p>
                        <div className="divide-y divide-slate-900 space-y-2">
                          {previousDebtsList.map(item => {
                            const unpaidAmount = item.amount - item.receivedAmount;
                            return (
                              <div key={item.id} className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div>
                                  <p className="font-bold text-slate-200">{item.description}</p>
                                  <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                                    <span>العامل: {item.workerName}</span>
                                    <span>•</span>
                                    <span>التاريخ: {item.date}</span>
                                    {item.isArchived && <span className="text-yellow-500 font-semibold">[كشف سابق مؤرشف]</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-left font-mono">
                                    <span className="text-slate-400">السعر: {item.amount} | </span>
                                    <span className="text-rose-400 font-bold">المتبقي: {unpaidAmount} ر.ي</span>
                                  </div>

                                  {clearingTxId === item.id ? (
                                    <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
                                      <input
                                        type="number"
                                        placeholder="المبلغ المدفوع"
                                        value={clearingPaymentInput}
                                        onChange={e => setClearingPaymentInput(e.target.value)}
                                        className="bg-slate-950 text-slate-200 text-[11px] w-20 px-1 py-1 focus:outline-none focus:border-yellow-500 rounded text-center"
                                      />
                                      <button
                                        onClick={() => handleClearDebtInline(item.id)}
                                        className="bg-emerald-500 text-slate-950 p-1 rounded font-bold text-[10px] px-2"
                                      >
                                        تأكيد
                                      </button>
                                      <button
                                        onClick={() => setClearingTxId(null)}
                                        className="text-slate-400 hover:text-slate-200 text-[10px] px-1"
                                      >
                                        ألغى
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setClearingTxId(item.id);
                                        setClearingPaymentInput(unpaidAmount.toString());
                                      }}
                                      className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-3 py-1 rounded text-[10px] transition duration-150"
                                    >
                                      تم التسليم (تسجيل القبض)
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Account Metrics Grid for current open ledger */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/20 p-4 rounded-xl border border-slate-800">
                  <div className="text-center sm:text-right p-1 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">إجمالي النقاط الجارية</span>
                    <span className="text-lg font-bold text-slate-200 font-mono block">
                      {totalActivePoints} حبة/نقطة
                    </span>
                  </div>
                  <div className="text-center sm:text-right p-1 space-y-1 border-r border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">إجمالي سعر العمليات</span>
                    <span className="text-lg font-bold text-slate-250 font-mono block">
                      {cashLabelFormatter(totalActiveAmount)}
                    </span>
                  </div>
                  <div className="text-center sm:text-right p-1 space-y-1 border-r border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">المستلم الفعلي الجاري</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono block">
                      {cashLabelFormatter(totalActiveCollected)}
                    </span>
                  </div>
                  <div className="text-center sm:text-right p-1 space-y-1 border-r border-slate-800">
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">الآجل الجاري المعلق</span>
                    <span className="text-lg font-bold text-rose-400 font-mono block">
                      {cashLabelFormatter(totalActiveDebt)}
                    </span>
                  </div>
                </div>

                {/* Operations List of current open/unarchived Statement */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center gap-1">
                    <span>العمليات النشطة الجارية بالكشف الجديد</span>
                  </h4>

                  {activeTx.length === 0 ? (
                    <div className="text-center py-10 bg-slate-950/20 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                      لا توجد أي عمليات جارية مسجلة لمحل &quot;{targetShop.name}&quot; في الكشف الجديد.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-right text-xs text-slate-300">
                        <thead className="bg-slate-950/40 text-slate-400">
                          <tr>
                            <th className="p-3">تفاصيل العمل المطلوب</th>
                            <th className="p-3">العامل المستلم</th>
                            <th className="p-3">وزن / حبات</th>
                            <th className="p-3">سعر العملية</th>
                            <th className="p-3">تم تسديده</th>
                            <th className="p-3 text-center">أدوات مالية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {activeTx.map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-850/50 transition">
                              <td className="p-3 font-semibold text-slate-100">{tx.description}</td>
                              <td className="p-3">{tx.workerName || 'طاقم العمل'}</td>
                              <td className="p-3">
                                {tx.metalType === 'none' ? '-' : `${tx.metalType === 'gold' ? 'ذهب' : 'فضة'}`}
                                {tx.points && <span className="font-mono text-slate-400 font-bold text-[10px] block">({tx.points} نقاط)</span>}
                              </td>
                              <td className="p-3 font-mono font-bold">{tx.amount.toLocaleString()} ر.ي</td>
                              <td className="p-3 font-mono font-semibold text-emerald-400">{tx.receivedAmount.toLocaleString()} ر.ي</td>
                              <td className="p-3 text-center">
                                {tx.paymentMethod === 'cash' ? (
                                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-bold">
                                    نقدي مستلم
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded font-bold">
                                    آجل ذمة
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                الرجاء إضافة محل من تبويب الإعدادات للبدء بتدوين واستعراض الكشوفات.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================== TAB 2: SHOP AND WORKERS CONFIGURATION (إعدادات كشف ومستودع المحلات) ======================== */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section A: Shops creation & Editing panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Building2 size={18} className="text-yellow-500" />
                <span>إعدادات وإدارة معلومات المحلات</span>
              </h3>
              
              <button
                onClick={() => setIsAddingShop(!isAddingShop)}
                className="bg-yellow-500 hover:bg-yellow-600 font-semibold text-slate-950 p-1.5 px-3 rounded-lg text-xs transition duration-150-all flex items-center gap-1"
                id="add-shop-btn"
              >
                <Plus size={14} />
                <span>محل جديد</span>
              </button>
            </div>

            {/* Shop Adding Form input fields */}
            {isAddingShop && (
              <form onSubmit={handleAddNewShopSubmit} className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-3">
                <p className="text-[10px] text-slate-400 font-bold">إدخال محل جديد للتعاملات اليومية والآجلة والعيارات:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300">اسم المحل ومميز العمل</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      placeholder="أبو خالد للذهب والفضة"
                      value={newShopName}
                      onChange={e => setNewShopName(e.target.value)}
                      required
                      id="new-shop-name-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300">سعر النقطة الافتراضي للعمل بالمحل</label>
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      placeholder="500"
                      value={newShopPrice}
                      onChange={e => setNewShopPrice(e.target.value)}
                      required
                      id="new-shop-price-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300">المدينة أو المحافظة (اختياري)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      placeholder="صنعاء / عدن"
                      value={newShopCity}
                      onChange={e => setNewShopCity(e.target.value)}
                      id="new-shop-city-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300">رقم الهاتف للتواصل (اختياري)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      placeholder="77XXXXXXX"
                      value={newShopPhone}
                      onChange={e => setNewShopPhone(e.target.value)}
                      id="new-shop-phone-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                  <button
                    type="submit"
                    className="bg-yellow-500 font-semibold text-slate-950 rounded px-3 py-1.5 text-xs"
                    id="save-new-shop-btn"
                  >
                    تأكيد الحفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingShop(false)}
                    className="bg-slate-800 text-slate-300 rounded px-3 py-1.5 text-xs border border-slate-700"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            {/* List of active Shops with direct editing tools */}
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {shops.map(shop => (
                <div key={shop.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex items-center justify-between gap-4">
                  {editingShopId === shop.id ? (
                    /* Shop Edit state subform fields */
                    <form onSubmit={handleSaveShopEdit} className="w-full space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editShopName}
                          onChange={e => setEditShopName(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                          required
                          placeholder="الاسم"
                        />
                        <input
                          type="number"
                          value={editShopPrice}
                          onChange={e => setEditShopPrice(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                          required
                          placeholder="سعر النقطة"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editShopCity}
                          onChange={e => setEditShopCity(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                          placeholder="المدينة"
                        />
                        <input
                          type="text"
                          value={editShopPhone}
                          onChange={e => setEditShopPhone(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                          placeholder="الهاتف"
                        />
                      </div>
                      <div className="flex gap-1.5 justify-end">
                        <button type="submit" className="bg-yellow-500 text-slate-950 px-2 py-1 rounded text-[11px] font-bold">حفظ</button>
                        <button type="button" onClick={() => setEditingShopId(null)} className="bg-slate-850 text-slate-300 px-2 py-1 rounded text-[11px]">إلغاء</button>
                      </div>
                    </form>
                  ) : (
                    /* Read-only listing item */
                    <>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                          <span>{shop.name}</span>
                          {shop.city && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-normal">{shop.city}</span>}
                        </h4>
                        <p className="text-[10px] text-slate-400">سعر النقطة المقيد: {shop.pricePerPoint} ر.ي</p>
                        {shop.phone && <p className="text-[10px] text-slate-500 font-mono">الهاتف: {shop.phone}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditShopClick(shop)}
                          className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                        >
                          تعديل المحل
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {shops.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs">لا يوجد أي محلات مدخلة، ابدأ بإدخال محل أولاً.</div>
              )}
            </div>
          </div>

          {/* Section B: Workers management with strict system-wide uniqueness checks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3 space-y-1">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Users size={18} className="text-yellow-500" />
                <span>إدارة عمال ومندوبي المحل المختار</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                النظام يمنع تماماً إضافة نفس المندوب لمحل آخر لمنع تداخل الحسابات.
              </p>
            </div>

            {/* Shop select dropdown to view/add workers */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">اختر المحل لإدارة عماله ومندوبيه:</label>
              <select
                value={selectedAdminShopId}
                onChange={e => setSelectedAdminShopId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-250 text-xs focus:outline-none focus:border-yellow-500"
                id="admin-worker-shop-select"
              >
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>

            {/* Form addition for single worker under chosen shop */}
            {selectedAdminShopId && (
              <form onSubmit={handleAddWorkerSubmit} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWorkerName}
                    onChange={e => setNewWorkerName(e.target.value)}
                    placeholder="أدخل اسم مندوب / عامل جديد فريد..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    required
                    id="new-worker-name-input"
                  />
                  <button
                    type="submit"
                    className="bg-yellow-500 text-slate-950 text-xs font-semibold rounded-lg px-4 py-1.5 flex items-center gap-1 shrink-0"
                    id="add-worker-btn"
                  >
                    <UserPlus size={14} />
                    <span>إضافة عمالة</span>
                  </button>
                </div>
              </form>
            )}

            {/* Listing employees under active selection with inline rename controls */}
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-bold block">قائمة العاملين المسجلين بالمحل حالياً:</label>
              
              {targetShop ? (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {targetShop.workers.map(w => (
                    <div key={w} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between text-xs">
                      {editingWorkerOldName === w ? (
                        /* Editing Employee rename block */
                        <div className="flex gap-2 items-center w-full">
                          <input
                            type="text"
                            value={editingWorkerNewName}
                            onChange={e => setEditingWorkerNewName(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs flex-1"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveWorkerEdit(targetShop.id)}
                            className="bg-emerald-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWorkerOldName(null)}
                            className="text-slate-405 text-[10px]"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        /* Read only worker item */
                        <>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                            <span className="font-medium text-slate-250">{w}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartWorkerEdit(w)}
                              className="text-blue-400 hover:text-blue-300 transition text-[10px]"
                            >
                              إعادة تسمية
                            </button>
                            <span className="text-slate-750">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (workerToDelete?.shopId === targetShop.id && workerToDelete?.name === w) {
                                  deleteWorker(targetShop.id, w);
                                  setWorkerToDelete(null);
                                } else {
                                  setWorkerToDelete({ shopId: targetShop.id, name: w });
                                  // Auto-timeout after 3 seconds to reset
                                  setTimeout(() => {
                                    setWorkerToDelete(null);
                                  }, 4000);
                                }
                              }}
                              className={`transition text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                workerToDelete?.shopId === targetShop.id && workerToDelete?.name === w
                                  ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                                  : 'text-rose-400 hover:text-rose-300'
                              }`}
                            >
                              {workerToDelete?.shopId === targetShop.id && workerToDelete?.name === w ? 'تأكيد الحذف؟ ⚠️' : 'حذف'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {targetShop.workers.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      محل &quot;{targetShop.name}&quot; لا يحتوي على أي عمال ومندوبين بعد. قم بإضافة المندوبين أولاً.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">الرجاء اختيار محل صالح أولاً لإدارة العمالة.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
