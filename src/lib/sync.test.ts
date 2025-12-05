// src/lib/sync.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';
import { connectYjs, disconnectYjs, useSyncStore } from './sync';
import { WebrtcProvider } from 'y-webrtc'; // This will now be the mocked version
import { YjsSynchronizer } from './yjs-synchronizer';
import { createTaskStore } from '../store/taskStore';
import { createUIStore } from '../store/uiStore';
import { mockProvider } from './__mocks__/y-webrtc'; // Import the mockProvider directly

// Mock y-indexeddb globally
vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: vi.fn(),
}));

// Use the mock from the __mocks__ folder for y-webrtc
vi.mock('y-webrtc', () => import('./__mocks__/y-webrtc'));

describe('Yjs Sync Logic (Unit Tests)', () => {
  beforeEach(() => {
    // Reset mocks and stores before each test
    vi.clearAllMocks();
    useSyncStore.setState({ peerCount: 0 });
  });

  it('should initialize webrtc provider on connect', () => {
    connectYjs('test-room');
    expect(WebrtcProvider).toHaveBeenCalledWith(
      'test-room',
      expect.anything(), // ydoc
      { signaling: ['wss://signaling-server-cf-worker.danillo.workers.dev'] }
    );
  });

  it('should set peer count to 0 on disconnect', () => {
    connectYjs('test-room');
    // Manually set a peer count to simulate a connection
    useSyncStore.setState({ peerCount: 2 });
    expect(useSyncStore.getState().peerCount).toBe(2);

    disconnectYjs();
    expect(useSyncStore.getState().peerCount).toBe(0);
  });

  it('should destroy webrtc provider on disconnect', () => {
    connectYjs('test-room'); // Call connectYjs here
    disconnectYjs();
    expect(mockProvider.destroy).toHaveBeenCalled();
  });
});

describe('Yjs Synchronizer (Integration-like Test)', () => {
  let client1Synchronizer: YjsSynchronizer;
  let client2Synchronizer: YjsSynchronizer;
  let client1UIStore: ReturnType<typeof createUIStore>;
  let client2UIStore: ReturnType<typeof createUIStore>;
  let client1TaskStore: ReturnType<typeof createTaskStore>;
  let client2TaskStore: ReturnType<typeof createTaskStore>;
  let ydoc1: Y.Doc;
  let ydoc2: Y.Doc;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks for isolation

    ydoc1 = new Y.Doc();
    ydoc2 = new Y.Doc();

    client1UIStore = createUIStore();
    client1TaskStore = createTaskStore();
    client1Synchronizer = new YjsSynchronizer(client1TaskStore, client1UIStore, ydoc1);

    client2UIStore = createUIStore();
    client2TaskStore = createTaskStore();
    client2Synchronizer = new YjsSynchronizer(client2TaskStore, client2UIStore, ydoc2);
  });

  afterEach(() => {
    client1Synchronizer.disconnect(); // Cleans up observers and providers if any
    client2Synchronizer.disconnect();
    ydoc1.destroy();
    ydoc2.destroy();
    vi.restoreAllMocks(); // Restore all mocks after each test
  });

  it('should synchronize pomodoroExpectedEndTime between two simulated clients', async () => {
    // Initial state check
    expect(client2UIStore.getState().pomodoroExpectedEndTime).toBeNull();

    // Client 1 changes a value
    const pomodoroEndTime = Date.now() + 25 * 60 * 1000;
    client1UIStore.getState().setPomodoroExpectedEndTime(pomodoroEndTime);

    // Manually propagate Yjs updates from client1's ydoc to client2's ydoc
    const update = Y.encodeStateAsUpdate(ydoc1);
    Y.applyUpdate(ydoc2, update);

    // The UI store update should happen asynchronously via the Y.Map observer
    // We need to wait for the next tick for Zustand to process the update
    await vi.waitFor(() => {
      expect(client2UIStore.getState().pomodoroExpectedEndTime).toBe(pomodoroEndTime);
    }, { timeout: 100 }); // Short timeout as it should be fast
  });

  it('should synchronize activeTaskId between two simulated clients', async () => {
    // Initial state check
    expect(client2TaskStore.getState().activeTaskId).toBeNull();

    // Client 1 changes active task
    const activeTaskId = 'task-123';
    client1TaskStore.getState().setActiveTask(activeTaskId);

    // Manually propagate Yjs updates
    const update = Y.encodeStateAsUpdate(ydoc1);
    Y.applyUpdate(ydoc2, update);

    // Wait for the update to be processed
    await vi.waitFor(() => {
      expect(client2TaskStore.getState().activeTaskId).toBe(activeTaskId);
    }, { timeout: 100 });
  });

  it('should synchronize tasks array between two simulated clients', async () => {
    // Initial state check
    expect(client2TaskStore.getState().tasks.length).toBe(0);

    // Client 1 adds a task
    client1TaskStore.getState().addTask('New Task', 'personal');

    // Manually propagate Yjs updates
    const update = Y.encodeStateAsUpdate(ydoc1);
    Y.applyUpdate(ydoc2, update);

    // Wait for the update to be processed
    await vi.waitFor(() => {
      expect(client2TaskStore.getState().tasks.length).toBe(1);
      expect(client2TaskStore.getState().tasks[0].content).toBe('New Task');
    }, { timeout: 500 }); // Increased timeout
  });
});


