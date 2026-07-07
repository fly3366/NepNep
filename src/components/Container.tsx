import { defineComponent, nextTick, onBeforeMount, ref } from 'vue'
import { useMediaDevices } from '../hooks/useMediaDevices'
import { useTranscription } from '../hooks/useTranscription'
import { Toolbar } from './Toolbar'

export const Container = defineComponent({
  setup() {
    const canvasRef = ref<HTMLCanvasElement>()
    const audioRef = ref<HTMLAudioElement>()
    const muted = ref(true)
    const sourceSelected = ref(false)
    const isDesktopSource = ref(false)
    const drmOn = ref(false)
    const pinned = ref(false)
    const subtitleOn = ref(false)
    const historyOn = ref(false)

    const audioCtx = new AudioContext({
      // @ts-expect-error — silent sink so we don't play back captured audio
      sinkId: { type: 'none' },
      sampleRate: 16000,
      latencyHint: 'interactive',
    })

    const { inputs, outputs, startPolling } = useMediaDevices()
    const { playing, connected, sourceReady, error, initSession, selectSource, stop, togglePlaying } = useTranscription()

    onBeforeMount(() => {
      startPolling()

      window.nepNepHook.onSpacePress(() => {
        if (sourceReady.value) togglePlaying()
      })
    })

    async function handleConnect(apiKey: string) {
      await initSession(apiKey)
    }

    async function handleSelectSource(sourceId: string) {
      isDesktopSource.value = sourceId === 'desktop'
      // Desktop source → force mute to prevent echo
      if (isDesktopSource.value) {
        muted.value = true
        if (audioRef.value) audioRef.value.srcObject = null
      }
      sourceSelected.value = true
      await nextTick()
      const stream = await selectSource(sourceId, audioCtx, canvasRef.value ?? null)
      // Bind stream to audio element for monitoring playback
      if (audioRef.value) {
        audioRef.value.srcObject = stream
      }
    }

    async function handleSelectOutput(sourceId: string) {
      if (sourceId === 'closed') {
        muted.value = true
      } else {
        muted.value = false
        const [deviceId] = sourceId.split(',')
        await audioRef.value!.setSinkId(deviceId)
      }
    }

    function handleTogglePlay() {
      if (!sourceReady.value) return
      togglePlaying()
    }

    return () => (
      <div class="app-shell">
        <Toolbar
          inputs={inputs.value}
          outputs={outputs.value}
          playing={playing.value}
          connected={connected.value}
          sourceSelected={sourceSelected.value}
          outputDisabled={isDesktopSource.value}
          drmOn={drmOn.value}
          pinned={pinned.value}
          subtitleOn={subtitleOn.value}
          historyOn={historyOn.value}
          error={error.value}
          canvasRef={canvasRef}
          onConnect={handleConnect}
          onSelectSource={handleSelectSource}
          onSelectOutput={handleSelectOutput}
          onTogglePlay={handleTogglePlay}
          onToggleDrm={() => { drmOn.value = !drmOn.value; window.customMedia.toggleDrm() }}
          onSwitchTop={() => { pinned.value = !pinned.value; window.customMedia.switchTop() }}
          onCloseWindow={() => window.customMedia.closeWindow()}
          onToggleSubtitle={() => { subtitleOn.value = !subtitleOn.value; window.customMedia.toggleSubtitle() }}
          onToggleHistory={() => { historyOn.value = !historyOn.value; window.customMedia.toggleHistory() }}
        />
        <audio ref={audioRef} muted={muted.value} crossorigin="use-credentials" hidden />
      </div>
    )
  },
})
