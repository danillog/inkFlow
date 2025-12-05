import { IndexeddbPersistence } from "y-indexeddb";
import { useTaskStore } from "../store/taskStore";
import { useUIStore } from "../store/uiStore";
import { type Task, type DrawingStroke } from "./db";
import { create } from "zustand";

import { YjsSynchronizer } from "./yjs-synchronizer";

// --- A new simple store for tracking sync/peer status ---
interface SyncState {
  peerCount: number;
  setPeerCount: (count: number) => void;
}
export const useSyncStore = create<SyncState>((set) => ({
  peerCount: 0,
  setPeerCount: (count) => set({ peerCount: count }),
}));


// Create a single instance of the YjsSynchronizer for the application
const appSynchronizer = new YjsSynchronizer(useTaskStore, useUIStore);
new IndexeddbPersistence("inkflow-yjs-persistence", appSynchronizer.ydoc);

// Expose the connect/disconnect methods and Yjs shared types from the synchronizer
export const connectYjs = (roomName: string) => {
  appSynchronizer.connect(roomName);
  if (appSynchronizer.awareness) {
    appSynchronizer.awareness.on("change", () => {
      if (appSynchronizer.awareness) {
        useSyncStore.getState().setPeerCount(appSynchronizer.awareness.getStates().size);
      }
    });
  }
};
export const disconnectYjs = () => {
  appSynchronizer.disconnect();
  useSyncStore.getState().setPeerCount(0);
};

export const getYjsDoc = () => appSynchronizer.ydoc;
export const yTasks = appSynchronizer.yTasks;
export const yStrokes = appSynchronizer.yStrokes;
export const yUiState = appSynchronizer.yUiState;
export const awareness = appSynchronizer.awareness; // Note: This will be null initially

export const getCurrentRoomName = () => appSynchronizer.currentRoomName;

export type { Task, DrawingStroke };
