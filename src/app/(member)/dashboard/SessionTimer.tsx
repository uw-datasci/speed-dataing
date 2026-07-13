'use client'

import React, { useState, useEffect, useRef } from 'react'

type SessionTimerProps = {
  onTimeChange?: (isTime: boolean) => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `0h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`
}

export default function SessionTimer({ onTimeChange }: SessionTimerProps) {
  const [remaining, setRemaining] = useState(20 * 60) // 20 minutes in seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          if (onTimeChange) onTimeChange(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [onTimeChange])

  return (
    <span className="text-[1rem] text-slate-600 md:text-lg">
      Session running: {formatTime(remaining)}
    </span>
  )
}