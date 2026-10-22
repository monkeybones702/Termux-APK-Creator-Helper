import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  Plus,
  Loader2,
  RotateCcw,
  Download,
  FolderArchive,
  Eye,
  Edit3,
  FileCode,
} from 'lucide-react';
import { ProjectConfig, ProjectFile, CommandCategory } from '../types';
import {
  buildCompositeBootstrapScript,
  EXTENSIVE_FEATURE_IDEAS,
} from '../data/featureIdeas';
import CodeViewer from './CodeViewer';

interface ExportableFilesTabProps {
  projectConfig: ProjectConfig;
  projectFiles: ProjectFile[];
  onUpdateFiles: (newFiles: ProjectFile[]) => void;
  onResetFiles: () => void;
  onLogCommand?: (
    title: string,
    command: string,
    category?: CommandCategory
  ) => void;
  onOpenBlankScanner?: () => void;
}

const EXTRA_CODE_UPDATES = [
  {
    id: 'extra-prefs',
    label: 'Add SharedPreferences Persistence',
    detail: 'Auto-save & restore app state and counters in MainActivity',
    prompt:
      'Update MainActivity.java and activity_main.xml to persist user notes and click counters using Android SharedPreferences.',
  },
  {
    id: 'extra-shell',
    label: 'Add Termux Shell Executor View',
    detail: 'Run shell commands via ProcessBuilder & display stdout',
    prompt:
      'Update MainActivity.java and activity_main.xml to include an EditText command input, Run button, and scrollable monospace output view using ProcessBuilder.',
  },
  {
    id: 'extra-http',
    label: 'Add Async HTTP JSON Client',
    detail: 'Background thread HttpURLConnection + UI Handler',
    prompt:
      'Add an async HTTP GET helper using HttpURLConnection and Handler(Looper.getMainLooper()) in MainActivity.java and ensure INTERNET permission in AndroidManifest.xml.',
  },
  {
    id: 'extra-logcat',
    label: 'Add On-Device Logcat Reader',
    detail: 'Inspect live runtime logs directly inside the APK',
    prompt:
      'Add a button and scrollable view in MainActivity.java that executes "logcat -d -t 50" and displays runtime logs inside the app.',
  },
  {
    id: 'extra-clipboard',
    label: 'Add Clipboard & Share Intent',
    detail: 'Copy output to ClipboardManager & share via Android sheet',
    prompt:
      'Add ClipboardManager copy functionality and an Intent.ACTION_SEND share button to MainActivity.java and activity_main.xml.',
  },
  {
    id: 'extra-battery',
    label: 'Add Battery & Thermal Telemetry',
    detail: 'BroadcastReceiver reading voltage, % level, and °C',
    prompt:
      'Add an ACTION_BATTERY_CHANGED BroadcastReceiver in MainActivity.java and display live battery percentage, voltage, and temperature in activity_main.xml.',
  },
];

export default function ExportableFilesTab({
  projectConfig,
  projectFiles,
  onUpdateFiles,
  onResetFiles,
  onLogCommand,
  onOpenBlankScanner,
}: ExportableFilesTabProps) {
  const [selectedPath, setSelectedPath] = useState<string>(
    projectFiles[0]?.path || 'app/src/main/AndroidManifest.xml'
  );
  const [viewMode, setViewMode] = useState<'highlighted' | 'edit'>('highlighted');
  const [copiedSingle, setCopiedSingle] = useState<boolean>(false);
  const [copiedBootstrap, setCopiedBootstrap] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipExportSuccess, setZipExportSuccess] = useState<boolean>(false);
  const [customUpdatePrompt, setCustomUpdatePrompt] = useState<string>('');
  const [isUpdatingWithAi, setIsUpdatingWithAi] = useState<boolean>(false);
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [showNewFileInput, setShowNewFileInput] = useState<boolean>(false);

  const activeFile =
    projectFiles.find((f) => f.path === selectedPath) || projectFiles[0];

  const handleFileContentChange = (newContent: string) => {
    if (!activeFile) return;
    const updated = projectFiles.map((f) =>
      f.path === activeFile.path ? { ...f, content: newContent } : f
    );
    onUpdateFiles(updated);
  };

  const handleCopySingleFileCommand = () => {
    if (!activeFile) return;
    const lastSlash = activeFile.path.lastIndexOf('/');
    const dirCmd =
      lastSlash > 0
        ? `mkdir -p ${activeFile.path.substring(0, lastSlash)} && `
        : '';
    const cmd = `${dirCmd}cat << 'EOF' > ${activeFile.path}\n${activeFile.content}\nEOF`;
    navigator.clipboard.writeText(cmd);
    if (onLogCommand) {
      onLogCommand(`File: ${activeFile.path}`, cmd, 'file');
    }
    setCopiedSingle(true);
    setTimeout(() => setCopiedSingle(false), 2000);
  };

  const handleCopyAllBootstrap = () => {
    const script = buildCompositeBootstrapScript(projectFiles);
    navigator.clipboard.writeText(script);
    if (onLogCommand) {
      onLogCommand(
        `Bootstrap: ${projectConfig.name} (${projectFiles.length} files)`,
        script,
        'bootstrap'
      );
    }
    setCopiedBootstrap(true);
    setTimeout(() => setCopiedBootstrap(false), 2000);
  };

  const handleDownloadBootstrapScript = () => {
    const script = buildCompositeBootstrapScript(projectFiles);
    const blob = new Blob([script], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bootstrap-${projectConfig.name
      .toLowerCase()
      .replace(/\s+/g, '-')}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Batch Export All (.zip archive containing all generated source files + build.sh + setup.sh + README.md)
  const handleBatchExportZip = async () => {
    if (isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add every project file (AndroidManifest.xml, MainActivity.java, layouts, strings, build.sh, etc.)
      projectFiles.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Add setup.sh
      const setupScript = `#!/data/data/com.termux/files/usr/bin/bash
set -e
pkg update && pkg upgrade -y
pkg install -y openjdk-17 aapt ecj dx apksigner termux-api
echo "Termux APK toolchain installed!"
`;
      zip.file('setup.sh', setupScript);

      // Add composite bootstrap_all.sh
      const compositeScript = buildCompositeBootstrapScript(projectFiles);
      zip.file('bootstrap_all.sh', compositeScript);

      // Add README.md with instructions
      const readmeContent = `# ${projectConfig.name} (${projectConfig.packageName})

Generated by **APK Creator Helper for Termux**.

## Project Configuration
- **App Name:** ${projectConfig.name}
- **Package Name:** \`${projectConfig.packageName}\`
- **Min SDK:** ${projectConfig.minSdk}
- **Target SDK:** ${projectConfig.targetSdk}
- **Active Feature Ideas:** ${
        projectConfig.selectedIdeas.length > 0
          ? projectConfig.selectedIdeas.join(', ')
          : 'Standard Baseline Template'
      }

## Included Files (${projectFiles.length})
${projectFiles.map((f) => `- \`${f.path}\` — ${f.description}`).join('\n')}

## Quick-Start Compilation in Termux
\`\`\`bash
# 1. Install dependencies (first time only)
chmod +x setup.sh && ./setup.sh

# 2. Run the 6-stage APK build & installer script
chmod +x build.sh && ./build.sh
\`\`\`
`;
      zip.file('README.md', readmeContent);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const slug = projectConfig.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const archiveName = `${slug}-${projectConfig.packageName}-termux-apk.zip`;

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = archiveName;
      a.click();
      URL.revokeObjectURL(url);

      if (onLogCommand) {
        onLogCommand(
          `Batch ZIP Export: ${archiveName}`,
          `unzip ${archiveName} -d ~/apk-${slug} && cd ~/apk-${slug} && chmod +x build.sh && ./build.sh`,
          'bootstrap'
        );
      }

      setZipExportSuccess(true);
      setStatusMessage(
        `Exported ${projectFiles.length} project files + build.sh into ${archiveName}`
      );
      setTimeout(() => setZipExportSuccess(false), 2500);
    } catch (error: any) {
      setStatusMessage(
        `ZIP export failed: ${error?.message || 'Unknown error'}`
      );
    } finally {
      setIsZipping(false);
    }
  };

  const handleAddNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPath = newFileName.trim();
    if (!cleanPath) return;
    if (projectFiles.some((f) => f.path === cleanPath)) {
      setSelectedPath(cleanPath);
      setShowNewFileInput(false);
      setNewFileName('');
      return;
    }
    const newFile: ProjectFile = {
      path: cleanPath,
      description: 'Custom project file added by developer.',
      content: cleanPath.endsWith('.java')
        ? `package ${projectConfig.packageName};\n\npublic class CustomHelper {\n    // Add helper methods here\n}\n`
        : `# ${cleanPath}\n`,
    };
    onUpdateFiles([...projectFiles, newFile]);
    setSelectedPath(cleanPath);
    setNewFileName('');
    setShowNewFileInput(false);
  };

  const triggerGeminiFileEnhancement = async (
    promptText: string,
    ideaId?: string
  ) => {
    if (!promptText.trim() || isUpdatingWithAi) return;
    setIsUpdatingWithAi(true);
    setActiveIdeaId(ideaId || 'custom');
    setStatusMessage('Gemini is updating your exportable project files...');

    const currentFilesMap: Record<string, string> = {};
    projectFiles.forEach((f) => {
      currentFilesMap[f.path] = f.content;
    });

    try {
      const response = await fetch('/api/gemini/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          projectConfig: {
            appName: projectConfig.name,
            packageName: projectConfig.packageName,
            minSdk: projectConfig.minSdk,
            targetSdk: projectConfig.targetSdk,
          },
          selectedIdeas: projectConfig.selectedIdeas,
          currentFiles: currentFilesMap,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update files.');
      }

      if (Array.isArray(data.files) && data.files.length > 0) {
        onUpdateFiles(data.files);
        setStatusMessage(
          data.summary || 'Exportable files updated with new code!'
        );
      }
      if (ideaId === 'custom') {
        setCustomUpdatePrompt('');
      }
    } catch (error: any) {
      setStatusMessage(`Update failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingWithAi(false);
      setActiveIdeaId(null);
    }
  };

  const singleFileHeredoc = activeFile
    ? (() => {
        const lastSlash = activeFile.path.lastIndexOf('/');
        const dirCmd =
          lastSlash > 0
            ? `mkdir -p ${activeFile.path.substring(0, lastSlash)} && `
            : '';
        return `${dirCmd}cat << 'EOF' > ${activeFile.path}\n${activeFile.content}\nEOF`;
      })()
    : '';

  return (
    <div className="space-y-6">
      {/* Top Action Bar with Batch Export All (.zip) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Exportable Project Files &amp; Batch Archive Exporter
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect with Prism.js syntax highlighting, edit source code, or batch export all {projectFiles.length} files + build.sh as a ZIP archive
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenBlankScanner && (
            <button
              type="button"
              onClick={onOpenBlankScanner}
              className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileCode size={14} />
              <span>Blank Template &amp; Scanner</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetFiles}
            className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Templates</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBootstrapScript}
            className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download size={14} />
            <span>Download .sh</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAllBootstrap}
            className="px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            {copiedBootstrap ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Copied Bootstrap</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy All Heredoc</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBatchExportZip}
            disabled={isZipping}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            {isZipping ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Packaging ZIP...</span>
              </>
            ) : zipExportSuccess ? (
              <>
                <Check size={14} />
                <span>Exported Project .ZIP!</span>
              </>
            ) : (
              <>
                <FolderArchive size={14} />
                <span>Batch Export All (.ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Extra Ideas to Add More Code or Update Files */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Extra Ideas to Add More Code or Update Files
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any module button below to have Gemini automatically inject working Java/XML code into your files
            </p>
          </div>
          {statusMessage && (
            <span className="text-xs text-emerald-400 font-medium">
              {statusMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {EXTRA_CODE_UPDATES.map((item) => {
            const isRunning = isUpdatingWithAi && activeIdeaId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isUpdatingWithAi}
                onClick={() =>
                  triggerGeminiFileEnhancement(item.prompt, item.id)
                }
                className="p-3 rounded-md bg-slate-950/80 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-800/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 transition-colors truncate">
                    {item.label}
                  </span>
                  {isRunning ? (
                    <Loader2
                      size={13}
                      className="animate-spin text-blue-400 shrink-0"
                    />
                  ) : (
                    <Sparkles
                      size={13}
                      className="text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors"
                    />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {item.detail}
                </p>
              </button>
            );
          })}
        </div>

        {/* Brainstormed Ideas Quick Injection */}
        {projectConfig.selectedIdeas.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 mb-2">
              Your Brainstormed Ideas (click to weave directly into project files):
            </div>
            <div className="flex flex-wrap gap-2">
              {projectConfig.selectedIdeas.map((ideaTitle) => {
                const matched = EXTENSIVE_FEATURE_IDEAS.find(
                  (i) => i.title === ideaTitle
                );
                return (
                  <button
                    key={ideaTitle}
                    type="button"
                    disabled={isUpdatingWithAi}
                    onClick={() =>
                      triggerGeminiFileEnhancement(
                        matched
                          ? `Integrate "${matched.title}": ${matched.codeEnhancementHint}`
                          : `Integrate feature "${ideaTitle}" into MainActivity.java and activity_main.xml.`,
                        ideaTitle
                      )
                    }
                    className="px-3 py-1.5 rounded bg-blue-950/40 border border-blue-500/40 hover:border-blue-400 text-xs text-blue-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles size={12} />
                    <span>Inject: {ideaTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom AI File Update Prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            triggerGeminiFileEnhancement(customUpdatePrompt, 'custom');
          }}
          className="flex flex-col sm:flex-row gap-2 pt-2"
        >
          <input
            type="text"
            value={customUpdatePrompt}
            onChange={(e) => setCustomUpdatePrompt(e.target.value)}
            placeholder="Describe any custom feature, UI layout change, or new Java method to add to your files..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isUpdatingWithAi || !customUpdatePrompt.trim()}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isUpdatingWithAi && activeIdeaId === 'custom' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Updating Files...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Update Files with Gemini</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* File Explorer + Syntax-Highlighted Viewer / Live Source Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Project Files List */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Project Workspace Files ({projectFiles.length})
            </span>
            <button
              type="button"
              onClick={() => setShowNewFileInput(!showNewFileInput)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <Plus size={13} />
              <span>Add File</span>
            </button>
          </div>

          {showNewFileInput && (
            <form onSubmit={handleAddNewFile} className="flex gap-1.5 mb-2">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="app/src/main/java/.../Helper.java"
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded bg-blue-600 text-white text-xs font-medium cursor-pointer"
              >
                Add
              </button>
            </form>
          )}

          <div className="space-y-1.5">
            {projectFiles.map((file) => {
              const isSelected = activeFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/60 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <FileText
                    size={15}
                    className={`mt-0.5 shrink-0 ${
                      isSelected ? 'text-blue-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono font-medium truncate">
                      {file.path}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {file.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Toggle between Prism.js Highlighted CodeViewer and Raw Editor */}
        <div className="lg:col-span-8 space-y-3">
          {activeFile && (
            <>
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('highlighted')}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      viewMode === 'highlighted'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Syntax Highlighted (Prism.js)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      viewMode === 'edit'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Edit3 size={13} />
                    <span>Edit Source Code</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopySingleFileCommand}
                  className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedSingle ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span>Copied Heredoc</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy File Command</span>
                    </>
                  )}
                </button>
              </div>

              {viewMode === 'highlighted' ? (
                <CodeViewer
                  title={activeFile.path}
                  description={activeFile.description}
                  code={activeFile.content}
                  copyPayload={singleFileHeredoc}
                  copyLabel="Copy File Command (cat << 'EOF')"
                  onCopyCallback={(payload) => {
                    if (onLogCommand) {
                      onLogCommand(`File: ${activeFile.path}`, payload, 'file');
                    }
                  }}
                />
              ) : (
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-slate-200">
                      Editing: {activeFile.path}
                    </span>
                    <span className="text-xs text-slate-500">
                      Changes auto-sync to Bootstrap &amp; ZIP export
                    </span>
                  </div>
                  <div className="p-4 bg-[#070a0f]">
                    <textarea
                      value={activeFile.content}
                      onChange={(e) => handleFileContentChange(e.target.value)}
                      rows={22}
                      spellCheck={false}
                      className="w-full bg-transparent text-xs text-emerald-400 font-mono leading-relaxed focus:outline-none resize-y"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
