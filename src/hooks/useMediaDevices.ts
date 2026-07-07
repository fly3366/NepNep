import { ref, onBeforeUnmount } from 'vue'

export interface MediaDevice {
  label: string
  key: string
  kind?: string
}

const DEFAULT_INPUTS: MediaDevice[] = [{ label: 'Desktop Audio', key: 'desktop' }]
const DEFAULT_OUTPUTS: MediaDevice[] = [{ label: 'Mute', key: 'closed' }]

export function useMediaDevices() {
  const inputs = ref<MediaDevice[]>([...DEFAULT_INPUTS])
  const outputs = ref<MediaDevice[]>([...DEFAULT_OUTPUTS])
  let timer: ReturnType<typeof setTimeout> | null = null

  async function refresh() {
    const devices = await window.customMedia.getSources()

    const inp: MediaDevice[] = [...DEFAULT_INPUTS]
    const outp: MediaDevice[] = [...DEFAULT_OUTPUTS]

    devices.forEach((d) => {
      if (d.kind === 'audioinput') {
        inp.push({ label: d.label, key: d.key })
      } else if (d.kind === 'audiooutput') {
        outp.push({ label: d.label, key: d.key })
      }
    })

    inputs.value = inp
    outputs.value = outp

    timer = setTimeout(refresh, 5000)
  }

  function startPolling() {
    refresh()
  }

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { inputs, outputs, startPolling }
}
