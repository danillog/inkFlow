import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { YjsSynchronizer } from './yjs-synchronizer';
import { create, type StoreApi } from 'zustand';
import { type TaskStore, type Task } from '../store/taskStore';
import { type UIStore } from '../store/uiStore';
import * as Y from 'yjs';

// Mock stores
const createMockTaskStore = () => create<TaskStore>(() => ({
    tasks: [],
    activeTaskId: null,
    currentView: 'blackbox',
    canvasRevision: 0,
    setTasks: vi.fn(),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    removeTask: vi.fn(),
    setActiveTask: vi.fn(),
    setCurrentView: vi.fn(),
    refreshCanvas: vi.fn(),
}));

const createMockUIStore = () => create<UIStore>(() => ({
    selectedColor: '',
    drawingTool: 'pen',
    drawingInputMode: 'pen',
    panOffset: { x: 0, y: 0 },
    zoom: 1,
    shapeText: '',
    theme: 'dark',
    colors: {} as any,
    isTaskStackOpen: false,
    pomodoroDuration: 0,
    pomodoroMinutes: 0,
    pomodoroSeconds: 0,
    isPomodoroActive: false,
    isPomodoroFloating: false,
    pomodoroStartTime: null,
    pomodoroExpectedEndTime: null,
    engineType: 'wasm',
    lastStrokePerformance: null,
    setSelectedColor: vi.fn(),
    setDrawingTool: vi.fn(),
    toggleDrawingInputMode: vi.fn(),
    setPanOffset: vi.fn(),
    setZoom: vi.fn(),
    setShapeText: vi.fn(),
    toggleTheme: vi.fn(),
    toggleTaskStack: vi.fn(),
    setPomodoroDuration: vi.fn(),
    setPomodoroTime: vi.fn(),
    setIsPomodoroActive: vi.fn(),
    togglePomodoroFloating: vi.fn(),
    setPomodoroStartTime: vi.fn(),
    setPomodoroExpectedEndTime: vi.fn(),
    setEngineType: vi.fn(),
    setLastStrokePerformance: vi.fn(),
}));

describe('YjsSynchronizer', () => {
    let clientA_TaskStore: StoreApi<TaskStore>;
    let clientA_UIStore: StoreApi<UIStore>;
    let clientB_TaskStore: StoreApi<TaskStore>;
    let clientB_UIStore: StoreApi<UIStore>;
    let ydocA: Y.Doc;
    let ydocB: Y.Doc;
    let synchronizerA: YjsSynchronizer;
    let synchronizerB: YjsSynchronizer;

    beforeAll(() => {
        clientA_TaskStore = createMockTaskStore();
        clientA_UIStore = createMockUIStore();
        clientB_TaskStore = createMockTaskStore();
        clientB_UIStore = createMockUIStore();

        ydocA = new Y.Doc();
        ydocB = new Y.Doc();

        synchronizerA = new YjsSynchronizer(clientA_TaskStore, clientA_UIStore, ydocA);
        synchronizerB = new YjsSynchronizer(clientB_TaskStore, clientB_UIStore, ydocB);

        // Simulate network connection by connecting the two ydocs
        ydocA.on('update', (update) => {
            Y.applyUpdate(ydocB, update);
        });
        ydocB.on('update', (update) => {
            Y.applyUpdate(ydocA, update);
        });
    });

        it('should synchronize tasks between two clients', () => {

            const task: Task = { id: 'task-1', content: 'Test Task', status: 'pending', createdAt: Date.now(), category: 'personal' };

    

            // Client A adds a task

            synchronizerA.yTasks.set(task.id, task);

    

            // Verify that client B receives the task

            expect(synchronizerB.yTasks.get(task.id)).toEqual(task);

        });

    

            it('should synchronize sniper mode between two clients', () => {

    

                const taskId = 'task-1';

    

        

    

                // Client A enters sniper mode

    

                clientA_TaskStore.setState({ activeTaskId: taskId, currentView: 'sniper' });

    

        

    

                // Verify that client B enters sniper mode

    

                expect(clientB_TaskStore.getState().activeTaskId).toEqual(taskId);

    

                expect(clientB_TaskStore.getState().currentView).toEqual('sniper');

    

            });

    

        

    

            it('should synchronize drawings between two clients', () => {

    

                const stroke: DrawingStroke = { id: 'stroke-1', type: 'stroke', points: [{ x: 0, y: 0, pressure: 0.5 }], color: '#000000', clientID: 'client-A' };

    

        

    

                // Client A adds a stroke

    

                synchronizerA.yStrokes.push([stroke]);

    

        

    

                // Verify that client B receives the stroke

    

                expect(synchronizerB.yStrokes.toArray()).toContainEqual(stroke);

    

            });

    

        });

    

        

    