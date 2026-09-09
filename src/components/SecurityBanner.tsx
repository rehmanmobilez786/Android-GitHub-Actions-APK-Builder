import React from 'react';
import { AccountSecurity } from '../types';
import { ShieldAlert, ShieldX, Unlock, AlertTriangle, ArrowRight } from 'lucide-react';

interface SecurityBannerProps {
  security: AccountSecurity;
  onOpenSecurityCenter: () => void;
  language: 'ur' | 'en';
}

export const SecurityBanner: React.FC<SecurityBannerProps> = ({
  security,
  onOpenSecurityCenter,
  language,
}) => {
  if (security.status === 'active') {
    return null;
  }

  const isBlocked = security.status === 'blocked';

  return (
    <div
      className={`border-b px-4 sm:px-6 py-3 shadow-md animate-in fade-in slide-in-from-top-1 ${
        isBlocked
          ? 'bg-red-950/90 border-red-600/80 text-red-200'
          : 'bg-amber-950/90 border-amber-600/80 text-amber-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isBlocked ? <ShieldX className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10">
                {isBlocked
                  ? language === 'ur'
                    ? '🔒 اکاؤنٹ بلاک ہے (Blocked)'
                    : '🔒 ACCOUNT BLOCKED'
                  : language === 'ur'
                  ? '⚠️ اکاؤنٹ معطل ہے (Suspended)'
                  : '⚠️ ACCOUNT SUSPENDED'}
              </span>
              <span className="text-xs font-bold">
                {isBlocked
                  ? language === 'ur'
                    ? 'سیکیورٹی لاک: بلڈز اور APK ڈاؤنلوڈز پر مکمل پابندی عائد ہے'
                    : 'Security Lockout: All CI/CD builds & APK downloads are locked'
                  : language === 'ur'
                  ? 'سیکیورٹی الرٹ: مشکوک سرگرمی کے پیش نظر اکاؤنٹ عارضی معطل ہے'
                  : 'Security Review: Account temporarily suspended due to security notice'}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {security.reason ||
                (language === 'ur'
                  ? 'پالیسی کی خلاف ورزی یا مشکوک ورک فلو کی وجہ سے سیکیورٹی معطلی لاگو کی گئی ہے۔'
                  : 'Action taken due to suspected security rule violation or unauthorized build script.')}
              {security.suspendedAt && (
                <span className="ml-2 font-mono text-[11px] opacity-75">
                  ({security.suspendedAt})
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          id="security-unlock-banner-btn"
          onClick={onOpenSecurityCenter}
          className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-lg transition cursor-pointer ${
            isBlocked
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
          }`}
        >
          <Unlock className="w-4 h-4" />
          <span>
            {language === 'ur'
              ? 'سیکیورٹی تصدیق اور ان بلاک کریں'
              : 'Security Verification & Unlock'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
