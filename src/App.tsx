import React, { useState, useEffect, useCallback } from 'react';
import { Book, Bookmark, Highlight } from './types';
import {
  getAllBooks,
  getBookmarksForBook,
  getHighlightsForBook,
} from './services/indexedDBService';
import { Library } from './components/Library';
import { BookReader } from './components/BookReader';
import { PdfUploader } from './components/PdfUploader';
import {
  BookOpen,
  Clock,
  Bookmark as BookmarkIcon,
  Highlighter,
  Upload,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeStartPage, setActiveStartPage] = useState<number>(1);
  const [currentTab, setCurrentTab] = useState<'bookshelf' | 'recent' | 'bookmarks' | 'highlights'>('bookshelf');
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [allBookmarks, setAllBookmarks] = useState<{ bookmark: Bookmark; bookTitle: string }[]>([]);
  const [allHighlights, setAllHighlights] = useState<{ highlight: Highlight; bookTitle: string }[]>([]);
  const [storage, setStorage] = useState<{ used: number; quota: number } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Load books from IndexedDB
  const refreshBooks = useCallback(async () => {
    try {
      const loaded = await getAllBooks();
      setBooks(loaded);

      // Collect bookmarks and highlights across all books for the sidebar tabs
      const bms: { bookmark: Bookmark; bookTitle: string }[] = [];
      const hls: { highlight: Highlight; bookTitle: string }[] = [];

      for (const b of loaded) {
        const [bookBms, bookHls] = await Promise.all([
          getBookmarksForBook(b.id),
          getHighlightsForBook(b.id),
        ]);
        bookBms.forEach((bm) => bms.push({ bookmark: bm, bookTitle: b.name }));
        bookHls.forEach((hl) => hls.push({ highlight: hl, bookTitle: b.name }));
      }

      setAllBookmarks(bms);
      setAllHighlights(hls);
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  useEffect(() => {
    const updateStorage = async () => {
      try {
        if (navigator.storage?.estimate) {
          const estimate = await navigator.storage.estimate();
          setStorage({ used: estimate.usage || 0, quota: estimate.quota || 0 });
        }
      } catch {
        // Storage estimates are optional browser APIs.
      }
    };
    updateStorage();
    const onInstalled = () => setInstallPrompt(null);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleOpenBook = (book: Book, startPage?: number) => {
    setActiveBook(book);
    setActiveStartPage(startPage || book.lastReadPage || 1);
  };

  const handleBackToLibrary = () => {
    setActiveBook(null);
    refreshBooks();
  };

  const usedMB = ((storage?.used || books.reduce((acc, b) => acc + (b.fileSize || 0), 0)) / (1024 * 1024)).toFixed(1);
  const quotaMB = storage?.quota ? storage.quota / (1024 * 1024) : 0;
  const storagePercent = quotaMB ? Math.min(100, ((storage?.used || 0) / storage.quota) * 100) : 0;

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            B
          </div>
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your digital library...</p>
        </div>
      </div>
    );
  }

  // Active Reader View
  if (activeBook) {
    return (
      <div className="h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
        <BookReader
          book={activeBook}
          initialPage={activeStartPage}
          onBackToLibrary={handleBackToLibrary}
        />
      </div>
    );
  }

  // Filter books based on active tab
  let displayedBooks = books;
  if (currentTab === 'recent') {
    displayedBooks = [...books].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sleek Interface Aside Navigation Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 select-none z-10">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-base">
            B
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">BookFlow</h1>
            <span className="text-[10px] text-slate-400 font-medium">PDF Reader</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Library
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('bookshelf')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'bookshelf'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-base">📚</span>
            <span>My Bookshelf</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
              {books.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('recent')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'recent'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-base">🕒</span>
            <span>Recently Read</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('bookmarks')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'bookmarks'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-base">🔖</span>
            <span>Bookmarks</span>
            {allBookmarks.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono">
                {allBookmarks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('highlights')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'highlights'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-base">🖋️</span>
            <span>Highlights</span>
            {allHighlights.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono">
                {allHighlights.length}
              </span>
            )}
          </button>

          {/* Local Storage Indicator */}
          <div className="pt-6">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Local Storage
            </div>
            <div className="px-3 py-2">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-[10px] mt-2 text-slate-500 font-mono">
                {usedMB} MB used{quotaMB ? ` • ${(quotaMB / 1024).toFixed(1)} GB browser quota` : ''}
              </p>
            </div>
          </div>
        </nav>

        {/* Upload Button at bottom of sidebar */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {installPrompt && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="w-full py-2 bg-white text-slate-800 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 text-sm transition-colors"
            >
              Install BookFlow App
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF</span>
          </button>
        </div>
      </aside>

      {/* Compact mobile navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 p-2 pwa-safe-bottom flex justify-around">
        {([
          ['bookshelf', '📚', 'Books'],
          ['recent', '🕒', 'Recent'],
          ['bookmarks', '🔖', 'Marks'],
          ['highlights', '🖋️', 'Highlights'],
        ] as const).map(([tab, icon, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setCurrentTab(tab)}
            className={`min-w-16 px-2 py-1.5 rounded-lg text-[10px] font-medium flex flex-col items-center gap-0.5 ${currentTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </button>
        ))}
        {installPrompt && (
          <button
            type="button"
            onClick={handleInstallApp}
            className="min-w-16 px-2 py-1.5 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-0.5 text-indigo-700 bg-indigo-50"
          >
            <span className="text-base leading-none">⬇️</span>
            Install
          </button>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 pb-16 md:pb-0">
        {/* Render Bookshelf or Bookmarks or Highlights tab */}
        {currentTab === 'bookmarks' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <BookmarkIcon className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Saved Bookmarks</h2>
                  <p className="text-xs text-slate-500">All pinned book pages across your library</p>
                </div>
              </div>

              {allBookmarks.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <BookmarkIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No bookmarks created yet</p>
                  <p className="text-xs text-slate-400 mt-1">Open any book and press B or click the bookmark ribbon.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allBookmarks.map(({ bookmark, bookTitle }) => {
                    const parentBook = books.find((b) => b.id === bookmark.bookId);
                    return (
                      <div
                        key={bookmark.id}
                        onClick={() => parentBook && handleOpenBook(parentBook, bookmark.pageNumber)}
                        className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300  transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600">Page {bookmark.pageNumber}</span>
                            <span className="text-xs text-slate-700 font-medium truncate max-w-[180px]">
                              {bookTitle}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            Saved {new Date(bookmark.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-xs text-indigo-600 font-medium">Read →</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : currentTab === 'highlights' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Highlighter className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Saved Highlights</h2>
                  <p className="text-xs text-slate-500">Passages and annotations saved across your reading</p>
                </div>
              </div>

              {allHighlights.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <Highlighter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No highlights created yet</p>
                  <p className="text-xs text-slate-400 mt-1">Select text while reading a book to highlight and take notes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allHighlights.map(({ highlight, bookTitle }) => {
                    const parentBook = books.find((b) => b.id === highlight.bookId);
                    return (
                      <div
                        key={highlight.id}
                        onClick={() => parentBook && handleOpenBook(parentBook, highlight.pageNumber)}
                        className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300  transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-800 truncate">{bookTitle}</span>
                          <span className="text-xs text-indigo-600 font-medium">Page {highlight.pageNumber} →</span>
                        </div>
                        <p className="text-xs text-slate-600 italic border-l-2 border-indigo-400 pl-2">
                          "{highlight.selectedText}"
                        </p>
                        {highlight.note && (
                          <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg mt-2">
                            Note: {highlight.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <Library
            books={displayedBooks}
            onOpenBook={handleOpenBook}
            onRefreshBooks={refreshBooks}
            showUploader={showUploader}
            onCloseUploader={() => setShowUploader(false)}
            onOpenUploader={() => setShowUploader(true)}
          />
        )}
      </main>
    </div>
  );
}
