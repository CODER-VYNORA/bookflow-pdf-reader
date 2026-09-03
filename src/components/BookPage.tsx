import React, { useEffect, useRef, useState } from 'react';
import { PDFDocument, PDFPage, renderPageToCanvas, renderTextLayer } from '../services/pdfService';
import { Highlight, HighlightColor } from '../types';

interface BookPageProps {
  doc: PDFDocument;
  pageNumber: number;
  scale?: number;
  highlights?: Highlight[];
  onHighlightClick?: (highlight: Highlight, e: React.MouseEvent) => void;
  onTextSelected?: (selectionText: string, rects: Array<{ top: number; left: number; width: number; height: number }>, pageNumber: number) => void;
  pageSide?: 'left' | 'right' | 'single';
  theme?: 'paper' | 'cream' | 'dark';
}

export const BookPage: React.FC<BookPageProps> = ({
  doc,
  pageNumber,
  scale = 1.2,
  highlights = [],
  onHighlightClick,
  onTextSelected,
  pageSide = 'single',
  theme = 'paper',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    async function render() {
      if (pageNumber < 1 || pageNumber > doc.numPages) {
        setLoading(false);
        return;
      }

      try {
        const page: PDFPage = await doc.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const { viewport, width, height } = await renderPageToCanvas(page, canvas, scale);
        if (isCancelled) return;

        setDimensions({ width, height });

        // Render text layer
        const textLayerEl = textLayerRef.current;
        if (textLayerEl) {
          await renderTextLayer(page, textLayerEl, viewport);
        }

        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled && err?.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNumber}:`, err);
          setLoading(false);
        }
      }
    }

    render();

    return () => {
      isCancelled = true;
    };
  }, [doc, pageNumber, scale]);

  // Handle text selection in this page
  const handleMouseUp = () => {
    if (!onTextSelected || !containerRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text || text.length < 2) return;

    // Check if selection is within this page container
    if (!containerRef.current.contains(selection.anchorNode)) return;

    try {
      const range = selection.getRangeAt(0);
      const clientRects = Array.from(range.getClientRects());
      const pageRect = containerRef.current.getBoundingClientRect();

      if (clientRects.length === 0 || pageRect.width === 0 || pageRect.height === 0) return;

      const rects = clientRects.map((rect) => ({
        top: ((rect.top - pageRect.top) / pageRect.height) * 100,
        left: ((rect.left - pageRect.left) / pageRect.width) * 100,
        width: (rect.width / pageRect.width) * 100,
        height: (rect.height / pageRect.height) * 100,
      }));

      onTextSelected(text, rects, pageNumber);
    } catch (err) {
      console.warn('Selection parse error:', err);
    }
  };

  const getHighlightBgColor = (color: HighlightColor) => {
    switch (color) {
      case 'green':
        return 'rgba(134, 239, 172, 0.45)';
      case 'blue':
        return 'rgba(147, 197, 253, 0.45)';
      case 'pink':
        return 'rgba(249, 168, 212, 0.45)';
      case 'yellow':
      default:
        return 'rgba(254, 240, 138, 0.55)';
    }
  };

  // Theme styles
  const getThemeClasses = () => {
    switch (theme) {
      case 'cream':
        return 'bg-[#fbf7ee] text-stone-800 border-[#e8dfce]';
      case 'dark':
        return 'bg-slate-900 text-slate-100 border-slate-700';
      case 'paper':
      default:
        return 'bg-white text-slate-900 border-slate-300';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      className={`relative select-text overflow-visible transition-colors border box-border ${getThemeClasses()} ${
        pageSide === 'left' ? 'rounded-l-xs' : pageSide === 'right' ? 'rounded-r-xs' : 'rounded-xs'
      }`}
      style={{
        width: dimensions ? `${dimensions.width}px` : '100%',
        height: dimensions ? `${dimensions.height}px` : '100%',
        minHeight: '300px',
        boxSizing: 'border-box',
      }}
    >
      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        className="block pointer-events-none"
        style={{
          filter: theme === 'dark' ? 'invert(0.9) hue-rotate(180deg)' : undefined,
        }}
      />

      {/* PDF.js Text Layer for native selection */}
      <div
        ref={textLayerRef}
        className="textLayer absolute inset-0 select-text"
        style={{
          pointerEvents: 'auto',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Spine 3D Shading */}
      {pageSide === 'left' && (
        <div className="absolute inset-y-0 right-0 w-3 bg-linear-to-l from-slate-400/20 via-slate-300/5 to-transparent pointer-events-none z-10" />
      )}
      {pageSide === 'right' && (
        <div className="absolute inset-y-0 left-0 w-3 bg-linear-to-r from-slate-400/20 via-slate-300/5 to-transparent pointer-events-none z-10" />
      )}

      {/* Highlights Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {highlights.map((h) => (
          <div key={h.id} className="contents">
            {h.rects.map((rect, idx) => (
              <div
                key={`${h.id}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onHighlightClick?.(h, e);
                }}
                className="absolute pointer-events-auto cursor-pointer rounded-xs transition-opacity hover:opacity-80"
                style={{
                  top: `${rect.top}%`,
                  left: `${rect.left}%`,
                  width: `${rect.width}%`,
                  height: `${rect.height}%`,
                  backgroundColor: getHighlightBgColor(h.color),
                  borderBottom: `1.5px solid ${
                    h.color === 'yellow'
                      ? '#eab308'
                      : h.color === 'green'
                      ? '#22c55e'
                      : h.color === 'blue'
                      ? '#3b82f6'
                      : '#ec4899'
                  }`,
                }}
                title={h.note || h.selectedText}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Page number footer watermark */}
      <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none select-none z-20">
        <span className="text-[10px] font-mono tracking-widest text-slate-400 opacity-70">
          {pageNumber}
        </span>
      </div>

      {/* Loading state skeleton */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xs z-30">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-mono">Page {pageNumber}</span>
          </div>
        </div>
      )}
    </div>
  );
};
