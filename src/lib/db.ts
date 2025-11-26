import Dexie, { type Table } from 'dexie';

export interface Task {
  id: string;
  content: string;
  status: 'pending' | 'completed' | 'aborted'; // Added 'aborted' status
  createdAt: number;
  completedAt?: number; // Optional timestamp for completion
}

// --- Discriminated Union for Shapes ---

export interface StrokeShape {
  type: 'stroke';
  points: { x: number; y: number; pressure: number }[];
}

export interface RectangleShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape {
    type: 'circle';
    cx: number;
    cy: number;
    radius: number;
}

export interface TriangleShape {
    type: 'triangle';
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    p3: { x: number; y: number };
}

// The main DrawingStroke type is a union of all possible shapes
export type DrawingStroke = {
  id: string;
  taskId?: string;
  createdAt: number;
  color?: string;
  clientID?: number;
  text?: string; // For emoji/symbol inside shape
} & (StrokeShape | RectangleShape | CircleShape | TriangleShape);


export class InkFlowDB extends Dexie {
  tasks!: Table<Task>;
  drawingStrokes!: Table<DrawingStroke>;

  constructor() {
    super('inkFlowDB');
    this.version(2).stores({
      tasks: '++id, content, status, createdAt',
      drawingStrokes: '++id, taskId, createdAt',
    });
  }
}

export const db = new InkFlowDB();
