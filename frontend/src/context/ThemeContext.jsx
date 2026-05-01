import React, { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext({})

export const useTheme = () => {
  return useContext(ThemeContext)
}

export const ThemeProvider = ({ children }) => {
  // Force light mode only - no dark mode
  useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute('data-theme', 'light')
    document.body.style.backgroundColor = '#f8f9fa'
    document.body.style.color = '#2d3748'
    // Clear any saved dark mode preference
    localStorage.removeItem('darkMode')
  }, [])

  const value = {
    darkMode: false,
    toggleDarkMode: () => {} // No-op function
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
