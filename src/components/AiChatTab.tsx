import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function AiChatTab() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your Termux Android build assistant. Ask me anything about compiling APKs with aapt, ecj, dx, and apksigner.',
    },
  ]);
  const [input, setInput] = useState('');
  const [modelType, setModelType] = useState<'flash' | 'pro' | 'lite'>('flash');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          modelType,
        }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.text || data.error || 'No response.' },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `Error: ${err?.message || 'Request failed'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">AI Build Assistant</h2>
        <select
          value={modelType}
          onChange={(e) => setModelType(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-200"
        >
          <option value="flash">Gemini 3.8 Flash</option>
          <option value="pro">Gemini 3.1 Pro</option>
          <option value="lite">Gemini 3.1 Flash Lite</option>
        </select>
      </div>
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg h-80 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={`inline-block p-3 rounded-lg text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin text-blue-400" />
            <span>Thinking...</span>
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about Termux or Android SDK..."
          className="flex-1 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-md text-xs text-slate-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Send size={14} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
