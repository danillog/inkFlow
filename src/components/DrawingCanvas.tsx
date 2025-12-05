import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { useInkEngine } from "../hooks/useInkEngine";
import { db, type DrawingStroke } from "../lib/db";
import { useTaskStore } from "../store/taskStore";
import { useUIStore, type DrawingTool } from "../store/uiStore";
import { yStrokes, awareness } from "../lib/sync";
import type { StrokeShape } from "../lib/db";

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
      case "circle": // Added circle to be eraser-like if using touch
      case "rectangle": // Added rectangle to be eraser-like if using touch
      case "triangle": // Added triangle to be eraser-like if using touch
        return "cell";
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

  const { processStroke, isLoaded } = useInkEngine();
  const activeTaskId = useTaskStore((state) => state.activeTaskId);
  const canvasRevision = useTaskStore((state) => state.canvasRevision);
  const {
    selectedColor,
    drawingTool,
    panOffset,
    zoom,
    setPanOffset,
    setZoom,
    shapeText,
    colors,
  } = useUIStore();

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
      default:
        return {
          minX: -Infinity,
          minY: -Infinity,
          maxX: Infinity,
          maxY: Infinity,
        };
    }
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
    let line = "";
    const lines = [];
    let fontSize = Math.min(maxHeight, maxWidth / 2); // Start with a reasonable guess

    ctx.font = `${
      fontSize / zoom
    }px 'Inter', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Function to check if text fits
    const doesTextFit = (currentLines: string[], currentFontSize: number) => {
      const testFont = `${
        currentFontSize / zoom
      }px 'Inter', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji'`;
      ctx.font = testFont;
      const lineHeight = currentFontSize / zoom * 1.2;
      if (currentLines.length * lineHeight > maxHeight) return false;
      for(const l of currentLines) {
        if(ctx.measureText(l).width > maxWidth) return false;
      }
      return true;
    }

    // Reduce font size until it fits
    while(fontSize > 1) {
      const testFont = `${
        fontSize / zoom
      }px 'Inter', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji'`;
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

      fontSize -= 2; // Reduce font size and try again
    }
    
    if(!lines.length) return; // Cant fit text

    const lineHeight = fontSize / zoom * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    let startY = centerY - totalTextHeight / 2 + lineHeight / 2;

    lines.forEach((l, index) => {
      ctx.fillText(l, centerX, startY + index * lineHeight);
    });
  };

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: DrawingStroke) => {
      ctx.strokeStyle = shape.color || colors.text;
      ctx.fillStyle = shape.color || colors.text;
      ctx.lineWidth = 2 / zoom;

      switch (shape.type) {
        case "stroke": {
          const processed = processStroke(shape.points);
          if (processed.length === 0) return;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(processed[0].x, processed[0].y);
          processed.forEach((point) => {
            ctx.lineWidth = (point.pressure * 5 + 1) / zoom;
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
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
    },
    [processStroke, zoom, colors.text]
  );

  const redrawAllShapes = useCallback(() => {
    const ctx = mainCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    getTransformedContext(ctx);
    existingStrokes.current.forEach((shape) => drawShape(ctx, shape));
    ctx.restore();
  }, [drawShape, getTransformedContext]); // Changed dependencies

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
        const indexToDelete = yStrokes
          .toArray()
          .findIndex((s) => s.id === strokeIdToDelete);
        if (indexToDelete > -1) {
          yStrokes.delete(indexToDelete, 1);
        }
      }
    },
    [getStrokeUnderPoint]
  );

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
      existingStrokes.current = yStrokes.toArray();
      redrawAllShapes();
    };

    yStrokes.observe(handleObserve);

    return () => {
      yStrokes.unobserve(handleObserve);
    };
  }, [isLoaded, redrawAllShapes]);

  useEffect(() => {
    if (!isLoaded) return;
    const reconcileAndLoadStrokes = async () => {
      const localStrokes = await db.drawingStrokes
        .where("taskId")
        .equals(activeTaskId || "")
        .toArray();
      const yjsStrokesArr = yStrokes.toArray();
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
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(1);
  const gestureState = useRef<"drawing" | "panning" | "pinching" | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!isLoaded) return;
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.current.size === 2) {
        gestureState.current = "pinching";
        const pointers = Array.from(activePointers.current.values());
        const dx = pointers[0].x - pointers[1].x;
        const dy = pointers[0].y - pointers[1].y;
        pinchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
        pinchStartZoom.current = zoom;
        setIsDrawing(false);
        localStroke.current = {};
        awareness?.setLocalStateField("drawing", null);
        return;
      }

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

        if (
          drawingTool === "pan" ||
          (drawingInputMode === "touch" &&
            e.pointerType === "touch" &&
            drawingTool !== "pen" &&
            drawingTool !== "eraser")
        ) {
          gestureState.current = "panning";
        } else {
          gestureState.current = "drawing";
        }

        if (gestureState.current === "drawing") {
          const baseStroke = {
            id: `stroke-${awareness?.clientID}-${Date.now()}`,
            color: selectedColor,
            clientID: awareness?.clientID,
          };

          if (drawingTool === "pen") {
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
          if (drawingTool !== "pan" && drawingTool !== "eraser") {
            awareness?.setLocalStateField("drawing", localStroke.current);
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
    ]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!activePointers.current.has(e.pointerId)) return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (
        gestureState.current === "pinching" &&
        activePointers.current.size === 2
      ) {
        const pointers = Array.from(activePointers.current.values());
        const dx = pointers[0].x - pointers[1].x;
        const dy = pointers[0].y - pointers[1].y;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        const scale = newDist / pinchStartDistance.current;

        const midPoint = {
          x: (pointers[0].x + pointers[1].x) / 2,
          y: (pointers[0].y + pointers[1].y) / 2,
        };
        const worldPos = getScreenToWorldCoordinates(midPoint.x, midPoint.y);

        const newZoom = Math.max(
          0.1,
          Math.min(pinchStartZoom.current * scale, 20)
        );

        const newPanX = midPoint.x - worldPos.x * newZoom;
        const newPanY = midPoint.y - worldPos.y * newZoom;

        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });

        return;
      }

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

      if (gestureState.current === "drawing" && isDrawing) {
        const currentPoint = getScreenToWorldCoordinates(e.clientX, e.clientY);
        lastMousePosition.current = currentPoint;

        if (drawingTool === "eraser") {
          eraseAtPoint(currentPoint);
          return;
        }

        if (!startPoint) return;

        let updatedStroke: Partial<DrawingStroke> | null = null;
        const textPayload = shapeText ? { text: shapeText } : {};

        switch (drawingTool) {
          case "pen": {
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
          awareness?.setLocalStateField("drawing", updatedStroke);
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
    ]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
      activePointers.current.delete(e.pointerId);

      if (
        gestureState.current === "pinching" &&
        activePointers.current.size < 2
      ) {
        gestureState.current = null;
        pinchStartDistance.current = 0;
      }

      if (activePointers.current.size < 1) {
        if (gestureState.current === "drawing" && localStroke.current.type) {
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
            yStrokes.push([finalShape]);
          }
        }

        gestureState.current = null;
        setIsDrawing(false);
        setStartPoint(null);
        localStroke.current = {};
        awareness?.setLocalStateField("drawing", null);
      }
    },
    [drawingTool, shapeText, awareness, yStrokes]
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
    </CanvasContainer>
  );
};

export default DrawingCanvas;
