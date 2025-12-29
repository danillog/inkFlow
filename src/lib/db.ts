import Dexie, { type Table } from 'dexie';

export interface Task {
  id: string;
  content: string;
  status: 'pending' | 'completed' | 'aborted';
  createdAt: number;
  completedAt?: number;
  category?: 'personal' | 'work';
  urgency?: 'high' | 'low';
  importance?: 'high' | 'low';
}

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

export type DrawingStroke = {
  id: string;
  taskId?: string;
  createdAt: number;
  color?: string;
  clientID?: number;
  text?: string;
} & (StrokeShape | RectangleShape | CircleShape | TriangleShape);

export interface DailyStat {
  date: string; // ISO format YYYY-MM-DD
  count: number;
}

export class InkFlowDB extends Dexie {
  tasks!: Table<Task>;
  drawingStrokes!: Table<DrawingStroke>;
  dailyStats!: Table<DailyStat>;

  constructor() {
    super('inkFlowDB');
    this.version(4).stores({
      tasks: '++id, content, status, createdAt, category, urgency, importance',
      drawingStrokes: '++id, taskId, createdAt',
      dailyStats: 'date',
    });
  }
}

export const db = new InkFlowDB();