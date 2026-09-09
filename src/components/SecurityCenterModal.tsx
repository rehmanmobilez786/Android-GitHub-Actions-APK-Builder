import React, { useState } from 'react';
import { AccountSecurity, AccountStatus } from '../types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX, 
  X, 
  KeyRound, 
  AlertOctagon, 
  CheckCircle2, 
  History, 
  Lock, 
  Unlock, 
  Sliders, 
  Zap, 
  RefreshCw,
  Info
} from 'lucide-react';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  security: AccountSecurity;
  onUpdateSecurity: (newSecurity: AccountSecurity) => void;
  language: 'ur' | 'en';
}

const COMMON_SUSPEND_REASONS = [
  'Suspicious workflow execution detected (Crypto/Miner check)',
  'Unauthorized keystore modification attempt',
  'Rate limit violation (excessive failed workflow runs)',
  'APK binary tampering or malicious payload detected',
  'Manual administrative security lock',
];

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({
  isOpen,
  onClose,
  security,
  onUpdateSecurity,
  language,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedReason, setSelectedReason] = useState(COMMON_SUSPEND_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [activeTab, setActiveTab] = useState<'status' | 'recovery' | 'audit'>('status');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Handle manual status changes
  const handleSetStatus = (newStatus: AccountStatus) => {
    const reasonText = customReason.trim() || selectedReason;
    const timestamp = new Date().toLocaleString();

    let newAuditLog = {
      id: Math.random().toString(36).substring(7),
      timestamp,
      action: `Status changed to ${newStatus.toUpperCase()}`,
      severity: (newStatus === 'blocked' ? 'danger' : newStatus === 'suspended' ? 'warning' : 'info') as 'danger' | 'warning' | 'info',
      details: newStatus === 'active' ? 'Account unlocked & operational' : `Reason: ${reasonText}`,
    };

    onUpdateSecurity({
      ...security,
      status: newStatus,
      reason: newStatus === 'active' ? undefined : reasonText,
      suspendedAt: newStatus === 'active' ? undefined : timestamp,
      riskScore: newStatus === 'blocked' ? 95 : newStatus === 'suspended' ? 65 : 0,
      auditLogs: [newAuditLog, ...security.auditLogs],
    });

    setSuccessMsg(
      language === 'ur'
        ? `اکاؤنٹ اسٹیٹس کامیابی سے '${newStatus}' میں تبدیل ہو گیا!`
        : `Account status updated to '${newStatus.toUpperCase()}'!`
    );
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Handle PIN Recovery / Unlock
  const handleVerifyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput !== security.recoveryPin && pinInput !== '2026') {
      setPinError(
        language === 'ur'
          ? 'غلط سیکیورٹی PIN! درست PIN درج کریں (ڈیفالٹ: 2026)'
          : 'Invalid Security PIN! Please enter valid PIN (Default: 2026)'
      );
      return;
    }

    setPinError('');
    const timestamp = new Date().toLocaleString();
    const newAuditLog = {
      id: Math.random().toString(36).substring(7),
      timestamp,
      action: 'Account Unlocked via Security Verification',
      severity: 'info' as const,
      details: 'User authenticated with 4-digit Security PIN. All restrictions cleared.',
    };

    onUpdateSecurity({
      ...security,
      status: 'active',
      reason: undefined,
      suspendedAt: undefined,
      riskScore: 0,
      auditLogs: [newAuditLog, ...security.auditLogs],
    });

    setPinInput('');
    setSuccessMsg(
      language === 'ur'
        ? 'تصدیق کامیاب! اکاؤنٹ بحال ہو گیا ہے اور تمام پابندیاں ختم کر دی گئی ہیں۔'
        : 'Verification successful! Account is now ACTIVE and all restrictions are lifted.'
    );
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1500);
  };

  // Toggle Auto-Guard
  const handleToggleAutoGuard = () => {
    onUpdateSecurity({
      ...security,
      autoGuardEnabled: !security.autoGuardEnabled,
      auditLogs: [
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleString(),
          action: `Auto-Guard Shield ${!security.autoGuardEnabled ? 'Enabled' : 'Disabled'}`,
          severity: 'info',
          details: 'User modified automatic security protection settings.',
        },
        ...security.auditLogs,
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                security.status === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : security.status === 'suspended'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {security.status === 'active' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : security.status === 'suspended' ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <ShieldX className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>
                  {language === 'ur'
                    ? 'اکاؤنٹ سیکیورٹی اور معطلی/بلاک کنٹرول'
                    : 'Account Security & Suspension Guard'}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                    security.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : security.status === 'suspended'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {security.status}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ur'
                  ? 'مشکوک سرگرمی، سیکیورٹی قوانین کی خلاف ورزی اور اکاؤنٹ ریکوری کو کنٹرول کریں'
                  : 'Manage account security status, policies, suspensions, and recovery unlock.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-950/60 border-b border-emerald-500/40 px-6 py-2.5 flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-950/50 border-b border-slate-800 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'ur' ? 'اسٹیٹس اور کنٹرول' : 'Security Status'}</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`pb-2.5 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'recovery'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{language === 'ur' ? 'اکاؤنٹ بحالی (Recovery PIN)' : 'Recovery PIN'}</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{language === 'ur' ? 'سیکیورٹی لاگز' : 'Audit Logs'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* TAB 1: STATUS & CONTROLS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Status Overview Card */}
              <div
                className={`p-4 rounded-xl border ${
                  security.status === 'active'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : security.status === 'suspended'
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-red-950/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">
                    {language === 'ur' ? 'موجودہ سیکیورٹی لیول:' : 'Current Account State:'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Risk Score: {security.riskScore}/100
                  </span>
                </div>

                <div className="mt-2 text-sm font-bold text-slate-100 flex items-center gap-2">
                  {security.status === 'active' && (
                    <span className="text-emerald-400">
                      {language === 'ur'
                        ? '🟢 اکاؤنٹ مکمل فعال اور محفوظ ہے'
                        : '🟢 Account Active & Fully Authorized'}
                    </span>
                  )}
                  {security.status === 'suspended' && (
                    <span className="text-amber-400">
                      {language === 'ur'
                        ? '🟡 اکاؤنٹ عارضی معطل ہے (Suspended)'
                        : '🟡 Account Temporarily Suspended'}
                    </span>
                  )}
                  {security.status === 'blocked' && (
                    <span className="text-red-400">
                      {language === 'ur'
                        ? '🔴 اکاؤنٹ مکمل بلاک ہے (Blocked / Locked)'
                        : '🔴 Account Completely Blocked & Locked'}
                    </span>
                  )}
                </div>

                {security.reason && (
                  <p className="mt-2 text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <strong>{language === 'ur' ? 'معطلی کا سبب:' : 'Reason:'}</strong> {security.reason}
                  </p>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">
                  {language === 'ur' ? 'اکاؤنٹ سیکیورٹی اسٹیٹس تبدیل کریں:' : 'Set Account State:'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    id="set-active-status-btn"
                    onClick={() => handleSetStatus('active')}
                    className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      security.status === 'active'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                        : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>{language === 'ur' ? 'فعال (Active)' : 'Active'}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      {language === 'ur' ? 'تمام بلڈز کی اجازت' : 'Allow All Builds'}
                    </span>
                  </button>

                  <button
                    id="set-suspended-status-btn"
                    onClick={() => handleSetStatus('suspended')}
                    className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      security.status === 'suspended'
                        ? 'bg-amber-600 border-amber-400 text-white shadow-lg'
                        : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <span>{language === 'ur' ? 'معطل (Suspend)' : 'Suspend'}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      {language === 'ur' ? 'عارضی سیکیورٹی ہولڈ' : 'Temporary Hold'}
                    </span>
                  </button>

                  <button
                    id="set-blocked-status-btn"
                    onClick={() => handleSetStatus('blocked')}
                    className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      security.status === 'blocked'
                        ? 'bg-red-600 border-red-400 text-white shadow-lg'
                        : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <ShieldX className="w-5 h-5 text-red-400" />
                    <span>{language === 'ur' ? 'بلاک (Block)' : 'Block'}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      {language === 'ur' ? 'مکمل رسائی بند' : 'Full Lockout'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Suspend / Block Reason Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-semibold">
                  {language === 'ur' ? 'معطلی/بلاک کرنے کا سبب منتخب کریں:' : 'Select Suspension / Block Reason:'}
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {COMMON_SUSPEND_REASONS.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder={
                    language === 'ur'
                      ? 'یا اپنی مرضی کا سبب درج کریں...'
                      : 'Or enter custom security reason...'
                  }
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Auto-Guard Toggle */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">
                    {language === 'ur'
                      ? 'خودکار سیکیورٹی شیلڈ (Auto-Guard Shield)'
                      : 'Automated CI/CD Guard Shield'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ur'
                      ? 'مشکوک اسکرپٹ ملنے پر اکاؤنٹ خودکار طور پر معطل کر دیتا ہے'
                      : 'Automatically suspends account upon detecting crypto-miners or malicious scripts in workflows'}
                  </span>
                </div>
                <button
                  onClick={handleToggleAutoGuard}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    security.autoGuardEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                      security.autoGuardEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RECOVERY PIN UNLOCK */}
          {activeTab === 'recovery' && (
            <form onSubmit={handleVerifyUnlock} className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {language === 'ur' ? 'سیکیورٹی تصدیق اور ان بلاک' : 'Security PIN Unlock Verification'}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-xs">
                  {language === 'ur'
                    ? 'اگر آپ کا اکاؤنٹ معطل یا بلاک ہے تو اپنا 4 ہندسوں والا سیکیورٹی ریکوری PIN درج کر کے اکاؤنٹ فوری بحال کریں۔ (ڈیفالٹ ایڈمن PIN: 2026)'
                    : 'Enter your 4-digit Security Recovery PIN to verify your identity and instantly restore the account. (Default Admin PIN: 2026)'}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'ur' ? '4 ہندسوں کا سیکیورٹی PIN:' : 'Enter 4-Digit Security PIN:'}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="2026"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-center text-lg font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                {pinError && (
                  <p className="text-red-400 mt-1.5 text-xs font-semibold">{pinError}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPinInput('2026')}
                  className="text-xs text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                >
                  {language === 'ur' ? 'ڈیفالٹ PIN استعمال کریں (2026)' : 'Use Default PIN (2026)'}
                </button>

                <button
                  id="submit-unlock-pin-btn"
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{language === 'ur' ? 'تصدیق اور بحال کریں' : 'Verify & Unlock'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  {language === 'ur' ? 'حالیہ سیکیورٹی سرگرمیاں:' : 'Security Event Trail:'}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {security.auditLogs.length} events logged
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {security.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            log.severity === 'danger'
                              ? 'bg-red-500'
                              : log.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-200 truncate">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-4">{log.details}</p>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            {language === 'ur'
              ? 'معطل یا بلاک اکاؤنٹ سے APK بلڈز اور ڈاؤنلوڈز ممنوع ہیں'
              : 'Suspended/Blocked accounts cannot execute CI/CD runs or download APKs'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition cursor-pointer"
          >
            {language === 'ur' ? 'بند کریں' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
