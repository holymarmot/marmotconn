import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import {
  GitBranch,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  X,
  Loader2,
  History,
  GitMerge,
  Zap,
  Archive,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function TopBar() {
  const {
    activeRepo,
    gitStatus,
    cancelPull,
    activeBranch,
    branches,
    activeTab,
    setActiveTab,
    pullRepo,
    pushRepo,
    pushBranch,
    checkout,
    loading,
    checkoutLoading,
    afterUndo,
    stashEntries,
  } = useAppStore()

  const { t } = useTranslation()

  const isBranchUnpublished = !!activeBranch && gitStatus?.tracking === null

  const [showBranchDropdown, setShowBranchDropdown] = useState(false)

  if (!activeRepo) return null

  const ahead = gitStatus?.ahead ?? 0
  const behind = gitStatus?.behind ?? 0

  async function handleCheckout(branchName: string) {
    setShowBranchDropdown(false)
    await checkout(branchName)
  }

  const totalChanges =
    (gitStatus?.staged.length ?? 0) +
    (gitStatus?.unstaged.length ?? 0) +
    (gitStatus?.untracked.length ?? 0)

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      {/* Repo action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>

        {/* Branch selector */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn"
            style={{ gap: 6, minWidth: 120 }}
            onClick={() => setShowBranchDropdown((v) => !v)}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />
            ) : (
              <GitBranch size={12} />
            )}
            <span className="font-mono" style={{ fontSize: '0.8125rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeBranch || '—'}
            </span>
            {checkoutLoading ? (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t('topbar.switching')}</span>
            ) : (
              <ChevronDown size={11} />
            )}
          </button>

          {showBranchDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              minWidth: 220,
              zIndex: 50,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              maxHeight: 320,
              overflow: 'auto',
            }}>
              <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('topbar.selectBranch')}
                </span>
              </div>

              {branches.filter(b => !b.remote).length > 0 && (
                <div style={{ padding: '4px 8px 2px', fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('topbar.local')}
                </div>
              )}
              {branches.filter(b => !b.remote).map((b) => (
                <button
                  key={b.name}
                  onClick={() => handleCheckout(b.name)}
                  style={{
                    width: '100%', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8,
                    background: b.current ? 'var(--color-surface-2)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    color: 'var(--color-text-primary)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace',
                  }}
                  onMouseEnter={(e) => { if (!b.current) e.currentTarget.style.background = 'var(--color-surface-2)' }}
                  onMouseLeave={(e) => { if (!b.current) e.currentTarget.style.background = 'transparent' }}
                >
                  {b.current ? <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem' }}>●</span> : <span style={{ width: 10 }} />}
                  {b.name}
                </button>
              ))}

              {branches.filter(b => b.remote).length > 0 && (
                <>
                  <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                  <div style={{ padding: '4px 8px 2px', fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('topbar.remote')}
                  </div>
                  {branches.filter(b => b.remote).map((b) => (
                    <button
                      key={`remote-${b.name}`}
                      onClick={() => handleCheckout(b.name)}
                      style={{
                        width: '100%', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8,
                        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                        color: 'var(--color-text-secondary)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <GitMerge size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      {b.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* After-undo indicator */}
        {afterUndo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px',
            background: 'rgba(255, 155, 33, 0.1)', border: '1px solid rgba(255,155,33,0.3)',
            borderRadius: 2, fontSize: '0.7rem', color: 'var(--color-warning)',
          }}>
            <Zap size={11} />
            {t('topbar.commitUndone')}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {/* Pull button */}
          {loading.pull ? (
            <button className="btn btn-danger" onClick={cancelPull} title={t('topbar.cancel')}>
              <X size={12} />
              {t('topbar.cancel')}
            </button>
          ) : (
            <button
              className="btn"
              onClick={pullRepo}
              title={behind > 0 ? t('topbar.pullCount', { count: behind }) : t('topbar.pull')}
            >
              <ArrowDown size={12} />
              {t('topbar.pull')}
              {behind > 0 && (
                <span style={{ background: 'var(--color-accent)', color: '#000', borderRadius: 2, padding: '0 5px', fontSize: '0.7rem', fontWeight: 700, lineHeight: '16px' }}>
                  {behind}
                </span>
              )}
            </button>
          )}

          {/* Push branch button — shown when branch has no remote tracking */}
          {isBranchUnpublished && (
            <button
              className="btn btn-primary"
              onClick={pushBranch}
              disabled={loading.pushBranch}
              title={`"${activeBranch}" ${t('topbar.publishBranch')}`}
              style={{ gap: 5 }}
            >
              {loading.pushBranch ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <GitBranch size={12} />
              )}
              {t('topbar.publishBranch')}
            </button>
          )}

          {/* Push button */}
          {!isBranchUnpublished && (
            <button
              className={`btn ${afterUndo ? 'btn-danger' : ''}`}
              onClick={pushRepo}
              disabled={loading.push}
              title={afterUndo ? t('topbar.forcePush') : ahead > 0 ? t('topbar.pushCount', { count: ahead }) : t('topbar.push')}
            >
              {loading.push ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : afterUndo ? (
                <Zap size={12} />
              ) : (
                <ArrowUp size={12} />
              )}
              {afterUndo ? t('topbar.forcePush') : t('topbar.push')}
              {ahead > 0 && !afterUndo && (
                <span style={{ background: 'var(--color-accent)', color: '#000', borderRadius: 2, padding: '0 5px', fontSize: '0.7rem', fontWeight: 700, lineHeight: '16px' }}>
                  {ahead}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Pull progress bar */}
      {loading.pull && (
        <div style={{ height: 3, background: 'var(--color-border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #C8A830, #E8C947)',
            width: '40%',
            animation: 'progress-slide 1.2s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'changes' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          {t('tab.changes')}
          {totalChanges > 0 && (
            <span style={{ background: 'var(--color-surface-2)', borderRadius: 2, padding: '0 5px', fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: '16px' }}>
              {totalChanges}
            </span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={12} />
          {t('tab.history')}
        </button>
        <button
          className={`tab ${activeTab === 'branches' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          <GitBranch size={12} />
          {t('tab.branches')}
        </button>
        <button
          className={`tab ${activeTab === 'stash' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('stash')}
        >
          <Archive size={12} />
          {t('tab.stash')}
          {stashEntries.length > 0 && (
            <span style={{ background: 'var(--color-surface-2)', borderRadius: 2, padding: '0 5px', fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: '16px' }}>
              {stashEntries.length}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
