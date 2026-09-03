import React from 'react';
import { HighlightColor } from '../types';
import { Sparkles, Copy, Check } from 'lucide-react';

interface HighlightToolbarProps {
  selectedText: string;
  position: { x: number; y: number } | null;
  onApplyHighlight: (color: HighlightColor) => void;
  onAskAi: (text: string) => void;
  onClose: () => void;
}

export const HighlightToolbar: React.FC<HighlightToolbarProps> = ({
  selectedText,
  position,
  onApplyHighlight,
  onAskAi,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!position) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Keep inside viewport bounds
  const clampedX = Math.max(16, Math.min(position.x - 120, window.innerWidth - 260));
  const clampedY = Math.max(70, position.y - 50);

  return (
    <div
      className="fixed z-50 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 text-white rounded-full border border-slate-700 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none"
      style={{
        left: `${clampedX}px`,
        top: `${clampedY}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Color buttons */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700">
        <button
          type="button"
          onClick={() => onApplyHighlight('yellow')}
          className="w-4.5 h-4.5 rounded-full bg-amber-300 hover:scale-115 transition-transform border border-slate-700"
          title="Highlight Amber"
        />
        <button
          type="button"
          onClick={() => onApplyHighlight('green')}
          className="w-4.5 h-4.5 rounded-full bg-emerald-400 hover:scale-115 transition-transform border border-slate-700"
          title="Highlight Green"
        />
        <button
          type="button"
          onClick={() => onApplyHighlight('blue')}
          className="w-4.5 h-4.5 rounded-full bg-indigo-400 hover:scale-115 transition-transform border border-slate-700"
          title="Highlight Indigo"
        />
        <button
          type="button"
          onClick={() => onApplyHighlight('pink')}
          className="w-4.5 h-4.5 rounded-full bg-rose-400 hover:scale-115 transition-transform border border-slate-700"
          title="Highlight Rose"
        />
      </div>

      {/* Ask AI Button */}
      <button
        type="button"
        onClick={() => onAskAi(selectedText)}
        className="flex items-center gap-1 text-xs px-2 py-1 hover:bg-slate-800 rounded-full text-indigo-300 hover:text-white transition-colors"
        title="Explain or summarize passage with Gemini AI"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[11px] font-medium">Ask AI</span>
      </button>

      {/* Copy text */}
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        title="Copy text"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* Dismiss */}
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-white text-xs px-1 hover:bg-slate-800 rounded-full transition-colors"
      >
        ×
      </button>
    </div>
  );
};
