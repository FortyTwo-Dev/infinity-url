import { readonly, ref } from 'vue'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'iurl:theme'

/**
 * The theme is a display preference, not an identity: it is stored locally so
 * a reload does not flash the other mode, and it is never sent to the API or a
 * third party. The access token never uses this path.
 */
const theme = ref<Theme>('light')
let initialized = false

export function useTheme() {
  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme,
  }
}

/** Apply the stored or system preference once, before the app renders. */
export function initTheme(): void {
  if (!isClient() || initialized) {
    return
  }

  initialized = true

  const stored = readStored()
  const preferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

  apply(stored ?? preferred)
}

export function setTheme(next: Theme): void {
  apply(next)
  persist(next)
}

export function toggleTheme(): void {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

function apply(next: Theme): void {
  theme.value = next

  if (isClient()) {
    document.documentElement.dataset.theme = next
  }
}

function readStored(): Theme | null {
  if (!isClient()) {
    return null
  }

  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)

    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

function persist(next: Theme): void {
  if (!isClient()) {
    return
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // The in-memory preference still applies for this page.
  }
}

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}
