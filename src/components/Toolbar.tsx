import { defineComponent, onMounted, ref, type PropType, type Ref } from 'vue'
import { NButton, NDropdown, NTooltip, NInput, NPopover } from 'naive-ui'
import type { MediaDevice } from '../hooks/useMediaDevices'
import { PlayIcon, PauseIcon, MicIcon, SpeakerIcon, SubtitleIcon, ShieldIcon, PinIcon, CloseIcon, HistoryIcon, GearIcon } from './icons'

export const Toolbar = defineComponent({
  props: {
    inputs: { type: Array as PropType<MediaDevice[]>, required: true },
    outputs: { type: Array as PropType<MediaDevice[]>, required: true },
    playing: { type: Boolean, required: true },
    connected: { type: Boolean, required: true },
    sourceSelected: { type: Boolean, required: true },
    outputDisabled: { type: Boolean, default: false },
    drmOn: { type: Boolean, required: true },
    pinned: { type: Boolean, required: true },
    subtitleOn: { type: Boolean, required: true },
    historyOn: { type: Boolean, required: true },
    error: { type: String as PropType<string | null>, default: null },
    canvasRef: { type: Object as PropType<Ref<HTMLCanvasElement | undefined>>, default: undefined },
  },
  emits: ['connect', 'selectSource', 'selectOutput', 'togglePlay', 'switchTop', 'toggleDrm', 'closeWindow', 'toggleSubtitle', 'toggleHistory'],
  setup(props, { emit }) {
    const apiKey = ref('')
    const gateway = ref('')
    const model = ref('')
    const instructions = ref('')
    const defaults = ref({ gateway: '', model: '', instructions: '' })

    onMounted(async () => {
      const saved = await window.omni.getApiKey()
      if (saved) apiKey.value = saved
      const settings = await window.omni.getSettings()
      gateway.value = settings.gateway
      model.value = settings.model
      instructions.value = settings.instructions
      defaults.value = await window.omni.getDefaultSettings()
    })

    async function handleSaveSettings() {
      await window.omni.saveSettings({
        gateway: gateway.value.trim(),
        model: model.value.trim(),
        instructions: instructions.value.trim(),
      })
    }

    function handleResetSettings() {
      gateway.value = defaults.value.gateway
      model.value = defaults.value.model
      instructions.value = defaults.value.instructions
    }

    function handleConnect() {
      const key = apiKey.value.trim()
      if (!key) return
      emit('connect', key)
    }

    return () => (
      <div class="toolbar-wrap">
        <div class="toolbar">
          <NTooltip trigger="hover" delay={400}>
            {{ trigger: () => (
              <span>
                <NDropdown
                  trigger={props.connected ? 'click' : 'manual'}
                  size="small"
                  options={props.inputs}
                  onSelect={(key: string) => emit('selectSource', key)}
                >
                  <NButton class="toolbar-btn" quaternary disabled={!props.connected}><MicIcon /></NButton>
                </NDropdown>
              </span>
            ), default: () => props.connected ? 'Select Source' : 'Connect First' }}
          </NTooltip>

          <NTooltip trigger="hover" delay={400}>
            {{ trigger: () => (
              <span>
                <NDropdown
                  trigger={props.outputDisabled || !props.connected ? 'manual' : 'click'}
                  size="small"
                  options={props.outputs}
                  onSelect={(key: string) => emit('selectOutput', key)}
                >
                  <NButton class="toolbar-btn" quaternary disabled={props.outputDisabled || !props.connected}><SpeakerIcon /></NButton>
                </NDropdown>
              </span>
            ), default: () => props.outputDisabled ? 'Desktop audio does not support monitoring' : 'Select Output' }}
          </NTooltip>

          {props.sourceSelected
            ? <canvas ref={props.canvasRef} class="visualizer" />
            : <span class="toolbar-hint">{props.connected ? '← Select Source' : 'Enter API Key'}</span>
          }

          {props.error && <span class="toolbar-error">{props.error}</span>}

          <div class="toolbar-spacer" />

          <NTooltip trigger="hover" delay={400}>
            {{ trigger: () => (
              <NButton class="play-btn" circle quaternary onClick={() => emit('togglePlay')}>
                {props.playing ? <PauseIcon /> : <PlayIcon />}
              </NButton>
            ), default: () => props.playing ? 'Pause (Space)' : 'Play (Space)' }}
          </NTooltip>

          <NTooltip trigger="hover" delay={400}>
            {{ trigger: () => (
              <button
                class={['tape-btn', props.subtitleOn && 'tape-btn--pressed']}
                onClick={() => emit('toggleSubtitle')}
              >
                <span class="tape-btn__face"><SubtitleIcon /></span>
              </button>
            ), default: () => props.subtitleOn ? 'Hide Subtitles' : 'Show Subtitles' }}
          </NTooltip>

          <NTooltip trigger="hover" delay={400}>
            {{ trigger: () => (
              <button
                class={['tape-btn', props.historyOn && 'tape-btn--pressed']}
                onClick={() => emit('toggleHistory')}
              >
                <span class="tape-btn__face"><HistoryIcon /></span>
              </button>
            ), default: () => props.historyOn ? 'Hide History' : 'Show History' }}
          </NTooltip>

          <NTooltip trigger="hover" delay={400}>
            {{ trigger: () => (
              <button
                class={['tape-btn', props.drmOn && 'tape-btn--pressed']}
                onClick={() => emit('toggleDrm')}
              >
                <span class="tape-btn__face"><ShieldIcon /></span>
              </button>
            ), default: () => props.drmOn ? 'Disable DRM Protection' : 'Enable DRM Protection' }}
          </NTooltip>

          <NTooltip trigger="hover" delay={400}>
            {{ trigger: () => (
              <button
                class={['tape-btn', props.pinned && 'tape-btn--pressed']}
                onClick={() => emit('switchTop')}
              >
                <span class="tape-btn__face"><PinIcon /></span>
              </button>
            ), default: () => props.pinned ? 'Unpin Window' : 'Pin Window' }}
          </NTooltip>

          <NPopover trigger="click" placement="bottom-end" raw>
            {{ trigger: () => (
              <button class="tape-btn" title="Settings">
                <span class="tape-btn__face"><GearIcon /></span>
              </button>
            ), default: () => (
              <div class="settings-panel">
                <div class="settings-row">
                  <label class="settings-label">Gateway</label>
                  <NInput
                    value={gateway.value}
                    onUpdateValue={(v: string) => { gateway.value = v }}
                    placeholder={defaults.value.gateway}
                    size="tiny"
                  />
                </div>
                <div class="settings-row">
                  <label class="settings-label">Model</label>
                  <NInput
                    value={model.value}
                    onUpdateValue={(v: string) => { model.value = v }}
                    placeholder={defaults.value.model}
                    size="tiny"
                  />
                </div>
                <div class="settings-row">
                  <label class="settings-label">Instructions</label>
                  <NInput
                    value={instructions.value}
                    onUpdateValue={(v: string) => { instructions.value = v }}
                    placeholder={defaults.value.instructions}
                    type="textarea"
                    rows={4}
                    size="tiny"
                  />
                </div>
                <div class="settings-actions">
                  <NButton size="tiny" onClick={handleResetSettings}>Reset</NButton>
                  <NButton size="tiny" type="primary" onClick={handleSaveSettings}>Save</NButton>
                </div>
                <div class="settings-hint">Reconnect after modifying Gateway / Model</div>
              </div>
            ) }}
          </NPopover>

          <NTooltip trigger="hover" delay={400}>
            {{ trigger: () => (
              <NButton class="close-btn" quaternary onClick={() => emit('closeWindow')}>
                <CloseIcon />
              </NButton>
            ), default: () => 'Close' }}
          </NTooltip>
        </div>

        <div class="toolbar-key-row">
          <NInput
            class="apikey-input"
            value={apiKey.value}
            onUpdateValue={(v: string) => { apiKey.value = v }}
            placeholder="API Key"
            type="password"
            size="tiny"
            disabled={props.connected}
            onKeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') handleConnect() }}
          />
          <NTooltip trigger="hover" delay={400}>
            {{ trigger: () => (
              <button
                class={['conn-btn', props.connected && 'conn-btn--on']}
                onClick={handleConnect}
                disabled={props.connected}
              >
                <span class="conn-led" />
              </button>
            ), default: () => props.connected ? 'Connected' : 'Connect' }}
          </NTooltip>
        </div>
      </div>
    )
  },
})
