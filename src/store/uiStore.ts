import { create } from 'zustand';

export type DrawingTool = 'pen' | 'rectangle' | 'circle' | 'pan' | 'eraser' | 'triangle';
export type DrawingInputMode = 'pen' | 'touch';

export const darkTheme = {
  text: '#C9D1D9',
  background: '#0D1117',
  surface: '#161B22',
  primary: '#238636',
  accent: '#F778BA',
  secondaryAccent: '#BB86FC'
};

export const lightTheme = {
  text: '#24292E',
  background: '#FFFFFF',
  surface: '#F6F8FA',
  primary: '#22863A',
  accent: '#EA4AAA',
  secondaryAccent: '#A75EFF'
};

interface PanOffset {
  x: number;
  y: number;
}

type Theme = 'dark' | 'light';

interface UIStore {
  selectedColor: string;
  drawingTool: DrawingTool;
  drawingInputMode: DrawingInputMode;
  panOffset: PanOffset;
  zoom: number;
  shapeText: string;
  theme: Theme;
  colors: typeof darkTheme;
  isTaskStackOpen: boolean;
  pomodoroDuration: number;
  pomodoroMinutes: number;
  pomodoroSeconds: number;
  isPomodoroActive: boolean;
  isPomodoroFloating: boolean;
  setSelectedColor: (color: string) => void;
  setDrawingTool: (tool: DrawingTool) => void;
  toggleDrawingInputMode: () => void;
  setPanOffset: (offset: PanOffset) => void;
  setZoom: (zoom: number) => void;
  setShapeText: (text: string) => void;
  toggleTheme: () => void;
  toggleTaskStack: () => void;
  setPomodoroDuration: (duration: number) => void;
  setPomodoroTime: (minutes: number, seconds: number) => void;
  setIsPomodoroActive: (isActive: boolean) => void;
  togglePomodoroFloating: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  selectedColor: darkTheme.text,
  drawingTool: 'pen',
  drawingInputMode: 'pen',
  panOffset: { x: 0, y: 0 },
  zoom: 1,
  shapeText: '',
  theme: 'dark',
  colors: darkTheme,
  isTaskStackOpen: true,
  pomodoroDuration: 25,
  pomodoroMinutes: 25,
  pomodoroSeconds: 0,
  isPomodoroActive: false,
  isPomodoroFloating: false,
  setSelectedColor: (color) => set({ selectedColor: color }),
  setDrawingTool: (tool) => set({ drawingTool: tool }),
  toggleDrawingInputMode: () => set((state) => ({ drawingInputMode: state.drawingInputMode === 'pen' ? 'touch' : 'pen' })),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setZoom: (zoom) => set({ zoom }),
  setShapeText: (text) => set({ shapeText: text }),
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme, colors: newTheme === 'dark' ? darkTheme : lightTheme });
  },
  toggleTaskStack: () => set((state) => ({ isTaskStackOpen: !state.isTaskStackOpen })),
  setPomodoroDuration: (duration) => set({ pomodoroDuration: duration, pomodoroMinutes: duration, pomodoroSeconds: 0 }),
  setPomodoroTime: (minutes, seconds) => set({ pomodoroMinutes: minutes, pomodoroSeconds: seconds }),
  setIsPomodoroActive: (isActive) => set({ isPomodoroActive: isActive }),
  togglePomodoroFloating: () => set((state) => ({ isPomodoroFloating: !state.isPomodoroFloating })),
}));
