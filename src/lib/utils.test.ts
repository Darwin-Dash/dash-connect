import { describe, it, expect } from 'vitest'
import { formatTimestamp } from './utils'

describe('formatTimestamp', () => {
  it('should format recent timestamps as "just now"', () => {
    const now = Date.now()
    expect(formatTimestamp(now)).toBe('just now')
  })

  it('should format timestamps from minutes ago', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    expect(formatTimestamp(fiveMinutesAgo)).toBe('5m ago')
  })

  it('should format timestamps from hours ago', () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    expect(formatTimestamp(twoHoursAgo)).toBe('2h ago')
  })

  it('should format timestamps from days ago', () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
    expect(formatTimestamp(threeDaysAgo)).toBe('3d ago')
  })
})