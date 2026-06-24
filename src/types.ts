export interface Shop {
  id: string;
  name: string;
  city?: string;
  phone?: string;
  workers: string[];
  pricePerPoint: number; // Price per manufacturing point
}

export interface Transaction {
  id: string;
  type: 'shop' | 'external' | 'side'; // شغل المحلات, الزبون الخارجي, الدخل الجانبي
  shopId?: string;
  shopName?: string; // Cache shop name
  workerName?: string;
  description: string; // تفاصيل العمل
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  amount: number; // المبلغ الكلي للعملية
  points?: number; // عدد الحبات أو النقاط
  pricePerPointHistorical?: number; // سعر النقطة وقت العملية
  metalType: 'gold' | 'silver' | 'none';
  paymentMethod: 'cash' | 'credit'; // نقداً أو آجل
  receivedAmount: number; // المبلغ المستلم (0 as default for credit)
  deliveryDate?: string; // تاريخ التسليم
  deliveryTime?: string; // وقت التسليم
  debtStatus?: 'unpaid' | 'partial' | 'paid'; // غير مسدد, مسدد جزئياً, مسدد بالكامل
  isArchived: boolean;
  archiveId?: string;
  isTransferredToTrust?: boolean;
  
  // حقول العملات والأصول الخاصة بـ "الدين لي"
  currency?: 'YER' | 'SAR' | 'USD' | 'gold' | 'silver' | 'asset';
  caliber?: string; // العيار (عيار 21، 18، إلخ)
  weight?: number; // الوزن بالجرام أو المثاقيل
  assetName?: string; // اسم الأصل إن وجد
  source?: string; // مصدر العملية (مثال: 'new_job')
}

export interface Trust {
  id: string;
  type: 'cash' | 'item'; // أمانة نقدية أو عينية
  description: string;
  amount: number; // القيمة أو المبلغ
  party: string; // اسم الجهة المرتبطة
  date: string;
  time: string;
  status: 'available' | 'delivered'; // موجودة أو تم التسليم
  deliveredDate?: string;
  deliveredTime?: string;
  
  // حقول جديدة لأمانات الزبائن الخارجيين
  isExternalCustomer?: boolean;
  customerName?: string;
  workDetail?: string;
  itemDescription?: string;
  estimatedValue?: number;
  amountReceivedLater?: number;
  notes?: string;
  originalTxId?: string;

  // حقول العملات والأصول الخاصة بـ "الدين علي" والأمانات العامة
  currency?: 'YER' | 'SAR' | 'USD' | 'gold' | 'silver' | 'asset';
  caliber?: string; // العيار (عيار 21، 18، إلخ)
  weight?: number; // الوزن بالجرام أو المثاقيل
  assetName?: string; // اسم الأصل
  isDebtAlayya?: boolean; // هل هو دين علي؟
}

export interface VaultTransaction {
  id: string;
  type: 'in' | 'out'; // دخل أو خرج
  amount: number;
  reason: string;
  date: string;
  time: string;
  balanceAfter: number;
  source?: 'free_vault' | 'collected' | 'both';
  vaultAmount?: number;
  collectedAmount?: number;
}

export interface MetalTransaction {
  id: string;
  type: 'buy' | 'sell'; // شراء أو بيع
  metalType: 'gold' | 'silver'; // ذهب أو فضة
  purity: string; // العيار (مثال: 21، 18، الخ)
  weight: number; // الوزن بالجرام
  pricePerUnit: number; // سعر الجرام
  totalAmount: number; // الوزن × سعر الجرام
  date: string;
  time: string;
  notes?: string;
  fundingSource?: 'collected' | 'free_vault'; // من إجمالي المستلم أو من المال في الخزنة (عند الشراء)
  count?: number; // العدد (اختياري)
}

export interface ArchiveRecord {
  id: string;
  archiveNumber: string; // رقم الكشف المؤرشف
  shopId: string;
  shopName: string;
  date: string;
  time: string;
  totalTransactionsAmount: number;
  totalCollectedAmount: number;
  totalDebtAmount: number;
}

export interface Commitment {
  id: string;
  name: string; // اسم الالتزام مثل "🏠 الإيجار"
  dailyRate: number; // المبلغ اليومي المستحق الكلي
  lastClearedDate?: string; // تاريخ آخر تصفية بالير (صرف) لتصفير العداد التراكمي
  accruedDaysOffset?: number; // ترحيل أو إبقاء
  accumulatedBalance?: number; // رصيد الحساب المالي المستقل للالتزام (المبلغ المحجوز)
  accumulatedDeficit?: number; // النقص المتراكم المستحق على الالتزام
}

export interface AppSettings {
  hijriDateOffset: number; // Adjustment for Hijri Date
  customSupplication: string; // Custom daily prayer
  useCustomSupplication: boolean;
  userName?: string; // اسم المستخدم
  themeColor?: 'white' | 'black' | 'gray' | 'brown'; // Updated color choices
  presetTasks?: string[]; // تفاصيل العمل المحفوظة
  sarRate?: number; // Saudi Riyal conversion rate (default ~140 YER)
  usdRate?: number; // US Dollar conversion rate (default ~530 YER)
  reservedDays?: number; // Accumulated days for reserved funds (default 30 or current day of the month)
  openingBalanceYemeni?: number;
  openingBalanceSaudi?: number;
  openingBalanceUsd?: number;
  hasEnteredOpeningBalance?: boolean;
}
