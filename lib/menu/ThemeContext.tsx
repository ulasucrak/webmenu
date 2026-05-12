'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('menu-theme') as Theme | null
    if (stored === 'dark' || stored === 'light') setThemeState(stored)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('menu-theme', t)
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div ref={wrapperRef} data-theme={theme} style={{ minHeight: '100dvh' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
