import React, { useState } from 'react';
import { Highlight, HighlightColor } from '../types';
import { Trash2, Sparkles, StickyNote, X } from 'lucide-react';

interface HighlightDetailModalProps {
  highlight: Highlight | null;
  position: { x: number; y: number } | null;
  onUpdateColor: (id: string, color: HighlightColor) => void;
  onUpdateNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
  onAskAi: (text: string) => void;
  onClose: () => void;
}

export const HighlightDetailModal: React.FC<HighlightDetailModalProps> = ({
  highlight,
  position,
  onUpdateColor,
  onUpdateNote,
  onDelete,
  onAskAi,
  onClose,
}) => {
  if (!highlight || !position) return null;

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(highlight.note || '');

  const handleSaveNote = () => {
    onUpdateNote(highlight.id, noteText);
    setIsEditingNote(false);
  };

  const clampedX = Math.max(16, Math.min(position.x - 140, window.innerWidth - 320));
  const clampedY = Math.max(70, Math.min(position.y + 10, window.innerHeight - 240));

  return (
    <div
      className="fixed z-50 w-72 bg-white rounded-xl border border-slate-200 p-3.5 text-slate-800 text-xs select-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${clampedX}px`,
        top: `${clampedY}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
          Highlight • Page {highlight.pageNumber}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 rounded-md p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-2 max-h-20 overflow-y-auto italic text-slate-600 pr-1 text-[11px] leading-relaxed border-l-2 pl-2 border-indigo-400">
        "{highlight.selectedText}"
      </div>

      {/* Note display or edit */}
      {isEditingNote ? (
        <div className="my-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add personal note to this highlight..."
            rows={2}
            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => setIsEditingNote(false)}
              className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-2.5 py-1 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
            >
              Save
            </button>
          </div>
        </div>
      ) : highlight.note ? (
        <div
          onClick={() => setIsEditingNote(true)}
          className="my-2 p-2 bg-amber-50/70 border border-amber-200/70 rounded-lg cursor-pointer hover:border-amber-300 text-[11px]"
        >
          <div className="font-medium text-amber-900 flex items-center gap-1 mb-0.5">
            <StickyNote className="w-3 h-3 text-amber-600" /> Note
          </div>
          <p className="text-amber-800">{highlight.note}</p>
        </div>
      ) : null}

      {/* Action controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {(['yellow', 'green', 'blue', 'pink'] as HighlightColor[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onUpdateColor(highlight.id, c)}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                highlight.color === c ? 'scale-125 ring-2 ring-indigo-500' : 'hover:scale-110 opacity-80'
              } ${
                c === 'yellow'
                  ? 'bg-amber-300'
                  : c === 'green'
                  ? 'bg-emerald-400'
                  : c === 'blue'
                  ? 'bg-indigo-400'
                  : 'bg-rose-400'
              }`}
            />
          ))}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-slate-400">
          {!isEditingNote && !highlight.note && (
            <button
              type="button"
              onClick={() => setIsEditingNote(true)}
              className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-md"
              title="Add Note"
            >
              <StickyNote className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onAskAi(highlight.selectedText)}
            className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
            title="Ask AI about this"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(highlight.id)}
            className="p-1 hover:text-red-600 hover:bg-red-50 rounded-md"
            title="Delete Highlight"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
