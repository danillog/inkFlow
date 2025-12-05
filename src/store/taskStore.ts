import { create, type StoreApi } from 'zustand';
import { persist, createJSONStorage, type PersistOptions } from 'zustand/middleware';
import { db, type Task } from '../lib/db';

export type ViewMode = 'blackbox' | 'sniper' | 'realitycheck';

export interface TaskStore {
  tasks: Task[];
  activeTaskId: string | null;
  currentView: ViewMode;
  canvasRevision: number;
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
  addTask: (content, category) => set((state) => {
    const newTask: Task = { id: crypto.randomUUID(), content, status: 'pending', createdAt: Date.now(), category }; // Use crypto.randomUUID()
    return { tasks: [...state.tasks, newTask] };
  }),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    )
  })),
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id)
  })),
  setActiveTask: (id) => set((state) => ({ 
    activeTaskId: id,
    currentView: id ? 'sniper' : (state.currentView === 'sniper' ? 'blackbox' : state.currentView)
  })),
  setCurrentView: (view) => set(() => ({ currentView: view })),
  refreshCanvas: () => set((state) => ({ canvasRevision: state.canvasRevision + 1 })),
});

export const createTaskStore = () => create<TaskStore>(taskStoreCreator);


const dexieStorage = {
  getItem: async (name: string) => {
    if (name === 'task-storage') {
      const tasks = await db.tasks.toArray();
      // A default state is returned if IndexedDB is empty
      return JSON.stringify({ state: { tasks, activeTaskId: null, currentView: 'blackbox', canvasRevision: 0 }, version: 0 }); 
    }
    return null;
  },
  setItem: async (name: string, value: string) => {
    if (name === 'task-storage') {
      const { state } = JSON.parse(value);
      await db.tasks.clear();
      await db.tasks.bulkPut(state.tasks);
    }
  },
  removeItem: async (name: string) => {
    if (name === 'task-storage') {
      await db.tasks.clear();
    }
  },
};

const persistOptions: PersistOptions<TaskStore> = {
  name: 'task-storage',
  storage: createJSONStorage(() => dexieStorage),
  onRehydrateStorage: () => (state) => {
    if (state) {
        db.tasks.toArray().then(persistedTasks => {
            state.tasks = persistedTasks;
        });
    }
  },
};

export const useTaskStore = create<TaskStore>()(
  persist(
    taskStoreCreator,
    persistOptions
  )
);

export type { Task };