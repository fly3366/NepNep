import { ipcRenderer } from 'electron'

ipcRenderer.on('update-subtitle', (_e, { text, origin }: { text: string; origin: string }) => {
  const subtitleEl = document.getElementById('subtitle')
  const originEl = document.getElementById('origin')
  if (subtitleEl) subtitleEl.textContent = text
  if (originEl) originEl.textContent = origin
})
