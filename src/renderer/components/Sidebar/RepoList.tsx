import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { GiteaRepo, LocalRepo } from '../../../shared/types'
import { Folder, Cloud, Lock, Loader2, X, Trash2 } from 'lucide-react'

interface Props {
  title: string
  searchQuery: string
  repos?: LocalRepo[]
  giteaRepos?: GiteaRepo[]
  serverId?: string
}

export function RepoList({ title, searchQuery, repos, giteaRepos, serverId }: Props) {
  const { activeRepo, openRepo, recentRepos, setError, removeRecentRepo } = useAppStore()
  const [cloningRepoId, setCloningRepoId] = useState<string | null>(null)
  const [cloneProgress, setCloneProgress] = useState<{ stage: string; pct: number } | null>(null)
  const [hoveredRepoId, setHoveredRepoId] = useState<string | null>(null)

  async function handleGiteaRepoClick(repo: GiteaRepo) {
    const marmot = window.marmot

    // Check if already cloned locally
    const existing = recentRepos.find(
      (r) => r.giteaRepoId === repo.id || r.remoteUrl === repo.cloneUrl || r.remoteUrl === repo.sshUrl
    )

    if (existing) {
      const exists = await marmot.fs.exists({ path: existing.localPath })
      if (exists) {
        openRepo(existing)
        return
      }
    }

    // Prompt for clone directory
    const dir = await marmot.fs.chooseDirectory()
    if (!dir) return

    const localPath = `${dir}/${repo.name}`
    setCloningRepoId(String(repo.id))
    setCloneProgress({ stage: 'Başlatılıyor', pct: 0 })

    const removeListener = marmot.git.onCloneProgress((data) => {
      setCloneProgress({ stage: data.stage, pct: data.progress })
    })

    try {
      await marmot.git.clone({ url: repo.cloneUrl, localPath })
      const localRepo: LocalRepo = {
        id: `${serverId}-${repo.id}`,
        name: repo.name,
        fullName: repo.fullName,
        localPath,
        remoteUrl: repo.cloneUrl,
        serverId,
        giteaRepoId: repo.id,
        lastOpened: new Date().toISOString(),
        pinned: false,
      }
      openRepo(localRepo)
    } catch (err) {
      setError(`Klonlama başarısız: ${(err as Error).message}`)
    } finally {
      setCloningRepoId(null)
      setCloneProgress(null)
      removeListener()
    }
  }

  function handleLocalRepoClick(repo: LocalRepo) {
    openRepo(repo)
  }

  // Filter
  const filteredLocal = repos?.filter((r) =>
    !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredGitea = giteaRepos?.filter((r) =>
    !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasItems = (filteredLocal?.length ?? 0) + (filteredGitea?.length ?? 0) > 0
  if (!hasItems) return null

  return (
    <div>
      {title && (
        <div className="section-header">
          <span className="section-title">{title}</span>
        </div>
      )}

      {/* Local repos */}
      {filteredLocal?.map((repo) => {
        const isHovered = hoveredRepoId === repo.id
        const isActive = activeRepo?.id === repo.id

        return (
          <div
            key={repo.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredRepoId(repo.id)}
            onMouseLeave={() => setHoveredRepoId(null)}
          >
            <button
              onClick={() => handleLocalRepoClick(repo)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                paddingRight: isHovered ? 36 : 12,
                background: isActive ? 'var(--color-surface-2)' : isHovered ? 'var(--color-surface-2)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                transition: 'background 0.1s',
              }}
            >
              <Folder size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {repo.name}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {repo.localPath}
                </div>
              </div>
            </button>

            {/* Remove from list button */}
            {isHovered && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeRecentRepo(repo.id)
                }}
                title="Listeden Kaldır"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 3,
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 2,
                  transition: 'color 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                <X size={12} />
              </button>
            )}
          </div>
        )
      })}

      {/* Gitea repos */}
      {filteredGitea?.map((repo) => {
        const isCloning = cloningRepoId === String(repo.id)
        const isCloned = recentRepos.some((r) => r.giteaRepoId === repo.id)

        return (
          <div key={repo.id}>
            <button
              onClick={() => handleGiteaRepoClick(repo)}
              disabled={isCloning}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: 'transparent',
                border: 'none',
                cursor: isCloning ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                borderLeft: '2px solid transparent',
                opacity: isCloning ? 0.6 : 1,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!isCloning) e.currentTarget.style.background = 'var(--color-surface-2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {isCloning ? (
                <Loader2 size={13} style={{ color: 'var(--color-accent)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
              ) : isCloned ? (
                <Folder size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              ) : (
                <Cloud size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {repo.name}
                  </span>
                  {repo.private && (
                    <Lock size={10} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {repo.owner.login}
                </div>
              </div>
            </button>

            {/* Clone progress bar (inline, under repo button) */}
            {isCloning && cloneProgress && (
              <div style={{ padding: '2px 12px 6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                    {cloneProgress.stage}...
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {Math.round(cloneProgress.pct)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${cloneProgress.pct}%` }} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
