import { ipcRenderer } from 'electron'

function escapeHtml(str: string): string {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}

ipcRenderer.on('push-entry', (_e, { origin, translation }: { origin: string; translation: string }) => {
  const list = document.getElementById('list')
  if (!list) return

  // Remove empty placeholder
  const empty = list.querySelector('.empty')
  if (empty) empty.remove()

  const el = document.createElement('div')
  el.className = 'entry'
  const now = new Date()
  const ts = now.toLocaleTimeString('zh-CN', { hour12: false })
  el.innerHTML =
    '<div class="time">' + escapeHtml(ts) + '</div>' +
    '<div class="origin">' + escapeHtml(origin) + '</div>' +
    '<div class="translation">' + escapeHtml(translation) + '</div>'
  list.appendChild(el)

  // Always scroll to latest entry
  el.scrollIntoView({ behavior: 'smooth', block: 'end' })
})
