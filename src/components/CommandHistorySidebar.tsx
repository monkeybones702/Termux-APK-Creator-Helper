import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Pin,
  Trash2,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Wrench,
  Search,
} from 'lucide-react';
import { CommandCategory, CommandHistoryEntry } from '../types';

interface CommandHistorySidebarProps {
  history: CommandHistoryEntry[];
  onCopyEntry: (entry: CommandHistoryEntry) => void;
  onTogglePin: (id: string) => void;
  onDeleteEntry: (id: string) => void;
  onClearUnpinned: () => void;
  onSnapshotCurrentProject: () => void;
  onOpenTipsModal: () => void;
}

const CATEGORY_FILTERS: { id: 'all' | CommandCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bootstrap', label: 'Bootstrap' },
  { id: 'file', label: 'Files' },
  { id: 'setup', label: 'Setup' },
  { id: 'troubleshoot', label: 'Fixes' },
];

export default function CommandHistorySidebar({
  history,
  onCopyEntry,
  onTogglePin,
  onDeleteEntry,
  onClearUnpinned,
  onSnapshotCurrentProject,
  onOpenTipsModal,
}: CommandHistorySidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | CommandCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedHistory = [...history].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const filteredHistory = sortedHistory.filter((item) => {
    const matchesCat =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.command.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (entry: CommandHistoryEntry) => {
    navigator.clipboard.writeText(entry.command);
    onCopyEntry(entry);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <aside className="w-full xl:w-80 shrink-0 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col max-h-[840px]">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal size={16} className="text-blue-400 shrink-0" />
            <h2 className="text-sm font-semibold text-slate-100 truncate">
              Command History Log ({history.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenTipsModal}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Wrench size={12} />
            <span>Termux Tips</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Persistent terminal log. Re-copy any previously generated bootstrap script, individual file heredoc, or troubleshooting fix.
        </p>

        {/* Quick Actions: Snapshot Current Project & Clear */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSnapshotCurrentProject}
            className="flex-1 px-3 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <PlusCircle size={13} />
            <span>Snapshot Bootstrap</span>
          </button>

          <button
            type="button"
            onClick={onClearUnpinned}
            title="Clear unpinned history"
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
          >
            Clear
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recent commands..."
            className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Command Log Entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-2">
            <p>No matching commands in history.</p>
            <button
              type="button"
              onClick={onSnapshotCurrentProject}
              className="text-blue-400 hover:underline font-medium cursor-pointer"
            >
              Log current project bootstrap
            </button>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isCopied = copiedId === item.id;
            const isExpanded = expandedId === item.id;
            const lineCount = item.command.split('\n').length;

            return (
              <div
                key={item.id}
                className={`rounded-md border p-3 transition-colors ${
                  item.pinned
                    ? 'bg-blue-950/20 border-blue-500/50'
                    : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item.id)
                    }
                    className="min-w-0 flex-1 text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 shrink-0">
                        {isExpanded ? (
                          <ChevronDown size={13} />
                        ) : (
                          <ChevronRight size={13} />
                        )}
                      </span>
                      <span className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 pl-4 truncate">
                      <span>{item.projectName}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono">{formatTime(item.timestamp)}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono">{lineCount}L</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onTogglePin(item.id)}
                      title={item.pinned ? 'Unpin command' : 'Pin command'}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        item.pinned
                          ? 'text-blue-400 bg-blue-950/50'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Pin size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {isCopied ? (
                        <>
                          <Check size={11} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteEntry(item.id)}
                      title="Remove from history"
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Single-line preview when collapsed, full pre block when expanded */}
                {!isExpanded ? (
                  <div
                    onClick={() => setExpandedId(item.id)}
                    className="mt-2 px-2 py-1 rounded bg-[#070a0f] border border-slate-800/70 text-xs text-emerald-400/90 font-mono truncate cursor-pointer"
                  >
                    {item.command.split('\n')[0]}
                  </div>
                ) : (
                  <pre className="mt-2 p-2.5 rounded bg-[#070a0f] border border-slate-800 text-xs text-emerald-400 font-mono overflow-x-auto max-h-56 leading-relaxed">
                    <code>{item.command}</code>
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
