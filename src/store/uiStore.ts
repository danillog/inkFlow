import { create } from 'zustand';

export type DrawingTool = 'pen' | 'rectangle' | 'circle' | 'line' | 'pan' | 'eraser' | 'triangle' | 'text';

export const AppColors = {
  text: '#C9D1D9',
  background: '#0D1117',
  surface: '#161B22',
  primary: '#238636',
  accent: '#F778BA',
  secondaryAccent: '#BB86FC'
};

interface PanOffset {
  x: number;
  y: number;
}

interface UIStore {
  selectedColor: string;
  drawingTool: DrawingTool;
  panOffset: PanOffset;
  zoom: number;
  shapeText: string;
  setSelectedColor: (color: string) => void;
  setDrawingTool: (tool: DrawingTool) => void;
  setPanOffset: (offset: PanOffset) => void;
  setZoom: (zoom: number) => void;
  setShapeText: (text: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedColor: AppColors.text,
  drawingTool: 'pen',
  panOffset: { x: 0, y: 0 },
  zoom: 1,
  shapeText: '',
  setSelectedColor: (color) => set({ selectedColor: color }),
  setDrawingTool: (tool) => set({ drawingTool: tool }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setZoom: (zoom) => set({ zoom }),
  setShapeText: (text) => set({ shapeText: text }),
}));
