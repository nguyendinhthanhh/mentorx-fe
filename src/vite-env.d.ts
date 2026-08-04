/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SKIP_JOB_FUNDING?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
