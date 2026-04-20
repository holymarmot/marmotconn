import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { X as XIcon, Terminal as TerminalIcon } from 'lucide-react'

export function GitLogPanel() {
  const { gitLogs, clearGitLogs } = useAppStore()
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [gitLogs])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: 480,
        maxHeight: collapsed ? 32 : 180,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderBottom: 'none',
        borderRight: 'none',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        transition: 'max-height 0.15s',
        borderRadius: '4px 0 0 0',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderBottom: collapsed ? 'none' : '1px solid var(--color-border)',
          cursor: 'pointer',
          flexShrink: 0,
          background: 'var(--color-surface-2)',
        }}
        onClick={() => setCollapsed(v => !v)}
      >
        <TerminalIcon size={12} style={{ color: 'var(--color-accent)' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', flex: 1 }}>
          Git Log
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{gitLogs.length}</span>
        <button
          onClick={(e) => { e.stopPropagation(); clearGitLogs() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }}
          title="Temizle"
        >
          <XIcon size={11} />
        </button>
      </div>

      {/* Log lines */}
      {!collapsed && (
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 10px' }}>
          {gitLogs.map((line, i) => (
            <div
              key={i}
              className="selectable"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.7rem',
                color: line.includes('hata') ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
