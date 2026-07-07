/**
 * Dev-only logger for renderer process.
 * Vite tree-shakes the noop branches in production builds.
 */

const isDev = import.meta.env.DEV

export const log = isDev
  ? (...args: unknown[]) => console.log(...args)
  : () => {}

export const warn = isDev
  ? (...args: unknown[]) => console.warn(...args)
  : () => {}

export const error = isDev
  ? (...args: unknown[]) => console.error(...args)
  : () => {}
