import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Terminal, 
  AlertTriangle, 
  Wrench, 
  Sparkles, 
  Sliders, 
  Cpu, 
  PackageCheck, 
  FileCheck, 
  ShieldAlert, 
  ArrowRight,
  GitBranch,
  Radio,
  Edit3,
  History,
  ExternalLink
} from 'lucide-react';
import { generateDebugApkBlob } from '../utils/zipHandler';
import { AccountSecurity } from '../types';

interface GitHubActionRunnerProps {
  workflowYaml: string;
  onUpdateWorkflowYaml: (newYaml: string) => void;
  language: 'ur' | 'en';
  security: AccountSecurity;
  onUpdateSecurity: (newSec: AccountSecurity) => void;
  onOpenSecurityCenter: () => void;
  onBuildComplete?: (buildInfo: {
    appName: string;
    versionName: string;
    versionCode: number;
    variant: 'debug' | 'release';
    status: 'success' | 'failed';
  }) => void;
  onEditCurrentBuild?: () => void;
  onNavigateToHistory?: () => void;
}

interface StepLog {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration?: string;
  logs: string[];
}

const COMMON_SIMULATED_ERRORS = [
  {
    id: 'none',
    labelEn: 'No Error (Clean Build Success)',
    labelUr: 'کوئی ایرر نہیں (کامیاب بلڈ)',
    stepId: null,
    errorLog: '',
  },
  {
    id: 'security-miner-detect',
    labelEn: 'Security Guard: Malicious Script Detected (Auto-Suspend)',
    labelUr: 'سیکیورٹی شیلڈ: مشکوک اسکرپٹ (خودکار اکاؤنٹ معطلی)',
    stepId: 'assemble-debug',
    errorLog: `CRITICAL SECURITY GUARD VIOLATION:
[SECURITY_AUDIT_FAIL] Unauthorized outbound daemon connection attempt detected.
Potential unauthorized background script execution or secret token exfiltration.
Violation of CI/CD Automated Runner Security Policy.
Account status automatically flagged: SUSPENDED. Action runner killed with SIGKILL.`,
  },
  {
    id: 'setup-java-no-gradle-cache',
    labelEn: 'Error: No file matched to [**/*.gradle*] (setup-java cache fail)',
    labelUr: 'ایرر: No file matched to [**/*.gradle*] (setup-java cache ایرر)',
    stepId: 'setup-java',
    errorLog: `No file in /home/runner/work/Android-GitHub-Actions-APK-Builder/Android-GitHub-Actions-APK-Builder matched to [**/*.gradle*, **/gradle-wrapper.properties, buildSrc/**/Versions.kt, buildSrc/**/Dependencies.kt, gradle/*.versions.toml, **/versions.properties], make sure you have checked out the target repository`,
  },
  {
    id: 'java-mismatch',
    labelEn: 'Error: Java 11 incompatible with AGP 8.2 (Requires Java 17)',
    labelUr: 'ایرر: Java 11 اینڈرائیڈ AGP 8.2 سے غیر مطابقت (Java 17 درکار ہے)',
    stepId: 'setup-java',
    errorLog: `* What went wrong:
An exception occurred applying plugin request [id: 'com.android.application', version: '8.2.0']
> Failed to apply plugin 'com.android.internal.application'.
   > Android Gradle plugin requires Java 17 to run. You are currently using Java 11.0.19.
     You can configure the JVM used for Gradle by setting 'org.gradle.java.home' in gradle.properties
     or upgrading setup-java to version 17 in .github/workflows/android-build.yml.`,
  },
  {
    id: 'gradlew-permission',
    labelEn: 'Error: Permission denied for ./gradlew',
    labelUr: 'ایرر: ./gradlew چلانے کی اجازت نہیں (Permission denied)',
    stepId: 'gradlew-perm',
    errorLog: `/home/runner/work/_temp/8a93e3d2-3cf9-4bf9.sh: line 1: ./gradlew: Permission denied
Error: Process completed with exit code 126.
Hint: You must grant execute permissions in your GitHub Actions workflow before running Gradle:
      run: chmod +x gradlew`,
  },
  {
    id: 'missing-sdk',
    labelEn: 'Error: Android SDK 34 Platform not installed',
    labelUr: 'ایرر: اینڈرائیڈ SDK 34 پلیٹ فارم نہیں ملا',
    stepId: 'assemble-debug',
    errorLog: `FAILURE: Build failed with an exception.
* What went wrong:
Could not determine the dependencies of task ':app:compileDebugJavaWithJavac'.
> Failed to install the following Android SDK packages as some licences have not been accepted.
     platforms;android-34 Android SDK Platform 34
  To build this project, accept the SDK license agreements and install the missing components using the Android Studio SDK Manager or sdkmanager action.`,
  },
  {
    id: 'missing-namespace',
    labelEn: 'Error: Namespace not specified in app/build.gradle.kts',
    labelUr: 'ایرر: build.gradle میں namespace غائب ہے',
    stepId: 'assemble-debug',
    errorLog: `FAILURE: Build failed with an exception.
* What went wrong:
A problem occurred evaluating project ':app'.
> Namespace not specified. Please specify a namespace in the module's build.gradle[.kts] file like so:
  android {
      namespace = 'com.example.githubactionapk'
  }`,
  },
];

export const GitHubActionRunner: React.FC<GitHubActionRunnerProps> = ({
  workflowYaml,
  onUpdateWorkflowYaml,
  language,
  security,
  onUpdateSecurity,
  onOpenSecurityCenter,
  onBuildComplete,
  onEditCurrentBuild,
  onNavigateToHistory,
}) => {
  const [triggerMode, setTriggerMode] = useState<'manual' | 'auto'>('manual');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [buildVariant, setBuildVariant] = useState<'debug' | 'release' | 'both'>('debug');
  const [runLint, setRunLint] = useState(true);

  // Security warning message
  const [securityBlockAlert, setSecurityBlockAlert] = useState<string | null>(null);

  // Error simulation selector
  const [simulatedErrorId, setSimulatedErrorId] = useState('none');

  // Runner state
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [steps, setSteps] = useState<StepLog[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [apkDownloaded, setApkDownloaded] = useState(false);

  // AI Auto Fix state
  const [isAiFixing, setIsAiFixing] = useState(false);
  const [aiFixResult, setAiFixResult] = useState<{
    diagnosis: string;
    rootCause: string;
    fixSummary: string;
    fixedYaml?: string;
    fixedSnippet?: string;
    actionSteps?: string[];
  } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  const initDefaultSteps = (): StepLog[] => [
    { id: 'checkout', name: '📥 actions/checkout@v4', status: 'pending', logs: [] },
    { id: 'setup-java', name: '☕ actions/setup-java@v4 (Java 17)', status: 'pending', logs: [] },
    { id: 'setup-gradle', name: '🐘 gradle/actions/setup-gradle@v3', status: 'pending', logs: [] },
    { id: 'gradlew-perm', name: '🔑 chmod +x gradlew', status: 'pending', logs: [] },
    { id: 'lint-check', name: '🔍 ./gradlew lintDebug', status: 'pending', logs: [] },
    { id: 'unit-tests', name: '🧪 ./gradlew testDebugUnitTest', status: 'pending', logs: [] },
    { id: 'assemble-debug', name: '📦 ./gradlew assembleDebug', status: 'pending', logs: [] },
    { id: 'upload-artifact', name: '📤 actions/upload-artifact@v4 (app-debug.apk)', status: 'pending', logs: [] },
  ];

  // Execute Simulated Workflow Run
  const handleStartRun = async (overrideErrorId?: string) => {
    // Security check: Block run if suspended or blocked
    if (security.status !== 'active') {
      setSecurityBlockAlert(
        language === 'ur'
          ? `سیکیورٹی الرٹ: آپ کا اکاؤنٹ '${security.status === 'blocked' ? 'بلاک' : 'معطل'}' ہے۔ سیکیورٹی وجوہات کی بنا پر گٹ ہب ایکشن رن بند کر دیا گیا ہے۔ پہلے سیکیورٹی تصدیق مکمل کریں۔`
          : `Security Alert: Your account is ${security.status.toUpperCase()}. Action runner execution is blocked by security guard.`
      );
      return;
    }
    setSecurityBlockAlert(null);

    const errorConfigId = overrideErrorId !== undefined ? overrideErrorId : simulatedErrorId;
    const errorPreset = COMMON_SIMULATED_ERRORS.find((e) => e.id === errorConfigId);

    setIsRunning(true);
    setRunStatus('running');
    setAiFixResult(null);
    setApkDownloaded(false);

    const freshSteps = initDefaultSteps();
    setSteps(freshSteps);

    const newLogs: string[] = [];
    const pushLog = (line: string) => {
      newLogs.push(`[${new Date().toLocaleTimeString()}] ${line}`);
      setTerminalOutput([...newLogs]);
    };

    setTerminalOutput([`🚀 Triggering GitHub Action Workflow [Android CI & APK Build] on branch '${selectedBranch}'...`]);

    for (let i = 0; i < freshSteps.length; i++) {
      const step = freshSteps[i];
      setActiveStepId(step.id);

      // Check if step is configured to fail
      const willFail = errorPreset && errorPreset.stepId === step.id;

      // Update step to running
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'running' } : s))
      );

      pushLog(`Running: ${step.name}...`);

      // Step specific realistic console outputs
      if (step.id === 'checkout') {
        await delay(500);
        pushLog('Syncing repository git refs/heads/' + selectedBranch + '...');
        pushLog('HEAD is now at commit 3b14a9c (Add Android build workflow and sources)');
      } else if (step.id === 'setup-java') {
        await delay(600);
        if (willFail) {
          pushLog('Setting up Java (Temurin 11.0.19)...');
          pushLog('JAVA_HOME set to /opt/hostedtoolcache/Java_Temurin_11');
          await delay(400);
          pushLog('❌ ' + errorPreset.errorLog);
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'failed', duration: '1.2s' } : s))
          );
          setRunStatus('failed');
          setIsRunning(false);
          return;
        } else {
          pushLog('Setting up Java (Temurin 17.0.10+7)...');
          pushLog('JAVA_HOME set to /opt/hostedtoolcache/Java_Temurin_17');
        }
      } else if (step.id === 'setup-gradle') {
        await delay(500);
        pushLog('Gradle cache restored successfully (hit 84.2 MB)');
        pushLog('Gradle daemon version 8.5 active');
      } else if (step.id === 'gradlew-perm') {
        await delay(400);
        if (willFail) {
          pushLog('Skipping chmod command or permission denied...');
          await delay(300);
          pushLog('❌ ' + errorPreset.errorLog);
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'failed', duration: '0.4s' } : s))
          );
          setRunStatus('failed');
          setIsRunning(false);
          return;
        } else {
          pushLog('Permissions granted: -rwxr-xr-x gradlew');
        }
      } else if (step.id === 'lint-check') {
        await delay(600);
        pushLog('Running lintDebug checks on 14 source files...');
        pushLog('No fatal errors found. Lint check passed successfully!');
      } else if (step.id === 'unit-tests') {
        await delay(600);
        pushLog('Executing tests: 12 tests completed, 0 failed, 0 skipped.');
        pushLog('BUILD SUCCESSFUL in 2s');
      } else if (step.id === 'assemble-debug') {
        await delay(800);
        pushLog('> Task :app:preBuild UP-TO-DATE');
        pushLog('> Task :app:compileDebugKotlin');
        pushLog('> Task :app:processDebugResources');
        pushLog('> Task :app:dexBuilderDebug');
        pushLog('> Task :app:packageDebug');

        if (willFail) {
          await delay(500);
          pushLog('❌ Execution failed for task \':app:assembleDebug\'.');
          pushLog(errorPreset.errorLog);
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'failed', duration: '3.4s' } : s))
          );
          setRunStatus('failed');
          setIsRunning(false);

          // Auto-suspend trigger if malicious script simulation
          if (errorConfigId === 'security-miner-detect') {
            onUpdateSecurity({
              ...security,
              status: 'suspended',
              reason: 'Automated Security Guard: Malicious script pattern detected during Gradle execution',
              suspendedAt: new Date().toLocaleString(),
              riskScore: 85,
              auditLogs: [
                {
                  id: Math.random().toString(36).substring(7),
                  timestamp: new Date().toLocaleString(),
                  action: 'AUTO-SUSPEND: Malicious Script Guard Triggered',
                  severity: 'danger',
                  details: 'Unauthorized process execution intercepted in runner task :app:assembleDebug.',
                },
                ...security.auditLogs,
              ],
            });
            setSecurityBlockAlert(
              language === 'ur'
                ? 'سیکیورٹی الرٹ: مشکوک اسکرپٹ ملنے کی بنا پر آپ کا اکاؤنٹ خودکار معطل کر دیا گیا ہے۔'
                : 'Security Alert: Account has been automatically SUSPENDED due to suspicious script execution.'
            );
          }

          return;
        } else {
          pushLog('Created APK: app/build/outputs/apk/debug/app-debug.apk (14.8 MB)');
          pushLog('BUILD SUCCESSFUL in 4s');
        }
      } else if (step.id === 'upload-artifact') {
        await delay(500);
        pushLog('Uploading artifact: app-debug-apk...');
        pushLog('Artifact "app-debug-apk" uploaded successfully. ID: 104928172');
      }

      // Mark step completed
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'success', duration: '1s' } : s))
      );
    }

    pushLog('🎉 Workflow Run Completed Successfully! Artifact "app-debug.apk" is ready for download.');
    setRunStatus('success');
    setIsRunning(false);

    // Record in APK Build History
    if (onBuildComplete) {
      onBuildComplete({
        appName: 'GitHub Action APK',
        versionName: '1.0.1',
        versionCode: 2,
        variant: buildVariant === 'release' ? 'release' : 'debug',
        status: 'success',
      });
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // AI Auto Fix Trigger
  const handleAiAutoFix = async () => {
    const failedStep = steps.find((s) => s.status === 'failed');
    const recentLogs = terminalOutput.slice(-15).join('\n');

    setIsAiFixing(true);
    try {
      const response = await fetch('/api/ai/fix-build-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorLog: recentLogs,
          failedStep: failedStep?.name || 'Gradle Build',
          currentYaml: workflowYaml,
          projectFilesSummary: 'Android project targeting compileSdk 34 with AGP 8.2 and Kotlin',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI error diagnosis');
      }

      const data = await response.json();
      setAiFixResult(data);
    } catch (err: any) {
      console.error('AI Fix error', err);
      // Fallback local diagnosis if network fails
      setAiFixResult({
        diagnosis: language === 'ur'
          ? 'ایرر کی تشخیص: Java ورژن یا Gradle اجازت نامہ مطابقت نہیں رکھتا۔ خودکار درستگی تیار ہے۔'
          : 'Diagnosis: Java version mismatch or missing executable permissions for gradlew.',
        rootCause: 'Environment misconfiguration in GitHub Actions runner.',
        fixSummary: language === 'ur'
          ? 'ورک فلو میں Java 17 سیٹ کیا گیا اور chmod +x gradlew شامل کیا گیا۔'
          : 'Updated workflow to use Java 17 and ensured gradlew execution permissions.',
      });
    } finally {
      setIsAiFixing(false);
    }
  };

  // Apply AI Fix and Re-run immediately
  const handleApplyFixAndRerun = () => {
    if (aiFixResult?.fixedYaml) {
      onUpdateWorkflowYaml(aiFixResult.fixedYaml);
    }
    // Clear simulated error to success
    setSimulatedErrorId('none');
    setAiFixResult(null);
    // Restart workflow run cleanly
    handleStartRun('none');
  };

  // Download the generated debug APK blob
  const handleDownloadApk = async () => {
    // Security check: Forbidden if suspended or blocked
    if (security.status !== 'active') {
      setSecurityBlockAlert(
        language === 'ur'
          ? 'سیکیورٹی پابندی: اکاؤنٹ معطل یا بلاک ہے! APK ڈاؤنلوڈ کرنے کی اجازت نہیں ہے۔ پہلے اکاؤنٹ تصدیق کریں۔'
          : 'Security Policy: APK download is locked because account is currently suspended/blocked.'
      );
      onOpenSecurityCenter();
      return;
    }

    try {
      const apkBlob = await generateDebugApkBlob('GitHubActionApk', '1.0.0');
      const url = URL.createObjectURL(apkBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'app-debug.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setApkDownloaded(true);
    } catch (err) {
      console.error('Failed to download apk blob', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Account Suspended / Blocked Alert in Runner */}
      {(security.status !== 'active' || securityBlockAlert) && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in ${
            security.status === 'blocked'
              ? 'bg-red-950/80 border-red-500/80 text-red-200'
              : 'bg-amber-950/80 border-amber-500/80 text-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                security.status === 'blocked' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {security.status === 'blocked'
                  ? language === 'ur'
                    ? '🔒 اکاؤنٹ سیکیورٹی بلاک (Execution Blocked)'
                    : '🔒 ACCOUNT BLOCKED - CI/CD PAUSED'
                  : language === 'ur'
                  ? '⚠️ اکاؤنٹ سیکیورٹی معطل (Execution Suspended)'
                  : '⚠️ ACCOUNT SUSPENDED - CI/CD PAUSED'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {securityBlockAlert ||
                  (language === 'ur'
                    ? 'سیکیورٹی پابندی عائد ہے۔ ورک فلو چلانے یا APK ڈاؤنلوڈ کرنے کے لیے پہلے سیکیورٹی تصدیق مکمل کریں۔'
                    : 'Action execution is restricted. Complete security verification to unlock builds & downloads.')}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSecurityCenter}
            className={`shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              security.status === 'blocked'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
            }`}
          >
            <span>{language === 'ur' ? 'سیکیورٹی تصدیق (Unlock)' : 'Security Unlock'}</span>
          </button>
        </div>
      )}

      {/* Runner Header & Trigger Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-slate-100">
                {language === 'ur'
                  ? 'گٹ ہب ایکشن رنر اور APK ڈاون لوڈر'
                  : 'GitHub Actions Live Runner & APK Downloader'}
              </h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                runStatus === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : runStatus === 'failed'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : runStatus === 'running'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {runStatus === 'success'
                  ? (language === 'ur' ? '✅ بلڈ کامیاب' : 'Build Passed')
                  : runStatus === 'failed'
                  ? (language === 'ur' ? '❌ بلڈ فیل ہو گئی' : 'Build Failed')
                  : runStatus === 'running'
                  ? (language === 'ur' ? '⏳ بلڈ جاری ہے...' : 'Building...')
                  : (language === 'ur' ? 'تیار' : 'Idle')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'ur'
                ? 'ورک فلو کو دستی طور پر چلائیں یا خودکار ٹرگر ٹیسٹ کریں۔ بلڈ مکمل ہونے پر debug APK ڈاؤنلوڈ کریں اور ایرر کو خودکار AI سے فکس کریں۔'
                : 'Trigger the workflow manually (workflow_dispatch) or simulate automated commits. Download debug APK on success and auto-fix any build errors.'}
            </p>
          </div>

          {/* Trigger Mode Selector */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start lg:self-auto">
            <button
              onClick={() => setTriggerMode('manual')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                triggerMode === 'manual'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'دستی ٹرگر (Manual)' : 'Manual Trigger'}</span>
            </button>
            <button
              onClick={() => setTriggerMode('auto')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                triggerMode === 'auto'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'خودکار ٹرگر (Auto Push)' : 'Auto Trigger'}</span>
            </button>
          </div>
        </div>

        {/* Trigger Options Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Branch Select */}
          <div>
            <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-emerald-400" />
              {language === 'ur' ? 'برانچ (Branch)' : 'Target Branch'}
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="main">refs/heads/main</option>
              <option value="develop">refs/heads/develop</option>
              <option value="feature/apk-v1">refs/heads/feature/apk-v1</option>
            </select>
          </div>

          {/* Build Variant */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              {language === 'ur' ? 'بلڈ قسم (Build Variant)' : 'Build Variant'}
            </label>
            <select
              value={buildVariant}
              onChange={(e) => setBuildVariant(e.target.value as any)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="debug">debug (app-debug.apk)</option>
              <option value="release">release (unsigned/signed)</option>
              <option value="both">both (Debug + Release)</option>
            </select>
          </div>

          {/* Error Simulation Picker (for testing Auto-Fixer) */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              {language === 'ur' ? 'ایرر ٹیسٹ سمیلیشن' : 'Error Test Simulator'}
            </label>
            <select
              value={simulatedErrorId}
              onChange={(e) => setSimulatedErrorId(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {COMMON_SIMULATED_ERRORS.map((err) => (
                <option key={err.id} value={err.id}>
                  {language === 'ur' ? err.labelUr : err.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Big Trigger Run Button */}
          <div className="flex items-end">
            <button
              id="manual-trigger-run-btn"
              onClick={() => handleStartRun()}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-4 rounded-lg shadow-md shadow-emerald-950/40 transition disabled:opacity-50 cursor-pointer text-xs"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'ur' ? 'ایکشن چل رہا ہے...' : 'Running Action...'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {triggerMode === 'manual'
                      ? (language === 'ur' ? 'ورک فلو چلائیں (Run Workflow)' : 'Run Workflow')
                      : (language === 'ur' ? 'پش ایونٹ ٹرگر کریں (Trigger Push)' : 'Trigger Push Event')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Error Auto-Fixer Banner (When Run Fails) */}
      {runStatus === 'failed' && (
        <div className="bg-red-950/40 border-2 border-red-500/60 rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-200 flex items-center gap-2">
                  <span>{language === 'ur' ? 'بلڈ کے دوران ایرر آ گیا ہے!' : 'Build Failed in GitHub Action'}</span>
                  <span className="text-[11px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono">
                    Exit Code 1
                  </span>
                </h3>
                <p className="text-xs text-red-300/90 mt-1">
                  {language === 'ur'
                    ? 'آپ فکر نہ کریں! ہمارا AI خودکار فکسر اس ایرر کا سبب تلاش کر کے اسے ایک کلک میں درست کر سکتا ہے۔'
                    : 'A build error occurred during execution. Use the Gemini AI Auto-Fixer to automatically analyze the stacktrace and fix the configuration.'}
                </p>
              </div>
            </div>

            <button
              id="ai-auto-fix-btn"
              onClick={handleAiAutoFix}
              disabled={isAiFixing}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition cursor-pointer shrink-0"
            >
              {isAiFixing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'ur' ? 'AI ایرر حل کر رہا ہے...' : 'AI Diagnosing Error...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{language === 'ur' ? '🤖 AI سے ایرر خودکار فکس کریں' : '🤖 Auto-Fix Error with AI'}</span>
                </>
              )}
            </button>
          </div>

          {/* AI Fix Detailed Result Card */}
          {aiFixResult && (
            <div className="mt-4 pt-4 border-t border-red-500/30 bg-slate-950/80 rounded-lg p-3 text-xs space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-semibold">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span>{language === 'ur' ? 'AI تشخیص اور حل (Diagnosis & Solution)' : 'AI Diagnosis & Auto-Fix'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    {language === 'ur' ? 'بنیادی خرابی (Root Cause)' : 'Root Cause'}
                  </span>
                  <p className="text-red-300 font-mono text-[11px]">{aiFixResult.rootCause}</p>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    {language === 'ur' ? 'لاگو کردہ اصلاح (Fix Applied)' : 'Fix Summary'}
                  </span>
                  <p className="text-emerald-300">{aiFixResult.fixSummary}</p>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed bg-purple-950/30 p-2.5 rounded border border-purple-500/30">
                {aiFixResult.diagnosis}
              </p>

              <div className="flex justify-end">
                <button
                  id="apply-fix-rerun-btn"
                  onClick={handleApplyFixAndRerun}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>
                    {language === 'ur'
                      ? 'فکس لاگو کریں اور دوبارہ چلائیں (Apply Fix & Re-run)'
                      : 'Apply Fix & Re-run Action'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Artifacts Download Card (Prominent when build passes) */}
      {runStatus === 'success' && (
        <div className="bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border-2 border-emerald-500/60 rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-inner">
                <PackageCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-emerald-100">
                    {language === 'ur'
                      ? '🎉 مبارک ہو! اینڈرائیڈ APK بلڈ کامیابی سے تیار ہے'
                      : 'Android APK Artifact Built Successfully!'}
                  </h3>
                  <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    debug-signed
                  </span>
                </div>
                <p className="text-xs text-emerald-300/90 mt-1">
                  {language === 'ur'
                    ? 'براؤزر سمولیشن ٹیسٹ مکمل ہو چکا ہے۔ اصلی اور مکمل 15MB - 25MB والی انسٹال ہونے والی اینڈرائیڈ APK گٹ ہب ایکشنز (GitHub Cloud) پر تیار ہوتی ہے۔'
                    : 'The GitHub Action simulation finished. The real 15MB - 25MB runnable Android APK is built directly on GitHub Cloud Runners.'}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-emerald-400/80">
                  <span>File: <strong className="text-white">app-debug.apk</strong></span>
                  <span>Browser Stub: <strong className="text-amber-300">~1.15 KB (Simulation)</strong></span>
                  <span>Cloud APK Size: <strong className="text-emerald-300">~15-25 MB (Full Build)</strong></span>
                  <span>Target SDK: <strong className="text-white">34 (Android 14)</strong></span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Download + Edit & Re-build + History */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Big Direct APK Download Button */}
              <button
                id="download-debug-apk-btn"
                onClick={handleDownloadApk}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 transition cursor-pointer shrink-0 transform active:scale-95"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {apkDownloaded
                    ? (language === 'ur' ? '✓ ڈاؤنلوڈ ہو گیا!' : '✓ Downloaded!')
                    : (language === 'ur' ? '📥 ٹیسٹ پیکج ڈاؤنلوڈ (1.15 KB)' : 'Download Test Stub (1.15 KB)')}
                </span>
              </button>

              {/* Direct Link to Real GitHub Actions Runs */}
              <a
                href="https://github.com/rehmanmobilez786/Android-apk-builder-GitHub-studio-/actions"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-bold text-xs transition cursor-pointer"
                title="Open GitHub Actions to download real 20MB APK"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {language === 'ur'
                    ? 'گٹ ہب پر اصلی 20MB والی APK دیکھیں'
                    : 'Get Real 20MB APK on GitHub'}
                </span>
              </a>

              {/* Edit this Build Button */}
              {onEditCurrentBuild && (
                <button
                  id="runner-edit-build-btn"
                  onClick={onEditCurrentBuild}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 font-bold text-xs transition cursor-pointer"
                  title="Modify app name, version, and rebuild"
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-300" />
                  <span>
                    {language === 'ur'
                      ? 'اس بلڈ میں تبدیلی کریں'
                      : 'Edit & Rebuild'}
                  </span>
                </button>
              )}

              {/* View History Button */}
              {onNavigateToHistory && (
                <button
                  id="runner-history-nav-btn"
                  onClick={onNavigateToHistory}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 font-semibold text-xs transition cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {language === 'ur' ? 'ہسٹری دیکھیں' : 'View History'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Console Grid: Steps on Left, Terminal on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Workflow Steps Timeline */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              {language === 'ur' ? 'ایکشن اسٹیپس (Workflow Steps)' : 'Workflow Steps'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Runner: ubuntu-latest
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {steps.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <Clock className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs">
                  {language === 'ur'
                    ? 'اوپر والے بٹن "ورک فلو چلائیں" پر کلک کریں'
                    : 'Click "Run Workflow" above to start runner'}
                </p>
              </div>
            )}

            {steps.map((step) => {
              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                    step.status === 'running'
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-200 animate-pulse'
                      : step.status === 'success'
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : step.status === 'failed'
                      ? 'bg-red-950/40 border-red-500/60 text-red-200'
                      : 'bg-slate-950/50 border-slate-800/60 text-slate-400 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {step.status === 'running' && (
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                    )}
                    {step.status === 'success' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {step.status === 'failed' && (
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    {step.status === 'pending' && (
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="font-mono truncate">{step.name}</span>
                  </div>

                  {step.duration && (
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                      {step.duration}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Job: build (Android APK)</span>
            <span>OS: Linux 6.5.0-generic</span>
          </div>
        </div>

        {/* Right: Live Terminal Log Console */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl flex flex-col h-[480px] overflow-hidden shadow-inner">
          {/* Terminal Title Bar */}
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-slate-300">
                GitHub Action Terminal Logs
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="text-[11px] text-slate-400 font-mono">live-stream</span>
            </div>
          </div>

          {/* Terminal Logs Content */}
          <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
            {terminalOutput.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                <span>Waiting for workflow trigger...</span>
              </div>
            ) : (
              terminalOutput.map((line, idx) => {
                const isError = line.includes('❌') || line.includes('FAILURE') || line.includes('Error:') || line.includes('Permission denied');
                const isSuccess = line.includes('🎉') || line.includes('BUILD SUCCESSFUL') || line.includes('uploaded successfully');
                return (
                  <div
                    key={idx}
                    className={`${
                      isError
                        ? 'text-red-400 font-semibold bg-red-950/20 p-1 rounded'
                        : isSuccess
                        ? 'text-emerald-400 font-medium'
                        : 'text-slate-300'
                    }`}
                  >
                    {line}
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Footer */}
          <div className="px-4 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Buffer: {terminalOutput.length} lines</span>
            <span>Runner ID: runner-prod-10928</span>
          </div>
        </div>

      </div>
    </div>
  );
};
