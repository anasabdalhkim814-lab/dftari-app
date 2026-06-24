import React, { useState } from 'react';
import { ArchiveRecord, Transaction } from '../types';
import { Archive, FileSpreadsheet, Calendar, Search, Clipboard, Clock } from 'lucide-react';

interface ArchiveSectionProps {
  archives: ArchiveRecord[];
  transactions: Transaction[];
  camouflage: boolean;
}

export default function ArchiveSection({ archives, transactions, camouflage }: ArchiveSectionProps) {
  // Selected archive record for deep viewing
  const [activeArchiveId, setActiveArchiveId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const filteredArchives = archives.filter(item => {
    const searchLower = searchText.toLowerCase();
    return item.shopName.toLowerCase().includes(searchLower) || item.archiveNumber.toLowerCase().includes(searchLower);
  });

  // Query transactions linked directly to the expanded archive
  const archiveTx = transactions.filter(t => t.archiveId === activeArchiveId);

  const formatMoney = (val: number) => {
    return `${val.toLocaleString()} ريال`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-slate-100 animate-fade-in" dir="rtl">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Archive size={20} className="text-yellow-500" />
            <span>أرشيف كشوفات الحسابات المقفلة</span>
          </h3>
          <p className="text-xs text-slate-400">مظهر مخصص لمراجعة كل الكشوف الحسابية التاريخية التي تم إقفالها وترحيلها كعهد مسلمة.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-2.5 text-slate-500" size={15} />
          <input
            type="text"
            placeholder="البحث باسم المحل أو رقم الأرشيف..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-500 w-64"
            id="archive-search-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of archives column */}
        <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl space-y-3 lg:col-span-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">فهرس الكشوفات المرحلة</span>
          
          <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
            {filteredArchives.map(record => {
              const isActive = record.id === activeArchiveId;
              return (
                <button
                  key={record.id}
                  onClick={() => setActiveArchiveId(isActive ? null : record.id)}
                  className={`w-full text-right p-4 rounded-xl border transition duration-150 flex flex-col space-y-2 ${
                    isActive 
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold font-mono">{record.archiveNumber}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{record.date}</span>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-100">{record.shopName}</span>
                    <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-bold">{formatMoney(record.totalCollectedAmount)}</span>
                  </div>
                </button>
              );
            })}
            {filteredArchives.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">لا توجد كشوفات مرحلة ومؤرشفة مطابقة للتفتيش حالياً.</div>
            )}
          </div>
        </div>

        {/* Detailed archive audit lookups workspace */}
        <div className="lg:col-span-2 bg-slate-950/20 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          {activeArchiveId ? (
            (() => {
              const selectedRec = archives.find(a => a.id === activeArchiveId);
              if (!selectedRec) return null;
              return (
                <div className="space-y-6">
                  {/* Metadata header */}
                  <div className="border-b border-slate-800 pb-4 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-100 text-md">أرشيف حساب: {selectedRec.shopName}</h4>
                      <span className="font-mono text-xs bg-slate-800 px-2.5 py-0.5 rounded text-yellow-500 font-bold">{selectedRec.archiveNumber}</span>
                    </div>
                    <div className="text-[10px] text-slate-505 font-mono flex items-center gap-1 text-slate-400">
                      <Clock size={11} />
                      <span>تاريخ الأرشفة والإقفال المالي: {selectedRec.date} في {selectedRec.time}</span>
                    </div>
                  </div>

                  {/* Totals saved at the moment of archiving */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <span className="text-[9px] text-slate-400 block font-bold">إجمالي الأعمال المترجمة</span>
                      <span className="text-xs font-bold font-mono text-slate-150 block mt-1">{formatMoney(selectedRec.totalTransactionsAmount)}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <span className="text-[9px] text-slate-400 block font-bold text-emerald-400">المبلغ المقبوض حينه</span>
                      <span className="text-xs font-bold font-mono text-emerald-450 text-emerald-400 block mt-1">{formatMoney(selectedRec.totalCollectedAmount)}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg">
                      <span className="text-[9px] text-slate-400 block font-bold text-rose-400">الآجل المرحل كدين</span>
                      <span className="text-xs font-bold font-mono text-rose-450 text-rose-400 block mt-1">{formatMoney(selectedRec.totalDebtAmount)}</span>
                    </div>
                  </div>

                  {/* List transactions under this archive code */}
                  <div className="space-y-3">
                    <span className="text-[11px] text-slate-350 font-bold block border-b border-slate-900 pb-1">العمليات التاريخية المندرجة تحت هذا الكود</span>
                    
                    <div className="overflow-x-auto rounded-lg border border-slate-900">
                      <table className="w-full text-right text-xs text-slate-400">
                        <thead className="bg-slate-950 text-slate-500">
                          <tr>
                            <th className="p-2.5">الشغل صياغياً</th>
                            <th className="p-2.5">النقاط</th>
                            <th className="p-2.5">عامل المندوبية</th>
                            <th className="p-2.5">حقوق السعر</th>
                            <th className="p-2.5">طريقة الدفع</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-medium">
                          {archiveTx.map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-900">
                              <td className="p-2.5 text-slate-200 font-semibold">{tx.description}</td>
                              <td className="p-2.5">{tx.points ? `${tx.points} نقاط` : '-'}</td>
                              <td className="p-2.5">{tx.workerName || 'طاقم العمل'}</td>
                              <td className="p-2.5 font-mono text-slate-300 font-bold">{formatMoney(tx.amount)}</td>
                              <td className="p-2.5">
                                {tx.paymentMethod === 'cash' ? (
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">نقدي</span>
                                ) : (
                                  <span className="text-[9px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-bold">آجل</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-24 text-slate-500 text-xs flex flex-col items-center justify-center space-y-3 col-span-2">
              <FileSpreadsheet size={40} className="text-slate-700" />
              <span>الرجاء انتقاء أحد الأكواد والمجاميع المرحلة من القائمة الجانبية لقيد المراجعة الجنائية والمحاسبية.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
