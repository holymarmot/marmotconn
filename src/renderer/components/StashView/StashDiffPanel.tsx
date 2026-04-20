import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { GitDiff } from '../../../shared/types'
import { Archive, FileText, CornerUpLeft } from 'lucide-react'
import { SpinnerIcon } from '../common/Icons'

export function StashDiffPanel() {
  const { activeStashIndex, activeStashDiffs, stashEntries, loading, checkoutFileFromStash } = useAppStore()
  const [selectedFile, setSelectedFile] = useState<GitDiff | null>(null)

  // Reset selected file when stash entry changes
  React.useEffect(() => {
    setSelectedFile(activeStashDiffs[0] ?? null)
  }, [activeStashIndex])

  if (activeStashIndex === null) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <Archive size={32} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
          İçeriği görmek için bir stash seçin
        </p>
      </div>
    )
  }

  const entry = stashEntries.find((e) => e.index === activeStashIndex)
  const label = entry
    ? (entry.message.replace(/^WIP on [^:]+: /, '').replace(/^On [^:]+: /, '') || entry.message)
    : `stash@{${activeStashIndex}}`

  if (loading.stash && activeStashDiffs.length === 0) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <SpinnerIcon size={20} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Yükleniyor...</p>
      </div>
    )
  }

  if (activeStashDiffs.length === 0) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Bu stash'te değişiklik yok</p>
      </div>
    )
  }

  const displayDiff = selectedFile ?? activeStashDiffs[0]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* File list sidebar */}
      <div style={{
        width: 200,
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Stash title */}
        <div style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}>
          <Archive size={11} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span style={{
            fontSize: '0.75rem', color: 'var(--color-text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'JetBrains Mono, monospace',
          }} title={label}>
            {label}
          </span>
        </div>

        {/* File list */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeStashDiffs.map((diff) => {
            const fileName = diff.filePath.split('/').pop() || diff.filePath
            const dir = diff.filePath.includes('/')
              ? diff.filePath.substring(0, diff.filePath.lastIndexOf('/'))
              : ''
            const isActive = displayDiff?.filePath === diff.filePath

            return (
              <div
                key={diff.filePath}
                onClick={() => setSelectedFile(diff)}
                style={{
                  padding: '5px 8px 5px 10px',
                  cursor: 'pointer',
                  borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                  background: isActive ? 'var(--color-surface-2)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <FileText size={11} style={{
                  flexShrink: 0,
                  color: diff.isNew ? 'var(--color-success)'
                    : diff.isDeleted ? 'var(--color-danger)'
                    : 'var(--color-text-muted)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.78rem', color: 'var(--color-text-primary)',
                    fontFamily: 'JetBrains Mono, monospace',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {fileName}
                  </div>
                  {dir && (
                    <div style={{
                      fontSize: '0.65rem', color: 'var(--color-text-muted)',
                      fontFamily: 'JetBrains Mono, monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {dir}
                    </div>
                  )}
                </div>
                <button
                  title="Bu dosyayı geri yükle"
                  onClick={(e) => {
                    e.stopPropagation()
                    checkoutFileFromStash(activeStashIndex!, diff.filePath)
                  }}
                  disabled={loading.stash}
                  style={{
                    flexShrink: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 3,
                    color: 'var(--color-accent)',
                    opacity: loading.stash ? 0.4 : 0.7,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = loading.stash ? '0.4' : '0.7' }}
                >
                  <CornerUpLeft size={11} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Diff content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {displayDiff ? (
          <>
            {/* File header */}
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
              background: 'var(--color-surface)',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                {displayDiff.filePath}
              </span>
              {displayDiff.isNew && <span className="tag tag-green">YENİ</span>}
              {displayDiff.isDeleted && <span className="tag tag-red">SİLİNDİ</span>}
              {displayDiff.isBinary && <span className="tag tag-muted">İKİLİ</span>}
            </div>

            {/* Diff lines */}
            <div style={{ flex: 1, overflow: 'auto' }} className="selectable">
              {displayDiff.isBinary ? (
                <div className="empty-state">
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>İkili dosya</p>
                </div>
              ) : displayDiff.hunks.length === 0 ? (
                <div className="empty-state">
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Fark bulunamadı</p>
                </div>
              ) : (
                <div>
                  {displayDiff.hunks.map((hunk, hi) => (
                    <div key={hi}>
                      <div className="diff-hunk-header font-mono">{hunk.header}</div>
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
                              color: line.type === 'add' ? 'var(--diff-add-text)' :
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
          </>
        ) : null}
      </div>
    </div>
  )
}
