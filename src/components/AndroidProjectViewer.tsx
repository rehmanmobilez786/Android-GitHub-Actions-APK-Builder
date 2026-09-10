import React, { useState, useRef } from 'react';
import { AndroidProjectFile, DEFAULT_ANDROID_FILES } from '../data/defaultAndroidProject';
import { createProjectZip, extractProjectZip } from '../utils/zipHandler';
import { 
  FileCode, 
  FolderArchive, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  FileText, 
  Layers, 
  Plus, 
  RefreshCw,
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';

interface AndroidProjectViewerProps {
  currentYaml: string;
  onUpdateYaml: (yaml: string) => void;
  language: 'ur' | 'en';
  projectFiles?: AndroidProjectFile[];
  onUpdateProjectFiles?: (files: AndroidProjectFile[]) => void;
  onOpenRepoCleaner?: () => void;
}

export const AndroidProjectViewer: React.FC<AndroidProjectViewerProps> = ({
  currentYaml,
  onUpdateYaml,
  language,
  projectFiles,
  onUpdateProjectFiles,
  onOpenRepoCleaner,
}) => {
  const [files, setFiles] = useState<AndroidProjectFile[]>(projectFiles || [...DEFAULT_ANDROID_FILES]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('.github/workflows/android-build.yml');
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync when projectFiles prop changes (e.g. edited from build history)
  React.useEffect(() => {
    if (projectFiles && projectFiles.length > 0) {
      setFiles(projectFiles);
    }
  }, [projectFiles]);

  const [uploadReport, setUploadReport] = useState<{
    package?: string;
    sdk?: number;
    filesCount: number;
    hasWorkflow: boolean;
    hasGradlew: boolean;
  } | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  // Sync currentYaml with the workflow file in files list
  const activeFiles = files.map((f) =>
    f.path === '.github/workflows/android-build.yml'
      ? { ...f, content: currentYaml }
      : f
  );

  const selectedFile = activeFiles.find((f) => f.path === selectedFilePath) || activeFiles[0];

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (selectedFile.path === '.github/workflows/android-build.yml') {
      onUpdateYaml(newContent);
    } else {
      setFiles((prev) =>
        prev.map((f) => (f.path === selectedFile.path ? { ...f, content: newContent } : f))
      );
    }
  };

  // Download complete project ZIP
  const handleDownloadFullZip = async () => {
    setIsZipping(true);
    try {
      const zipBlob = await createProjectZip(activeFiles, currentYaml);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'android-github-actions-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Handle ZIP upload
  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { files: extracted, report } = await extractProjectZip(file);
      if (extracted.length > 0) {
        // Merge or replace
        const workflowFile = extracted.find((f) => f.path.includes('.github/workflows'));
        if (workflowFile) {
          onUpdateYaml(workflowFile.content);
        }

        // Add to files state
        setFiles(extracted);
        onUpdateProjectFiles?.(extracted);
        setSelectedFilePath(extracted[0].path);
        setUploadReport(report);
      }
    } catch (err) {
      console.error('Error unzipping project:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle single or multiple source code files upload
  const handleSingleFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newFiles: AndroidProjectFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const text = await file.text();
      let category: AndroidProjectFile['category'] = 'source';
      if (file.name.endsWith('.gradle') || file.name.endsWith('.gradle.kts') || file.name.endsWith('.properties')) {
        category = 'gradle';
      } else if (file.name.endsWith('.xml')) {
        category = file.name === 'AndroidManifest.xml' ? 'manifest' : 'resource';
      } else if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
        category = 'workflow';
      }

      newFiles.push({
        path: `app/src/main/java/uploaded/${file.name}`,
        name: file.name,
        category,
        description: 'Uploaded source file',
        content: text,
      });
    }

    setFiles((prev) => {
      const updated = [...prev, ...newFiles];
      onUpdateProjectFiles?.(updated);
      return updated;
    });
    setSelectedFilePath(newFiles[0].path);
    if (singleFileInputRef.current) singleFileInputRef.current.value = '';
  };

  const getCategoryBadge = (cat: AndroidProjectFile['category']) => {
    switch (cat) {
      case 'workflow':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">CI/CD</span>;
      case 'gradle':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Gradle</span>;
      case 'manifest':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Manifest</span>;
      case 'source':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">Kotlin/Java</span>;
      case 'wrapper':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">Wrapper</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">File</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              {language === 'ur'
                ? 'اینڈرائیڈ APK بلڈ پراجیکٹ فائلز اور سورس کوڈ'
                : 'Android APK Build Project Repository & Source Code'}
            </h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {activeFiles.length} {language === 'ur' ? 'فائلز شامل ہیں' : 'Files Ready'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ur'
              ? 'یہاں تمام ضروری فائلز شامل ہیں (Gradle, Manifest, Workflow, Kotlin)۔ آپ اپنی ZIP یا سنگل فائلز بھی اپلوڈ کر سکتے ہیں۔'
              : 'Complete ready-to-build Android repository structure. Inspect, edit, or upload your own project ZIP or source files.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Upload ZIP */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleZipUpload}
          />
          <button
            id="upload-zip-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition font-medium cursor-pointer"
          >
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <span>{language === 'ur' ? 'ZIP سورس کوڈ اپلوڈ' : 'Upload Project ZIP'}</span>
          </button>

          {/* Upload Individual Files */}
          <input
            ref={singleFileInputRef}
            type="file"
            multiple
            accept=".kt,.java,.xml,.gradle,.kts,.properties"
            className="hidden"
            onChange={handleSingleFilesUpload}
          />
          <button
            id="upload-files-btn"
            onClick={() => singleFileInputRef.current?.click()}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition font-medium cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>{language === 'ur' ? 'فائل اپلوڈ کریں' : 'Upload Files'}</span>
          </button>

          {/* Repo Cleaner & Sync Button */}
          {onOpenRepoCleaner && (
            <button
              id="viewer-repo-cleaner-btn"
              onClick={onOpenRepoCleaner}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>{language === 'ur' ? 'متصادم فائلیں ڈیلیٹ کریں' : 'Clean Duplicate Files'}</span>
            </button>
          )}

          {/* Download Complete Project ZIP */}
          <button
            id="download-project-zip-btn"
            onClick={handleDownloadFullZip}
            disabled={isZipping}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-md shadow-emerald-950 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {isZipping
                ? language === 'ur' ? 'پیکج بن رہا ہے...' : 'Packaging...'
                : language === 'ur' ? 'مکمل پراجیکٹ ZIP ڈاؤنلوڈ' : 'Download Complete ZIP'}
            </span>
          </button>
        </div>
      </div>

      {/* Upload Report Notice (if uploaded) */}
      {uploadReport && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3 text-xs text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-emerald-300">
              {language === 'ur' ? 'سورس کوڈ کامیابی سے لوڈ ہو گیا!' : 'Project Archive Loaded Successfully!'}
            </p>
            <p className="text-emerald-400/90">
              {language === 'ur'
                ? `کل ${uploadReport.filesCount} فائلز لوڈ ہوئیں۔ ${uploadReport.package ? `پیکج: ${uploadReport.package}` : ''} ${uploadReport.sdk ? `| SDK: ${uploadReport.sdk}` : ''}`
                : `Extracted ${uploadReport.filesCount} files. ${uploadReport.package ? `Package: ${uploadReport.package}` : ''} ${uploadReport.sdk ? `| Target SDK: ${uploadReport.sdk}` : ''}`}
            </p>
          </div>
        </div>
      )}

      {/* Main 2-Column Split: File List & Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Files List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col h-[580px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              {language === 'ur' ? 'پراجیکٹ فائلز ایکسپلورر' : 'Project Structure'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {activeFiles.length} files
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {activeFiles.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition flex flex-col gap-1 border cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium truncate max-w-[200px]" title={file.path}>
                      {file.name}
                    </span>
                    {getCategoryBadge(file.category)}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono truncate">
                    {file.path}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>APK Target: <strong className="text-slate-200">Android 14 (API 34)</strong></span>
            <span>Java: <strong className="text-slate-200">JDK 17</strong></span>
          </div>
        </div>

        {/* Right: Code Viewer / Editor */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[580px] overflow-hidden">
          {/* File Header Bar */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-mono font-bold text-slate-200">{selectedFile.path}</span>
                <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                  ({selectedFile.description})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="copy-file-content-btn"
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (language === 'ur' ? 'کاپی ہو گیا' : 'Copied') : (language === 'ur' ? 'کاپی کوڈ' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Interactive Code Editor TextArea */}
          <div className="flex-1 relative font-mono text-xs bg-slate-950 p-3 overflow-hidden flex">
            <textarea
              id="file-content-editor"
              value={selectedFile.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full bg-transparent text-emerald-300 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 p-2 rounded selection:bg-emerald-600/40"
              spellCheck={false}
            />
          </div>

          {/* Footer Stats Bar */}
          <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Lines: {selectedFile.content.split('\n').length}</span>
            <span>Bytes: {new Blob([selectedFile.content]).size} B</span>
            <span className="text-emerald-400 font-sans flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {language === 'ur' ? 'تبدیلیاں محفوظ ہیں' : 'Live synced'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
