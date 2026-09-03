export interface Book {
  id: string;
  name: string;
  originalFileName: string;
  pdfBlob: Blob;
  pageCount: number;
  createdAt: number;
  updatedAt: number;
  lastReadPage: number;
  fileSize: number;
  coverDataUrl?: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  pageNumber: number;
  title?: string;
  createdAt: number;
}

export interface HighlightRect {
  top: number; // percentage relative to page height
  left: number; // percentage relative to page width
  width: number; // percentage relative to page width
  height: number; // percentage relative to page height
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface Highlight {
  id: string;
  bookId: string;
  pageNumber: number;
  selectedText: string;
  rects: HighlightRect[];
  color: HighlightColor;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  bookId: string;
  pageNumber: number;
  highlightId?: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReaderSettings {
  viewMode: 'auto' | 'single' | 'double';
  theme: 'paper' | 'cream' | 'dark';
  zoom: number;
  fitMode: 'fit-page' | 'fit-width' | 'custom';
}
