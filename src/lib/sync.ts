import { IndexeddbPersistence } from "y-indexeddb";
import { useTaskStore } from "../store/taskStore";
import { useUIStore } from "../store/uiStore";
import { type Task, type DrawingStroke } from "./db";
import { create } from "zustand";
import * as Y from 'yjs';

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

let appSynchronizer: YjsSynchronizer;

export const initSync = () => {
  appSynchronizer = new YjsSynchronizer(useTaskStore, useUIStore);
  new IndexeddbPersistence("inkflow-yjs-persistence", appSynchronizer.ydoc);
};


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

export const getYjsDoc = (): Y.Doc => appSynchronizer.ydoc;
export const yTasks = (): Y.Map<Task> => appSynchronizer.yTasks;
export const yStrokes = (): Y.Array<DrawingStroke> => appSynchronizer.yStrokes;
export const yUiState = (): Y.Map<any> => appSynchronizer.yUiState;
export const awareness = () => appSynchronizer.awareness; // Note: This will be null initially

export const getCurrentRoomName = (): string | null => appSynchronizer.currentRoomName;

export type { Task, DrawingStroke };
