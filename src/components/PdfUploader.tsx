import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { loadPdfDocument, generateCoverThumbnail } from '../services/pdfService';
import { saveBook } from '../services/indexedDBService';
import { Book } from '../types';

interface PdfUploaderProps {
  onBookUploaded: (book: Book) => void;
  onCancel?: () => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onBookUploaded, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please choose a valid PDF document (.pdf).');
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      setError('File is quite large (>150MB). Please select a standard PDF.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgressMsg('Parsing PDF document structure...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await loadPdfDocument(arrayBuffer);

      if (doc.numPages < 1) {
        throw new Error('This PDF has no readable pages.');
      }

      setProgressMsg(`Rendering cover preview (${doc.numPages} pages found)...`);
      const coverDataUrl = await generateCoverThumbnail(doc);

      // Create unique book
      const bookId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const newBook: Book = {
        id: bookId,
        name: cleanTitle,
        originalFileName: file.name,
        pdfBlob: file,
        pageCount: doc.numPages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastReadPage: 1,
        fileSize: file.size,
        coverDataUrl,
      };

      setProgressMsg('Saving book to local IndexedDB...');
      await saveBook(newBook);

      setIsProcessing(false);
      onBookUploaded(newBook);
    } catch (err: any) {
      console.error('Failed to process PDF:', err);
      setError(
        err.message || 'Could not parse this PDF. The file may be password-protected or corrupted.'
      );
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 select-none">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
            : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-slate-50'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-900">
              Importing into your Bookshelf
            </p>
            <p className="text-xs text-slate-500 font-mono">{progressMsg}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Drop your PDF here, or <span className="text-indigo-600 hover:underline">browse files</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Saved privately in your local browser storage. Never uploaded to cloud.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-mono">
              <span>Supports PDF textbooks, research papers, documents & books</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {onCancel && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-800 py-1.5 px-4 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
