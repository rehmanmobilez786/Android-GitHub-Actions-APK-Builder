import React, { useState, useMemo } from 'react';
import { WorkflowConfig, AccountSecurity, ApkBuildHistoryItem } from './types';
import { defaultConfig, PRESETS } from './data/presets';
import { generateWorkflowYaml } from './utils/yamlGenerator';
import { validateWorkflowConfig } from './utils/yamlValidator';
import { Header } from './components/Header';
import { WorkflowDiagram } from './components/WorkflowDiagram';
import { Configurator } from './components/Configurator';
import { YamlViewer } from './components/YamlViewer';
import { KeystoreHelperModal } from './components/KeystoreHelperModal';
import { GradleSnippetModal } from './components/GradleSnippetModal';
import { SecretsChecklistModal } from './components/SecretsChecklistModal';
import { AiCustomizerModal } from './components/AiCustomizerModal';
import { GitHubActionRunner } from './components/GitHubActionRunner';
import { AndroidProjectViewer } from './components/AndroidProjectViewer';
import { SecurityBanner } from './components/SecurityBanner';
import { SecurityCenterModal } from './components/SecurityCenterModal';
import { BuildHistoryViewer } from './components/BuildHistoryViewer';
import { EditBuildModal } from './components/EditBuildModal';
import { GitHubPagesHelpModal } from './components/GitHubPagesHelpModal';
import { SourceCodeManagerModal } from './components/SourceCodeManagerModal';
import { AndroidProjectFile, DEFAULT_ANDROID_FILES } from './data/defaultAndroidProject';
import { 
  getBuildHistory, 
  addBuildToHistory, 
  deleteBuildFromHistory, 
  applyModificationsToProjectFiles,
  generateSafeSha256,
  BuildEditFormValues
} from './utils/historyStorage';
import { 
  Play, 
  FolderArchive, 
  Sliders, 
  Sparkles, 
  Key, 
  Code, 
  ShieldCheck, 
  ShieldAlert,
  Download,
  AlertCircle,
  History,
  Globe
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<WorkflowConfig>({ ...defaultConfig });
  const [customYaml, setCustomYaml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'runner' | 'files' | 'history' | 'config'>('runner');
  const [language, setLanguage] = useState<'ur' | 'en'>('ur');

  // Build History State & Project Files State
  const [buildHistory, setBuildHistory] = useState<ApkBuildHistoryItem[]>(() => getBuildHistory());
  const [projectFiles, setProjectFiles] = useState<AndroidProjectFile[]>([...DEFAULT_ANDROID_FILES]);
  const [editingBuildItem, setEditingBuildItem] = useState<ApkBuildHistoryItem | null>(null);
  const [isEditBuildModalOpen, setIsEditBuildModalOpen] = useState(false);

  // Account Security State (Active, Suspended, Blocked)
  const [security, setSecurity] = useState<AccountSecurity>({
    status: 'active',
    riskScore: 0,
    twoFactorEnabled: false,
    autoGuardEnabled: true,
    recoveryPin: '2026',
    auditLogs: [
      {
        id: 'sec-init',
        timestamp: new Date().toLocaleTimeString(),
        action: 'Account Security Shield Active',
        severity: 'info',
        details: 'Automated runner protection, Keystore security, and anti-tamper monitoring active.',
      },
    ],
  });

  // Modals state
  const [isSecurityCenterOpen, setIsSecurityCenterOpen] = useState(false);
  const [isKeystoreModalOpen, setIsKeystoreModalOpen] = useState(false);
  const [isGradleModalOpen, setIsGradleModalOpen] = useState(false);
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGitHubPagesModalOpen, setIsGitHubPagesModalOpen] = useState(false);
  const [isSourceCodeManagerOpen, setIsSourceCodeManagerOpen] = useState(false);

  // Generate YAML and Annotations
  const { yaml: generatedYaml, annotations } = useMemo(() => {
    return generateWorkflowYaml(config);
  }, [config]);

  const activeYaml = customYaml || generatedYaml;

  // Linter Validation and Score
  const { issues, score: qualityScore } = useMemo(() => {
    return validateWorkflowConfig(config);
  }, [config]);

  // Handlers
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setConfig(JSON.parse(JSON.stringify(preset.config)));
      setCustomYaml(null);
    }
  };

  const handleConfigChange = (newConfig: WorkflowConfig) => {
    setConfig(newConfig);
    setCustomYaml(null); // Reset manual custom YAML when form changes
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(activeYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadYaml = () => {
    const blob = new Blob([activeYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = config.filename || 'android-build.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyAiYaml = (aiYaml: string) => {
    setCustomYaml(aiYaml);
  };

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'ur' ? 'en' : 'ur'));
  };

  // Build History & Edit Handlers
  const handleSelectEditBuild = (item: ApkBuildHistoryItem) => {
    setEditingBuildItem(item);
    setIsEditBuildModalOpen(true);
  };

  const handleSaveAndRebuild = (values: BuildEditFormValues, autoRunBuild: boolean) => {
    const updatedFiles = applyModificationsToProjectFiles(projectFiles, values);
    setProjectFiles(updatedFiles);

    const nextBuildNumber =
      buildHistory && buildHistory.length > 0
        ? Math.max(100, ...buildHistory.map((b) => Number(b?.buildNumber) || 100)) + 1
        : 103;

    const shaHex = generateSafeSha256();

    const newBuildItem: ApkBuildHistoryItem = {
      id: `build-${nextBuildNumber}`,
      buildNumber: nextBuildNumber,
      timestamp: new Date().toLocaleString(),
      appName: values.appName,
      packageName: values.packageName,
      versionName: values.versionName,
      versionCode: values.versionCode,
      variant: values.variant,
      status: 'success',
      apkFileName: `app-${values.variant}.apk`,
      apkSize: values.variant === 'release' ? '12.4 MB' : '14.9 MB',
      sha256: shaHex,
      workflowYaml: activeYaml,
      durationSeconds: 74,
      triggeredBy: 'rebuild_edit',
      notes: values.notes,
      changesSummary: `Modified app "${values.appName}" to v${values.versionName} (Build ${values.versionCode}). Target SDK ${values.compileSdk}.`,
      projectFilesSummary: {
        filesCount: updatedFiles.length,
        gradleVersion: '8.5',
        compileSdk: values.compileSdk.toString(),
      },
      projectFilesSnapshot: updatedFiles.map((f) => ({
        path: f.path,
        name: f.name,
        content: f.content,
      })),
    };

    const updatedHistory = addBuildToHistory(newBuildItem);
    setBuildHistory(updatedHistory);

    if (autoRunBuild) {
      setActiveTab('runner');
    }
  };

  const handleRestoreBuildFiles = (item: ApkBuildHistoryItem) => {
    if (item.projectFilesSnapshot && item.projectFilesSnapshot.length > 0) {
      const restored = projectFiles.map((f) => {
        const found = item.projectFilesSnapshot?.find((s) => s.path === f.path);
        return found ? { ...f, content: found.content } : f;
      });
      setProjectFiles(restored);
    }
    setActiveTab('files');
  };

  const handleDeleteBuild = (id: string) => {
    const updated = deleteBuildFromHistory(id);
    setBuildHistory(updated);
  };

  const handleRunnerBuildComplete = (info: {
    appName: string;
    versionName: string;
    versionCode: number;
    variant: 'debug' | 'release';
    status: 'success' | 'failed';
  }) => {
    const nextBuildNumber =
      buildHistory && buildHistory.length > 0
        ? Math.max(100, ...buildHistory.map((b) => Number(b?.buildNumber) || 100)) + 1
        : 103;

    const shaHex = generateSafeSha256();

    const newBuildItem: ApkBuildHistoryItem = {
      id: `build-${nextBuildNumber}`,
      buildNumber: nextBuildNumber,
      timestamp: new Date().toLocaleString(),
      appName: info.appName,
      packageName: 'com.example.githubactionapk',
      versionName: info.versionName,
      versionCode: info.versionCode,
      variant: info.variant,
      status: info.status,
      apkFileName: `app-${info.variant}.apk`,
      apkSize: '14.8 MB',
      sha256: shaHex,
      workflowYaml: activeYaml,
      durationSeconds: 78,
      triggeredBy: 'manual',
      notes: 'Automated GitHub Actions CI/CD runner artifact generation.',
      changesSummary: `Completed automated ${info.variant.toUpperCase()} build v${info.versionName}.`,
      projectFilesSummary: {
        filesCount: projectFiles.length,
        gradleVersion: '8.5',
        compileSdk: '34',
      },
      projectFilesSnapshot: projectFiles.map((f) => ({
        path: f.path,
        name: f.name,
        content: f.content,
      })),
    };

    const updatedHistory = addBuildToHistory(newBuildItem);
    setBuildHistory(updatedHistory);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        currentConfig={config}
        qualityScore={qualityScore}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        security={security}
        onOpenSecurityCenter={() => setIsSecurityCenterOpen(true)}
        historyCount={buildHistory.length}
        onSelectPreset={handleSelectPreset}
        onOpenKeystoreHelper={() => setIsKeystoreModalOpen(true)}
        onOpenGradleSnippet={() => setIsGradleModalOpen(true)}
        onOpenSecretsChecklist={() => setIsSecretsModalOpen(true)}
        onOpenAiCustomizer={() => setIsAiModalOpen(true)}
        onOpenGitHubPagesHelp={() => setIsGitHubPagesModalOpen(true)}
        onOpenSourceCodeManager={() => setIsSourceCodeManagerOpen(true)}
        onCopyYaml={handleCopyYaml}
        onDownloadYaml={handleDownloadYaml}
        copied={copied}
      />

      {/* Account Security Alert Banner (Shows when Suspended or Blocked) */}
      <SecurityBanner
        security={security}
        onOpenSecurityCenter={() => setIsSecurityCenterOpen(true)}
        language={language}
      />

      {/* Sub-bar with Presets & Quick Tools */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Presets List */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">
              {language === 'ur' ? 'ریڈی میڈ سانچے (Presets):' : 'Templates:'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className="px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer text-[11px]"
                  title={p.description}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('history')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700/80 transition cursor-pointer text-[11px]"
            >
              <History className="w-3 h-3" />
              <span>{language === 'ur' ? 'بلڈ ہسٹری' : 'Build History'} ({buildHistory.length})</span>
            </button>
            <button
              onClick={() => setIsKeystoreModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700/80 transition cursor-pointer text-[11px]"
            >
              <Key className="w-3 h-3" />
              <span>Keystore Base64</span>
            </button>
            <button
              onClick={() => setIsGradleModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700/80 transition cursor-pointer text-[11px]"
            >
              <Code className="w-3 h-3" />
              <span>Gradle Signing DSL</span>
            </button>
            <button
              onClick={() => setIsSecretsModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700/80 transition cursor-pointer text-[11px]"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>GitHub Secrets</span>
            </button>
            <button
              id="quick-gh-pages-btn"
              onClick={() => setIsGitHubPagesModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-300 border border-teal-500/50 transition cursor-pointer text-[11px] font-semibold"
              title="Fix ez786.github.io blank page"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{language === 'ur' ? 'ez786 بلینک پیج حل' : 'Fix ez786 Blank'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4 flex flex-col">
        
        {/* Pipeline Diagram (Visual Representation of CI/CD) */}
        <WorkflowDiagram config={config} />

        {/* TAB 1: Live GitHub Action Runner, Triggers, Artifacts & AI Error Fixer */}
        {activeTab === 'runner' && (
          <GitHubActionRunner
            workflowYaml={activeYaml}
            onUpdateWorkflowYaml={(newYaml) => setCustomYaml(newYaml)}
            language={language}
            security={security}
            onUpdateSecurity={setSecurity}
            onOpenSecurityCenter={() => setIsSecurityCenterOpen(true)}
            onBuildComplete={handleRunnerBuildComplete}
            onEditCurrentBuild={() => {
              if (buildHistory.length > 0) {
                handleSelectEditBuild(buildHistory[0]);
              }
            }}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}

        {/* TAB 2: Complete Android Build Files & ZIP Uploader */}
        {activeTab === 'files' && (
          <AndroidProjectViewer
            currentYaml={activeYaml}
            onUpdateYaml={(newYaml) => setCustomYaml(newYaml)}
            language={language}
            projectFiles={projectFiles}
            onUpdateProjectFiles={setProjectFiles}
            onOpenSourceCodeManager={() => setIsSourceCodeManagerOpen(true)}
          />
        )}

        {/* TAB 3: Build History Viewer & APK Modifier (NEW) */}
        {activeTab === 'history' && (
          <BuildHistoryViewer
            history={buildHistory}
            onSelectEditBuild={handleSelectEditBuild}
            onRestoreBuildFiles={handleRestoreBuildFiles}
            onDeleteBuild={handleDeleteBuild}
            security={security}
            onOpenSecurityCenter={() => setIsSecurityCenterOpen(true)}
            language={language}
            onOpenSourceCodeManager={() => setIsSourceCodeManagerOpen(true)}
          />
        )}

        {/* TAB 4: Workflow Configurator & YAML Viewer */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
            {/* Left Column: Interactive Configurator */}
            <div className="lg:col-span-5 space-y-4">
              <Configurator config={config} onChange={handleConfigChange} />
            </div>

            {/* Right Column: Code Viewer */}
            <div className="lg:col-span-7 h-[700px] sticky top-16">
              <YamlViewer
                yaml={activeYaml}
                filename={config.filename}
                annotations={annotations}
                issues={issues}
                qualityScore={qualityScore}
                onCopy={handleCopyYaml}
                onDownload={handleDownloadYaml}
                copied={copied}
              />
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <EditBuildModal
        isOpen={isEditBuildModalOpen}
        onClose={() => setIsEditBuildModalOpen(false)}
        buildItem={editingBuildItem}
        onSaveAndRebuild={handleSaveAndRebuild}
        language={language}
      />

      <SecurityCenterModal
        isOpen={isSecurityCenterOpen}
        onClose={() => setIsSecurityCenterOpen(false)}
        security={security}
        onUpdateSecurity={setSecurity}
        language={language}
      />

      <KeystoreHelperModal
        isOpen={isKeystoreModalOpen}
        onClose={() => setIsKeystoreModalOpen(false)}
        keystorePath={config.signing.keystorePath}
      />

      <GradleSnippetModal
        isOpen={isGradleModalOpen}
        onClose={() => setIsGradleModalOpen(false)}
        config={config}
      />

      <SecretsChecklistModal
        isOpen={isSecretsModalOpen}
        onClose={() => setIsSecretsModalOpen(false)}
        config={config}
      />

      <AiCustomizerModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentYaml={activeYaml}
        onApplyYaml={handleApplyAiYaml}
      />

      <GitHubPagesHelpModal
        isOpen={isGitHubPagesModalOpen}
        onClose={() => setIsGitHubPagesModalOpen(false)}
        language={language}
      />

      <SourceCodeManagerModal
        isOpen={isSourceCodeManagerOpen}
        onClose={() => setIsSourceCodeManagerOpen(false)}
        language={language}
        projectFiles={projectFiles}
        onUpdateProjectFiles={(newFiles) => setProjectFiles(newFiles)}
        onNavigateToHistory={() => setActiveTab('history')}
      />
    </div>
  );
}
