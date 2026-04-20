import React, { useRef, useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { GitCommit } from '../../../shared/types'
import { Undo2, RotateCcw, Loader2, GitBranch, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DATE_LOCALES, LangCode } from '../../i18n'

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = ['#C8A830', '#FF9B21', '#7EB8FF', '#FF7EB8', '#7EFFB8', '#FFE07E']
  return colors[Math.abs(hash) % colors.length]
}

export function HistoryView() {
  const { commits, activeCommit, selectCommit, refreshLog, undoLastCommit, revertCommit, createBranch, loading } = useAppStore()
  const listRef = useRef<HTMLDivElement>(null)
  const { t, i18n } = useTranslation()

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; commit: GitCommit } | null>(null)
  const [branchInput, setBranchInput] = useState<{ commit: GitCommit } | null>(null)
  const [newBranchName, setNewBranchName] = useState('')
  const [branchLoading, setBranchLoading] = useState(false)
  const [branchError, setBranchError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function relativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffMin < 1) return t('history.justNow')
    if (diffMin < 60) return t('history.minutesAgo', { count: diffMin })
    if (diffHour < 24) return t('history.hoursAgo', { count: diffHour })
    if (diffDay < 30) return t('history.daysAgo', { count: diffDay })

    const locale = DATE_LOCALES[i18n.language as LangCode] || 'en-US'
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  useEffect(() => {
    if (!contextMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [contextMenu])

  useEffect(() => {
    if (branchInput) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [branchInput])

  function handleScroll() {
    const el = listRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      refreshLog(commits.length)
    }
  }

  async function handleCreateBranch() {
    const name = newBranchName.trim()
    if (!name || !branchInput) return
    setBranchLoading(true)
    setBranchError('')
    try {
      await createBranch(name, branchInput.commit.hash, false)
      setBranchInput(null)
      setNewBranchName('')
    } catch (err) {
      setBranchError((err as Error).message)
    } finally {
      setBranchLoading(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Undo last commit bar */}
      <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 6 }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}
          onClick={undoLastCommit}
          disabled={loading.undo || commits.length === 0}
          title={t('history.undoTitle')}
        >
          {loading.undo ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Undo2 size={12} />}
          {t('history.undoLastCommit')}
        </button>
      </div>

      {/* Branch creation input */}
      {branchInput && (
        <div style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--color-border)',
          background: 'rgba(200, 168, 48, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <GitBranch size={12} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-accent)' }}>
                {branchInput.commit.shortHash}
              </span>
              {' '}{t('history.createBranchFrom')}
            </span>
            <button
              className="btn btn-ghost btn-icon"
              style={{ marginLeft: 'auto', padding: 2 }}
              onClick={() => { setBranchInput(null); setNewBranchName(''); setBranchError('') }}
            >
              <X size={12} />
            </button>
          </div>
          <input
            ref={inputRef}
            className="input input-mono"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="new-branch-name"
            style={{ fontSize: '0.8125rem' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateBranch()
              if (e.key === 'Escape') { setBranchInput(null); setNewBranchName(''); setBranchError('') }
            }}
          />
          {branchError && (
            <p style={{ fontSize: '0.7rem', color: 'var(--color-danger)', margin: 0 }}>{branchError}</p>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}
              onClick={handleCreateBranch}
              disabled={branchLoading || !newBranchName.trim()}
            >
              {branchLoading
                ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />{t('history.creating')}</>
                : <><GitBranch size={12} />{t('history.createDraftBranch')}</>
              }
            </button>
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {t('history.branchNote')}
          </p>
        </div>
      )}

      <div
        ref={listRef}
        style={{ flex: 1, overflow: 'auto' }}
        onScroll={handleScroll}
      >
        {commits.length === 0 ? (
          <div className="empty-state">
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              {t('history.noCommits')}
            </span>
          </div>
        ) : (
          commits.map((commit, index) => (
            <CommitRow
              key={commit.hash}
              commit={commit}
              active={activeCommit?.hash === commit.hash}
              isLatest={index === 0}
              relativeTime={relativeTime}
              onClick={() => selectCommit(commit)}
              onRevert={() => {
                if (confirm(t('history.revertConfirm', { message: commit.message }))) {
                  revertCommit(commit.hash)
                }
              }}
              onCreateBranch={() => {
                setContextMenu(null)
                setBranchInput({ commit })
                setNewBranchName('')
                setBranchError('')
              }}
              onContextMenu={(x, y) => setContextMenu({ x, y, commit })}
            />
          ))
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="context-menu-item"
            onClick={() => {
              setContextMenu(null)
              setBranchInput({ commit: contextMenu.commit })
              setNewBranchName('')
              setBranchError('')
            }}
          >
            <GitBranch size={13} />
            {t('history.createBranchHere')}
          </button>
          <div className="context-menu-separator" />
          <button
            className="context-menu-item danger"
            onClick={() => {
              setContextMenu(null)
              if (confirm(t('history.revertConfirm', { message: contextMenu.commit.message }))) {
                revertCommit(contextMenu.commit.hash)
              }
            }}
          >
            <RotateCcw size={13} />
            {t('history.revertCommit')}
          </button>
        </div>
      )}
    </div>
  )
}

interface CommitRowProps {
  commit: GitCommit
  active: boolean
  isLatest: boolean
  relativeTime: (dateStr: string) => string
  onClick: () => void
  onRevert: () => void
  onCreateBranch: () => void
  onContextMenu: (x: number, y: number) => void
}

function CommitRow({ commit, active, isLatest, relativeTime, onClick, onRevert, onCreateBranch, onContextMenu }: CommitRowProps) {
  const initials = getInitials(commit.author)
  const color = hashColor(commit.authorEmail)
  const [hover, setHover] = React.useState(false)
  const { t } = useTranslation()

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    onContextMenu(e.clientX, e.clientY)
  }

  return (
    <div
      onClick={onClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        gap: 10,
        padding: '8px 12px',
        cursor: 'pointer',
        background: active ? 'var(--color-surface-2)' : 'transparent',
        borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        transition: 'background 0.1s',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
      }}
      onMouseOver={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--color-surface-2)'
      }}
      onMouseOut={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 2,
          background: color + '22',
          border: `1px solid ${color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '0.7rem',
          color,
          marginTop: 1,
        }}
      >
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Message */}
        <div
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-primary)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 3,
          }}
        >
          {commit.message}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.7rem',
              color: 'var(--color-accent)',
              background: 'rgba(200, 168, 48, 0.08)',
              padding: '0 5px',
              borderRadius: 2,
              border: '1px solid rgba(200, 168, 48, 0.2)',
            }}
          >
            {commit.shortHash}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {commit.author}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
            {relativeTime(commit.date)}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      {hover && (
        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
          <button
            className="btn btn-ghost btn-icon"
            style={{ padding: 4 }}
            onClick={(e) => { e.stopPropagation(); onCreateBranch() }}
            title={t('history.createBranchHere')}
          >
            <GitBranch size={12} style={{ color: 'var(--color-accent)' }} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            style={{ padding: 4 }}
            onClick={(e) => { e.stopPropagation(); onRevert() }}
            title={t('history.revertTitle')}
          >
            <RotateCcw size={12} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
      )}
    </div>
  )
}
