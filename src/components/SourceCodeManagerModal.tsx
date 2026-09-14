import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  RefreshCw, 
  FolderSync, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Key, 
  Terminal, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Package,
  Layers,
  Wrench,
  Download,
  Play
} from 'lucide-react';
import { AndroidProjectFile } from '../data/defaultAndroidProject';
import JSZip from 'jszip';
import { 
  GitHubRepoSettings, 
  getSavedGitHubSettings, 
  saveGitHubSettings, 
  pushAndReplaceSourceToGitHub,
  triggerWorkflowDispatch,
  detectCurrentGitHubRepo
} from '../utils/githubWorkflowApi';

interface SourceCodeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ur' | 'en';
  projectFiles: AndroidProjectFile[];
  onUpdateProjectFiles: (newFiles: AndroidProjectFile[]) => void;
  onNavigateToHistory?: () => void;
}

export const SourceCodeManagerModal: React.FC<SourceCodeManagerModalProps> = ({
  isOpen,
  onClose,
  language,
  projectFiles,
  onUpdateProjectFiles,
  onNavigateToHistory,
}) => {
  const [settings, setSettings] = useState<GitHubRepoSettings>(() => getSavedGitHubSettings());
  const [showToken, setShowToken] = useState(false);
  const [autoReplaceOld, setAutoReplaceOld] = useState(true);

  // Uploaded files state
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<AndroidProjectFile[]>([]);
  const [uploadStats, setUploadStats] = useState<{
    totalFiles: number;
    cleanedConflicts: number;
    hasGradlew: boolean;
  } | null>(null);

  // Sync to GitHub state
  const [isPushing, setIsPushing] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [autoFixedMsg, setAutoFixedMsg] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  if (!isOpen) return null;

  const handleUpdateSettings = (partial: Partial<GitHubRepoSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveGitHubSettings(updated);
  };

  // Handle ZIP upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingZip(true);
    setPushSuccess(false);
    setPushError(null);

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const parsedFiles: AndroidProjectFile[] = [];
      let cleanedCount = 0;

      const fileEntries = Object.keys(contents.files);
      
      // First check if Groovy build.gradle exists
      const hasGroovyRoot = fileEntries.some((p) => p.endsWith('build.gradle') && !p.includes('/app/'));
      const hasGroovyApp = fileEntries.some((p) => p.endsWith('app/build.gradle'));

      for (const relativePath of fileEntries) {
        const zipEntry = contents.files[relativePath];
        if (zipEntry.dir) continue;

        // Skip non-essential OS / git junk
        if (
          relativePath.includes('.git/') ||
          relativePath.includes('.idea/') ||
          relativePath.includes('.DS_Store') ||
          relativePath.includes('build/') ||
          relativePath.includes('node_modules/')
        ) {
          continue;
        }

        // AUTO-CLEAN: Remove conflicting .kts if groovy exists to prevent Gradle collisions!
        if (hasGroovyRoot && relativePath.endsWith('build.gradle.kts')) {
          cleanedCount++;
          continue;
        }
        if (hasGroovyRoot && relativePath.endsWith('settings.gradle.kts')) {
          cleanedCount++;
          continue;
        }
        if (hasGroovyApp && relativePath.endsWith('app/build.gradle.kts')) {
          cleanedCount++;
          continue;
        }

        // Extract content
        const fileName = relativePath.split('/').pop() || relativePath;
        let category: AndroidProjectFile['category'] = 'source';
        if (fileName.endsWith('.gradle') || fileName.endsWith('.kts')) category = 'gradle';
        else if (fileName.endsWith('.xml')) category = 'manifest';
        else if (fileName.startsWith('gradlew')) category = 'wrapper';
        else if (relativePath.includes('res/')) category = 'resource';

        try {
          const text = await zipEntry.async('text');
          parsedFiles.push({
            path: relativePath,
            name: fileName,
            content: text,
            category,
            description: `Imported Android project file: ${relativePath}`,
          });
        } catch {
          // Non-text file
        }
      }

      setUploadedFiles(parsedFiles);
      setUploadStats({
        totalFiles: parsedFiles.length,
        cleanedConflicts: cleanedCount,
        hasGradlew: parsedFiles.some((f) => f.name === 'gradlew'),
      });
    } catch (err: any) {
      alert(language === 'ur' ? 'ZIP پڑھنے میں خرابی: ' + err.message : 'Error reading ZIP: ' + err.message);
    } finally {
      setIsProcessingZip(false);
    }
  };

  // Apply new files to app state
  const handleApplyToWorkspace = () => {
    if (uploadedFiles.length === 0) return;
    
    if (autoReplaceOld) {
      // Complete replacement
      onUpdateProjectFiles(uploadedFiles);
    } else {
      // Merge
      const map = new Map<string, AndroidProjectFile>();
      projectFiles.forEach((f) => map.set(f.path, f));
      uploadedFiles.forEach((f) => map.set(f.path, f));
      onUpdateProjectFiles(Array.from(map.values()));
    }

    alert(
      language === 'ur'
        ? 'سورس کوڈ ورک اسپیس میں کامیابی سے سیٹ ہو گیا!'
        : 'Source code successfully applied to workspace!'
    );
  };

  // Push clean replacement directly to GitHub
  const handlePushToGitHub = async () => {
    const filesToPush = uploadedFiles.length > 0 ? uploadedFiles : projectFiles;

    if (!settings.token || !settings.token.trim()) {
      setPushError(
        language === 'ur'
          ? 'براہِ کرم پہلے اپنا GitHub Personal Access Token درج کریں (نیچے دیے گئے لنک سے بنائیں)۔'
          : 'Please enter your GitHub Personal Access Token first.'
      );
      return;
    }

    setIsPushing(true);
    setPushSuccess(false);
    setPushError(null);
    setAutoFixedMsg(null);

    const res = await pushAndReplaceSourceToGitHub(
      settings,
      filesToPush,
      `🚀 [Auto-Replace] Deploy new Android source code & purge old files`
    );

    setIsPushing(false);
    if (res.success) {
      setPushSuccess(true);
      if (uploadedFiles.length > 0) {
        onUpdateProjectFiles(uploadedFiles);
      }
    } else {
      setPushError(res.message);
    }
  };

  // Trigger existing workflow without committing new source files
  const handleTriggerOnly = async () => {
    if (!settings.token || !settings.token.trim()) {
      setPushError(
        language === 'ur'
          ? 'ورک فلو چلانے کے لیے GitHub Personal Access Token درکار ہے۔'
          : 'GitHub Personal Access Token is required to trigger workflow.'
      );
      return;
    }

    setIsPushing(true);
    setPushSuccess(false);
    setPushError(null);
    setAutoFixedMsg(null);

    const res = await triggerWorkflowDispatch(settings, 'release');
    setIsPushing(false);
    if (res.success) {
      setPushSuccess(true);
    } else {
      setPushError(res.message);
    }
  };

  // 🛡️ Comprehensive Auto Error Fix & Self-Healing Action
  const handleAutoFixError = async () => {
    const detected = detectCurrentGitHubRepo();
    const fixedSettings: GitHubRepoSettings = {
      owner: detected.owner || 'ez786',
      repo: detected.repo || 'Android-GitHub-Actions-APK-Builder',
      branch: (settings.branch || 'main').trim(),
      token: (settings.token || '').trim(),
    };

    setSettings(fixedSettings);
    saveGitHubSettings(fixedSettings);

    // Apply clean files to workspace
    if (uploadedFiles.length > 0) {
      onUpdateProjectFiles(uploadedFiles);
    }

    setAutoFixedMsg(
      language === 'ur'
        ? `✅ ریپوزٹری کی سیٹنگز خودکار درست کر دی گئیں: ${fixedSettings.owner}/${fixedSettings.repo}`
        : `✅ Repository settings auto-corrected to: ${fixedSettings.owner}/${fixedSettings.repo}`
    );
    setPushError(null);

    // If token exists, auto retry!
    if (fixedSettings.token) {
      setIsPushing(true);
      const res = await pushAndReplaceSourceToGitHub(
        fixedSettings,
        uploadedFiles.length > 0 ? uploadedFiles : projectFiles,
        '🚀 [Auto-Repair & Deploy] Clean Android Source & Purge'
      );
      setIsPushing(false);
      if (res.success) {
        setPushSuccess(true);
      } else {
        setPushError(res.message);
      }
    }
  };

  // 📦 Download Clean Android Project ZIP
  const handleDownloadCleanZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      const files = uploadedFiles.length > 0 ? uploadedFiles : projectFiles;

      files.forEach((file) => {
        if (file.type === 'binary') {
          zip.file(file.path, file.content, { base64: true });
        } else {
          zip.file(file.path, file.content);
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Clean-Android-Project-${settings.owner || 'ez786'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download clean ZIP error:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const terminalGitCmd = `# 1. پرانا اینڈرائیڈ سورس کوڈ مٹائیں
git rm -r --cached app/ 2>/dev/null || true
rm -f build.gradle.kts settings.gradle.kts app/build.gradle.kts

# 2. نیا سورس کوڈ کاپی کریں اور کمٹ کر دیں
git add .
git commit -m "🚀 [Auto-Replace] New Android Source Upload & Old Source Purge"
git push origin ${settings.branch || 'main'}`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(terminalGitCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {language === 'ur'
                  ? 'اینڈرائیڈ سورس کوڈ مینیجر اور آٹو ریپلیس'
                  : 'Android Source Code Uploader & Auto-Replacer'}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Clean CI/CD
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ur'
                  ? 'نیا سورس کوڈ اپلوڈ کریں، پرانا سورس کوڈ خودکار ڈیلیٹ ہو جائے گا اور اسی ریپوزٹری میں نیا APK بنے گا'
                  : 'Upload new Android source: old code is purged, collisions auto-cleaned, and APK builds automatically.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Guidance Banner */}
        <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-200 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-300">
              {language === 'ur'
                ? 'آپ کا مطلوبہ خودکار نظام (Full Automation in Same Repo):'
                : 'Fully Automated Same-Repository Android Pipeline:'}
            </p>
            <p className="text-emerald-100/90 leading-relaxed text-[11px]">
              {language === 'ur'
                ? 'اس ریپوزٹری میں گٹ ہب ایکشنز ورک فلو (.github/workflows/build-android-apk.yml) موجود ہے۔ جب بھی آپ اس ٹول کے ذریعے نیا سورس کوڈ لوڈ کریں گے، پرانا سورس کوڈ خود بخود ختم کر دیا جائے گا اور ریپوزٹری میں نیا بلڈ شروع ہو جائے گا جس کی مکمل ہسٹری اور ڈاؤنلوڈ لنک اس پیج پر محفوظ رہے گی۔'
                : 'GitHub Actions workflow is set up in your repository. Whenever you upload a new project, old source files are cleared, avoiding conflicts and immediately compiling a fresh APK tracked in Build History.'}
            </p>
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
          
          {/* STEP 1: Upload Android Source ZIP */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ur' ? '1. نیا اینڈرائیڈ سورس کوڈ (ZIP) منتخب کریں' : '1. Upload New Android Project (ZIP)'}</span>
              </label>

              {/* Auto Replace Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReplaceOld}
                  onChange={(e) => setAutoReplaceOld(e.target.checked)}
                  className="accent-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                  {language === 'ur' ? 'پہلے والا سورس کوڈ مکمل ڈیلیٹ کریں (Auto-Replace)' : 'Purge Previous Source Code'}
                </span>
              </label>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 text-center transition bg-slate-900/50">
              <input
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                id="source-zip-input"
                className="hidden"
              />
              <label htmlFor="source-zip-input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {isProcessingZip ? (
                    <span className="text-emerald-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {language === 'ur' ? 'ZIP فائل اسکین ہو رہی ہے...' : 'Analyzing & Sanitizing ZIP...'}
                    </span>
                  ) : (
                    <span>
                      {language === 'ur'
                        ? 'یہاں کلک کر کے اپنے اینڈرائیڈ ایپ کا ZIP منتخب کریں'
                        : 'Click here or drop your Android project ZIP'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {language === 'ur'
                    ? 'متصادم .kts اور ڈپلیکیٹ فائلیں خودکار طریقے سے فلٹر ہو جائیں گی'
                    : 'Conflicting .kts duplicate files are automatically filtered out'}
                </p>
              </label>
            </div>

            {/* Upload Inspection Stats */}
            {uploadStats && (
              <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">
                    <strong>{uploadStats.totalFiles}</strong> {language === 'ur' ? 'فائلیں لوڈ ہو گئیں' : 'clean files loaded'}
                  </span>
                </div>
                {uploadStats.cleanedConflicts > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                    🧹 {uploadStats.cleanedConflicts} {language === 'ur' ? 'متصادم .kts فائلیں صاف کر دی گئیں' : 'conflicting .kts purged'}
                  </span>
                )}
                <button
                  onClick={handleApplyToWorkspace}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition"
                >
                  {language === 'ur' ? 'ورک اسپیس میں اپلائی کریں' : 'Apply to Workspace'}
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: GitHub Repository Connection */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>{language === 'ur' ? '2. گٹ ہب ریپوزٹری اور ٹوکن (ایک کلک پش کے لیے)' : '2. GitHub Repo & Token (For 1-Click Push)'}</span>
              </h4>
              <button
                onClick={handleAutoFixError}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 transition cursor-pointer"
                title="Auto detect and set ez786 repo"
              >
                <Wrench className="w-3 h-3 text-emerald-400" />
                <span>{language === 'ur' ? 'آٹو سیٹ ریپو' : 'Auto Set Repo'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] text-slate-400">Owner / Repo</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
                  <input
                    type="text"
                    value={settings.owner}
                    onChange={(e) => handleUpdateSettings({ owner: e.target.value })}
                    className="bg-transparent text-emerald-400 font-mono w-1/2 focus:outline-none"
                    placeholder="Owner (e.g. ez786)"
                  />
                  <span className="text-slate-500">/</span>
                  <input
                    type="text"
                    value={settings.repo}
                    onChange={(e) => handleUpdateSettings({ repo: e.target.value })}
                    className="bg-transparent text-emerald-400 font-mono w-1/2 focus:outline-none"
                    placeholder="Repo (e.g. Android-GitHub-Actions-APK-Builder)"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Branch</label>
                <input
                  type="text"
                  value={settings.branch}
                  onChange={(e) => handleUpdateSettings({ branch: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Token Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Key className="w-3 h-3 text-yellow-400" />
                  <span>GitHub Personal Access Token (repo, workflow scope)</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Android-APK-Studio-Sync"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>{language === 'ur' ? 'ٹوکن بنائیں' : 'Create Token'}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={settings.token || ''}
                  onChange={(e) => handleUpdateSettings({ token: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1.5 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Push & Trigger Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePushToGitHub}
                disabled={isPushing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/60 cursor-pointer disabled:opacity-50"
              >
                <FolderSync className={`w-4 h-4 ${isPushing ? 'animate-spin' : ''}`} />
                <span>
                  {isPushing
                    ? (language === 'ur' ? 'پش ہو رہا ہے...' : 'Pushing to GitHub...')
                    : (language === 'ur' ? '🚀 سورس پش کریں اور APK بلڈ چلائیں' : '🚀 Push Source & Build APK')}
                </span>
              </button>

              <button
                onClick={handleTriggerOnly}
                disabled={isPushing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ur' ? '▶️ صرف بلڈ چلائیں (Trigger Run)' : '▶️ Trigger Run Only'}</span>
              </button>
            </div>

            {autoFixedMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{autoFixedMsg}</span>
              </div>
            )}

            {pushSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {language === 'ur'
                      ? 'کامیابی! پرانا سورس کوڈ صاف کر کے نیا اپلوڈ ہو گیا ہے۔ APK بلڈ شروع ہو چکا ہے۔'
                      : 'Success! Old code purged and new code deployed. Android APK compilation has started.'}
                  </span>
                </div>
                {onNavigateToHistory && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToHistory();
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    {language === 'ur' ? 'ہسٹری دیکھیں' : 'View History'}
                  </button>
                )}
              </div>
            )}

            {/* 🛡️ SELF-HEALING AUTO ERROR FIX PANEL */}
            {pushError && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-red-500/40 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-200">
                      {language === 'ur' ? 'ایرر الرٹ: ' : 'Error Alert: '}
                    </strong>
                    <span>{pushError}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'ur' ? 'خودکار ایرر فکس تجاویز (Auto Error Fix Solutions):' : 'Self-Healing Solutions:'}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      {settings.owner || 'ez786'}/{settings.repo || 'Android-GitHub-Actions-APK-Builder'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {language === 'ur'
                      ? 'اگر موبائل براؤزر پر "Failed to fetch" یا کنکشن کا مسئلہ آئے تو آپ ان 3 خودکار طریقوں میں سے کوئی بھی استعمال کر سکتے ہیں:'
                      : 'If you encounter "Failed to fetch" or CORS issues on mobile, choose any of these instant resolution options:'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {/* Solution 1: Auto Fix Settings & Retry */}
                    <button
                      onClick={handleAutoFixError}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition shadow"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{language === 'ur' ? '1. آٹو ریپو فکس کریں اور ری ٹرائی' : '1. Auto-Fix Repo & Retry'}</span>
                    </button>

                    {/* Solution 2: Download Clean ZIP */}
                    <button
                      onClick={handleDownloadCleanZip}
                      disabled={isDownloadingZip}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer transition shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {isDownloadingZip
                          ? (language === 'ur' ? 'ZIP تیار ہو رہی ہے...' : 'Zipping...')
                          : (language === 'ur' ? '2. کلین سورس ZIP ڈاؤنلوڈ کریں' : '2. Download Clean ZIP')}
                      </span>
                    </button>
                  </div>

                  {/* Solution 3: Direct Web Upload */}
                  <div className="pt-1">
                    <a
                      href={`https://github.com/${encodeURIComponent(settings.owner || 'ez786')}/${encodeURIComponent(settings.repo || 'Android-GitHub-Actions-APK-Builder')}/upload/${encodeURIComponent(settings.branch || 'main')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/90 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{language === 'ur' ? '3. گٹ ہب ویب سائٹ پر براہِ راست اپلوڈ کریں (No Token Needed)' : '3. Open GitHub Web Upload (Direct)'}</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Manual Terminal / Git command alternative */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'ur' ? 'یا ٹرمینل / Git کمانڈ کے ذریعے اپلوڈ:' : 'Or Via Git Terminal Command:'}</span>
              </label>
              <button
                onClick={handleCopyCmd}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd ? (language === 'ur' ? 'کاپی ہو گیا!' : 'Copied!') : (language === 'ur' ? 'کمانڈ کاپی کریں' : 'Copy Command')}</span>
              </button>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
              {terminalGitCmd}
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'ur'
                ? 'یہ کمانڈ پہلے والے سورس کوڈ کو مکمل صاف کر کے نئی تبدیلیوں کو ریپوزٹری میں پش کر دیتی ہے تاکہ بلڈ فوراً شروع ہو جائے۔'
                : 'This command wipes the prior source cache and commits new project files cleanly to trigger compilation.'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {language === 'ur'
                ? 'اسی ریپو میں بلڈ ہوتے ہی ہسٹری خودکار اپڈیٹ ہو گی'
                : 'Build history updates live in this repository'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {language === 'ur' ? 'بند کریں' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
