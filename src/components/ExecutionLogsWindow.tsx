import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Trash2,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Pause,
  ArrowDown,
} from 'lucide-react';
import { ProjectConfig } from '../types';
import { getSdkConfig } from '../data/sdkVersions';

export interface LogLine {
  id: string;
  timestamp: string;
  type: 'prompt' | 'stdout' | 'info' | 'success' | 'warn' | 'error';
  tag: string;
  text: string;
}

interface ExecutionLogsWindowProps {
  projectConfig: ProjectConfig;
  activeStageNumber: number | null; // 1 to 6 or null
  isBuilding: boolean;
  onClearExternal?: () => void;
  onLogCommand?: (title: string, command: string) => void;
  onTriggerSingleStage?: (stageNum: number) => void;
}

export function generateStageLogs(
  stageNumber: number,
  config: ProjectConfig
): LogLine[] {
  const pkg = config.packageName || 'com.example.myapp';
  const pkgPath = pkg.replace(/\./g, '/');
  const minSdk = config.minSdk || 21;
  const targetSdk = config.targetSdk || 33;
  const now = () =>
    new Date().toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  switch (stageNumber) {
    case 1:
      return [
        {
          id: `log-${Date.now()}-1-1`,
          timestamp: now(),
          type: 'prompt',
          tag: 'bash',
          text: `$ aapt package -f -m --min-sdk-version ${minSdk} --target-sdk-version ${targetSdk} -J build/gen -M app/src/main/AndroidManifest.xml -S app/src/main/res -I "$PREFIX/share/aapt/android.jar" -F build/apk/app.unsigned.apk`,
        },
        {
          id: `log-${Date.now()}-1-2`,
          timestamp: now(),
          type: 'info',
          tag: 'aapt',
          text: `[aapt] Parsing AndroidManifest.xml (package: ${pkg}, minSdk: ${minSdk}, targetSdk: ${targetSdk})...`,
        },
        {
          id: `log-${Date.now()}-1-3`,
          timestamp: now(),
          type: 'stdout',
          tag: 'aapt',
          text: `[aapt] Loading resource directories: app/src/main/res/layout, app/src/main/res/values...`,
        },
        {
          id: `log-${Date.now()}-1-4`,
          timestamp: now(),
          type: 'stdout',
          tag: 'aapt',
          text: `[aapt] Compiling XML layout: activity_main.xml (1 LinearLayout, 2 TextViews, 1 Button)`,
        },
        {
          id: `log-${Date.now()}-1-5`,
          timestamp: now(),
          type: 'stdout',
          tag: 'aapt',
          text: `[aapt] Emitting Java symbols: build/gen/${pkgPath}/R.java (4 resource identifiers)`,
        },
        {
          id: `log-${Date.now()}-1-6`,
          timestamp: now(),
          type: 'success',
          tag: 'aapt',
          text: `[aapt] Created resource archive: build/apk/app.unsigned.apk (4,812 bytes)`,
        },
        {
          id: `log-${Date.now()}-1-7`,
          timestamp: now(),
          type: 'info',
          tag: 'aapt',
          text: `[aapt] Stage 1 completed successfully in 142ms (0 errors, 0 warnings)`,
        },
      ];

    case 2:
      return [
        {
          id: `log-${Date.now()}-2-1`,
          timestamp: now(),
          type: 'prompt',
          tag: 'bash',
          text: `$ ecj -1.8 -encoding UTF-8 -d build/obj -classpath "$PREFIX/share/aapt/android.jar" -sourcepath app/src/main/java:build/gen build/gen/${pkgPath}/R.java app/src/main/java/${pkgPath}/MainActivity.java`,
        },
        {
          id: `log-${Date.now()}-2-2`,
          timestamp: now(),
          type: 'info',
          tag: 'ecj',
          text: `[ecj] Eclipse Compiler for Java v3.30.0 starting (JDK 17 runtime)...`,
        },
        {
          id: `log-${Date.now()}-2-3`,
          timestamp: now(),
          type: 'stdout',
          tag: 'ecj',
          text: `[ecj] Classpath linked: $PREFIX/share/aapt/android.jar (Target SDK: API ${targetSdk})`,
        },
        {
          id: `log-${Date.now()}-2-4`,
          timestamp: now(),
          type: 'stdout',
          tag: 'ecj',
          text: `[ecj] [1/2] Compiling build/gen/${pkgPath}/R.java...`,
        },
        {
          id: `log-${Date.now()}-2-5`,
          timestamp: now(),
          type: 'stdout',
          tag: 'ecj',
          text: `[ecj] [2/2] Compiling app/src/main/java/${pkgPath}/MainActivity.java...`,
        },
        {
          id: `log-${Date.now()}-2-6`,
          timestamp: now(),
          type: 'stdout',
          tag: 'ecj',
          text: `[ecj] Emitted bytecode: build/obj/${pkgPath}/MainActivity.class (1,940 bytes)`,
        },
        {
          id: `log-${Date.now()}-2-7`,
          timestamp: now(),
          type: 'stdout',
          tag: 'ecj',
          text: `[ecj] Emitted bytecode: build/obj/${pkgPath}/R$layout.class (482 bytes)`,
        },
        {
          id: `log-${Date.now()}-2-8`,
          timestamp: now(),
          type: 'success',
          tag: 'ecj',
          text: `[ecj] Compilation finished: 3 class files generated in 218ms.`,
        },
      ];

    case 3:
      return [
        {
          id: `log-${Date.now()}-3-1`,
          timestamp: now(),
          type: 'prompt',
          tag: 'bash',
          text: `$ dx --dex --min-sdk-version=${minSdk} --output=classes.dex build/obj`,
        },
        {
          id: `log-${Date.now()}-3-2`,
          timestamp: now(),
          type: 'info',
          tag: 'dx',
          text: `[dx] Dalvik Executable converter initialized (Target Min SDK: API ${minSdk})...`,
        },
        {
          id: `log-${Date.now()}-3-3`,
          timestamp: now(),
          type: 'stdout',
          tag: 'dx',
          text: `[dx] Reading JVM bytecode from directory: build/obj...`,
        },
        {
          id: `log-${Date.now()}-3-4`,
          timestamp: now(),
          type: 'stdout',
          tag: 'dx',
          text: `[dx] Optimizing register allocations and translating instructions...`,
        },
        {
          id: `log-${Date.now()}-3-5`,
          timestamp: now(),
          type: 'stdout',
          tag: 'dx',
          text: `[dx] Dex stats: 3 classes, 18 methods, 12 fields, 8 string constants`,
        },
        {
          id: `log-${Date.now()}-3-6`,
          timestamp: now(),
          type: 'success',
          tag: 'dx',
          text: `[dx] Emitted Dalvik executable: classes.dex (2,684 bytes)`,
        },
        {
          id: `log-${Date.now()}-3-7`,
          timestamp: now(),
          type: 'info',
          tag: 'dx',
          text: `[dx] Stage 3 completed in 94ms.`,
        },
      ];

    case 4:
      return [
        {
          id: `log-${Date.now()}-4-1`,
          timestamp: now(),
          type: 'prompt',
          tag: 'bash',
          text: `$ cp build/apk/app.unsigned.apk app.raw.apk && aapt add app.raw.apk classes.dex`,
        },
        {
          id: `log-${Date.now()}-4-2`,
          timestamp: now(),
          type: 'info',
          tag: 'aapt',
          text: `[aapt] Cloned base unsigned APK to app.raw.apk (4,812 bytes)...`,
        },
        {
          id: `log-${Date.now()}-4-3`,
          timestamp: now(),
          type: 'stdout',
          tag: 'aapt',
          text: `[aapt] Injecting 'classes.dex' into root of ZIP archive...`,
        },
        {
          id: `log-${Date.now()}-4-4`,
          timestamp: now(),
          type: 'stdout',
          tag: 'aapt',
          text: `[aapt] Archive entry 'classes.dex' deflated 58% (stored: 1,128 bytes)`,
        },
        {
          id: `log-${Date.now()}-4-5`,
          timestamp: now(),
          type: 'success',
          tag: 'aapt',
          text: `[aapt] Raw APK assembled: app.raw.apk (7,496 bytes)`,
        },
      ];

    case 5:
      const v3Enabled = targetSdk >= 28;
      return [
        {
          id: `log-${Date.now()}-5-1`,
          timestamp: now(),
          type: 'prompt',
          tag: 'bash',
          text: `$ apksigner sign --v1-signing-enabled true --v2-signing-enabled true${
            v3Enabled ? ' --v3-signing-enabled true' : ''
          } --ks debug.keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out app.apk app.raw.apk`,
        },
        {
          id: `log-${Date.now()}-5-2`,
          timestamp: now(),
          type: 'info',
          tag: 'keytool',
          text: `[keytool] Verifying debug.keystore (RSA 2048-bit, Validity: 10,000 days)...`,
        },
        {
          id: `log-${Date.now()}-5-3`,
          timestamp: now(),
          type: 'stdout',
          tag: 'apksigner',
          text: `[apksigner] Computing SHA-256 digest of entire archive...`,
        },
        {
          id: `log-${Date.now()}-5-4`,
          timestamp: now(),
          type: 'stdout',
          tag: 'apksigner',
          text: `[apksigner] Writing APK Signature Scheme v1 (JAR signing block)...`,
        },
        {
          id: `log-${Date.now()}-5-5`,
          timestamp: now(),
          type: 'stdout',
          tag: 'apksigner',
          text: `[apksigner] Writing APK Signature Scheme v2 (Full APK block)...`,
        },
        {
          id: `log-${Date.now()}-5-6`,
          timestamp: now(),
          type: 'stdout',
          tag: 'apksigner',
          text: v3Enabled
            ? `[apksigner] Writing APK Signature Scheme v3 (Target SDK ${targetSdk} key rotation block)...`
            : `[apksigner] Skipping v3 signature block (Target SDK < 28)`,
        },
        {
          id: `log-${Date.now()}-5-7`,
          timestamp: now(),
          type: 'success',
          tag: 'apksigner',
          text: `[apksigner] Verification: PASSED (v1: true, v2: true, v3: ${v3Enabled})`,
        },
        {
          id: `log-${Date.now()}-5-8`,
          timestamp: now(),
          type: 'success',
          tag: 'apksigner',
          text: `[apksigner] Cryptographically signed APK generated: app.apk (8,240 bytes)`,
        },
      ];

    case 6:
      return [
        {
          id: `log-${Date.now()}-6-1`,
          timestamp: now(),
          type: 'prompt',
          tag: 'bash',
          text: `$ rm -f classes.dex app.raw.apk && termux-open app.apk`,
        },
        {
          id: `log-${Date.now()}-6-2`,
          timestamp: now(),
          type: 'info',
          tag: 'termux',
          text: `[termux] Cleaned temporary build artifacts (classes.dex, app.raw.apk)...`,
        },
        {
          id: `log-${Date.now()}-6-3`,
          timestamp: now(),
          type: 'stdout',
          tag: 'termux-open',
          text: `[termux-open] Intent resolved: android.intent.action.VIEW (MIME: application/vnd.android.package-archive)`,
        },
        {
          id: `log-${Date.now()}-6-4`,
          timestamp: now(),
          type: 'info',
          tag: 'system',
          text: `[system] Dispatched Intent to Android Package Installer for package "${pkg}"`,
        },
        {
          id: `log-${Date.now()}-6-5`,
          timestamp: now(),
          type: 'success',
          tag: 'system',
          text: `=== BUILD SUCCEEDED: app.apk is signed, verified, and ready for install! ===`,
        },
      ];

    default:
      return [];
  }
}

export default function ExecutionLogsWindow({
  projectConfig,
  activeStageNumber,
  isBuilding,
  onClearExternal,
  onLogCommand,
  onTriggerSingleStage,
}: ExecutionLogsWindowProps) {
  const [logs, setLogs] = useState<LogLine[]>(() => [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      type: 'info',
      tag: 'termux',
      text: `Termux session initialized for ${projectConfig.name} (${projectConfig.packageName}). Target SDK: API ${projectConfig.targetSdk}.`,
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      type: 'stdout',
      tag: 'system',
      text: `Ready to execute 6-stage APK compiler. Run "Simulate Build Run" above or select a stage to stream execution logs.`,
    },
  ]);

  const [filterType, setFilterType] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpandedHeight, setIsExpandedHeight] = useState<boolean>(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // When activeStageNumber changes during simulation or selection, append realistic stage logs
  useEffect(() => {
    if (activeStageNumber && activeStageNumber >= 1 && activeStageNumber <= 6) {
      const newStageLines = generateStageLogs(activeStageNumber, projectConfig);
      setLogs((prev) => {
        // Prevent duplicate appending of the exact same prompt line
        if (prev.length > 0 && prev[prev.length - 1].text === newStageLines[0].text) {
          return prev;
        }
        return [...prev, ...newStageLines];
      });
    }
  }, [activeStageNumber, projectConfig.name, projectConfig.packageName, projectConfig.minSdk, projectConfig.targetSdk]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleClear = () => {
    setLogs([]);
    if (onClearExternal) onClearExternal();
  };

  const handleCopyLogs = () => {
    const rawText = logs
      .map((l) => `[${l.timestamp}] [${l.tag}] ${l.text}`)
      .join('\n');
    navigator.clipboard.writeText(rawText);
    if (onLogCommand) {
      onLogCommand(`Execution Logs: ${projectConfig.name}`, rawText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'all') return true;
    if (filterType === 'prompt') return l.type === 'prompt';
    if (filterType === 'stdout') return l.type === 'stdout' || l.type === 'info';
    if (filterType === 'success') return l.type === 'success';
    if (filterType === 'error') return l.type === 'error';
    return true;
  });

  const stageTitles: Record<number, string> = {
    1: 'Step 1: Packaging (aapt)',
    2: 'Step 2: Compiling (ecj)',
    3: 'Step 3: Dexing (dx)',
    4: 'Step 4: Bundling (aapt add)',
    5: 'Step 5: Signing (apksigner)',
    6: 'Step 6: Installing (termux-open)',
  };

  return (
    <div className="bg-[#070a0f] border border-slate-800 rounded-lg overflow-hidden shadow-xl flex flex-col font-mono">
      {/* Terminal Titlebar & Window Chrome */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Window Dots & Session Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 select-none" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40 inline-block" />
          </div>

          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200 truncate">
              Execution Logs · termux@android:~/apk-{projectConfig.name.toLowerCase()}
            </span>
          </div>

          {activeStageNumber ? (
            <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/50 text-[11px] text-blue-300 font-sans flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Active: {stageTitles[activeStageNumber] || `Stage ${activeStageNumber}`}</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-sans">
              Status: Idle
            </span>
          )}
        </div>

        {/* Right: Controls (Filters, Auto-scroll, Copy, Clear, Expand) */}
        <div className="flex items-center gap-2 shrink-0 font-sans">
          {/* Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">
            {['all', 'prompt', 'stdout', 'success'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                  filterType === f
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'prompt' ? 'Commands' : f}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              autoScroll
                ? 'bg-slate-800 text-blue-400'
                : 'bg-slate-900 text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowDown size={12} />
            <span className="hidden md:inline">Scroll</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLogs}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy Logs</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            title="Clear Terminal Output"
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => setIsExpandedHeight(!isExpandedHeight)}
            title={isExpandedHeight ? 'Collapse height' : 'Expand height'}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {isExpandedHeight ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Terminal Output Body */}
      <div
        className={`p-4 overflow-y-auto space-y-1.5 transition-all text-xs leading-relaxed ${
          isExpandedHeight ? 'max-h-[560px] min-h-[420px]' : 'max-h-80 min-h-[220px]'
        }`}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center">
            No terminal output recorded. Click &quot;Simulate Build Run&quot; above to stream execution logs.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isPrompt = log.type === 'prompt';
            const isSuccess = log.type === 'success';
            const isError = log.type === 'error';
            const isWarn = log.type === 'warn';

            return (
              <div
                key={log.id}
                className={`flex items-start gap-2.5 py-0.5 px-1 rounded hover:bg-slate-900/60 ${
                  isPrompt
                    ? 'text-cyan-300 font-bold bg-slate-900/40'
                    : isSuccess
                    ? 'text-emerald-400'
                    : isError
                    ? 'text-red-400 bg-red-950/20'
                    : isWarn
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}
              >
                <span className="text-[11px] text-slate-600 select-none shrink-0 font-mono">
                  {log.timestamp}
                </span>

                <span
                  className={`text-[11px] uppercase font-semibold shrink-0 select-none px-1 rounded ${
                    isPrompt
                      ? 'text-cyan-400 bg-cyan-950/60'
                      : isSuccess
                      ? 'text-emerald-400 bg-emerald-950/60'
                      : isError
                      ? 'text-red-400 bg-red-950/60'
                      : 'text-slate-500 bg-slate-900'
                  }`}
                >
                  {log.tag}
                </span>

                <span className="whitespace-pre-wrap break-all flex-1">
                  {log.text}
                </span>
              </div>
            );
          })
        )}
        <div ref={terminalBottomRef} />
      </div>

      {/* Terminal Footer Quick Stage Simulator Bar */}
      <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-sans">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">Quick Step Simulator:</span>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                if (onTriggerSingleStage) onTriggerSingleStage(num);
                const stageLines = generateStageLogs(num, projectConfig);
                setLogs((prev) => [...prev, ...stageLines]);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-blue-400 border border-slate-800 text-[11px] font-mono transition-colors cursor-pointer"
            >
              [Step {num}]
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-500">
          Showing <span className="text-slate-300 font-mono">{filteredLogs.length}</span> lines
        </div>
      </div>
    </div>
  );
}
