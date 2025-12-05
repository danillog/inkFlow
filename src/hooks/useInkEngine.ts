import { useState, useEffect, useRef, useCallback } from "react";
import InkEngineFactory from 'ink-engine';
import wasmUrl from '../wasm-modules/ink_engine.wasm?url';

interface AppPoint {
  x: number;
  y: number;
  pressure: number;
}

interface InkEngineAPI {
  processStroke: (rawPoints: AppPoint[]) => AppPoint[];
  isLoaded: boolean;
}

export const useInkEngine = (): InkEngineAPI => {
  const [isLoaded, setIsLoaded] = useState(false);
  const InkEngineModuleRef = useRef<InkEngineModule | null>(null);

  useEffect(() => {
    const loadInkEngineModule = async () => {
      try {
        const module = await InkEngineFactory({
          locateFile: (path) => {
            if (path.endsWith('.wasm')) {
              return wasmUrl;
            }
            return path;
          },
        });
        InkEngineModuleRef.current = module;
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load InkEngine module:", error);
      }
    };

    loadInkEngineModule();
  }, []);

  const processStroke = useCallback(
    (rawPoints: AppPoint[]): AppPoint[] => {
      if (!isLoaded || !InkEngineModuleRef.current) {
        console.warn("InkEngine not loaded yet. Returning raw points.");
        return rawPoints;
      }

      const module = InkEngineModuleRef.current;
      const emscriptenVector = new module.VectorPoint();

      rawPoints.forEach((p) => {
        emscriptenVector.push_back({ x: p.x, y: p.y, pressure: p.pressure });
      });

      const processedEmscriptenVector = module.process_stroke(emscriptenVector);
      const processedPoints: AppPoint[] = [];
      for (let i = 0; i < processedEmscriptenVector.size(); i++) {
        const wasmPoint = processedEmscriptenVector.get(i);
        processedPoints.push({
          x: wasmPoint.x,
          y: wasmPoint.y,
          pressure: wasmPoint.pressure,
        });
      }

      emscriptenVector.delete();
      processedEmscriptenVector.delete();

      return processedPoints;
    },
    [isLoaded]
  );

  return { processStroke, isLoaded };
};
