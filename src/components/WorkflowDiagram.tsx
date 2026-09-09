import React from 'react';
import { WorkflowConfig } from '../types';
import { GitBranch, Shield, Package, Rocket, Flame, ShoppingBag, Bell, CheckCircle, Cpu } from 'lucide-react';

interface WorkflowDiagramProps {
  config: WorkflowConfig;
}

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ config }) => {
  const { qualityChecks, buildVariants, signing, deployments, notifications, matrix } = config;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">Pipeline Flow Diagram</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">.github/workflows/{config.filename}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Step 1: Triggers */}
        <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/90 hover:border-slate-700 transition">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 mb-2">
            <GitBranch className="w-3.5 h-3.5" />
            <span>1. Triggers</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            {config.triggers.pushBranches.length > 0 && (
              <div className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400">Push:</span>
                <span className="font-mono text-emerald-400 truncate max-w-[100px]">
                  {config.triggers.pushBranches.join(', ')}
                </span>
              </div>
            )}
            {config.triggers.prBranches.length > 0 && (
              <div className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400">PR:</span>
                <span className="font-mono text-sky-400 truncate max-w-[100px]">
                  {config.triggers.prBranches.join(', ')}
                </span>
              </div>
            )}
            {config.triggers.tagPatterns.length > 0 && (
              <div className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400">Tags:</span>
                <span className="font-mono text-purple-400 truncate max-w-[100px]">
                  {config.triggers.tagPatterns.join(', ')}
                </span>
              </div>
            )}
            {config.triggers.workflowDispatch && (
              <div className="bg-slate-900 text-center py-0.5 rounded text-[10px] text-slate-400 border border-slate-800">
                Manual Run Enabled
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Quality Checks */}
        <div className={`bg-slate-950/80 rounded-lg p-3 border transition ${
          qualityChecks.runAndroidLint || qualityChecks.runUnitTests
            ? 'border-slate-800/90'
            : 'border-slate-800/40 opacity-50'
        }`}>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>2. Quality Checks</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className={`px-2 py-1 rounded border flex items-center justify-between ${
              qualityChecks.runAndroidLint
                ? 'bg-slate-900 border-slate-800 text-slate-200'
                : 'bg-slate-900/50 border-slate-800/50 text-slate-500 line-through'
            }`}>
              <span>Android Lint</span>
              {qualityChecks.runAndroidLint && <CheckCircle className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className={`px-2 py-1 rounded border flex items-center justify-between ${
              qualityChecks.runUnitTests
                ? 'bg-slate-900 border-slate-800 text-slate-200'
                : 'bg-slate-900/50 border-slate-800/50 text-slate-500 line-through'
            }`}>
              <span>JUnit Unit Tests</span>
              {qualityChecks.runUnitTests && <CheckCircle className="w-3 h-3 text-emerald-400" />}
            </div>
            {qualityChecks.runDetekt && (
              <div className="px-2 py-1 rounded border bg-slate-900 border-slate-800 text-slate-200 text-[11px] flex justify-between">
                <span>Detekt Analysis</span>
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Build & Package */}
        <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/90 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
            <div className="flex items-center space-x-2">
              <Package className="w-3.5 h-3.5" />
              <span>3. Build & Sign</span>
            </div>
            {matrix.enableMatrix && (
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">Matrix</span>
            )}
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800 text-[11px]">
              <span className="text-slate-400">JDK: </span>
              <span className="font-semibold text-slate-200">{config.environment.javaVersion} ({config.environment.javaDistro})</span>
            </div>
            {signing.enableKeystoreSigning && (
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-1.5 rounded text-[11px] text-emerald-300 font-mono flex items-center gap-1">
                <span>🔐 Keystore Restored</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1 text-[10px]">
              {buildVariants.buildDebugApk && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Debug APK</span>}
              {buildVariants.buildReleaseApk && <span className="bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded">Release APK</span>}
              {buildVariants.buildReleaseAab && <span className="bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">AAB Bundle</span>}
            </div>
          </div>
        </div>

        {/* Step 4: Deployments */}
        <div className={`bg-slate-950/80 rounded-lg p-3 border transition ${
          deployments.createGithubRelease || deployments.enableFirebaseAppDistribution || deployments.enableGooglePlay
            ? 'border-slate-800/90'
            : 'border-slate-800/40 opacity-50'
        }`}>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 mb-2">
            <Rocket className="w-3.5 h-3.5" />
            <span>4. Publishing</span>
          </div>
          <div className="space-y-1.5 text-xs">
            {deployments.createGithubRelease && (
              <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-200">
                <Rocket className="w-3 h-3 text-purple-400" />
                <span>GitHub Releases</span>
              </div>
            )}
            {deployments.enableFirebaseAppDistribution && (
              <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-200">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Firebase App Dist</span>
              </div>
            )}
            {deployments.enableGooglePlay && (
              <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-200">
                <ShoppingBag className="w-3 h-3 text-emerald-400" />
                <span>Google Play ({deployments.googlePlayTrack})</span>
              </div>
            )}
            {!deployments.createGithubRelease && !deployments.enableFirebaseAppDistribution && !deployments.enableGooglePlay && (
              <span className="text-slate-500 text-[11px] italic">Artifacts only</span>
            )}
          </div>
        </div>

        {/* Step 5: Notifications */}
        <div className={`bg-slate-950/80 rounded-lg p-3 border transition ${
          notifications.enableSlack || notifications.enableDiscord
            ? 'border-slate-800/90'
            : 'border-slate-800/40 opacity-50'
        }`}>
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>5. Alerts</span>
          </div>
          <div className="space-y-1.5 text-xs">
            {notifications.enableSlack && (
              <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-200 flex justify-between items-center">
                <span>Slack Channel</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            )}
            {notifications.enableDiscord && (
              <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-200 flex justify-between items-center">
                <span>Discord Webhook</span>
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
            )}
            {!notifications.enableSlack && !notifications.enableDiscord && (
              <span className="text-slate-500 text-[11px] italic">No webhooks</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
