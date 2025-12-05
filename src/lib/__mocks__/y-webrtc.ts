// src/lib/__mocks__/y-webrtc.ts
import { vi } from 'vitest';

export const mockAwareness = {
  on: vi.fn(),
  off: vi.fn(),
  getStates: vi.fn(() => new Map()),
};

export const mockProvider = {
  on: vi.fn(),
  off: vi.fn(),
  destroy: vi.fn(),
  awareness: mockAwareness,
};

export const WebrtcProvider = vi.fn(() => mockProvider);
