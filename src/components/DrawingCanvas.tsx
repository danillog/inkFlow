import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { useInkEngine } from "../hooks/useInkEngine";
import { db, type DrawingStroke } from "../lib/db";
import { useTaskStore } from "../store/taskStore";
import { useUIStore, AppColors, type DrawingTool } from "../store/uiStore";
import { yStrokes, awareness, getYjsDoc } from "../lib/sync";
import * as Y from "yjs";

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
  } = useUIStore();

  const existingStrokes = useRef<DrawingStroke[]>([]);
  const remoteStrokes = useRef(new Map<number, any>());
  const animationFrameRef = useRef<number>();
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const getTransformedContext = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset transform and apply DPR
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);
  };

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

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: DrawingStroke) => {
      ctx.strokeStyle = shape.color || AppColors.text;
      ctx.fillStyle = shape.color || AppColors.text;
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
            const fontSize =
              Math.min(Math.abs(shape.width), Math.abs(shape.height)) * 0.5;
            ctx.font = `${
              fontSize / zoom
            }px 'Inter', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji'`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              shape.text,
              shape.x + shape.width / 2,
              shape.y + shape.height / 2
            );
          }
          break;
        case "circle":
          ctx.beginPath();
          ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
          ctx.stroke();
          if (shape.text) {
            const fontSize = shape.radius * 0.8;
            ctx.font = `${
              fontSize / zoom
            }px 'Inter', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji'`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(shape.text, shape.cx, shape.cy);
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
            const centerX = (shape.p1.x + shape.p2.x + shape.p3.x) / 3;
            const centerY = (shape.p1.y + shape.p2.y + shape.p3.y) / 3;
            const fontSize = 24;
            ctx.font = `${
              fontSize / zoom
            }px 'Inter', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji'`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(shape.text, centerX, centerY);
          }
          break;
      }
    },
    [processStroke, zoom]
  );

  const redrawAllShapes = useCallback(() => {
    const ctx = mainCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    getTransformedContext(ctx);
    existingStrokes.current.forEach((shape) => drawShape(ctx, shape));
    ctx.restore();
  }, [drawShape, panOffset, zoom]);

  const getStrokeUnderPoint = useCallback(
    (point: { x: number; y: number }): string | null => {
      const eraserRadius = 10 / zoom;
      for (let i = existingStrokes.current.length - 1; i >= 0; i--) {
        const shape = existingStrokes.current[i];
        // Simplified collision detection logic
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
          default:
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
        bufferCtx.strokeStyle = AppColors.accent;
        bufferCtx.lineWidth = 1 / zoom;
        bufferCtx.stroke();
      }

      bufferCtx.restore();
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameRef.current!);
    };
  }, [isDrawing, drawShape, drawingTool, zoom]);

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
    }
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || e.pointerType === "touch" || !isLoaded) return;
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
      setIsDrawing(true);
      const point = getScreenToWorldCoordinates(e.clientX, e.clientY);
      setStartPoint({ ...point, pressure: e.pressure || 0.5 });

      if (drawingTool === "eraser") {
        eraseAtPoint(point);
      } else if (drawingTool !== "pan") {
        localStroke.current = {
          id: `stroke-${awareness?.clientID}-${Date.now()}`,
          type: drawingTool,
          color: selectedColor,
          points: [{ ...point, pressure: e.pressure || 0.5 }],
          clientID: awareness?.clientID,
        };
        awareness?.setLocalStateField("drawing", localStroke.current);
      }
    },
    [
      isLoaded,
      getScreenToWorldCoordinates,
      drawingTool,
      eraseAtPoint,
      selectedColor,
    ]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const currentPoint = getScreenToWorldCoordinates(e.clientX, e.clientY);
      lastMousePosition.current = currentPoint;

      if (!isDrawing) return;

      if (drawingTool === "pan" && startPoint) {
        setPanOffset({
          x: panOffset.x + e.movementX,
          y: panOffset.y + e.movementY,
        });
        return;
      }
      if (drawingTool === "eraser") {
        eraseAtPoint(currentPoint);
        return;
      }

      if (!startPoint || drawingTool === "pan") return;

      let updatedStroke: Partial<DrawingStroke> | null = null;

      const textPayload = shapeText ? { text: shapeText } : {};

      switch (drawingTool) {
        case "pen":
          updatedStroke = {
            ...localStroke.current,
            type: "stroke",
            points: [
              ...(localStroke.current.points || []),
              { ...currentPoint, pressure: e.pressure || 0.5 },
            ],
          };
          break;
        case "rectangle":
          updatedStroke = {
            ...localStroke.current,
            x: startPoint.x,
            y: startPoint.y,
            width: currentPoint.x - startPoint.x,
            height: currentPoint.y - startPoint.y,
            ...textPayload,
          };
          break;
        case "circle": {
          const dx = currentPoint.x - startPoint.x;
          const dy = currentPoint.y - startPoint.y;
          updatedStroke = {
            ...localStroke.current,
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
    },
    [
      getScreenToWorldCoordinates,
      isDrawing,
      drawingTool,
      startPoint,
      setPanOffset,
      panOffset.x,
      panOffset.y,
      eraseAtPoint,
      shapeText,
    ]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDrawing) return;
      (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
      setIsDrawing(false);

      if (
        drawingTool !== "pan" &&
        drawingTool !== "eraser" &&
        localStroke.current.type
      ) {
        const isShapeTool =
          drawingTool === "rectangle" ||
          drawingTool === "circle" ||
          drawingTool === "triangle";
        const finalShape = {
          ...localStroke.current,
          text: isShapeTool ? shapeText : undefined,
        } as DrawingStroke;

        if (
          finalShape.type === "pen" &&
          (!finalShape.points || finalShape.points.length < 2)
        )
          return;

        yStrokes.push([finalShape]); // Sync with others. The listener will handle the rest.
      }

      awareness?.setLocalStateField("drawing", null);
      localStroke.current = {};
      setStartPoint(null);
    },
    [isDrawing, drawingTool, shapeText]
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
