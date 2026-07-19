'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Applies the organization's primary color as the theme-color meta tag,
 * giving each organization a branded native app feel.
 */
export function DynamicThemeProvider() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    // Fetch org settings to get primaryColor
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const color = data.primaryColor || '#0d9488'
        // Update theme-color meta tag
        let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
        if (!meta) {
          meta = document.createElement('meta')
          meta.name = 'theme-color'
          document.head.appendChild(meta)
        }
        meta.content = color

        // Also update the CSS variable for primary color
        const root = document.documentElement
        // Convert hex to oklch-compatible HSL for CSS variable
        root.style.setProperty('--org-primary', color)
      })
      .catch(() => {})
  }, [session])

  return null
}
