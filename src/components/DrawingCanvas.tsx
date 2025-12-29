import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { useInkEngine } from "../hooks/useInkEngine";
import { db, type DrawingStroke } from "../lib/db";
import { processStrokeJS } from "../lib/js-ink-engine";
import { useTaskStore } from "../store/taskStore";
import { useUIStore, type DrawingTool } from "../store/uiStore";
import { yStrokes, awareness } from "../lib/sync";
import type { StrokeShape } from "../lib/db";
import PerformanceMonitor from "./PerformanceMonitor";
import { createWorker } from 'tesseract.js';

const CanvasContainer = styled.div<{ $tool: DrawingTool }>`
  position: absolute;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: ${(props) => {
    switch (props.$tool) {
      case "pan":
        return "grab";
      case "eraser":
      case "circle":
      case "rectangle":
      case "triangle":
        return "cell";
      case "lasso":
        return "crosshair";
      case "magic":
        return "wait"; 
      default:
        return "crosshair";
    }
  }};
  &:active {
    cursor: ${(props) => (props.$tool === "pan" ? "grabbing" : "crosshair")};
  }
`;

const StyledCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  background-color: transparent;
  width: 100%;
  height: 100%;
`;

interface AppPoint {
  x: number;
  y: number;
  pressure: number;
}

const DrawingCanvas: React.FC = () => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<AppPoint | null>(null);
  const localStroke = useRef<Partial<DrawingStroke>>({});
  const selectionPath = useRef<AppPoint[]>([]); // For lasso selection polygon
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<Set<string>>(new Set());
  const isDraggingSelection = useRef(false);
  const dragStartOffset = useRef<{ x: number, y: number } | null>(null);
  
  // Magic Tool State
  const magicStrokesRef = useRef<DrawingStroke[]>([]);
  const magicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const { processStroke, isLoaded } = useInkEngine();
  const activeTaskId = useTaskStore((state) => state.activeTaskId);
  const canvasRevision = useTaskStore((state) => state.canvasRevision);
  const addTask = useTaskStore((state) => state.addTask);
  
  const selectedColor = useUIStore((state) => state.selectedColor);
  const drawingTool = useUIStore((state) => state.drawingTool);
  const panOffset = useUIStore((state) => state.panOffset);
  const zoom = useUIStore((state) => state.zoom);
  const setPanOffset = useUIStore((state) => state.setPanOffset);
  const setZoom = useUIStore((state) => state.setZoom);
  const shapeText = useUIStore((state) => state.shapeText);
  const colors = useUIStore((state) => state.colors);
  const engineType = useUIStore((state) => state.engineType);
  const setLastStrokePerformance = useUIStore((state) => state.setLastStrokePerformance);

  const existingStrokes = useRef<DrawingStroke[]>([]);
  const remoteStrokes = useRef(new Map<number, { drawing?: DrawingStroke }>());
  const animationFrameRef = useRef<number>();
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const getTransformedContext = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);
  }, [panOffset, zoom]);

  const getShapeBounds = (shape: DrawingStroke) => {
    switch (shape.type) {
      case "rectangle":
        return {
          minX: Math.min(shape.x, shape.x + shape.width),
          maxX: Math.max(shape.x, shape.x + shape.width),
          minY: Math.min(shape.y, shape.y + shape.height),
          maxY: Math.max(shape.y, shape.y + shape.height),
        };
      case "circle":
        return {
          minX: shape.cx - shape.radius,
          maxX: shape.cx + shape.radius,
          minY: shape.cy - shape.radius,
          maxY: shape.cy + shape.radius,
        };
      case "triangle": {
        const xs = [shape.p1.x, shape.p2.x, shape.p3.x];
        const ys = [shape.p1.y, shape.p2.y, shape.p3.y];
        return {
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys),
        };
      }
      case "stroke": {
         if (shape.points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
         let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
         for (const p of shape.points) {
             if (p.x < minX) minX = p.x;
             if (p.x > maxX) maxX = p.x;
             if (p.y < minY) minY = p.y;
             if (p.y > maxY) maxY = p.y;
         }
         return { minX, maxX, minY, maxY };
      }
      default:
        return {
          minX: -Infinity,
          minY: -Infinity,
          maxX: Infinity,
          maxY: Infinity,
        };
    }
  };

  const isPointInPolygon = (point: { x: number, y: number }, polygon: AppPoint[]) => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].x, yi = polygon[i].y;
          const xj = polygon[j].x, yj = polygon[j].y;
          
          const intersect = ((yi > point.y) !== (yj > point.y))
              && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
      }
      return inside;
  };

  const drawTextInShape = (
    ctx: CanvasRenderingContext2D,
    text: string,
    shape: DrawingStroke
  ) => {
    let centerX = 0;
    let centerY = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    switch (shape.type) {
      case "rectangle":
        centerX = shape.x + shape.width / 2;
        centerY = shape.y + shape.height / 2;
        maxWidth = Math.abs(shape.width) * 0.9;
        maxHeight = Math.abs(shape.height) * 0.9;
        break;
      case "circle":
        centerX = shape.cx;
        centerY = shape.cy;
        maxWidth = shape.radius * 1.4;
        maxHeight = shape.radius * 1.4;
        break;
      case "triangle":
        centerX = (shape.p1.x + shape.p2.x + shape.p3.x) / 3;
        centerY = (shape.p1.y + shape.p2.y + shape.p3.y) / 3;
        const xs = [shape.p1.x, shape.p2.x, shape.p3.x];
        const ys = [shape.p1.y, shape.p2.y, shape.p3.y];
        maxWidth = (Math.max(...xs) - Math.min(...xs)) * 0.7;
        maxHeight = (Math.max(...ys) - Math.min(...ys)) * 0.7;
        break;
      default:
        return;
    }

    const words = text.split(" ");
    const lines = [];
    let fontSize = Math.min(maxHeight, maxWidth / 2);

    ctx.font = `${fontSize / zoom}px 'Inter', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    while(fontSize > 1) {
      const testFont = `${fontSize / zoom}px 'Inter', sans-serif`;
      ctx.font = testFont;
      const testLines = [];
      let currentLine = '';
      for(const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if(ctx.measureText(testLine).width > maxWidth) {
          testLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      testLines.push(currentLine);

      const lineHeight = fontSize / zoom * 1.2;
      if(testLines.length * lineHeight <= maxHeight) {
        lines.push(...testLines);
        break;
      }

      fontSize -= 2;
    }
    
    if(!lines.length) return;

    const lineHeight = fontSize / zoom * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    let startY = centerY - totalTextHeight / 2 + lineHeight / 2;

    lines.forEach((l, index) => {
      ctx.fillText(l, centerX, startY + index * lineHeight);
    });
  };

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: DrawingStroke) => {
      const isSelected = selectedStrokeIds.has(shape.id);
      
      ctx.strokeStyle = isSelected ? colors.accent : (shape.color || colors.text);
      ctx.fillStyle = isSelected ? colors.accent : (shape.color || colors.text);
      ctx.lineWidth = (isSelected ? 3 : 2) / zoom;
      
      if (isSelected) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = colors.accent;
      } else {
          ctx.shadowBlur = 0;
      }

      switch (shape.type) {
        case "stroke": {
          const t0 = performance.now();
          
          const processed =
            engineType === "wasm"
              ? processStroke(shape.points)
              : processStrokeJS(shape.points);
          
          const t1 = performance.now();
          setLastStrokePerformance(t1 - t0);

          if (processed.length < 2) return;
          
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          for (let i = 0; i < processed.length - 1; i++) {
            const p1 = processed[i];
            const p2 = processed[i + 1];

            const avgPressure = (p1.pressure + p2.pressure) / 2;
            
            ctx.lineWidth = (avgPressure * 5 + 1) / zoom;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          break;
        }
        case "rectangle":
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          if (shape.text) {
            drawTextInShape(ctx, shape.text, shape);
          }
          break;
        case "circle":
          ctx.beginPath();
          ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
          ctx.stroke();
          if (shape.text) {
            drawTextInShape(ctx, shape.text, shape);
          }
          break;
        case "triangle":
          ctx.beginPath();
          ctx.moveTo(shape.p1.x, shape.p1.y);
          ctx.lineTo(shape.p2.x, shape.p2.y);
          ctx.lineTo(shape.p3.x, shape.p3.y);
          ctx.closePath();
          ctx.stroke();
          if (shape.text) {
            drawTextInShape(ctx, shape.text, shape);
          }
          break;
      }
      ctx.shadowBlur = 0;
    },
    [processStroke, zoom, colors.text, engineType, setLastStrokePerformance, selectedStrokeIds, colors.accent]
  );

  const redrawAllShapes = useCallback(() => {
    const ctx = mainCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    getTransformedContext(ctx);
    existingStrokes.current.forEach((shape) => drawShape(ctx, shape));
    ctx.restore();
  }, [drawShape, getTransformedContext]);

  const getStrokeUnderPoint = useCallback(
    (point: { x: number; y: number }): string | null => {
      const eraserRadius = 10 / zoom;
      for (let i = existingStrokes.current.length - 1; i >= 0; i--) {
        const shape = existingStrokes.current[i];
        switch (shape.type) {
          case "stroke":
            if (
              shape.points.some(
                (p) =>
                  Math.sqrt(
                    Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)
                  ) < eraserRadius
              )
            )
              return shape.id;
            break;
          default: {
            const { minX, maxX, minY, maxY } = getShapeBounds(shape);
            if (
              point.x > minX &&
              point.x < maxX &&
              point.y > minY &&
              point.y < maxY
            )
              return shape.id;
            break;
          }
        }
      }
      return null;
    },
    [zoom]
  );

  const eraseAtPoint = useCallback(
    (point: { x: number; y: number }) => {
      const strokeIdToDelete = getStrokeUnderPoint(point);
      if (strokeIdToDelete) {
        const indexToDelete = yStrokes()
          .toArray()
          .findIndex((s) => s.id === strokeIdToDelete);
        if (indexToDelete > -1) {
          yStrokes().delete(indexToDelete, 1);
        }
      }
    },
    [getStrokeUnderPoint]
  );

  // OCR Processing Logic
  const processOCR = async () => {
      if (magicStrokesRef.current.length === 0) return;
      
      setIsProcessingOCR(true);
      const worker = await createWorker('eng');
      
      try {
          // 1. Calculate bounding box of all magic strokes
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          
          magicStrokesRef.current.forEach(stroke => {
              if (stroke.type === 'stroke') {
                  stroke.points.forEach(p => {
                      minX = Math.min(minX, p.x);
                      maxX = Math.max(maxX, p.x);
                      minY = Math.min(minY, p.y);
                      maxY = Math.max(maxY, p.y);
                  });
              }
          });
          
          // Add padding
          const padding = 20;
          minX -= padding; minY -= padding;
          maxX += padding; maxY += padding;
          const width = maxX - minX;
          const height = maxY - minY;

          // 2. Draw these strokes onto a temporary white canvas for OCR
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const ctx = tempCanvas.getContext('2d');
          if (!ctx) return;
          
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.translate(-minX, -minY);
          
          // Draw plain black lines for best OCR contrast
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          magicStrokesRef.current.forEach(stroke => {
              if (stroke.type === 'stroke' && stroke.points.length > 1) {
                  ctx.beginPath();
                  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                  for(let i=1; i<stroke.points.length; i++) {
                      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                  }
                  ctx.stroke();
              }
          });

          // 3. Recognize
          const { data: { text } } = await worker.recognize(tempCanvas);
          
          if (text && text.trim().length > 0) {
              const cleanText = text.trim();
              addTask(cleanText, 'personal'); // Add to tasks
              
              // Remove the ink strokes from Yjs
              const strokeIdsToRemove = new Set(magicStrokesRef.current.map(s => s.id));
              yStrokes().doc?.transact(() => {
                  const arr = yStrokes().toArray();
                  for(let i=arr.length-1; i>=0; i--) {
                      if (strokeIdsToRemove.has(arr[i].id)) {
                          yStrokes().delete(i, 1);
                      }
                  }
              });
          }
      } catch (e) {
          console.error("OCR Failed", e);
      } finally {
          await worker.terminate();
          magicStrokesRef.current = [];
          setIsProcessingOCR(false);
      }
  };


  useEffect(() => {
    const loop = () => {
      animationFrameRef.current = requestAnimationFrame(loop);
      const bufferCtx = bufferCanvasRef.current?.getContext("2d");
      if (!bufferCtx) return;

      getTransformedContext(bufferCtx);

      if (isDrawing && localStroke.current.type) {
        drawShape(bufferCtx, localStroke.current as DrawingStroke);
      }

      remoteStrokes.current.forEach((state) => {
        if (state.drawing) {
          drawShape(bufferCtx, state.drawing);
        }
      });

      if (drawingTool === 'lasso' && isDrawing && selectionPath.current.length > 0) {
          bufferCtx.strokeStyle = colors.accent;
          bufferCtx.lineWidth = 1 / zoom;
          bufferCtx.setLineDash([5, 5]);
          bufferCtx.beginPath();
          bufferCtx.moveTo(selectionPath.current[0].x, selectionPath.current[0].y);
          for (let i = 1; i < selectionPath.current.length; i++) {
              bufferCtx.lineTo(selectionPath.current[i].x, selectionPath.current[i].y);
          }
          bufferCtx.stroke();
          bufferCtx.setLineDash([]);
      }

      if (drawingTool === "eraser") {
        bufferCtx.beginPath();
        bufferCtx.arc(
          lastMousePosition.current.x,
          lastMousePosition.current.y,
          10 / zoom,
          0,
          Math.PI * 2
        );
        bufferCtx.strokeStyle = colors.accent;
        bufferCtx.lineWidth = 1 / zoom;
        bufferCtx.stroke();
      }

      bufferCtx.restore();
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameRef.current!);
    };
  }, [isDrawing, drawShape, drawingTool, zoom, getTransformedContext, colors.accent]);

  useEffect(() => {
    if (!isLoaded) return;

    const handleObserve = () => {
      existingStrokes.current = yStrokes().toArray();
      redrawAllShapes();
    };

    yStrokes().observe(handleObserve);

    const handleAwarenessChange = () => {
      const awarenessInstance = awareness();
      if (!awarenessInstance) return;
      const states = awarenessInstance.getStates();
      remoteStrokes.current.clear();
      states.forEach((state, clientID) => {
        if (clientID !== awarenessInstance.clientID) {
          remoteStrokes.current.set(clientID, state);
        }
      });
    };

    awareness()?.on('change', handleAwarenessChange);

    return () => {
      yStrokes().unobserve(handleObserve);
      awareness()?.off('change', handleAwarenessChange);
    };
  }, [isLoaded, redrawAllShapes]);

  useEffect(() => {
    if (!isLoaded) return;
    const reconcileAndLoadStrokes = async () => {
      const localStrokes = await db.drawingStrokes
        .where("taskId")
        .equals(activeTaskId || "")
        .toArray();
      const yjsStrokesArr = yStrokes().toArray();
      const allStrokesMap = new Map<string, DrawingStroke>();
      localStrokes.forEach((s) => allStrokesMap.set(s.id, s));
      yjsStrokesArr.forEach((s) => allStrokesMap.set(s.id, s));
      existingStrokes.current = Array.from(allStrokesMap.values());
      redrawAllShapes();
    };
    reconcileAndLoadStrokes();
  }, [isLoaded, activeTaskId, canvasRevision, redrawAllShapes]);

  useEffect(() => {
    const canvas = mainCanvasRef.current;
    const buffer = bufferCanvasRef.current;
    if (!canvas || !buffer) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = buffer.width = rect.width * dpr;
      canvas.height = buffer.height = rect.height * dpr;
      redrawAllShapes();
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, [redrawAllShapes]);

  const getScreenToWorldCoordinates = useCallback(
    (screenX: number, screenY: number) => {
      const rect = mainCanvasRef.current!.getBoundingClientRect();
      return {
        x: (screenX - rect.left - panOffset.x) / zoom,
        y: (screenY - rect.top - panOffset.y) / zoom,
      };
    },
    [panOffset, zoom]
  );

  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const gestureState = useRef<"drawing" | "panning" | "selection" | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!isLoaded || isProcessingOCR) return;
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.current.size === 1) {
        const { drawingInputMode } = useUIStore.getState();
        if (
          drawingTool !== "pan" &&
          drawingInputMode === "pen" &&
          e.pointerType === "touch"
        ) {
          return;
        }

        const point = getScreenToWorldCoordinates(e.clientX, e.clientY);
        setStartPoint({ ...point, pressure: e.pressure || 0.5 });
        setIsDrawing(true);
        
        // Clear magic timer if user starts drawing again
        if (magicTimerRef.current) {
            clearTimeout(magicTimerRef.current);
            magicTimerRef.current = null;
        }

        if (drawingTool === "pan") {
          gestureState.current = "panning";
        } else if (drawingTool === "lasso") {
           const clickedStrokeId = getStrokeUnderPoint(point);
           if (clickedStrokeId && selectedStrokeIds.has(clickedStrokeId)) {
               isDraggingSelection.current = true;
               dragStartOffset.current = point;
               gestureState.current = "selection";
           } else {
               gestureState.current = "selection";
               selectionPath.current = [{ ...point, pressure: 0 }];
               setSelectedStrokeIds(new Set());
               isDraggingSelection.current = false;
           }
        } else {
          gestureState.current = "drawing";
        }

        if (gestureState.current === "drawing") {
          const baseStroke = {
            id: `stroke-${awareness()?.clientID}-${Date.now()}`,
            color: drawingTool === 'magic' ? colors.secondaryAccent : selectedColor,
            clientID: awareness()?.clientID,
          };

          if (drawingTool === "pen" || drawingTool === "magic") {
            localStroke.current = {
              ...baseStroke,
              type: "stroke",
              points: [{ ...point, pressure: e.pressure || 0.5 }],
            };
          } else if (drawingTool === "rectangle") {
            localStroke.current = {
              ...baseStroke,
              type: "rectangle",
              x: point.x,
              y: point.y,
              width: 0,
              height: 0,
            };
          } else if (drawingTool === "circle") {
            localStroke.current = {
              ...baseStroke,
              type: "circle",
              cx: point.x,
              cy: point.y,
              radius: 0,
            };
          } else if (drawingTool === "triangle") {
            localStroke.current = {
              ...baseStroke,
              type: "triangle",
              p1: { ...point },
              p2: { ...point },
              p3: { ...point },
            };
          } else if (drawingTool === "eraser") {
            eraseAtPoint(point);
          }
          if (drawingTool !== "pan" && drawingTool !== "eraser" && drawingTool !== "lasso") {
            awareness()?.setLocalStateField("drawing", localStroke.current);
          }
        }
      }
    },
    [
      isLoaded,
      drawingTool,
      getScreenToWorldCoordinates,
      eraseAtPoint,
      selectedColor,
      awareness,
      zoom,
      getStrokeUnderPoint,
      selectedStrokeIds,
      isProcessingOCR,
      colors.secondaryAccent
    ]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!activePointers.current.has(e.pointerId)) return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (
        gestureState.current === "panning" &&
        isDrawing &&
        activePointers.current.size === 1
      ) {
        setPanOffset({
          x: panOffset.x + e.movementX,
          y: panOffset.y + e.movementY,
        });
        return;
      }

      const currentPoint = getScreenToWorldCoordinates(e.clientX, e.clientY);
      lastMousePosition.current = currentPoint;

      if (gestureState.current === "selection" && isDrawing) {
          if (isDraggingSelection.current && dragStartOffset.current) {
               const dx = currentPoint.x - dragStartOffset.current.x;
               const dy = currentPoint.y - dragStartOffset.current.y;
               
               const yStrokesArray = yStrokes();
               
               yStrokes().doc?.transact(() => {
                   selectedStrokeIds.forEach(id => {
                       const index = yStrokesArray.toArray().findIndex(s => s.id === id);
                       if (index !== -1) {
                           const stroke = yStrokesArray.get(index);
                           const newStroke = { ...stroke };
                           
                           if (newStroke.type === 'stroke') {
                               newStroke.points = newStroke.points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
                           } else if (newStroke.type === 'rectangle') {
                               newStroke.x += dx;
                               newStroke.y += dy;
                           } else if (newStroke.type === 'circle') {
                               newStroke.cx += dx;
                               newStroke.cy += dy;
                           } else if (newStroke.type === 'triangle') {
                               newStroke.p1 = { x: newStroke.p1.x + dx, y: newStroke.p1.y + dy };
                               newStroke.p2 = { x: newStroke.p2.x + dx, y: newStroke.p2.y + dy };
                               newStroke.p3 = { x: newStroke.p3.x + dx, y: newStroke.p3.y + dy };
                           }
                           
                           yStrokesArray.delete(index, 1);
                           yStrokesArray.insert(index, [newStroke]);
                       }
                   });
               });
               
               dragStartOffset.current = currentPoint;
               redrawAllShapes();
          } else {
              selectionPath.current.push({ ...currentPoint, pressure: 0 });
          }
          return;
      }

      if (gestureState.current === "drawing" && isDrawing) {
        if (drawingTool === "eraser") {
          eraseAtPoint(currentPoint);
          return;
        }

        if (!startPoint) return;

        let updatedStroke: Partial<DrawingStroke> | null = null;
        const textPayload = shapeText ? { text: shapeText } : {};

        switch (drawingTool) {
          case "pen": 
          case "magic": {
            const currentPenStroke =
              localStroke.current as Partial<StrokeShape>;
            updatedStroke = {
              ...currentPenStroke,
              type: "stroke",
              points: [
                ...(currentPenStroke.points || []),
                { ...currentPoint, pressure: e.pressure || 0.5 },
              ],
            };
            break;
          }
          case "rectangle": {
            updatedStroke = {
              ...localStroke.current,
              type: "rectangle",
              x: startPoint.x,
              y: startPoint.y,
              width: currentPoint.x - startPoint.x,
              height: currentPoint.y - startPoint.y,
              ...textPayload,
            };
            break;
          }
          case "circle": {
            const dx = currentPoint.x - startPoint.x;
            const dy = currentPoint.y - startPoint.y;
            updatedStroke = {
              ...localStroke.current,
              type: "circle",
              cx: startPoint.x,
              cy: startPoint.y,
              radius: Math.sqrt(dx * dx + dy * dy),
              ...textPayload,
            };
            break;
          }
          case "triangle": {
            const p1 = startPoint;
            const p2 = { x: currentPoint.x, y: currentPoint.y };
            const midX = (p1.x + p2.x) / 2;
            const p3 = { x: midX, y: p1.y - (p2.x - p1.x) * 0.5 };
            updatedStroke = {
              ...localStroke.current,
              type: "triangle",
              p1,
              p2,
              p3,
              ...textPayload,
            };
            break;
          }
        }
        if (updatedStroke) {
          localStroke.current = updatedStroke;
          awareness()?.setLocalStateField("drawing", updatedStroke);
        }
      }
    },
    [
      isDrawing,
      drawingTool,
      startPoint,
      panOffset,
      getScreenToWorldCoordinates,
      setZoom,
      setPanOffset,
      eraseAtPoint,
      shapeText,
      selectedStrokeIds,
      redrawAllShapes
    ]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
      activePointers.current.delete(e.pointerId);

      if (activePointers.current.size < 1) {
          
        if (gestureState.current === "selection") {
            if (!isDraggingSelection.current && selectionPath.current.length > 2) {
                const newSelection = new Set<string>();
                existingStrokes.current.forEach(stroke => {
                    let inside = false;
                    const bounds = getShapeBounds(stroke);
                    
                    const pointsToCheck = [
                        { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 },
                        { x: bounds.minX, y: bounds.minY },
                        { x: bounds.maxX, y: bounds.maxY }
                    ];
                    
                    if (stroke.type === 'stroke') {
                        if (stroke.points.some(p => isPointInPolygon(p, selectionPath.current))) {
                            inside = true;
                        }
                    } else {
                         if (pointsToCheck.some(p => isPointInPolygon(p, selectionPath.current))) {
                             inside = true;
                         }
                    }
                    
                    if (inside) {
                        newSelection.add(stroke.id);
                    }
                });
                setSelectedStrokeIds(newSelection);
                redrawAllShapes();
            }
            selectionPath.current = [];
            isDraggingSelection.current = false;
        } else if (gestureState.current === "drawing" && localStroke.current.type) {
          const isShapeTool =
            drawingTool === "rectangle" ||
            drawingTool === "circle" ||
            drawingTool === "triangle";
          const finalShape = {
            ...localStroke.current,
            text: isShapeTool ? shapeText : undefined,
          } as DrawingStroke;

          if (
            !(
              finalShape.type === "stroke" &&
              (!finalShape.points || finalShape.points.length < 2)
            )
          ) {
            yStrokes().push([finalShape]);
            
            // Magic Tool: Queue for processing
            if (drawingTool === 'magic') {
                magicStrokesRef.current.push(finalShape);
                if (magicTimerRef.current) clearTimeout(magicTimerRef.current);
                magicTimerRef.current = setTimeout(processOCR, 1500); // 1.5s delay before processing
            }
          }
        }

        gestureState.current = null;
        setIsDrawing(false);
        setStartPoint(null);
        localStroke.current = {};
        awareness()?.setLocalStateField("drawing", null);
      }
    },
    [drawingTool, shapeText, awareness, yStrokes, getShapeBounds, redrawAllShapes]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
      setZoom(Math.max(0.1, Math.min(newZoom, 10)));
    },
    [zoom, setZoom]
  );

  return (
    <CanvasContainer
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      $tool={drawingTool}
    >
      <StyledCanvas ref={mainCanvasRef} />
      <StyledCanvas ref={bufferCanvasRef} />
      {isProcessingOCR && (
          <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              background: '#238636', color: 'white', padding: '5px 10px', borderRadius: '5px',
              fontFamily: 'sans-serif', fontSize: '0.8rem', pointerEvents: 'none'
          }}>
              Processing Text...
          </div>
      )}
      <PerformanceMonitor />
    </CanvasContainer>
  );
};

export default DrawingCanvas;