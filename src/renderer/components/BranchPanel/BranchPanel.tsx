import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { GitBranch } from '../../../shared/types'
import { Plus, Trash2, Loader2, GitMerge, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function BranchPanel() {
  const { branches, activeBranch, checkout, createBranch, deleteBranch } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation()

  const local = branches.filter((b) => !b.remote)
  const remote = branches.filter((b) => b.remote)

  async function handleCreate() {
    if (!newBranchName.trim()) return
    setLoading(true)
    setError('')
    try {
      await createBranch(newBranchName.trim())
      setNewBranchName('')
      setShowCreate(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(branch: GitBranch) {
    if (branch.name === activeBranch) {
      setError(t('branch.cannotDeleteActive'))
      return
    }

    const isDraft = !branch.hasUpstream
    const unpushed = branch.ahead ?? 0

    let confirmMsg: string

    if (isDraft) {
      confirmMsg = t('branch.deleteDraftConfirm', { name: branch.name })
    } else if (unpushed > 0) {
      confirmMsg = t('branch.deleteUnpushedConfirm', { name: branch.name, count: unpushed })
    } else {
      confirmMsg = t('branch.deleteConfirm', { name: branch.name })
    }

    if (!confirm(confirmMsg)) return
    await deleteBranch(branch.name)
  }

  async function handleCheckout(name: string) {
    if (name === activeBranch) return
    await checkout(name)
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {/* Create branch */}
      <div style={{ padding: 12, borderBottom: '1px solid var(--color-border)' }}>
        {showCreate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              className="input input-mono"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="new-branch-name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setShowCreate(false)
              }}
            />
            {error && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{error}</p>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : t('branch.create')}
              </button>
              <button
                className="btn"
                onClick={() => { setShowCreate(false); setError('') }}
              >
                {t('branch.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={12} />
            {t('branch.newBranch')}
          </button>
        )}
      </div>

      {/* Local branches */}
      <BranchSection
        title={t('branch.localBranches')}
        branches={local}
        activeBranch={activeBranch}
        onCheckout={handleCheckout}
        onDelete={handleDelete}
        isRemote={false}
      />

      {/* Remote branches */}
      {remote.length > 0 && (
        <BranchSection
          title={t('branch.remoteBranches')}
          branches={remote}
          activeBranch={activeBranch}
          onCheckout={handleCheckout}
          isRemote
        />
      )}
    </div>
  )
}

interface BranchSectionProps {
  title: string
  branches: GitBranch[]
  activeBranch: string
  onCheckout: (name: string) => void
  onDelete?: (branch: GitBranch) => void
  isRemote: boolean
}

function BranchSection({ title, branches, activeBranch, onCheckout, onDelete, isRemote }: BranchSectionProps) {
  return (
    <div>
      <div className="section-header" style={{ paddingTop: 10 }}>
        <span className="section-title">{title}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{branches.length}</span>
      </div>
      {branches.map((branch) => (
        <BranchRow
          key={branch.name}
          branch={branch}
          active={branch.name === activeBranch}
          onCheckout={() => onCheckout(branch.name)}
          onDelete={onDelete ? () => onDelete(branch) : undefined}
          isRemote={isRemote}
        />
      ))}
    </div>
  )
}

interface BranchRowProps {
  branch: GitBranch
  active: boolean
  onCheckout: () => void
  onDelete?: () => void
  isRemote: boolean
}

function BranchRow({ branch, active, onCheckout, onDelete, isRemote }: BranchRowProps) {
  const [hover, setHover] = useState(false)
  const { t } = useTranslation()

  const isDraft = !isRemote && !branch.hasUpstream
  const unpushed = !isRemote ? (branch.ahead ?? 0) : 0
  const hasWarning = isDraft || unpushed > 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px 12px',
        background: active ? 'var(--color-surface-2)' : 'transparent',
        borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        cursor: 'pointer',
        gap: 6,
        transition: 'background 0.1s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onCheckout}
    >
      {isRemote ? (
        <GitMerge size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      ) : active ? (
        <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem', flexShrink: 0 }}>●</span>
      ) : (
        <span style={{ width: 12, flexShrink: 0 }} />
      )}

      <span
        style={{
          flex: 1,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.8125rem',
          color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {branch.name}
      </span>

      {/* Status badges */}
      {!isRemote && (
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
          {isDraft && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-warning)',
              background: 'rgba(255,155,33,0.12)', border: '1px solid rgba(255,155,33,0.3)',
              borderRadius: 2, padding: '0 4px', lineHeight: '14px',
            }}>
              DRAFT
            </span>
          )}
          {!isDraft && unpushed > 0 && (
            <span
              title={t('branch.deleteUnpushedTitle', { count: unpushed })}
              style={{
                fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-accent)',
                background: 'rgba(200,168,48,0.1)', border: '1px solid rgba(200,168,48,0.3)',
                borderRadius: 2, padding: '0 4px', lineHeight: '14px',
              }}
            >
              ↑{unpushed}
            </span>
          )}
        </div>
      )}

      {hover && onDelete && !active && (
        <button
          className="btn btn-ghost btn-icon"
          style={{
            padding: 3, flexShrink: 0,
            color: hasWarning ? 'var(--color-danger)' : undefined,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title={isDraft ? t('branch.deleteDraftTitle') : unpushed > 0 ? t('branch.deleteUnpushedTitle', { count: unpushed }) : t('branch.deleteLocalTitle')}
        >
          {hasWarning ? <AlertTriangle size={11} /> : <Trash2 size={11} />}
        </button>
      )}
    </div>
  )
}
