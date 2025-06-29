'use client'
import { useState, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'

export default function ThemeProviderWrapper({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableColorScheme={true} 
      enableSystem={true} // Explicitly set to true
    >
      {children}
    </ThemeProvider>
  )
}