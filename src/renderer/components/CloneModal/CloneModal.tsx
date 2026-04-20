import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { LocalRepo } from '../../../shared/types'
import { X, Folder } from 'lucide-react'
import { SpinnerIcon } from '../common/Icons'
import { useTranslation } from 'react-i18next'
const XIcon = ({ size }: { size?: number }) => <X size={size} />
const FolderIcon = ({ size }: { size?: number }) => <Folder size={size} />

type Tab = 'https' | 'ssh'

export function CloneModal() {
  const { setShowCloneModal, openRepo } = useAppStore()
  const [tab, setTab] = useState<Tab>('https')
  const [url, setUrl] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [sshKeys, setSshKeys] = useState<Array<{ name: string; path: string }>>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [cloning, setCloning] = useState(false)
  const [progress, setProgress] = useState<{ stage: string; pct: number } | null>(null)
  const [error, setError] = useState('')
  const { t } = useTranslation()

  const marmot = window.marmot

  useEffect(() => {
    marmot.ssh.listKeys().then((keys) => {
      setSshKeys(keys)
      if (keys.length > 0) setSelectedKey(keys[0].path)
    })
  }, [])

  async function chooseDir() {
    const dir = await marmot.fs.chooseDirectory()
    if (dir) setLocalPath(dir)
  }

  async function handleClone() {
    if (!url.trim() || !localPath.trim()) {
      setError(t('clone.urlRequired'))
      return
    }
    setError('')
    setCloning(true)

    const repoName = url.split('/').pop()?.replace('.git', '') || 'repo'
    const fullPath = `${localPath}/${repoName}`

    const removeListener = marmot.git.onCloneProgress((data) => {
      setProgress({ stage: data.stage, pct: data.progress })
    })

    try {
      await marmot.git.clone({
        url: url.trim(),
        localPath: fullPath,
        sshKeyPath: tab === 'ssh' ? selectedKey : undefined,
      })

      const repo: LocalRepo = {
        id: `local-${Date.now()}`,
        name: repoName,
        fullName: repoName,
        localPath: fullPath,
        remoteUrl: url.trim(),
        lastOpened: new Date().toISOString(),
        pinned: false,
      }

      await marmot.store.saveRepo({ repo })
      openRepo(repo)
      setShowCloneModal(false)
    } catch (err) {
      setError(`${t('clone.failed')}${(err as Error).message}`)
    } finally {
      setCloning(false)
      setProgress(null)
      removeListener()
    }
  }

  return (
    <div className="modal-overlay" onClick={() => !cloning && setShowCloneModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('clone.title')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={() => !cloning && setShowCloneModal(false)}>
            <XIcon size={14} />
          </button>
        </div>

        {/* Tab selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          {(['https', 'ssh'] as Tab[]).map((tabItem) => (
            <button
              key={tabItem}
              className={`tab ${tab === tabItem ? 'tab-active' : ''}`}
              onClick={() => setTab(tabItem)}
              style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}
            >
              {tabItem}
            </button>
          ))}
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* URL */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                {tab === 'https' ? 'HTTPS URL' : 'SSH URL'}
              </label>
              <input
                className="input input-mono"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={tab === 'https' ? 'https://gitea.example.com/user/repo.git' : 'git@gitea.example.com:user/repo.git'}
              />
            </div>

            {/* SSH key selector */}
            {tab === 'ssh' && (
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  {t('clone.sshKey')}
                </label>
                {sshKeys.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {t('clone.noKeys')}
                  </p>
                ) : (
                  <select
                    className="input"
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    {sshKeys.map((k) => (
                      <option key={k.path} value={k.path}>{k.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Local path */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                {t('clone.localDir')}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input input-mono"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="C:/Projects"
                  style={{ flex: 1 }}
                />
                <button className="btn" onClick={chooseDir} title={t('clone.chooseDir')}>
                  <FolderIcon size={13} />
                </button>
              </div>
              {url && localPath && (
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                  → {localPath}/{url.split('/').pop()?.replace('.git', '') || 'repo'}
                </p>
              )}
            </div>

            {/* Progress */}
            {cloning && progress && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {progress.stage}...
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {Math.round(progress.pct)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress.pct}%` }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', lineHeight: 1.5 }}>
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={() => !cloning && setShowCloneModal(false)} disabled={cloning}>
            {t('clone.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleClone}
            disabled={cloning || !url.trim() || !localPath.trim()}
          >
            {cloning ? (
              <><SpinnerIcon size={13} />{t('clone.cloning')}</>
            ) : (
              t('clone.clone')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
