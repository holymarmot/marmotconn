import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { X as XIcon } from 'lucide-react'
import { SpinnerIcon } from '../common/Icons'
import { useTranslation } from 'react-i18next'

interface Props {
  onClose: () => void
}

export function ConnectForm({ onClose }: Props) {
  const { connectServer, loading, setError } = useAppStore()
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'token' | 'password'>('password')
  const [localError, setLocalError] = useState('')
  const { t } = useTranslation()

  const isConnecting = loading.connect

  async function handleConnect() {
    if (!url.trim()) {
      setLocalError(t('connect.serverUrlRequired'))
      return
    }
    setLocalError('')
    try {
      await connectServer({
        url: url.trim(),
        name: '',
        username: username.trim(),
        token: authMode === 'token' ? token.trim() : undefined,
        password: authMode === 'password' ? password : undefined,
      })
      onClose()
    } catch (err) {
      setLocalError((err as Error).message)
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.8125rem',
            color: 'var(--color-text-primary)',
          }}
        >
          {t('connect.title')}
        </span>
        <button className="btn btn-ghost btn-icon" onClick={onClose}>
          <XIcon size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label className="label" style={{ display: 'block', marginBottom: 4 }}>
            {t('connect.serverUrl')}
          </label>
          <input
            className="input input-mono"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://gitea.example.com"
          />
        </div>

        <div>
          <label className="label" style={{ display: 'block', marginBottom: 4 }}>
            {t('connect.username')}
          </label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
        </div>

        {/* Auth mode toggle */}
        <div>
          <div style={{ display: 'flex', gap: 0, marginBottom: 6, border: '1px solid var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
            {(['token', 'password'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAuthMode(mode)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: authMode === mode ? 'var(--color-accent)' : 'transparent',
                  color: authMode === mode ? '#000' : 'var(--color-text-secondary)',
                  transition: 'all 0.1s',
                }}
              >
                {mode === 'token' ? t('connect.apiToken') : t('connect.password')}
              </button>
            ))}
          </div>

          {authMode === 'token' ? (
            <input
              className="input input-mono"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="API token..."
            />
          ) : (
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          )}
        </div>

        {localError && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-danger)', lineHeight: 1.4 }}>
            {localError}
          </p>
        )}

        <button
          className="btn btn-primary"
          style={{ justifyContent: 'center', marginTop: 4 }}
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <SpinnerIcon size={13} />
              {t('connect.connecting')}
            </>
          ) : (
            t('connect.connect')
          )}
        </button>
      </div>
    </div>
  )
}
