import React from 'react'
import { useAppStore } from '../../store/appStore'
import { AlertTriangle, GitMerge, Archive, X, Zap } from 'lucide-react'
import { SpinnerIcon } from './Icons'
import { useTranslation } from 'react-i18next'

export function PullConflictModal() {
  const {
    showPullConflictModal,
    pullConflictFiles,
    setPullConflictModal,
    stashAndPull,
    forcePush,
    gitStatus,
    afterUndo,
    loading,
  } = useAppStore()
  const { t } = useTranslation()

  if (!showPullConflictModal) return null

  const behind = gitStatus?.behind ?? 0
  const ahead = gitStatus?.ahead ?? 0
  const isConflict = pullConflictFiles.length > 0 || (behind > 0 && ahead === 0)
  const isPushWarning = behind > 0 && ahead > 0 && !afterUndo
  const isUndoPush = afterUndo

  const title = isConflict
    ? t('conflict.titleConflict')
    : isUndoPush
    ? t('conflict.titleUndoPush')
    : t('conflict.titleBehind')

  const message = isConflict
    ? t('conflict.messageConflict')
    : isUndoPush
    ? t('conflict.messageUndoPush')
    : t('conflict.messageBehind', { count: behind })

  return (
    <div className="modal-overlay" onClick={() => setPullConflictModal(false)}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setPullConflictModal(false)}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            {message}
          </p>

          {/* Conflicting files list */}
          {pullConflictFiles.length > 0 && (
            <div style={{
              background: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: '8px 12px',
              maxHeight: 140,
              overflow: 'auto',
            }}>
              {pullConflictFiles.map((f, i) => (
                <div key={i} style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.7rem',
                  color: 'var(--color-warning)',
                  lineHeight: 1.8,
                }}>
                  {f}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Stash & Pull — main action for conflict/behind scenarios */}
            {!isUndoPush && (
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '10px 16px' }}
                onClick={stashAndPull}
                disabled={loading.pull}
              >
                {loading.pull ? (
                  <><SpinnerIcon size={14} />{t('conflict.processing')}</>
                ) : (
                  <><Archive size={14} />Stash &amp; Pull</>
                )}
              </button>
            )}

            {/* Force Push — for undo scenario */}
            {(isUndoPush || isPushWarning) && (
              <button
                className="btn btn-danger"
                style={{ justifyContent: 'center', padding: '10px 16px' }}
                onClick={() => { setPullConflictModal(false); forcePush() }}
                disabled={loading.push}
              >
                <Zap size={14} />
                {t('conflict.forcePush')}
              </button>
            )}

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            <button
              className="btn btn-ghost"
              style={{ justifyContent: 'center' }}
              onClick={() => setPullConflictModal(false)}
            >
              <X size={13} />
              {t('conflict.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
