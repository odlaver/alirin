function readBooleanEnv(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').toLowerCase())
}

export const isDemoAuthEnabled = import.meta.env.DEV && readBooleanEnv(import.meta.env.VITE_ENABLE_DEMO_AUTH)
