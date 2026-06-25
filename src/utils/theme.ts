let stopWatchingSystemTheme: (() => void) | undefined

export type ThemePreference = 'light' | 'dark' | 'auto'

export function applyThemePreference(theme: ThemePreference) {
  stopWatchingSystemTheme?.()
  stopWatchingSystemTheme = undefined

  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  const apply = () => {
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'auto' && !!media?.matches))
  }

  apply()

  if (theme === 'auto' && media) {
    media.addEventListener('change', apply)
    stopWatchingSystemTheme = () => media.removeEventListener('change', apply)
  }
}
