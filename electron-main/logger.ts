/**
 * Dev-only logger — all output is stripped in production.
 * In main process: checks process.env.NODE_ENV
 * In renderer: checks import.meta.env.DEV (Vite)
 */

const isDev =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'

export const log = isDev
  ? (...args: unknown[]) => console.log(...args)
  : () => {}

export const warn = isDev
  ? (...args: unknown[]) => console.warn(...args)
  : () => {}

export const error = isDev
  ? (...args: unknown[]) => console.error(...args)
  : () => {}
