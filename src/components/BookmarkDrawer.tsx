import React from 'react';
import { Bookmark } from '../types';
import { Bookmark as BookmarkIcon, Trash2, X, ArrowRight } from 'lucide-react';

interface BookmarkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  currentPage: number;
  onJumpToPage: (pageNumber: number) => void;
  onDeleteBookmark: (id: string) => void;
}

export const BookmarkDrawer: React.FC<BookmarkDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  currentPage,
  onJumpToPage,
  onDeleteBookmark,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-200 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h3 className="text-sm font-semibold text-slate-900">
            Bookmarks ({bookmarks.length})
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

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {bookmarks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <BookmarkIcon className="w-8 h-8 mx-auto mb-2 opacity-30 stroke-1" />
            <p className="font-medium text-slate-600">No bookmarks saved yet</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Click the bookmark icon or press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">B</kbd> while reading to pin a page.
            </p>
          </div>
        ) : (
          bookmarks.map((bm) => {
            const isCurrent = bm.pageNumber === currentPage;
            return (
              <div
                key={bm.id}
                onClick={() => {
                  onJumpToPage(bm.pageNumber);
                  onClose();
                }}
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-50/70'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800">
                      Page {bm.pageNumber}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Pinned {new Date(bm.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBookmark(bm.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-opacity"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
