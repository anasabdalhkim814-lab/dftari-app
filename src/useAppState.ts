import { useState, useEffect } from 'react';
import { Shop, Transaction, Trust, VaultTransaction, MetalTransaction, ArchiveRecord, AppSettings, Commitment } from './types';

// Helper to format date and time today (2026-06-19)
const getTodayDateStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getNowTimeStr = () => {
  const d = new Date();
  return d.toTimeString().split(' ')[0].substring(0, 5);
};

// Seed Data
const INITIAL_SHOPS: Shop[] = [
  {
    id: 'shop-abu-talal',
    name: 'أبو طلال',
    city: 'صنعاء',
    phone: '777111222',
    workers: ['مروان', 'عمر', 'بشير'],
    pricePerPoint: 500
  },
  {
    id: 'shop-al-amiri',
    name: 'العامري',
    city: 'عدن',
    phone: '771222333',
    workers: ['أحمد', 'ياسر'],
    pricePerPoint: 450
  },
  {
    id: 'shop-al-wataniya',
    name: 'الوطنية',
    city: 'تعز',
    phone: '773333444',
    workers: ['خالد', 'سليم'],
    pricePerPoint: 500
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_TRUSTS: Trust[] = [];

const INITIAL_METALS: MetalTransaction[] = [];

const INITIAL_VAULT_TRANS: VaultTransaction[] = [];

const DEFAULT_PRESET_TASKS = [
  'تقصير خاتم',
  'تقصير محبس',
  'لحام عراوي',
  'لحام سلس',
  'لحام قطب',
  'لحام بدلة'
];

const INITIAL_SETTINGS: AppSettings = {
  hijriDateOffset: 0,
  customSupplication: '',
  useCustomSupplication: false,
  userName: '',
  themeColor: 'white',
  presetTasks: DEFAULT_PRESET_TASKS,
  sarRate: 380,
  usdRate: 1420,
  reservedDays: 30,
  openingBalanceYemeni: 0,
  openingBalanceSaudi: 0,
  openingBalanceUsd: 0,
  hasEnteredOpeningBalance: false
};

export function useAppState() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trusts, setTrusts] = useState<Trust[]>([]);
  const [vaultTransactions, setVaultTransactions] = useState<VaultTransaction[]>([]);
  const [metalTransactions, setMetalTransactions] = useState<MetalTransaction[]>([]);
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  
  // Unified camouflage state
  const [camouflage, setCamouflage] = useState<boolean>(false);

  // Initialize data from localStorage or seed
  useEffect(() => {
    // Check if we need to do a one-time reset to clear any pre-loaded accounts so user gets a clean slate
    const hasReset = localStorage.getItem('dftr_reset_pure_v5');
    if (!hasReset) {
      localStorage.removeItem('dftr_shops');
      localStorage.removeItem('dftr_transactions');
      localStorage.removeItem('dftr_trusts');
      localStorage.removeItem('dftr_vault');
      localStorage.removeItem('dftr_metals');
      localStorage.removeItem('dftr_archives');
      localStorage.removeItem('dftr_commitments');
      localStorage.setItem('dftr_reset_pure_v5', 'true');
    }

    const loadedShops = localStorage.getItem('dftr_shops');
    const loadedTx = localStorage.getItem('dftr_transactions');
    const loadedTrusts = localStorage.getItem('dftr_trusts');
    const loadedVault = localStorage.getItem('dftr_vault');
    const loadedMetals = localStorage.getItem('dftr_metals');
    const loadedArchives = localStorage.getItem('dftr_archives');
    const loadedCommitments = localStorage.getItem('dftr_commitments');
    const loadedSettings = localStorage.getItem('dftr_settings');
    const loadedCamo = localStorage.getItem('dftr_camouflage');

    if (loadedShops) setShops(JSON.parse(loadedShops));
    else {
      setShops(INITIAL_SHOPS);
      localStorage.setItem('dftr_shops', JSON.stringify(INITIAL_SHOPS));
    }

    if (loadedTx) setTransactions(JSON.parse(loadedTx));
    else {
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.setItem('dftr_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    }

    if (loadedTrusts) setTrusts(JSON.parse(loadedTrusts));
    else {
      setTrusts(INITIAL_TRUSTS);
      localStorage.setItem('dftr_trusts', JSON.stringify(INITIAL_TRUSTS));
    }

    if (loadedVault) setVaultTransactions(JSON.parse(loadedVault));
    else {
      setVaultTransactions(INITIAL_VAULT_TRANS);
      localStorage.setItem('dftr_vault', JSON.stringify(INITIAL_VAULT_TRANS));
    }

    if (loadedMetals) setMetalTransactions(JSON.parse(loadedMetals));
    else {
      setMetalTransactions(INITIAL_METALS);
      localStorage.setItem('dftr_metals', JSON.stringify(INITIAL_METALS));
    }

    if (loadedCommitments) setCommitments(JSON.parse(loadedCommitments));
    else {
      const initialCommitments: Commitment[] = [
        { id: 'rent', name: '🏠 الإيجار', dailyRate: 1500, lastClearedDate: '' },
        { id: 'loan', name: '💳 قرض', dailyRate: 500, lastClearedDate: '' },
        { id: 'association', name: '🤝 جمعية', dailyRate: 500, lastClearedDate: '' },
        { id: 'savings', name: '📈 إدخار', dailyRate: 500, lastClearedDate: '' },
        { id: 'emergencies', name: '🚨 طوارئ', dailyRate: 500, lastClearedDate: '' }
      ];
      setCommitments(initialCommitments);
      localStorage.setItem('dftr_commitments', JSON.stringify(initialCommitments));
    }

    if (loadedArchives) setArchives(JSON.parse(loadedArchives));

    if (loadedSettings) {
      const parsed = JSON.parse(loadedSettings);
      if (!parsed.presetTasks) {
        parsed.presetTasks = DEFAULT_PRESET_TASKS;
      }
      // Migrate legacy colors if they exist and default rates
      const legacyColors = ['amber', 'emerald', 'blue', 'purple'];
      const merged: AppSettings = {
        ...INITIAL_SETTINGS,
        ...parsed,
        themeColor: (legacyColors.includes(parsed.themeColor as string)) ? 'white' : (parsed.themeColor || 'white'),
        sarRate: parsed.sarRate !== undefined ? parsed.sarRate : 380,
        usdRate: parsed.usdRate !== undefined ? parsed.usdRate : 1420,
        reservedDays: parsed.reservedDays !== undefined ? parsed.reservedDays : new Date().getDate()
      };
      setSettings(merged);
    } else {
      setSettings(INITIAL_SETTINGS);
      localStorage.setItem('dftr_settings', JSON.stringify(INITIAL_SETTINGS));
    }

    if (loadedCamo) setCamouflage(JSON.parse(loadedCamo));
  }, []);

  // Sync methods
  const saveShops = (updated: Shop[]) => {
    setShops(updated);
    localStorage.setItem('dftr_shops', JSON.stringify(updated));
  };

  const saveTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    localStorage.setItem('dftr_transactions', JSON.stringify(updated));
  };

  const saveTrusts = (updated: Trust[]) => {
    setTrusts(updated);
    localStorage.setItem('dftr_trusts', JSON.stringify(updated));
  };

  const saveVault = (updated: VaultTransaction[]) => {
    setVaultTransactions(updated);
    localStorage.setItem('dftr_vault', JSON.stringify(updated));
  };

  const saveMetals = (updated: MetalTransaction[]) => {
    setMetalTransactions(updated);
    localStorage.setItem('dftr_metals', JSON.stringify(updated));
  };

  const saveArchives = (updated: ArchiveRecord[]) => {
    setArchives(updated);
    localStorage.setItem('dftr_archives', JSON.stringify(updated));
  };

  const saveSettings = (updated: AppSettings) => {
    setSettings(updated);
    localStorage.setItem('dftr_settings', JSON.stringify(updated));
  };

  const toggleCamouflage = () => {
    const next = !camouflage;
    setCamouflage(next);
    localStorage.setItem('dftr_camouflage', JSON.stringify(next));
  };

  // Helper: check unique worker name across all shops
  const isWorkerNameUnique = (workerName: string, ignoreShopId?: string): boolean => {
    const trimmed = workerName.trim();
    for (const shop of shops) {
      if (ignoreShopId && shop.id === ignoreShopId) continue;
      if (shop.workers.some(w => w.toLowerCase() === trimmed.toLowerCase())) {
        return false;
      }
    }
    return true;
  };

  // Shop management
  const addShop = (name: string, city?: string, phone?: string, pricePerPoint: number = 500) => {
    const newShop: Shop = {
      id: `shop-${Date.now()}`,
      name: name.trim(),
      city: city?.trim() || '',
      phone: phone?.trim() || '',
      workers: [],
      pricePerPoint
    };
    const updated = [...shops, newShop];
    saveShops(updated);
    return newShop;
  };

  const editShop = (id: string, name: string, city?: string, phone?: string, pricePerPoint?: number) => {
    const updated = shops.map(shop => {
      if (shop.id === id) {
        return {
          ...shop,
          name: name.trim(),
          city: city?.trim() || '',
          phone: phone?.trim() || '',
          pricePerPoint: pricePerPoint ?? shop.pricePerPoint
        };
      }
      return shop;
    });
    saveShops(updated);
  };

  const addWorker = (shopId: string, workerName: string): { success: boolean; error?: string } => {
    const name = workerName.trim();
    if (!name) return { success: false, error: 'الاسم غير صالح' };
    
    if (!isWorkerNameUnique(name)) {
      return { success: false, error: 'اسم العامل مكرر بالفعل في محل آخر' };
    }

    const updated = shops.map(shop => {
      if (shop.id === shopId) {
        if (shop.workers.includes(name)) {
          return shop;
        }
        return { ...shop, workers: [...shop.workers, name] };
      }
      return shop;
    });
    saveShops(updated);
    return { success: true };
  };

  const deleteWorker = (shopId: string, workerName: string) => {
    const updated = shops.map(shop => {
      if (shop.id === shopId) {
        return { ...shop, workers: shop.workers.filter(w => w !== workerName) };
      }
      return shop;
    });
    saveShops(updated);
  };

  const editWorker = (shopId: string, oldName: string, newName: string): { success: boolean; error?: string } => {
    const nextName = newName.trim();
    if (!nextName) return { success: false, error: 'اسم غير صالح' };
    if (oldName === nextName) return { success: true };

    if (!isWorkerNameUnique(nextName)) {
      return { success: false, error: 'اسم العامل مكرر بالفعل في محل آخر' };
    }

    const updated = shops.map(shop => {
      if (shop.id === shopId) {
        return {
          ...shop,
          workers: shop.workers.map(w => w === oldName ? nextName : w)
        };
      }
      return shop;
    });
    saveShops(updated);
    
    // Also retroactively clean in active transactions if desired
    const updatedTx = transactions.map(tx => {
      if (tx.shopId === shopId && tx.workerName === oldName) {
        return { ...tx, workerName: nextName };
      }
      return tx;
    });
    saveTransactions(updatedTx);

    return { success: true };
  };

  // Transaction logging with automatic Vault entries!
  const addTransaction = (params: {
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
    // حقول إضافية للديون
    currency?: 'YER' | 'SAR' | 'USD' | 'gold' | 'silver' | 'asset';
    caliber?: string;
    weight?: number;
    assetName?: string;
    source?: string;
  }) => {
    const txDate = params.date || getTodayDateStr();
    const txTime = params.time || getNowTimeStr();
    const id = `tx-${Date.now()}`;
    
    const correspondingShop = shops.find(s => s.id === params.shopId);

    const newTx: Transaction = {
      id,
      type: params.type,
      shopId: params.shopId,
      shopName: correspondingShop?.name || '',
      workerName: params.workerName,
      description: params.description.trim(),
      date: txDate,
      time: txTime,
      amount: Number(params.amount),
      points: params.points ? Number(params.points) : undefined,
      pricePerPointHistorical: correspondingShop?.pricePerPoint,
      metalType: params.metalType,
      paymentMethod: params.paymentMethod,
      receivedAmount: params.paymentMethod === 'cash' ? Number(params.amount) : Number(params.receivedAmount),
      debtStatus: params.paymentMethod === 'credit' ? (Number(params.receivedAmount) > 0 ? 'partial' : 'unpaid') : undefined,
      isArchived: false,
      currency: params.currency || 'YER',
      caliber: params.caliber,
      weight: params.weight ? Number(params.weight) : undefined,
      assetName: params.assetName,
      source: params.source
    };

    const nextTx = [...transactions, newTx];
    saveTransactions(nextTx);

    return newTx;
  };

  // Debt handling - Payment Delivery ("تم التسليم" / "تسجيل التسليم")
  const deliverDebt = (
    transactionId: string, 
    amountReceived: number, 
    customDate?: string, 
    customTime?: string,
    caliber?: string,
    weight?: number,
    assetName?: string
  ) => {
    const date = customDate || getTodayDateStr();
    const time = customTime || getNowTimeStr();
    const amt = Number(amountReceived);

    const updatedTx = transactions.map(tx => {
      if (tx.id === transactionId) {
        const nextReceived = Number(tx.receivedAmount) + amt;
        let nextStatus: 'unpaid' | 'partial' | 'paid' = 'partial';
        if (nextReceived >= tx.amount) {
          nextStatus = 'paid';
        } else if (nextReceived === 0) {
          nextStatus = 'unpaid';
        }

        return {
          ...tx,
          receivedAmount: nextReceived,
          debtStatus: nextStatus,
          deliveryDate: date,
          deliveryTime: time
        };
      }
      return tx;
    });

    saveTransactions(updatedTx);

    // Also trigger vault inflow for received debt payment
    const targetTx = transactions.find(t => t.id === transactionId);
    if (targetTx && amt > 0) {
      const activeCurrency = targetTx.currency || 'YER';
      const sourceLabel = targetTx.type === 'shop' ? `محل ${targetTx.shopName} - ${targetTx.workerName}` : 'زبون خارجي';

      if (activeCurrency === 'YER') {
        const currentSecuredVal = vaultTransactions.length > 0 ? vaultTransactions[vaultTransactions.length - 1].balanceAfter : 0;
        const vaultRecord: VaultTransaction = {
          id: `vt-${Date.now()}`,
          type: 'in',
          amount: amt,
          reason: `تسديد دين سابق: ${targetTx.description} (${sourceLabel})`,
          date,
          time,
          balanceAfter: currentSecuredVal + amt
        };
        saveVault([...vaultTransactions, vaultRecord]);
      } else if (activeCurrency === 'SAR') {
        const updatedSettings = {
          ...settings,
          openingBalanceSaudi: (settings.openingBalanceSaudi || 0) + amt
        };
        setSettings(updatedSettings);
        localStorage.setItem('dftr_settings', JSON.stringify(updatedSettings));
      } else if (activeCurrency === 'USD') {
        const updatedSettings = {
          ...settings,
          openingBalanceUsd: (settings.openingBalanceUsd || 0) + amt
        };
        setSettings(updatedSettings);
        localStorage.setItem('dftr_settings', JSON.stringify(updatedSettings));
      } else if (activeCurrency === 'gold') {
        const newMetalTx: MetalTransaction = {
          id: `mt-${Date.now()}`,
          type: 'buy',
          metalType: 'gold',
          purity: caliber || targetTx.caliber || '21',
          weight: Number(weight ?? targetTx.weight ?? amt) || 0,
          pricePerUnit: 0,
          totalAmount: 0,
          date,
          time,
          notes: `تحصيل سداد دين ذهب عيار ${caliber || targetTx.caliber} من ${targetTx.shopName || targetTx.workerName || 'الزبون'}`
        };
        const nextMetals = [...metalTransactions, newMetalTx];
        setMetalTransactions(nextMetals);
        localStorage.setItem('dftr_metals', JSON.stringify(nextMetals));
      } else if (activeCurrency === 'silver') {
        const newMetalTx: MetalTransaction = {
          id: `mt-${Date.now()}`,
          type: 'buy',
          metalType: 'silver',
          purity: caliber || targetTx.caliber || '925',
          weight: Number(weight ?? targetTx.weight ?? amt) || 0,
          pricePerUnit: 0,
          totalAmount: 0,
          date,
          time,
          notes: `تحصيل سداد دين فضة عيار ${caliber || targetTx.caliber} من ${targetTx.shopName || targetTx.workerName || 'الزبون'}`
        };
        const nextMetals = [...metalTransactions, newMetalTx];
        setMetalTransactions(nextMetals);
        localStorage.setItem('dftr_metals', JSON.stringify(nextMetals));
      }
    }
  };

  // Directly adjust debt status manually if needed
  const updateDebtStatus = (transactionId: string, status: 'unpaid' | 'partial' | 'paid') => {
    const updated = transactions.map(tx => {
      if (tx.id === transactionId) {
        return {
          ...tx,
          debtStatus: status,
          receivedAmount: status === 'paid' ? tx.amount : (status === 'unpaid' ? 0 : tx.receivedAmount)
        };
      }
      return tx;
    });
    saveTransactions(updated);
  };

  // Trusts/deposits management ("الأمانات")
  const addTrust = (
    type: 'cash' | 'item', 
    description: string, 
    amount: number, 
    party: string, 
    customDate?: string, 
    customTime?: string,
    currency?: 'YER' | 'SAR' | 'USD' | 'gold' | 'silver' | 'asset',
    caliber?: string,
    weight?: number,
    assetName?: string,
    isDebtAlayya?: boolean
  ) => {
    const date = customDate || getTodayDateStr();
    const time = customTime || getNowTimeStr();
    const newTrust: Trust = {
      id: `trust-${Date.now()}`,
      type,
      description: description.trim(),
      amount: Number(amount),
      party: party.trim(),
      date,
      time,
      status: 'available',
      currency: currency || 'YER',
      caliber,
      weight: weight ? Number(weight) : undefined,
      assetName,
      isDebtAlayya
    };
    saveTrusts([...trusts, newTrust]);
    return newTrust;
  };

  const deliverTrust = (trustId: string, customDate?: string, customTime?: string) => {
    const date = customDate || getTodayDateStr();
    const time = customTime || getNowTimeStr();

    const target = trusts.find(t => t.id === trustId);
    if (!target) return;

    const updated = trusts.map(t => {
      if (t.id === trustId) {
        return {
          ...t,
          status: 'delivered' as const,
          deliveredDate: date,
          deliveredTime: time
        };
      }
      return t;
    });
    saveTrusts(updated);

    // سحب من الخزنة حسب نوع الأصل/العملة
    const amt = target.amount || 0;
    const isDebt = target.isDebtAlayya;
    const currency = target.currency || 'YER';
    const caliber = target.caliber;
    const weight = target.weight;
    const party = target.party || 'الجهة المستحقة';

    if (currency === 'YER') {
      const currentSecuredVal = vaultTransactions.length > 0 ? vaultTransactions[vaultTransactions.length - 1].balanceAfter : 0;
      const vaultRecord: VaultTransaction = {
        id: `vt-${Date.now()}`,
        type: 'out',
        amount: amt,
        reason: isDebt 
          ? `تسديد دين علينا لـ ${party}: ${target.description}`
          : `تسليم وإعادة الأمانة لـ ${party}: ${target.description}`,
        date,
        time,
        balanceAfter: currentSecuredVal - amt,
        source: 'free_vault'
      };
      saveVault([...vaultTransactions, vaultRecord]);
    } else if (currency === 'SAR') {
      const updatedSettings = {
        ...settings,
        openingBalanceSaudi: Math.max(0, (settings.openingBalanceSaudi || 0) - amt)
      };
      setSettings(updatedSettings);
      localStorage.setItem('dftr_settings', JSON.stringify(updatedSettings));
    } else if (currency === 'USD') {
      const updatedSettings = {
        ...settings,
        openingBalanceUsd: Math.max(0, (settings.openingBalanceUsd || 0) - amt)
      };
      setSettings(updatedSettings);
      localStorage.setItem('dftr_settings', JSON.stringify(updatedSettings));
    } else if (currency === 'gold') {
      const newMetalTx: MetalTransaction = {
        id: `mt-${Date.now()}`,
        type: 'sell',
        metalType: 'gold',
        purity: caliber || '21',
        weight: Number(weight ?? amt) || 0,
        pricePerUnit: 0,
        totalAmount: 0,
        date,
        time,
        notes: isDebt 
          ? `تسديد دين علينا (ذهب عيار ${caliber}) لـ ${party}`
          : `تسليم وإعادة أمانة ذهب عيار ${caliber} لـ ${party}`
      };
      const nextMetals = [...metalTransactions, newMetalTx];
      setMetalTransactions(nextMetals);
      localStorage.setItem('dftr_metals', JSON.stringify(nextMetals));
    } else if (currency === 'silver') {
      const newMetalTx: MetalTransaction = {
        id: `mt-${Date.now()}`,
        type: 'sell',
        metalType: 'silver',
        purity: caliber || '925',
        weight: Number(weight ?? amt) || 0,
        pricePerUnit: 0,
        totalAmount: 0,
        date,
        time,
        notes: isDebt 
          ? `تسديد دين علينا (فضة عيار ${caliber}) لـ ${party}`
          : `تسليم وإعادة أمانة فضة عيار ${caliber} لـ ${party}`
      };
      const nextMetals = [...metalTransactions, newMetalTx];
      setMetalTransactions(nextMetals);
      localStorage.setItem('dftr_metals', JSON.stringify(nextMetals));
    }
  };

  const addExternalTrust = (
    customerName: string,
    workDetail: string,
    itemDescription: string,
    estimatedValue: number,
    notes: string,
    originalTxId?: string,
    customDate?: string,
    customTime?: string
  ) => {
    const date = customDate || getTodayDateStr();
    const time = customTime || getNowTimeStr();
    const newTrust: Trust = {
      id: `trust-${Date.now()}`,
      type: 'item',
      description: itemDescription.trim() || workDetail.trim(),
      amount: Number(estimatedValue) || 0,
      party: customerName.trim(),
      date,
      time,
      status: 'available',

      isExternalCustomer: true,
      customerName: customerName.trim(),
      workDetail: workDetail.trim(),
      itemDescription: itemDescription.trim(),
      estimatedValue: Number(estimatedValue) || 0,
      amountReceivedLater: 0,
      notes: notes.trim(),
      originalTxId
    };
    saveTrusts([...trusts, newTrust]);

    if (originalTxId) {
      const updatedTx = transactions.map(t => {
        if (t.id === originalTxId) {
          return { ...t, isTransferredToTrust: true };
        }
        return t;
      });
      saveTransactions(updatedTx);
    }
    return newTrust;
  };

  const deliverExternalTrust = (
    trustId: string,
    amountReceivedLater: number,
    notes?: string,
    customDate?: string,
    customTime?: string
  ) => {
    const date = customDate || getTodayDateStr();
    const time = customTime || getNowTimeStr();
    const updated = trusts.map(t => {
      if (t.id === trustId) {
        return {
          ...t,
          status: 'delivered' as const,
          amountReceivedLater: Number(amountReceivedLater) || 0,
          notes: notes !== undefined ? notes.trim() : t.notes,
          deliveredDate: date,
          deliveredTime: time
        };
      }
      return t;
    });
    saveTrusts(updated);
  };

  // Vault direct spending outflow ("تسجيل الخرج/المصروفات")
  const addVaultOutflow = (
    reason: string,
    amount: number,
    source: 'free_vault' | 'collected' | 'both' = 'free_vault',
    customDate?: string,
    customTime?: string,
    customCollectedAmount?: number,
    customVaultAmount?: number
  ) => {
    const date = customDate || getTodayDateStr();
    const time = customTime || getNowTimeStr();
    const amt = Number(amount);

    let collectedAmount = 0;
    let vaultAmount = 0;
    if (source === 'collected') {
      collectedAmount = amt;
    } else if (source === 'free_vault') {
      vaultAmount = amt;
    } else {
      if (typeof customCollectedAmount === 'number' && typeof customVaultAmount === 'number') {
        collectedAmount = customCollectedAmount;
        vaultAmount = customVaultAmount;
      } else {
        vaultAmount = Math.round(amt / 2);
        collectedAmount = amt - vaultAmount;
      }
    }

    const currentSecuredVal = vaultTransactions.length > 0 ? vaultTransactions[vaultTransactions.length - 1].balanceAfter : 0;
    const nextVaultRecord: VaultTransaction = {
      id: `vt-${Date.now()}`,
      type: 'out',
      amount: amt,
      reason: reason.trim(),
      date,
      time,
      balanceAfter: currentSecuredVal - vaultAmount,
      source,
      vaultAmount,
      collectedAmount
    };

    const nextVault = [...vaultTransactions, nextVaultRecord];

    // Recalculate running balance sequences accurately (strictly in Yemeni Rial)
    let runningBalance = settings.openingBalanceYemeni || 0;
                         
    const recalculated = nextVault.map(vt => {
      if (vt.type === 'in') {
        runningBalance += vt.amount;
      } else {
        if (vt.source === 'collected') {
          // no effect on physical cash
        } else if (vt.source === 'both') {
          runningBalance -= (vt.vaultAmount ?? Math.round(vt.amount / 2));
        } else {
          runningBalance -= vt.amount;
        }
      }
      return { ...vt, balanceAfter: runningBalance };
    });

    saveVault(recalculated);
  };

  const getAvailableVaultCash = (): number => {
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
      
    const totalCashInVault = openingYemeni + cumulativeInflows - cumulativeOutflows;
    const totalReservedCommitments = commitments.reduce((sum, c) => sum + (c.accumulatedBalance || 0), 0);
    return Math.max(0, totalCashInVault - totalReservedCommitments);
  };

  const getTodayCurrentFreeCash = (): number => {
    const todayStr = getTodayDateStr();
    const todayTransactions = transactions.filter(t => t.date === todayStr);
    const todayIncome = todayTransactions.reduce((sum, t) => sum + t.receivedAmount, 0);

    const todayCollectedOutflows = vaultTransactions
      .filter(vt => vt.date === todayStr && vt.type === 'out')
      .reduce((sum, vt) => {
        if (vt.source === 'collected') return sum + vt.amount;
        if (vt.source === 'both') return sum + (vt.collectedAmount ?? Math.round(vt.amount / 2));
        return sum;
      }, 0);

    return Math.max(0, todayIncome - todayCollectedOutflows);
  };

  // Metal buys and sells ("حركة المعادن")
  const addMetalTransaction = (params: {
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
  }): { success: boolean; error?: string } => {
    const date = params.date || getTodayDateStr();
    const time = params.time || getNowTimeStr();
    const amt = Number(params.totalAmount);

    // Business check: Buying assets must only be from available free cash (liquidity)
    if (params.type === 'buy') {
      if (params.fundingSource === 'free_vault') {
        const freeVaultCash = getAvailableVaultCash();
        if (amt > freeVaultCash) {
          return {
            success: false,
            error: `عذراً! السيولة الحرة المتوفرة بالخزنة لا تكفي لتمويل هذه العملية. المتاح حالياً بالخزنة: ${Math.floor(freeVaultCash).toLocaleString()} ر.ي، والمطلوب: ${amt.toLocaleString()} ر.ي`
          };
        }
      } else {
        // From today's collected receipts
        const freeTodayCash = getTodayCurrentFreeCash();
        if (amt > freeTodayCash) {
          return {
            success: false,
            error: `عذراً! المال الحر اليومي (حركة اليوم الجارية) لا يكفي لتمويل هذا الشراء. المتاح اليوم: ${Math.floor(freeTodayCash).toLocaleString()} ر.ي، والمطلوب: ${amt.toLocaleString()} ر.ي (لا يسمح باستخدام الأموال المحجوزة للالتزامات)`
          };
        }
      }
    }
    
    const newMt: MetalTransaction = {
      id: `metal-${Date.now()}`,
      type: params.type,
      metalType: params.metalType,
      purity: params.purity,
      weight: Number(params.weight),
      pricePerUnit: Number(params.pricePerUnit),
      totalAmount: amt,
      date,
      time,
      notes: params.notes?.trim() || '',
      fundingSource: params.fundingSource,
      count: params.count ? Number(params.count) : undefined
    };

    saveMetals([...metalTransactions, newMt]);

    // Financial coupling with Vault (as asset translation, not operating expense/income):
    if (newMt.type === 'buy') {
      if (newMt.fundingSource === 'free_vault') {
        const currentSecuredVal = vaultTransactions.length > 0 ? vaultTransactions[vaultTransactions.length - 1].balanceAfter : 0;
        const vaultRecord: VaultTransaction = {
          id: `vt-${Date.now()}`,
          type: 'out',
          amount: amt,
          reason: `شراء معدن (${newMt.metalType === 'gold' ? 'الذهب' : 'الفضة'} عيار ${newMt.purity}) - تمويل من حر الخزنة`,
          date,
          time,
          balanceAfter: currentSecuredVal - amt,
          source: 'free_vault',
          vaultAmount: amt,
          collectedAmount: 0
        };
        saveVault([...vaultTransactions, vaultRecord]);
      } else {
        // Funded from 'collected'. Log as an outflow with source 'collected' so it is properly subtracted from today's physical drawer balance
        const currentSecuredVal = vaultTransactions.length > 0 ? vaultTransactions[vaultTransactions.length - 1].balanceAfter : 0;
        const vaultRecord: VaultTransaction = {
          id: `vt-${Date.now()}`,
          type: 'out',
          amount: amt,
          reason: `شراء معدن (${newMt.metalType === 'gold' ? 'الذهب' : 'الفضة'} عيار ${newMt.purity}) - تمويل من المقبوضات اليومية`,
          date,
          time,
          balanceAfter: currentSecuredVal, // no immediate effect on physical vault cash, but depletes daily receipts
          source: 'collected',
          vaultAmount: 0,
          collectedAmount: amt
        };
        saveVault([...vaultTransactions, vaultRecord]);
      }
    } else {
      // Selling metal brings liquidity back inside the Vault!
      const currentSecuredVal = vaultTransactions.length > 0 ? vaultTransactions[vaultTransactions.length - 1].balanceAfter : 0;
      const vaultRecord: VaultTransaction = {
        id: `vt-${Date.now()}`,
        type: 'in',
        amount: amt,
        reason: `بيع معدن (${newMt.metalType === 'gold' ? 'الذهب' : 'الفضة'} عيار ${newMt.purity}) - الوزن ${newMt.weight} جرام`,
        date,
        time,
        balanceAfter: currentSecuredVal + amt
      };
      saveVault([...vaultTransactions, vaultRecord]);
    }

    return { success: true };
  };

  // Archive active closed statements
  const archiveShopActiveTransactions = (shopId: string) => {
    // Current unarchived transactions for this shop
    const shopTx = transactions.filter(t => t.shopId === shopId && !t.isArchived);
    if (shopTx.length === 0) return;

    const shopItem = shops.find(s => s.id === shopId);
    const shopName = shopItem?.name || '';
    const archiveNum = `ARCH-${Date.now().toString().substring(7)}`;

    // Calculations of totals
    const totalTransactionsAmount = shopTx.reduce((sum, t) => sum + t.amount, 0);
    const totalCollectedAmount = shopTx.reduce((sum, t) => sum + t.receivedAmount, 0);
    const totalDebtAmount = shopTx.reduce((sum, t) => sum + (t.amount - t.receivedAmount), 0);

    const newArchive: ArchiveRecord = {
      id: `archive-${Date.now()}`,
      archiveNumber: archiveNum,
      shopId,
      shopName,
      date: getTodayDateStr(),
      time: getNowTimeStr(),
      totalTransactionsAmount,
      totalCollectedAmount,
      totalDebtAmount
    };

    saveArchives([...archives, newArchive]);

    // Update original transactions: flag isArchived as true but keep them so we can query debts later!
    const updatedTx = transactions.map(t => {
      if (t.shopId === shopId && !t.isArchived) {
        return {
          ...t,
          isArchived: true,
          archiveId: newArchive.id
        };
      }
      return t;
    });
    saveTransactions(updatedTx);
  };

  const saveCommitments = (updated: Commitment[]) => {
    setCommitments(updated);
    localStorage.setItem('dftr_commitments', JSON.stringify(updated));
  };

  const disburseCommitment = (id: string, amount: number) => {
    const target = commitments.find(c => c.id === id);
    if (!target) return;
    
    // Create an outflow with 'collected' source so it won't decrease vault's cash balance again
    addVaultOutflow(
      `صرف التزام: ${target.name}`,
      amount,
      'collected', // This source has 'no effect on physical cash' in recalculation
      getTodayDateStr(),
      getNowTimeStr()
    );
    
    const updated = commitments.map(c => {
      if (c.id === id) {
        const curBal = c.accumulatedBalance ?? 0;
        return {
          ...c,
          accumulatedBalance: Math.max(0, curBal - amount),
          lastClearedDate: getTodayDateStr()
        };
      }
      return c;
    });
    saveCommitments(updated);
  };

  const carryOverCommitment = (id: string) => {
    const updated = commitments.map(c => {
      if (c.id === id) {
        return {
          ...c,
          accruedDaysOffset: (c.accruedDaysOffset || 0) + 30
        };
      }
      return c;
    });
    saveCommitments(updated);
  };

  const updateCommitmentRate = (id: string, rate: number) => {
    const updated = commitments.map(c => {
      if (c.id === id) {
        return { ...c, dailyRate: rate };
      }
      return c;
    });
    saveCommitments(updated);
  };

  const addCommitment = (name: string, dailyRate: number) => {
    const newC: Commitment = {
      id: `commitment-${Date.now()}`,
      name,
      dailyRate,
      lastClearedDate: '',
      accumulatedBalance: 0,
      accumulatedDeficit: 0
    };
    saveCommitments([...commitments, newC]);
  };

  const closeMarketDay = (targetDate?: string) => {
    const todayStr = targetDate || getTodayDateStr();
    const timeStr = getNowTimeStr();

    // 1. Calculate today's daily income (شغل المحلات, الزبون الخارجي المستلم, الدخل الجانبي)
    const todayTransactions = transactions.filter(t => t.date === todayStr);
    const todayIncome = todayTransactions.reduce((sum, t) => sum + t.receivedAmount, 0);

    // 2. Calculate today's daily outflows from collected cash (excluding debt-on-us repayments & gold buying)
    const todayCollectedOutflows = vaultTransactions
      .filter(vt => 
        vt.date === todayStr && 
        vt.type === 'out' && 
        !vt.reason.includes('تسديد دين علينا') &&
        !vt.reason.includes('سداد دين علينا')
      )
      .reduce((sum, vt) => {
        if (vt.source === 'collected') return sum + vt.amount;
        if (vt.source === 'both') return sum + (vt.collectedAmount ?? Math.round(vt.amount / 2));
        return sum;
      }, 0);

    // 3. Extract Free Money (المال الحر)
    const freeMoney = Math.max(0, todayIncome - todayCollectedOutflows);

    // Get current available cash in vault BEFORE daily closing is applied (strictly in Yemeni Rial)
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
      
    let availableVaultCash = Math.max(0, openingYemeni + cumulativeInflows - cumulativeOutflows);

    let remainingFreeCash = freeMoney;
    let nextVaultTransactions = [...vaultTransactions];
    let totalDrawnFromVault = 0;
    let totalReservedToday = 0;
    let totalDeficitRemaining = 0;

    const updatedCommitments = commitments.map(c => {
      // dueToday is the daily rate + any previous deficit backlog
      const dueToday = c.dailyRate + (c.accumulatedDeficit || 0);
      
      // A. Try to cover from remaining free cash
      const coveredFromFree = Math.min(remainingFreeCash, dueToday);
      remainingFreeCash -= coveredFromFree;
      
      let stillDue = dueToday - coveredFromFree;
      let coveredFromVault = 0;
      
      // B. If still due, try to cover from vault cash
      if (stillDue > 0 && availableVaultCash > 0) {
        coveredFromVault = Math.min(availableVaultCash, stillDue);
        availableVaultCash -= coveredFromVault;
        stillDue -= coveredFromVault;
        totalDrawnFromVault += coveredFromVault;
        
        if (coveredFromVault > 0) {
          nextVaultTransactions.push({
            id: `vt-commit-vault-${Date.now()}-${c.id}`,
            type: 'out',
            amount: coveredFromVault,
            reason: `تغطية عجز التزام من الخزنة: ${c.name}`,
            date: todayStr,
            time: timeStr,
            balanceAfter: 0, // Recalculated below
            source: 'free_vault',
            vaultAmount: coveredFromVault,
            collectedAmount: 0
          });
        }
      }
      
      const newDeficit = stillDue;
      totalDeficitRemaining += newDeficit;
      
      const addedToBalance = coveredFromFree + coveredFromVault;
      totalReservedToday += addedToBalance;
      
      const newBalance = (c.accumulatedBalance || 0) + addedToBalance;
      
      return {
        ...c,
        accumulatedBalance: newBalance,
        accumulatedDeficit: newDeficit
      };
    });

    saveCommitments(updatedCommitments);

    const remainingNetToTransfer = remainingFreeCash;

    if (remainingNetToTransfer > 0) {
      nextVaultTransactions.push({
        id: `vt-close-net-${Date.now()}`,
        type: 'in',
        amount: remainingNetToTransfer,
        reason: 'ترحيل صافي اليوم',
        date: todayStr,
        time: timeStr,
        balanceAfter: 0 // Recalculated below
      });
    } else {
      nextVaultTransactions.push({
        id: `vt-close-empty-${Date.now()}`,
        type: 'in',
        amount: 0,
        reason: 'إغلاق اليوم المالي (لم يتبقَ ترحيل إيجابي بعد تغطية الالتزامات اليومية)',
        date: todayStr,
        time: timeStr,
        balanceAfter: 0 // Recalculated below
      });
    }

    // Recalculate balanceAfter sequences correctly (strictly in Yemeni Rial)
    let runningBalance = openingYemeni;
                         
    const recalculated = nextVaultTransactions.map(vt => {
      if (vt.type === 'in') {
        runningBalance += vt.amount;
      } else {
        if (vt.source === 'collected') {
          // no effect on physical cash
        } else if (vt.source === 'both') {
          runningBalance -= (vt.vaultAmount ?? Math.round(vt.amount / 2));
        } else {
          runningBalance -= vt.amount;
        }
      }
      return { ...vt, balanceAfter: runningBalance };
    });

    saveVault(recalculated);

    // Also archive today's transactions to lock them
    const updatedTx = transactions.map(tx => {
      if (tx.date === todayStr) {
        return { ...tx, isArchived: true };
      }
      return tx;
    });
    saveTransactions(updatedTx);

    return {
      success: true,
      income: todayIncome,
      outflows: todayCollectedOutflows,
      freeMoney,
      reserved: totalReservedToday,
      drawnFromVault: totalDrawnFromVault,
      netTransferred: remainingNetToTransfer,
      totalDeficit: totalDeficitRemaining
    };
  };

  const resetAllData = () => {
    localStorage.removeItem('dftr_shops');
    localStorage.removeItem('dftr_transactions');
    localStorage.removeItem('dftr_trusts');
    localStorage.removeItem('dftr_vault');
    localStorage.removeItem('dftr_metals');
    localStorage.removeItem('dftr_archives');
    localStorage.removeItem('dftr_commitments');
    localStorage.removeItem('dftr_settings');
    localStorage.removeItem('dftr_camouflage');
    localStorage.removeItem('dftr_reset_pure_v5');
    window.location.reload();
  };

  const resetAllExceptDebts = () => {
    // 1. Keep only transactions that are debts (credit transactions with remaining amount > 0)
    const activeDebts = transactions.filter(t => 
      t.paymentMethod === 'credit' && 
      (t.receivedAmount ?? 0) < t.amount
    );
    setTransactions(activeDebts);
    localStorage.setItem('dftr_transactions', JSON.stringify(activeDebts));

    // 2. Clear vault transactions completely
    setVaultTransactions([]);
    localStorage.setItem('dftr_vault', JSON.stringify([]));

    // 3. Clear metal transactions completely
    setMetalTransactions([]);
    localStorage.setItem('dftr_metals', JSON.stringify([]));

    // 4. Clear archives
    setArchives([]);
    localStorage.setItem('dftr_archives', JSON.stringify([]));

    // 5. Keep only active trusts (available status), clear delivered ones
    const activeTrusts = trusts.filter(t => t.status === 'available');
    setTrusts(activeTrusts);
    localStorage.setItem('dftr_trusts', JSON.stringify(activeTrusts));

    // 6. Reset commitments (accumulatedBalance = 0, accumulatedDeficit = 0)
    const updatedCommitments = commitments.map(c => ({
      ...c,
      accumulatedBalance: 0,
      accumulatedDeficit: 0,
      lastClearedDate: ''
    }));
    setCommitments(updatedCommitments);
    localStorage.setItem('dftr_commitments', JSON.stringify(updatedCommitments));

    // 7. Reset settings opening balances (keeping user name, theme, preset tasks, exchange rates, etc.)
    const updatedSettings = {
      ...settings,
      openingBalanceYemeni: 0,
      openingBalanceSaudi: 0,
      openingBalanceUsd: 0,
      hasEnteredOpeningBalance: false
    };
    setSettings(updatedSettings);
    localStorage.setItem('dftr_settings', JSON.stringify(updatedSettings));

    window.location.reload();
  };

  return {
    shops,
    transactions,
    trusts,
    vaultTransactions,
    metalTransactions,
    archives,
    commitments,
    disburseCommitment,
    carryOverCommitment,
    updateCommitmentRate,
    addCommitment,
    resetAllData,
    resetAllExceptDebts,
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
    isWorkerNameUnique
  };
}
