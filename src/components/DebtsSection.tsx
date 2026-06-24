import React, { useState } from 'react';
import { Transaction, Shop } from '../types';
import { getShareTextForDebt } from '../utils';
import { 
  DollarSign, FileText, Search, Share2, CornerDownLeft, 
  CheckCircle, PlusCircle, AlertCircle, ShoppingBag, UserCheck, Calendar, X,
  Coins, ArrowDownLeft, Trash2, Clock
} from 'lucide-react';

interface DebtsSectionProps {
  transactions: Transaction[];
  shops: Shop[];
  deliverDebt: (
    transactionId: string, 
    amountReceived: number, 
    date?: string, 
    time?: string,
    caliber?: string,
    weight?: number,
    assetName?: string
  ) => void;
  updateDebtStatus: (transactionId: string, status: 'unpaid' | 'partial' | 'paid') => void;
  camouflage: boolean;
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
    currency?: 'YER' | 'SAR' | 'USD' | 'gold' | 'silver' | 'asset';
    caliber?: string;
    weight?: number;
    assetName?: string;
  }) => any;
}

export default function DebtsSection({
  transactions,
  shops,
  deliverDebt,
  updateDebtStatus,
  camouflage,
  addTransaction
}: DebtsSectionProps) {
  // Tabs: Shop Debts ('shop') or Exterior Client Debts ('external')
  const [activeSubTab, setActiveSubTab] = useState<'shop' | 'external'>('shop');

  // Search parameters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial'>('all');

  // Modal detailed view state
  const [viewingTxId, setViewingTxId] = useState<string | null>(null);
  
  // Payment Delivery form inside Modal
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payTime, setPayTime] = useState('');

  // Add Debt state
  const [isAddingDebt, setIsAddingDebt] = useState(false);
  const [newDebtType, setNewDebtType] = useState<'shop' | 'external'>('shop');
  const [newShopId, setNewShopId] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCurrency, setNewCurrency] = useState<'YER' | 'SAR' | 'USD' | 'gold' | 'silver' | 'asset'>('YER');
  const [newCaliber, setNewCaliber] = useState('21');
  const [newWeight, setNewWeight] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newReceivedAmount, setNewReceivedAmount] = useState('');

  // Retrieve matching debts (paymentMethod === 'credit' and remaining > 0)
  const allDebts = transactions.filter(t => 
    t.paymentMethod === 'credit' && 
    (t.receivedAmount ?? 0) < t.amount &&
    !t.isTransferredToTrust
  );

  // Divide into targeted tab
  const tabDebts = allDebts.filter(t => {
    if (activeSubTab === 'shop') return t.type === 'shop';
    return t.type === 'external';
  });

  // Apply filters
  const filteredDebts = tabDebts.filter(tx => {
    const searchLower = searchText.toLowerCase();
    const descMatches = tx.description.toLowerCase().includes(searchLower);
    const shopMatches = tx.shopName && tx.shopName.toLowerCase().includes(searchLower);
    const workerMatches = tx.workerName && tx.workerName.toLowerCase().includes(searchLower);
    
    const matchesSearch = descMatches || shopMatches || workerMatches;
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : tx.debtStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate separate outstanding metrics for the Bento bar
  const totalYER = filteredDebts
    .filter(d => !d.currency || d.currency === 'YER')
    .reduce((sum, d) => sum + (d.amount - d.receivedAmount), 0);

  const totalSAR = filteredDebts
    .filter(d => d.currency === 'SAR')
    .reduce((sum, d) => sum + (d.amount - d.receivedAmount), 0);

  const totalUSD = filteredDebts
    .filter(d => d.currency === 'USD')
    .reduce((sum, d) => sum + (d.amount - d.receivedAmount), 0);

  // For metals, we track the remaining weights
  const totalGoldDebts = filteredDebts
    .filter(d => d.currency === 'gold')
    .reduce((acc, d) => {
      const cal = d.caliber || '21';
      const rem = (d.weight ?? d.amount) - (d.receivedAmount || 0);
      acc[cal] = (acc[cal] || 0) + rem;
      return acc;
    }, {} as Record<string, number>);

  const totalSilverDebts = filteredDebts
    .filter(d => d.currency === 'silver')
    .reduce((acc, d) => {
      const cal = d.caliber || '925';
      const rem = (d.weight ?? d.amount) - (d.receivedAmount || 0);
      acc[cal] = (acc[cal] || 0) + rem;
      return acc;
    }, {} as Record<string, number>);

  const activeGoldPurities = Object.keys(totalGoldDebts).filter(cal => totalGoldDebts[cal] > 0);
  const activeSilverPurities = Object.keys(totalSilverDebts).filter(cal => totalSilverDebts[cal] > 0);

  const selectedTx = transactions.find(t => t.id === viewingTxId);

  const startPaymentProcess = (tx: Transaction) => {
    setViewingTxId(tx.id);
    setPayAmount(((tx.weight ?? tx.amount) - tx.receivedAmount).toString());
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    const amtToDeliver = Number(payAmount);
    const maxPayable = (selectedTx.weight ?? selectedTx.amount) - selectedTx.receivedAmount;

    if (isNaN(amtToDeliver) || amtToDeliver <= 0 || amtToDeliver > maxPayable) {
      alert(`الرجاء إدخال قيمة صحيحة ومقبولة للتحصيل السداد!`);
      return;
    }

    deliverDebt(selectedTx.id, amtToDeliver, payDate || undefined, payTime || undefined);
    
    setViewingTxId(null);
    setPayAmount('');
    alert('تم تحصيل وتسجيل المقبوض في الخزنة تلقائياً حسب نوع العملة أو العيار بنجاح!');
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTransaction) {
      alert('ميزة قيد الديون غير جاهزة.');
      return;
    }

    if (newDebtType === 'shop' && !newShopId) {
      alert('الرجاء اختيار المحل المستحق عليه الدين!');
      return;
    }

    let parsedAmount = Number(newAmount) || 0;
    let parsedWeight = Number(newWeight) || 0;
    let parsedReceived = Number(newReceivedAmount) || 0;

    const desc = newDescription.trim() || 'قيد مديونية مستقل';

    if (newCurrency === 'gold' || newCurrency === 'silver') {
      if (parsedWeight <= 0) {
        alert('الرجاء كتابة وزن الجرامات للذهب أو الفضة!');
        return;
      }
      // Set amount placeholder to be the weight or estimated value
      if (parsedAmount <= 0) {
        parsedAmount = parsedWeight; // fallback
      }
    } else {
      if (parsedAmount <= 0) {
        alert('الرجاء كتابة قيمة الدين!');
        return;
      }
    }

    if (parsedReceived < 0 || parsedReceived >= (parsedWeight || parsedAmount)) {
      alert('المبلغ المستلم مقدماً لا يمكن أن يكون سالباً أو أكبر من الدين نفسه!');
      return;
    }

    addTransaction({
      type: newDebtType,
      shopId: newDebtType === 'shop' ? newShopId : undefined,
      workerName: newDebtType === 'shop' ? newWorkerName.trim() : newCustomerName.trim(),
      description: `${desc}${newAssetName ? ` [أصل: ${newAssetName}]` : ''}`,
      amount: parsedAmount,
      points: 0,
      metalType: newCurrency === 'gold' ? 'gold' : (newCurrency === 'silver' ? 'silver' : 'none'),
      paymentMethod: 'credit',
      receivedAmount: parsedReceived,
      currency: newCurrency,
      caliber: (newCurrency === 'gold' || newCurrency === 'silver') ? newCaliber : undefined,
      weight: (newCurrency === 'gold' || newCurrency === 'silver') ? parsedWeight : undefined,
      assetName: newCurrency === 'asset' ? newAssetName : undefined
    });

    // Reset form
    setIsAddingDebt(false);
    setNewShopId('');
    setNewWorkerName('');
    setNewCustomerName('');
    setNewDescription('');
    setNewCurrency('YER');
    setNewCaliber('21');
    setNewWeight('');
    setNewAssetName('');
    setNewAmount('');
    setNewReceivedAmount('');
    alert('تم تسجيل ذمة الدين الآجل بنجاح وعزلها عن الخزنة بالكامل تماشياً مع الأصول!');
  };

  const handleShareSingleDebt = (tx: Transaction) => {
    const shopItem = shops.find(s => s.id === tx.shopId);
    const shareText = getShareTextForDebt(tx, shopItem?.name);
    navigator.clipboard.writeText(shareText);
    alert('تم نسخ قالب مطالبة الدين ومشاركته كرسالة منسقة بنجاح!');
  };

  const showCurrency = (val: number) => {
    return `${val.toLocaleString()} ر.ي`;
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100" dir="rtl">
      {/* Header Banner with Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Coins className="text-yellow-500 animate-pulse" size={24} />
            <span>كشف ذمم الديون المستحقة لنا ("الدين لي")</span>
          </h2>
          <p className="text-xs text-slate-405 text-slate-400">قائمة المستحقات والأصول العالقة عند الآخرين مستقلة تماماً عن الخزنة</p>
        </div>
        <button
          onClick={() => setIsAddingDebt(!isAddingDebt)}
          className="bg-yellow-500 hover:bg-yellow-600 font-extrabold text-slate-950 px-4 py-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer self-start md:self-auto shadow-md"
        >
          {isAddingDebt ? <X size={15} /> : <PlusCircle size={15} />}
          <span>{isAddingDebt ? 'إغلاق نافذة التسجيل' : 'تسجيل قيد دين جديد لي'}</span>
        </button>
      </div>

      {/* Debt Creation Block */}
      {isAddingDebt && (
        <form onSubmit={handleCreateDebt} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-2xl mx-auto animate-scale-up">
          <h3 className="text-xs font-extrabold text-yellow-500 block pb-2 border-b border-slate-900">✏️ نموذج تقييد دين معلق جديد (لا يدخل الخزنة حالياً)</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Debt Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">نوع جهة المديونية</label>
              <select
                value={newDebtType}
                onChange={e => setNewDebtType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500 font-bold"
              >
                <option value="shop">🏫 دين محل (شريك/عميل)</option>
                <option value="external">👤 عميل / زبون خارجي مباشر</option>
              </select>
            </div>

            {/* Currency / Asset Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">نوع الأصل / العملة المقترنة بالدين</label>
              <select
                value={newCurrency}
                onChange={e => setNewCurrency(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-205 text-slate-200 focus:outline-none focus:border-yellow-500 font-bold"
              >
                <option value="YER">💵 ريال يمني (YER)</option>
                <option value="SAR">🇸🇦 ريال سعودي (SAR)</option>
                <option value="USD">🇺🇸 دولار أمريكي (USD)</option>
                <option value="gold">💎 ذهب بالعيار والوزن</option>
                <option value="silver">🔗 فضة وعينات بالعيار والوزن</option>
                <option value="asset">📦 أصل عيني آخر ذو قيمة</option>
              </select>
            </div>

            {/* If Shop chosen */}
            {newDebtType === 'shop' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 font-sans">اختر المحل المدين</label>
                  <select
                    value={newShopId}
                    onChange={e => setNewShopId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                    required
                  >
                    <option value="">-- اختر المحل المستفيد --</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.city ? `(${s.city})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">اسم المندوب المكلف بالذمة</label>
                  <input
                    type="text"
                    value={newWorkerName}
                    onChange={e => setNewWorkerName(e.target.value)}
                    placeholder="مثال: أحمد الصابري"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300">اسم العميل الخارجي المدين</label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  placeholder="أدخل الاسم الثلاثي لتسجيل الذمة..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-550 focus:border-yellow-500"
                  required
                />
              </div>
            )}

            {/* If Gold or Silver chosen */}
            {(newCurrency === 'gold' || newCurrency === 'silver') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">العيار التقني لقيمة الأصل</label>
                  <input
                    type="text"
                    value={newCaliber}
                    onChange={e => setNewCaliber(e.target.value)}
                    placeholder={newCurrency === 'gold' ? "21" : "925"}
                    className="w-full bg-slate-900 border border-slate-805 border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-202 text-slate-205 focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">الوزن الصافي المعلق بالجرام</label>
                  <input
                    type="number"
                    step="any"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500 font-mono"
                    required
                  />
                </div>
              </>
            )}

            {/* If Asset Chosen */}
            {newCurrency === 'asset' && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300">وصف واسم الأصل العيني المرهون/المقترض</label>
                <input
                  type="text"
                  value={newAssetName}
                  onChange={e => setNewAssetName(e.target.value)}
                  placeholder="ساعة ذهبية ماركة رولكس، سبائك تجميع، إلخ..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
            )}

            {/* Values / Upfront payments */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">
                {newCurrency === 'gold' || newCurrency === 'silver' ? 'القيمة التقديرية باليمني (إن وجدت)' : 'قيمة الدين المقيد بالكامل'}
              </label>
              <input
                type="number"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500 font-mono font-bold"
                required={newCurrency !== 'gold' && newCurrency !== 'silver'}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">المبلغ المقبوض سلفاً (دفعة أولى أو عربون)</label>
              <input
                type="number"
                value={newReceivedAmount}
                onChange={e => setNewReceivedAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300">تفاصيل المديونية وسبب قيدها</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="شراء كسر، بضاعة آجلة، قرض شخصي معلق وموثق..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
              rows={2}
              required
            />
          </div>

          <div className="flex gap-2 justify-end border-t border-slate-900 pt-3">
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 font-black text-slate-950 px-5 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              توثيق وقيد السند المدين 📤
            </button>
            <button
              type="button"
              onClick={() => setIsAddingDebt(false)}
              className="bg-slate-800 hover:bg-slate-750 font-bold text-slate-300 px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              تراجع
            </button>
          </div>
        </form>
      )}

      {/* Grid of outstanding metrics - Separated Currencies/Assets */}
      <h3 className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-[-10px] pb-1.5 border-b border-slate-850/30">📊 ذمم الديون الحالية المعزولة حسب العملة والأصل</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* YER card */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 block">ديون ريال يمني</span>
          <span className="text-sm sm:text-md font-black font-mono text-rose-400 block mt-1">
            {camouflage ? '••••••' : totalYER.toLocaleString()} YER
          </span>
        </div>

        {/* SAR card */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 block">ديون ريال سعودي</span>
          <span className="text-sm sm:text-md font-black font-mono text-amber-500 block mt-1">
            {camouflage ? '••••••' : totalSAR.toLocaleString()} SAR
          </span>
        </div>

        {/* USD card */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 block">ديون دولار أمريكي</span>
          <span className="text-sm sm:text-md font-black font-mono text-sky-400 block mt-1">
            {camouflage ? '••••••' : totalUSD.toLocaleString()} USD
          </span>
        </div>

        {/* Gold stock card */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 block">ذمم ذهب بالعيار والوزن</span>
          <div className="space-y-0.5 mt-1">
            {activeGoldPurities.length === 0 ? (
              <span className="text-slate-600 text-[10px] block font-medium">لا يوجد</span>
            ) : (
              activeGoldPurities.map(cal => (
                <div key={cal} className="flex justify-between text-[11px] font-mono text-yellow-500 font-bold">
                  <span>عيار {cal}:</span>
                  <span>{camouflage ? '••' : totalGoldDebts[cal]} جم</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Silver stock card */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 block">ذمم فضة بالوزن</span>
          <div className="space-y-0.5 mt-1">
            {activeSilverPurities.length === 0 ? (
              <span className="text-slate-600 text-[10px] block font-medium">لا يوجد</span>
            ) : (
              activeSilverPurities.map(cal => (
                <div key={cal} className="flex justify-between text-[11px] font-mono text-slate-300 font-bold">
                  <span>عيار {cal}:</span>
                  <span>{camouflage ? '••' : totalSilverDebts[cal]} جم</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sub-tab selection */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full md:max-w-md mx-auto">
        <button
          onClick={() => {
            setActiveSubTab('shop');
            setSearchText('');
          }}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition ${
            activeSubTab === 'shop'
              ? 'bg-yellow-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏬 ذمم ديون المحلات
        </button>

        <button
          onClick={() => {
            setActiveSubTab('external');
            setSearchText('');
          }}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition ${
            activeSubTab === 'external'
              ? 'bg-yellow-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          👤 ذمم ديون الزبائن المباشرين
        </button>
      </div>

      {/* Search / Filters control */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={activeSubTab === 'shop' ? 'البحث باسم المحل، المندوب، أو تفاصيل المديونية...' : 'بحث ببيانات الزبائن والديون المعلقة...'}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs focus:outline-none focus:border-yellow-500 text-slate-200"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-bold px-3 py-2 text-slate-300 focus:outline-none focus:border-yellow-500"
        >
          <option value="all">كل الحالات المعلقة</option>
          <option value="unpaid">ديون غير مسددة بالكامل (🔴)</option>
          <option value="partial">ديون مسددة جزئياً (🟡)</option>
        </select>
      </div>

      {/* List layout of debts as elegant cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDebts.map(tx => {
          const actCurrency = tx.currency || 'YER';
          const totalVal = tx.weight ?? tx.amount;
          const unpaid = totalVal - tx.receivedAmount;

          return (
            <div key={tx.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition duration-150 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Header card info */}
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    {tx.type === 'shop' ? (
                      <span className="text-slate-100 font-black text-xs sm:text-sm block">
                        🏫 محل {tx.shopName}
                      </span>
                    ) : (
                      <span className="text-yellow-500 font-extrabold text-xs sm:text-sm block">
                        👤 زبون خارجي مباشر: {tx.workerName || 'بدون اسم'}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono block">📅 القيد: {tx.date} في {tx.time}</span>
                  </div>

                  <span className={`text-[9px] px-2.5 py-1 rounded-full font-black ${
                    tx.debtStatus === 'unpaid' 
                      ? 'bg-rose-500/10 text-rose-500' 
                      : 'bg-yellow-500/15 text-yellow-500'
                  }`}>
                    {tx.debtStatus === 'unpaid' ? '🔴 لم يُسدد' : '🟡 مسدد جزئياً'}
                  </span>
                </div>

                {/* Body description */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <p className="text-xs font-semibold text-slate-200 leading-relaxed">{tx.description}</p>
                  
                  {/* Currency Tag */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={`text-[9px] px-2 py-0.5 font-bold rounded-md ${
                      actCurrency === 'gold' 
                        ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/10'
                        : actCurrency === 'silver'
                          ? 'bg-slate-100/10 text-slate-200 border border-slate-100/5'
                          : actCurrency === 'SAR'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10'
                            : actCurrency === 'USD'
                              ? 'bg-sky-505 bg-sky-500/15 text-sky-450 text-sky-400 border border-sky-500/10'
                              : 'bg-rose-505 bg-rose-500/15 text-rose-450 text-rose-400 border border-rose-500/10'
                    }`}>
                      {actCurrency === 'gold' ? `⚜️ ذهب عيار ${tx.caliber}` : 
                       actCurrency === 'silver' ? `🔗 فضة عيار ${tx.caliber}` : 
                       actCurrency === 'SAR' ? '🇸🇦 ريال سعودي' : 
                       actCurrency === 'USD' ? '🇺🇸 دولار أمريكي' : 
                       actCurrency === 'asset' ? '📦 أصل عيني' : '💵 ريال يمني'}
                    </span>
                    
                    {tx.type === 'shop' && tx.workerName && (
                      <span className="text-[10px] text-slate-500 font-medium">المندوب: {tx.workerName}</span>
                    )}
                  </div>
                </div>

                {/* Debts pricing summary details */}
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/10 p-2 rounded-lg text-[10px] font-mono">
                  <div className="p-1">
                    <span className="text-slate-500 block">إجمالي القيد</span>
                    <span className="text-slate-300 font-semibold block mt-0.5">
                      {totalVal.toLocaleString()} {actCurrency === 'gold' || actCurrency === 'silver' ? 'جم' : ''}
                    </span>
                  </div>
                  <div className="p-1 border-r border-slate-800">
                    <span className="text-slate-500 block">المحصل المحرز</span>
                    <span className="text-emerald-500 font-semibold block mt-0.5">
                      {tx.receivedAmount.toLocaleString()} {actCurrency === 'gold' || actCurrency === 'silver' ? 'جم' : ''}
                    </span>
                  </div>
                  <div className="p-1 border-r border-slate-800 bg-slate-950/50 rounded">
                    <span className="text-slate-400 block font-bold text-rose-400">المتبقي الصافي</span>
                    <span className="text-rose-400 font-black block mt-0.5">
                      {unpaid.toLocaleString()} {actCurrency === 'gold' || actCurrency === 'silver' ? 'جم' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => startPaymentProcess(tx)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 font-extrabold text-slate-950 text-xs py-2 px-3 rounded-lg transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CornerDownLeft size={12} />
                  <span>تسجيل تحصيل سداد 📥</span>
                </button>

                <button
                  onClick={() => handleShareSingleDebt(tx)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-2 px-3 rounded-lg transition duration-150 flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                  title="نسخ ومشاركة قالب مطالبة دين للواتساب"
                >
                  <Share2 size={12} />
                  <span>مشاركة ومطالبة</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredDebts.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-20 bg-slate-900 border border-slate-800/80 border-dashed rounded-2xl text-slate-500 text-xs">
            لا توجد ذمم ديون مستحقة مسجلة مطابقة للفلاتر النشطة حالياً.
          </div>
        )}
      </div>

      {/* MODAL WINDOW: PAYMENT REGISTRATION DIALOG */}
      {viewingTxId && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-805 border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-850 border-b border-slate-800">
              <span className="font-extrabold text-sm text-slate-200">📥 تحصيل تحويل الديون للخزنة مباشرة</span>
              <button 
                onClick={() => setViewingTxId(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterPayment} className="p-6 space-y-4 text-xs font-sans">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1.5">
                <p className="text-slate-400">البيان المسجل عليه الدين ومستحقه:</p>
                <p className="font-bold text-slate-200 text-sm leading-relaxed">{selectedTx.description}</p>
                
                <div className="flex flex-wrap gap-2 pt-1.5">
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-yellow-500 font-extrabold">
                    العملة/الأصل: {selectedTx.currency === 'gold' ? 'الذهب بالوزن' : selectedTx.currency === 'silver' ? 'الفضة بالوزن' : selectedTx.currency || 'الريال اليمني'}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-900 mt-2 font-mono">
                  <span>الإجمالي: {(selectedTx.weight ?? selectedTx.amount)}</span>
                  <span className="text-rose-400 font-black">المتبقي المطلوب: {((selectedTx.weight ?? selectedTx.amount) - selectedTx.receivedAmount)}</span>
                </div>
              </div>

              {/* Amount paid input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">المقدار/الوزن المحصل والمقبوض الآن</label>
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="أدخل القيمة المحصلة..."
                  max={((selectedTx.weight ?? selectedTx.amount) - selectedTx.receivedAmount)}
                  min="0.001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-center text-slate-100 font-black font-mono text-xl focus:outline-none focus:border-yellow-500"
                  required
                />
                <span className="text-[10px] text-slate-500 block text-center">سوف يتم إدراج هذا الأصل تلقائياً بالصندوق المقابل بالخزنة فوراً</span>
              </div>

              {/* Adjust date / time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-sans">تاريخ التحصيل</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-sans">وقت التحصيل</label>
                  <input
                    type="time"
                    value={payTime}
                    onChange={e => setPayTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              {/* Confirm submit buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-855 border-slate-800/80">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 font-black text-slate-950 py-2.5 rounded-xl transition duration-150 cursor-pointer"
                >
                  تأكيد التحصيل وإدخال الخزنة مباشرة
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTxId(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition border border-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
