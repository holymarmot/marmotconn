import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import { FileChange } from '../../../shared/types'
import { Loader2, Check, Undo2, RotateCcw, FolderOpen, EyeOff, ChevronDown, Minus, Archive, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function statusLabel(status: FileChange['status']): string {
  switch (status) {
    case 'added': return 'A'
    case 'modified': return 'M'
    case 'deleted': return 'D'
    case 'renamed': return 'R'
    case 'copied': return 'C'
    case 'untracked': return 'U'
    default: return '?'
  }
}

function statusColor(status: FileChange['status']): string {
  switch (status) {
    case 'added': return 'var(--color-success)'
    case 'modified': return 'var(--color-warning)'
    case 'deleted': return 'var(--color-danger)'
    case 'renamed': return '#7EB8FF'
    case 'untracked': return 'var(--color-text-muted)'
    default: return 'var(--color-text-muted)'
  }
}

export function ChangesView() {
  const {
    gitStatus,
    stageFile,
    unstageFile,
    unstageAll,
    stageAll,
    commitChanges,
    undoLastCommit,
    discardFileChanges,
    discardAll,
    stashSave,
    stashSaveKeepIndex,
    addToGitignore,
    selectFile,
    activeDiff,
    loading,
    refreshStatus,
    activeRepo,
  } = useAppStore()

  const { t } = useTranslation()
  const [commitMsg, setCommitMsg] = useState('')
  const [prefix, setPrefix] = useState('')
  const [amend, setAmend] = useState(false)
  const [activeFile, setActiveFile] = useState<{ path: string; staged: boolean } | null>(null)
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)
  const actionsDropdownRef = useRef<HTMLDivElement>(null)

  const GIT_PREFIXES = [
    { value: '', label: t('changes.prefixSelect') },
    { value: 'feat', label: t('changes.feat') },
    { value: 'fix', label: t('changes.fix') },
    { value: 'docs', label: t('changes.docs') },
    { value: 'style', label: t('changes.style') },
    { value: 'refactor', label: t('changes.refactor') },
    { value: 'perf', label: t('changes.perf') },
    { value: 'test', label: t('changes.test') },
    { value: 'chore', label: t('changes.chore') },
    { value: 'build', label: t('changes.build') },
    { value: 'ci', label: t('changes.ci') },
    { value: 'revert', label: t('changes.revert') },
    { value: 'wip', label: t('changes.wip') },
  ]

  useEffect(() => {
    if (!showActionsDropdown) return
    const handler = (e: MouseEvent) => {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(e.target as Node)) {
        setShowActionsDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showActionsDropdown])

  if (!activeRepo) return null

  const staged = gitStatus?.staged ?? []
  const unstaged = gitStatus?.unstaged ?? []
  const untracked = gitStatus?.untracked ?? []
  const allUnstaged: FileChange[] = [
    ...unstaged,
    ...untracked.map((p) => ({ path: p, status: 'untracked' as const, staged: false })),
  ]

  async function handleFileClick(path: string, staged: boolean) {
    setActiveFile({ path, staged })
    await selectFile(path, staged)
  }

  async function handleCommit() {
    const fullMsg = prefix ? `${prefix}: ${commitMsg.trim()}` : commitMsg.trim()
    if (!fullMsg && !amend) return
    await commitChanges(fullMsg, amend)
    setCommitMsg('')
    setPrefix('')
    setAmend(false)
  }

  const hasChanges = staged.length > 0 || allUnstaged.length > 0
  const canCommit = (staged.length > 0) && (commitMsg.trim() || amend)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Staged files */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div
          className="section-header"
          style={{ paddingTop: 10 }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: staged.length > 0 ? 'pointer' : 'default' }}>
            <input
              type="checkbox"
              className="checkbox"
              checked={staged.length > 0}
              disabled={staged.length === 0}
              onChange={() => unstageAll()}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="section-title">
              {t('changes.staged')}
              {staged.length > 0 && (
                <span style={{ marginLeft: 6, color: 'var(--color-accent)' }}>{staged.length}</span>
              )}
            </span>
          </label>
        </div>

        <div style={{ maxHeight: 180, overflow: 'auto' }}>
          {staged.length === 0 ? (
            <p style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {t('changes.noStagedFiles')}
            </p>
          ) : (
            staged.map((file) => (
              <FileRow
                key={file.path}
                file={file}
                active={activeFile?.path === file.path && activeFile?.staged === true}
                onClick={() => handleFileClick(file.path, true)}
                onStageToggle={() => unstageFile(file.path)}
                onDiscard={() => discardFileChanges(file.path, false)}
                onGitignore={() => addToGitignore(file.path)}
                onGitignoreExt={() => {
                  const ext = file.path.includes('.') ? `*.${file.path.split('.').pop()}` : file.path
                  addToGitignore(ext)
                }}
                repoPath={activeRepo.localPath}
                staged
              />
            ))
          )}
        </div>
      </div>

      {/* Unstaged files */}
      <div style={{ borderBottom: '1px solid var(--color-border)', flex: '0 0 auto' }}>
        <div className="section-header" style={{ paddingTop: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: allUnstaged.length > 0 ? 'pointer' : 'default' }}>
            <input
              type="checkbox"
              className="checkbox"
              checked={false}
              disabled={allUnstaged.length === 0}
              onChange={() => stageAll()}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="section-title">
              {t('changes.changes')}
              {allUnstaged.length > 0 && (
                <span style={{ marginLeft: 6, color: 'var(--color-text-secondary)' }}>{allUnstaged.length}</span>
              )}
            </span>
          </label>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {hasChanges && (
              <div ref={actionsDropdownRef} style={{ position: 'relative' }}>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '0.7rem', padding: '2px 4px' }}
                  onClick={() => setShowActionsDropdown((v) => !v)}
                  title={t('changes.moreActions')}
                >
                  <ChevronDown size={11} />
                </button>
                {showActionsDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    minWidth: 210,
                    zIndex: 50,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}>
                    <button
                      className="context-menu-item"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setShowActionsDropdown(false)
                        stashSave('Manuel stash')
                      }}
                    >
                      <Archive size={13} />
                      {t('changes.stashAll')}
                    </button>
                    <button
                      className="context-menu-item"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setShowActionsDropdown(false)
                        stashSaveKeepIndex('Manuel stash')
                      }}
                    >
                      <Archive size={13} />
                      {t('changes.stashUnstaged')}
                    </button>
                    <div className="context-menu-separator" />
                    <button
                      className="context-menu-item danger"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setShowActionsDropdown(false)
                        if (confirm(t('changes.discardAllConfirm'))) {
                          discardAll()
                        }
                      }}
                    >
                      <Trash2 size={13} />
                      {t('changes.discardAll')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {allUnstaged.length === 0 ? (
            <p style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {t('changes.noChanges')}
            </p>
          ) : (
            allUnstaged.map((file) => (
              <FileRow
                key={file.path}
                file={file}
                active={activeFile?.path === file.path && activeFile?.staged === false}
                onClick={() => handleFileClick(file.path, false)}
                onStageToggle={() => stageFile(file.path)}
                onDiscard={() => discardFileChanges(file.path, file.status === 'untracked')}
                onGitignore={() => addToGitignore(file.path)}
                onGitignoreExt={() => {
                  const ext = file.path.includes('.') ? `*.${file.path.split('.').pop()}` : file.path
                  addToGitignore(ext)
                }}
                repoPath={activeRepo.localPath}
                staged={false}
              />
            ))
          )}
        </div>
      </div>

      {/* Commit area */}
      <div style={{ padding: 12, marginTop: 'auto' }}>
        {/* Prefix dropdown */}
        <div style={{ position: 'relative', marginBottom: 6 }}>
          <select
            className="input"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            style={{
              cursor: 'pointer',
              appearance: 'none',
              paddingRight: 28,
              fontSize: '0.75rem',
              fontFamily: 'JetBrains Mono, monospace',
              color: prefix ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            {GIT_PREFIXES.map((p) => (
              <option key={p.value} value={p.value} style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Commit message */}
        <textarea
          className="input selectable"
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder={t('changes.commitMessage')}
          rows={3}
          style={{
            resize: 'none',
            width: '100%',
            marginBottom: 8,
            fontFamily: 'Epilogue, sans-serif',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCommit()
          }}
        />

        {/* Preview of full commit message */}
        {prefix && commitMsg.trim() && (
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
            → <span style={{ color: 'var(--color-accent)' }}>{prefix}:</span> {commitMsg.trim()}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              className="checkbox"
              checked={amend}
              onChange={(e) => setAmend(e.target.checked)}
            />
            {t('changes.amendLast')}
          </label>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 6 }}
          onClick={handleCommit}
          disabled={(!commitMsg.trim() && !amend) || loading.commit || staged.length === 0}
        >
          {loading.commit ? (
            <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />{t('changes.committing')}</>
          ) : (
            <><Check size={13} />{t('changes.commit')}</>
          )}
        </button>

        {/* Undo last commit */}
        <button
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}
          onClick={undoLastCommit}
          disabled={loading.undo}
          title={t('changes.undoLastCommitTitle')}
        >
          {loading.undo ? (
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Undo2 size={12} />
          )}
          {t('changes.undoLastCommit')}
        </button>
      </div>
    </div>
  )
}

interface FileRowProps {
  file: FileChange
  active: boolean
  onClick: () => void
  onStageToggle: () => void
  onDiscard: () => void
  onGitignore: () => void
  onGitignoreExt: () => void
  repoPath: string
  staged: boolean
}

function FileRow({ file, active, onClick, onStageToggle, onDiscard, onGitignore, onGitignoreExt, repoPath, staged }: FileRowProps) {
  const fileName = file.path.split('/').pop() || file.path
  const dir = file.path.includes('/')
    ? file.path.substring(0, file.path.lastIndexOf('/'))
    : ''

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

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

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  async function handleShowInExplorer(e: React.MouseEvent) {
    e.stopPropagation()
    setContextMenu(null)
    const fullPath = `${repoPath}/${file.path}`.replace(/\//g, '\\')
    await window.marmot.fs.openInExplorer({ path: fullPath })
  }

  return (
    <>
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          cursor: 'pointer',
          background: active ? 'var(--color-surface-2)' : 'transparent',
          borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = 'var(--color-surface-2)'
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = 'transparent'
        }}
      >
        <input
          type="checkbox"
          className="checkbox"
          checked={staged}
          onChange={(e) => {
            e.stopPropagation()
            onStageToggle()
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ flexShrink: 0 }}
        />
        <span
          style={{
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem',
            fontWeight: 700,
            color: statusColor(file.status),
            flexShrink: 0,
            border: `1px solid ${statusColor(file.status)}`,
            borderRadius: 2,
          }}
        >
          {statusLabel(file.status)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-primary)',
              fontFamily: 'JetBrains Mono, monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {fileName}
          </span>
          {dir && (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {dir}
            </span>
          )}
        </div>

        {/* Quick discard button */}
        <button
          className="btn btn-ghost btn-icon"
          style={{ padding: 2, flexShrink: 0, opacity: 0.7 }}
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(t('changes.discardFileConfirm', { fileName }))) {
              onDiscard()
            }
          }}
          title={t('changes.discardChanges')}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-danger)'
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = ''
            e.currentTarget.style.opacity = '0.7'
          }}
        >
          <RotateCcw size={11} />
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="context-menu-item" onClick={(e) => { e.stopPropagation(); handleShowInExplorer(e) }}>
            <FolderOpen size={13} />
            {t('changes.showInExplorer')}
          </button>
          <div className="context-menu-separator" />
          <button
            className="context-menu-item danger"
            onClick={(e) => {
              e.stopPropagation()
              setContextMenu(null)
              if (confirm(t('changes.discardFileConfirm', { fileName }))) {
                onDiscard()
              }
            }}
          >
            <RotateCcw size={13} />
            {t('changes.discardChanges')}
          </button>
          <div className="context-menu-separator" />
          <button
            className="context-menu-item"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); onGitignore() }}
          >
            <EyeOff size={13} />
            {t('changes.addToGitignore')}
          </button>
          <button
            className="context-menu-item"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); onGitignoreExt() }}
          >
            <Minus size={13} />
            {t('changes.addExtToGitignore')}
          </button>
        </div>
      )}
    </>
  )
}
