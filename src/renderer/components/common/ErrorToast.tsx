import React, { useEffect } from 'react'
import { X as XIcon } from 'lucide-react'

interface Props {
  message: string
  onClose: () => void
}

export function ErrorToast({ message, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [message])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 400,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-danger)',
        borderRadius: 4,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--color-danger)',
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <p
        className="selectable"
        style={{
          flex: 1,
          fontSize: '0.8125rem',
          color: 'var(--color-text-primary)',
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          padding: 2,
          flexShrink: 0,
        }}
      >
        <XIcon size={12} />
      </button>
    </div>
  )
}
