import React, { useState, useEffect } from 'react';
import { ApkBuildHistoryItem, AccountSecurity, GitHubActionRunItem } from '../types';
import { generateDebugApkBlob } from '../utils/zipHandler';
import { 
  GitHubRepoSettings, 
  getSavedGitHubSettings, 
  saveGitHubSettings, 
  fetchLiveGitHubBuilds, 
  triggerWorkflowDispatch 
} from '../utils/githubWorkflowApi';
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
  ExternalLink,
  RefreshCw,
  Play,
  Key,
  GitBranch,
  Github,
  AlertTriangle,
  Upload,
  Radio,
  FileDown
} from 'lucide-react';

interface BuildHistoryViewerProps {
  history: ApkBuildHistoryItem[];
  onSelectEditBuild: (item: ApkBuildHistoryItem) => void;
  onRestoreBuildFiles: (item: ApkBuildHistoryItem) => void;
  onDeleteBuild: (id: string) => void;
  security: AccountSecurity;
  onOpenSecurityCenter: () => void;
  language: 'ur' | 'en';
  onOpenSourceCodeManager?: () => void;
}

export const BuildHistoryViewer: React.FC<BuildHistoryViewerProps> = ({
  history,
  onSelectEditBuild,
  onRestoreBuildFiles,
  onDeleteBuild,
  security,
  onOpenSecurityCenter,
  language,
  onOpenSourceCodeManager,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'local'>('github');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedShaId, setCopiedShaId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // GitHub Actions Live Sync State
  const [settings, setSettings] = useState<GitHubRepoSettings>(() => getSavedGitHubSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [liveRuns, setLiveRuns] = useState<GitHubActionRunItem[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [isTriggeringBuild, setIsTriggeringBuild] = useState(false);
  const [triggerVariant, setTriggerVariant] = useState<'release' | 'debug'>('release');

  // Load Live GitHub Actions builds
  const loadGitHubRuns = async (currentSettings = settings) => {
    setIsLoadingLive(true);
    setLiveError(null);
    try {
      const { runs, error } = await fetchLiveGitHubBuilds(currentSettings);
      if (error) {
        setLiveError(error);
      } else {
        setLiveRuns(runs);
        setLastRefreshedAt(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      setLiveError(err.message || 'Error connecting to GitHub API');
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    loadGitHubRuns();
    // Auto poll every 30 seconds
    const interval = setInterval(() => {
      loadGitHubRuns();
    }, 30000);
    return () => clearInterval(interval);
  }, [settings.owner, settings.repo, settings.token]);

  const handleUpdateSettings = (partial: Partial<GitHubRepoSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveGitHubSettings(updated);
  };

  const handleTriggerBuild = async () => {
    if (!settings.token || !settings.token.trim()) {
      setIsSettingsOpen(true);
      alert(
        language === 'ur'
          ? 'براہِ کرم بلڈ چلانے کے لیے اپنا GitHub Personal Access Token درج کریں۔'
          : 'Please enter your GitHub Personal Access Token to trigger a build.'
      );
      return;
    }

    setIsTriggeringBuild(true);
    const res = await triggerWorkflowDispatch(settings, triggerVariant);
    setIsTriggeringBuild(false);

    if (res.success) {
      setActionSuccessMsg(
        language === 'ur'
          ? 'بلڈ کامیابی سے شروع ہو گیا! چند سیکنڈ میں لائیو اسٹیٹس اپڈیٹ ہو گا۔'
          : 'Build triggered successfully! Updating live status in a few seconds.'
      );
      setTimeout(() => {
        setActionSuccessMsg(null);
        loadGitHubRuns();
      }, 3000);
    } else {
      alert(res.message);
    }
  };

  // Filter history safely
  const filteredLocalHistory = (history || []).filter((item) => {
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

  const filteredLiveRuns = liveRuns.filter((run) => {
    const term = searchTerm.toLowerCase();
    return (
      run.name.toLowerCase().includes(term) ||
      run.display_title.toLowerCase().includes(term) ||
      run.head_sha.toLowerCase().includes(term) ||
      run.run_number.toString().includes(term) ||
      run.head_branch.toLowerCase().includes(term)
    );
  });

  const safeHistory = history || [];
  const totalLocalBuilds = safeHistory.length;
  const successfulLocalBuilds = safeHistory.filter((h) => h && h.status === 'success').length;

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
      
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>
                    {language === 'ur'
                      ? 'اینڈرائیڈ APK بلڈ ہسٹری اور کلاؤڈ ریکارڈ'
                      : 'Android APK Build History & Cloud Pipeline'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {settings.owner}/{settings.repo}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'ur'
                    ? 'اس ریپوزٹری میں تیار ہونے والے تمام APKs کا لائیو ریکارڈ، براہِ راست ڈاؤنلوڈ لنکس اور نیا سورس کوڈ ریپلیسمنٹ'
                    : 'Real-time record of all APKs built in this repository with direct download links and auto-source replacement.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Upload & Replace Source Code Button */}
            {onOpenSourceCodeManager && (
              <button
                onClick={onOpenSourceCodeManager}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition cursor-pointer"
                title="Upload new Android source and purge old source"
              >
                <FolderSync className="w-4 h-4" />
                <span>
                  {language === 'ur' ? 'سورس کوڈ اپلوڈ اور آٹو ریپلیس' : 'Upload & Replace Source'}
                </span>
              </button>
            )}

            {/* Trigger Build Button */}
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5">
              <select
                value={triggerVariant}
                onChange={(e) => setTriggerVariant(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs px-2 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="release">Release</option>
                <option value="debug">Debug</option>
              </select>
              <button
                onClick={handleTriggerBuild}
                disabled={isTriggeringBuild}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isTriggeringBuild ? 'animate-spin' : ''}`} />
                <span>
                  {isTriggeringBuild
                    ? (language === 'ur' ? 'چل رہا ہے...' : 'Starting...')
                    : (language === 'ur' ? 'نیا APK بلڈ چلائیں' : 'Build APK')}
                </span>
              </button>
            </div>

            {/* Refresh Live Runs */}
            <button
              onClick={() => loadGitHubRuns()}
              disabled={isLoadingLive}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Refresh builds"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLive ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Repo Config Toggle */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Configure GitHub Repository & Token"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible GitHub Repo Settings */}
        {isSettingsOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 bg-slate-950/60 p-4 rounded-xl border">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'ur' ? 'گٹ ہب ریپوزٹری اور پرسنل ایکسس ٹوکن' : 'GitHub Repository & Personal Access Token'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Owner</label>
                <input
                  type="text"
                  value={settings.owner}
                  onChange={(e) => handleUpdateSettings({ owner: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Repo Name</label>
                <input
                  type="text"
                  value={settings.repo}
                  onChange={(e) => handleUpdateSettings({ repo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Branch</label>
                <input
                  type="text"
                  value={settings.branch}
                  onChange={(e) => handleUpdateSettings({ branch: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 flex items-center gap-1">
                <Key className="w-3 h-3 text-yellow-400" />
                <span>GitHub Personal Access Token (for triggering builds & private repos)</span>
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={settings.token || ''}
                onChange={(e) => handleUpdateSettings({ token: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 mt-1"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  loadGitHubRuns();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition"
              >
                {language === 'ur' ? 'محفوظ کریں اور لوڈ کریں' : 'Save & Refresh'}
              </button>
            </div>
          </div>
        )}

        {/* View Segment Switcher (GitHub Cloud vs Local) */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('github')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'github'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'گٹ ہب کلاؤڈ بلڈز (Live Actions)' : 'GitHub Actions Cloud Builds'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {liveRuns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('local')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'local'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'لوکل اسنیپ شاٹس اور ایڈیٹر' : 'Local Snapshots & Editor'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                {totalLocalBuilds}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={
                language === 'ur'
                  ? 'بلڈ نمبر، شاخ یا کمٹ تلاش کریں...'
                  : 'Search build number, branch, or commit...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-3 py-2 rounded-lg border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GITHUB ACTIONS LIVE CLOUD BUILDS & REAL APKs                       */}
      {/* ========================================================================= */}
      {activeTab === 'github' && (
        <div className="space-y-3">
          {/* Auto-Error Fix Enabled Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/40 border border-emerald-500/40 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 flex items-center gap-2">
                    <span>{language === 'ur' ? '🛡️ خودکار ایرر فکس سسٹم (Auto Error Fix) فعال ہے' : '🛡️ Self-Healing Auto Error Fix Active'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      Auto-Scaffold &amp; Self-Repair
                    </span>
                  </h4>
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                    {language === 'ur'
                      ? 'جب آپ ریپوزٹری میں مینول ٹریگر دباتے ہیں، تو اگر ریپو میں gradle فائلیں نہ ہوں، تو ورک فلو اب خودکار طور پر تمام مطلوبہ اینڈرائیڈ فائلیں تیار کرے گا، کی اسٹور کی کمی پر خودکار debug فال بیک کرے گا اور 100% کامیابی کے ساتھ APK بنائے گا۔'
                      : 'When triggering the workflow manually, if no gradle files exist yet, the workflow will now automatically scaffold the entire Android project, recover from keystore errors, and guarantee APK compilation.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleTriggerBuild}
                  disabled={isTriggeringBuild}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? 'ابھی بلڈ چلائیں' : 'Trigger Run Now'}</span>
                </button>
              </div>
            </div>
          </div>

          {liveError && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <span className="font-semibold block">{language === 'ur' ? 'گٹ ہب کنکشن کا نوٹس:' : 'GitHub Notice:'}</span>
                  <p className="text-amber-200/80 text-[11px] mt-0.5">{liveError}</p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    {language === 'ur'
                      ? 'اگر ریپو پبلک ہے تو خود بخود ڈیٹا آ جائے گا۔ پرائیویٹ ریپو کے لیے اوپر سیٹنگز میں Personal Access Token ڈالیں۔'
                      : 'If your repo is public, builds load automatically. For private repos, please provide a Personal Access Token.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold shrink-0 cursor-pointer"
              >
                {language === 'ur' ? 'سیٹنگز کھولیں' : 'Open Settings'}
              </button>
            </div>
          )}

          {isLoadingLive && liveRuns.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-medium">
                {language === 'ur'
                  ? 'گٹ ہب ایکشنز سے تازہ ترین APK بلڈز حاصل کیے جا رہے ہیں...'
                  : 'Fetching latest APK builds from GitHub Actions...'}
              </p>
            </div>
          ) : filteredLiveRuns.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
              <Github className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">
                {language === 'ur' ? 'کوئی کلاؤڈ بلڈ ریکارڈ نہیں ملا' : 'No GitHub Action Runs Found Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {language === 'ur'
                  ? 'جب آپ نیا سورس کوڈ اپلوڈ کریں گے یا "نیا APK بلڈ چلائیں" پر کلک کریں گے تو گٹ ہب پر بلڈ شروع ہو کر یہاں ظاہر ہو گا۔'
                  : 'Upload new Android source code or click "Build APK" above to start compiling your first APK in GitHub Actions.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={handleTriggerBuild}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow"
                >
                  {language === 'ur' ? 'پہلا بلڈ شروع کریں' : 'Trigger First Build'}
                </button>
              </div>
            </div>
          ) : (
            filteredLiveRuns.map((run) => {
              const isSuccess = run.conclusion === 'success';
              const isInProgress = run.status === 'in_progress' || run.status === 'queued';
              const isFailure = run.conclusion === 'failure';

              return (
                <div
                  key={run.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition shadow-sm space-y-3 group"
                >
                  {/* Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isInProgress
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : isInProgress ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>#{run.run_number}</span>
                      </span>

                      <div>
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <span>{run.display_title || run.name}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {run.head_branch}
                          </span>
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          {run.event.toUpperCase()} • Commit: {run.head_sha.substring(0, 7)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(run.created_at).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {isInProgress && (
                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-300 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                      <span>
                        {language === 'ur'
                          ? 'اینڈرائیڈ APK گٹ ہب پر کمپائل ہو رہا ہے... (یہ عمل عموماً 1 سے 3 منٹ لیتا ہے)'
                          : 'Android APK is compiling on GitHub Actions... (typically takes 1-3 minutes)'}
                      </span>
                    </div>
                  )}

                  {/* Action Row */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60">
                    <div className="flex items-center gap-2 text-xs">
                      {/* Open Action Log */}
                      <a
                        href={run.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'ur' ? 'گٹ ہب لاگ دیکھیں' : 'View Action Logs'}</span>
                      </a>
                    </div>

                    {/* Download APK Button if Release or Artifact exists */}
                    <div className="flex items-center gap-2">
                      {run.apkDownloadUrl ? (
                        <a
                          href={run.apkDownloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>
                            {language === 'ur'
                              ? `اصلی APK ڈاؤنلوڈ کریں ${run.apkSize ? `(${run.apkSize})` : ''}`
                              : `Download APK ${run.apkSize ? `(${run.apkSize})` : ''}`}
                          </span>
                        </a>
                      ) : isSuccess ? (
                        <a
                          href={`${run.html_url}#artifacts`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>
                            {language === 'ur'
                              ? 'ایکشن آرٹیفیکٹس سے APK حاصل کریں'
                              : 'Get APK from Artifacts'}
                          </span>
                        </a>
                      ) : null}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LOCAL BUILDS & EDITOR SNAPSHOTS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'local' && (
        <div className="space-y-3">
          {filteredLocalHistory.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <History className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">
                {language === 'ur' ? 'کوئی لوکل بلڈ ہسٹری نہیں ملی' : 'No Local Build History Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {language === 'ur'
                  ? 'لوکل سیمولیٹر سے نیا بلڈ چلائیں تاکہ اسنیپ شاٹس یہاں محفوظ ہو سکیں۔'
                  : 'Run a build in the local runner to record snapshots here.'}
              </p>
            </div>
          ) : (
            filteredLocalHistory.map((item) => (
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
                    <button
                      id={`edit-build-${item.id}`}
                      onClick={() => onSelectEditBuild(item)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold text-xs transition cursor-pointer shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        {language === 'ur'
                          ? 'اس بلڈ میں تبدیلی کریں (Edit & Re-build)'
                          : 'Edit & Re-build'}
                      </span>
                    </button>

                    <button
                      onClick={() => onRestoreBuildFiles(item)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs font-semibold transition cursor-pointer"
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
      )}

    </div>
  );
};
