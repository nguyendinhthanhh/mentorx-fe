/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SKIP_JOB_FUNDING?: string
  readonly VITE_JOB_FUNDING_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
