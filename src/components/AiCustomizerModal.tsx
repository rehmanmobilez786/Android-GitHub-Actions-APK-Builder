import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AiCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYaml: string;
  onApplyYaml: (newYaml: string) => void;
}

export const AiCustomizerModal: React.FC<AiCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentYaml,
  onApplyYaml,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    explanation?: string;
    yaml?: string;
    recommendedSecrets?: string[];
    tips?: string[];
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleAskAi = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/customize-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentYaml,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate workflow');
      }

      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Add SonarCloud / SonarQube code scan step',
    'Add ReactiveCircus Android Emulator UI test runner',
    'Add Slack alert on build failure with git commit author',
    'Configure Flutter / React Native hybrid android build',
    'Optimize build time with Gradle enterprise remote cache',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 text-xs text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-bold text-slate-100">Gemini AI Workflow Customizer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-300">
          Describe any specific Android build requirement or integration, and Gemini AI will update your GitHub Actions workflow file automatically!
        </p>

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(p)}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-full text-[11px] transition"
            >
              + {p}
            </button>
          ))}
        </div>

        {/* Prompt Input Box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
            placeholder="e.g., Add Firebase Test Lab or NDK C++ build support..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
          />
          <button
            onClick={handleAskAi}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask AI</span>
          </button>
        </div>

        {/* AI Result Box */}
        {result && (
          <div className="space-y-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 max-h-72 overflow-y-auto">
            {result.error ? (
              <div className="flex items-start gap-2 text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{result.error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.explanation && (
                  <div className="p-2.5 bg-purple-950/40 border border-purple-800/40 rounded text-purple-200 text-xs">
                    💡 <strong>Summary:</strong> {result.explanation}
                  </div>
                )}

                {result.yaml && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-emerald-400 text-xs font-bold">Generated Workflow YAML</span>
                      <button
                        onClick={() => {
                          if (result.yaml) {
                            onApplyYaml(result.yaml);
                            onClose();
                          }
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Apply AI Workflow</span>
                      </button>
                    </div>
                    <pre className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre max-h-48">
                      {result.yaml}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
