import { create, type StoreApi } from 'zustand';
import { type Task } from '../lib/db';
import { yTasks, yUiState } from '../lib/sync';

export type ViewMode = 'blackbox' | 'sniper' | 'realitycheck' | 'eisenhower';

export interface TaskStore {
  tasks: Task[];
  activeTaskId: string | null;
  currentView: ViewMode;
  canvasRevision: number;
  setTasks: (tasks: Task[]) => void;
  addTask: (content: string, category: 'personal' | 'work') => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  setCurrentView: (view: ViewMode) => void;
  refreshCanvas: () => void;
}

const taskStoreCreator = (set: StoreApi<TaskStore>['setState']): TaskStore => ({
  tasks: [],
  activeTaskId: null,
  currentView: 'blackbox',
  canvasRevision: 0,
  setTasks: (tasks) => set({ tasks }),
  addTask: (content, category) => {
    const newTask: Task = { id: crypto.randomUUID(), content, status: 'pending', createdAt: Date.now(), category };
    yTasks().set(newTask.id, newTask);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },
  updateTask: (id, updates) => {
    const task = yTasks().get(id);
    if (task) {
      const updatedTask = { ...task, ...updates };
      yTasks().set(id, updatedTask);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
    }
  },
  removeTask: (id) => {
    yTasks().delete(id);
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },
  setActiveTask: (id) => {
    set((state) => {
      const newView = id ? 'sniper' : (state.currentView === 'sniper' ? 'blackbox' : state.currentView);
      yUiState().set('activeTaskId', id);
      yUiState().set('currentView', newView);
      return { activeTaskId: id, currentView: newView };
    });
  },
  setCurrentView: (view) => {
    yUiState().set('currentView', view);
    set(() => ({ currentView: view }));
  },
  refreshCanvas: () => set((state) => ({ canvasRevision: state.canvasRevision + 1 })),
});

export const useTaskStore = create<TaskStore>(taskStoreCreator);

export type { Task };