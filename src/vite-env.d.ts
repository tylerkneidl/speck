/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  /** Dev-only: when 'true' (and running the dev server), skip Clerk and run as a signed-in dev user. */
  readonly VITE_DEV_NO_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
