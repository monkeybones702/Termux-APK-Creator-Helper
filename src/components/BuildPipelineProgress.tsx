import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Check,
  Copy,
  Loader2,
  AlertCircle,
  Terminal,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { CommandCategory, ProjectConfig, ProjectFile } from '../types';

export type StageStatus = 'pending' | 'running' | 'completed' | 'error';

export interface BuildStage {
  stepNumber: number;
  id: string;
  label: string;
  shortTitle: string;
  tool: string;
  description: string;
  outputArtifact: string;
  command: string;
}

interface BuildPipelineProgressProps {
  projectConfig: ProjectConfig;
  projectFiles: ProjectFile[];
  pkgError: string;
  onLogCommand: (
    title: string,
    command: string,
    category?: CommandCategory
  ) => void;
  activeStageNumber?: number | null;
  onActiveStageChange?: (stageNum: number | null) => void;
}

export default function BuildPipelineProgress({
  projectConfig,
  projectFiles,
  pkgError,
  onLogCommand,
  activeStageNumber,
  onActiveStageChange,
}: BuildPipelineProgressProps) {
  const pkgPath = (projectConfig.packageName || 'com.example.myapp').replace(
    /\./g,
    '/'
  );

  const stages: BuildStage[] = [
    {
      stepNumber: 1,
      id: 'resources',
      label: 'Step 1: Resource Packaging',
      shortTitle: 'Packaging',
      tool: 'aapt package',
      description:
        'Generates R.java resource IDs and packages AndroidManifest.xml + res/ layouts into an unsigned APK.',
      outputArtifact: `build/gen/${pkgPath}/R.java + build/apk/app.unsigned.apk`,
      command: `mkdir -p build/gen build/obj build/apk && aapt package -f -m -J build/gen -M app/src/main/AndroidManifest.xml -S app/src/main/res -I "$PREFIX/share/aapt/android.jar" -F build/apk/app.unsigned.apk`,
    },
    {
      stepNumber: 2,
      id: 'compiling',
      label: 'Step 2: Java Compilation',
      shortTitle: 'Compiling',
      tool: 'ecj',
      description:
        'Compiles Java source files and generated R.java into JVM .class bytecode targeting Android SDK.',
      outputArtifact: `build/obj/${pkgPath}/MainActivity.class`,
      command: `ecj -d build/obj -classpath "$PREFIX/share/aapt/android.jar" -sourcepath app/src/main/java:build/gen build/gen/${pkgPath}/R.java app/src/main/java/${pkgPath}/MainActivity.java`,
    },
    {
      stepNumber: 3,
      id: 'dexing',
      label: 'Step 3: Dalvik Dexing',
      shortTitle: 'Dexing',
      tool: 'dx --dex',
      description:
        'Translates compiled JVM .class files inside build/obj into Dalvik executable bytecode (classes.dex).',
      outputArtifact: 'classes.dex',
      command: `dx --dex --output=classes.dex build/obj`,
    },
    {
      stepNumber: 4,
      id: 'bundling',
      label: 'Step 4: DEX APK Bundling',
      shortTitle: 'Bundling',
      tool: 'aapt add',
      description:
        'Bundles classes.dex into the raw unsigned APK archive prior to cryptographic signing.',
      outputArtifact: 'app.raw.apk',
      command: `cp build/apk/app.unsigned.apk app.raw.apk && aapt add app.raw.apk classes.dex`,
    },
    {
      stepNumber: 5,
      id: 'signing',
      label: 'Step 5: Keystore & APK Signing',
      shortTitle: 'Signing',
      tool: 'keytool + apksigner',
      description:
        'Auto-generates debug.keystore if absent and signs app.apk with v1/v2/v3 cryptographic signatures.',
      outputArtifact: 'debug.keystore + app.apk (Signed)',
      command: `if [ ! -f debug.keystore ]; then keytool -genkeypair -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"; fi && apksigner sign --ks debug.keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out app.apk app.raw.apk`,
    },
    {
      stepNumber: 6,
      id: 'installing',
      label: 'Step 6: Device Installation',
      shortTitle: 'Installing',
      tool: 'termux-open',
      description:
        'Invokes termux-open on app.apk to launch the native Android Package Installer dialog.',
      outputArtifact: 'Installed Package: ' + projectConfig.packageName,
      command: `rm -f classes.dex app.raw.apk && termux-open app.apk`,
    },
  ];

  const [stageStatuses, setStageStatuses] = useState<
    Record<number, StageStatus>
  >({
    1: 'pending',
    2: 'pending',
    3: 'pending',
    4: 'pending',
    5: 'pending',
    6: 'pending',
  });
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `Ready to run 6-stage Termux APK pipeline for ${projectConfig.name} (${projectConfig.packageName}).`,
  ]);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [showLogParser, setShowLogParser] = useState<boolean>(false);
  const [pastedTerminalLog, setPastedTerminalLog] = useState<string>('');

  // Reset console summary when project changes
  useEffect(() => {
    if (!isSimulating) {
      setConsoleLogs([
        `Pipeline configured for ${projectConfig.name} (${projectConfig.packageName}, SDK ${projectConfig.minSdk}–${projectConfig.targetSdk}).`,
      ]);
    }
  }, [
    projectConfig.name,
    projectConfig.packageName,
    projectConfig.minSdk,
    projectConfig.targetSdk,
    isSimulating,
  ]);

  const completedCount = Object.values(stageStatuses).filter(
    (s) => s === 'completed'
  ).length;
  const hasError = Object.values(stageStatuses).some((s) => s === 'error');
  const progressPercent = Math.round((completedCount / stages.length) * 100);

  const handleResetProgress = () => {
    setIsSimulating(false);
    setStageStatuses({
      1: 'pending',
      2: 'pending',
      3: 'pending',
      4: 'pending',
      5: 'pending',
      6: 'pending',
    });
    setSelectedStep(1);
    setConsoleLogs([
      `Pipeline reset for ${projectConfig.name} (${projectConfig.packageName}).`,
    ]);
  };

  // Interactive Pipeline Simulation & Pre-flight Validator
  const handleRunPipelineSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setStageStatuses({
      1: 'pending',
      2: 'pending',
      3: 'pending',
      4: 'pending',
      5: 'pending',
      6: 'pending',
    });
    setConsoleLogs([
      `=== Starting Build Pipeline Verification: ${projectConfig.name} (${projectConfig.packageName}) ===`,
    ]);

    let current = 1;

    const runNextStep = () => {
      if (current > 6) {
        setIsSimulating(false);
        if (onActiveStageChange) onActiveStageChange(null);
        setConsoleLogs((prev) => [
          ...prev,
          `=== Build Complete: app.apk (${projectFiles.length} source files verified) ===`,
        ]);
        return;
      }

      const stage = stages[current - 1];
      setSelectedStep(current);
      if (onActiveStageChange) onActiveStageChange(current);
      setStageStatuses((prev) => ({ ...prev, [current]: 'running' }));
      setConsoleLogs((prev) => [
        ...prev,
        `[${current}/6] Running ${stage.tool}: ${stage.shortTitle}...`,
      ]);

      setTimeout(() => {
        // Validate package name at step 1
        if (current === 1 && pkgError) {
          setStageStatuses((prev) => ({ ...prev, [current]: 'error' }));
          setConsoleLogs((prev) => [
            ...prev,
            `[ERROR in Step 1 - aapt] AndroidManifest.xml package "${projectConfig.packageName}" is invalid: ${pkgError}`,
          ]);
          setIsSimulating(false);
          if (onActiveStageChange) onActiveStageChange(null);
          return;
        }

        setStageStatuses((prev) => ({ ...prev, [current]: 'completed' }));
        setConsoleLogs((prev) => [
          ...prev,
          `  ✓ Output ready: ${stage.outputArtifact}`,
        ]);
        current += 1;
        runNextStep();
      }, 450);
    };

    runNextStep();
  };

  // Toggle an individual step status manually for users stepping through Termux
  const handleToggleStepManual = (stepNum: number) => {
    setSelectedStep(stepNum);
    setStageStatuses((prev) => {
      const currentStatus = prev[stepNum];
      const nextStatus: StageStatus =
        currentStatus === 'completed' ? 'pending' : 'completed';
      return { ...prev, [stepNum]: nextStatus };
    });
  };

  const handleCopyStageCommand = (stage: BuildStage, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(stage.command);
    onLogCommand(
      `Stage ${stage.stepNumber} (${stage.tool}): ${projectConfig.name}`,
      stage.command,
      'bootstrap'
    );
    setCopiedStep(stage.stepNumber);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  // Parse pasted real Termux terminal output from ./build.sh
  const handleSyncFromTerminalOutput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedTerminalLog.trim()) return;

    const text = pastedTerminalLog;
    const nextStatuses: Record<number, StageStatus> = {
      1: 'pending',
      2: 'pending',
      3: 'pending',
      4: 'pending',
      5: 'pending',
      6: 'pending',
    };

    for (let i = 1; i <= 6; i++) {
      if (text.includes(`[${i}/6]`)) {
        nextStatuses[i] = 'completed';
        setSelectedStep(i);
      }
    }

    const lower = text.toLowerCase();
    if (
      lower.includes('error:') ||
      lower.includes('exception') ||
      lower.includes('permission denied') ||
      lower.includes('failed')
    ) {
      // Find the last reached step and mark it as error
      let lastReached = 1;
      for (let i = 1; i <= 6; i++) {
        if (text.includes(`[${i}/6]`)) lastReached = i;
      }
      nextStatuses[lastReached] = 'error';
      setSelectedStep(lastReached);
    }

    setStageStatuses(nextStatuses);
    setConsoleLogs(
      text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(-12)
    );
    setShowLogParser(false);
    setPastedTerminalLog('');
  };

  const activeStage =
    stages.find((s) => s.stepNumber === selectedStep) || stages[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-slate-100">
              Build Pipeline Progress Tracker (6-Stage APK Compiler)
            </h2>
            <span className="text-xs font-mono text-slate-400">
              · {completedCount}/6 stages ({progressPercent}%)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Track or simulate each stage of <span className="font-mono text-slate-300">build.sh</span> (Packaging, Compiling, Dexing, Bundling, Signing, Installing)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLogParser(!showLogParser)}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Terminal size={13} />
            <span>Sync from Terminal Output</span>
          </button>

          <button
            type="button"
            onClick={handleResetProgress}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleRunPipelineSimulation}
            disabled={isSimulating}
            className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isSimulating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Simulate Build Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overall Linear Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            Pipeline Status:{' '}
            <strong
              className={
                hasError
                  ? 'text-red-400'
                  : completedCount === 6
                  ? 'text-emerald-400'
                  : isSimulating
                  ? 'text-blue-400'
                  : 'text-slate-200'
              }
            >
              {hasError
                ? 'Halted on Error'
                : completedCount === 6
                ? 'All 6 Stages Complete (APK Signed & Ready)'
                : isSimulating
                ? `Executing Stage ${selectedStep} of 6...`
                : `${completedCount} of 6 Stages Verified`}
            </strong>
          </span>
          <span className="font-mono text-slate-300">{progressPercent}%</span>
        </div>

        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-200 ${
              hasError
                ? 'bg-red-500'
                : completedCount === 6
                ? 'bg-emerald-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${ Math.max(progressPercent, isSimulating ? 12 : 0) }%` }}
          />
        </div>
      </div>

      {/* Optional Terminal Log Sync Input */}
      {showLogParser && (
        <form
          onSubmit={handleSyncFromTerminalOutput}
          className="p-4 rounded-md bg-slate-950 border border-slate-800 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Paste Termux ./build.sh Output to Sync Stage Progress
            </span>
            <button
              type="button"
              onClick={() => setShowLogParser(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <textarea
            value={pastedTerminalLog}
            onChange={(e) => setPastedTerminalLog(e.target.value)}
            rows={3}
            placeholder="Paste terminal output containing [1/6], [2/6], etc. from Termux..."
            className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
          >
            Parse Output &amp; Update Stages
          </button>
        </form>
      )}

      {/* 6-Stage Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {stages.map((stage) => {
          const status = stageStatuses[stage.stepNumber];
          const isSelected = selectedStep === stage.stepNumber;

          return (
            <div
              key={stage.id}
              onClick={() => {
                setSelectedStep(stage.stepNumber);
                if (onActiveStageChange) onActiveStageChange(stage.stepNumber);
              }}
              className={`p-3 rounded-md border transition-all cursor-pointer flex flex-col justify-between ${
                status === 'completed'
                  ? 'bg-emerald-950/25 border-emerald-500/50 hover:border-emerald-400'
                  : status === 'running'
                  ? 'bg-blue-950/40 border-blue-400'
                  : status === 'error'
                  ? 'bg-red-950/30 border-red-500/70'
                  : isSelected
                  ? 'bg-slate-800/80 border-blue-500/60'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-xs font-mono text-slate-400">
                    0{stage.stepNumber}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStepManual(stage.stepNumber);
                    }}
                    title="Click to toggle stage completion"
                    className="cursor-pointer"
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 size={15} className="text-emerald-400" />
                    ) : status === 'running' ? (
                      <Loader2
                        size={15}
                        className="animate-spin text-blue-400"
                      />
                    ) : status === 'error' ? (
                      <AlertCircle size={15} className="text-red-400" />
                    ) : (
                      <span className="block w-3.5 h-3.5 rounded-full border border-slate-600 hover:border-slate-400" />
                    )}
                  </button>
                </div>

                <div className="text-xs font-semibold text-slate-100 truncate">
                  {stage.shortTitle}
                </div>
                <div className="text-xs font-mono text-blue-400/90 truncate mt-0.5">
                  {stage.tool}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="capitalize">{status}</span>
                <ChevronRight size={12} className="text-slate-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Stage Inspector + Live Pipeline Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
        {/* Left: Selected Stage Command & Artifact Details */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-md p-4 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-xs font-mono text-blue-400">
                Stage {activeStage.stepNumber} of 6 · {activeStage.tool}
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                {activeStage.label}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {activeStage.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleStepManual(activeStage.stepNumber)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                {stageStatuses[activeStage.stepNumber] === 'completed'
                  ? 'Mark Pending'
                  : 'Mark Complete'}
              </button>

              <button
                type="button"
                onClick={(e) => handleCopyStageCommand(activeStage, e)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiedStep === activeStage.stepNumber ? (
                  <>
                    <Check size={12} />
                    <span>Copied Stage</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Stage Command</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs text-slate-400 font-mono truncate">
              Target Artifact: <span className="text-slate-200">{activeStage.outputArtifact}</span>
            </div>
            <pre className="p-2.5 bg-[#070a0f] border border-slate-800/90 rounded text-xs text-emerald-400 font-mono overflow-x-auto">
              <code>{activeStage.command}</code>
            </pre>
          </div>
        </div>

        {/* Right: Live Pipeline Execution Log */}
        <div className="lg:col-span-5 bg-[#070a0f] border border-slate-800 rounded-md p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 mb-2 border-b border-slate-800/80">
              <span className="font-mono font-semibold text-slate-300">
                Pipeline Execution Trace
              </span>
              <span className="font-mono">{consoleLogs.length} lines</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-xs">
              {consoleLogs.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.includes('[ERROR')
                      ? 'text-red-400'
                      : line.includes('✓') || line.includes('Complete')
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
