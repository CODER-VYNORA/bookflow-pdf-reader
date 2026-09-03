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

import IntroVideo from './components/IntroVideo';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeStartPage, setActiveStartPage] = useState<number>(1);

  const [currentTab, setCurrentTab] = useState<
    'bookshelf' | 'recent' | 'bookmarks' | 'highlights'
  >('bookshelf');

  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  const [allBookmarks, setAllBookmarks] = useState<
    { bookmark: Bookmark; bookTitle: string }[]
  >([]);

  const [allHighlights, setAllHighlights] = useState<
    { highlight: Highlight; bookTitle: string }[]
  >([]);

  const [storage, setStorage] = useState<{
    used: number;
    quota: number;
  } | null>(null);

  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Intro video state
  const [showIntro, setShowIntro] = useState(true);

  /**
   * Load all books, bookmarks and highlights
   */
  const refreshBooks = useCallback(async () => {
    try {
      setLoading(true);

      const loadedBooks = await getAllBooks();
      setBooks(loadedBooks);

      const bookmarks: {
        bookmark: Bookmark;
        bookTitle: string;
      }[] = [];

      const highlights: {
        highlight: Highlight;
        bookTitle: string;
      }[] = [];

      for (const book of loadedBooks) {
        const bookBookmarks = await getBookmarksForBook(book.id);

        bookBookmarks.forEach((bookmark) => {
          bookmarks.push({
            bookmark,
            bookTitle: book.title,
          });
        });

        const bookHighlights = await getHighlightsForBook(book.id);

        bookHighlights.forEach((highlight) => {
          highlights.push({
            highlight,
            bookTitle: book.title,
          });
        });
      }

      setAllBookmarks(bookmarks);
      setAllHighlights(highlights);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load books on app start
   */
  useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  /**
   * Check browser storage
   */
  useEffect(() => {
    const checkStorage = async () => {
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();

          setStorage({
            used: estimate.usage || 0,
            quota: estimate.quota || 0,
          });
        }
      } catch (error) {
        console.error('Storage estimate failed:', error);
      }
    };

    checkStorage();
  }, [books]);

  /**
   * PWA install prompt
   */
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  /**
   * Install app
   */
  const handleInstallApp = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;

    console.log(`Install prompt outcome: ${outcome}`);

    setInstallPrompt(null);
  };

  /**
   * Open a book
   */
  const handleOpenBook = (book: Book, startPage: number = 1) => {
    setActiveBook(book);
    setActiveStartPage(startPage);
  };

  /**
   * Back to library
   */
  const handleBackToLibrary = () => {
    setActiveBook(null);
    setActiveStartPage(1);

    refreshBooks();
  };

  /**
   * Storage information
   */
  const usedMB = storage
    ? (storage.used / 1024 / 1024).toFixed(1)
    : '0';

  const quotaMB = storage
    ? (storage.quota / 1024 / 1024).toFixed(0)
    : '0';

  const storagePercent =
    storage && storage.quota
      ? Math.min(
          100,
          Math.round((storage.used / storage.quota) * 100)
        )
      : 0;

  /**
   * INTRO VIDEO
   *
   * Video:
   * - plays automatically muted
   * - actual video duration decides when it ends
   * - maximum intro duration = 10 seconds
   * - mute/unmute button is inside IntroVideo.tsx
   */
  if (showIntro) {
    return (
      <IntroVideo
        onComplete={() => {
          setShowIntro(false);
        }}
      />
    );
  }

  /**
   * Loading screen
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />

          <p className="text-sm text-gray-500">
            Loading your library...
          </p>
        </div>
      </div>
    );
  }

  /**
   * Open PDF Reader
   */
  if (activeBook) {
    return (
      <BookReader
        book={activeBook}
        startPage={activeStartPage}
        onBack={handleBackToLibrary}
      />
    );
  }

  /**
   * Main Library
   */
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r border-gray-200 bg-white flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold tracking-tight">
            DINU RAATO KE READER💀🤫
          </h1>

          <p className="text-xs text-gray-500 mt-1">
            Your personal PDF reader
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentTab('bookshelf')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              currentTab === 'bookshelf'
                ? 'bg-gray-100 font-medium'
                : 'hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Bookshelf
          </button>

          <button
            onClick={() => setCurrentTab('recent')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              currentTab === 'recent'
                ? 'bg-gray-100 font-medium'
                : 'hover:bg-gray-50'
            }`}
          >
            <Clock className="w-5 h-5" />
            Recent
          </button>

          <button
            onClick={() => setCurrentTab('bookmarks')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              currentTab === 'bookmarks'
                ? 'bg-gray-100 font-medium'
                : 'hover:bg-gray-50'
            }`}
          >
            <BookmarkIcon className="w-5 h-5" />
            Bookmarks
          </button>

          <button
            onClick={() => setCurrentTab('highlights')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              currentTab === 'highlights'
                ? 'bg-gray-100 font-medium'
                : 'hover:bg-gray-50'
            }`}
          >
            <Highlighter className="w-5 h-5" />
            Highlights
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <button
            onClick={() => setShowUploader(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
          >
            <Plus className="w-4 h-4" />
            Add PDF
          </button>

          {installPrompt && (
            <button
              onClick={handleInstallApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition"
            >
              <Upload className="w-4 h-4" />
              Install DINU RAATO KE READER💀🤫 App
            </button>
          )}

          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Storage</span>
              <span>
                {usedMB} MB / {quotaMB} MB
              </span>
            </div>

            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all"
                style={{
                  width: `${storagePercent}%`,
                }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">
                DINU RAATO KE READER💀🤫
              </h1>

              <p className="text-xs text-gray-500">
                Your personal PDF reader
              </p>
            </div>

            <button
              onClick={() => setShowUploader(true)}
              className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Library */}
        <div className="p-4 md:p-8">
          <Library
            books={books}
            currentTab={currentTab}
            bookmarks={allBookmarks}
            highlights={allHighlights}
            onOpenBook={handleOpenBook}
            onRefresh={refreshBooks}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-4">
          <button
            onClick={() => setCurrentTab('bookshelf')}
            className={`flex flex-col items-center justify-center gap-1 py-3 text-xs ${
              currentTab === 'bookshelf'
                ? 'font-semibold'
                : 'text-gray-500'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Books
          </button>

          <button
            onClick={() => setCurrentTab('recent')}
            className={`flex flex-col items-center justify-center gap-1 py-3 text-xs ${
              currentTab === 'recent'
                ? 'font-semibold'
                : 'text-gray-500'
            }`}
          >
            <Clock className="w-5 h-5" />
            Recent
          </button>

          <button
            onClick={() => setCurrentTab('bookmarks')}
            className={`flex flex-col items-center justify-center gap-1 py-3 text-xs ${
              currentTab === 'bookmarks'
                ? 'font-semibold'
                : 'text-gray-500'
            }`}
          >
            <BookmarkIcon className="w-5 h-5" />
            Saved
          </button>

          <button
            onClick={() => setCurrentTab('highlights')}
            className={`flex flex-col items-center justify-center gap-1 py-3 text-xs ${
              currentTab === 'highlights'
                ? 'font-semibold'
                : 'text-gray-500'
            }`}
          >
            <Highlighter className="w-5 h-5" />
            Highlights
          </button>
        </div>
      </nav>

      {/* PDF Uploader */}
      {showUploader && (
        <PdfUploader
          onClose={() => setShowUploader(false)}
          onUploaded={() => {
            setShowUploader(false);
            refreshBooks();
          }}
        />
      )}
    </div>
  );
}