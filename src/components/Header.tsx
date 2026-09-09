import React from 'react';
import { PRESETS } from '../data/presets';
import { WorkflowConfig, AccountSecurity } from '../types';
import { 
  Sparkles, 
  Download, 
  Copy, 
  Key, 
  Code, 
  ShieldCheck, 
  ShieldAlert,
  ShieldX,
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  FolderArchive, 
  Sliders,
  Languages,
  History
} from 'lucide-react';

interface HeaderProps {
  currentConfig: WorkflowConfig;
  qualityScore: number;
  activeTab: 'runner' | 'files' | 'history' | 'config';
  onSelectTab: (tab: 'runner' | 'files' | 'history' | 'config') => void;
  language: 'ur' | 'en';
  onToggleLanguage: () => void;
  security: AccountSecurity;
  onOpenSecurityCenter: () => void;
  historyCount?: number;
  onSelectPreset: (presetId: string) => void;
  onOpenKeystoreHelper: () => void;
  onOpenGradleSnippet: () => void;
  onOpenSecretsChecklist: () => void;
  onOpenAiCustomizer: () => void;
  onCopyYaml: () => void;
  onDownloadYaml: () => void;
  copied: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentConfig,
  qualityScore,
  activeTab,
  onSelectTab,
  language,
  onToggleLanguage,
  security,
  onOpenSecurityCenter,
  historyCount = 0,
  onSelectPreset,
  onOpenKeystoreHelper,
  onOpenGradleSnippet,
  onOpenSecretsChecklist,
  onOpenAiCustomizer,
  onCopyYaml,
  onDownloadYaml,
  copied,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M17.52 0c-.3 0-.58.12-.79.33l-2.58 2.58C12.82 2.33 11.44 2 10 2c-4.42 0-8 3.58-8 8 0 2.22.91 4.23 2.38 5.68L2.05 18.01a.996.996 0 0 0 .71 1.7c.26 0 .52-.1.71-.29l2.33-2.33C7.23 17.55 8.58 18 10 18c4.42 0 8-3.58 8-8 0-1.44-.33-2.82-.91-4.15l2.58-2.58c.41-.41.41-1.07 0-1.48L18.31.33C18.1.12 17.82 0 17.52 0zm-7.52 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
                  {language === 'ur' ? 'اینڈرائیڈ گٹ ہب ایکشن اور APK بلڈر' : 'Android GitHub Actions & APK Builder'}
                </h1>
                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  CI/CD + AI Auto-Fix
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ur'
                  ? 'تمام بلڈ فائلز، سورس کوڈ ZIP اپلوڈ، خودکار رنر، بلڈ ہسٹری، اور ڈیبگ APK ڈاؤنلوڈر'
                  : 'Complete Android build files, ZIP upload, Action Runner, Build History & APK downloader'}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start lg:self-auto overflow-x-auto max-w-full">
            <button
              id="tab-runner-btn"
              onClick={() => onSelectTab('runner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'runner'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'ur' ? 'ایکشن رنر اور APK' : 'Runner & APK'}</span>
            </button>

            <button
              id="tab-files-btn"
              onClick={() => onSelectTab('files')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'files'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'پراجیکٹ فائلز' : 'Project Files'}</span>
            </button>

            {/* TAB: BUILD HISTORY (NEW) */}
            <button
              id="tab-history-btn"
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'بلڈ ہسٹری اور ایڈیٹر' : 'Build History & Edit'}</span>
              {historyCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    activeTab === 'history'
                      ? 'bg-emerald-950 text-emerald-200'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {historyCount}
                </span>
              )}
            </button>

            <button
              id="tab-config-btn"
              onClick={() => onSelectTab('config')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'config'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'ورک فلو کنفیگ' : 'Workflow Config'}</span>
            </button>
          </div>

          {/* Language Toggle & Helper Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Security Guard Badge Button */}
            <button
              id="header-security-status-btn"
              onClick={onOpenSecurityCenter}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                security.status === 'active'
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : security.status === 'suspended'
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/60 text-amber-300 animate-pulse'
                  : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/60 text-red-300 animate-pulse'
              }`}
              title="Account Security & Suspension / Block Status"
            >
              {security.status === 'active' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : security.status === 'suspended' ? (
                <ShieldAlert className="w-3.5 h-3.5" />
              ) : (
                <ShieldX className="w-3.5 h-3.5" />
              )}
              <span>
                {security.status === 'active'
                  ? language === 'ur'
                    ? 'سیکیورٹی: فعال'
                    : 'Security: Active'
                  : security.status === 'suspended'
                  ? language === 'ur'
                    ? 'اکاؤنٹ: معطل'
                    : 'Account: Suspended'
                  : language === 'ur'
                  ? 'اکاؤنٹ: بلاک'
                  : 'Account: Blocked'}
              </span>
            </button>

            {/* Urdu / English Language Switcher */}
            <button
              id="language-toggle-btn"
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Toggle Urdu / English language"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'ur' ? 'English' : 'اردو (Urdu)'}</span>
            </button>

            <button
              onClick={onOpenAiCustomizer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>{language === 'ur' ? 'AI مددگار' : 'Ask AI'}</span>
            </button>

            <button
              onClick={onCopyYaml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-teal-400" />
              <span>{copied ? (language === 'ur' ? 'کاپی ہو گیا!' : 'Copied!') : 'YAML'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
