import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Code,
  Sparkles,
  ArrowUpRight,
  Check,
  Search,
  Loader2,
  Trash2,
  FolderCode,
} from 'lucide-react';
import {
  EXTENSIVE_FEATURE_IDEAS,
  FEATURE_CATEGORIES,
} from '../data/featureIdeas';
import { ChatMessage, FeatureIdea, ProjectConfig, ProjectFile } from '../types';

interface BrainstormTabProps {
  projectConfig: ProjectConfig;
  projectFiles: ProjectFile[];
  onUpdateFiles: (newFiles: ProjectFile[]) => void;
  onToggleIdea: (ideaTitle: string, forceAdd?: boolean) => void;
  onNavigateToExport: () => void;
}

const CHAT_ROLES = [
  {
    id: 'architect',
    label: 'Role: Principal Android & Termux Architect',
    instruction:
      'You are a Principal Android & Termux Systems Architect specializing in zero-Gradle APK builds using aapt, ecj, dx, and apksigner. Provide clean, modular Java and XML solutions.',
  },
  {
    id: 'debugger',
    label: 'Role: Build Pipeline & Shell Debugger',
    instruction:
      'You are a Senior Termux & Linux Shell Build Debugger. Focus on diagnosing aapt, ecj, dx, keytool, apksigner, and Android runtime permission issues with exact shell fixes.',
  },
  {
    id: 'ui-designer',
    label: 'Role: Android XML Layout & UX Specialist',
    instruction:
      'You are an Android Native XML Layout & UX Specialist. Design clean, high-contrast, responsive Android XML layouts (LinearLayout, ScrollView, ListView) using standard SDK widgets.',
  },
];

export default function BrainstormTab({
  projectConfig,
  projectFiles,
  onUpdateFiles,
  onToggleIdea,
  onNavigateToExport,
}: BrainstormTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modelType, setModelType] = useState<'flash' | 'lite' | 'pro'>('flash');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('architect');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Ready to brainstorm for **${projectConfig.name}** (\`${projectConfig.packageName}\`, API ${projectConfig.minSdk}–${projectConfig.targetSdk}).\n\nClick any **Feature Idea button** on the left to push it directly into this Gemini chat, or type your own custom concept below. When you're ready to turn our discussion into working Android Java/XML files, click **Create Code**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [activePushingId, setActivePushingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isGeneratingCode]);

  const filteredIdeas = EXTENSIVE_FEATURE_IDEAS.filter((idea) => {
    const matchesCategory =
      selectedCategory === 'All Categories' || idea.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sendChatPrompt = async (promptText: string, ideaTag?: string) => {
    if (!promptText.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ideaTag,
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsSending(true);

    try {
      const activeRole =
        CHAT_ROLES.find((r) => r.id === selectedRoleId) || CHAT_ROLES[0];

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          projectConfig: {
            appName: projectConfig.name,
            packageName: projectConfig.packageName,
            minSdk: projectConfig.minSdk,
            targetSdk: projectConfig.targetSdk,
          },
          modelType,
          systemRole: `${activeRole.instruction} Current Project: ${projectConfig.name} (${projectConfig.packageName}, minSdk ${projectConfig.minSdk}, targetSdk ${projectConfig.targetSdk}).`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gemini chat request failed.');
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Unable to reach Gemini right now: ${error?.message || 'Unknown error'}. You can still click "Create Code" or try sending again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
      setActivePushingId(null);
    }
  };

  // Clicking an Idea button pushes the idea directly into the Gemini chat
  const handlePushIdeaToChat = async (idea: FeatureIdea) => {
    setActivePushingId(idea.id);
    onToggleIdea(idea.title, true);
    const prompt = `Let's add "${idea.title}" (${idea.category}) to ${projectConfig.name} (${projectConfig.packageName}). ${idea.promptTemplate}`;
    await sendChatPrompt(prompt, idea.title);
  };

  const handleManualSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendChatPrompt(text);
  };

  const handleCreateCode = async () => {
    if (isGeneratingCode) return;
    setIsGeneratingCode(true);

    const recentContext = messages
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const currentFilesMap: Record<string, string> = {};
    projectFiles.forEach((f) => {
      currentFilesMap[f.path] = f.content;
    });

    try {
      const response = await fetch('/api/gemini/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            input.trim() ||
            `Generate working Android Java, XML, and build.sh code based on our brainstorming discussion:\n${recentContext}`,
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
        throw new Error(data.error || 'Failed to generate code.');
      }

      if (Array.isArray(data.files) && data.files.length > 0) {
        onUpdateFiles(data.files);
      }

      const codeMsg: ChatMessage = {
        id: `code-${Date.now()}`,
        role: 'assistant',
        content: data.summary || 'Generated updated Android project source files.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generatedCode: {
          summary: data.summary || 'Project files updated with brainstormed features.',
          snippet: data.snippet || '// Updated project files available in Exportable Files tab',
          filesUpdatedCount: Array.isArray(data.files) ? data.files.length : projectFiles.length,
        },
      };

      setMessages((prev) => [...prev, codeMsg]);
      if (input.trim()) setInput('');
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `code-err-${Date.now()}`,
          role: 'assistant',
          content: `Code generation encountered an issue: ${error?.message || 'Unknown error'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Extensive Feature Idea Buttons (5 cols on desktop) */}
      <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-col max-h-[780px]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Feature Idea Buttons ({EXTENSIVE_FEATURE_IDEAS.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any idea button to push it directly into the Gemini chat
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono shrink-0">
            {projectConfig.selectedIdeas.length} active
          </span>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 27+ Android & Termux feature ideas..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 border-b border-slate-800">
          {FEATURE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Interactive Feature Idea Buttons List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredIdeas.map((idea) => {
            const isSelected = projectConfig.selectedIdeas.includes(idea.title);
            const isPushing = activePushingId === idea.id && isSending;

            return (
              <button
                key={idea.id}
                type="button"
                disabled={isSending}
                onClick={() => handlePushIdeaToChat(idea)}
                className={`w-full text-left p-3 rounded-md border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-950/30 border-blue-500/50 hover:border-blue-400'
                    : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors truncate">
                        {idea.title}
                      </span>
                      {isSelected && (
                        <Check size={14} className="text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span>{idea.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span>Click to push to Gemini</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-blue-600/20 group-hover:bg-blue-600 text-blue-300 group-hover:text-white text-xs font-medium flex items-center gap-1 shrink-0 transition-colors whitespace-nowrap">
                    {isPushing ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Pushing...</span>
                      </>
                    ) : (
                      <>
                        <span>Push Idea</span>
                        <ArrowUpRight size={12} />
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {idea.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Gemini Brainstorming Chat + Create Code Action (7 cols on desktop) */}
      <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col h-[780px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Gemini Brainstorming & Code Studio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target: {projectConfig.name} · {projectConfig.packageName} · SDK {projectConfig.minSdk}–{projectConfig.targetSdk}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              aria-label="Select Chatbot Role"
              className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {CHAT_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>

            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as any)}
              aria-label="Select Gemini Model"
              className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="flash">gemini-3.5-flash (General)</option>
              <option value="pro">gemini-3.1-pro-preview (Complex)</option>
              <option value="lite">gemini-3.1-flash-lite (Fast)</option>
            </select>

            <button
              type="button"
              onClick={handleCreateCode}
              disabled={isGeneratingCode}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              {isGeneratingCode ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating Code...</span>
                </>
              ) : (
                <>
                  <Code size={14} />
                  <span>Create Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: `reset-${Date.now()}`,
                    role: 'assistant',
                    content: `Chat cleared. Click any Feature Idea button on the left to push it into the Gemini conversation.`,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ])
              }
              title="Clear Chat"
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Active Selected Ideas Strip */}
        {projectConfig.selectedIdeas.length > 0 && (
          <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400 truncate">
              <span className="font-medium text-slate-300">Active Ideas in Scope: </span>
              <span>{projectConfig.selectedIdeas.join(' · ')}</span>
            </div>
            <button
              type="button"
              onClick={() =>
                sendChatPrompt(
                  `How can we combine these features cleanly into ${projectConfig.name}: ${projectConfig.selectedIdeas.join(', ')}?`
                )
              }
              disabled={isSending}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              Synthesize All ({projectConfig.selectedIdeas.length})
            </button>
          </div>
        )}

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>{msg.role === 'user' ? 'You' : 'Gemini Architect'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{msg.timestamp}</span>
                {msg.ideaTag && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-blue-400 font-medium">
                      Pushed Idea: {msg.ideaTag}
                    </span>
                  </>
                )}
              </div>

              <div
                className={`max-w-[90%] rounded-lg p-3.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.generatedCode && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-emerald-400">
                        Updated {msg.generatedCode.filesUpdatedCount} Exportable Project Files
                      </span>
                      <button
                        type="button"
                        onClick={onNavigateToExport}
                        className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FolderCode size={13} />
                        <span>Open Exportable Files</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-[#070a0f] rounded border border-slate-800/80 text-xs text-emerald-400 font-mono overflow-x-auto max-h-60">
                      <code>{msg.generatedCode.snippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(isSending || isGeneratingCode) && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 w-fit">
              <Loader2 size={14} className="animate-spin text-blue-400" />
              <span>
                {isGeneratingCode
                  ? 'Gemini is compiling Java, XML, and build.sh files for your project...'
                  : 'Gemini is analyzing your feature idea...'}
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input & Create Code Bar */}
        <form
          onSubmit={handleManualSend}
          className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini about an idea, or click any Feature Idea button on the left..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Send size={14} />
              <span>Send to Gemini</span>
            </button>

            <button
              type="button"
              onClick={handleCreateCode}
              disabled={isGeneratingCode}
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Create Code</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
