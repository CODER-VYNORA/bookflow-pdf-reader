import React from 'react';
import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  Highlighter,
  Sparkles,
  BookOpen,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';
import { ReaderSettings } from '../types';

interface ReaderToolbarProps {
  bookTitle: string;
  currentPage: number;
  totalPages: number;
  isTwoPage: boolean;
  onToggleTwoPage: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onOpenBookmarks: () => void;
  bookmarksCount: number;
  onOpenHighlights: () => void;
  highlightsCount: number;
  onOpenAi: () => void;
  onBackToLibrary: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  bookTitle,
  currentPage,
  totalPages,
  isTwoPage,
  onToggleTwoPage,
  isBookmarked,
  onToggleBookmark,
  onOpenBookmarks,
  bookmarksCount,
  onOpenHighlights,
  highlightsCount,
  onOpenAi,
  onBackToLibrary,
  settings,
  onUpdateSettings,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const displayPageStr = isTwoPage
    ? currentPage === 1
      ? `Cover (1 of ${totalPages})`
      : `Pages ${currentPage % 2 === 0 ? currentPage : currentPage - 1}-${Math.min(
          (currentPage % 2 === 0 ? currentPage : currentPage - 1) + 1,
          totalPages
        )} of ${totalPages}`
    : `Page ${currentPage} of ${totalPages}`;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-30 select-none shrink-0">
      {/* Left: Back to library, title, and page pill */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onBackToLibrary}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors shrink-0"
          title="Back to Digital Bookshelf"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Bookshelf</span>
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0" />

        <div className="flex items-center gap-2.5 min-w-0">
          <h2
            className="font-medium text-slate-700 text-sm truncate max-w-[140px] sm:max-w-[220px] md:max-w-[340px]"
            title={bookTitle}
          >
            {bookTitle}
          </h2>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded font-medium shrink-0">
            {displayPageStr}
          </span>
        </div>
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Zoom Controls Pill */}
        <div className="flex items-center bg-slate-100 rounded-md p-1 mr-1 sm:mr-3">
          <button
            type="button"
            onClick={() => onUpdateSettings({ zoom: Math.max(0.75, settings.zoom - 0.1) })}
            className="px-2.5 py-1 text-sm text-slate-600 hover:bg-white rounded font-medium transition-all"
            title="Zoom Out"
          >
            -
          </button>
          <span className="px-2.5 text-xs font-medium text-slate-700 font-mono">
            {Math.round(settings.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onUpdateSettings({ zoom: Math.min(2.0, settings.zoom + 0.1) })}
            className="px-2.5 py-1 text-sm text-slate-600 hover:bg-white rounded font-medium transition-all"
            title="Zoom In"
          >
            +
          </button>
        </div>

        {/* View Mode Toggle (Single vs Two-Page Spread) */}
        <button
          type="button"
          onClick={onToggleTwoPage}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
          title="Toggle Book Spread / Single Page"
        >
          {isTwoPage ? <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> : <FileText className="w-3.5 h-3.5" />}
          <span>{isTwoPage ? 'Two Pages' : 'Single'}</span>
        </button>

        {/* Bookmark Current Page */}
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`p-2 hover:bg-slate-100 rounded-md transition-colors ${
            isBookmarked ? 'text-amber-600 bg-amber-50' : 'text-slate-600'
          }`}
          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Page (B)'}
        >
          <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
        </button>

        {/* View All Bookmarks */}
        <button
          type="button"
          onClick={onOpenBookmarks}
          className="relative p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
          title="All Bookmarks"
        >
          <BookmarkIcon className="w-4 h-4" />
          {bookmarksCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
          )}
        </button>

        {/* View All Highlights */}
        <button
          type="button"
          onClick={onOpenHighlights}
          className="relative p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
          title="Highlights & Notes"
        >
          <Highlighter className="w-4 h-4" />
          {highlightsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        {/* Gemini AI Companion */}
        <button
          type="button"
          onClick={onOpenAi}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
          title="Ask AI Reading Assistant"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        {/* Theme Settings */}
        <button
          type="button"
          onClick={() => {
            const themes: ('paper' | 'cream' | 'dark')[] = ['paper', 'cream', 'dark'];
            const next = themes[(themes.indexOf(settings.theme) + 1) % themes.length];
            onUpdateSettings({ theme: next });
          }}
          className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
          title={`Paper Tone: ${settings.theme}`}
        >
          {settings.theme === 'paper' ? (
            <Sun className="w-4 h-4" />
          ) : settings.theme === 'cream' ? (
            <Coffee className="w-4 h-4 text-amber-700" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors hidden sm:block"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
