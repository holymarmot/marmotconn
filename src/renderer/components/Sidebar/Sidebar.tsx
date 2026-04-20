import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { ConnectForm } from './ConnectForm'
import { RepoList } from './RepoList'
import { Plus, Search, LogOut, PlusCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Sidebar() {
  const { servers, recentRepos, setShowCloneModal } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showConnectForm, setShowConnectForm] = useState(false)
  const { t } = useTranslation()

  const hasServers = servers.length > 0

  return (
    <aside className="sidebar">
      {/* Header */}
      <div
        style={{
          padding: '12px 12px 8px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="section-title">{t('sidebar.repositories')}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setShowCloneModal(true)}
              title={t('sidebar.cloneRepo')}
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={12}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: 26, fontSize: '0.75rem' }}
            placeholder={t('sidebar.searchRepos')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Server list / connect prompt */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Recent local repos */}
        {recentRepos.length > 0 && (
          <RepoList
            title={t('sidebar.recentRepos')}
            searchQuery={searchQuery}
            repos={recentRepos}
          />
        )}

        {/* Connected servers */}
        {servers.map((server) => (
          <ConnectedServerSection
            key={server.id}
            serverId={server.id}
            serverName={server.name || server.url}
            searchQuery={searchQuery}
          />
        ))}

        {/* Connect CTA */}
        {!hasServers && !showConnectForm && (
          <div className="empty-state">
            <div
              style={{
                width: 40,
                height: 40,
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 1.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM7.25 8H4a.75.75 0 000 1.5h3.25V13a.75.75 0 001.5 0V9.5H12A.75.75 0 0012 8H8.75V4.5a.75.75 0 00-1.5 0V8z"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {t('sidebar.connectGitea')}
            </p>
          </div>
        )}
      </div>

      {/* Bottom area */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: 12 }}>
        {showConnectForm ? (
          <ConnectForm onClose={() => setShowConnectForm(false)} />
        ) : hasServers ? (
          <ConnectedFooter onAddServer={() => setShowConnectForm(true)} />
        ) : (
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setShowConnectForm(true)}
          >
            {t('sidebar.connectGiteaBtn')}
          </button>
        )}
      </div>
    </aside>
  )
}

function ConnectedFooter({ onAddServer }: { onAddServer: () => void }) {
  const { servers, removeServer } = useAppStore()
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {servers.map((server) => (
        <div
          key={server.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: 'var(--color-surface-2)',
            borderRadius: 2,
            border: '1px solid var(--color-border)',
          }}
        >
          <span className="status-dot status-dot-green" />
          <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {server.name || server.url}
          </span>
          <button
            className="btn btn-danger btn-icon"
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600 }}
            onClick={() => removeServer(server.id)}
            title={t('sidebar.logout')}
          >
            <LogOut size={13} />
            <span>{t('sidebar.logout')}</span>
          </button>
        </div>
      ))}
      <button
        className="btn btn-ghost"
        style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}
        onClick={onAddServer}
      >
        <PlusCircle size={13} />
        {t('sidebar.addServer')}
      </button>
    </div>
  )
}

function ConnectedServerSection({
  serverId,
  serverName,
  searchQuery,
}: {
  serverId: string
  serverName: string
  searchQuery: string
}) {
  const { giteaRepos, servers } = useAppStore()
  const server = servers.find((s) => s.id === serverId)
  const repos = giteaRepos[serverId] || []

  if (!server) return null

  return (
    <div>
      <div className="section-header" style={{ paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`status-dot ${server.connected ? 'status-dot-green' : 'status-dot-red'}`} />
          <span className="section-title" style={{ color: 'var(--color-text-secondary)' }}>
            {serverName}
          </span>
        </div>
      </div>
      <RepoList
        title=""
        searchQuery={searchQuery}
        giteaRepos={repos}
        serverId={serverId}
      />
    </div>
  )
}
