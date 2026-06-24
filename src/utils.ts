import { Transaction, Trust, VaultTransaction, MetalTransaction } from './types';

// Native Arabic Hijri date formatter with offset
export function getHijriDate(offsetDays: number = 0): string {
  try {
    const date = new Date();
    if (offsetDays !== 0) {
      date.setDate(date.getDate() + offsetDays);
    }
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formatter.format(date);
  } catch (error) {
    // Fallback if local browser environment limits islamic-umalqura
    return "١٩ ذو الحجة ١٤٤٧ هـ";
  }
}

// Collection of inspirational Arabic supplications for work, blessing, and success
export const DAILY_SUPPLICATIONS = [
  "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا.",
  "اللَّهُمَّ بَارِكْ لَنَا فِي أَرْزَاقِنَا، وَاجْعَلْ عَمَلَنَا خَالِصًا لِوَجْهِكَ الْكَرِيمِ.",
  "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ.",
  "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ.",
  "اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا.",
  "بِسْمِ اللهِ تَوَكَّلْتُ عَلَى اللهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الرَّحْمَنِ الرَّحِيمِ.",
  "اللَّهُمَّ افْتَحْ لَنَا أَبْوَابَ رَحْمَتِكَ، وَأَنْبِتْ عَلَيْنَا مِنْ كَرَمِكَ وَبَرَكَاتِ عَمَلِنَا الْبَدِيعِ.",
  "رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي.",
  "اللَّهُمَّ ارْزُقْنَا بَرَكَةً فِي الْعُمْرِ، وَمُتَّسَعًا فِي الرِّزْقِ، وَتَوْفِيقًا صَافِيًا فِي الْعَمَلِ.",
  "يَا رَبِّ تَقَبَّلْ مِنَّا صَالِحَ الأَعْمَالِ وَاجْعَلْ بَاعِثَ مَعِيشَتِنَا الْخَيْرَ وَبَارِكْ لَنَا فِي كُلِّ خُطْوَةٍ."
];

export function getRandomSupplication(): string {
  const randomIndex = Math.floor(Math.random() * DAILY_SUPPLICATIONS.length);
  return DAILY_SUPPLICATIONS[randomIndex];
}

// Text share formatter for a specific Debt operation
export function getShareTextForDebt(tx: Transaction, shopName?: string): string {
  const header = `📋 *تفاصيل مطالبة مالية - دفتري الذكي* 📋\n`;
  const info = `
👤 *المستهدف:* ${tx.type === 'shop' ? `محل ${shopName || tx.shopName || ''} - العامل ${tx.workerName || ''}` : 'زبون خارجي'}
🔨 *تفاصيل العمل:* ${tx.description}
📅 *تاريخ العملية:* ${tx.date}
💰 *المبلغ الأصلي:* ${tx.amount} ريال
💵 *المستلم:* ${tx.receivedAmount} ريال
⏳ *الباقي المستحق:* ${tx.amount - tx.receivedAmount} ريال
📊 *الحالة:* ${tx.debtStatus === 'unpaid' ? '🔴 غير مسدد' : tx.debtStatus === 'partial' ? '🟡 مسدد جزئياً' : '🟢 مسدد بالكامل'}
${tx.deliveryDate ? `📆 *تاريخ السداد:* ${tx.deliveryDate} ${tx.deliveryTime || ''}` : ''}
  `;
  const footer = `\n_تم التوليد تلقائياً عبر نظام دفتري الذكي_`;
  return `${header}${info.trim()}${footer}`;
}

// Text share formatter for a Shop Account Statement
export function getShareTextForStatement(shopName: string, transactions: Transaction[], totals: { totalCollected: number, totalDebt: number, totalAmount: number }): string {
  const header = `🏪 *كشف حساب محل: ${shopName} - دفتري الذكي* 🏪\n`;
  
  let txList = ``;
  transactions.forEach((tx, idx) => {
    txList += `${idx + 1}. ${tx.description} | ${tx.amount} ريال (${tx.paymentMethod === 'cash' ? 'نقداً' : 'آجل'})\n   📅 ${tx.date} | العامل: ${tx.workerName || 'طاقم العمل'}\n`;
  });

  if (transactions.length === 0) {
    txList = `_لا توجد عمليات مسجلة حالياً_\n`;
  }

  const summary = `
\n📈 *ملخص الحساب الحالي:*
💰 *إجمالي العمليات المنجزة:* ${totals.totalAmount} ريال
💵 *إجمالي المستلم (النقدي والمسدد):* ${totals.totalCollected} ريال
⏳ *إجمالي الآجل المتبقي:* ${totals.totalDebt} ريال
  `;
  const footer = `\n_تاريخ الكشف: ${new Date().toLocaleDateString('ar-YE')}_ \n_تم التوليد عبر نظام دفتري الذكي_`;
  return `${header}${'═'.repeat(30)}\n${txList}${'═'.repeat(30)}${summary}${footer}`;
}

// Text share formatter for Vault movements sheet
export function getShareTextForVault(logs: VaultTransaction[], balance: number): string {
  const header = `🗄️ *كشف حركة الخزنة - دفتري الذكي* 🗄️\n`;
  
  let logList = ``;
  logs.slice(0, 15).forEach((log, idx) => {
    const sign = log.type === 'in' ? '🟢دخل' : '🔴خرج';
    logList += `${idx + 1}. [${sign}] ${log.reason} \n   💰 ${log.amount} ريال | 📅 ${log.date} ${log.time}\n`;
  });

  const summary = `
\n💵 *الرصيد الفعلي الحالي في الخزنة:* ${balance} ريال
  `;
  const footer = `\n_تم التوليد تلقائياً عبر نظام دفتري الذكي_`;
  return `${header}${'═'.repeat(30)}\n${logList}${'═'.repeat(30)}${summary}${footer}`;
}

// Text share formatter for dynamic Trust assets
export function getShareTextForTrust(trust: Trust): string {
  const header = `📦 *إيصال أمانة - دفتري الذكي* 📦\n`;
  const info = `
📝 *الوصف:* ${trust.description}
🔑 *نوع الأمانة:* ${trust.type === 'cash' ? '💵 مادية/نقدية' : '💎 عينية'}
💰 *القيمة:* ${trust.amount} ريال
👤 *الجهة المستلم منها:* ${trust.party || 'غير محدد'}
📅 *تاريخ الإيداع:* ${trust.date} - ${trust.time}
📊 *الحالة الحالية:* ${trust.status === 'available' ? '🔒 محفوظة لدينا' : '✅ تم تسليمها لصاحبها'}
${trust.deliveredDate ? `📅 *تاريخ التسليم:* ${trust.deliveredDate} - ${trust.deliveredTime || ''}` : ''}
  `;
  const footer = `\n_نحن ملتزمون بالأمانة وحفظ الحقوق_ \n_تم التوليد تلقائياً عبر نظام دفتري الذكي_`;
  return `${header}${info.trim()}${footer}`;
}
