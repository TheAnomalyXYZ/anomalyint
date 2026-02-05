import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, Move } from 'lucide-react';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FieldFill {
  fieldIndex: number;
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  label?: string;
}

interface PdfCanvasViewerProps {
  pdfUrl: string;
  suggestedFills: FieldFill[];
  pageNumber?: number;
  onFillsUpdate?: (fills: FieldFill[]) => void;
}

interface OverlayBox {
  x: number;
  y: number;
  width: number;
  height: number;
  fillIndex: number;
}

export function PdfCanvasViewer({
  pdfUrl,
  suggestedFills,
  pageNumber = 1,
  onFillsUpdate
}: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.5);
  const [overlayBoxes, setOverlayBoxes] = useState<OverlayBox[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Render PDF to canvas
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 10;

    const renderPdf = async () => {
      if (!canvasRef.current || !containerRef.current) {
        console.log('[PdfCanvasViewer] Canvas refs not ready, retry', retryCount);

        // Retry after a short delay
        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          setTimeout(renderPdf, 100);
        } else {
          console.error('[PdfCanvasViewer] Canvas refs never became ready after', maxRetries, 'retries');
          setLoading(false);
          setError('Failed to initialize PDF viewer');
        }
        return;
      }

      console.log('[PdfCanvasViewer] Starting PDF render:', pdfUrl);
      setLoading(true);
      setError(null);

      try {
        console.log('[PdfCanvasViewer] Loading PDF document...');
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        console.log('[PdfCanvasViewer] PDF loaded, total pages:', pdf.numPages);
        const page = await pdf.getPage(pageNumber);

        if (!isMounted) return;

        console.log('[PdfCanvasViewer] Getting page:', pageNumber);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        // Calculate scale
        const containerWidth = containerRef.current.clientWidth;
        const viewport = page.getViewport({ scale: 1 });
        const calculatedScale = (containerWidth - 32) / viewport.width;
        const scaledViewport = page.getViewport({ scale: calculatedScale });

        console.log('[PdfCanvasViewer] Canvas dimensions:', scaledViewport.width, 'x', scaledViewport.height);

        // Set canvas dimensions
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        // Render PDF
        console.log('[PdfCanvasViewer] Rendering PDF to canvas...');
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
        console.log('[PdfCanvasViewer] PDF rendered successfully');

        if (!isMounted) return;

        // Calculate overlay boxes
        const fillsForPage = suggestedFills.filter(fill => fill.page === pageNumber);
        console.log('[PdfCanvasViewer] Processing', fillsForPage.length, 'fills for page', pageNumber);
        const boxes: OverlayBox[] = fillsForPage.map((fill, idx) => {
          const canvasX = fill.x * calculatedScale;
          const canvasY = scaledViewport.height - (fill.y * calculatedScale);

          context.font = '14px Arial';
          const textMetrics = context.measureText(fill.value);
          const textWidth = textMetrics.width;
          const textHeight = 20;
          const padding = 8;

          return {
            x: canvasX - padding,
            y: canvasY - textHeight - padding,
            width: textWidth + (padding * 2),
            height: textHeight + (padding * 2),
            fillIndex: idx
          };
        });

        setOverlayBoxes(boxes);
        setScale(calculatedScale);
        console.log('[PdfCanvasViewer] Render complete, setting loading to false');
        setLoading(false);
      } catch (err) {
        console.error('[PdfCanvasViewer] Error rendering PDF:', err);
        console.error('[PdfCanvasViewer] Error details:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          pdfUrl,
          pageNumber
        });
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to render PDF');
          setLoading(false);
        }
      }
    };

    console.log('[PdfCanvasViewer] useEffect triggered, calling renderPdf');
    renderPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl, pageNumber]);

  // Render overlays whenever suggestedFills or dragging state changes
  useEffect(() => {
    if (!overlayCanvasRef.current || !canvasRef.current || overlayBoxes.length === 0) return;

    const overlayCanvas = overlayCanvasRef.current;
    const context = overlayCanvas.getContext('2d');
    if (!context) return;

    // Match overlay canvas size to PDF canvas
    overlayCanvas.width = canvasRef.current.width;
    overlayCanvas.height = canvasRef.current.height;

    // Clear overlay
    context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    const fillsForPage = suggestedFills.filter(fill => fill.page === pageNumber);

    // Draw each overlay
    fillsForPage.forEach((fill, idx) => {
      const box = overlayBoxes[idx];
      if (!box) return;

      const isHovered = hoveredIndex === idx;
      const isDragging = draggingIndex === idx;

      // Draw background
      context.fillStyle = isDragging
        ? 'rgba(99, 102, 241, 0.4)'
        : isHovered
        ? 'rgba(99, 102, 241, 0.3)'
        : 'rgba(99, 102, 241, 0.2)';
      context.fillRect(box.x, box.y, box.width, box.height);

      // Draw border
      context.strokeStyle = isDragging || isHovered
        ? 'rgba(99, 102, 241, 1)'
        : 'rgba(99, 102, 241, 0.8)';
      context.lineWidth = isDragging ? 3 : 2;
      context.strokeRect(box.x, box.y, box.width, box.height);

      // Draw text
      context.fillStyle = '#1e40af';
      context.font = 'bold 14px Arial';
      context.textBaseline = 'top';
      const padding = 8;
      context.fillText(fill.value, box.x + padding, box.y + padding);

      // Draw field number badge
      context.fillStyle = 'rgba(99, 102, 241, 0.9)';
      context.beginPath();
      context.arc(box.x + 10, box.y + 10, 10, 0, 2 * Math.PI);
      context.fill();
      context.fillStyle = 'white';
      context.font = 'bold 10px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(fill.fieldIndex + 1), box.x + 10, box.y + 10);

      // Draw move cursor hint when hovered
      if (isHovered || isDragging) {
        context.fillStyle = 'rgba(99, 102, 241, 0.9)';
        context.font = '12px Arial';
        context.textAlign = 'right';
        context.textBaseline = 'top';
        context.fillText('⊕', box.x + box.width - 5, box.y + 5);
      }
    });
  }, [suggestedFills, overlayBoxes, pageNumber, hoveredIndex, draggingIndex]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicking on any overlay box
    for (let i = 0; i < overlayBoxes.length; i++) {
      const box = overlayBoxes[i];
      if (
        mouseX >= box.x &&
        mouseX <= box.x + box.width &&
        mouseY >= box.y &&
        mouseY <= box.y + box.height
      ) {
        setDraggingIndex(i);
        setDragOffset({
          x: mouseX - box.x,
          y: mouseY - box.y
        });
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggingIndex !== null) {
      // Update overlay box position
      const newBoxes = [...overlayBoxes];
      newBoxes[draggingIndex] = {
        ...newBoxes[draggingIndex],
        x: mouseX - dragOffset.x,
        y: mouseY - dragOffset.y
      };
      setOverlayBoxes(newBoxes);
    } else {
      // Check hover state
      let foundHover = false;
      for (let i = 0; i < overlayBoxes.length; i++) {
        const box = overlayBoxes[i];
        if (
          mouseX >= box.x &&
          mouseX <= box.x + box.width &&
          mouseY >= box.y &&
          mouseY <= box.y + box.height
        ) {
          setHoveredIndex(i);
          foundHover = true;
          break;
        }
      }
      if (!foundHover) {
        setHoveredIndex(null);
      }
    }
  };

  const handleMouseUp = () => {
    if (draggingIndex !== null && onFillsUpdate && overlayCanvasRef.current) {
      // Convert canvas coordinates back to PDF coordinates
      const box = overlayBoxes[draggingIndex];
      const padding = 8;
      const textHeight = 20;

      // PDF coordinates (origin at bottom-left)
      const pdfX = (box.x + padding) / scale;
      const pdfY = (overlayCanvasRef.current.height - (box.y + textHeight + padding)) / scale;

      // Update the fill with new coordinates
      const fillsForPage = suggestedFills.filter(fill => fill.page === pageNumber);
      const updatedFill = { ...fillsForPage[draggingIndex], x: pdfX, y: pdfY };

      // Merge with all fills (including other pages)
      const allFills = [...suggestedFills];
      const globalIndex = suggestedFills.findIndex(
        f => f.fieldIndex === updatedFill.fieldIndex && f.page === pageNumber
      );

      if (globalIndex >= 0) {
        allFills[globalIndex] = updatedFill;
        onFillsUpdate(allFills);
      }
    }

    setDraggingIndex(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-slate-50 rounded-lg border">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-sm text-muted-foreground">Rendering PDF with overlays...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-slate-50 rounded-lg border">
        <div className="text-center text-red-600">
          <p className="font-semibold mb-1">Error rendering PDF</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white dark:bg-gray-800 rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
          PDF Preview with Suggested Fills
        </h4>
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <Move className="h-3 w-3" />
          Page {pageNumber} • {suggestedFills.filter(f => f.page === pageNumber).length} suggestions
        </span>
      </div>
      <div className="overflow-auto max-h-[600px] relative">
        {/* PDF canvas (background) */}
        <canvas ref={canvasRef} className="absolute top-0 left-0" />

        {/* Overlay canvas (interactive overlays) */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div className="mt-3 text-xs text-muted-foreground space-y-1">
        <p className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-indigo-600/20 border border-indigo-600/80"></span>
          Suggested fill locations with values
        </p>
        <p className="flex items-center gap-1 text-indigo-600 font-medium">
          <Move className="h-3 w-3" />
          Click and drag overlays to reposition them
        </p>
      </div>
    </div>
  );
}
