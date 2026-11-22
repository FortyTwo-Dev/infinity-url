import { beforeEach, describe, expect, it, vi } from 'vitest'

function systemPrefersDark(matches: boolean): void {
  window.matchMedia = vi.fn(() => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as never
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
    vi.resetModules()
  })

  it('defaults to light when nothing is stored and the system is light', async () => {
    systemPrefersDark(false)
    const { initTheme, useTheme } = await import('~/lib/theme/theme')

    initTheme()

    expect(useTheme().theme.value).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('restores the stored preference', async () => {
    localStorage.setItem('iurl:theme', 'dark')
    systemPrefersDark(false)
    const { initTheme, useTheme } = await import('~/lib/theme/theme')

    initTheme()

    expect(useTheme().theme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('falls back to the system preference', async () => {
    systemPrefersDark(true)
    const { initTheme, useTheme } = await import('~/lib/theme/theme')

    initTheme()

    expect(useTheme().theme.value).toBe('dark')
  })

  it('persists and toggles the mode', async () => {
    const { setTheme, toggleTheme, useTheme } = await import('~/lib/theme/theme')

    setTheme('dark')

    expect(localStorage.getItem('iurl:theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    toggleTheme()

    expect(localStorage.getItem('iurl:theme')).toBe('light')
    expect(useTheme().theme.value).toBe('light')
  })
})
