'use client'

import { Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

interface WebShareButtonProps {
  title: string
  text?: string
  url?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function WebShareButton({
  title,
  text,
  url,
  variant = 'outline',
  size = 'default',
  className,
}: WebShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareData: ShareData = { title }
    if (text) shareData.text = text
    if (url) shareData.url = url

    // Try Web Share API (native)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData)
        return
      } catch (err: any) {
        // User cancelled or error — fall back to clipboard
        if (err.name === 'AbortError') return
      }
    }

    // Fallback: copy to clipboard
    if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success('Lien copié dans le presse-papiers')
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Impossible de copier le lien')
      }
    } else {
      toast.error('Le partage n\'est pas disponible sur cet appareil')
    }
  }

  return (
    <Button onClick={handleShare} variant={variant} size={size} className={className}>
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copié
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-2" />
          Partager
        </>
      )}
    </Button>
  )
}
