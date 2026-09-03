import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book, Bookmark, Highlight, HighlightColor, ReaderSettings } from '../types';
import {
  loadPdfDocument,
  getPageText,
  PDFDocument,
  PDFPage,
} from '../services/pdfService';
import {
  getBookmarksForBook,
  addBookmark,
  deleteBookmark,
  getHighlightsForBook,
  saveHighlight,
  deleteHighlight,
  updateBookProgress,
  getSetting,
  saveSetting,
} from '../services/indexedDBService';
import { ReaderToolbar } from './ReaderToolbar';
import { PageFlipInteractive } from './PageFlipInteractive';
import { HighlightToolbar } from './HighlightToolbar';
import { HighlightDetailModal } from './HighlightDetailModal';
import { BookmarkDrawer } from './BookmarkDrawer';
import { HighlightDrawer } from './HighlightDrawer';
import { AiAssistantDrawer } from './AiAssistantDrawer';
import { Loader2, AlertCircle } from 'lucide-react';

interface BookReaderProps {
  book: Book;
  initialPage?: number;
  onBackToLibrary: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({
  book,
  initialPage = 1,
  onBackToLibrary,
}) => {
  const [doc, setDoc] = useState<PDFDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Settings
  const [settings, setSettings] = useState<ReaderSettings>({
    viewMode: 'auto',
    theme: 'paper',
    zoom: 1.15,
    fitMode: 'fit-page',
  });

  // Window width for responsive layout
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Annotations
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  // Text selection state
  const [selectionState, setSelectionState] = useState<{
    text: string;
    rects: any[];
    pageNumber: number;
    mousePosition: { x: number; y: number } | null;
  } | null>(null);

  // Active highlight clicked
  const [activeHighlight, setActiveHighlight] = useState<{
    highlight: Highlight;
    position: { x: number; y: number };
  } | null>(null);

  // Drawers
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiContextText, setAiContextText] = useState<string | undefined>(undefined);
  const [currentPageText, setCurrentPageText] = useState<string>('');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const readerContainerRef = useRef<HTMLDivElement | null>(null);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine if two-page view should be active
  const isTwoPage =
    settings.viewMode === 'double' ||
    (settings.viewMode === 'auto' && windowWidth >= 980);

  // Load PDF document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    async function init() {
      try {
        const loadedDoc = await loadPdfDocument(book.pdfBlob, book.id);
        if (isCancelled) return;
        setDoc(loadedDoc);

        // Load bookmarks & highlights
        const [loadedBookmarks, loadedHighlights, savedTheme] = await Promise.all([
          getBookmarksForBook(book.id),
          getHighlightsForBook(book.id),
          getSetting<'paper' | 'cream' | 'dark'>('reader_theme', 'paper'),
        ]);

        if (isCancelled) return;
        setBookmarks(loadedBookmarks);
        setHighlights(loadedHighlights);
        setSettings((prev) => ({ ...prev, theme: savedTheme }));
        setLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error loading PDF:', err);
          setError(err.message || 'Failed to load PDF document.');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
    };
  }, [book]);

  // Extract page text for AI when current page changes
  useEffect(() => {
    if (!doc) return;

    let isCancelled = false;
    async function extractText() {
      try {
        const page = await doc!.getPage(currentPage);
        const text = await getPageText(page);
        if (!isCancelled) {
          setCurrentPageText(text);
        }
      } catch (err) {
        console.warn('Could not extract text:', err);
      }
    }

    extractText();
    return () => {
      isCancelled = true;
    };
  }, [doc, currentPage]);

  // Persist reading progress to IndexedDB on page change
  const handlePageChange = useCallback(
    async (newPage: number) => {
      setCurrentPage(newPage);
      setSelectionState(null);
      setActiveHighlight(null);
      try {
        await updateBookProgress(book.id, newPage);
      } catch (err) {
        console.warn('Progress save notice:', err);
      }
    },
    [book.id]
  );

  // Update settings
  const handleUpdateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.theme) {
        saveSetting('reader_theme', newSettings.theme);
      }
      return updated;
    });
  };

  // Toggle Bookmark for current page
  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  const handleToggleBookmark = async () => {
    const existing = bookmarks.find((b) => b.pageNumber === currentPage);
    if (existing) {
      await deleteBookmark(existing.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
    } else {
      const newBm: Bookmark = {
        id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bookId: book.id,
        pageNumber: currentPage,
        createdAt: Date.now(),
      };
      await addBookmark(newBm);
      setBookmarks((prev) => [...prev, newBm]);
    }
  };

  // Text selection handler
  const handleTextSelected = (
    selectedText: string,
    rects: any[],
    pageNumber: number
  ) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectionState({
      text: selectedText,
      rects,
      pageNumber,
      mousePosition: {
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    });
  };

  // Apply new highlight
  const handleApplyHighlight = async (color: HighlightColor) => {
    if (!selectionState) return;

    const newHighlight: Highlight = {
      id: `hl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookId: book.id,
      pageNumber: selectionState.pageNumber,
      selectedText: selectionState.text,
      rects: selectionState.rects,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveHighlight(newHighlight);
    setHighlights((prev) => [...prev, newHighlight]);
    setSelectionState(null);

    // Clear window selection
    window.getSelection()?.removeAllRanges();
  };

  // Click on existing highlight
  const handleHighlightClick = (highlight: Highlight, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveHighlight({
      highlight,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  // Update existing highlight color
  const handleUpdateHighlightColor = async (id: string, color: HighlightColor) => {
    const target = highlights.find((h) => h.id === id);
    if (target) {
      const updated: Highlight = { ...target, color, updatedAt: Date.now() };
      await saveHighlight(updated);
      setHighlights((prev) => prev.map((h) => (h.id === id ? updated : h)));
      if (activeHighlight?.highlight.id === id) {
        setActiveHighlight({ ...activeHighlight, highlight: updated });
      }
    }
  };

  // Update existing highlight note
  const handleUpdateHighlightNote = async (id: string, note: string) => {
    const target = highlights.find((h) => h.id === id);
    if (target) {
      const updated: Highlight = { ...target, note: note.trim(), updatedAt: Date.now() };
      await saveHighlight(updated);
      setHighlights((prev) => prev.map((h) => (h.id === id ? updated : h)));
      if (activeHighlight?.highlight.id === id) {
        setActiveHighlight({ ...activeHighlight, highlight: updated });
      }
    }
  };

  // Delete highlight
  const handleDeleteHighlight = async (id: string) => {
    await deleteHighlight(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setActiveHighlight(null);
  };

  // Trigger Gemini AI with selected text
  const handleAskAi = (text: string) => {
    setAiContextText(text);
    setIsAiOpen(true);
    setSelectionState(null);
    setActiveHighlight(null);
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcut listener for B and F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleToggleBookmark();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'Escape') {
        setSelectionState(null);
        setActiveHighlight(null);
        setIsBookmarksOpen(false);
        setIsHighlightsOpen(false);
        setIsAiOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleBookmark]);

  // Dismiss toolbars on outside click
  const handleReaderClick = () => {
    if (selectionState) setSelectionState(null);
    if (activeHighlight) setActiveHighlight(null);
  };

  // Theme container background
  const getContainerBg = () => {
    switch (settings.theme) {
      case 'cream':
        return 'bg-[#f4efe4]';
      case 'dark':
        return 'bg-slate-950 text-slate-100';
      case 'paper':
      default:
        return 'bg-slate-200/50 text-slate-900';
    }
  };

  const progressPercent = doc ? Math.min(100, Math.round((currentPage / doc.numPages) * 100)) : 0;

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <h2 className="text-sm font-semibold text-slate-800">Opening "{book.name}"</h2>
        <p className="text-xs text-slate-500 font-mono mt-1">Preparing high-resolution book pages...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Could not open document
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">{error}</p>
        <button
          type="button"
          onClick={onBackToLibrary}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          Return to Bookshelf
        </button>
      </div>
    );
  }

  return (
    <div
      ref={readerContainerRef}
      onClick={handleReaderClick}
      className={`relative h-screen w-screen overflow-hidden flex flex-col ${getContainerBg()}`}
    >
      {/* Top Sleek Controls Toolbar */}
      <ReaderToolbar
        bookTitle={book.name}
        currentPage={currentPage}
        totalPages={doc.numPages}
        isTwoPage={isTwoPage}
        onToggleTwoPage={() =>
          handleUpdateSettings({
            viewMode: isTwoPage ? 'single' : 'double',
          })
        }
        isBookmarked={isCurrentPageBookmarked}
        onToggleBookmark={handleToggleBookmark}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        bookmarksCount={bookmarks.length}
        onOpenHighlights={() => setIsHighlightsOpen(true)}
        highlightsCount={highlights.length}
        onOpenAi={() => setIsAiOpen(true)}
        onBackToLibrary={onBackToLibrary}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Interactive Book Canvas & Stage */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex items-start justify-center p-2 sm:p-4 md:p-6 select-none">
        <PageFlipInteractive
          doc={doc}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isTwoPage={isTwoPage}
          scale={settings.zoom}
          theme={settings.theme}
          highlights={highlights}
          onHighlightClick={handleHighlightClick}
          onTextSelected={handleTextSelected}
        />

        {/* Floating Natural Turn Hint Pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/90 backdrop-blur-xs rounded-full border border-slate-200 flex items-center gap-2 text-[10px] text-slate-500 font-medium pointer-events-none uppercase tracking-widest z-10 animate-pulse">
          <span>Drag the page to move around when zoomed</span>
        </div>
      </div>

      {/* Sleek Reader Footer */}
      <footer className="h-12 bg-white border-t border-slate-200 flex items-center px-6 gap-6 z-20 shrink-0">
        <div className="flex-1 flex items-center gap-4">
          <span className="text-[11px] text-slate-400 font-medium w-8 font-mono">{progressPercent}%</span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <button
            type="button"
            onClick={() => handleUpdateSettings({ viewMode: 'single' })}
            className={`text-xs transition-colors ${
              !isTwoPage ? 'font-bold text-indigo-600' : 'hover:text-indigo-600'
            }`}
          >
            Single Page
          </button>
          <span className="h-3 w-px bg-slate-300" />
          <button
            type="button"
            onClick={() => handleUpdateSettings({ viewMode: 'double' })}
            className={`text-xs transition-colors ${
              isTwoPage ? 'font-bold text-indigo-600' : 'hover:text-indigo-600'
            }`}
          >
            Double Spread
          </button>
          <span className="h-3 w-px bg-slate-300" />
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1 hover:text-slate-900 transition-colors"
            title="Toggle Fullscreen"
          >
            ⛶
          </button>
        </div>
      </footer>

      {/* Floating Text Selection Toolbar */}
      {selectionState && (
        <HighlightToolbar
          selectedText={selectionState.text}
          position={selectionState.mousePosition}
          onApplyHighlight={handleApplyHighlight}
          onAskAi={handleAskAi}
          onClose={() => setSelectionState(null)}
        />
      )}

      {/* Highlight Details / Edit Modal */}
      {activeHighlight && (
        <HighlightDetailModal
          highlight={activeHighlight.highlight}
          position={activeHighlight.position}
          onUpdateColor={handleUpdateHighlightColor}
          onUpdateNote={handleUpdateHighlightNote}
          onDelete={handleDeleteHighlight}
          onAskAi={handleAskAi}
          onClose={() => setActiveHighlight(null)}
        />
      )}

      {/* Bookmarks Drawer */}
      <BookmarkDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        currentPage={currentPage}
        onJumpToPage={handlePageChange}
        onDeleteBookmark={async (id) => {
          await deleteBookmark(id);
          setBookmarks((prev) => prev.filter((b) => b.id !== id));
        }}
      />

      {/* Highlights Drawer */}
      <HighlightDrawer
        isOpen={isHighlightsOpen}
        onClose={() => setIsHighlightsOpen(false)}
        highlights={highlights}
        currentPage={currentPage}
        onJumpToPage={handlePageChange}
        onDeleteHighlight={handleDeleteHighlight}
      />

      {/* Gemini AI Reading Companion Drawer */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => {
          setIsAiOpen(false);
          setAiContextText(undefined);
        }}
        bookTitle={book.name}
        pageNumber={currentPage}
        pageText={currentPageText}
        activeContextText={aiContextText}
      />
    </div>
  );
};
