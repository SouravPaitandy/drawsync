"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Delete,
  Download,
  Redo,
  Undo,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";
import { 
  useMyPresence, 
  useOthers, 
  useBroadcastEvent, 
  useEventListener,
  useSelf 
} from "@/lib/liveblocks";
import { EVENT_TYPES } from "@/lib/liveblocks";
import useTouchEvents from "@/hooks/useTouchEvents";


export default function DrawingCanvas({ brushColor, brushSize, tool, viewOnly = false }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [drawHistory, setDrawHistory] = useState([]);
  const { theme } = useTheme();
  const [startPos, setStartPos] = useState(null);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [redoStack, setRedoStack] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Infinite canvas properties
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState(tool); // Drawing tool or pan tool

  // Eraser state
  const [lastEraserPosition, setLastEraserPosition] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Liveblocks: User presence and collaboration
  const [myPresence, updateMyPresence] = useMyPresence();
  const broadcast = useBroadcastEvent();
  const others = useOthers();
  const currentUser = useSelf();
  
  // Update cursor position in presence
  const updateCursorPosition = (x, y) => {
    updateMyPresence({
      cursor: { x, y }
    });
  };

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        // Get available space dimensions
        const rect = containerRef.current.getBoundingClientRect();

        // Set canvas size to fill the container
        const width = rect.width;
        // Subtract header height (adjust as needed)
        const height = window.innerHeight;

        setCanvasSize({ width, height });

        // Apply the dimensions to the canvas element
        canvasRef.current.width = width * window.devicePixelRatio;
        canvasRef.current.height = height * window.devicePixelRatio;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;

        // Set the context scale for high DPI displays
        const ctx = canvasRef.current.getContext("2d");
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Redraw everything after resize
        redrawCanvas();
      }
    };

    // Initial size setup
    updateCanvasSize();

    // Listen for window resize
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Sync activeTool with the tool prop from parent
  useEffect(() => {
    if (!isPanning) {
      setActiveTool(tool);
    }
  }, [tool, isPanning]);

  // Listen for drawing events from other collaborators
  useEventListener(({ event, connectionId }) => {
    // Don't process our own events
    if (connectionId === currentUser?.connectionId) return;

    switch (event.type) {
      case EVENT_TYPES.ADD_STROKE:
        setDrawHistory((prev) => [...prev, event.stroke]);
        break;
      
      case EVENT_TYPES.ERASE_STROKE:
        setDrawHistory((prev) => {
          const newHistory = [...prev];
          if (event.strokeIndex >= 0 && event.strokeIndex < newHistory.length) {
            newHistory.splice(event.strokeIndex, 1);
          }
          return newHistory;
        });
        break;
      
      case EVENT_TYPES.CLEAR_CANVAS:
        setDrawHistory([]);
        setRedoStack([]);
        break;
      
      case EVENT_TYPES.UNDO:
        if (drawHistory.length > 0) {
          const lastStroke = drawHistory[drawHistory.length - 1];
          setRedoStack((prev) => [...prev, lastStroke]);
          setDrawHistory((prev) => prev.slice(0, -1));
        }
        break;
        
      case EVENT_TYPES.REDO:
        if (redoStack.length > 0) {
          const strokeToRestore = redoStack[redoStack.length - 1];
          setDrawHistory((prev) => [...prev, strokeToRestore]);
          setRedoStack((prev) => prev.slice(0, -1));
        }
        break;
    }
  });

  // Function to redraw everything after resize, pan or zoom
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(
      0,
      0,
      canvas.width / window.devicePixelRatio,
      canvas.height / window.devicePixelRatio
    );

    // Save the current context state
    ctx.save();

    // Apply transformations for infinite canvas
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    // Draw grid (optional)
    drawGrid(ctx);

    // Draw all completed strokes
    drawHistory.forEach((stroke) => {
      try {
        const color = invertColorIfNeeded(stroke.color);
        ctx.strokeStyle = color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (stroke.tool === "pen") {
          const points = stroke.points;
          if (!points || points.length < 2) return;

          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);

          // Use a simple approach for curves to avoid pinching
          if (points.length === 2) {
            // For just two points, draw a straight line
            ctx.lineTo(points[1].x, points[1].y);
          } else {
            // For more points, use the smooth curve approach
            for (let i = 1; i < points.length - 2; i++) {
              const xc = (points[i].x + points[i + 1].x) / 2;
              const yc = (points[i].y + points[i + 1].y) / 2;
              ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }

            // Handle the last two points separately
            const lastIdx = points.length - 1;
            const secondLastIdx = points.length - 2;
            ctx.quadraticCurveTo(
              points[secondLastIdx].x,
              points[secondLastIdx].y,
              points[lastIdx].x,
              points[lastIdx].y
            );
          }

          ctx.stroke();
        } else {
          // Handle other shapes
          if (!stroke.points || !stroke.points[0]) return;

          const { x1, y1, x2, y2 } = stroke.points[0];
          const w = x2 - x1;
          const h = y2 - y1;

          ctx.beginPath();
          if (stroke.tool === "line") {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          } else if (stroke.tool === "rect") {
            ctx.strokeRect(x1, y1, w, h);
          } else if (stroke.tool === "ellipse") {
            ctx.ellipse(
              x1 + w / 2,
              y1 + h / 2,
              Math.abs(w / 2),
              Math.abs(h / 2),
              0,
              0,
              2 * Math.PI
            );
          }
          ctx.stroke();
        }
      } catch (error) {
        console.error("Error drawing stroke:", error, stroke);
      }
    });

    // Draw current preview shape if any
    if (currentPreview && activeTool !== "pen") {
      const { x1, y1, x2, y2 } = currentPreview;
      ctx.strokeStyle = invertColorIfNeeded(brushColor);
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      if (activeTool === "line") {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      } else if (activeTool === "rect") {
        const w = x2 - x1;
        const h = y2 - y1;
        ctx.strokeRect(x1, y1, w, h);
      } else if (activeTool === "ellipse") {
        const w = x2 - x1;
        const h = y2 - y1;
        ctx.ellipse(
          x1 + w / 2,
          y1 + h / 2,
          Math.abs(w / 2),
          Math.abs(h / 2),
          0,
          0,
          2 * Math.PI
        );
      }
      ctx.stroke();
    }

    // Restore the context to its original state
    ctx.restore();
  };

  // Draw a grid to help with navigation
  const drawGrid = (ctx) => {
    const gridSize = 50; // Size of each grid cell
    const gridColor =
      theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;

    // Calculate grid boundaries based on viewport and zoom
    const startX = Math.floor(-offsetX / zoom / gridSize) * gridSize;
    const startY = Math.floor(-offsetY / zoom / gridSize) * gridSize;
    const endX = startX + canvasSize.width / zoom + gridSize * 2;
    const endY = startY + canvasSize.height / zoom + gridSize * 2;

    // Draw vertical lines
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  // Convert screen coordinates to canvas coordinates
  const screenToCanvasCoords = (screenX, screenY) => {
    return {
      x: (screenX - offsetX) / zoom,
      y: (screenY - offsetY) / zoom,
    };
  };

  // Helper function to check if a point is within a stroke or shape
  const isPointInStroke = (point, stroke) => {
    // Handle pen strokes
    if (stroke.tool === "pen" && stroke.points) {
      for (let i = 0; i < stroke.points.length - 1; i++) {
        const p1 = stroke.points[i];
        const p2 = stroke.points[i + 1];
        
        // Calculate distance from point to line segment
        const distance = distanceToLineSegment(point, p1, p2);
        
        // If the distance is less than the stroke width plus some tolerance, consider it a hit
        const hitTolerance = stroke.size / 2 + 5;
        if (distance <= hitTolerance) {
          return true;
        }
      }
      return false;
    }
    
    // Handle other shapes (line, rect, ellipse)
    if (stroke.points && stroke.points[0]) {
      const { x1, y1, x2, y2 } = stroke.points[0];
      const hitTolerance = stroke.size / 2 + 5;
      
      if (stroke.tool === "line") {
        // For lines, check distance to the line segment
        const distance = distanceToLineSegment(point, { x: x1, y: y1 }, { x: x2, y: y2 });
        return distance <= hitTolerance;
      } 
      else if (stroke.tool === "rect") {
        // For rectangles, check if point is near any of the four edges
        const w = x2 - x1;
        const h = y2 - y1;
        
        // Check each edge of the rectangle
        const edges = [
          [{ x: x1, y: y1 }, { x: x2, y: y1 }], // top edge
          [{ x: x2, y: y1 }, { x: x2, y: y2 }], // right edge
          [{ x: x2, y: y2 }, { x: x1, y: y2 }], // bottom edge
          [{ x: x1, y: y2 }, { x: x1, y: y1 }]  // left edge
        ];
        
        for (const [p1, p2] of edges) {
          if (distanceToLineSegment(point, p1, p2) <= hitTolerance) {
            return true;
          }
        }
      } 
      else if (stroke.tool === "ellipse") {
        // For ellipses, approximate with points around the ellipse
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
        const centerX = x1 + w / 2;
        const centerY = y1 + h / 2;
        const radiusX = w / 2;
        const radiusY = h / 2;
        
        // Calculate normalized distance from center to the point
        const dx = point.x - centerX;
        const dy = point.y - centerY;
        
        // Convert to ellipse space by normalizing by radius
        const normalizedDistance = Math.sqrt((dx / radiusX) ** 2 + (dy / radiusY) ** 2);
        
        // Check if point is near the ellipse perimeter
        const innerBound = Math.max(0, 1 - hitTolerance / Math.min(radiusX, radiusY));
        const outerBound = 1 + hitTolerance / Math.min(radiusX, radiusY);
        
        return normalizedDistance >= innerBound && normalizedDistance <= outerBound;
      }
    }
    
    return false;
  };

  // Calculate the minimum distance from a point to a line segment
  const distanceToLineSegment = (point, lineStart, lineEnd) => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    // If the line is a point, return distance to that point
    if (dx === 0 && dy === 0) {
      return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
    }

    // Calculate projection ratio
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);

    if (t < 0) {
      // Point is beyond the lineStart end of the segment
      return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
    }
    if (t > 1) {
      // Point is beyond the lineEnd end of the segment
      return Math.hypot(point.x - lineEnd.x, point.y - lineEnd.y);
    }

    // Point's projection falls on the segment
    const projectionX = lineStart.x + t * dx;
    const projectionY = lineStart.y + t * dy;

    return Math.hypot(point.x - projectionX, point.y - projectionY);
  };

  // Start drawing or panning
  const startDrawing = (e) => {
    if (viewOnly) return; // Prevent drawing in view-only mode

    // Get the raw screen coordinates
    const screenX = e.nativeEvent.offsetX;
    const screenY = e.nativeEvent.offsetY;

    // Update cursor position for collaboration
    updateCursorPosition(screenX, screenY);

    // Middle mouse button or Space key held activates panning
    if (e.button === 1 || e.nativeEvent.shiftKey || activeTool === "pan") {
      setIsPanning(true);
      setPanStart({ x: screenX, y: screenY });
      return;
    }

    // Convert to canvas coordinates
    const { x, y } = screenToCanvasCoords(screenX, screenY);
    setStartPos({ x, y });

    if (activeTool === "pen") {
      // Start a new pen stroke at the converted coordinates
      setDrawHistory((prev) => [
        ...prev,
        {
          color: brushColor,
          size: brushSize,
          tool: "pen",
          points: [{ x, y }],
        },
      ]);
    }

    if (activeTool === "eraser") {
      // For eraser, we don't add a new stroke, just prepare to erase
      setDrawing(true);
      setStartPos({ x, y });
      // Immediately try to erase a stroke
      handleEraser({ x, y });
      return;
    }

    setDrawing(true);
    setCurrentPreview(null);
    setRedoStack([]); // Clear redo after new drawing action
  };

  // Handle erasing strokes by finding and removing whole strokes
  const handleEraser = (point) => {
    setDrawHistory((prev) => {
      // Find the index of the stroke to be erased
      const strokeIndex = prev.findIndex(stroke => isPointInStroke(point, stroke));
      
      // If a stroke is found, remove it completely
      if (strokeIndex !== -1) {
        // Broadcast the erase action to collaborators
        broadcast({
          type: EVENT_TYPES.ERASE_STROKE,
          strokeIndex
        });
        
        const newHistory = [...prev];
        newHistory.splice(strokeIndex, 1);
        return newHistory;
      }
      
      return prev;
    });
  };

  // Add this component to render a visual eraser indicator
  const EraserIndicator = () => {
    if (!drawing || activeTool !== "eraser" || !startPos) return null;

    return (
      <div
        className="absolute pointer-events-none border-2 border-dashed border-gray-400 dark:border-gray-500 rounded-full z-50"
        style={{
          width: `${brushSize * 2}px`,
          height: `${brushSize * 2}px`,
          left: `${mousePosition.x - brushSize}px`,
          top: `${mousePosition.y - brushSize}px`,
          transform: "translate(-50%, -50%)",
        }}
      />
    );
  };

  // Update the draw function to properly handle all tools
  const draw = (e) => {
    const screenX = e.nativeEvent.offsetX;
    const screenY = e.nativeEvent.offsetY;

    // Update cursor position for collaboration
    updateCursorPosition(screenX, screenY);
    
    // Update mouse position for eraser indicator
    setMousePosition({ x: screenX, y: screenY });

    if (isPanning) {
      // Update offset based on how far the mouse has moved
      setOffsetX((prev) => prev + (screenX - panStart.x));
      setOffsetY((prev) => prev + (screenY - panStart.y));
      setPanStart({ x: screenX, y: screenY });
      redrawCanvas(); // Immediate redraw for smoother panning
      return;
    }

    if (!drawing || !startPos) return;

    // Convert screen coordinates to canvas coordinates
    const { x, y } = screenToCanvasCoords(screenX, screenY);

    if (activeTool === "pen") {
      // Update the current pen stroke with the new point
      setDrawHistory((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.tool === "pen") {
          last.points = [...last.points, { x, y }];
        }
        return updated;
      });
      redrawCanvas(); // Immediate redraw for smoother drawing
    } else if (activeTool === "eraser") {
      // Only erase if we've moved a meaningful distance
      const minDistance = 2; // Minimum distance (in pixels) to move before processing
      
      if (
        !lastEraserPosition ||
        Math.hypot(x - lastEraserPosition.x, y - lastEraserPosition.y) >= minDistance
      ) {
        setLastEraserPosition({ x, y });
        handleEraser({ x, y });
      }
    } else {
      // Preview other shapes (line, rect, ellipse)
      setCurrentPreview({
        x1: startPos.x,
        y1: startPos.y,
        x2: x,
        y2: y,
      });
      redrawCanvas(); // Immediate redraw for shape preview
    }
  };

  // Add this useEffect to reset lastEraserPosition when changing tools
  useEffect(() => {
    // Reset eraser position when changing tools
    if (activeTool !== "eraser") {
      setLastEraserPosition(null);
    }
  }, [activeTool]);

  // End drawing or panning
  const stopDrawing = () => {
    // Reset the lastEraserPosition when drawing stops
    setLastEraserPosition(null);

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!drawing || !startPos) {
      setDrawing(false);
      setStartPos(null);
      setCurrentPreview(null);
      return;
    }

    if (activeTool === "eraser") {
      // For eraser tool, just stop drawing - the erasing was done during the draw function
      setDrawing(false);
      setStartPos(null);
      setCurrentPreview(null);
      return;
    }

    if (currentPreview && activeTool !== "pen") {
      const { x1, y1, x2, y2 } = currentPreview;

      const newStroke = {
        color: brushColor,
        size: brushSize,
        tool: activeTool,
        points: [{ x1, y1, x2, y2 }],
      };

      setDrawHistory((prev) => [...prev, newStroke]);
      
      // Broadcast the new stroke to collaborators
      broadcast({
        type: EVENT_TYPES.ADD_STROKE,
        stroke: newStroke
      });
    }

    // If we finished a pen stroke, broadcast it to collaborators
    if (activeTool === "pen" && drawHistory.length > 0) {
      const lastStroke = drawHistory[drawHistory.length - 1];
      
      // Only broadcast if the stroke has more than one point
      if (lastStroke.points && lastStroke.points.length > 1) {
        broadcast({
          type: EVENT_TYPES.ADD_STROKE,
          stroke: lastStroke
        });
      }
    }

    setDrawing(false);
    setStartPos(null);
    setCurrentPreview(null);
    setRedoStack([]); // Clear redo after new drawing action
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e) => {
    e.preventDefault();

    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? zoomIntensity : -zoomIntensity;
    const newZoom = Math.max(0.1, Math.min(5, zoom + delta));

    // Calculate zoom centered on mouse position
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update offsets to zoom centered at mouse position
    const newOffsetX = mouseX - (mouseX - offsetX) * (newZoom / zoom);
    const newOffsetY = mouseY - (mouseY - offsetY) * (newZoom / zoom);

    setZoom(newZoom);
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  };

  // Handle zoom with buttons
  const handleZoomIn = () => {
    const newZoom = Math.min(5, zoom + 0.1);
    // Zoom centered on canvas
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    const newOffsetX = centerX - (centerX - offsetX) * (newZoom / zoom);
    const newOffsetY = centerY - (centerY - offsetY) * (newZoom / zoom);

    setZoom(newZoom);
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, zoom - 0.1);
    // Zoom centered on canvas
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    const newOffsetX = centerX - (centerX - offsetX) * (newZoom / zoom);
    const newOffsetY = centerY - (centerY - offsetY) * (newZoom / zoom);

    setZoom(newZoom);
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  };

  const handleResetView = () => {
    setOffsetX(0);
    setOffsetY(0);
    setZoom(1);
  };

  const togglePanTool = () => {
    setActiveTool((prev) => (prev === "pan" ? tool : "pan"));
  };

  // Handle undo action
  const handleUndo = () => {
    if (drawHistory.length === 0) return;

    // Move the last drawing action to the redo stack
    const lastAction = drawHistory[drawHistory.length - 1];
    setRedoStack((prev) => [...prev, lastAction]);

    // Remove the last action from history
    setDrawHistory((prev) => prev.slice(0, -1));

    // Broadcast the undo action to collaborators
    broadcast({
      type: EVENT_TYPES.UNDO
    });
  };

  // Handle redo action
  const handleRedo = () => {
    if (redoStack.length === 0) return;

    // Move the last undone action back to the drawing history
    const lastUndoneAction = redoStack[redoStack.length - 1];
    setDrawHistory((prev) => [...prev, lastUndoneAction]);

    // Remove the action from the redo stack
    setRedoStack((prev) => prev.slice(0, -1));

    // Broadcast the redo action to collaborators
    broadcast({
      type: EVENT_TYPES.REDO
    });
  };

  // Clear the entire canvas
  const clearCanvas = () => {
    if (
      drawHistory.length > 0 &&
      window.confirm(
        "Are you sure you want to clear the canvas? This action cannot be undone."
      )
    ) {
      setDrawHistory([]);
      setRedoStack([]);

      // Broadcast the clear action to collaborators
      broadcast({
        type: EVENT_TYPES.CLEAR_CANVAS
      });
    }
  };

  // Export canvas as PNG image
  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas for export that includes only the drawing content
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");

    // Determine bounds of the content to create a properly sized export
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // Find the bounds of all drawing content
    drawHistory.forEach((stroke) => {
      try {
        if (stroke.tool === "pen") {
          stroke.points.forEach((point) => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
        } else if (stroke.points && stroke.points[0]) {
          const { x1, y1, x2, y2 } = stroke.points[0];
          minX = Math.min(minX, x1, x2);
          minY = Math.min(minY, y1, y2);
          maxX = Math.max(maxX, x1, x2);
          maxY = Math.max(maxY, y1, y2);
        }
      } catch (error) {
        console.error("Error processing stroke for export:", error);
      }
    });

    // If no content, use the visible area
    if (minX === Infinity) {
      minX = -offsetX / zoom;
      minY = -offsetY / zoom;
      maxX = (canvasSize.width - offsetX) / zoom;
      maxY = (canvasSize.height - offsetY) / zoom;
    }

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Set export canvas size
    const width = maxX - minX;
    const height = maxY - minY;

    // Ensure we have positive dimensions
    if (width <= 0 || height <= 0) {
      alert("Cannot export: The drawing is too small or empty.");
      return;
    }

    exportCanvas.width = width;
    exportCanvas.height = height;

    // Set background color
    ctx.fillStyle = theme === "dark" ? "black" : "white";
    ctx.fillRect(0, 0, width, height);

    // Draw content on export canvas
    ctx.save();
    ctx.translate(-minX, -minY);

    // Draw all strokes
    drawHistory.forEach((stroke) => {
      try {
        const color = stroke.color;
        ctx.strokeStyle = color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (stroke.tool === "pen") {
          const points = stroke.points;
          if (!points || points.length < 2) return;

          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);

          if (points.length === 2) {
            // For just two points, draw a straight line
            ctx.lineTo(points[1].x, points[1].y);
          } else {
            // For more points, use the smooth curve approach
            for (let i = 1; i < points.length - 2; i++) {
              const xc = (points[i].x + points[i + 1].x) / 2;
              const yc = (points[i].y + points[i + 1].y) / 2;
              ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }

            // Handle the last two points separately
            const lastIdx = points.length - 1;
            const secondLastIdx = points.length - 2;
            ctx.quadraticCurveTo(
              points[secondLastIdx].x,
              points[secondLastIdx].y,
              points[lastIdx].x,
              points[lastIdx].y
            );
          }

          ctx.stroke();
        } else if (stroke.points && stroke.points[0]) {
          // Handle other shapes
          const { x1, y1, x2, y2 } = stroke.points[0];
          const w = x2 - x1;
          const h = y2 - y1;

          ctx.beginPath();
          if (stroke.tool === "line") {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          } else if (stroke.tool === "rect") {
            ctx.strokeRect(x1, y1, w, h);
          } else if (stroke.tool === "ellipse") {
            ctx.ellipse(
              x1 + w / 2,
              y1 + h / 2,
              Math.abs(w / 2),
              Math.abs(h / 2),
              0,
              0,
              2 * Math.PI
            );
          }
          ctx.stroke();
        }
      } catch (error) {
        console.error("Error drawing stroke during export:", error);
      }
    });

    ctx.restore();

    try {
      // Create download link
      const link = document.createElement("a");
      link.download = `drawsync-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error creating download link:", error);
      alert(
        "Failed to generate export. The canvas might be too large or contain invalid data."
      );
    }
  };

  // Helper function to invert colors when needed (for dark mode)
  const invertColorIfNeeded = (color) => {
    if (!color) return theme === "dark" ? "#ffffff" : "#000000";

    // If using default colors, invert based on theme
    if (color === "#000000" && theme === "dark") {
      return "#ffffff";
    }
    if (color === "#ffffff" && theme === "light") {
      return "#000000";
    }
    return color;
  };

  // Update canvas when transforms change
  useEffect(() => {
    redrawCanvas();
  }, [offsetX, offsetY, zoom, theme, drawHistory, redoStack.length]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      else if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Space key for panning
      else if (e.key === " " && !isPanning) {
        e.preventDefault();
        setIsPanning(true);
        document.body.style.cursor = "grab";
      }
      // Escape key to stop drawing or panning
      else if (e.key === "Escape") {
        e.preventDefault();
        setDrawing(false);
        setIsPanning(false);
        setStartPos(null);
        setCurrentPreview(null);
        document.body.style.cursor = "default";
      }
      // Clear canvas: Ctrl+Shift+C
      else if (e.ctrlKey && e.shiftKey && e.key === "c") {
        e.preventDefault();
        clearCanvas();
      }
      // Export canvas: Ctrl+S
      else if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        exportCanvas();
      }
      // Reset view: Ctrl+R
      else if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        handleResetView();
      }
      // Eraser: E
      else if (e.key === "e" && !e.ctrlKey) {
        e.preventDefault();
        setActiveTool("eraser");
      }
    };

    const handleKeyUp = (e) => {
      // Release panning when space key is released
      if (e.key === " ") {
        e.preventDefault();
        setIsPanning(false);
        document.body.style.cursor = "default";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPanning]);

  const touchHandlers = useTouchEvents({
  onStart: startDrawing,
  onMove: draw,
  onEnd: stopDrawing
});

  // Render remote cursors to show other users' positions
  const RemoteCursors = () => {
    return (
      <>
        {others.map((user) => {
          if (!user?.presence?.cursor) return null;
          
          // Safely convert connectionId to string if it's not already
          const connectionId = String(user.connectionId || '');
          
          // Generate a stable color based on the connection ID
          const color = `hsl(${parseInt(connectionId.slice(-3) || '0', 16) % 360}, 80%, 60%)`;
          
          // Convert cursor position from screen to canvas coordinates
          const cursorX = user.presence.cursor.x;
          const cursorY = user.presence.cursor.y;
          
          return (
            <div
              key={connectionId}
              className="absolute pointer-events-none z-50"
              style={{
                left: `${cursorX}px`,
                top: `${cursorY}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Cursor icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 1L10.1329 23L12.8339 13.926L23 10.0199L1 1Z"
                  fill={color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              
              {/* User label - safely handle the connection ID */}
              <span 
                className="mt-1 px-1.5 py-0.5 text-xs font-medium text-white rounded-md whitespace-nowrap absolute left-1/2 -translate-x-1/2 top-full"
                style={{ backgroundColor: color }}
              >
                User {connectionId.slice(0, 4) || 'Unknown'}
              </span>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-[100vh] overflow-hidden relative border border-gray-300 dark:border-gray-700 rounded-lg"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
         onTouchStart={touchHandlers.handleTouchStart}
  onTouchMove={touchHandlers.handleTouchMove}
  onTouchEnd={touchHandlers.handleTouchEnd}
  onTouchCancel={touchHandlers.handleTouchEnd}
        onWheel={handleWheel}
        className={`bg-white dark:bg-black w-full h-full ${
          viewOnly 
            ? "cursor-default" 
            : activeTool === "pan"
            ? "cursor-move"
            : activeTool === "eraser"
            ? "cursor-crosshair"
            : "cursor-crosshair"
        }`}
        style={{ touchAction: "none" }}
      />

      {/* Remote Cursors */}
      <RemoteCursors />
      
      {/* Eraser size indicator */}
      {activeTool === "eraser" && <EraserIndicator />}

      {/* Current transform indicators */}
      <div className="fixed left-4 top-20 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded px-3 py-2 text-xs font-mono shadow-md">
        Zoom: {(zoom * 100).toFixed(0)}% | X: {Math.round(offsetX)} | Y:{" "}
        {Math.round(offsetY)}
      </div>

      {/* Drawing tools */}
     <div className="fixed right-4 bottom-1/2 transform translate-y-1/2 z-50 flex flex-col justify-center items-center p-2 gap-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg shadow-lg">
        <button
          onClick={togglePanTool}
          title={
            activeTool === "pan"
              ? "Switch to Draw Mode"
              : "Switch to Pan Mode (Space)"
          }
          className={`p-2 rounded-full ${
            activeTool === "pan"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          } hover:opacity-90 transition-colors`}
        >
          <Move size={18} />
        </button>

        <div className="w-full h-px bg-gray-300 dark:bg-gray-600 my-1"></div>

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <ZoomOut size={18} />
        </button>

        <button
          onClick={handleResetView}
          title="Reset View (Ctrl+R)"
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"></path>
            <path d="M3 12h18"></path>
            <path d="M12 3v18"></path>
          </svg>
        </button>

        {!viewOnly && <div className="w-full h-px bg-gray-300 dark:bg-gray-600 my-1"></div>}

        {!viewOnly && <button
          onClick={handleUndo}
          title="Undo (Ctrl+Z)"
          className={`p-2 rounded-full ${
            drawHistory.length === 0 ? "opacity-50" : ""
          } bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors`}
          disabled={drawHistory.length === 0}
        >
          <Undo size={18} />
        </button>}

        {!viewOnly && <button
          onClick={handleRedo}
          title="Redo (Ctrl+Y)"
          className={`p-2 rounded-full ${
            redoStack.length === 0 ? "opacity-50" : ""
          } bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors`}
          disabled={redoStack.length === 0}
        >
          <Redo size={18} />
        </button>}

        <div className="w-full h-px bg-gray-300 dark:bg-gray-600 my-1"></div>

        <button
          onClick={exportCanvas}
          title="Export as PNG (Ctrl+S)"
          disabled={drawHistory.length === 0}
          className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        >
          <Download size={18} />
        </button>

        {!viewOnly && <button
          onClick={clearCanvas}
          title="Clear Canvas (Ctrl+Shift+C)"
          className={`p-2 rounded-full ${
            drawHistory.length === 0 ? "opacity-50" : ""
          } bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors`}
          disabled={drawHistory.length === 0}
        >
          <Delete size={18} />
        </button>}
      </div>
    </div>
  );
}