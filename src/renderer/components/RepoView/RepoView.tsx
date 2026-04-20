import React from 'react'
import { useAppStore } from '../../store/appStore'
import { TopBar } from '../TopBar/TopBar'
import { ChangesView } from '../ChangesView/ChangesView'
import { HistoryView } from '../HistoryView/HistoryView'
import { BranchPanel } from '../BranchPanel/BranchPanel'
import { StashView } from '../StashView/StashView'
import { DiffViewer } from '../DiffViewer/DiffViewer'
import { StashDiffPanel } from '../StashView/StashDiffPanel'
import { useTranslation } from 'react-i18next'

export function RepoView() {
  const { activeTab, activeDiff, activeCommit, gitStatus } = useAppStore()

  const showDiff = activeTab !== 'branches' && activeTab !== 'stash'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel */}
        <div
          style={{
            width: 280,
            minWidth: 280,
            overflow: 'hidden',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === 'changes' && <ChangesView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'branches' && <BranchPanel />}
          {activeTab === 'stash' && <StashView />}
        </div>

        {/* Right panel: Diff viewer (hidden when on branches tab) */}
        {showDiff && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeDiff ? (
              <DiffViewer />
            ) : (
              <EmptyDiff />
            )}
          </div>
        )}

        {/* Branches tab: full-width panel */}
        {activeTab === 'branches' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BranchEmptyState />
          </div>
        )}

        {/* Stash tab: diff viewer on the right */}
        {activeTab === 'stash' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <StashDiffPanel />
          </div>
        )}
      </div>
    </div>
  )
}

function BranchEmptyState() {
  const { t } = useTranslation()
  return (
    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
      {t('repoview.selectBranch')}
    </p>
  )
}

function EmptyDiff() {
  const { activeTab, gitStatus } = useAppStore()
  const { t } = useTranslation()

  const hint = activeTab === 'changes'
    ? (gitStatus?.staged.length || gitStatus?.unstaged.length || gitStatus?.untracked.length)
      ? t('repoview.selectFile')
      : t('repoview.noChanges')
    : t('repoview.selectCommit')

  return (
    <div className="empty-state" style={{ height: '100%' }}>
      <div
        style={{
          width: 48,
          height: 48,
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '1.25rem',
          fontWeight: 700,
        }}
      >
        ±
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{hint}</p>
    </div>
  )
}
