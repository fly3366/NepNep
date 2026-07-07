import { describe, it, expect } from 'vitest'
import { convertF32ToS16 } from './audio.service'

describe('audio.service', () => {
  describe('convertF32ToS16', () => {
    it('should convert zero values correctly', () => {
      const f32 = new Float32Array([0, 0, 0, 0])
      const result = convertF32ToS16(f32.buffer)
      const s16 = new Int16Array(result)
      
      expect(s16[0]).toBe(0)
      expect(s16[1]).toBe(0)
      expect(s16[2]).toBe(0)
      expect(s16[3]).toBe(0)
    })

    it('should convert positive values correctly', () => {
      const f32 = new Float32Array([0.5, 1.0, 0.25, 0.75])
      const result = convertF32ToS16(f32.buffer)
      const s16 = new Int16Array(result)
      
      // 0.5 * 32767 = 16383
      expect(s16[0]).toBeCloseTo(16383, -1)
      // 1.0 * 32767 = 32767
      expect(s16[1]).toBeCloseTo(32767, -1)
      // 0.25 * 32767 = 8191
      expect(s16[2]).toBeCloseTo(8191, -1)
      // 0.75 * 32767 = 24575
      expect(s16[3]).toBeCloseTo(24575, -1)
    })

    it('should convert negative values correctly', () => {
      const f32 = new Float32Array([-0.5, -1.0, -0.25, -0.75])
      const result = convertF32ToS16(f32.buffer)
      const s16 = new Int16Array(result)
      
      // -0.5 * 32768 = -16384
      expect(s16[0]).toBeCloseTo(-16384, -1)
      // -1.0 * 32768 = -32768
      expect(s16[1]).toBeCloseTo(-32768, -1)
      // -0.25 * 32768 = -8192
      expect(s16[2]).toBeCloseTo(-8192, -1)
      // -0.75 * 32768 = -24576
      expect(s16[3]).toBeCloseTo(-24576, -1)
    })

    it('should clamp values exceeding range', () => {
      const f32 = new Float32Array([1.5, -1.5, 2.0, -2.0])
      const result = convertF32ToS16(f32.buffer)
      const s16 = new Int16Array(result)
      
      // Values should be clamped to [-1, 1]
      expect(s16[0]).toBeCloseTo(32767, -1)  // clamped to 1.0
      expect(s16[1]).toBeCloseTo(-32768, -1) // clamped to -1.0
      expect(s16[2]).toBeCloseTo(32767, -1)  // clamped to 1.0
      expect(s16[3]).toBeCloseTo(-32768, -1) // clamped to -1.0
    })

    it('should preserve buffer size relationship', () => {
      const f32 = new Float32Array(100)
      const result = convertF32ToS16(f32.buffer)
      const s16 = new Int16Array(result)
      
      // s16 should have same number of elements as f32
      expect(s16.length).toBe(f32.length)
      // s16 buffer should be half the byte size of f32 buffer (16-bit vs 32-bit float)
      expect(result.byteLength).toBe(f32.buffer.byteLength / 2)
    })
  })
})