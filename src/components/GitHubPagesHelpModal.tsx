import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  AlertTriangle, 
  Download,
  FolderArchive,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface GitHubPagesHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ur' | 'en';
}

export const GITHUB_PAGES_WORKFLOW = `name: Deploy to GitHub Pages

on:
  push:
    branches: ["main", "master"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci || npm install

      - name: Build production web app
        run: npm run build

      - name: Setup GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

export const GitHubPagesHelpModal: React.FC<GitHubPagesHelpModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState('rehmanmobilez786');
  const [repoName, setRepoName] = useState('Android-GitHub-Actions-APK-Builder');
  const [downloadingZip, setDownloadingZip] = useState(false);

  if (!isOpen) return null;

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(GITHUB_PAGES_WORKFLOW);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadWorkflowFile = () => {
    const blob = new Blob([GITHUB_PAGES_WORKFLOW], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deploy-pages.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDistZip = async () => {
    setDownloadingZip(true);
    try {
      const res = await fetch('/api/download-dist');
      if (!res.ok) {
        throw new Error('Dist bundle not ready. Please try again.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'github-pages-ready.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('ڈاؤنلوڈ ایرر: ' + (err.message || 'Error downloading dist zip'));
    } finally {
      setDownloadingZip(false);
    }
  };

  const cleanUser = username.trim() || 'rehmanmobilez786';
  const cleanRepo = repoName.trim() || 'Android-GitHub-Actions-APK-Builder';
  const computedUrl = cleanRepo === `${cleanUser}.github.io`
    ? `https://${cleanUser}.github.io/`
    : `https://${cleanUser}.github.io/${cleanRepo}/`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/50 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {language === 'ur'
                    ? 'مینول اپلوڈ کے بعد بلینک پیج کا 100% حل'
                    : 'Fix Blank Page after Manual GitHub Upload'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {cleanUser}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ur'
                  ? 'سورس فائلز بمقابلہ کمپائلڈ فائلز: آپ کا پیج چند منٹوں میں لائیو چلانے کا طریقہ'
                  : 'Source code vs Built HTML: How to get your page working live immediately'}
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          
          {/* Issue Explanation Card */}
          <div className="bg-amber-950/25 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <h3 className="font-bold text-amber-200 text-sm">
                {language === 'ur'
                  ? 'مینول فائل اپلوڈ کے بعد بھی پیج بلینک کیوں آ رہا ہے؟'
                  : 'Why is the page still blank after manual file upload?'}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {language === 'ur' ? (
                  <>
                    آپ کے اسکرین شاٹ کے مطابق آپ کی ریپوزٹری <strong>{cleanUser}/{cleanRepo}</strong> میں گٹ ہب پیجز نے فائلیں پبلش کر دی ہیں۔ 
                    لیکن آپ نے جو فائلیں اپلوڈ کی ہیں وہ <strong>سورس کوڈ</strong> (<code className="px-1 py-0.5 bg-slate-800 text-teal-300 rounded font-mono text-[11px]">src/</code>, <code className="px-1 py-0.5 bg-slate-800 text-teal-300 rounded font-mono text-[11px]">.tsx</code>) ہیں۔ 
                    موبائل براؤزر سورس کوڈ کو براہِ راست نہیں چلا سکتا بلکہ اسے تیار شدہ (<code className="px-1 py-0.5 bg-slate-800 text-teal-300 rounded font-mono text-[11px]">index.html</code> اور <code className="px-1 py-0.5 bg-slate-800 text-teal-300 rounded font-mono text-[11px]">assets/</code>) درکار ہوتی ہیں۔
                  </>
                ) : (
                  <>
                    In repository <strong>{cleanUser}/{cleanRepo}</strong>, GitHub Pages published raw uncompiled files (<code className="px-1 py-0.5 bg-slate-800 text-teal-300 rounded font-mono text-[11px]">src/</code>, <code className="px-1 py-0.5 bg-slate-800 text-teal-300 rounded font-mono text-[11px]">.tsx</code>). 
                    Browsers cannot execute raw TypeScript/JSX files directly. You need the built production bundle!
                  </>
                )}
              </p>
            </div>
          </div>

          {/* TWO SOLUTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SOLUTION A: Download Ready-to-use Dist Zip */}
            <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900 border-2 border-emerald-500/60 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-lg shadow-emerald-950/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    {language === 'ur' ? 'حل نمبر 1: تیار شدہ ویب سائٹ زپ (فوری)' : 'Solution 1: Pre-Built Web Zip (Instant)'}
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ur'
                    ? 'سب سے آسان طریقہ! نیچے دیے گئے بٹن سے بنی بنائی کمپائلڈ ویب سائٹ زپ فائل ڈاؤن لوڈ کریں۔ اسے ان زپ کر کے اس کے اندر کی تمام فائلیں (index.html اور assets فولڈر) اپنے گٹ ہب ریپو میں اپلوڈ کر دیں۔'
                    : 'Download the pre-compiled static bundle zip. Unzip it and upload its contents (index.html and assets folder) directly to your GitHub repository.'}
                </p>
              </div>

              <button
                onClick={handleDownloadDistZip}
                disabled={downloadingZip}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition cursor-pointer"
              >
                <FolderArchive className="w-4 h-4" />
                <span>
                  {downloadingZip
                    ? (language === 'ur' ? 'زپ تیار ہو رہی ہے...' : 'Generating Zip...')
                    : (language === 'ur' ? 'تیار شدہ ویب سائٹ زپ ڈاؤن لوڈ کریں' : 'Download Pre-Built dist.zip')}
                </span>
              </button>
            </div>

            {/* SOLUTION B: GitHub Actions Auto-build */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    {language === 'ur' ? 'حل نمبر 2: خودکار GitHub Actions (مستقل)' : 'Solution 2: GitHub Actions (Automated)'}
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ur'
                    ? 'ریپو کی Settings -> Pages میں Source کو "Deploy from a branch" سے بدل کر "GitHub Actions" منتخب کریں۔ اور ورک فلو فائل شامل کریں۔'
                    : 'In GitHub Settings -> Pages, change Source to "GitHub Actions" and add this automated deploy workflow.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyWorkflow}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>{copied ? (language === 'ur' ? 'کاپی ہو گیا!' : 'Copied!') : (language === 'ur' ? 'ورک فلو کاپی کریں' : 'Copy Workflow')}</span>
                </button>
                <button
                  onClick={handleDownloadWorkflowFile}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                  title="Download deploy-pages.yml"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Correct URL Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ur' ? 'آپ کی ویب سائٹ کا درست لائیو لنک (URL)' : 'Your exact Live Website URL'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">GitHub Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Repository Name:</label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-emerald-400 font-mono font-bold break-all text-xs">
                {computedUrl}
              </span>
              <a
                href={computedUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shrink-0"
              >
                <span>{language === 'ur' ? 'سائٹ کھولیں' : 'Open Site'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {language === 'ur'
                ? 'زپ اپلوڈ کرنے کے فوراً بعد موبائل پر ریفریش کریں'
                : 'After uploading files from the zip, refresh on your mobile'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadDistZip}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'ڈاؤنلوڈ زپ' : 'Download dist.zip'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
            >
              {language === 'ur' ? 'بند کریں' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
