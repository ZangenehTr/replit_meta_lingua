import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for testing
vi.mock('process', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NODE_ENV: 'test'
  }
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Setup test environment
beforeEach(() => {
  vi.clearAllMocks()
})