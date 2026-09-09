import React, { useState, useEffect } from 'react';
import { ApkBuildHistoryItem } from '../types';
import { BuildEditFormValues } from '../utils/historyStorage';
import { 
  Edit3, 
  X, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  FileCode, 
  Package, 
  Tag, 
  Layers, 
  Cpu, 
  FileText,
  Hammer
} from 'lucide-react';

interface EditBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildItem: ApkBuildHistoryItem | null;
  onSaveAndRebuild: (updatedValues: BuildEditFormValues, autoRunBuild: boolean) => void;
  language: 'ur' | 'en';
}

export const EditBuildModal: React.FC<EditBuildModalProps> = ({
  isOpen,
  onClose,
  buildItem,
  onSaveAndRebuild,
  language,
}) => {
  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [versionName, setVersionName] = useState('');
  const [versionCode, setVersionCode] = useState(1);
  const [compileSdk, setCompileSdk] = useState(34);
  const [minSdk, setMinSdk] = useState(24);
  const [variant, setVariant] = useState<'debug' | 'release'>('debug');
  const [greetingText, setGreetingText] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-populate when buildItem changes
  useEffect(() => {
    if (buildItem) {
      setAppName(buildItem.appName || 'GitHub Action APK');
      setPackageName(buildItem.packageName || 'com.example.githubactionapk');
      setVersionName(buildItem.versionName || '1.0.0');
      setVersionCode(buildItem.versionCode || 1);
      setVariant(buildItem.variant || 'debug');
      setGreetingText('Welcome to Updated Android App!');
      setNotes(`Modification of ${buildItem.id}: Version updated.`);
      setCompileSdk(34);
      setMinSdk(24);
    }
  }, [buildItem]);

  if (!isOpen || !buildItem) return null;

  // Bump version helpers
  const handleBumpMinorVersion = () => {
    const parts = versionName.split('.').map((p) => parseInt(p, 10) || 0);
    while (parts.length < 3) parts.push(0);
    parts[2] = parts[2] + 1;
    setVersionName(parts.join('.'));
    setVersionCode((prev) => prev + 1);
  };

  const handleBumpMajorVersion = () => {
    const parts = versionName.split('.').map((p) => parseInt(p, 10) || 0);
    while (parts.length < 3) parts.push(0);
    parts[1] = parts[1] + 1;
    parts[2] = 0;
    setVersionName(parts.join('.'));
    setVersionCode((prev) => prev + 1);
  };

  const handleSubmit = (autoRun: boolean) => {
    onSaveAndRebuild(
      {
        appName: appName.trim() || 'Android App',
        packageName: packageName.trim() || 'com.example.app',
        versionName: versionName.trim() || '1.0.0',
        versionCode: versionCode > 0 ? versionCode : 1,
        compileSdk,
        minSdk,
        variant,
        greetingText: greetingText.trim(),
        notes: notes.trim() || `Modified build based on ${buildItem.id}`,
      },
      autoRun
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  {language === 'ur'
                    ? 'پچھلی APK بلڈ میں تبدیلی کریں (Edit & Re-build)'
                    : 'Edit & Re-build Previous APK'}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                  {buildItem.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ur'
                  ? 'ایپ کا نام، ورژن، پیکیج یا کوڈ تبدیل کریں اور خودکار طریقے سے نیا APK تیار کریں'
                  : 'Modify app name, version, package, or code, then re-trigger CI/CD to generate a new APK.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Previous Build Context Card */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-500 font-medium">
                {language === 'ur' ? 'اصل بلڈ ورژن:' : 'Original Version:'}
              </span>
              <span className="font-mono font-bold text-slate-200">
                v{buildItem.versionName} (Build #{buildItem.versionCode})
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-mono">{buildItem.packageName}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Built on {buildItem.timestamp}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* App Name */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-sky-400" />
                <span>{language === 'ur' ? 'ایپ کا نیا نام (App Name):' : 'App Name (android:label):'}</span>
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My Great Android App"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {language === 'ur'
                  ? 'AndroidManifest.xml میں ایپ کا نام خودکار تبدیل ہوگا'
                  : 'Automatically updates android:label in AndroidManifest.xml'}
              </p>
            </div>

            {/* Package / Application ID */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'ur' ? 'پیکیج آئی ڈی (Package / Application ID):' : 'Application ID / Namespace:'}</span>
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="com.example.myapp"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {language === 'ur'
                  ? 'app/build.gradle.kts میں namespace اور applicationId تبدیل ہوگا'
                  : 'Updates namespace & applicationId in build.gradle.kts'}
              </p>
            </div>

            {/* Version Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ur' ? 'ورژن کا نام (Version Name):' : 'Version Name:'}</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleBumpMinorVersion}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] cursor-pointer font-bold"
                  >
                    +0.0.1
                  </button>
                  <button
                    type="button"
                    onClick={handleBumpMajorVersion}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] cursor-pointer font-bold"
                  >
                    +0.1.0
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="1.0.2"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Version Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>{language === 'ur' ? 'ورژن کوڈ (Version Code):' : 'Version Code (Integer):'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setVersionCode((prev) => prev + 1)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 text-[10px] cursor-pointer font-bold"
                >
                  +1 Bump
                </button>
              </div>
              <input
                type="number"
                min={1}
                value={versionCode}
                onChange={(e) => setVersionCode(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Target SDK & Min SDK */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {language === 'ur' ? 'ٹارگٹ و کمپائل SDK (Target & Compile SDK):' : 'Compile & Target SDK:'}
              </label>
              <select
                value={compileSdk}
                onChange={(e) => setCompileSdk(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:outline-none focus:border-sky-500"
              >
                <option value={35}>Android 15 (API 35 - Vanilla Ice Cream)</option>
                <option value={34}>Android 14 (API 34 - Upside Down Cake)</option>
                <option value={33}>Android 13 (API 33 - Tiramisu)</option>
              </select>
            </div>

            {/* Build Variant */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {language === 'ur' ? 'بلڈ کی قسم (Build Variant):' : 'Build Variant:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVariant('debug')}
                  className={`p-2 rounded-lg border font-semibold text-center transition cursor-pointer ${
                    variant === 'debug'
                      ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Debug APK
                </button>
                <button
                  type="button"
                  onClick={() => setVariant('release')}
                  className={`p-2 rounded-lg border font-semibold text-center transition cursor-pointer ${
                    variant === 'release'
                      ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Release APK
                </button>
              </div>
            </div>

          </div>

          {/* MainActivity Greeting Customizer */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {language === 'ur'
                  ? 'MainActivity کا پیغام / UI ٹیکسٹ:'
                  : 'MainActivity Display Greeting / Content Text:'}
              </span>
            </label>
            <input
              type="text"
              value={greetingText}
              onChange={(e) => setGreetingText(e.target.value)}
              placeholder="Welcome to Updated Android App!"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Change Notes / Changelog */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'ur' ? 'تبدیلیوں کی تفصیل اور نوٹس (Changelog):' : 'Changelog / Release Notes:'}</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Updated app title, bumped version to 1.0.2, and improved UI layout."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-slate-500 text-xs"
            />
          </div>

          {/* Affected Files Notice */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-slate-400 text-[11px]">
            <span className="font-semibold text-slate-300 block">
              {language === 'ur' ? 'یہ فائلیں خودکار طریقے سے اپ ڈیٹ ہوں گی:' : 'Affected Project Files:'}
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-mono text-[10px]">
              <li>app/build.gradle.kts (versionName, versionCode, applicationId, SDKs)</li>
              <li>app/src/main/AndroidManifest.xml (android:label)</li>
              <li>app/src/main/java/com/example/myapp/MainActivity.kt (greeting message)</li>
            </ul>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition cursor-pointer text-xs"
          >
            {language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl font-bold transition cursor-pointer text-xs"
            >
              {language === 'ur' ? 'صرف فائلز اپ ڈیٹ کریں' : 'Save Files Only'}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-sky-950/40 transition cursor-pointer"
            >
              <Hammer className="w-4 h-4" />
              <span>
                {language === 'ur'
                  ? 'تبدیلیاں لاگو کریں اور نیا APK بنائیں'
                  : 'Apply Changes & Re-build APK'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
