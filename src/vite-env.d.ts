/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_API?: string
  readonly VITE_ENABLE_DATA_MODE_SWITCH?: string
  readonly VITE_API_BASE_URL?: string
  readonly DEV: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
