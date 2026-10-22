import React, { useState, useMemo } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';

export type SupportedSyntaxLanguage = 'bash' | 'java' | 'xml' | 'json';

interface CodeViewerProps {
  title: string;
  description?: string;
  code: string;
  language?: SupportedSyntaxLanguage;
  copyPayload?: string;
  copyLabel?: string;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  onCopyCallback?: (payload: string) => void;
}

export function detectCodeLanguage(
  title: string,
  code: string,
  explicitLang?: SupportedSyntaxLanguage
): SupportedSyntaxLanguage {
  if (explicitLang) return explicitLang;
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.endsWith('.java')) return 'java';
  if (lowerTitle.endsWith('.xml')) return 'xml';
  if (lowerTitle.endsWith('.json')) return 'json';
  if (lowerTitle.endsWith('.sh')) return 'bash';

  const trimmed = code.trim();
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<manifest') || trimmed.startsWith('<resources') || trimmed.startsWith('<LinearLayout')) {
    return 'xml';
  }
  if (trimmed.includes('public class ') || trimmed.startsWith('package ')) {
    return 'java';
  }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return 'json';
  }
  return 'bash';
}

export function highlightWithPrism(
  code: string,
  lang: SupportedSyntaxLanguage
): string {
  try {
    const prismKey = lang === 'xml' ? 'markup' : lang;
    const grammar = Prism.languages[prismKey] || Prism.languages.bash;
    return Prism.highlight(code, grammar, prismKey);
  } catch {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

export default function CodeViewer({
  title,
  description,
  code,
  language,
  copyPayload,
  copyLabel = 'Copy Command',
  defaultCollapsed = false,
  collapsible = false,
  onCopyCallback,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const detectedLang = useMemo(
    () => detectCodeLanguage(title, code, language),
    [title, code, language]
  );

  const highlightedLines = useMemo(() => {
    const html = highlightWithPrism(code, detectedLang);
    return html.split('\n');
  }, [code, detectedLang]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = copyPayload ?? code;
    navigator.clipboard.writeText(payload);
    if (onCopyCallback) {
      onCopyCallback(payload);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = highlightedLines.length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
      <div
        onClick={() => collapsible && setCollapsed(!collapsed)}
        className={`flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-800/80 ${
          collapsible
            ? 'cursor-pointer hover:bg-slate-800/40 transition-colors'
            : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {collapsible && (
              <span className="text-slate-400 shrink-0">
                {collapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </span>
            )}
            <h3 className="text-sm font-semibold text-slate-100 font-mono truncate">
              {title}
            </h3>
            <span className="text-xs text-slate-500 font-mono shrink-0">
              · {detectedLang.toUpperCase()} · {lineCount}{' '}
              {lineCount === 1 ? 'line' : 'lines'}
            </span>
          </div>
          {description && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>{copyLabel}</span>
            </>
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 bg-[#070a0f] overflow-x-auto max-h-96">
          <pre className="prism-code text-xs text-slate-200 font-mono leading-relaxed">
            <code>
              {highlightedLines.map((lineHtml, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/50">
                  <span className="table-cell pr-4 text-right text-slate-600 select-none w-8 font-mono">
                    {idx + 1}
                  </span>
                  <span
                    className="table-cell whitespace-pre"
                    dangerouslySetInnerHTML={{
                      __html: lineHtml || ' ',
                    }}
                  />
                </div>
              ))}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
