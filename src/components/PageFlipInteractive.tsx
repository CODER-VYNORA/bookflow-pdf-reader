import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from '../services/pdfService';
import { BookPage } from './BookPage';
import { Highlight } from '../types';

interface PageFlipInteractiveProps {
  doc: PDFDocument;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  isTwoPage: boolean;
  scale: number;
  theme: 'paper' | 'cream' | 'dark';
  highlights: Highlight[];
  onHighlightClick?: (highlight: Highlight, e: React.MouseEvent) => void;
  onTextSelected?: (text: string, rects: any[], pageNumber: number) => void;
}

export const PageFlipInteractive: React.FC<PageFlipInteractiveProps> = ({
  doc,
  currentPage,
  onPageChange,
  isTwoPage,
  scale,
  theme,
  highlights,
  onHighlightClick,
  onTextSelected,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panContentRef = useRef<HTMLDivElement | null>(null);
  const panOffsetX = useRef(0);
  const panOffsetY = useRef(0);
  const panStartX = useRef(0);
  const panStartY = useRef(0);
  const panStartScrollLeft = useRef(0);
  const panStartScrollTop = useRef(0);
  const isPanGesture = useRef(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });

  // Drag interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [turnDirection, setTurnDirection] = useState<'forward' | 'backward' | null>(null);
  const [turnProgress, setTurnProgress] = useState(0); // 0 (flat) to 1 (fully flipped)
  const [isAnimatingCommit, setIsAnimatingCommit] = useState(false);

  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);
  const pageWidthRef = useRef(400);
  const activePointerId = useRef<number | null>(null);

  // Zoomed reading uses direct 2D panning (like a normal PDF viewer).
  // Keep the normal page-turn gesture for the default reading scale.
  const panEnabled = scale > 1.15;

  // Determine displayed pages
  // In two-page mode:
  // Cover (Page 1) is shown alone on the right, or left is blank
  // Pages 2-3, 4-5, etc.
  let leftPageNumber: number | null = null;
  let rightPageNumber: number | null = null;

  if (isTwoPage) {
    if (currentPage === 1) {
      leftPageNumber = null;
      rightPageNumber = 1;
    } else {
      leftPageNumber = currentPage % 2 === 0 ? currentPage : currentPage - 1;
      rightPageNumber = leftPageNumber + 1 <= doc.numPages ? leftPageNumber + 1 : null;
    }
  } else {
    leftPageNumber = null;
    rightPageNumber = currentPage;
  }

  // Check navigation limits
  const canGoForward = isTwoPage
    ? (rightPageNumber ? rightPageNumber < doc.numPages : (leftPageNumber ? leftPageNumber < doc.numPages : false))
    : currentPage < doc.numPages;

  const canGoBackward = isTwoPage
    ? (leftPageNumber ? leftPageNumber > 1 : (rightPageNumber ? rightPageNumber > 1 : false))
    : currentPage > 1;

  // Measure page container width
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      pageWidthRef.current = isTwoPage ? rect.width / 2 : rect.width;
    }
  }, [isTwoPage, scale]);

  // A new page/zoom level starts from the top-left of the enlarged document.
  // This avoids carrying an old page's scroll position into the next page.
  useEffect(() => {
    panOffsetX.current = 0;
    panOffsetY.current = 0;
    setPanPosition({ x: 0, y: 0 });
  }, [currentPage, scale, isTwoPage]);

  // Turn page action with animation
  const animateTurn = useCallback(
    (direction: 'forward' | 'backward', initialProgress = 0) => {
      if (isAnimatingCommit) return;
      if (direction === 'forward' && !canGoForward) return;
      if (direction === 'backward' && !canGoBackward) return;

      setIsAnimatingCommit(true);
      setTurnDirection(direction);

      const startTime = performance.now();
      const duration = 380; // ms smooth flip

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = initialProgress + (1 - initialProgress) * (1 - Math.pow(1 - t, 3));
        setTurnProgress(eased);

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          // Finished turn!
          setIsAnimatingCommit(false);
          setIsDragging(false);
          setTurnProgress(0);
          setTurnDirection(null);

          if (direction === 'forward') {
            if (isTwoPage) {
              const next = currentPage === 1 ? 2 : currentPage + 2;
              onPageChange(Math.min(next, doc.numPages));
            } else {
              onPageChange(Math.min(currentPage + 1, doc.numPages));
            }
          } else {
            if (isTwoPage) {
              const prev = currentPage <= 3 ? 1 : currentPage - 2;
              onPageChange(Math.max(prev, 1));
            } else {
              onPageChange(Math.max(currentPage - 1, 1));
            }
          }
        }
      };

      requestAnimationFrame(step);
    },
    [canGoForward, canGoBackward, currentPage, doc.numPages, isAnimatingCommit, isTwoPage, onPageChange]
  );

  const animateCancel = useCallback((currentProg: number) => {
    setIsAnimatingCommit(true);
    const startTime = performance.now();
    const duration = 240;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = currentProg * (1 - t);
      setTurnProgress(eased);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setIsAnimatingCommit(false);
        setIsDragging(false);
        setTurnProgress(0);
        setTurnDirection(null);
      }
    };

    requestAnimationFrame(step);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        animateTurn('forward');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        animateTurn('backward');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [animateTurn]);

  // Pointer event handlers for physical drag page turn
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (isAnimatingCommit) return;

    const container = containerRef.current;
    if (!container) return;

    // IMPORTANT: once zoomed in, horizontal/vertical dragging is reserved for
    // moving around the enlarged PDF. Page-turning is completely disabled in
    // this mode so dragging up/down can reveal text below/above the viewport.
    if (panEnabled) {
      isPanGesture.current = false;
      panStartX.current = e.clientX;
      panStartY.current = e.clientY;
      panStartScrollLeft.current = panOffsetX.current;
      panStartScrollTop.current = panOffsetY.current;
      activePointerId.current = e.pointerId;
      setIsDragging(false);
      setTurnDirection(null);
      setTurnProgress(0);
      return;
    }

    // If user clicked inside active text selection, do not hijack pointer
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      // Allow user to interact with selection
      return;
    }

    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const isRightHalf = relX >= rect.width / 2;

    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragStartTime.current = performance.now();
    activePointerId.current = e.pointerId;
    pageWidthRef.current = isTwoPage ? rect.width / 2 : rect.width;

    // In two-page mode:
    // Drag on right half -> turning forward
    // Drag on left half -> turning backward
    // In single-page mode: direction determined by drag vector
    if (isTwoPage) {
      if (isRightHalf && canGoForward) {
        setTurnDirection('forward');
      } else if (!isRightHalf && canGoBackward) {
        setTurnDirection('backward');
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointerId.current !== e.pointerId || isAnimatingCommit) return;

    const deltaX = e.clientX - dragStartX.current;
    const deltaY = e.clientY - dragStartY.current;

    // Zoomed PDF: direct 2D pan. Scroll position is used instead of a CSS
    // transform so the canvas, text layer and highlight coordinates stay
    // perfectly aligned.
    if (panEnabled) {
      const panDeltaX = e.clientX - panStartX.current;
      const panDeltaY = e.clientY - panStartY.current;
      if (!isPanGesture.current && Math.hypot(panDeltaX, panDeltaY) > 5) {
        isPanGesture.current = true;
        try { container.setPointerCapture(e.pointerId); } catch {}
        // A drag is a pan, not text selection. Clear any selection that may
        // have started during the initial few pixels of movement.
        window.getSelection()?.removeAllRanges();
      }

      if (isPanGesture.current) {
        const viewport = container.getBoundingClientRect();
        const content = panContentRef.current;
        const contentWidth = content?.offsetWidth ?? 0;
        const contentHeight = content?.offsetHeight ?? 0;
        const maxX = Math.max(0, (contentWidth - viewport.width) / 2);
        const maxY = Math.max(0, (contentHeight - viewport.height) / 2);

        // Adobe-style 2D panning: drag the enlarged page in the same
        // direction as your finger/mouse. The page is clamped so it can
        // never be dragged completely out of view.
        const nextX = Math.max(-maxX, Math.min(maxX, panStartScrollLeft.current + panDeltaX));
        const nextY = Math.max(-maxY, Math.min(maxY, panStartScrollTop.current + panDeltaY));
        panOffsetX.current = nextX;
        panOffsetY.current = nextY;
        setPanPosition({ x: nextX, y: nextY });
        e.preventDefault();
      }
      return;
    }

    // Check if dragging has started
    if (!isDragging) {
      // Must exceed threshold horizontally
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // If single page, determine direction from deltaX
        if (!isTwoPage) {
          if (deltaX < 0 && canGoForward) {
            setTurnDirection('forward');
            setIsDragging(true);
            try {
              (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
            } catch {}
          } else if (deltaX > 0 && canGoBackward) {
            setTurnDirection('backward');
            setIsDragging(true);
            try {
              (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
            } catch {}
          }
        } else if (turnDirection) {
          // Two page mode direction already set on down
          if (
            (turnDirection === 'forward' && deltaX < 0) ||
            (turnDirection === 'backward' && deltaX > 0)
          ) {
            setIsDragging(true);
            try {
              (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
            } catch {}
          }
        }
      }
      return;
    }

    // While actively dragging
    const w = pageWidthRef.current || 300;
    let progress = 0;

    if (turnDirection === 'forward') {
      // Dragging leftwards: deltaX is negative
      progress = Math.min(Math.max(-deltaX / w, 0), 1);
    } else if (turnDirection === 'backward') {
      // Dragging rightwards: deltaX is positive
      progress = Math.min(Math.max(deltaX / w, 0), 1);
    }

    setTurnProgress(progress);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePointerId.current !== e.pointerId) return;
    activePointerId.current = null;

    if (panEnabled) {
      isPanGesture.current = false;
      try { container.releasePointerCapture(e.pointerId); } catch {}
      setIsDragging(false);
      setTurnDirection(null);
      setTurnProgress(0);
      return;
    }

    if (!isDragging || !turnDirection) {
      setIsDragging(false);
      setTurnDirection(null);
      setTurnProgress(0);
      return;
    }

    const elapsed = performance.now() - dragStartTime.current;
    const deltaX = e.clientX - dragStartX.current;
    const velocity = Math.abs(deltaX) / (elapsed || 1); // px per ms

    // If dragged > 28% or fast flick (> 0.45 px/ms) in right direction
    const flick = velocity > 0.45;
    const enoughDrag = turnProgress > 0.28;

    if (enoughDrag || flick) {
      animateTurn(turnDirection, turnProgress);
    } else {
      animateCancel(turnProgress);
    }
  };

  const handlePointerCancel = () => {
    activePointerId.current = null;
    if (panEnabled) {
      isPanGesture.current = false;
      setIsDragging(false);
      setTurnDirection(null);
      setTurnProgress(0);
      return;
    }
    if (isDragging) {
      animateCancel(turnProgress);
    } else {
      setIsDragging(false);
      setTurnDirection(null);
      setTurnProgress(0);
    }
  };

  // 3D Transform Angles
  // When turning forward:
  // The right page rotates from 0deg to -180deg around its left edge (the spine).
  // When turning backward:
  // The left page rotates from 0deg to +180deg around its right edge (the spine).
  const forwardAngle = -180 * turnProgress;
  const backwardAngle = 180 * turnProgress;

  // Dynamic subtle paper curl during drag (rotateZ and slight curl)
  const curlZ = Math.sin(turnProgress * Math.PI) * 2.5 * (turnDirection === 'forward' ? -1 : 1);
  const shadowOpacity = Math.sin(turnProgress * Math.PI) * 0.18;

  // Filter highlights for displayed pages
  const leftHighlights = highlights.filter((h) => leftPageNumber && h.pageNumber === leftPageNumber);
  const rightHighlights = highlights.filter((h) => rightPageNumber && h.pageNumber === rightPageNumber);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`relative flex w-full h-full min-h-0 select-none ${
        panEnabled ? 'items-center justify-center overflow-hidden' : 'items-center justify-center my-auto overflow-visible'
      }`}
      style={{
        perspective: '1800px',
        perspectiveOrigin: '50% 50%',
        cursor: panEnabled ? (isPanGesture.current ? 'grabbing' : 'grab') : isDragging ? 'grabbing' : 'grab',
        touchAction: panEnabled ? 'none' : 'pan-y',
        overscrollBehavior: 'none',
      }}
    >
      <div
        ref={panContentRef}
        className={`relative shrink-0 ${panEnabled ? 'will-change-transform' : ''}`}
        style={{
          transform: panEnabled ? `translate3d(${panPosition.x}px, ${panPosition.y}px, 0)` : 'none',
          transformOrigin: 'center center',
          width: 'max-content',
          height: 'max-content',
        }}
      >
      {/* 2-Page Book Spread */}
      {isTwoPage ? (
        <div
          className="relative flex items-center rounded-sm transition-all"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Left Page (Base) */}
          <div
            className="relative overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {leftPageNumber ? (
              <BookPage
                doc={doc}
                pageNumber={leftPageNumber}
                scale={scale}
                theme={theme}
                pageSide="left"
                highlights={leftHighlights}
                onHighlightClick={onHighlightClick}
                onTextSelected={onTextSelected}
              />
            ) : (
              // Inside front cover or blank left page for cover
              <div
                className={`flex items-center justify-center rounded-l-sm border-r border-neutral-200/50 ${
                  theme === 'cream' ? 'bg-[#f5eedc]' : theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100'
                }`}
                style={{
                  width: `${pageWidthRef.current}px`,
                  height: '100%',
                  minHeight: '480px',
                }}
              >
                <span className="text-xs text-neutral-400 font-serif italic tracking-wide">
                  Inside Cover
                </span>
              </div>
            )}

            {/* Left Page Grab Indicator (subtle cue) */}
            {!panEnabled && canGoBackward && !isDragging && (
              <>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    animateTurn('backward');
                  }}
                  className="absolute inset-y-0 left-0 w-12 hover:bg-slate-400/10 cursor-pointer transition-colors z-20 flex items-center justify-start pl-2 group"
                  title="Turn backward (or drag)"
                >
                  <div className="w-1.5 h-12 rounded-full bg-slate-300 opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    animateTurn('backward');
                  }}
                  className="absolute bottom-0 left-0 w-14 h-14 bg-slate-100/80 cursor-pointer flex items-end justify-start p-2 rounded-tr-[50px] border-r border-t border-slate-300 group hover:bg-slate-200 transition-colors z-20"
                  title="Turn to previous page ↙"
                >
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-600 font-medium select-none">
                    ↙ Turn
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Book Spine Center Divider */}
          <div className="w-[2px] self-stretch bg-slate-300/60 relative z-30">
            <div className="absolute inset-0 bg-linear-to-r from-black/5 to-transparent pointer-events-none" />
          </div>

          {/* Right Page (Base) */}
          <div
            className="relative overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {rightPageNumber ? (
              <BookPage
                doc={doc}
                pageNumber={rightPageNumber}
                scale={scale}
                theme={theme}
                pageSide="right"
                highlights={rightHighlights}
                onHighlightClick={onHighlightClick}
                onTextSelected={onTextSelected}
              />
            ) : (
              // End of book blank page
              <div
                className={`flex items-center justify-center rounded-r-sm ${
                  theme === 'cream' ? 'bg-[#f5eedc]' : theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                }`}
                style={{
                  width: `${pageWidthRef.current}px`,
                  height: '100%',
                  minHeight: '480px',
                }}
              >
                <span className="text-xs text-slate-400 font-serif italic">End of Document</span>
              </div>
            )}

            {/* Right Page Grab Indicator / Corner Turn Cue */}
            {!panEnabled && canGoForward && !isDragging && (
              <>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    animateTurn('forward');
                  }}
                  className="absolute inset-y-0 right-0 w-12 hover:bg-slate-400/10 cursor-pointer transition-colors z-20 flex items-center justify-end pr-2 group"
                  title="Turn forward (or drag)"
                >
                  <div className="w-1.5 h-12 rounded-full bg-slate-300 opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    animateTurn('forward');
                  }}
                  className="absolute bottom-0 right-0 w-14 h-14 bg-slate-100/80 cursor-pointer flex items-end justify-end p-2 rounded-tl-[50px] border-l border-t border-slate-300 group hover:bg-slate-200 transition-colors z-20"
                  title="Turn to next page ↘"
                >
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-600 font-medium select-none">
                    Turn ↘
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 3D TURNING LEAF (Turning Forward) */}
          {turnDirection === 'forward' && rightPageNumber && (
            <div
              className="absolute top-0 right-0 bottom-0 pointer-events-none z-40"
              style={{
                width: `${pageWidthRef.current}px`,
                transformOrigin: 'left center', // The spine!
                transformStyle: 'preserve-3d',
                transform: `translateZ(${10 + turnProgress * 18}px) rotateY(${forwardAngle}deg) rotateZ(${curlZ}deg) scaleY(${1 - turnProgress * 0.018})`,
                backfaceVisibility: 'hidden',
                transition: isAnimatingCommit ? 'none' : 'none',
              }}
            >
              {/* Front face of turning leaf (current right page) */}
              <div
                className="absolute inset-0 backface-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                }}
              >
                <BookPage
                  doc={doc}
                  pageNumber={rightPageNumber}
                  scale={scale}
                  theme={theme}
                  pageSide="right"
                  highlights={rightHighlights}
                />
                {/* Dynamic spine shadow on page */}
                <div
                  className="absolute inset-y-0 right-0 w-[18%] pointer-events-none bg-linear-to-l from-white/35 via-white/5 to-transparent"
                  style={{ opacity: 0.35 + turnProgress * 0.45 }}
                />
                <div
                  className="absolute top-0 right-0 w-16 h-16 pointer-events-none bg-linear-to-bl from-white/55 to-transparent"
                  style={{ opacity: turnProgress * 0.7, transform: `scale(${0.7 + turnProgress * 0.3})` }}
                />
              </div>

              {/* Back face of turning leaf (the next verso page) */}
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {rightPageNumber + 1 <= doc.numPages && (
                  <BookPage
                    doc={doc}
                    pageNumber={rightPageNumber + 1}
                    scale={scale}
                    theme={theme}
                    pageSide="left"
                    highlights={highlights.filter((h) => h.pageNumber === rightPageNumber + 1)}
                  />
                )}
                <div
                  className="absolute inset-y-0 left-0 w-[18%] pointer-events-none bg-linear-to-r from-white/35 via-white/5 to-transparent"
                  style={{ opacity: 0.35 + turnProgress * 0.45 }}
                />
                <div
                  className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none bg-linear-to-tr from-white/55 to-transparent"
                  style={{ opacity: turnProgress * 0.7, transform: `scale(${0.7 + turnProgress * 0.3})` }}
                />
              </div>
            </div>
          )}

          {/* 3D TURNING LEAF (Turning Backward) */}
          {turnDirection === 'backward' && leftPageNumber && (
            <div
              className="absolute top-0 left-0 bottom-0 pointer-events-none z-40"
              style={{
                width: `${pageWidthRef.current}px`,
                transformOrigin: 'right center', // The spine!
                transformStyle: 'preserve-3d',
                transform: `translateZ(${10 + turnProgress * 18}px) rotateY(${backwardAngle}deg) rotateZ(${curlZ}deg) scaleY(${1 - turnProgress * 0.018})`,
                backfaceVisibility: 'hidden',
                transition: isAnimatingCommit ? 'none' : 'none',
              }}
            >
              {/* Front face of turning leaf (current left page) */}
              <div
                className="absolute inset-0 backface-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                }}
              >
                <BookPage
                  doc={doc}
                  pageNumber={leftPageNumber}
                  scale={scale}
                  theme={theme}
                  pageSide="left"
                  highlights={leftHighlights}
                />
                <div
                  className="absolute inset-y-0 left-0 w-[18%] pointer-events-none bg-linear-to-r from-white/35 via-white/5 to-transparent"
                  style={{ opacity: 0.35 + turnProgress * 0.45 }}
                />
                <div
                  className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none bg-linear-to-tr from-white/55 to-transparent"
                  style={{ opacity: turnProgress * 0.7, transform: `scale(${0.7 + turnProgress * 0.3})` }}
                />
              </div>

              {/* Back face of turning leaf (the previous recto page) */}
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {leftPageNumber - 1 >= 1 && (
                  <BookPage
                    doc={doc}
                    pageNumber={leftPageNumber - 1}
                    scale={scale}
                    theme={theme}
                    pageSide="right"
                    highlights={highlights.filter((h) => h.pageNumber === leftPageNumber - 1)}
                  />
                )}
                <div
                  className="absolute inset-y-0 right-0 w-[18%] pointer-events-none bg-linear-to-l from-white/35 via-white/5 to-transparent"
                  style={{ opacity: 0.35 + turnProgress * 0.45 }}
                />
                <div
                  className="absolute top-0 right-0 w-16 h-16 pointer-events-none bg-linear-to-bl from-white/55 to-transparent"
                  style={{ opacity: turnProgress * 0.7, transform: `scale(${0.7 + turnProgress * 0.3})` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Single-Page Mode (Mobile / Narrow View) */
        <div
          className="relative flex items-center justify-center rounded-sm overflow-visible reader-surface"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Base Page */}
          <div
            className="relative"
            style={{
              transformOrigin: turnDirection === 'forward' ? 'left center' : 'right center',
              transformStyle: 'preserve-3d',
              transform:
                turnDirection === 'forward'
                  ? `rotateY(${forwardAngle * 0.85}deg) scale(${1 - turnProgress * 0.04})`
                  : turnDirection === 'backward'
                  ? `rotateY(${backwardAngle * 0.85}deg) scale(${1 - turnProgress * 0.04})`
                  : 'none',
            }}
          >
            <BookPage
              doc={doc}
              pageNumber={currentPage}
              scale={scale}
              theme={theme}
              pageSide="single"
              highlights={highlights.filter((h) => h.pageNumber === currentPage)}
              onHighlightClick={onHighlightClick}
              onTextSelected={onTextSelected}
            />

            {/* Subtle drag progress shadow */}
            {isDragging && (
              <div
                className="absolute inset-0 bg-black/10 pointer-events-none transition-opacity"
                style={{ opacity: turnProgress * 0.2 }}
              />
            )}
          </div>

          {/* Touch/drag edge tap helpers for accessibility */}
          {!panEnabled && canGoBackward && !isDragging && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                animateTurn('backward');
              }}
              className="absolute inset-y-0 left-0 w-10 hover:bg-neutral-400/10 cursor-pointer transition-colors z-20"
              title="Previous Page (or swipe right)"
            />
          )}
          {!panEnabled && canGoForward && !isDragging && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                animateTurn('forward');
              }}
              className="absolute inset-y-0 right-0 w-10 hover:bg-neutral-400/10 cursor-pointer transition-colors z-20"
              title="Next Page (or swipe left)"
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
};
