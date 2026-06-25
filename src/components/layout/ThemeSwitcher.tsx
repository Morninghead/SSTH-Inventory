import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { applyThemePreference, type ThemePreference } from '../../utils/theme'

const themes: ThemePreference[] = ['light', 'dark', 'auto']
const labels = { light: 'Light', dark: 'Dark', auto: 'Auto' }
const icons = { light: Sun, dark: Moon, auto: Monitor }

export default function ThemeSwitcher() {
  const { user } = useAuth()
  const [theme, setTheme] = useState<ThemePreference>('light')
  const Icon = icons[theme]

  useEffect(() => {
    if (!user) return

    supabase.rpc('get_user_preferences' as any, { p_user_id: user.id }).then(({ data }) => {
      const saved = data?.find((pref: any) => pref.preference_key === 'theme')?.preference_value
      if (saved === 'dark' || saved === 'auto') {
        setTheme(saved)
        applyThemePreference(saved)
      }
    })
  }, [user])

  const cycleTheme = async () => {
    const next = themes[(themes.indexOf(theme) + 1) % themes.length]
    setTheme(next)
    applyThemePreference(next)

    if (user) {
      const { error } = await supabase.rpc('update_user_preference' as any, {
        p_preference_key: 'theme',
        p_preference_value: next,
        p_user_id: user.id,
      })
      if (error) console.error('Failed to save theme preference:', error)
    }
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Theme: ${labels[theme]}`}
      aria-label={`Theme: ${labels[theme]}`}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{labels[theme]}</span>
    </button>
  )
}
