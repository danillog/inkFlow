import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import { useTaskStore } from "../store/taskStore";
import { type Task, type DrawingStroke } from "./db";
import { Awareness } from "y-protocols/awareness";
import { create } from "zustand";

// --- A new simple store for tracking sync/peer status ---
interface SyncState {
  peerCount: number;
  setPeerCount: (count: number) => void;
}
export const useSyncStore = create<SyncState>((set) => ({
  peerCount: 0,
  setPeerCount: (count) => set({ peerCount: count }),
}));

// --- Main Yjs setup ---
const ydoc = new Y.Doc();
new IndexeddbPersistence("inkflow-yjs-persistence", ydoc);

let webrtcProvider: WebrtcProvider | null = null;
let currentRoomName: string | null = null;
let unsubFromStore: (() => void) | null = null; // Variable to hold the unsubscribe function

// --- Yjs Shared Types ---
export const yTasks = ydoc.getMap<Task>("tasks");
export const yStrokes = ydoc.getArray<DrawingStroke>("drawingStrokes");

export const getYjsDoc = () => ydoc;
export let awareness: Awareness | null = null;

// Function to connect to a room
export const connectYjs = (roomName: string) => {
  if (webrtcProvider) {
    disconnectYjs();
  }

  currentRoomName = roomName.trim();

  // Point to the local signaling server
  const signalingServers = [
    "wss://signaling-server-cf-worker.danillo.workers.dev",
  ];

  webrtcProvider = new WebrtcProvider(currentRoomName, ydoc, {
    signaling: signalingServers,
  });

  awareness = webrtcProvider.awareness;

  awareness.on("change", () => {
    // Update peer count whenever awareness state changes
    if (awareness) {
      useSyncStore.getState().setPeerCount(awareness.getStates().size);
      console.log(`Awareness changed. Peers: ${awareness.getStates().size}`);
    }
  });

  // Corrected type for the 'status' event
  webrtcProvider.on("status", (event: { connected: boolean }) => {
    console.log(
      `WebRTC status for room "${currentRoomName}": ${
        event.connected ? "connected" : "disconnected"
      }`
    );
  });

  // --- Task Syncing Logic ---
  yTasks.observe(() => {
    const tasksFromYjs = Array.from(yTasks.values());
    useTaskStore.setState({ tasks: tasksFromYjs });
  });

  // Store the unsubscribe function to be called on disconnect
  unsubFromStore = useTaskStore.subscribe((state) => {
    const tasks = state.tasks;
    ydoc.transact(() => {
      const currentYjsTaskIds = new Set(yTasks.keys());
      tasks.forEach((task) => {
        const yTask = yTasks.get(task.id);
        if (!yTask || JSON.stringify(yTask) !== JSON.stringify(task)) {
          yTasks.set(task.id, task);
        }
        currentYjsTaskIds.delete(task.id);
      });
      currentYjsTaskIds.forEach((id) => yTasks.delete(id));
    });
  });
};

// Function to disconnect
export const disconnectYjs = () => {
  if (webrtcProvider) {
    webrtcProvider.destroy();
    webrtcProvider = null;
    currentRoomName = null;
    useSyncStore.getState().setPeerCount(0);
    console.log("Disconnected from WebRTC provider.");
  }
  // Unsubscribe from the store when disconnecting
  if (unsubFromStore) {
    unsubFromStore();
    unsubFromStore = null;
  }
};

export const getCurrentRoomName = () => currentRoomName;

export type { Task, DrawingStroke };
