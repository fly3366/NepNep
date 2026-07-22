import { defineComponent, onMounted, ref } from 'vue'
import { NButton, NInput } from 'naive-ui'

export const SettingsPanel = defineComponent({
  setup() {
    const gateway = ref('')
    const model = ref('')
    const instructions = ref('')
    const defaults = ref({ gateway: '', model: '', instructions: '' })

    onMounted(async () => {
      const settings = await window.omni.getSettings()
      gateway.value = settings.gateway
      model.value = settings.model
      instructions.value = settings.instructions
      defaults.value = await window.omni.getDefaultSettings()
    })

    async function handleSave() {
      await window.omni.saveSettings({
        gateway: gateway.value.trim(),
        model: model.value.trim(),
        instructions: instructions.value.trim(),
      })
    }

    function handleReset() {
      gateway.value = defaults.value.gateway
      model.value = defaults.value.model
      instructions.value = defaults.value.instructions
    }

    return () => (
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
          <NButton size="tiny" onClick={handleReset}>Reset</NButton>
          <NButton size="tiny" type="primary" onClick={handleSave}>Save</NButton>
        </div>
        <div class="settings-hint">Reconnect after modifying Gateway / Model</div>
      </div>
    )
  },
})
