import React, { useState } from 'react';
import { ExternalLink, BookOpen, Terminal, FileCode } from 'lucide-react';
import CodeViewer from './CodeViewer';
import { ProjectConfig, ProjectFile } from '../types';
import { buildCompositeBootstrapScript } from '../data/featureIdeas';

interface SourceCodeTabProps {
  projectConfig: ProjectConfig;
  projectFiles: ProjectFile[];
}

const TECHNICAL_REFERENCES = [
  {
    title: 'Termux Official Package & Environment Wiki',
    category: 'Termux Runtime',
    url: 'https://wiki.termux.com/wiki/Main_Page',
    description:
      'Complete reference for Termux pkg management, storage permissions (termux-setup-storage), and prefix directory layout ($PREFIX).',
  },
  {
    title: 'Android Asset Packaging Tool (aapt / aapt2)',
    category: 'Android Build Toolchain',
    url: 'https://developer.android.com/tools/aapt2',
    description:
      'Documentation on compiling AndroidManifest.xml and res/ XML layouts into binary resources and generating R.java symbol tables.',
  },
  {
    title: 'Eclipse Compiler for Java (ecj) & Dalvik Executable (dx)',
    category: 'Java & DEX Compilation',
    url: 'https://source.android.com/docs/core/runtime/dalvik-bytecode',
    description:
      'Specification for compiling Java bytecode against android.jar and translating .class files into Dalvik classes.dex format.',
  },
  {
    title: 'Android APKSigner & Keytool Signing Pipeline',
    category: 'APK Cryptography',
    url: 'https://developer.android.com/tools/apksigner',
    description:
      'Official guide for generating RSA-2048 keystores via keytool and applying v1/v2/v3 APK signatures required by Android Package Installer.',
  },
  {
    title: 'Termux:API & Intent Bridge Specification',
    category: 'Device Integration',
    url: 'https://wiki.termux.com/wiki/Termux:API',
    description:
      'Documentation for termux-open, hardware sensor access, notifications, and invoking APK installers directly from the command line.',
  },
  {
    title: 'Google GenAI TypeScript SDK (@google/genai)',
    category: 'AI Code Synthesis',
    url: 'https://ai.google.dev/gemini-api/docs',
    description:
      'Official reference for Gemini 3.8 Flash, structured JSON schema code generation, and Google Search grounding.',
  },
];

export default function SourceCodeTab({
  projectConfig,
  projectFiles,
}: SourceCodeTabProps) {
  const [sourceGroup, setSourceGroup] = useState<'project' | 'pipeline'>('project');

  const setupShCode = `#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "Updating Termux repositories..."
pkg update && pkg upgrade -y

echo "Installing Android APK compilation toolchain..."
pkg install -y openjdk-17 aapt ecj dx apksigner termux-api

echo "Verifying installed tools..."
java -version
aapt version
apksigner --version
echo "Environment ready for APK compilation!"`;

  const compositeScript = buildCompositeBootstrapScript(projectFiles);

  return (
    <div className="space-y-6">
      {/* Header & Source Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Complete Source Code &amp; Technical References
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full inspectable source code for {projectConfig.name} ({projectConfig.packageName}), Termux shell pipelines, and official documentation references
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-md border border-slate-800">
          <button
            type="button"
            onClick={() => setSourceGroup('project')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              sourceGroup === 'project'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode size={14} />
            <span>Android Project Source ({projectFiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceGroup('pipeline')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              sourceGroup === 'pipeline'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal size={14} />
            <span>Termux Setup &amp; Composite Bootstrap</span>
          </button>
        </div>
      </div>

      {/* Source Code Viewers */}
      {sourceGroup === 'project' ? (
        <div className="space-y-4">
          {projectFiles.map((file) => (
            <CodeViewer
              key={file.path}
              title={file.path}
              description={file.description}
              code={file.content}
              copyLabel="Copy Source"
              collapsible={true}
              defaultCollapsed={false}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <CodeViewer
            title="termux/setup.sh"
            description="Complete Termux package installation and verification script."
            code={setupShCode}
            copyLabel="Copy setup.sh"
          />
          <CodeViewer
            title="bootstrap_project.sh"
            description="Single composite bash script that creates all directories and writes all project files via EOF heredocs."
            code={compositeScript}
            copyLabel="Copy Full Bootstrap"
          />
        </div>
      )}

      {/* All Technical References & Documentation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-blue-400" />
          <h3 className="text-base font-semibold text-slate-100">
            Toolchain &amp; Architecture References
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TECHNICAL_REFERENCES.map((ref) => (
            <a
              key={ref.url}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-md bg-slate-950/80 border border-slate-800 hover:border-blue-500/60 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {ref.title}
                  </h4>
                  <ExternalLink
                    size={14}
                    className="text-slate-500 group-hover:text-blue-400 shrink-0 mt-0.5"
                  />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{ref.category}</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {ref.description}
                </p>
              </div>
              <div className="text-xs font-mono text-blue-400/80 mt-3 truncate">
                {ref.url}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
