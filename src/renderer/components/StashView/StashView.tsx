import React from 'react'
import { useAppStore } from '../../store/appStore'
import { Archive, Inbox } from 'lucide-react'
import { SpinnerIcon } from '../common/Icons'
import { useTranslation } from 'react-i18next'
import { DATE_LOCALES, LangCode } from '../../i18n'

export function StashView() {
  const {
    stashEntries,
    activeStashIndex,
    stashSelectedIndices,
    loading,
    refreshStash,
    loadStashDiff,
    toggleStashSelection,
    selectAllStash,
    deselectAllStash,
    stashDrop,
    popSelected,
    applySelected,
    dropSelected,
  } = useAppStore()

  const { t, i18n } = useTranslation()

  React.useEffect(() => {
    refreshStash()
  }, [])

  const allSelected = stashEntries.length > 0 && stashSelectedIndices.size === stashEntries.length
  const noneSelected = stashSelectedIndices.size === 0

  const dateLocale = DATE_LOCALES[i18n.language as LangCode] || 'en-US'

  if (stashEntries.length === 0) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <Inbox size={32} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{t('stash.empty')}</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'center', maxWidth: 200 }}>
          {t('stash.hint')}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header with select-all */}
      <div className="section-header" style={{ paddingTop: 10, borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            className="checkbox"
            checked={allSelected}
            onChange={() => allSelected ? deselectAllStash() : selectAllStash()}
          />
          <span className="section-title">
            {t('tab.stash')}
            <span style={{ marginLeft: 6, color: 'var(--color-accent)' }}>{stashEntries.length}</span>
          </span>
        </label>
        {!noneSelected && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {t('stash.selected', { count: stashSelectedIndices.size })}
          </span>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {stashEntries.map((entry) => {
          const label = entry.message.replace(/^WIP on [^:]+: /, '').replace(/^On [^:]+: /, '')
          const isActive = activeStashIndex === entry.index
          const isSelected = stashSelectedIndices.has(entry.index)

          return (
            <div
              key={entry.index}
              onClick={() => loadStashDiff(entry.index)}
              style={{
                padding: '7px 12px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                background: isActive ? 'var(--color-surface-2)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <input
                type="checkbox"
                className="checkbox"
                checked={isSelected}
                onChange={() => toggleStashSelection(entry.index)}
                onClick={(e) => e.stopPropagation()}
                style={{ flexShrink: 0 }}
              />
              <Archive size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {label || entry.message}
                </div>
                {entry.date && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                    {new Date(entry.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '0.62rem', color: 'var(--color-text-muted)',
                fontFamily: 'JetBrains Mono, monospace', flexShrink: 0,
              }}>
                {'{' + entry.index + '}'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Action bar */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {noneSelected ? (
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
            {t('stash.clickToSelect')}
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                onClick={popSelected}
                disabled={loading.stash}
                title={t('stash.popSelected')}
              >
                {loading.stash ? <SpinnerIcon size={12} /> : null}
                {t('stash.popSelected')}
              </button>
              <button
                className="btn"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                onClick={applySelected}
                disabled={loading.stash}
              >
                {t('stash.apply')}
              </button>
            </div>
            <button
              className="btn btn-ghost"
              style={{ justifyContent: 'center', fontSize: '0.72rem', color: 'var(--color-danger)' }}
              onClick={() => {
                if (confirm(t('stash.dropConfirm', { count: stashSelectedIndices.size }))) dropSelected()
              }}
              disabled={loading.stash}
            >
              {t('stash.dropSelected')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
