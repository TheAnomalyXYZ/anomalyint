import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, Move, Type, Square, Circle, Minus, ArrowRight, Pen, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

// Set up the worker - use unpkg as a more reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
  drawingElements?: DrawingElement[];
  onDrawingElementsUpdate?: (elements: DrawingElement[]) => void;
}

interface OverlayBox {
  x: number;
  y: number;
  width: number;
  height: number;
  fillIndex: number;
}

type DrawingTool = 'move' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen';

interface DrawingElement {
  id: string;
  type: Exclude<DrawingTool, 'move'>;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  points?: { x: number; y: number }[];
  text?: string;
  color: string;
  fontSize?: number;
  strokeWidth?: number;
}

export function PdfCanvasViewer({
  pdfUrl,
  suggestedFills,
  pageNumber = 1,
  onFillsUpdate,
  drawingElements: initialDrawingElements = [],
  onDrawingElementsUpdate
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

  // Drawing tools state
  const [currentTool, setCurrentTool] = useState<DrawingTool>('move');
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<DrawingElement> | null>(null);
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [fontSize, setFontSize] = useState(14);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [aiFillsFontSize, setAiFillsFontSize] = useState(12); // AI suggested fills font size (reduced from 14)
  const [elementsConverted, setElementsConverted] = useState(false); // Track if initial elements were converted
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the initial load to prevent auto-save

  // Convert initial drawing elements from detection space to canvas space on load
  useEffect(() => {
    if (!elementsConverted && scale > 0) {
      if (initialDrawingElements.length > 0) {
        const detectionScale = 2; // Matrix(2, 2) from Python service
        const detectionToCanvasScale = scale / detectionScale;

        // Convert all drawing elements from detection space to canvas space
        const convertedElements = initialDrawingElements.map(element => {
          const converted: any = {
            ...element,
            x: element.x * detectionToCanvasScale,
            y: element.y * detectionToCanvasScale,
          };

          // Convert width/height for shapes
          if (element.width !== undefined) {
            converted.width = element.width * detectionToCanvasScale;
          }
          if (element.height !== undefined) {
            converted.height = element.height * detectionToCanvasScale;
          }

          // Convert endX/endY for lines and arrows
          if (element.endX !== undefined) {
            converted.endX = element.endX * detectionToCanvasScale;
          }
          if (element.endY !== undefined) {
            converted.endY = element.endY * detectionToCanvasScale;
          }

          // Convert points for pen tool
          if (element.points) {
            converted.points = element.points.map(p => ({
              x: p.x * detectionToCanvasScale,
              y: p.y * detectionToCanvasScale
            }));
          }

          return converted;
        });

        setDrawingElements(convertedElements);
      }
      // Mark as converted even if there are no initial elements
      // This allows new annotations to be saved properly
      setElementsConverted(true);

      // After initial conversion, allow saves for subsequent user changes
      // Use setTimeout to ensure this runs after the state update
      setTimeout(() => setIsInitialLoad(false), 0);
    }
  }, [initialDrawingElements, scale, elementsConverted]);

  // Notify parent when drawing elements change
  // Convert from canvas coordinates to detection coordinates (2x scale) before saving
  useEffect(() => {
    // Don't save during initial load to prevent coordinate drift
    if (onDrawingElementsUpdate && drawingElements.length > 0 && scale > 0 && elementsConverted && !isInitialLoad) {
      const detectionScale = 2; // Matrix(2, 2) from Python service
      const canvasToDetectionScale = detectionScale / scale;

      // Convert all drawing elements from canvas space to detection space
      const convertedElements = drawingElements.map(element => {
        const converted: any = {
          ...element,
          x: element.x * canvasToDetectionScale,
          y: element.y * canvasToDetectionScale,
        };

        // Convert width/height for shapes
        if (element.width !== undefined) {
          converted.width = element.width * canvasToDetectionScale;
        }
        if (element.height !== undefined) {
          converted.height = element.height * canvasToDetectionScale;
        }

        // Convert endX/endY for lines and arrows
        if (element.endX !== undefined) {
          converted.endX = element.endX * canvasToDetectionScale;
        }
        if (element.endY !== undefined) {
          converted.endY = element.endY * canvasToDetectionScale;
        }

        // Convert points for pen tool
        if (element.points) {
          converted.points = element.points.map(p => ({
            x: p.x * canvasToDetectionScale,
            y: p.y * canvasToDetectionScale
          }));
        }

        return converted;
      });

      onDrawingElementsUpdate(convertedElements);
    }
  }, [drawingElements, scale, elementsConverted, isInitialLoad]);

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
          // Coordinates come from detection at 2x scale (Matrix(2, 2) in Python)
          // Convert: image coords (2x) -> PDF points (÷2) -> canvas pixels (×calculatedScale)
          const detectionScale = 2; // Matrix(2, 2) from Python service
          const pdfToCanvasScale = calculatedScale / detectionScale;
          const canvasX = fill.x * pdfToCanvasScale;
          const canvasY = fill.y * pdfToCanvasScale;

          context.font = `${aiFillsFontSize}px Arial`;
          const textMetrics = context.measureText(fill.value);
          const textWidth = textMetrics.width;
          const textHeight = aiFillsFontSize + 6;
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
      context.font = `bold ${aiFillsFontSize}px Arial`;
      context.textBaseline = 'top';
      context.textAlign = 'left'; // Reset alignment to prevent state persistence
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
        // Reset text alignment back to default
        context.textAlign = 'left';
      }
    });

    // Draw all saved drawing elements
    drawingElements.forEach((element) => {
      const isSelected = selectedElementId === element.id;
      context.strokeStyle = element.color;
      context.fillStyle = element.color;
      context.lineWidth = element.strokeWidth || 2;

      if (isSelected) {
        context.shadowColor = 'rgba(99, 102, 241, 0.5)';
        context.shadowBlur = 10;
      }

      switch (element.type) {
        case 'text':
          context.font = `${element.fontSize || 16}px Arial`;
          context.textBaseline = 'top';
          context.fillText(element.text || '', element.x, element.y);
          break;
        case 'rectangle':
          context.strokeRect(element.x, element.y, element.width || 0, element.height || 0);
          break;
        case 'circle':
          const radiusX = (element.width || 0) / 2;
          const radiusY = (element.height || 0) / 2;
          const centerX = element.x + radiusX;
          const centerY = element.y + radiusY;
          context.beginPath();
          context.ellipse(centerX, centerY, Math.abs(radiusX), Math.abs(radiusY), 0, 0, 2 * Math.PI);
          context.stroke();
          break;
        case 'line':
          context.beginPath();
          context.moveTo(element.x, element.y);
          context.lineTo(element.endX || element.x, element.endY || element.y);
          context.stroke();
          break;
        case 'arrow':
          // Draw line
          context.beginPath();
          context.moveTo(element.x, element.y);
          context.lineTo(element.endX || element.x, element.endY || element.y);
          context.stroke();
          // Draw arrowhead
          const angle = Math.atan2((element.endY || element.y) - element.y, (element.endX || element.x) - element.x);
          const headLen = 15;
          context.beginPath();
          context.moveTo(element.endX || element.x, element.endY || element.y);
          context.lineTo(
            (element.endX || element.x) - headLen * Math.cos(angle - Math.PI / 6),
            (element.endY || element.y) - headLen * Math.sin(angle - Math.PI / 6)
          );
          context.lineTo(
            (element.endX || element.x) - headLen * Math.cos(angle + Math.PI / 6),
            (element.endY || element.y) - headLen * Math.sin(angle + Math.PI / 6)
          );
          context.lineTo(element.endX || element.x, element.endY || element.y);
          context.fill();
          break;
        case 'pen':
          if (element.points && element.points.length > 0) {
            context.beginPath();
            context.moveTo(element.points[0].x, element.points[0].y);
            for (let i = 1; i < element.points.length; i++) {
              context.lineTo(element.points[i].x, element.points[i].y);
            }
            context.stroke();
          }
          break;
      }

      context.shadowBlur = 0;
    });

    // Draw current drawing in progress
    if (currentDrawing) {
      context.strokeStyle = selectedColor;
      context.fillStyle = selectedColor;
      context.lineWidth = strokeWidth;

      switch (currentDrawing.type) {
        case 'rectangle':
          if (currentDrawing.width && currentDrawing.height) {
            context.strokeRect(currentDrawing.x || 0, currentDrawing.y || 0, currentDrawing.width, currentDrawing.height);
          }
          break;
        case 'circle':
          if (currentDrawing.width && currentDrawing.height) {
            const radiusX = currentDrawing.width / 2;
            const radiusY = currentDrawing.height / 2;
            const centerX = (currentDrawing.x || 0) + radiusX;
            const centerY = (currentDrawing.y || 0) + radiusY;
            context.beginPath();
            context.ellipse(centerX, centerY, Math.abs(radiusX), Math.abs(radiusY), 0, 0, 2 * Math.PI);
            context.stroke();
          }
          break;
        case 'line':
        case 'arrow':
          context.beginPath();
          context.moveTo(currentDrawing.x || 0, currentDrawing.y || 0);
          context.lineTo(currentDrawing.endX || currentDrawing.x || 0, currentDrawing.endY || currentDrawing.y || 0);
          context.stroke();
          if (currentDrawing.type === 'arrow') {
            const angle = Math.atan2((currentDrawing.endY || 0) - (currentDrawing.y || 0), (currentDrawing.endX || 0) - (currentDrawing.x || 0));
            const headLen = 15;
            context.beginPath();
            context.moveTo(currentDrawing.endX || 0, currentDrawing.endY || 0);
            context.lineTo(
              (currentDrawing.endX || 0) - headLen * Math.cos(angle - Math.PI / 6),
              (currentDrawing.endY || 0) - headLen * Math.sin(angle - Math.PI / 6)
            );
            context.lineTo(
              (currentDrawing.endX || 0) - headLen * Math.cos(angle + Math.PI / 6),
              (currentDrawing.endY || 0) - headLen * Math.sin(angle + Math.PI / 6)
            );
            context.lineTo(currentDrawing.endX || 0, currentDrawing.endY || 0);
            context.fill();
          }
          break;
        case 'pen':
          if (currentDrawing.points && currentDrawing.points.length > 0) {
            context.beginPath();
            context.moveTo(currentDrawing.points[0].x, currentDrawing.points[0].y);
            for (let i = 1; i < currentDrawing.points.length; i++) {
              context.lineTo(currentDrawing.points[i].x, currentDrawing.points[i].y);
            }
            context.stroke();
          }
          break;
      }
    }
  }, [suggestedFills, overlayBoxes, pageNumber, hoveredIndex, draggingIndex, drawingElements, currentDrawing, selectedElementId, selectedColor, strokeWidth, aiFillsFontSize]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // In move mode, check for overlay dragging
    if (currentTool === 'move') {
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
          return;
        }
      }

      // Check if clicking on a drawing element for selection and dragging
      for (const element of [...drawingElements].reverse()) {
        let isInside = false;
        if (element.type === 'text') {
          const textWidth = (element.text || '').length * (element.fontSize || 14) * 0.6;
          isInside = mouseX >= element.x && mouseX <= element.x + textWidth &&
                     mouseY >= element.y && mouseY <= element.y + (element.fontSize || 14);
        } else if (element.type === 'rectangle') {
          isInside = mouseX >= element.x && mouseX <= element.x + (element.width || 0) &&
                     mouseY >= element.y && mouseY <= element.y + (element.height || 0);
        } else if (element.type === 'circle') {
          const centerX = element.x + (element.width || 0) / 2;
          const centerY = element.y + (element.height || 0) / 2;
          const distX = Math.abs(mouseX - centerX);
          const distY = Math.abs(mouseY - centerY);
          isInside = distX * distX / ((element.width || 0) / 2) ** 2 +
                     distY * distY / ((element.height || 0) / 2) ** 2 <= 1;
        }

        if (isInside) {
          setSelectedElementId(element.id);
          setDraggingElementId(element.id);
          setDragOffset({
            x: mouseX - element.x,
            y: mouseY - element.y
          });
          return;
        }
      }
      setSelectedElementId(null);
      return;
    }

    // Drawing tools
    if (currentTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newElement: DrawingElement = {
          id: Date.now().toString(),
          type: 'text',
          x: mouseX,
          y: mouseY,
          text,
          color: selectedColor,
          fontSize
        };
        setDrawingElements(prev => [...prev, newElement]);
      }
    } else if (currentTool === 'pen') {
      setIsDrawing(true);
      setCurrentDrawing({
        type: 'pen',
        x: mouseX,
        y: mouseY,
        points: [{ x: mouseX, y: mouseY }],
        color: selectedColor,
        strokeWidth
      });
    } else {
      setIsDrawing(true);
      setCurrentDrawing({
        type: currentTool,
        x: mouseX,
        y: mouseY,
        endX: mouseX,
        endY: mouseY,
        width: 0,
        height: 0,
        color: selectedColor,
        strokeWidth
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Handle overlay dragging
    if (draggingIndex !== null) {
      const newBoxes = [...overlayBoxes];
      newBoxes[draggingIndex] = {
        ...newBoxes[draggingIndex],
        x: mouseX - dragOffset.x,
        y: mouseY - dragOffset.y
      };
      setOverlayBoxes(newBoxes);
      return;
    }

    // Handle drawing element dragging
    if (draggingElementId !== null) {
      setDrawingElements(prev => prev.map(el => {
        if (el.id === draggingElementId) {
          const newX = mouseX - dragOffset.x;
          const newY = mouseY - dragOffset.y;

          // For shapes with width/height, we need to adjust endX/endY
          if (el.type === 'line' || el.type === 'arrow') {
            const deltaX = newX - el.x;
            const deltaY = newY - el.y;
            return {
              ...el,
              x: newX,
              y: newY,
              endX: (el.endX || 0) + deltaX,
              endY: (el.endY || 0) + deltaY
            };
          }

          return { ...el, x: newX, y: newY };
        }
        return el;
      }));
      return;
    }

    // Handle drawing
    if (isDrawing && currentDrawing) {
      if (currentDrawing.type === 'pen') {
        setCurrentDrawing(prev => ({
          ...prev!,
          points: [...(prev!.points || []), { x: mouseX, y: mouseY }]
        }));
      } else if (currentDrawing.type === 'line' || currentDrawing.type === 'arrow') {
        setCurrentDrawing(prev => ({
          ...prev!,
          endX: mouseX,
          endY: mouseY
        }));
      } else {
        // Rectangle, circle
        const width = mouseX - (currentDrawing.x || 0);
        const height = mouseY - (currentDrawing.y || 0);
        setCurrentDrawing(prev => ({
          ...prev!,
          width,
          height
        }));
      }
      return;
    }

    // Check hover state for overlays
    if (currentTool === 'move') {
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
    // Handle overlay dragging completion
    if (draggingIndex !== null && onFillsUpdate && overlayCanvasRef.current) {
      const box = overlayBoxes[draggingIndex];
      const padding = 8;
      const textHeight = 20;

      // Convert back: canvas pixels -> image coords at 2x scale
      // Reverse of: canvasX = fill.x * (scale / 2)
      // Therefore: fill.x = canvasX * (2 / scale)
      const detectionScale = 2;
      const pdfX = (box.x + padding) * detectionScale / scale;
      const pdfY = (box.y + textHeight + padding) * detectionScale / scale;

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

    // Handle drawing element dragging completion
    // Note: Don't call onDrawingElementsUpdate directly here
    // The useEffect will handle the conversion and save automatically
    setDraggingElementId(null);

    // Handle drawing completion
    if (isDrawing && currentDrawing) {
      const completedElement: DrawingElement = {
        id: Date.now().toString(),
        type: currentDrawing.type!,
        x: currentDrawing.x || 0,
        y: currentDrawing.y || 0,
        width: currentDrawing.width,
        height: currentDrawing.height,
        endX: currentDrawing.endX,
        endY: currentDrawing.endY,
        points: currentDrawing.points,
        text: currentDrawing.text,
        color: currentDrawing.color || selectedColor,
        fontSize: currentDrawing.fontSize || fontSize,
        strokeWidth: currentDrawing.strokeWidth || strokeWidth
      };

      // Only save if it has some size (not just a click)
      if (completedElement.type === 'pen' && completedElement.points && completedElement.points.length > 1) {
        setDrawingElements(prev => [...prev, completedElement]);
      } else if (completedElement.type === 'text') {
        setDrawingElements(prev => [...prev, completedElement]);
      } else if ((completedElement.type === 'line' || completedElement.type === 'arrow') &&
                 (Math.abs((completedElement.endX || 0) - completedElement.x) > 5 ||
                  Math.abs((completedElement.endY || 0) - completedElement.y) > 5)) {
        setDrawingElements(prev => [...prev, completedElement]);
      } else if ((completedElement.type === 'rectangle' || completedElement.type === 'circle') &&
                 Math.abs(completedElement.width || 0) > 5 && Math.abs(completedElement.height || 0) > 5) {
        setDrawingElements(prev => [...prev, completedElement]);
      }

      setIsDrawing(false);
      setCurrentDrawing(null);
    }
  };

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

      {/* Drawing Tools Toolbar */}
      <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg border flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 border-r pr-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tools:</span>
          <Button
            size="sm"
            variant={currentTool === 'move' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('move')}
            className="h-8 w-8 p-0"
            title="Move/Select"
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'text' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('text')}
            className="h-8 w-8 p-0"
            title="Add Text"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'rectangle' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('rectangle')}
            className="h-8 w-8 p-0"
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'circle' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('circle')}
            className="h-8 w-8 p-0"
            title="Circle"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'line' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('line')}
            className="h-8 w-8 p-0"
            title="Line"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'arrow' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('arrow')}
            className="h-8 w-8 p-0"
            title="Arrow"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'pen' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('pen')}
            className="h-8 w-8 p-0"
            title="Freehand Draw"
          >
            <Pen className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 border-r pr-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Color:</span>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="h-8 w-12 rounded cursor-pointer"
            title="Select Color"
          />
        </div>

        {currentTool === 'text' && (
          <div className="flex items-center gap-2 border-r pr-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Font Size:</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="h-8 px-2 text-sm rounded border bg-white dark:bg-gray-800"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
              <option value={24}>24px</option>
              <option value={28}>28px</option>
              <option value={32}>32px</option>
            </select>
          </div>
        )}

        {currentTool !== 'text' && currentTool !== 'move' && (
          <div className="flex items-center gap-2 border-r pr-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Stroke:</span>
            <select
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="h-8 px-2 text-sm rounded border bg-white dark:bg-gray-800"
            >
              <option value={1}>1px</option>
              <option value={2}>2px</option>
              <option value={3}>3px</option>
              <option value={4}>4px</option>
              <option value={5}>5px</option>
            </select>
          </div>
        )}

        {/* AI Fills Font Size Control */}
        {suggestedFills.filter(f => f.page === pageNumber).length > 0 && (
          <div className="flex items-center gap-2 border-r pr-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">AI Text Size:</span>
            <select
              value={aiFillsFontSize}
              onChange={(e) => setAiFillsFontSize(Number(e.target.value))}
              className="h-8 px-2 text-sm rounded border bg-white dark:bg-gray-800"
            >
              <option value={8}>8px</option>
              <option value={10}>10px</option>
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
            </select>
          </div>
        )}

        {selectedElementId && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setDrawingElements(prev => prev.filter(el => el.id !== selectedElementId));
              setSelectedElementId(null);
            }}
            className="h-8 px-3"
            title="Delete Selected"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}

        {drawingElements.length > 0 && (
          <div className="ml-auto text-xs text-muted-foreground">
            {drawingElements.length} annotation{drawingElements.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="overflow-auto max-h-[600px] relative min-h-[500px]">
        {/* PDF canvas (background) */}
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ visibility: loading ? 'hidden' : 'visible' }} />

        {/* Overlay canvas (interactive overlays) */}
        <canvas
          ref={overlayCanvasRef}
          className={`absolute top-0 left-0 ${
            currentTool === 'move' ? 'cursor-move' : 'cursor-crosshair'
          }`}
          style={{ visibility: loading ? 'hidden' : 'visible' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
              <p className="text-sm text-muted-foreground">Rendering PDF with overlays...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center text-red-600">
              <p className="font-semibold mb-1">Error rendering PDF</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
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
