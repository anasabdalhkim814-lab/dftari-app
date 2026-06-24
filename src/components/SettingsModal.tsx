import React, { useState } from 'react';
import { AppSettings } from '../types';
import { X, Save, Sparkles, Sliders, Calendar, User, Palette, Download, Upload, Plus, Trash2, Edit2, Check, Shield, Lock, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (updated: AppSettings) => void;
  onClose: () => void;
  onReset: () => void;
  onResetExceptDebts: () => void;
}

export default function SettingsModal({ settings, onSave, onClose, onReset, onResetExceptDebts }: SettingsModalProps) {
  const [hijriOffset, setHijriOffset] = useState(settings.hijriDateOffset);
  const [userName, setUserName] = useState(settings.userName || '');
  const [themeColor, setThemeColor] = useState<'white' | 'black' | 'gray' | 'brown'>(settings.themeColor || 'white');
  const [customSupp, setCustomSupp] = useState(settings.customSupplication || '');
  const [useCustomSupp, setUseCustomSupp] = useState(settings.useCustomSupplication || false);
  const [presetTasks, setPresetTasks] = useState<string[]>(settings.presetTasks || []);
  const [newPresetTask, setNewPresetTask] = useState('');
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState('');

  // New local states for currencies conversion rates and reserved days
  const [sarRate, setSarRate] = useState(settings.sarRate || 380);
  const [usdRate, setUsdRate] = useState(settings.usdRate || 1420);
  const [reservedDays, setReservedDays] = useState(settings.reservedDays !== undefined ? settings.reservedDays : new Date().getDate());

  const handleDownloadZip = () => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'smart_ledger_project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleAddPresetTask = () => {
    const value = newPresetTask.trim();
    if (!value) return;
    if (presetTasks.includes(value)) {
      alert('تفصيل العمل هذا موجود بالفعل في القائمة!');
      return;
    }
    setPresetTasks([...presetTasks, value]);
    setNewPresetTask('');
  };

  const handleRemovePresetTask = (index: number) => {
    const taskName = presetTasks[index];
    const conf = window.confirm(`هل أنت متأكد من حذف تفصيل العمل "${taskName}" من القائمة؟`);
    if (!conf) return;
    setPresetTasks(presetTasks.filter((_, idx) => idx !== index));
    if (editingTaskIndex === index) {
      setEditingTaskIndex(null);
    }
  };

  const handleStartEditTask = (index: number, val: string) => {
    setEditingTaskIndex(index);
    setEditingTaskValue(val);
  };

  const handleSaveEditTask = (index: number) => {
    const value = editingTaskValue.trim();
    if (!value) return;
    const updated = [...presetTasks];
    updated[index] = value;
    setPresetTasks(updated);
    setEditingTaskIndex(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave({
      hijriDateOffset: Number(hijriOffset),
      customSupplication: customSupp.trim(),
      useCustomSupplication: useCustomSupp,
      userName: userName.trim(),
      themeColor: themeColor,
      presetTasks: presetTasks,
      sarRate: Number(sarRate) || 380,
      usdRate: Number(usdRate) || 1420,
      reservedDays: Number(reservedDays) !== undefined ? Number(reservedDays) : new Date().getDate()
    });
    onClose();
  };

  // 1. Export Backup to JSON file
  const handleExportBackup = () => {
    const keysToBackUp = [
      'dftr_shops',
      'dftr_transactions',
      'dftr_trusts',
      'dftr_vault',
      'dftr_metals',
      'dftr_archives',
      'dftr_commitments',
      'dftr_settings',
      'dftr_camouflage'
    ];
    
    const backupObj: Record<string, string | null> = {};
    keysToBackUp.forEach(k => {
      backupObj[k] = localStorage.getItem(k);
    });

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    const formattedDate = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `dftari_backup_${formattedDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Import Backup from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmation = window.confirm(
      "🚨 تنبيه هام للحماية:\n" +
      "استيراد نسخة احتياطية سيقوم باستبدال وحذف كافة البيانات الحالية على هذا المتصفح تماماً!\n\n" +
      "هل أنت متأكد من رغبتك في استيراد هذه النسخة من الملف؟"
    );

    if (!confirmation) {
      e.target.value = ''; // Clear value
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupObj = JSON.parse(event.target?.result as string);
        const keys = Object.keys(backupObj);

        // Simple validation to check if this is indeed our backup structure
        if (!keys.some(k => k.startsWith('dftr_'))) {
          alert('الملف الذي قمت برفعه لا يبدو ملفاً احتياطياً صحيحاً لتطبيق دفتري!');
          return;
        }

        // Save keys to localStorage
        Object.entries(backupObj).forEach(([key, val]) => {
          if (val !== null) {
            localStorage.setItem(key, val as string);
          }
        });

        alert('✅ تم استعادة البيانات (المحلات، اليومية، الأرشيف، الخزنة، الأصول، الديون، الالتزامات والذهب والفضة والضبط) بنجاح! سيتم تحديث الصفحة فوراً لتطبيق البيانات الجديدة.');
        window.location.reload();
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية. يرجى التحقق من صحة الملف.');
      }
    };
    reader.readAsText(file);
  };

  // Styling helper for custom colors
  const colorOptions = [
    { id: 'white', label: 'أبيض 🤍', hex: 'bg-white border border-slate-300 ring-slate-100' },
    { id: 'black', label: 'أسود 🖤', hex: 'bg-black ring-zinc-700 text-white' },
    { id: 'gray', label: 'رمادي 🩶', hex: 'bg-slate-500 ring-slate-400 text-white' },
    { id: 'brown', label: 'بني 🤎', hex: 'bg-[#5c4331] ring-[#785842] text-white' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-slate-800" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
              <Sliders size={18} />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">إعدادات وضبط التطبيق</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleSubmit()}
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all duration-150 cursor-pointer text-[12px] sm:text-xs"
              title="حفظ كافة الإعدادات والضبط"
            >
              <Save size={13} />
              <span>حفظ الإعدادات ✅</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
              id="close-settings-btn"
              type="button"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Privacy & User Independence Note */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 space-y-2 text-slate-800 text-[11px] leading-relaxed">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold pb-1.5 border-b border-emerald-100">
              <Shield size={16} className="text-emerald-600 shrink-0" />
              <span>استقلالية المستخدم التامة وحماية الخصوصية 🔐</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 font-sans font-medium">
              <li><strong className="text-slate-800">بياناتك على جهازك فقط:</strong> كل هاتف أو جهاز له بياناته ومعاملاته الخاصة والمستقلة تماماً.</li>
              <li><strong className="text-slate-800">حماية الخصوصية:</strong> لا توجد خوادم خارجية ولا يتم رفع أي حسابات ومبيعات أو ديون للإنترنت منعاً للتجسس أو الاختراق.</li>
              <li><strong className="text-slate-800">ميزة الحفظ والاستعادة:</strong> عليك تصدير نسخة احتياطية دورياً (.json) لحمايتها من الضياع عند تهيئة الهاتف ثم إعادة استيرادها بثوانٍ.</li>
            </ul>
          </div>

          {/* User Name Setting */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <User size={15} className="text-amber-500" />
              <span>اسم المستخدم / اسم الصائغ</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="مثال: جهاد اليافعي"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              id="settings-username-input"
            />
            <p className="text-[10px] text-slate-400 font-sans">يستخدم لترحيب مخصص في لافتة اليومية والواجهة الرئيسية.</p>
          </div>

          {/* Theme Color Selector (4 custom Colors) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Palette size={15} className="text-amber-500" />
              <span>ألوان الواجهة والأزرار (شعار التطبيق الخاص بك)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {colorOptions.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setThemeColor(col.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-left transition duration-150 cursor-pointer text-xs font-bold ${
                    themeColor === col.id 
                      ? 'border-slate-850 bg-slate-100 ring-2 ring-amber-500/10 font-bold text-slate-900 border-amber-500' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${col.hex} flex-shrink-0`} />
                  <span>{col.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency Rates & Reservation Days settings */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
              <span>ضبط أسعار الصرف وحساب الأيام التراكمية للخزنة</span>
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 block">سعر صرف الريال السعودي (باليمني)</label>
                <input
                  type="number"
                  value={sarRate}
                  onChange={e => setSarRate(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-bold focus:outline-none"
                  placeholder="380"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 block">سعر صرف الدولار الأمريكي (باليمني)</label>
                <input
                  type="number"
                  value={usdRate}
                  onChange={e => setUsdRate(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-bold focus:outline-none"
                  placeholder="1420"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 block">عدد الأيام التراكمية لحجز مخصصات الأمان (الخزنة)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={reservedDays}
                  onChange={e => setReservedDays(Number(e.target.value) || 0)}
                  className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-bold focus:outline-none text-center"
                  placeholder="30"
                />
                <span className="text-[11px] text-slate-400 font-sans">يوماً (تعتمد لتراكم الحجز اليومي: الإيجار، القرض، الجمعية، الإدخار، الطوارئ)</span>
              </div>
            </div>
          </div>

          {/* Hijri Calendar Offset */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar size={15} className="text-amber-500" />
              <span>تعديل التاريخ الهجري (بالأيام)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={hijriOffset}
                onChange={e => setHijriOffset(parseInt(e.target.value) || 0)}
                className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 text-center text-xs font-bold focus:outline-none"
                id="hijri-offset-input"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setHijriOffset(prev => prev - 1)}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-bold transition"
                >
                  - يوم
                </button>
                <button
                  type="button"
                  onClick={() => setHijriOffset(prev => prev + 1)}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-bold transition"
                >
                  + يوم
                </button>
              </div>
            </div>
          </div>

          {/* Prayers / Supplications */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <Sparkles size={15} className="text-amber-500" />
                <span>شاشة الدعاء اليومي على التطبيق</span>
              </span>
              <input
                type="checkbox"
                checked={useCustomSupp}
                onChange={e => setUseCustomSupp(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 border-slate-300 focus:ring-0 cursor-pointer"
                id="use-custom-supp-checkbox"
              />
            </label>
            {useCustomSupp && (
              <textarea
                value={customSupp}
                onChange={e => setCustomSupp(e.target.value)}
                rows={2}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 text-xs font-bold focus:outline-none"
                placeholder="أدخل بركة وتثبيت الدعاء المخصص هنا..."
                required
                id="custom-supp-textarea"
              />
            )}
          </div>

          {/* Preset Tasks Management */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
              <Sliders size={15} className="text-amber-500" />
              <span>قائمة تفاصيل العمل الشائعة مسبقة الحفظ</span>
            </label>
            <p className="text-[10px] text-slate-500 font-sans">
              يمكنك إضافة أو تعديل أو حذف الأوصاف ليتم تكرار استخدامها بلمسة سريعة في حقل تفاصيل العمل.
            </p>

            {/* List current tasks */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {presetTasks.map((task, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs gap-2">
                  {editingTaskIndex === idx ? (
                    <input
                      type="text"
                      value={editingTaskValue}
                      onChange={e => setEditingTaskValue(e.target.value)}
                      className="flex-1 border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <span className="font-bold text-slate-800">{task}</span>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    {editingTaskIndex === idx ? (
                      <button
                        type="button"
                        onClick={() => handleSaveEditTask(idx)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="حفظ التعديل"
                      >
                        <Check size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEditTask(idx, task)}
                        className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                        title="تعديل"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePresetTask(idx)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      title="حذف"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {presetTasks.length === 0 && (
                <p className="text-[11px] text-slate-400 text-center py-2">لا توجد تفاصيل عمل محفوظة حالياً.</p>
              )}
            </div>

            {/* Add new task input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newPresetTask}
                onChange={e => setNewPresetTask(e.target.value)}
                placeholder="إضافة تفصيل جديد..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddPresetTask}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
              >
                <Plus size={14} />
                <span>إضافة</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="space-y-3 bg-amber-50/20 p-4 rounded-xl border border-amber-200/70">
            <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 pb-2 border-b border-amber-100/60">
              <Download size={14} className="text-amber-600" />
              <span>النسخ الاحتياطي وحفظ الملفات للأمان</span>
            </h4>
            <p className="text-[10px] text-slate-550 leading-relaxed font-sans text-slate-500">
              يمكنك تصدير كشوفاتك كملف للكمبيوتر أو الجوال لحمايتها في حال حذف التخزين المؤقت للمتصفح، ثم استعادتها في أي وقت بضغطة واحدة:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {/* Backup Button */}
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 bg-amber-100 hover:bg-amber-200/80 text-amber-800 font-bold py-2 px-3 rounded-lg text-xs transition duration-150 flex items-center justify-center gap-1.5 border border-amber-200 cursor-pointer"
                title="تنزيل ملف النسخة الاحتياطية للهاتف أو الجهاز"
              >
                <Download size={14} />
                <span>تصدير نسخة احتياطية (.json)</span>
              </button>

              {/* Restore Button */}
              <label className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs transition duration-150 flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer hover:border-slate-400">
                <Upload size={14} className="text-slate-550" />
                <span>استيراد نسخة وتثبيتها</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Export Full Project ZIP */}
          <div className="space-y-3 bg-emerald-50/20 p-4 rounded-xl border border-emerald-200/70">
            <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 pb-2 border-b border-emerald-100/60">
              <Sparkles size={14} className="text-emerald-600" />
              <span>تحميل الكود المصدري الكامل للتطبيق (ZIP)</span>
            </h4>
            <p className="text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
              يحتوي هذا الملف المضغوط على كامل ملفات المشروع مع إعدادات <strong>Capacitor Android</strong> المجهزة جاهزة كلياً للعمل بدون إنترنت وحفظ البيانات ذاتياً. يمكنك تنزيله وبناء ملف الـ APK الخاص بالهاتف في أي وقت:
            </p>
            
            <button
              onClick={handleDownloadZip}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm border-0"
              title="اضغط لتحميل الكود المصدري الكامل للمشروع كملف ZIP"
            >
              <Download size={15} />
              <span>تحميل ملف الكود المصدري الكامل (ZIP) جاهز للاستخدام والتشفير</span>
            </button>
          </div>

          {/* Danger Zone: Hard reset data to zero */}
          <div className="space-y-4 bg-rose-50/40 p-4 rounded-xl border border-rose-200">
            <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 pb-2 border-b border-rose-100">
              <Trash2 size={14} className="text-rose-600" />
              <span>منطقة تهيئة وتصفير النظام لبدء العمل</span>
            </h4>
            
            <div className="space-y-2">
              <p className="text-[10px] leading-relaxed font-sans text-amber-800 font-bold">
                خيارات تصفير وتطهير الحسابات الجارية للتجربة:
              </p>
              
              {/* Option 1: Reset All except Debts */}
              <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg space-y-1.5">
                <p className="text-[10px] text-slate-600 leading-normal font-sans">
                  <strong>الخيار الأول:</strong> تصفير كافة الحركات والعمليات، وإخلاء الصندوق والذهب والفضة والالتزامات للصفر، مع <strong>الحفاظ الكامل على سجل الديون المستحقة بذمتها وأمانات الزبائن المستمرة</strong> لبدء التشغيل الفعلي.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من تصفير كافة الأرصدة والعمليات مع الحفاظ فقط على الديون المستحقة والأمانات الجارية؟ لا يمكن التراجع عن هذا الإجراء!')) {
                      onResetExceptDebts();
                    }
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 px-3 rounded-lg text-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border-0"
                >
                  <Sparkles size={14} />
                  <span>تصفير الحسابات والأرقام (باستثناء سجل الدين)</span>
                </button>
              </div>

              {/* Option 2: Hard reset everything */}
              <div className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1.5">
                <p className="text-[10px] text-slate-600 leading-normal font-sans">
                  <strong>الخيار الثاني (شامل):</strong> حذف كلي شامل للمحلات، العمال، الديون، الأمانات، الخزنة، والمعدن للبدء بصفحة بيضاء فارغة تماماً.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد تماماً من تصفير كافة الحسابات وحذف جميع العمليات والبادرة بكشف فارغ تماماً؟ لا يمكن التراجع عن هذا الإجراء!')) {
                      onReset();
                    }
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border-0"
                >
                  <Trash2 size={14} />
                  <span>حذف وتصفير كافة البيانات بشكل كلي شامل</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 transition text-slate-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
              id="save-settings-btn"
            >
              <Save size={16} />
              <span>حفظ التغييرات المعتمدة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl transition border border-slate-200 font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
