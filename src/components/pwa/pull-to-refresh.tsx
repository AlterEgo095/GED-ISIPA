'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  threshold?: number
  className?: string
}

/**
 * Pull-to-refresh component for native-app feel on touch devices.
 * Works on mobile browsers and installed PWAs.
 */
export function PullToRefresh({ onRefresh, children, threshold = 70, className }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    if (diff > 0 && diff < threshold * 1.5) {
      setPullDistance(diff)
      if (diff > threshold) {
        // Haptic feedback at threshold
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(10)
        }
      }
    }
  }, [isPulling, isRefreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return
    setIsPulling(false)
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const opacity = Math.min(pullDistance / threshold, 1)
  const rotation = pullDistance * 2

  return (
    <div ref={containerRef} className={`overflow-y-auto overscroll-y-contain ${className || ''}`}>
      <div
        className="flex justify-center items-center overflow-hidden transition-all"
        style={{
          height: pullDistance > 0 || isRefreshing ? pullDistance : 0,
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
        }}
      >
        <RefreshCw
          className={`h-5 w-5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ transform: `rotate(${rotation}deg)`, opacity }}
        />
      </div>
      {children}
    </div>
  )
}
