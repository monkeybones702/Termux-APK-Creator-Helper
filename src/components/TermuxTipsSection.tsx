import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Wrench,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { CommandCategory, TermuxTip } from '../types';

export const TERMUX_TROUBLESHOOTING_TIPS: TermuxTip[] = [
  {
    id: 'tip-perm-denied',
    title: 'Fix "Permission denied" when executing ./build.sh',
    category: 'Permissions & File System',
    symptom: 'bash: ./build.sh: Permission denied (or script resides on /sdcard)',
    cause:
      'Either build.sh lacks the executable bit (+x), or you are running inside /sdcard (/storage/emulated/0) which Android mounts with the "noexec" flag.',
    command:
      'mkdir -p ~/apk-workspace && cp -r * ~/apk-workspace/ 2>/dev/null || true && cd ~/apk-workspace && chmod +x build.sh && bash ./build.sh',
  },
  {
    id: 'tip-apt-lock',
    title: 'Fix "Unable to acquire dpkg frontend lock" / apt-get lock',
    category: 'Package Manager (pkg / apt)',
    symptom:
      'E: Could not get lock /data/data/com.termux/files/usr/var/lib/dpkg/lock-frontend',
    cause:
      'An earlier pkg or apt process was interrupted or terminated before releasing the dpkg lock file.',
    command:
      'killall -9 apt apt-get dpkg 2>/dev/null || true && rm -f $PREFIX/var/lib/dpkg/lock-frontend $PREFIX/var/lib/dpkg/lock $PREFIX/var/lib/apt/lists/lock && dpkg --configure -a && pkg update -y',
  },
  {
    id: 'tip-android-jar',
    title: 'Fix "android.jar not found" during aapt or ecj compilation',
    category: 'Compiler & Classpath',
    symptom: 'Error: Asset package include $PREFIX/share/aapt/android.jar not found',
    cause:
      'The aapt package is missing or installed android.jar in an alternate lib directory.',
    command:
      'pkg install --reinstall -y aapt && find $PREFIX -name "android.jar" 2>/dev/null',
  },
  {
    id: 'tip-storage-access',
    title: 'Fix Storage Permission Denied & Copy APK to Downloads',
    category: 'Permissions & File System',
    symptom: 'cannot create regular file /sdcard/Download/app.apk: Permission denied',
    cause:
      'Termux has not been granted Android shared storage access via termux-setup-storage.',
    command:
      'termux-setup-storage && sleep 2 && cp -v app.apk ~/storage/downloads/app.apk && echo "Saved to Downloads/app.apk"',
  },
  {
    id: 'tip-keystore-corrupt',
    title: 'Fix apksigner Keystore Error / Regenerate debug.keystore',
    category: 'APK Signing & Keytool',
    symptom:
      'Failed to load signer "signer #1": java.io.IOException: Invalid keystore format',
    cause:
      'An interrupted keytool run left an empty or corrupted debug.keystore file in the project directory.',
    command:
      'rm -f debug.keystore && keytool -genkeypair -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"',
  },
  {
    id: 'tip-clean-build',
    title: 'Fix ecj Duplicate Class / Stale DEX Build Artifacts',
    category: 'Compiler & Classpath',
    symptom: 'UNEXPECTED TOP-LEVEL EXCEPTION: Multiple dex files define L.../R;',
    cause:
      'Old .class or R.java files from a previous package name are still inside build/obj or build/gen.',
    command:
      'rm -rf build/ classes.dex app.raw.apk app.apk && mkdir -p build/gen build/obj build/apk && echo "Clean build directories ready."',
  },
  {
    id: 'tip-termux-open',
    title: 'Fix termux-open Not Launching Android Package Installer',
    category: 'APK Installation',
    symptom: 'termux-open app.apk runs silently without showing the Android install prompt',
    cause:
      'Missing Termux:API companion app or "Install unknown apps" permission is disabled for Termux in Android Settings.',
    command:
      'termux-open --content-type "application/vnd.android.package-archive" app.apk || cp -v app.apk ~/storage/downloads/app.apk',
  },
  {
    id: 'tip-mirror-repo',
    title: 'Fix Repository 403 / 404 Mirror Errors on pkg install',
    category: 'Package Manager (pkg / apt)',
    symptom: '403 Forbidden or 404 Not Found when fetching packages from mirror',
    cause: 'Outdated regional Termux mirror cache or stale package lists.',
    command: 'pkg clean && pkg update -y --fix-missing',
  },
];

interface TermuxTipsSectionProps {
  onLogCommand: (
    title: string,
    command: string,
    category?: CommandCategory
  ) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
  defaultExpanded?: boolean;
}

export default function TermuxTipsSection({
  onLogCommand,
  isModal = false,
  onCloseModal,
  defaultExpanded = true,
}: TermuxTipsSectionProps) {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [customErrorInput, setCustomErrorInput] = useState<string>('');
  const [aiDiagnosis, setAiDiagnosis] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);

  const filteredTips = TERMUX_TROUBLESHOOTING_TIPS.filter(
    (tip) =>
      !filterText.trim() ||
      tip.title.toLowerCase().includes(filterText.toLowerCase()) ||
      tip.symptom.toLowerCase().includes(filterText.toLowerCase()) ||
      tip.category.toLowerCase().includes(filterText.toLowerCase()) ||
      tip.command.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleCopyTip = (tip: TermuxTip) => {
    navigator.clipboard.writeText(tip.command);
    onLogCommand(`Tip: ${tip.title}`, tip.command, 'troubleshoot');
    setCopiedId(tip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDiagnoseError = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customErrorInput.trim() || isDiagnosing) return;
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Troubleshoot this Termux Android APK build error and provide the exact Termux bash command to fix it: "${customErrorInput}"`,
        }),
      });
      const data = await res.json();
      setAiDiagnosis(data.text || data.error || 'No diagnosis returned.');
    } catch (err: any) {
      setAiDiagnosis(`Unable to reach Gemini troubleshooter: ${err?.message || 'Error'}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const innerContent = (
    <div className="p-5 space-y-5">
      {/* Search Filter + Custom Error AI Troubleshooter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter tips (e.g., Permission denied, lock, keystore)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <form
          onSubmit={handleDiagnoseError}
          className="lg:col-span-7 flex gap-2"
        >
          <input
            type="text"
            value={customErrorInput}
            onChange={(e) => setCustomErrorInput(e.target.value)}
            placeholder="Paste any custom Termux terminal error to diagnose with Gemini..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="submit"
            disabled={isDiagnosing || !customErrorInput.trim()}
            className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isDiagnosing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Diagnosing...</span>
              </>
            ) : (
              <span>Ask Gemini Fix</span>
            )}
          </button>
        </form>
      </div>

      {aiDiagnosis && (
        <div className="p-4 rounded-lg bg-slate-950 border border-blue-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400">
              Gemini Grounded Troubleshooting Fix
            </span>
            <button
              type="button"
              onClick={() => setAiDiagnosis(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
            {aiDiagnosis}
          </div>
        </div>
      )}

      {/* Troubleshooting Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTips.map((tip) => {
          const isCopied = copiedId === tip.id;
          return (
            <div
              key={tip.id}
              className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-100">
                    {tip.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopyTip(tip)}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isCopied ? (
                      <>
                        <Check size={12} />
                        <span>Copied &amp; Logged</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Fix</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-500">{tip.category}</div>

                <div className="text-xs text-amber-400/90 font-mono truncate">
                  Symptom: {tip.symptom}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {tip.cause}
                </p>
              </div>

              <pre className="p-2.5 bg-[#070a0f] border border-slate-800/80 rounded text-xs text-emerald-400 font-mono overflow-x-auto">
                <code>{tip.command}</code>
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full max-h-[88vh] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wrench size={18} className="text-blue-400" />
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Termux Build Pipeline Troubleshooting &amp; Recovery Tips
                </h2>
                <p className="text-xs text-slate-400">
                  One-click fixes for Permission Denied, dpkg/apt locks, missing android.jar, and APK signing errors
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseModal}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">{innerContent}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 border-b border-slate-800/80 flex items-center justify-between hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          {expanded ? (
            <ChevronDown size={18} className="text-blue-400 shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-blue-400 shrink-0" />
          )}
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Termux Tips &amp; Build Pipeline Troubleshooting ({TERMUX_TROUBLESHOOTING_TIPS.length} Quick Fixes)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Common fixes for &quot;Permission Denied&quot;, &quot;apt-get / dpkg lock&quot;, keystore recovery, and storage access
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-blue-400 whitespace-nowrap shrink-0">
          {expanded ? 'Collapse Tips' : 'Expand Tips'}
        </span>
      </button>

      {expanded && innerContent}
    </div>
  );
}
