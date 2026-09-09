import React, { useState, useMemo } from 'react';
import { WorkflowConfig, AccountSecurity } from './types';
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
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<WorkflowConfig>({ ...defaultConfig });
  const [customYaml, setCustomYaml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'runner' | 'files' | 'config'>('runner');
  const [language, setLanguage] = useState<'ur' | 'en'>('ur');

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
        onSelectPreset={handleSelectPreset}
        onOpenKeystoreHelper={() => setIsKeystoreModalOpen(true)}
        onOpenGradleSnippet={() => setIsGradleModalOpen(true)}
        onOpenSecretsChecklist={() => setIsSecretsModalOpen(true)}
        onOpenAiCustomizer={() => setIsAiModalOpen(true)}
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
          />
        )}

        {/* TAB 2: Complete Android Build Files & ZIP Uploader */}
        {activeTab === 'files' && (
          <AndroidProjectViewer
            currentYaml={activeYaml}
            onUpdateYaml={(newYaml) => setCustomYaml(newYaml)}
            language={language}
          />
        )}

        {/* TAB 3: Workflow Configurator & YAML Viewer */}
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
    </div>
  );
}
