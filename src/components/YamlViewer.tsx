import React, { useState } from 'react';
import { LineAnnotation, ValidationIssue } from '../types';
import { Copy, Download, Info, AlertTriangle, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface YamlViewerProps {
  yaml: string;
  filename: string;
  annotations: LineAnnotation[];
  issues: ValidationIssue[];
  qualityScore: number;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}

export const YamlViewer: React.FC<YamlViewerProps> = ({
  yaml,
  filename,
  annotations,
  issues,
  qualityScore,
  onCopy,
  onDownload,
  copied,
}) => {
  const [activeAnnotationLine, setActiveAnnotationLine] = useState<number | null>(null);
  const lines = yaml.split('\n');

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Top File Bar */}
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 font-mono text-slate-300 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>.github/workflows/{filename}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCopy}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition"
          >
            <Copy className="w-3.5 h-3.5 text-teal-400" />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={onDownload}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Static Analysis Warnings Banner */}
      {issues.length > 0 && (
        <div className="bg-slate-900/90 border-b border-slate-800 p-3 text-xs space-y-1.5 max-h-36 overflow-y-auto">
          <div className="font-bold text-slate-300 flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>CI/CD Workflow Linter ({issues.length} recommendations)</span>
          </div>
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className={`p-1.5 rounded flex items-start gap-2 ${
                issue.type === 'error'
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                  : issue.type === 'warning'
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                  : 'bg-sky-950/40 text-sky-300 border border-sky-800/40'
              }`}
            >
              {issue.type === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              ) : issue.type === 'warning' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{issue.message}</p>
                {issue.recommendation && (
                  <p className="text-[11px] opacity-80 mt-0.5">{issue.recommendation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Code View with Line Numbers & Annotations */}
      <div className="flex-1 overflow-auto font-mono text-xs p-2 leading-relaxed selection:bg-emerald-500 selection:text-slate-950">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const annotation = annotations.find((a) => a.line === lineNum);
              const isComment = lineText.trim().startsWith('#');
              const isKey = lineText.includes(':') && !isComment;

              return (
                <React.Fragment key={lineNum}>
                  <tr
                    className={`hover:bg-slate-900/60 group transition ${
                      activeAnnotationLine === lineNum ? 'bg-slate-800/80' : ''
                    }`}
                  >
                    {/* Line Number Column */}
                    <td className="w-10 select-none text-right pr-3 text-slate-600 group-hover:text-slate-400 text-[11px]">
                      {lineNum}
                    </td>

                    {/* Code Column with basic YAML syntax coloring */}
                    <td className="pl-2 pr-4 py-0.5 whitespace-pre">
                      {isComment ? (
                        <span className="text-slate-500 italic">{lineText}</span>
                      ) : isKey ? (
                        (() => {
                          const parts = lineText.split(':');
                          const keyPart = parts[0];
                          const valPart = parts.slice(1).join(':');
                          return (
                            <>
                              <span className="text-emerald-400 font-semibold">{keyPart}:</span>
                              <span className="text-slate-200">{valPart}</span>
                            </>
                          );
                        })()
                      ) : (
                        <span className="text-slate-300">{lineText}</span>
                      )}
                    </td>

                    {/* Annotation Badge Trigger */}
                    <td className="w-8 select-none pr-2 text-right">
                      {annotation && (
                        <button
                          onClick={() =>
                            setActiveAnnotationLine(activeAnnotationLine === lineNum ? null : lineNum)
                          }
                          className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-sans font-medium transition"
                          title="Click to view step explanation"
                        >
                          Info
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Active Annotation Box */}
                  {annotation && activeAnnotationLine === lineNum && (
                    <tr className="bg-emerald-950/40 border-y border-emerald-800/60">
                      <td colSpan={3} className="p-3 font-sans text-xs text-slate-200">
                        <div className="flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-emerald-300">{annotation.stepName}</span>
                              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] rounded uppercase font-mono">
                                {annotation.category}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px]">{annotation.description}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
