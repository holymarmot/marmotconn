import React from 'react'
import { useAppStore } from '../../store/appStore'
import { Plus as PlusIcon, Folder as FolderIcon } from 'lucide-react'
import logoUrl from '/logo.png'
import { useTranslation } from 'react-i18next'

export function WelcomeView() {
  const { setShowCloneModal, recentRepos, openRepo } = useAppStore()
  const { t } = useTranslation()

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        gap: 32,
      }}
    >
      {/* Logo mark */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--color-accent)',
          }}
        >
          <img
            src={logoUrl}
            alt="Marmotconn"
            style={{ width: 48, height: 48, objectFit: 'contain', mixBlendMode: 'screen' as const }}
          />
        </div>
        <h1
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.5rem',
            letterSpacing: '0.1em',
            color: 'var(--color-text-primary)',
            marginBottom: 6,
          }}
        >
          MARMOTCONN
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {t('welcome.tagline')}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn btn-primary"
          style={{ padding: '8px 18px' }}
          onClick={() => setShowCloneModal(true)}
        >
          <PlusIcon size={14} />
          {t('welcome.cloneRepo')}
        </button>
        <button
          className="btn"
          style={{ padding: '8px 18px' }}
          onClick={async () => {
            const dir = await window.marmot.fs.chooseDirectory()
            if (!dir) return
            const exists = await window.marmot.fs.exists({ path: `${dir}/.git` })
            if (exists) {
              const name = dir.split(/[/\\]/).pop() || 'repo'
              const repo = {
                id: `local-${Date.now()}`,
                name,
                fullName: name,
                localPath: dir,
                remoteUrl: '',
                lastOpened: new Date().toISOString(),
                pinned: false,
              }
              openRepo(repo)
            }
          }}
        >
          <FolderIcon size={14} />
          {t('welcome.openRepo')}
        </button>
      </div>

      {/* Recent repos shortcut */}
      {recentRepos.length > 0 && (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-text-muted)',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            {t('welcome.recentRepos')}
          </div>
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {recentRepos.slice(0, 5).map((repo, i) => (
              <button
                key={repo.id}
                onClick={() => openRepo(repo)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <FolderIcon size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {repo.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {repo.localPath}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
