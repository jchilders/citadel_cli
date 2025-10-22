import { beforeAll, afterAll, vi } from 'vitest'

// Mock CSS modules
vi.mock('../components/Citadel/Citadel.module.css?raw', () => ({
  default: '.container { position: fixed; }'
}))

// Mock window properties and methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

beforeAll(() => {
  // Add any additional setup
})

afterAll(() => {
  // Cleanup
})
