import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Key } from 'lucide-react';

interface KeystoreHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  keystorePath: string;
}

export const KeystoreHelperModal: React.FC<KeystoreHelperModalProps> = ({ isOpen, onClose, keystorePath }) => {
  const [os, setOs] = useState<'mac' | 'linux' | 'windows'>('mac');
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const keytoolCmd = `keytool -genkeypair -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias`;

  const encodeCmds = {
    mac: `openssl base64 -A -in release.jks -out release.jks.base64\ncat release.jks.base64 | pbcopy`,
    linux: `base64 -w 0 release.jks > release.jks.base64\ncat release.jks.base64`,
    windows: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.jks")) | Set-Clipboard`,
  };

  const fullCmd = `# 1. Generate Keystore JKS File\n${keytoolCmd}\n\n# 2. Encode Keystore to Base64 Single Line (${os.toUpperCase()})\n${encodeCmds[os]}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 text-xs text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Keystore Base64 Encoder Helper</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-300">
          GitHub Actions runners do not store binary files in repository code. To securely sign release APKs/AABs, convert your <code className="text-amber-300">release.jks</code> file into a single-line Base64 string and save it as a GitHub Secret (<code className="text-emerald-400">KEYSTORE_BASE64</code>).
        </p>

        {/* Operating System Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Select your OS:</span>
          <div className="flex bg-slate-950 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => setOs('mac')}
              className={`px-2.5 py-1 rounded transition font-semibold ${
                os === 'mac' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              macOS
            </button>
            <button
              onClick={() => setOs('linux')}
              className={`px-2.5 py-1 rounded transition font-semibold ${
                os === 'linux' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linux / Ubuntu
            </button>
            <button
              onClick={() => setOs('windows')}
              className={`px-2.5 py-1 rounded transition font-semibold ${
                os === 'windows' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Windows PowerShell
            </button>
          </div>
        </div>

        {/* Command Terminal Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 relative font-mono text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 pb-1 border-b border-slate-900">
            <div className="flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal Command</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition"
            >
              {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd ? 'Copied' : 'Copy Commands'}</span>
            </button>
          </div>
          <pre className="text-emerald-400 whitespace-pre-wrap">{fullCmd}</pre>
        </div>

        <div className="bg-amber-950/30 border border-amber-800/50 p-2.5 rounded-lg text-[11px] text-amber-200">
          💡 <strong>Next Step:</strong> Copy the base64 output, navigate to your GitHub Repository → <strong>Settings → Secrets and variables → Actions</strong>, click <strong>New repository secret</strong>, and name it <code className="text-amber-300">KEYSTORE_BASE64</code>.
        </div>
      </div>
    </div>
  );
};
