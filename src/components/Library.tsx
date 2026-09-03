import React, { useState } from 'react';
import { Book } from '../types';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  BookMarked,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';
import { PdfUploader } from './PdfUploader';
import { createSampleBook } from '../services/sampleBookGenerator';
import { saveBook, deleteBook, renameBook } from '../services/indexedDBService';

interface LibraryProps {
  books: Book[];
  onOpenBook: (book: Book, startPage?: number) => void;
  onRefreshBooks: () => Promise<void>;
  showUploader?: boolean;
  onCloseUploader?: () => void;
  onOpenUploader?: () => void;
}

export const Library: React.FC<LibraryProps> = ({
  books,
  onOpenBook,
  onRefreshBooks,
  showUploader: externalShowUploader,
  onCloseUploader,
  onOpenUploader,
}) => {
  const [internalShowUploader, setInternalShowUploader] = useState(false);
  const showUploader = externalShowUploader ?? internalShowUploader;
  const setShowUploader = (val: boolean) => {
    if (!val && onCloseUploader) onCloseUploader();
    else if (val && onOpenUploader) onOpenUploader();
    else setInternalShowUploader(val);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  const handleStartRename = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBookId(book.id);
    setEditTitle(book.name);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await renameBook(id, editTitle.trim());
      await onRefreshBooks();
    }
    setEditingBookId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteBook(id);
    setConfirmDeleteId(null);
    await onRefreshBooks();
  };

  const handleLoadSample = async () => {
    setIsGeneratingSample(true);
    try {
      const sample = createSampleBook();
      await saveBook(sample);
      await onRefreshBooks();
      onOpenBook(sample, 1);
    } catch (err) {
      console.error('Failed to create sample book:', err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const filteredBooks = books.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-900 overflow-y-auto">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold tracking-tight text-slate-900">Digital Bookshelf</h2>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md font-medium">
            {books.length} {books.length === 1 ? 'Volume' : 'Volumes'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload PDF</span>
          </button>
        </div>
      </header>

      {/* Main Grid Area */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        {/* Upload Modal / Panel if open */}
        {showUploader && (
          <div className="mb-6 p-6 bg-white rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Upload PDF Document</h3>
              <button
                type="button"
                onClick={() => setShowUploader(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PdfUploader
              onBookUploaded={async (newBook) => {
                setShowUploader(false);
                await onRefreshBooks();
                onOpenBook(newBook, 1);
              }}
              onCancel={() => setShowUploader(false)}
            />
          </div>
        )}

        {/* Empty State */}
        {filteredBooks.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-slate-300 bg-white p-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <BookMarked className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              No books found in this shelf
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Upload any PDF from your computer or launch the illustrated science demo book to test the tactile 3D page curl.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowUploader(true)}
                className="px-4 py-2 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Upload First PDF
              </button>
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isGeneratingSample}
                className="px-4 py-2 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
              >
                {isGeneratingSample ? 'Loading Demo...' : 'Load Demo Book'}
              </button>
            </div>
          </div>
        ) : (
          /* Book Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredBooks.map((book) => {
              const progress = Math.min(
                100,
                Math.round(((book.lastReadPage || 1) / (book.pageCount || 1)) * 100)
              );

              return (
                <div
                  key={book.id}
                  onClick={() => onOpenBook(book, book.lastReadPage || 1)}
                  className="group relative flex flex-col bg-white rounded-xl border border-slate-200 hover:border-slate-300  transition-all cursor-pointer overflow-hidden"
                >
                  {/* Book Cover */}
                  <div className="relative aspect-[3/4] bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    {book.coverDataUrl ? (
                      <img
                        src={book.coverDataUrl}
                        alt={book.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                        <FileText className="w-10 h-10 stroke-1 mb-2 opacity-50 text-slate-400" />
                        <span className="text-xs font-sans font-medium line-clamp-3 text-slate-700">
                          {book.name}
                        </span>
                      </div>
                    )}

                    {/* Spine Shadow Effect */}
                    <div className="absolute inset-y-0 left-0 w-3 bg-linear-to-r from-black/15 via-black/5 to-transparent pointer-events-none" />

                    {/* Hover Prompt */}
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold">
                        Open Reader →
                      </span>
                    </div>

                    {/* Progress pill */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/90 text-slate-800 backdrop-blur-xs">
                      {progress}%
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 flex flex-col flex-1">
                    {editingBookId === book.id ? (
                      <div className="flex items-center gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-xs p-1 rounded-md border border-slate-300 w-full"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(book.id, e)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBookId(null);
                          }}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <h3
                          className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug"
                          title={book.name}
                        >
                          {book.name}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(book, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity shrink-0"
                          title="Rename book"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Footer progress bar & page */}
                    <div className="mt-auto pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>
                          Page {book.lastReadPage || 1} of {book.pageCount}
                        </span>
                        <span>{progress}%</span>
                      </div>

                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(book.updatedAt).toLocaleDateString()}
                        </span>

                        {confirmDeleteId === book.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-red-600 font-medium">Delete?</span>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(book.id, e)}
                              className="px-1.5 py-0.5 bg-red-600 text-white rounded-xs"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-xs"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(book.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                            title="Delete book"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
