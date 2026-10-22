import React, { useState } from 'react';
import { Search, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { ProjectConfig, ProjectFile } from '../types';

interface SummaryResearchTabProps {
  projectConfig: ProjectConfig;
  projectFiles: ProjectFile[];
}

interface GroundedSource {
  title: string;
  uri: string;
}

const BASELINE_COMPETITORS = [
  {
    name: 'APK Creator Helper for Termux (This App)',
    category: 'CLI Heredoc + Gemini AI Bootstrapper',
    footprint: '< 5 MB Termux packages (aapt, ecj, dx, apksigner)',
    workflow: 'Single composite bash heredoc + 6-step native build.sh pipeline',
    keyDifference:
      'Zero Gradle overhead, instant on-device compilation in under 4 seconds, interactive Gemini feature idea buttons, and full source ownership.',
  },
  {
    name: 'Android Studio (Official IDE)',
    category: 'Desktop Full-Scale IDE',
    footprint: '8 GB+ RAM, 15 GB+ disk + Gradle daemon',
    workflow: 'Desktop-only Gradle build system with full Android SDK',
    keyDifference:
      'Cannot run natively on unrooted Android phones without heavy proot/VNC setups; slow cold Gradle builds.',
  },
  {
    name: 'Acode / Termux Native Editors',
    category: 'Mobile Code Editor + Alpine Terminal',
    footprint: '50–250 MB local editor + manual shell scripts',
    workflow: 'Manual file creation and manual CLI compiler invocation',
    keyDifference:
      'Provides syntax editing but lacks automated project heredoc generation, AI feature injection, and one-click keystore/apksigner pipelines.',
  },
  {
    name: 'Kodular / AppsGeyser',
    category: 'Cloud No-Code / Block Builders',
    footprint: 'Browser-only proprietary cloud compiler',
    workflow: 'Drag-and-drop visual blocks compiled on remote servers',
    keyDifference:
      'Locks developers into proprietary runtimes, requires internet for every build, and prevents low-level Java/Termux shell integration.',
  },
  {
    name: 'Newly.app / Cloud ZIP Builders',
    category: 'Remote Cloud APK Compiler',
    footprint: 'Web upload queue',
    workflow: 'Upload project ZIP to remote build containers',
    keyDifference:
      'Requires uploading source code to third-party servers with queue wait times, whereas our Termux pipeline compiles 100% locally on-device.',
  },
];

export default function SummaryResearchTab({
  projectConfig,
  projectFiles,
}: SummaryResearchTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>(
    `Compare Android apps similar to "${projectConfig.name}" (${projectConfig.packageName}) and on-device Termux APK builders`
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [liveAnalysis, setLiveAnalysis] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundedSource[]>([
    { title: 'Termux Official Documentation & Wiki', uri: 'https://wiki.termux.com/wiki/Main_Page' },
    { title: 'Android Developer Command-Line Tools (apksigner & aapt)', uri: 'https://developer.android.com/tools' },
    { title: 'Acode — Mobile Code Editor for Android', uri: 'https://acode.app' },
    { title: 'Kodular Creator Platform Overview', uri: 'https://www.kodular.io' },
  ]);
  const [searchError, setSearchError] = useState<string>('');

  const handleRunWebSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSearching) return;
    setIsSearching(true);
    setSearchError('');

    try {
      const response = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          projectConfig: {
            appName: projectConfig.name,
            packageName: projectConfig.packageName,
            minSdk: projectConfig.minSdk,
            targetSdk: projectConfig.targetSdk,
          },
          selectedIdeas: projectConfig.selectedIdeas,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Web search failed.');
      }

      setLiveAnalysis(data.text);
      if (Array.isArray(data.sources) && data.sources.length > 0) {
        setSources(data.sources);
      }
    } catch (error: any) {
      setSearchError(error?.message || 'Unable to run grounded web search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary & Core Functions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Application Idea & Functional Architecture Summary
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active Project: <span className="text-slate-200 font-mono">{projectConfig.name}</span> · Package:{' '}
              <span className="text-slate-200 font-mono">{projectConfig.packageName}</span> · SDK{' '}
              <span className="font-mono">{projectConfig.minSdk}–{projectConfig.targetSdk}</span> ·{' '}
              <span className="font-mono">{projectFiles.length}</span> exportable files
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-100">
              01. Core Concept & Objective
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>APK Creator Helper for Termux</strong> eliminates the need for a desktop PC or heavy Gradle daemon when building Android apps. It generates self-contained Bash heredoc scripts (`cat &lt;&lt; &apos;EOF&apos;`) and a 6-stage native compiler pipeline (`aapt`, `ecj`, `dx`, `keytool`, `apksigner`, `termux-open`) that turns raw Java &amp; XML into a signed, installable APK directly on an Android phone.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-100">
              02. End-to-End Platform Functions
            </h3>
            <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <li>
                <strong>Environment Provisioning:</strong> One-click Termux toolchain setup (`openjdk-17`, `aapt`, `ecj`, `dx`, `apksigner`, `termux-api`).
              </li>
              <li>
                <strong>Validated Project Bootstrapper:</strong> Reverse-domain package validation with cloud (Firestore) &amp; local storage project switching.
              </li>
              <li>
                <strong>Interactive Idea-to-Code Studio:</strong> 27+ feature buttons that push directly into Gemini Chat and synthesize Java/XML files.
              </li>
              <li>
                <strong>Live Exportable File Editor:</strong> Inspect, customize, and inject new modules into any project file before exporting.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-100">
              03. Active Features in Current Build
            </h3>
            {projectConfig.selectedIdeas.length > 0 ? (
              <div className="text-xs text-slate-300 space-y-1">
                <p className="text-slate-400 mb-1.5">
                  Features queued for <span className="font-mono text-slate-200">{projectConfig.name}</span>:
                </p>
                <div className="text-emerald-400 leading-relaxed">
                  {projectConfig.selectedIdeas.join(' · ')}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard Android Activity template active. Visit the <strong>Brainstorm &amp; Gemini Chat</strong> tab and click any Feature Idea button to add custom capabilities.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Google Search Grounding Competitor & Market Research */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Live Web Search: Similar Apps & Key Differences (Google Search Grounding)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Search the live web with Gemini 3.8 Flash + Google Search to compare your app idea and Termux APK workflow against existing apps
            </p>
          </div>
        </div>

        <form onSubmit={handleRunWebSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter an app concept or competitor query to research on the web..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSearching ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Searching Web...</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                <span>Search Web &amp; Compare</span>
              </>
            )}
          </button>
        </form>

        {searchError && (
          <div className="p-3 rounded bg-red-950/40 border border-red-800 text-xs text-red-300">
            {searchError}
          </div>
        )}

        {liveAnalysis && (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-blue-400">
              Live Grounded Web Analysis
            </div>
            <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {liveAnalysis}
            </div>
          </div>
        )}

        {/* Comparison Matrix Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Application / Platform</th>
                <th className="py-2.5 px-3 font-semibold">Approach</th>
                <th className="py-2.5 px-3 font-semibold">Resource Footprint</th>
                <th className="py-2.5 px-3 font-semibold">Key Differences vs. Our App</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {BASELINE_COMPETITORS.map((comp, idx) => (
                <tr
                  key={comp.name}
                  className={
                    idx === 0
                      ? 'bg-blue-950/20 text-slate-100'
                      : 'hover:bg-slate-800/30 text-slate-300'
                  }
                >
                  <td className="py-3 px-3 font-semibold whitespace-nowrap">
                    {comp.name}
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {comp.category}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {comp.footprint}
                  </td>
                  <td className="py-3 px-3 leading-relaxed">{comp.keyDifference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grounding Web Sources */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 mb-2">
            Web Grounding Citations &amp; Verified Links
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {sources.map((src, i) => (
              <a
                key={`${src.uri}-${i}`}
                href={src.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
              >
                <span>{src.title}</span>
                <ExternalLink size={11} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
