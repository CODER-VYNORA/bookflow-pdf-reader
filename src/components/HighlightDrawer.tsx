import React, { useState } from 'react';
import { Highlight, HighlightColor } from '../types';
import { Highlighter, Trash2, X, ArrowRight, StickyNote, Search } from 'lucide-react';

interface HighlightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: Highlight[];
  currentPage: number;
  onJumpToPage: (pageNumber: number) => void;
  onDeleteHighlight: (id: string) => void;
}

export const HighlightDrawer: React.FC<HighlightDrawerProps> = ({
  isOpen,
  onClose,
  highlights,
  currentPage,
  onJumpToPage,
  onDeleteHighlight,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState<HighlightColor | 'all'>('all');

  if (!isOpen) return null;

  const filteredHighlights = highlights.filter((h) => {
    const matchesColor = filterColor === 'all' || h.color === filterColor;
    const matchesSearch =
      !searchQuery ||
      h.selectedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.note && h.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesColor && matchesSearch;
  });

  const getColorDotClass = (color: HighlightColor) => {
    switch (color) {
      case 'yellow':
        return 'bg-amber-300';
      case 'green':
        return 'bg-emerald-400';
      case 'blue':
        return 'bg-indigo-400';
      case 'pink':
        return 'bg-rose-400';
    }
  };

  return (
    <div
      className="fixed inset-y-0 right-0 w-88 max-w-[90vw] bg-white border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <Highlighter className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Highlights & Notes ({highlights.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="p-3.5 border-b border-slate-100 space-y-2 shrink-0 bg-slate-50/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search highlights & notes..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Color filter chips */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => setFilterColor('all')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-full border transition-colors ${
              filterColor === 'all'
                ? 'bg-slate-900 text-white border-transparent'
                : 'text-slate-500 border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            All
          </button>
          {(['yellow', 'green', 'blue', 'pink'] as HighlightColor[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterColor(c)}
              className={`w-4 h-4 rounded-full transition-all ${getColorDotClass(c)} ${
                filterColor === c ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
              }`}
              title={`Filter ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Highlights List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredHighlights.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-30 stroke-1" />
            <p className="font-medium text-slate-600">No highlights found</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Drag your cursor or finger across any text in the book to create a highlight.
            </p>
          </div>
        ) : (
          filteredHighlights.map((hl) => {
            const isCurrent = hl.pageNumber === currentPage;
            return (
              <div
                key={hl.id}
                onClick={() => {
                  onJumpToPage(hl.pageNumber);
                  onClose();
                }}
                className={`group p-3 rounded-lg border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-indigo-400 bg-indigo-50/40'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${getColorDotClass(hl.color)}`} />
                    <span className="font-semibold text-xs text-slate-800">
                      Page {hl.pageNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHighlight(hl.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-sm transition-opacity"
                      title="Delete highlight"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Highlighted text snippet */}
                <p className="text-xs text-slate-600 line-clamp-3 italic leading-relaxed pl-2 border-l-2 border-indigo-400">
                  "{hl.selectedText}"
                </p>

                {/* Attached note if any */}
                {hl.note && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-amber-800">
                    <StickyNote className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                    <p className="line-clamp-2">{hl.note}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
