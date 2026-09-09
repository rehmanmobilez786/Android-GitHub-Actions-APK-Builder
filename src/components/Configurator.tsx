import React, { useState } from 'react';
import { WorkflowConfig, RunnerOS, JavaVersion, JavaDistro } from '../types';
import { Sliders, Cpu, Shield, Key, Rocket, Bell, Layers, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

interface ConfiguratorProps {
  config: WorkflowConfig;
  onChange: (updatedConfig: WorkflowConfig) => void;
}

export const Configurator: React.FC<ConfiguratorProps> = ({ config, onChange }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'env' | 'quality' | 'build' | 'signing' | 'deploy' | 'notifications'>('general');

  const update = (path: string, value: any) => {
    const keys = path.split('.');
    const nextConfig = JSON.parse(JSON.stringify(config));
    let curr = nextConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      curr = curr[keys[i]];
    }
    curr[keys[keys.length - 1]] = value;
    onChange(nextConfig);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Configuration Section Tabs */}
      <div className="flex flex-wrap bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
            activeTab === 'general'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>General & Triggers</span>
        </button>

        <button
          onClick={() => setActiveTab('env')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
            activeTab === 'env'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>JDK & Environment</span>
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
            activeTab === 'quality'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Testing & Lint</span>
        </button>

        <button
          onClick={() => setActiveTab('build')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
            activeTab === 'build'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Variants & Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('signing')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
            activeTab === 'signing'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Keystore Signing</span>
        </button>

        <button
          onClick={() => setActiveTab('deploy')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
            activeTab === 'deploy'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Publish & Deploy</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
            activeTab === 'notifications'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alerts</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 space-y-4 text-xs text-slate-300">
        
        {/* TAB 1: General Settings & Triggers */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={config.workflowName}
                  onChange={(e) => update('workflowName', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Android Universal CI/CD"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Filename</label>
                <input
                  type="text"
                  value={config.filename}
                  onChange={(e) => update('filename', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. android-build.yml"
                />
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-3 space-y-3">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Git Event Triggers</h4>
              
              <div>
                <label className="block text-slate-400 mb-1">Push Branches (comma separated)</label>
                <input
                  type="text"
                  value={config.triggers.pushBranches.join(', ')}
                  onChange={(e) =>
                    update(
                      'triggers.pushBranches',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="main, master, release/*"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Pull Request Target Branches (comma separated)</label>
                <input
                  type="text"
                  value={config.triggers.prBranches.join(', ')}
                  onChange={(e) =>
                    update(
                      'triggers.prBranches',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="main, master, develop"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Release Tag Patterns (comma separated)</label>
                <input
                  type="text"
                  value={config.triggers.tagPatterns.join(', ')}
                  onChange={(e) =>
                    update(
                      'triggers.tagPatterns',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="v*.*.*, v*"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="workflowDispatch"
                  checked={config.triggers.workflowDispatch}
                  onChange={(e) => update('triggers.workflowDispatch', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-950"
                />
                <label htmlFor="workflowDispatch" className="text-slate-300 font-medium cursor-pointer">
                  Enable Manual Run Button (<code className="text-emerald-400">workflow_dispatch</code>)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JDK & Environment */}
        {activeTab === 'env' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Runner OS</label>
                <select
                  value={config.environment.runnerOS}
                  onChange={(e) => update('environment.runnerOS', e.target.value as RunnerOS)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ubuntu-latest">ubuntu-latest (Recommended)</option>
                  <option value="ubuntu-22.04">ubuntu-22.04</option>
                  <option value="macos-latest">macos-latest (For KMP/iOS dual builds)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Java JDK Version</label>
                <select
                  value={config.environment.javaVersion}
                  onChange={(e) => update('environment.javaVersion', e.target.value as JavaVersion)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="17">Java 17 (Standard for AGP 8.0+)</option>
                  <option value="21">Java 21 (Latest LTS)</option>
                  <option value="11">Java 11 (Legacy)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">JDK Distribution</label>
                <select
                  value={config.environment.javaDistro}
                  onChange={(e) => update('environment.javaDistro', e.target.value as JavaDistro)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="temurin">Eclipse Temurin</option>
                  <option value="zulu">Azul Zulu</option>
                  <option value="corretto">Amazon Corretto</option>
                  <option value="liberca">BellSoft Liberica</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-3 space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 block">Official Gradle Cache Action</span>
                  <span className="text-slate-400 text-[11px]">Uses <code className="text-emerald-400">gradle/actions/setup-gradle@v3</code> for fast dependency & output caching.</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.environment.enableGradleCache}
                  onChange={(e) => update('environment.enableGradleCache', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Testing & Quality Checks */}
        {activeTab === 'quality' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Run Android Lint Checks</span>
                <span className="text-slate-400 text-[11px]">Executes <code className="text-sky-400">./gradlew lintDebug</code> to detect potential bugs and security flaws.</span>
              </div>
              <input
                type="checkbox"
                checked={config.qualityChecks.runAndroidLint}
                onChange={(e) => update('qualityChecks.runAndroidLint', e.target.checked)}
                className="rounded border-slate-700 text-emerald-500"
              />
            </div>

            {config.qualityChecks.runAndroidLint && (
              <div className="ml-4 p-2.5 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Upload SARIF Report to GitHub Security Tab</span>
                <input
                  type="checkbox"
                  checked={config.qualityChecks.uploadSarifReport}
                  onChange={(e) => update('qualityChecks.uploadSarifReport', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Run JUnit Unit Tests</span>
                <span className="text-slate-400 text-[11px]">Executes <code className="text-sky-400">./gradlew testDebugUnitTest</code> for local unit tests.</span>
              </div>
              <input
                type="checkbox"
                checked={config.qualityChecks.runUnitTests}
                onChange={(e) => update('qualityChecks.runUnitTests', e.target.checked)}
                className="rounded border-slate-700 text-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Run Detekt Static Code Analysis</span>
                <span className="text-slate-400 text-[11px]">Executes <code className="text-sky-400">./gradlew detekt</code> for Kotlin static analysis.</span>
              </div>
              <input
                type="checkbox"
                checked={config.qualityChecks.runDetekt}
                onChange={(e) => update('qualityChecks.runDetekt', e.target.checked)}
                className="rounded border-slate-700 text-emerald-500"
              />
            </div>
          </div>
        )}

        {/* TAB 4: Build Variants & Matrix */}
        {activeTab === 'build' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Binary Output Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Debug APK</span>
                  <span className="text-slate-400 text-[10px]">./gradlew assembleDebug</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.buildVariants.buildDebugApk}
                  onChange={(e) => update('buildVariants.buildDebugApk', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Release APK</span>
                  <span className="text-slate-400 text-[10px]">./gradlew assembleRelease</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.buildVariants.buildReleaseApk}
                  onChange={(e) => update('buildVariants.buildReleaseApk', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Release AAB (Bundle)</span>
                  <span className="text-slate-400 text-[10px]">./gradlew bundleRelease</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.buildVariants.buildReleaseAab}
                  onChange={(e) => update('buildVariants.buildReleaseAab', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Parallel Matrix Strategy</h4>
                  <p className="text-slate-400 text-[11px]">Build multiple product flavors & build types concurrently.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.matrix.enableMatrix}
                  onChange={(e) => update('matrix.enableMatrix', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
              </div>

              {config.matrix.enableMatrix && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <label className="block text-slate-400 mb-1">Matrix Product Flavors (comma separated)</label>
                    <input
                      type="text"
                      value={config.matrix.matrixFlavors.join(', ')}
                      onChange={(e) =>
                        update(
                          'matrix.matrixFlavors',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                      placeholder="dev, staging, prod"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Matrix Build Types (comma separated)</label>
                    <input
                      type="text"
                      value={config.matrix.matrixBuildTypes.join(', ')}
                      onChange={(e) =>
                        update(
                          'matrix.matrixBuildTypes',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                      placeholder="debug, release"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Keystore Signing */}
        {activeTab === 'signing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Automated Base64 Keystore Signing</span>
                <span className="text-slate-400 text-[11px]">Decodes Base64 keystore string from GitHub Secret into disk during build.</span>
              </div>
              <input
                type="checkbox"
                checked={config.signing.enableKeystoreSigning}
                onChange={(e) => update('signing.enableKeystoreSigning', e.target.checked)}
                className="rounded border-slate-700 text-emerald-500"
              />
            </div>

            {config.signing.enableKeystoreSigning && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Keystore Base64 Secret Name</label>
                  <input
                    type="text"
                    value={config.signing.keystoreSecretName}
                    onChange={(e) => update('signing.keystoreSecretName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-emerald-400"
                    placeholder="KEYSTORE_BASE64"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Key Alias Secret Name</label>
                  <input
                    type="text"
                    value={config.signing.aliasSecretName}
                    onChange={(e) => update('signing.aliasSecretName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-emerald-400"
                    placeholder="RELEASE_KEY_ALIAS"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Store Password Secret Name</label>
                  <input
                    type="text"
                    value={config.signing.storePasswordSecretName}
                    onChange={(e) => update('signing.storePasswordSecretName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-emerald-400"
                    placeholder="RELEASE_STORE_PASSWORD"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Key Password Secret Name</label>
                  <input
                    type="text"
                    value={config.signing.keyPasswordSecretName}
                    onChange={(e) => update('signing.keyPasswordSecretName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-emerald-400"
                    placeholder="RELEASE_KEY_PASSWORD"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Keystore Target File Path in Repo</label>
                  <input
                    type="text"
                    value={config.signing.keystorePath}
                    onChange={(e) => update('signing.keystorePath', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                    placeholder="app/release.jks"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Deployments & Publishing */}
        {activeTab === 'deploy' && (
          <div className="space-y-4">
            {/* GitHub Releases */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">GitHub Releases Integration</span>
                <input
                  type="checkbox"
                  checked={config.deployments.createGithubRelease}
                  onChange={(e) => update('deployments.createGithubRelease', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
              </div>
              {config.deployments.createGithubRelease && (
                <div className="text-[11px] text-slate-400 pl-2 border-l border-slate-800 space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="releaseTagOnly"
                      checked={config.deployments.githubReleaseOnTagOnly}
                      onChange={(e) => update('deployments.githubReleaseOnTagOnly', e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500"
                    />
                    <label htmlFor="releaseTagOnly" className="cursor-pointer">
                      Only trigger on Git release tags (<code className="text-purple-400">v*</code>)
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Firebase App Distribution */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Firebase App Distribution</span>
                <input
                  type="checkbox"
                  checked={config.deployments.enableFirebaseAppDistribution}
                  onChange={(e) => update('deployments.enableFirebaseAppDistribution', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
              </div>
              {config.deployments.enableFirebaseAppDistribution && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Firebase App ID Secret</label>
                    <input
                      type="text"
                      value={config.deployments.firebaseAppIdSecret}
                      onChange={(e) => update('deployments.firebaseAppIdSecret', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 font-mono text-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Tester Groups</label>
                    <input
                      type="text"
                      value={config.deployments.firebaseGroups}
                      onChange={(e) => update('deployments.firebaseGroups', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                      placeholder="qa-testers, internal"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Google Play Store */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Google Play Store Direct Upload</span>
                <input
                  type="checkbox"
                  checked={config.deployments.enableGooglePlay}
                  onChange={(e) => update('deployments.enableGooglePlay', e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
              </div>
              {config.deployments.enableGooglePlay && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Release Track</label>
                    <select
                      value={config.deployments.googlePlayTrack}
                      onChange={(e) => update('deployments.googlePlayTrack', e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                    >
                      <option value="internal">Internal Testing</option>
                      <option value="alpha">Alpha Track</option>
                      <option value="beta">Beta Track</option>
                      <option value="production">Production Track</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Service Account JSON Secret</label>
                    <input
                      type="text"
                      value={config.deployments.googlePlayJsonSecret}
                      onChange={(e) => update('deployments.googlePlayJsonSecret', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 font-mono text-emerald-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Slack Webhook Alerts</span>
                <span className="text-slate-400 text-[11px]">Posts build success/failure alerts to Slack channel.</span>
              </div>
              <input
                type="checkbox"
                checked={config.notifications.enableSlack}
                onChange={(e) => update('notifications.enableSlack', e.target.checked)}
                className="rounded border-slate-700 text-emerald-500"
              />
            </div>

            {config.notifications.enableSlack && (
              <div className="ml-4 p-2.5 bg-slate-950/60 rounded border border-slate-800">
                <label className="text-slate-400 text-[11px] block mb-1">Slack Webhook Secret Name</label>
                <input
                  type="text"
                  value={config.notifications.slackWebhookSecret}
                  onChange={(e) => update('notifications.slackWebhookSecret', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 font-mono text-emerald-400"
                  placeholder="SLACK_WEBHOOK_URL"
                />
              </div>
            )}

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Discord Webhook Alerts</span>
                <span className="text-slate-400 text-[11px]">Posts build notifications to Discord channel.</span>
              </div>
              <input
                type="checkbox"
                checked={config.notifications.enableDiscord}
                onChange={(e) => update('notifications.enableDiscord', e.target.checked)}
                className="rounded border-slate-700 text-emerald-500"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
