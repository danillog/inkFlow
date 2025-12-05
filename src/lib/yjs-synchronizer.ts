// src/lib/sync-test.ts
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Awareness }from 'y-protocols/awareness';
import { type Task, type DrawingStroke } from "./db";
import type { Transaction, YMapEvent } from 'yjs'; // Import for typing



export class YjsSynchronizer {
  public ydoc: Y.Doc;
  public awareness: Awareness | null = null;
  private webrtcProvider: WebrtcProvider | null = null;
  private unsubscribers: (() => void)[] = [];
  public yTasks: Y.Map<Task>;
  public yStrokes: Y.Array<DrawingStroke>;
  public yUiState: Y.Map<any>; // Changed to any
  private taskStore: any; // Changed to any
  private uiStore: any; // Changed to any
  public currentRoomName: string | null = null;
  private isSyncing = false; // Internal flag to prevent infinite loops during state updates


  constructor(taskStore: any, uiStore: any, existingYdoc?: Y.Doc) { // Changed to any
    this.ydoc = existingYdoc || new Y.Doc();
    this.yTasks = this.ydoc.getMap<Task>('tasks');
    this.yStrokes = this.ydoc.getArray<DrawingStroke>('drawingStrokes');
    this.yUiState = this.ydoc.getMap<any>('uiState'); // Changed to any
    this.taskStore = taskStore;
    this.uiStore = uiStore;

    // Set up observers directly in the constructor
    this.yTasks.observe(() => {
      if (this.isSyncing) return; // Prevent infinite loop
      this.isSyncing = true;
      const tasksFromYjs = Array.from(this.yTasks.values());
      this.taskStore.setState({ tasks: tasksFromYjs });
      this.isSyncing = false;
    });

    this.yUiState.observe((_event: YMapEvent<any>, transaction: Transaction) => {
      if (transaction.local) return; // Don't react to local changes
      if (this.isSyncing) return; // Prevent infinite loop
      this.isSyncing = true;
      
      this.uiStore.setState({
        pomodoroDuration: this.yUiState.get('pomodoroDuration'),
        isPomodoroActive: this.yUiState.get('isPomodoroActive'),
        pomodoroStartTime: this.yUiState.get('pomodoroStartTime'),
        pomodoroExpectedEndTime: this.yUiState.get('pomodoroExpectedEndTime'),
      });

      // TaskStore also observes yUiState for activeTaskId and currentView
      this.taskStore.setState({
        activeTaskId: this.yUiState.get('activeTaskId'),
        currentView: this.yUiState.get('currentView'),
      });

      this.isSyncing = false;
    });

    // Subscribe to Zustand store changes and push them to Yjs
    const syncState = () => {
      if (this.isSyncing) return; // Prevent infinite loop
      this.isSyncing = true;
      const uiState = this.uiStore.getState();
      const taskState = this.taskStore.getState();
      this.ydoc.transact(() => {
        this.yUiState.set('pomodoroDuration', uiState.pomodoroDuration);
        this.yUiState.set('isPomodoroActive', uiState.isPomodoroActive);
        this.yUiState.set('pomodoroStartTime', uiState.pomodoroStartTime);
        this.yUiState.set('pomodoroExpectedEndTime', uiState.pomodoroExpectedEndTime);
        this.yUiState.set('activeTaskId', taskState.activeTaskId);
        this.yUiState.set('currentView', taskState.currentView);

        // Synchronize yTasks from Zustand to Yjs
        this.yTasks.clear();
        taskState.tasks.forEach((task: Task) => {
          this.yTasks.set(task.id, task);
        });
      });
      this.isSyncing = false;
    };

    const unsubFromUiStore = this.uiStore.subscribe(syncState);
    const unsubFromTaskStore = this.taskStore.subscribe(syncState);
    this.unsubscribers.push(unsubFromUiStore, unsubFromTaskStore);
  }

  connect(roomName: string) {
    if (this.webrtcProvider) {
      this.disconnect();
    }

    this.currentRoomName = roomName.trim();

    const signalingServers = ['wss://signaling-server-cf-worker.danillo.workers.dev'];

    this.webrtcProvider = new WebrtcProvider(this.currentRoomName, this.ydoc, {
      signaling: signalingServers,
    });

    this.awareness = this.webrtcProvider.awareness;

    this.webrtcProvider.on('status', (event: { connected: boolean }) => {
      console.log(`[Test-Sync] WebRTC status for room "${this.currentRoomName}": ${event.connected ? 'connected' : 'disconnected'}`);
    });

    this.awareness.on("change", () => {
      if (this.awareness) {
        // useSyncStore.getState().setPeerCount(this.awareness.getStates().size);
        // In test environment, we don't have global useSyncStore, so no action here.
      }
    });
  }

  disconnect() {
    if (this.webrtcProvider) {
      this.webrtcProvider.destroy();
      this.webrtcProvider = null;
      this.currentRoomName = null;
    }
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers.length = 0;
  }
}
