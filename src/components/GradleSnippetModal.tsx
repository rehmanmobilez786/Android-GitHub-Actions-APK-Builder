import React, { useState } from 'react';
import { WorkflowConfig } from '../types';
import { generateKotlinDslSigningConfig, generateGroovyDslSigningConfig } from '../utils/gradleSnippetGenerator';
import { X, Copy, Check, Code } from 'lucide-react';

interface GradleSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkflowConfig;
}

export const GradleSnippetModal: React.FC<GradleSnippetModalProps> = ({ isOpen, onClose, config }) => {
  const [dsl, setDsl] = useState<'kotlin' | 'groovy'>('kotlin');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const code = dsl === 'kotlin' ? generateKotlinDslSigningConfig(config) : generateGroovyDslSigningConfig(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 text-xs text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">Gradle Signing Configuration Snippet</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-300">
          Add this <code className="text-sky-300">signingConfigs</code> block to your app module's Gradle build file (<code className="text-sky-300">app/build.gradle.kts</code> or <code className="text-sky-300">app/build.gradle</code>) so Gradle reads the environment variables injected by GitHub Actions.
        </p>

        <div className="flex items-center justify-between">
          <div className="flex bg-slate-950 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => setDsl('kotlin')}
              className={`px-3 py-1 rounded transition font-semibold ${
                dsl === 'kotlin' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kotlin DSL (.kts)
            </button>
            <button
              onClick={() => setDsl('groovy')}
              className={`px-3 py-1 rounded transition font-semibold ${
                dsl === 'groovy' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Groovy DSL (.gradle)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs overflow-x-auto max-h-80">
          <pre className="text-sky-300 whitespace-pre">{code}</pre>
        </div>
      </div>
    </div>
  );
};
