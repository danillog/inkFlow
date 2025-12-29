import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Awareness } from 'y-protocols/awareness';
import { type Task, type DrawingStroke } from "./db";
import type { Transaction, YMapEvent } from 'yjs';
import type { StoreApi } from 'zustand';
import type { TaskStore } from '../store/taskStore';
import type { UIStore } from '../store/uiStore';

export class YjsSynchronizer {
  public ydoc: Y.Doc;
  public awareness: Awareness | null = null;
  private webrtcProvider: WebrtcProvider | null = null;
  private unsubscribers: (() => void)[] = [];
  public yTasks: Y.Map<Task>;
  public yStrokes: Y.Array<DrawingStroke>;
  public yUiState: Y.Map<any>;
  private taskStore: StoreApi<TaskStore>;
  private uiStore: StoreApi<UIStore>;
  public currentRoomName: string | null = null;
  private isSyncing = false;

  constructor(taskStore: StoreApi<TaskStore>, uiStore: StoreApi<UIStore>, existingYdoc?: Y.Doc) {
    this.ydoc = existingYdoc || new Y.Doc();
    this.yTasks = this.ydoc.getMap<Task>('tasks');
    this.yStrokes = this.ydoc.getArray<DrawingStroke>('drawingStrokes');
    this.yUiState = this.ydoc.getMap<any>('uiState');
    this.taskStore = taskStore;
    this.uiStore = uiStore;

    this.yTasks.observe((_event: YMapEvent<Task>, transaction: Transaction) => {
      if (transaction.local || this.isSyncing) return;
      try {
        this.isSyncing = true;
        const tasks = Array.from(this.yTasks.values());
        this.taskStore.getState().setTasks(tasks);
      } finally {
        this.isSyncing = false;
      }
    });

    this.yUiState.observe((_event: YMapEvent<any>, transaction: Transaction) => {
      if (transaction.local || this.isSyncing) return;
      try {
        this.isSyncing = true;
        this.uiStore.setState({
          pomodoroDuration: this.yUiState.get('pomodoroDuration'),
          isPomodoroActive: this.yUiState.get('isPomodoroActive'),
          pomodoroStartTime: this.yUiState.get('pomodoroStartTime'),
          pomodoroExpectedEndTime: this.yUiState.get('pomodoroExpectedEndTime'),
        });
        this.taskStore.setState({
          activeTaskId: this.yUiState.get('activeTaskId'),
          currentView: this.yUiState.get('currentView'),
        });
      } finally {
        this.isSyncing = false;
      }
    });

    const syncState = () => {
      if (this.isSyncing) return;
      try {
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
        });
      } finally {
        this.isSyncing = false;
      }
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
    
    // Append room name to URL so Cloudflare Worker isolates traffic in a Durable Object per room
    const signalingServers = [`wss://signaling-server-cf-worker.danillo.workers.dev/${this.currentRoomName}`];

    this.webrtcProvider = new WebrtcProvider(this.currentRoomName, this.ydoc, {
      signaling: signalingServers,
      peerOpts: {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' }
          ]
        }
      }
    });

    this.awareness = this.webrtcProvider.awareness;

    this.webrtcProvider.on('status', (event: { connected: boolean }) => {
      console.log(`[Sync] WebRTC status for room "${this.currentRoomName}": ${event.connected ? 'connected' : 'disconnected'}`);
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
