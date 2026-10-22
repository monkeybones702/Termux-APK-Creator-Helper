import React, { useState } from 'react';
import {
  Sliders,
  Check,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  X,
  Copy,
} from 'lucide-react';
import {
  ANDROID_SDK_VERSIONS,
  AndroidSdkVersion,
  getSdkConfig,
  generateSdkBuildScriptConstants,
} from '../data/sdkVersions';
import { CommandCategory } from '../types';

interface SdkVersionManagerProps {
  currentMinSdk: number;
  currentTargetSdk: number;
  onUpdateSdk: (minSdk: number, targetSdk: number) => void;
  onLogCommand?: (
    title: string,
    command: string,
    category?: CommandCategory
  ) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
  defaultExpanded?: boolean;
}

export default function SdkVersionManager({
  currentMinSdk,
  currentTargetSdk,
  onUpdateSdk,
  onLogCommand,
  isModal = false,
  onCloseModal,
  defaultExpanded = true,
}: SdkVersionManagerProps) {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);
  const [copiedFlags, setCopiedFlags] = useState<boolean>(false);
  const [selectedApiLevel, setSelectedApiLevel] = useState<number>(currentTargetSdk);

  const targetSdkConfig: AndroidSdkVersion = getSdkConfig(currentTargetSdk);
  const minSdkConfig: AndroidSdkVersion = getSdkConfig(currentMinSdk);
  const inspectedSdk: AndroidSdkVersion = getSdkConfig(selectedApiLevel);

  const generatedConstants = generateSdkBuildScriptConstants(
    currentMinSdk,
    currentTargetSdk
  );

  const presets = [
    {
      id: 'modern-rec',
      title: 'Modern Standard (Recommended)',
      min: 24,
      target: 34,
      desc: 'Android 7.0 to 14 (96%+ of active devices, Java 8 + v3 signing)',
    },
    {
      id: 'cutting-edge',
      title: 'Android 15 Cutting Edge',
      min: 26,
      target: 35,
      desc: 'Android 8.0 to 15 (Edge-to-edge + 16KB page size checks)',
    },
    {
      id: 'mainstream',
      title: 'Mainstream Stable',
      min: 21,
      target: 33,
      desc: 'Android 5.0 to 13 (Maximum compatibility + notification permission)',
    },
    {
      id: 'legacy-max',
      title: 'Wide Legacy Range',
      min: 21,
      target: 31,
      desc: 'Android 5.0 to 12 (Baseline modern component rules)',
    },
  ];

  const handleApplyPreset = (min: number, target: number) => {
    onUpdateSdk(min, target);
    setSelectedApiLevel(target);
    if (onLogCommand) {
      onLogCommand(
        `SDK Profile: Min ${min} / Target ${target}`,
        generateSdkBuildScriptConstants(min, target),
        'setup'
      );
    }
  };

  const handleSetTargetSdk = (api: number) => {
    const newTarget = api;
    const newMin = currentMinSdk > newTarget ? newTarget : currentMinSdk;
    onUpdateSdk(newMin, newTarget);
    setSelectedApiLevel(newTarget);
  };

  const handleSetMinSdk = (api: number) => {
    const newMin = api;
    const newTarget = currentTargetSdk < newMin ? newMin : currentTargetSdk;
    onUpdateSdk(newMin, newTarget);
  };

  const handleCopyConstants = () => {
    navigator.clipboard.writeText(generatedConstants);
    if (onLogCommand) {
      onLogCommand(
        `SDK Constants: Min ${currentMinSdk} / Target ${currentTargetSdk}`,
        generatedConstants,
        'setup'
      );
    }
    setCopiedFlags(true);
    setTimeout(() => setCopiedFlags(false), 2000);
  };

  const content = (
    <div className="p-5 space-y-6">
      {/* Quick Presets Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            Recommended SDK Profiles
          </span>
          <span>Click to apply toolchain presets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {presets.map((p) => {
            const isActive =
              currentMinSdk === p.min && currentTargetSdk === p.target;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.min, p.target)}
                className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-950/40 border-blue-500/70 text-slate-100 ring-1 ring-blue-500/40'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold truncate">
                    {p.title}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  )}
                </div>
                <div className="text-xs font-mono text-blue-400">
                  Min API {p.min} → Target API {p.target}
                </div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {p.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target SDK Level Selector Grid (API 21 to 35) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-200">
              Target SDK Level (Active: API {currentTargetSdk} · {targetSdkConfig.versionName})
            </span>
            <p className="text-slate-400 mt-0.5">
              Defines compiler optimization flags, runtime security checks, and platform compatibility rules.
            </p>
          </div>
          <span className="text-slate-400 font-mono">
            {ANDROID_SDK_VERSIONS.length} Levels Available
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
          {ANDROID_SDK_VERSIONS.map((sdk) => {
            const isTarget = currentTargetSdk === sdk.apiLevel;
            const isMin = currentMinSdk === sdk.apiLevel;
            const isInspected = selectedApiLevel === sdk.apiLevel;

            return (
              <button
                key={sdk.apiLevel}
                type="button"
                onClick={() => handleSetTargetSdk(sdk.apiLevel)}
                onMouseEnter={() => setSelectedApiLevel(sdk.apiLevel)}
                className={`p-2.5 rounded-md border text-center transition-all cursor-pointer relative ${
                  isTarget
                    ? 'bg-blue-600 border-blue-500 text-white font-semibold shadow-md'
                    : isInspected
                    ? 'bg-slate-800 border-slate-600 text-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {isMin && (
                  <span
                    title="Current Minimum SDK"
                    className="absolute -top-1.5 -left-1.5 px-1 py-0.2 rounded bg-emerald-600 text-white font-mono text-[9px] font-bold"
                  >
                    MIN
                  </span>
                )}
                <div className="text-sm font-mono font-bold">
                  API {sdk.apiLevel}
                </div>
                <div className="text-[11px] truncate opacity-90">
                  {sdk.versionName.replace('Android ', 'v')}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {sdk.releaseYear}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Min SDK Level Selector Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            Minimum SDK Level (Active: API {currentMinSdk} · {minSdkConfig.versionName})
          </span>
          <span>Oldest Android version allowed to install this APK</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {ANDROID_SDK_VERSIONS.filter((v) => v.apiLevel <= currentTargetSdk).map(
            (sdk) => {
              const isMin = currentMinSdk === sdk.apiLevel;
              return (
                <button
                  key={sdk.apiLevel}
                  type="button"
                  onClick={() => handleSetMinSdk(sdk.apiLevel)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isMin
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  API {sdk.apiLevel} ({sdk.versionName.replace('Android ', '')})
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Inspected SDK Level Deep Dive + Dynamic Flags Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Inspected SDK Platform Spec */}
        <div className="lg:col-span-6 bg-slate-950/90 border border-slate-800 rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-100">
                  API {inspectedSdk.apiLevel}: {inspectedSdk.versionName} ({inspectedSdk.codeName})
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  Released {inspectedSdk.releaseYear}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Minimum Java VM: <strong className="text-slate-200 font-mono">Java {inspectedSdk.minSupportedJava}</strong>
              </p>
            </div>
            {inspectedSdk.apiLevel === currentTargetSdk && (
              <span className="px-2 py-0.5 rounded bg-blue-900/50 border border-blue-500/50 text-blue-300 text-xs font-medium">
                Active Target
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">
              Key Platform Changes &amp; APIs:
            </div>
            <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
              {inspectedSdk.keyChanges.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          </div>

          <div className="p-2.5 rounded bg-amber-950/20 border border-amber-600/30 text-xs text-amber-300/90 flex items-start gap-2">
            <ShieldAlert size={14} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong>Security &amp; Manifest Rule: </strong>
              <span>{inspectedSdk.securityNotes}</span>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Build Script Constants & Flags */}
        <div className="lg:col-span-6 bg-[#070a0f] border border-slate-800 rounded-md p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-blue-400" />
              <span className="text-xs font-semibold text-slate-200">
                Generated build.sh Toolchain Flags
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyConstants}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedFlags ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Flags</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-2 rounded bg-black/60 text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto max-h-48">
            <code>{generatedConstants}</code>
          </pre>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info size={12} className="shrink-0" />
            <span>
              Applied automatically to your project files, <span className="font-mono text-slate-400">build.sh</span>, and <span className="font-mono text-slate-400">AndroidManifest.xml</span>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sliders size={18} className="text-blue-400" />
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Android SDK Version Manager (API 21 to 35)
                </h2>
                <p className="text-xs text-slate-400">
                  Configure toolchain flags and Android compatibility levels for Termux compilation
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
          <div className="overflow-y-auto flex-1">{content}</div>
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
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-100">
                SDK Version Manager
              </h3>
              <span className="px-2 py-0.5 rounded bg-blue-900/50 border border-blue-500/40 text-blue-300 text-xs font-mono">
                Min API {currentMinSdk} · Target API {currentTargetSdk} ({targetSdkConfig.versionName})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Toggle between Android SDK levels (21 to 35) to auto-update build flags (AAPT, ECJ, DX, APKSigner)
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-blue-400 whitespace-nowrap shrink-0">
          {expanded ? 'Collapse SDK Manager' : 'Expand SDK Manager'}
        </span>
      </button>

      {expanded && content}
    </div>
  );
}
