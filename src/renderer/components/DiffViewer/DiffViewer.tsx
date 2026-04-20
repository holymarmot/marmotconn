import React from 'react'
import { useAppStore } from '../../store/appStore'
import { GitDiff } from '../../../shared/types'

export function DiffViewer() {
  const { activeDiff, activeCommit, activeRepo } = useAppStore()

  if (!activeDiff) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.8125rem',
            color: 'var(--color-text-primary)',
          }}
        >
          {activeDiff.filePath}
        </span>
        {activeDiff.isNew && <span className="tag tag-green">YENİ</span>}
        {activeDiff.isDeleted && <span className="tag tag-red">SİLİNDİ</span>}
        {activeDiff.isBinary && <span className="tag tag-muted">İKİLİ</span>}

        {activeCommit && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              color: 'var(--color-accent)',
            }}
          >
            {activeCommit.shortHash}
          </span>
        )}
      </div>

      {/* Diff content */}
      <div style={{ flex: 1, overflow: 'auto' }} className="selectable">
        {activeDiff.isBinary ? (
          <div className="empty-state">
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              İkili dosya farkı gösterilemiyor
            </p>
          </div>
        ) : activeDiff.hunks.length === 0 ? (
          <div className="empty-state">
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              Fark bulunamadı
            </p>
          </div>
        ) : (
          <div>
            {activeDiff.hunks.map((hunk, hi) => (
              <div key={hi}>
                {/* Hunk header */}
                <div className="diff-hunk-header font-mono">
                  {hunk.header}
                </div>
                {/* Lines */}
                {hunk.lines.map((line, li) => (
                  <div
                    key={li}
                    className={`diff-line ${
                      line.type === 'add' ? 'diff-add' :
                      line.type === 'remove' ? 'diff-remove' :
                      'diff-context'
                    }`}
                  >
                    <span className="diff-line-num">
                      {line.type === 'add' ? line.newLineNum :
                       line.type === 'remove' ? line.oldLineNum :
                       line.oldLineNum}
                    </span>
                    <span
                      className="diff-line-content"
                      style={{
                        color:
                          line.type === 'add' ? 'var(--diff-add-text)' :
                          line.type === 'remove' ? 'var(--diff-remove-text)' :
                          'var(--color-text-secondary)',
                      }}
                    >
                      {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                      {line.content}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
