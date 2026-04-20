import Store from 'electron-store'
import { AppSettings, GiteaServer, LocalRepo, SSHKey } from '../shared/types'

interface StoreSchema {
  settings: AppSettings
}

const store = new Store<StoreSchema>({
  name: 'marmotconn',
  encryptionKey: 'marmotconn-secure-key-2024',
  defaults: {
    settings: {
      defaultClonePath: '',
      theme: 'dark',
      gitName: '',
      gitEmail: '',
      servers: [],
      recentRepos: [],
      sshKeys: [],
    },
  },
})

export function getSettings(): AppSettings {
  return store.get('settings')
}

export function setSettings(settings: Partial<AppSettings>): void {
  const current = getSettings()
  store.set('settings', { ...current, ...settings })
}

export function getServers(): GiteaServer[] {
  return getSettings().servers
}

export function saveServer(server: GiteaServer): void {
  const settings = getSettings()
  const existing = settings.servers.findIndex((s) => s.id === server.id)
  if (existing >= 0) {
    settings.servers[existing] = server
  } else {
    settings.servers.push(server)
  }
  store.set('settings', settings)
}

export function removeServer(serverId: string): void {
  const settings = getSettings()
  settings.servers = settings.servers.filter((s) => s.id !== serverId)
  store.set('settings', settings)
}

export function getRecentRepos(): LocalRepo[] {
  return getSettings().recentRepos
}

export function saveRecentRepo(repo: LocalRepo): void {
  const settings = getSettings()
  const existing = settings.recentRepos.findIndex((r) => r.id === repo.id)
  if (existing >= 0) {
    settings.recentRepos[existing] = { ...repo, lastOpened: new Date().toISOString() }
  } else {
    settings.recentRepos.unshift({ ...repo, lastOpened: new Date().toISOString() })
    if (settings.recentRepos.length > 20) {
      settings.recentRepos = settings.recentRepos.slice(0, 20)
    }
  }
  store.set('settings', settings)
}

export function removeRecentRepo(repoId: string): void {
  const settings = getSettings()
  settings.recentRepos = settings.recentRepos.filter((r) => r.id !== repoId)
  store.set('settings', settings)
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return getSettings()[key]
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  const settings = getSettings()
  settings[key] = value
  store.set('settings', settings)
}

export default store
