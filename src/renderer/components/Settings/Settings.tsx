import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { AppSettings, SSHKey, GiteaServer } from '../../../shared/types'
import { X, Key, Copy, Trash2, Plus, Check } from 'lucide-react'
import { SpinnerIcon } from '../common/Icons'
import { useTranslation } from 'react-i18next'

const XIcon = ({ size }: { size?: number }) => <X size={size} />
const KeyIcon = ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Key size={size} style={style} />
const CopyIcon = ({ size }: { size?: number }) => <Copy size={size} />
const TrashIcon = ({ size }: { size?: number }) => <Trash2 size={size} />
const PlusIcon = ({ size }: { size?: number }) => <Plus size={size} />
const CheckIcon = ({ size }: { size?: number }) => <Check size={size} />

type SettingsTab = 'general' | 'servers' | 'ssh'

export function Settings() {
  const { setShowSettings, theme, setTheme, settings, updateSettings, servers, removeServer } = useAppStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const marmot = window.marmot
  const { t } = useTranslation()

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'general', label: t('settings.general') },
    { key: 'servers', label: t('settings.servers') },
    { key: 'ssh', label: t('settings.sshKeys') },
  ]

  return (
    <div className="modal-overlay" onClick={() => setShowSettings(false)}>
      <div
        className="modal"
        style={{ maxWidth: 700, height: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{t('settings.title')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowSettings(false)}>
            <XIcon size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div
            style={{
              width: 160,
              borderRight: '1px solid var(--color-border)',
              padding: '12px 0',
              flexShrink: 0,
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  textAlign: 'left',
                  background: activeTab === tab.key ? 'var(--color-surface-2)' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === tab.key ? '2px solid var(--color-accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  transition: 'all 0.1s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {activeTab === 'general' && (
              <GeneralSettings
                settings={settings}
                theme={theme}
                setTheme={setTheme}
                updateSettings={updateSettings}
                marmot={marmot}
              />
            )}
            {activeTab === 'servers' && (
              <ServerSettings servers={servers} removeServer={removeServer} />
            )}
            {activeTab === 'ssh' && (
              <SSHSettings marmot={marmot} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── General Settings ─────────────────────────────────────────────────────────

function GeneralSettings({
  settings,
  theme,
  setTheme,
  updateSettings,
  marmot,
}: {
  settings: AppSettings | null
  theme: string
  setTheme: (t: 'dark' | 'light') => void
  updateSettings: (p: Partial<AppSettings>) => Promise<void>
  marmot: typeof window.marmot
}) {
  const [gitName, setGitName] = useState(settings?.gitName || '')
  const [gitEmail, setGitEmail] = useState(settings?.gitEmail || '')
  const [clonePath, setClonePath] = useState(settings?.defaultClonePath || '')
  const [saved, setSaved] = useState(false)
  const { t } = useTranslation()

  async function handleSave() {
    await updateSettings({ gitName, gitEmail, defaultClonePath: clonePath })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function chooseDir() {
    const dir = await marmot.fs.chooseDirectory()
    if (dir) setClonePath(dir)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{t('settings.generalSettings')}</h3>

      {/* Git config */}
      <section>
        <p className="label" style={{ marginBottom: 12 }}>{t('settings.gitConfig')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 4 }}>{t('settings.name')}</label>
            <input className="input" value={gitName} onChange={(e) => setGitName(e.target.value)} placeholder={t('settings.yourName')} />
          </div>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 4 }}>{t('settings.email')}</label>
            <input className="input" value={gitEmail} onChange={(e) => setGitEmail(e.target.value)} placeholder="email@example.com" />
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Clone path */}
      <section>
        <p className="label" style={{ marginBottom: 12 }}>{t('settings.defaultCloneDir')}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input input-mono"
            value={clonePath}
            onChange={(e) => setClonePath(e.target.value)}
            placeholder="C:/Projects"
            style={{ flex: 1 }}
          />
          <button className="btn" onClick={chooseDir}>{t('settings.choose')}</button>
        </div>
      </section>

      <div className="divider" />

      {/* Theme */}
      <section>
        <p className="label" style={{ marginBottom: 12 }}>{t('settings.theme')}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['dark', 'light'] as const).map((themeVal) => (
            <button
              key={themeVal}
              onClick={() => setTheme(themeVal)}
              className="btn"
              style={{
                background: theme === themeVal ? 'var(--color-accent)' : 'transparent',
                color: theme === themeVal ? '#000' : 'var(--color-text-primary)',
                borderColor: theme === themeVal ? 'transparent' : 'var(--color-border)',
                fontWeight: theme === themeVal ? 600 : 400,
              }}
            >
              {themeVal === 'dark' ? t('settings.dark') : t('settings.light')}
            </button>
          ))}
        </div>
      </section>

      <div style={{ marginTop: 8 }}>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? <><CheckIcon size={13} />{t('settings.saved')}</> : t('settings.save')}
        </button>
      </div>
    </div>
  )
}

// ─── Server Settings ──────────────────────────────────────────────────────────

function ServerSettings({
  servers,
  removeServer,
}: {
  servers: GiteaServer[]
  removeServer: (id: string) => Promise<void>
}) {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{t('settings.connectedServers')}</h3>

      {servers.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
          {t('settings.noServers')}
        </p>
      ) : (
        servers.map((server) => (
          <div
            key={server.id}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span className={`status-dot ${server.connected ? 'status-dot-green' : 'status-dot-red'}`} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                {server.name || server.url}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {server.url} · {server.username}
              </div>
            </div>
            <button
              className="btn btn-danger btn-icon"
              onClick={() => removeServer(server.id)}
              title={t('settings.removeServer')}
            >
              <TrashIcon size={13} />
            </button>
          </div>
        ))
      )}
    </div>
  )
}

// ─── SSH Settings ─────────────────────────────────────────────────────────────

function SSHSettings({ marmot }: { marmot: typeof window.marmot }) {
  const [keys, setKeys] = useState<SSHKey[]>([])
  const [loading, setLoading] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('id_ed25519_marmot')
  const [newKeyComment, setNewKeyComment] = useState('')
  const [generating, setGenerating] = useState(false)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [testHost, setTestHost] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    setLoading(true)
    try {
      const k = await marmot.ssh.listKeys()
      setKeys(k)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!newKeyName.trim()) return
    setGenerating(true)
    try {
      await marmot.ssh.generateKey({ name: newKeyName.trim(), comment: newKeyComment })
      await loadKeys()
      setShowGenerate(false)
    } finally {
      setGenerating(false)
    }
  }

  async function copyPublicKey(keyPath: string) {
    const pubKey = await marmot.ssh.getPublicKey({ keyPath })
    await navigator.clipboard.writeText(pubKey)
    setCopiedKey(keyPath)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  async function testSSH(keyPath: string) {
    if (!testHost) return
    setTestResult((prev) => ({ ...prev, [keyPath]: { ok: false, msg: t('settings.testing') } }))
    const result = await marmot.ssh.testConnection({ host: testHost, keyPath })
    setTestResult((prev) => ({ ...prev, [keyPath]: { ok: result.ok, msg: result.message } }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{t('settings.sshKeys')}</h3>
        <button className="btn" onClick={() => setShowGenerate((v) => !v)}>
          <PlusIcon size={12} />
          {t('settings.newKey')}
        </button>
      </div>

      {/* SSH test host */}
      <div>
        <label className="label" style={{ display: 'block', marginBottom: 4 }}>{t('settings.testServer')}</label>
        <input
          className="input input-mono"
          value={testHost}
          onChange={(e) => setTestHost(e.target.value)}
          placeholder="git@gitea.example.com"
        />
      </div>

      {/* Generate form */}
      {showGenerate && (
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <p className="label">{t('settings.newEd25519')}</p>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 4 }}>{t('settings.keyName')}</label>
            <input
              className="input input-mono"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="id_ed25519_marmot"
            />
          </div>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 4 }}>{t('settings.comment')}</label>
            <input
              className="input"
              value={newKeyComment}
              onChange={(e) => setNewKeyComment(e.target.value)}
              placeholder="marmotconn@computer"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? <SpinnerIcon size={12} /> : <KeyIcon size={12} />}
              {t('settings.generate')}
            </button>
            <button className="btn" onClick={() => setShowGenerate(false)}>{t('settings.cancel')}</button>
          </div>
        </div>
      )}

      {/* Key list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <SpinnerIcon size={20} style={{ color: 'var(--color-text-muted)' }} />
        </div>
      ) : keys.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
          {t('settings.noKeys')}
        </p>
      ) : (
        keys.map((key) => (
          <div
            key={key.path}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <KeyIcon size={14} style={{ color: 'var(--color-accent)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace' }}>
                  {key.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  {key.type} {key.comment && `· ${key.comment}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => copyPublicKey(key.path)}
                  title={t('settings.copyPublicKey')}
                >
                  {copiedKey === key.path ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                  onClick={() => testSSH(key.path)}
                  disabled={!testHost}
                  title={!testHost ? t('settings.enterTestServer') : t('settings.testConnection')}
                >
                  {t('settings.test')}
                </button>
              </div>
            </div>

            {testResult[key.path] && (
              <div
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 10px',
                  borderRadius: 2,
                  background: testResult[key.path].ok ? 'rgba(87, 255, 140, 0.08)' : 'rgba(255, 87, 87, 0.08)',
                  color: testResult[key.path].ok ? 'var(--color-success)' : 'var(--color-danger)',
                  border: `1px solid ${testResult[key.path].ok ? 'rgba(87, 255, 140, 0.2)' : 'rgba(255, 87, 87, 0.2)'}`,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {testResult[key.path].msg}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
