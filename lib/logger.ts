/**
 * Logger utility for conditional console logging
 *
 * Usage:
 * - Local/Test servers: Logs will be displayed
 * - Production server: Logs will be suppressed
 *
 * To enable/disable logging, set NEXT_PUBLIC_ENABLE_CONSOLE_LOGS in your environment:
 * - .env.local (local development): NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=true
 * - .env.test (test server): NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=true
 * - .env.production (main server): NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=false
 */

const isLoggingEnabled = process.env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGS === 'true'

export const logger = {
  log: (...args: any[]) => {
    if (isLoggingEnabled) {
      console.log(...args)
    }
  },

  info: (...args: any[]) => {
    if (isLoggingEnabled) {
      console.info(...args)
    }
  },

  warn: (...args: any[]) => {
    if (isLoggingEnabled) {
      console.warn(...args)
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args)
  },

  debug: (...args: any[]) => {
    if (isLoggingEnabled) {
      console.debug(...args)
    }
  },

  table: (data: any) => {
    if (isLoggingEnabled) {
      console.table(data)
    }
  },

  group: (label: string) => {
    if (isLoggingEnabled) {
      console.group(label)
    }
  },

  groupEnd: () => {
    if (isLoggingEnabled) {
      console.groupEnd()
    }
  },
}

// Export the enabled state for conditional logic
export const isConsoleLoggingEnabled = isLoggingEnabled
