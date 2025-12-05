// src/tests/setup.ts
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

vi.mock('yjs/util', () => ({
  generateUuid: vi.fn(() => `mock-uuid-${Math.random().toString(36).substring(7)}`),
}));
