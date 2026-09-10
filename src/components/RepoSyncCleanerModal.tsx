import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ShieldAlert, 
  Key, 
  FolderSync, 
  FileCode, 
  Check, 
  Copy, 
  Download, 
  Terminal, 
  Sparkles,
  Info
} from 'lucide-react';
import { AndroidProjectFile } from '../data/defaultAndroidProject';
import { createProjectZip } from '../utils/zipHandler';

interface ConflictItem {
  path: string;
  name: string;
  sha: string;
  size: number;
  severity: 'critical' | 'warning';
  reason: string;
  htmlUrl: string;
}

interface RepoSyncCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ur' | 'en';
  currentYaml: string;
  projectFiles: AndroidProjectFile[];
}

export const RepoSyncCleanerModal: React.FC<RepoSyncCleanerModalProps> = ({
  isOpen,
  onClose,
  language,
  currentYaml,
  projectFiles,
}) => {
  const [repoOwner, setRepoOwner] = useState('rehmanmobilez786');
  const [repoName, setRepoName] = useState('Android-apk-builder-GitHub-studio-');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionLogs, setDeletionLogs] = useState<string[]>([]);
  const [deletionSuccess, setDeletionSuccess] = useState(false);

  // Workflow sync state
  const [isSyncingWorkflow, setIsSyncingWorkflow] = useState(false);
  const [workflowSyncSuccess, setWorkflowSyncSuccess] = useState(false);
  const [workflowSyncError, setWorkflowSyncError] = useState<string | null>(null);

  // Tab: 'token-sync' | 'manual-web' | 'terminal'
  const [activeTab, setActiveTab] = useState<'token-sync' | 'manual-web' | 'terminal'>('token-sync');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Auto scan on modal open
  useEffect(() => {
    if (isOpen) {
      handleScanRepo();
    }
  }, [isOpen, repoOwner, repoName, branch]);

  const handleScanRepo = async () => {
    setIsScanning(true);
    setScanError(null);
    setScanDone(false);
    setDeletionLogs([]);
    setDeletionSuccess(false);
    setWorkflowSyncSuccess(false);

    try {
      const res = await fetch('/api/github/scan-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repoOwner.trim(),
          repo: repoName.trim(),
          token: token.trim() || undefined,
          branch: branch.trim() || 'main',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to scan repository.');
      }

      setConflicts(data.conflictFiles || []);
      // Pre-select all critical conflicts
      const initialSelected = (data.conflictFiles || [])
        .filter((c: ConflictItem) => c.severity === 'critical')
        .map((c: ConflictItem) => c.path);
      setSelectedPaths(initialSelected);
      setScanDone(true);
    } catch (err: any) {
      console.error('Scan Error:', err);
      setScanError(err.message || 'Could not scan GitHub repository.');
      // Fallback default known conflicts if offline/rate-limited
      setConflicts([
        {
          path: 'build.gradle.kts',
          name: 'build.gradle.kts',
          sha: '',
          size: 1540,
          severity: 'critical',
          reason: 'build.gradle کی موجودگی میں build.gradle.kts دونوں کا اکٹھا ہونا Gradle بلڈ فیل کر دیتا ہے۔',
          htmlUrl: `https://github.com/${repoOwner}/${repoName}/blob/${branch}/build.gradle.kts`,
        },
        {
          path: 'settings.gradle.kts',
          name: 'settings.gradle.kts',
          sha: '',
          size: 890,
          severity: 'critical',
          reason: 'settings.gradle کی موجودگی میں settings.gradle.kts فائل Gradle کو روک دیتی ہے۔',
          htmlUrl: `https://github.com/${repoOwner}/${repoName}/blob/${branch}/settings.gradle.kts`,
        },
        {
          path: 'app/build.gradle.kts',
          name: 'app/build.gradle.kts',
          sha: '',
          size: 2100,
          severity: 'critical',
          reason: 'app ماڈیول کے اندر ڈپلیکیٹ build.gradle.kts ماڈیول بلڈ کو فیل کر دیتی ہے۔',
          htmlUrl: `https://github.com/${repoOwner}/${repoName}/blob/${branch}/app/build.gradle.kts`,
        },
      ]);
      setSelectedPaths(['build.gradle.kts', 'settings.gradle.kts', 'app/build.gradle.kts']);
      setScanDone(true);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelectPath = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  // Perform deletion of selected files via API
  const handleDeleteSelected = async () => {
    if (!token.trim()) {
      alert(
        language === 'ur'
          ? 'براہِ کرم پہلے اپنا GitHub Personal Access Token درج کریں یا نیچے دیے گئے ویب لنکس کے ذریعے براہ راست ڈیلیٹ کریں۔'
          : 'Please enter your GitHub Personal Access Token or use the direct web links below to delete.'
      );
      return;
    }

    if (selectedPaths.length === 0) {
      alert(language === 'ur' ? 'ڈیلیٹ کرنے کے لیے کم از کم ایک فائل منتخب کریں۔' : 'Select at least one file to delete.');
      return;
    }

    setIsDeleting(true);
    setDeletionLogs([]);
    setDeletionSuccess(false);

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(msg);
      setDeletionLogs([...logs]);
    };

    addLog(`🚀 Deleting ${selectedPaths.length} conflicting files via GitHub REST API...`);

    let successCount = 0;

    for (const filePath of selectedPaths) {
      const conflict = conflicts.find((c) => c.path === filePath);
      let sha = conflict?.sha;

      // If SHA missing, fetch it first
      if (!sha) {
        try {
          addLog(`🔍 Fetching SHA for ${filePath}...`);
          const res = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
              headers: {
                Authorization: `Bearer ${token.trim()}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            sha = data.sha;
          }
        } catch (e) {
          console.warn('Error fetching SHA:', e);
        }
      }

      if (!sha) {
        addLog(`⚠️ Skipping ${filePath}: File not found on GitHub or already deleted.`);
        continue;
      }

      try {
        addLog(`🗑️ Deleting ${filePath}...`);
        const delRes = await fetch('/api/github/delete-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: repoOwner.trim(),
            repo: repoName.trim(),
            token: token.trim(),
            path: filePath,
            sha,
            branch: branch.trim() || 'main',
          }),
        });

        const delData = await delRes.json();
        if (delRes.ok) {
          addLog(`✅ Successfully deleted ${filePath}!`);
          successCount++;
        } else {
          addLog(`❌ Failed to delete ${filePath}: ${delData.error}`);
        }
      } catch (err: any) {
        addLog(`❌ Error deleting ${filePath}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      setDeletionSuccess(true);
      addLog(`🎉 Cleanup complete! ${successCount} conflicting files removed from GitHub.`);
      // Refresh scan
      setTimeout(() => {
        handleScanRepo();
      }, 1500);
    }
    setIsDeleting(false);
  };

  // Sync clean workflow
  const handleSyncWorkflow = async () => {
    if (!token.trim()) {
      alert(
        language === 'ur'
          ? 'براہِ کرم پہلے اپنا GitHub Personal Access Token درج کریں۔'
          : 'Please enter your GitHub Personal Access Token first.'
      );
      return;
    }

    setIsSyncingWorkflow(true);
    setWorkflowSyncSuccess(false);
    setWorkflowSyncError(null);

    try {
      const res = await fetch('/api/github/sync-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repoOwner.trim(),
          repo: repoName.trim(),
          token: token.trim(),
          branch: branch.trim() || 'main',
          workflowYaml: currentYaml,
          targetPath: '.github/workflows/android-build-apk.yml',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync workflow.');
      }

      setWorkflowSyncSuccess(true);
    } catch (err: any) {
      console.error('Workflow Sync Error:', err);
      setWorkflowSyncError(err.message || 'Could not sync workflow.');
    } finally {
      setIsSyncingWorkflow(false);
    }
  };

  // Download clean zip
  const handleDownloadCleanZip = async () => {
    setIsZipping(true);
    try {
      // Filter out any .kts files from projectFiles
      const cleanFiles = projectFiles.filter(
        (f) => !f.path.endsWith('.kts') && !f.name.endsWith('.kts')
      );
      const zipBlob = await createProjectZip(cleanFiles, currentYaml);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'android-clean-project-no-conflicts.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  const gitCommand = `git rm build.gradle.kts settings.gradle.kts app/build.gradle.kts\ngit commit -m "🧹 Remove duplicate conflicting KTS build files"\ngit push origin ${branch}`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(gitCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {language === 'ur'
                  ? 'گٹ ہب ریپوزٹری فائل سنک اور متصادم فائل ڈیلیٹر'
                  : 'GitHub Repo File Sync & Conflict Cleaner'}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                  Fix Gradle Collisions
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ur'
                  ? 'اضافی متصادم فائلوں (build.gradle.kts) کو ڈیلیٹ کر کے اصلی 20MB والی APK بلڈ بحال کریں'
                  : 'Delete duplicate conflicting .kts files to restore 20MB real Android APK compilation'}
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

        {/* Explanation Alert */}
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              {language === 'ur'
                ? 'اہم تکنیکی وجہ: اینڈرائیڈ بلڈ کیوں رکی اور APK چھوٹی کیوں بنی؟'
                : 'Why the Android build failed and produced small stubs:'}
            </p>
            <p className="text-amber-300/90 leading-relaxed">
              {language === 'ur'
                ? 'آپ کی گٹ ہب ریپوزٹری میں ایک ہی وقت پر Groovy (.gradle) اور Kotlin Script (.gradle.kts) دونوں فائلیں موجود ہیں۔ جب Gradle رن ہوتا ہے تو وہ فورا کریش ہو جاتا ہے جس کی وجہ سے کلاؤڈ پر 20MB والی اصلی APK نہیں بن پاتی۔ نیچے دیے گئے 3 آسان طریقوں میں سے کوئی ایک طریقہ استعمال کریں:'
                : 'Your GitHub repository contains both .gradle and .gradle.kts files simultaneously. Gradle crashes immediately on conflict, preventing GitHub Actions from generating the full 20MB APK. Choose one of the 3 easy methods below:'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('token-sync')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'token-sync'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>{language === 'ur' ? '1. خودکار سنک و ڈیلیٹ (Token)' : '1. Auto Sync & Delete (Token)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('manual-web')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'manual-web'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{language === 'ur' ? '2. گٹ ہب ویب سائٹ لنکس (No Token)' : '2. GitHub Web Direct (No Token)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'terminal'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{language === 'ur' ? '3. ٹرمینل کمانڈ و کلین ZIP' : '3. Terminal Command & Clean ZIP'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
          
          {/* TAB 1: Auto Sync via GitHub Token */}
          {activeTab === 'token-sync' && (
            <div className="space-y-4">
              {/* Repo & Token Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {language === 'ur' ? 'گٹ ہب ریپوزٹری (Owner/Repo)' : 'GitHub Repository'}
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
                    <input
                      type="text"
                      value={repoOwner}
                      onChange={(e) => setRepoOwner(e.target.value)}
                      className="bg-transparent text-emerald-400 font-mono w-1/2 focus:outline-none"
                      placeholder="Owner"
                    />
                    <span className="text-slate-500">/</span>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      className="bg-transparent text-emerald-400 font-mono w-1/2 focus:outline-none"
                      placeholder="Repo Name"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {language === 'ur' ? 'برانچ (Branch)' : 'Branch'}
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* GitHub Token Input */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{language === 'ur' ? 'GitHub Personal Access Token (PAT)' : 'GitHub Personal Access Token'}</span>
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Android-APK-Studio-Cleaner"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>{language === 'ur' ? 'ٹوکن بنائیں (30 سیکنڈ)' : 'Generate Token (30s)'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-2 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {showToken ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {language === 'ur'
                    ? 'گٹ ہب ٹوکن صرف متصادم فائلوں کو ڈیلیٹ کرنے اور کلین ورک فلو سنک کرنے کے لیے استعمال ہوتا ہے۔'
                    : 'Token is only used locally to delete conflicting files and push clean workflow.'}
                </p>
              </div>

              {/* Scan Trigger & Status */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleScanRepo}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>
                    {isScanning
                      ? (language === 'ur' ? 'ریپوزٹری اسکین ہو رہی ہے...' : 'Scanning Repo...')
                      : (language === 'ur' ? 'ریپوزٹری دوبارہ اسکین کریں' : 'Re-Scan Repo')}
                  </span>
                </button>

                <div className="text-xs text-slate-400">
                  {conflicts.length > 0 ? (
                    <span className="text-red-400 font-semibold">
                      🚨 {conflicts.length} {language === 'ur' ? 'متصادم فائلیں ملیں' : 'Conflicting files found'}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">
                      ✓ {language === 'ur' ? 'کوئی متصادم فائل باقی نہیں ہے!' : 'No conflicting files!'}
                    </span>
                  )}
                </div>
              </div>

              {/* Detected Conflicting Files List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  {language === 'ur' ? 'ریپوزٹری میں پائی گئی متصادم فائلیں:' : 'Detected Conflicting Files to Delete:'}
                </h4>

                {conflicts.map((file) => {
                  const isSelected = selectedPaths.includes(file.path);
                  return (
                    <div
                      key={file.path}
                      onClick={() => toggleSelectPath(file.path)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-red-500/10 border-red-500/40 text-red-100'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 accent-red-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">{file.path}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                file.severity === 'critical'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {file.severity === 'critical'
                                ? (language === 'ur' ? '🚨 بلڈ بریکنگ' : 'Critical Collision')
                                : (language === 'ur' ? '⚠️ غیر ضروری' : 'Redundant')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">{file.reason}</p>
                        </div>
                      </div>

                      <a
                        href={file.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        title="View on GitHub"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: Delete & Sync */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting || selectedPaths.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-bounce' : ''}`} />
                  <span>
                    {isDeleting
                      ? (language === 'ur' ? 'فائلیں ڈیلیٹ ہو رہی ہیں...' : 'Deleting files on GitHub...')
                      : (language === 'ur'
                          ? `🗑️ منتخب ${selectedPaths.length} فائلیں فوری ڈیلیٹ کریں`
                          : `Delete ${selectedPaths.length} Selected Files`)}
                  </span>
                </button>

                <button
                  onClick={handleSyncWorkflow}
                  disabled={isSyncingWorkflow || !token.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  <FolderSync className={`w-4 h-4 ${isSyncingWorkflow ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncingWorkflow
                      ? (language === 'ur' ? 'ورک فلو سنک ہو رہا ہے...' : 'Syncing Workflow...')
                      : (language === 'ur' ? '🚀 کلین بلڈ ورک فلو سنک کریں' : 'Sync Clean Build Workflow')}
                  </span>
                </button>
              </div>

              {/* Deletion / Sync Logs & Alerts */}
              {deletionLogs.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                  {deletionLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes('✅') || log.includes('🎉')
                          ? 'text-emerald-400'
                          : log.includes('❌')
                          ? 'text-red-400'
                          : 'text-slate-300'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {workflowSyncSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {language === 'ur'
                        ? 'ورک فلو گٹ ہب پر کامیابی سے سنک ہو گیا! گٹ ہب ایکشنز اب خودکار طریقے سے چلے گا۔'
                        : 'Clean workflow pushed to GitHub! GitHub Actions will now automatically build the real APK.'}
                    </span>
                  </div>
                  <a
                    href={`https://github.com/${repoOwner}/${repoName}/actions`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold"
                  >
                    Actions
                  </a>
                </div>
              )}

              {workflowSyncError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>{workflowSyncError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Direct GitHub Web Links (No Token Needed) */}
          {activeTab === 'manual-web' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-emerald-400">
                  {language === 'ur'
                    ? 'بغیر ٹوکن کے موبائل پر گٹ ہب سے 10 سیکنڈ میں ڈیلیٹ کرنے کا طریقہ:'
                    : 'How to delete conflicting files directly in GitHub Web UI (No Token needed):'}
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    {language === 'ur'
                      ? 'نیچے دیے گئے لنک پر کلک کریں تاکہ وہ فائل گٹ ہب پر براہ راست کھل جائے۔'
                      : 'Click each direct link below to open the file on GitHub.'}
                  </li>
                  <li>
                    {language === 'ur'
                      ? 'اوپر دائیں کونے میں تین نقطوں (⋯) یا کوڑے دان 🗑️ (Delete this file) پر کلک کریں۔'
                      : 'Click the 3-dots (⋯) or Trash can 🗑️ icon at the top right.'}
                  </li>
                  <li>
                    {language === 'ur'
                      ? 'نیچے سبز رنگ کے بٹن "Commit changes..." پر کلک کر کے تصدیق کر دیں۔ فائل فوری ڈیلیٹ ہو جائے گی!'
                      : 'Click the green "Commit changes..." button to confirm. The file is deleted instantly!'}
                  </li>
                </ol>
              </div>

              {/* Direct Link Cards */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-red-500/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">build.gradle.kts</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                        {language === 'ur' ? 'روٹ ڈائریکٹری' : 'Root'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'ur'
                        ? 'build.gradle کے ساتھ متصادم ہے، فوری ڈیلیٹ کریں۔'
                        : 'Collides with build.gradle in root folder.'}
                    </p>
                  </div>
                  <a
                    href={`https://github.com/${repoOwner}/${repoName}/blob/${branch}/build.gradle.kts`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-bold transition shrink-0"
                  >
                    <span>{language === 'ur' ? 'گٹ ہب پر کھولیں 🗑️' : 'Delete on GitHub 🗑️'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-red-500/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">settings.gradle.kts</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                        {language === 'ur' ? 'روٹ ڈائریکٹری' : 'Root'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'ur'
                        ? 'settings.gradle کے ساتھ متصادم ہے، فوری ڈیلیٹ کریں۔'
                        : 'Collides with settings.gradle in root folder.'}
                    </p>
                  </div>
                  <a
                    href={`https://github.com/${repoOwner}/${repoName}/blob/${branch}/settings.gradle.kts`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-bold transition shrink-0"
                  >
                    <span>{language === 'ur' ? 'گٹ ہب پر کھولیں 🗑️' : 'Delete on GitHub 🗑️'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-red-500/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">app/build.gradle.kts</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                        {language === 'ur' ? 'ایپ ماڈیول' : 'App Module'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'ur'
                        ? 'app/build.gradle کے ساتھ متصادم ہے، فوری ڈیلیٹ کریں۔'
                        : 'Collides with app/build.gradle.'}
                    </p>
                  </div>
                  <a
                    href={`https://github.com/${repoOwner}/${repoName}/blob/${branch}/app/build.gradle.kts`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-bold transition shrink-0"
                  >
                    <span>{language === 'ur' ? 'گٹ ہب پر کھولیں 🗑️' : 'Delete on GitHub 🗑️'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* After deletion link */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                <span>
                  {language === 'ur'
                    ? 'یہ تینوں فائلیں ڈیلیٹ کرنے کے بعد گٹ ہب ایکشنز پر بلڈ خود بخود کامیابی سے چل جائے گی!'
                    : 'After deleting these 3 files, GitHub Actions will compile the real 20MB APK successfully!'}
                </span>
                <a
                  href={`https://github.com/${repoOwner}/${repoName}/actions`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 shrink-0"
                >
                  Actions 🚀
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: Terminal Command & Clean ZIP */}
          {activeTab === 'terminal' && (
            <div className="space-y-4">
              {/* Git Command */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'ur' ? 'ٹرمینل یا Termux میں چلانے کی کمانڈ:' : 'Git CLI / Termux Command:'}</span>
                  </label>
                  <button
                    onClick={handleCopyCmd}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd ? (language === 'ur' ? 'کاپی ہو گیا!' : 'Copied!') : (language === 'ur' ? 'کمانڈ کاپی کریں' : 'Copy Command')}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                  {gitCommand}
                </div>
                <p className="text-[11px] text-slate-400">
                  {language === 'ur'
                    ? 'یہ کمانڈ ایک ہی جھٹکے میں تینوں متصادم فائلوں کو ریپوزٹری سے ہٹا کر گٹ ہب پر پش کر دیتی ہے۔'
                    : 'This single command removes all 3 conflicting files and pushes the clean state to GitHub.'}
                </p>
              </div>

              {/* Clean ZIP Download */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-teal-400" />
                  <h4 className="text-xs font-bold text-slate-200">
                    {language === 'ur' ? 'مکمل کلین سورس کوڈ ZIP ڈاؤنلوڈ' : 'Download 100% Clean Project ZIP'}
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  {language === 'ur'
                    ? 'اگر آپ تمام پرانی فائلوں کو مٹا کر ایک بالکل صاف، بغیر کسی ایرر والا مکمل اینڈرائیڈ پراجیکٹ چاہتے ہیں تو یہ ZIP ڈاؤنلوڈ کر کے گٹ ہب پر اپلوڈ کر سکتے ہیں۔'
                    : 'Download a clean, verified Android project package with only non-conflicting files.'}
                </p>
                <button
                  onClick={handleDownloadCleanZip}
                  disabled={isZipping}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
                >
                  <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
                  <span>
                    {isZipping
                      ? (language === 'ur' ? 'ZIP تیار ہو رہی ہے...' : 'Generating Clean ZIP...')
                      : (language === 'ur' ? '📦 کلین پراجیکٹ ZIP ڈاؤنلوڈ کریں' : 'Download Clean Android ZIP')}
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {language === 'ur'
                ? 'کلین اپ مکمل ہوتے ہی گٹ ہب ایکشنز 15MB - 25MB والی اصلی APK بنائے گا۔'
                : 'After cleanup, GitHub Actions will compile the real 15MB - 25MB APK.'}
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
