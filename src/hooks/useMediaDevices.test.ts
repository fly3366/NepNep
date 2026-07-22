// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useMediaDevices, type MediaDevice } from './useMediaDevices'

// Run a composable inside a real component setup so that lifecycle hooks
// (onBeforeUnmount) have an owner instance to bind to.
function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T
  const Comp = defineComponent({
    setup() {
      result = composable()
      return () => h('div')
    },
  })
  const wrapper = mount(Comp)
  return { result, unmount: () => wrapper.unmount() }
}

type Source = { label: string; key: string; kind: string }
const getSources = vi.fn<() => Promise<Source[]>>()

beforeEach(() => {
  vi.useFakeTimers()
  getSources.mockReset()
  // @ts-expect-error — augment window with the preload bridge used by the hook
  window.customMedia = { getSources }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useMediaDevices', () => {
  it('starts with the default desktop input and mute output', () => {
    getSources.mockResolvedValue([])
    const { result, unmount } = withSetup(() => useMediaDevices())

    expect(result.inputs.value).toEqual<MediaDevice[]>([{ label: 'Desktop Audio', key: 'desktop' }])
    expect(result.outputs.value).toEqual<MediaDevice[]>([{ label: 'Mute', key: 'closed' }])
    unmount()
  })

  it('splits sources into audio inputs and outputs, keeping defaults first', async () => {
    getSources.mockResolvedValue([
      { label: 'Mic A', key: 'mic-a', kind: 'audioinput' },
      { label: 'Speaker B', key: 'spk-b', kind: 'audiooutput' },
      { label: 'Webcam', key: 'cam', kind: 'videoinput' },
    ])
    const { result, unmount } = withSetup(() => useMediaDevices())

    result.startPolling()
    await vi.waitFor(() => expect(getSources).toHaveBeenCalled())
    await nextTick()

    expect(result.inputs.value).toEqual<MediaDevice[]>([
      { label: 'Desktop Audio', key: 'desktop' },
      { label: 'Mic A', key: 'mic-a' },
    ])
    expect(result.outputs.value).toEqual<MediaDevice[]>([
      { label: 'Mute', key: 'closed' },
      { label: 'Speaker B', key: 'spk-b' },
    ])
    unmount()
  })

  it('re-polls on an interval', async () => {
    getSources.mockResolvedValue([])
    const { result, unmount } = withSetup(() => useMediaDevices())

    result.startPolling()
    await vi.waitFor(() => expect(getSources).toHaveBeenCalledTimes(1))

    await vi.advanceTimersByTimeAsync(5000)
    expect(getSources).toHaveBeenCalledTimes(2)
    unmount()
  })

  it('stops polling after unmount', async () => {
    getSources.mockResolvedValue([])
    const { result, unmount } = withSetup(() => useMediaDevices())

    result.startPolling()
    await vi.waitFor(() => expect(getSources).toHaveBeenCalledTimes(1))

    unmount()
    await vi.advanceTimersByTimeAsync(10000)
    expect(getSources).toHaveBeenCalledTimes(1)
  })
})
