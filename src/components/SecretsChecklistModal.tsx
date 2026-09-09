import React, { useState } from 'react';
import { WorkflowConfig } from '../types';
import { X, ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';

interface SecretsChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkflowConfig;
}

export const SecretsChecklistModal: React.FC<SecretsChecklistModalProps> = ({ isOpen, onClose, config }) => {
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  if (!isOpen) return null;

  const secrets: { name: string; description: string; requiredFor: string }[] = [];

  if (config.signing.enableKeystoreSigning) {
    secrets.push(
      {
        name: config.signing.keystoreSecretName,
        description: 'Base64 encoded string of release.jks binary keystore file.',
        requiredFor: 'Keystore Decoding Step',
      },
      {
        name: config.signing.aliasSecretName,
        description: 'Key alias name created during keytool generation.',
        requiredFor: 'Release Binary Signing',
      },
      {
        name: config.signing.storePasswordSecretName,
        description: 'Password for the JKS keystore file.',
        requiredFor: 'Release Binary Signing',
      },
      {
        name: config.signing.keyPasswordSecretName,
        description: 'Password for the individual key entry.',
        requiredFor: 'Release Binary Signing',
      }
    );
  }

  if (config.deployments.enableFirebaseAppDistribution) {
    secrets.push(
      {
        name: config.deployments.firebaseAppIdSecret,
        description: 'Firebase App ID found in Firebase Console Settings (e.g. 1:1234:android:5678).',
        requiredFor: 'Firebase App Distribution',
      },
      {
        name: config.deployments.firebaseTokenSecret,
        description: 'CI Refresh Token generated via "firebase login:ci" CLI.',
        requiredFor: 'Firebase App Distribution',
      }
    );
  }

  if (config.deployments.enableGooglePlay) {
    secrets.push({
      name: config.deployments.googlePlayJsonSecret,
      description: 'Google Play Service Account JSON key string with App Manager role permissions.',
      requiredFor: 'Google Play Store Upload',
    });
  }

  if (config.notifications.enableSlack) {
    secrets.push({
      name: config.notifications.slackWebhookSecret,
      description: 'Incoming Webhook URL from Slack API app settings.',
      requiredFor: 'Slack Notifications',
    });
  }

  if (config.notifications.enableDiscord) {
    secrets.push({
      name: config.notifications.discordWebhookSecret,
      description: 'Discord Webhook URL from Discord Channel Integration Settings.',
      requiredFor: 'Discord Notifications',
    });
  }

  const handleCopySecret = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedSecret(name);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 text-xs text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">GitHub Repository Secrets Checklist</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-300">
          Go to your GitHub Repository → <strong className="text-white">Settings</strong> → <strong className="text-white">Secrets and variables</strong> → <strong className="text-white">Actions</strong> and add the following repository secrets:
        </p>

        {secrets.length === 0 ? (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center text-slate-400">
            No custom GitHub secrets are required for the current lightweight configuration!
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {secrets.map((s, idx) => (
              <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400">{s.name}</span>
                    <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px] font-medium">
                      {s.requiredFor}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{s.description}</p>
                </div>
                <button
                  onClick={() => handleCopySecret(s.name)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 transition shrink-0 ml-2"
                >
                  {copiedSecret === s.name ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSecret === s.name ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition text-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
