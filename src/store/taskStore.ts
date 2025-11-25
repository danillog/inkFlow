import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db, type Task } from '../lib/db';

type ViewMode = 'blackbox' | 'sniper' | 'realitycheck';

interface TaskStore {
  tasks: Task[];
  activeTaskId: string | null;
  currentView: ViewMode;
  canvasRevision: number; // Add revision number
  addTask: (content: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  setCurrentView: (view: ViewMode) => void;
  refreshCanvas: () => void; // Add refresh action
}

const dexieStorage = {
  getItem: async (name: string) => {
    console.log('DexieStorage: Getting item', name);
    if (name === 'task-storage') {
      const tasks = await db.tasks.toArray();
      // Zustand expects an object with 'state' and 'version'
      // Need to load other persisted state parts here too if they are being persisted
      // For now, assume activeTaskId and currentView are not persisted by Dexie for simplicity
      return JSON.stringify({ state: { tasks, activeTaskId: null, currentView: 'blackbox', canvasRevision: 0 }, version: 0 }); 
    }
    return null;
  },
  setItem: async (name: string, value: string) => {
    console.log('DexieStorage: Setting item', name);
    if (name === 'task-storage') {
      const { state } = JSON.parse(value);
      await db.tasks.clear();
      await db.tasks.bulkAdd(state.tasks);
    }
  },
  removeItem: async (name: string) => {
    console.log('DexieStorage: Removing item', name);
    if (name === 'task-storage') {
      await db.tasks.clear();
    }
  },
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      activeTaskId: null,
      currentView: 'blackbox',
      canvasRevision: 0,
      addTask: (content) => set((state) => {
        const newTask: Task = { id: Date.now().toString(), content, status: 'pending', createdAt: Date.now() };
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
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => dexieStorage),
      onRehydrateStorage: (state) => {
        console.log('Rehydrating storage', state);
        if (state && state.tasks) {
            db.tasks.toArray().then(persistedTasks => {
                useTaskStore.setState({ tasks: persistedTasks }); // Use useTaskStore.setState
            });
        }
      },
      // You can define `partialize` if you only want to store certain parts of the state
      // partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);