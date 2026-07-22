import { onBeforeUnmount } from 'vue'

/**
 * Renders a live frequency-bar visualization from an AnalyserNode onto a canvas.
 * Owns its requestAnimationFrame loop and cancels it on stop/unmount.
 */
export function useVisualization() {
  let animationTimer: number | null = null

  function stop() {
    if (animationTimer !== null) {
      cancelAnimationFrame(animationTimer)
      animationTimer = null
    }
  }

  function start(analyser: AnalyserNode, canvas: HTMLCanvasElement) {
    stop()

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufLen = analyser.frequencyBinCount
    const dataArr = new Uint8Array(bufLen)
    const { width, height } = canvas
    const barWidth = width / bufLen

    function render() {
      analyser.getByteFrequencyData(dataArr)
      ctx!.clearRect(0, 0, width, height)

      let x = 0
      for (let i = 0; i < bufLen; i++) {
        const barHeight = dataArr[i]
        const r = barHeight + 25 * (i / bufLen)
        const g = 250 * (i / bufLen)
        ctx!.fillStyle = `rgb(${r},${g},50)`
        ctx!.fillRect(x, height - barHeight, barWidth, barHeight)
        x += barWidth + 2
      }

      animationTimer = requestAnimationFrame(render)
    }

    animationTimer = requestAnimationFrame(render)
  }

  onBeforeUnmount(stop)

  return { start, stop }
}
