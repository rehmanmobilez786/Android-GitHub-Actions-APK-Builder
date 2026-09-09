import React, { useState } from 'react';
import { ApkBuildHistoryItem, AccountSecurity } from '../types';
import { generateDebugApkBlob } from '../utils/zipHandler';
import { 
  History, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Layers, 
  Package, 
  Tag, 
  Clock, 
  Copy, 
  Check, 
  ArrowRight, 
  FolderSync, 
  Sparkles, 
  ShieldAlert,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';

interface BuildHistoryViewerProps {
  history: ApkBuildHistoryItem[];
  onSelectEditBuild: (item: ApkBuildHistoryItem) => void;
  onRestoreBuildFiles: (item: ApkBuildHistoryItem) => void;
  onDeleteBuild: (id: string) => void;
  security: AccountSecurity;
  onOpenSecurityCenter: () => void;
  language: 'ur' | 'en';
}

export const BuildHistoryViewer: React.FC<BuildHistoryViewerProps> = ({
  history,
  onSelectEditBuild,
  onRestoreBuildFiles,
  onDeleteBuild,
  security,
  onOpenSecurityCenter,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedShaId, setCopiedShaId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filter history safely
  const filteredHistory = (history || []).filter((item) => {
    if (!item) return false;
    const term = (searchTerm || '').toLowerCase();
    const appName = (item.appName || '').toLowerCase();
    const packageName = (item.packageName || '').toLowerCase();
    const versionName = (item.versionName || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    const notes = (item.notes || '').toLowerCase();
    const changes = (item.changesSummary || '').toLowerCase();
    return (
      appName.includes(term) ||
      packageName.includes(term) ||
      versionName.includes(term) ||
      id.includes(term) ||
      notes.includes(term) ||
      changes.includes(term)
    );
  });

  const safeHistory = history || [];
  const totalBuilds = safeHistory.length;
  const successfulBuilds = safeHistory.filter((h) => h && h.status === 'success').length;
  const latestBuild = safeHistory[0];

  const handleCopySha = (id: string, sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedShaId(id);
    setTimeout(() => setCopiedShaId(null), 2000);
  };

  const handleDownloadApk = async (item: ApkBuildHistoryItem) => {
    if (security.status !== 'active') {
      onOpenSecurityCenter();
      return;
    }

    setDownloadingId(item.id);
    try {
      const blob = await generateDebugApkBlob(
        item.appName || 'GitHubActionApk',
        item.versionName || '1.0.0'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.apkFileName || `app-${item.variant || 'debug'}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setActionSuccessMsg(
        language === 'ur'
          ? `${item.apkFileName} کامیابی سے ڈاؤنلوڈ ہو گیا!`
          : `${item.apkFileName} successfully downloaded!`
      );
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Download APK error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Quick Summary Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>
                    {language === 'ur'
                      ? 'اینڈرائیڈ APK بلڈ ہسٹری اور ایڈیٹر'
                      : 'Android APK Build History & Modifier'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    {totalBuilds} {language === 'ur' ? 'بلڈز' : 'builds'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'ur'
                    ? 'پہلے سے تیار شدہ تمام APKs کا ریکارڈ دیکھیں، ان میں تبدیلیاں کریں، اور ایک کلک سے دوبارہ نیا APK تیار کریں'
                    : 'Review historical APK builds, modify app properties or source code, and re-generate APKs with 1-click.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-center min-w-[90px]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                {language === 'ur' ? 'کامیاب بلڈز' : 'Successful'}
              </span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {successfulBuilds} / {totalBuilds}
              </span>
            </div>

            {latestBuild && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-center min-w-[110px]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  {language === 'ur' ? 'تازہ ترین ورژن' : 'Latest Version'}
                </span>
                <span className="text-base font-bold text-sky-400 font-mono">
                  v{latestBuild.versionName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={
                language === 'ur'
                  ? 'ورژن، ایپ کا نام، یا بلڈ ID تلاش کریں...'
                  : 'Search by version, app name, package, or build ID...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {actionSuccessMsg && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-500/30 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <History className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">
              {language === 'ur' ? 'کوئی بلڈ ہسٹری نہیں ملی' : 'No Build History Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {language === 'ur'
                ? 'گٹ ہب ایکشن رنر سے ایک نیا ورک فلو چلائیں تاکہ وہ خودکار طریقے سے ہسٹری میں محفوظ ہو جائے۔'
                : 'Run a workflow in the Runner tab to generate and record your first APK build.'}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition shadow-sm space-y-3.5 group"
            >
              {/* Card Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono uppercase flex items-center gap-1.5 ${
                      item.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {item.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{item.id}</span>
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{item.appName}</span>
                      <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        v{item.versionName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        (Code: {item.versionCode})
                      </span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 block">
                      {item.packageName}
                    </span>
                  </div>
                </div>

                {/* Right Metadata */}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{item.timestamp}</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-sans font-semibold">
                    {(item.variant || 'debug').toUpperCase()} APK
                  </span>
                </div>
              </div>

              {/* Notes / Changes Summary */}
              {(item.changesSummary || item.notes) && (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200 block text-[11px]">
                      {language === 'ur' ? 'بلڈ نوٹس اور تبدیلیاں:' : 'Build Notes & Modifications:'}
                    </span>
                    <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                      {item.changesSummary || item.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Artifact & Hash Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                <div className="flex items-center justify-between px-2">
                  <span className="text-slate-500 text-[11px]">
                    {language === 'ur' ? 'فائل کا نام:' : 'Artifact:'}
                  </span>
                  <span className="text-slate-300 font-semibold">{item.apkFileName}</span>
                </div>

                <div className="flex items-center justify-between px-2">
                  <span className="text-slate-500 text-[11px]">
                    {language === 'ur' ? 'سائز:' : 'Size:'}
                  </span>
                  <span className="text-slate-300">{item.apkSize}</span>
                </div>

                <div className="flex items-center justify-between px-2 sm:col-span-2 md:col-span-1">
                  <span className="text-slate-500 text-[11px]">SHA-256:</span>
                  <button
                    onClick={() => handleCopySha(item.id, item.sha256)}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title="Copy Checksum"
                  >
                    <span className="truncate max-w-[90px]">{item.sha256}</span>
                    {copiedShaId === item.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* EDIT & RE-BUILD BUTTON (KEY REQUIREMENT) */}
                  <button
                    id={`edit-build-${item.id}`}
                    onClick={() => onSelectEditBuild(item)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold text-xs transition cursor-pointer shadow-sm"
                    title="Edit app name, version, package, and rebuild APK"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      {language === 'ur'
                        ? 'اس بلڈ میں تبدیلی کریں (Edit & Re-build)'
                        : 'Edit & Re-build'}
                    </span>
                  </button>

                  {/* Load/Restore Files into Workspace */}
                  <button
                    onClick={() => onRestoreBuildFiles(item)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs font-semibold transition cursor-pointer"
                    title="Load these files into the project editor"
                  >
                    <FolderSync className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {language === 'ur'
                        ? 'کوڈ ایڈیٹر میں کھولیں'
                        : 'Load into Editor'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download APK Button */}
                  <button
                    onClick={() => handleDownloadApk(item)}
                    disabled={downloadingId === item.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/30 transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {downloadingId === item.id
                        ? language === 'ur'
                          ? 'تیار ہو رہا ہے...'
                          : 'Generating...'
                        : language === 'ur'
                        ? 'APK ڈاؤنلوڈ کریں'
                        : 'Download APK'}
                    </span>
                  </button>

                  {/* Delete Record */}
                  <button
                    onClick={() => onDeleteBuild(item.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    title="Delete build record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
