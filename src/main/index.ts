import { app, BrowserWindow, ipcMain, dialog, nativeTheme, shell } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as gitOps from './git'
import type { GitCredentials } from './git'
import * as giteaOps from './gitea'
import * as sshOps from './ssh'
import * as store from './store'
import { GiteaServer } from '../shared/types'

async function getCredsForRepo(repoPath: string): Promise<GitCredentials | undefined> {
  const remoteUrl = await gitOps.getRemoteUrl(repoPath)
  if (!remoteUrl) return undefined
  const servers = store.getServers()
  const server = servers.find((s) => remoteUrl.startsWith(s.url))
  if (!server) return undefined
  return {
    username: server.username,
    password: server.token || server.password || '',
    serverUrl: server.url,
  }
}

const isDev = process.env.ELECTRON_DEV === 'true'

app.setAppUserModelId('com.marmotconn.app')

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

function iconPath(): string {
  if (app.isPackaged) return path.join(process.resourcesPath, 'assets', 'icon.ico')
  return path.join(__dirname, '../../assets/icon.ico')
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    icon: iconPath(),
    backgroundColor: '#1A1A1A',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1A1A1A',
      symbolColor: '#F5F4F0',
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    if (!mainWindow.isVisible()) mainWindow.show()
    mainWindow.focus()
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    process.exit(0)
  }
})

// ─── IPC: Git Operations ──────────────────────────────────────────────────────

ipcMain.handle('git:clone', async (_, { url, localPath, sshKeyPath }) => {
  const progressCallback = (stage: string, progress: number) => {
    mainWindow?.webContents.send('git:clone:progress', { stage, progress })
  }
  await gitOps.cloneRepo(url, localPath, progressCallback, sshKeyPath)
})

ipcMain.handle('git:status', async (_, { repoPath }) => {
  return await gitOps.getStatus(repoPath)
})

ipcMain.handle('git:fetch', async (_, { repoPath }) => {
  await gitOps.fetch(repoPath, await getCredsForRepo(repoPath))
})

ipcMain.handle('git:pull', async (_, { repoPath }) => {
  await gitOps.pull(repoPath, await getCredsForRepo(repoPath))
})

ipcMain.handle('git:push', async (_, { repoPath }) => {
  await gitOps.push(repoPath, await getCredsForRepo(repoPath))
})

ipcMain.on('git:cancelPull', () => {
  gitOps.cancelActivePull()
})

ipcMain.handle('git:commit', async (_, { repoPath, message, amend }) => {
  await gitOps.commit(repoPath, message, amend)
})

ipcMain.handle('git:log', async (_, { repoPath, limit, skip }) => {
  return await gitOps.log(repoPath, limit, skip)
})

ipcMain.handle('git:branches', async (_, { repoPath }) => {
  return await gitOps.branches(repoPath)
})

ipcMain.handle('git:checkout', async (_, { repoPath, branch }) => {
  await gitOps.checkout(repoPath, branch)
})

ipcMain.handle('git:createBranch', async (_, { repoPath, name, from, checkout }) => {
  await gitOps.createBranch(repoPath, name, from, checkout ?? true)
})

ipcMain.handle('git:pushBranch', async (_, { repoPath, branchName }) => {
  await gitOps.pushBranchWithCreds(repoPath, branchName, await getCredsForRepo(repoPath))
})

ipcMain.handle('git:deleteBranch', async (_, { repoPath, name }) => {
  await gitOps.deleteBranch(repoPath, name)
})

ipcMain.handle('git:stage', async (_, { repoPath, paths }) => {
  await gitOps.stage(repoPath, paths)
})

ipcMain.handle('git:unstage', async (_, { repoPath, paths }) => {
  await gitOps.unstage(repoPath, paths)
})

ipcMain.handle('git:stageAll', async (_, { repoPath }) => {
  await gitOps.stageAll(repoPath)
})

ipcMain.handle('git:diff', async (_, { repoPath, filePath, staged }) => {
  return await gitOps.getDiff(repoPath, filePath, staged ?? false)
})

ipcMain.handle('git:commitDiff', async (_, { repoPath, hash }) => {
  return await gitOps.getCommitDiff(repoPath, hash)
})

ipcMain.handle('git:undoLastCommit', async (_, { repoPath }) => {
  await gitOps.undoLastCommit(repoPath)
})

ipcMain.handle('git:discardFileChanges', async (_, { repoPath, filePath }) => {
  await gitOps.discardFileChanges(repoPath, filePath)
})

ipcMain.handle('git:discardUntrackedFile', async (_, { repoPath, filePath }) => {
  await gitOps.discardUntrackedFile(repoPath, filePath)
})

ipcMain.handle('git:revertCommit', async (_, { repoPath, hash }) => {
  await gitOps.revertCommit(repoPath, hash)
})

ipcMain.handle('git:addToGitignore', async (_, { repoPath, pattern }) => {
  await gitOps.addToGitignore(repoPath, pattern)
})

// ─── IPC: Gitea Operations ────────────────────────────────────────────────────

ipcMain.handle('gitea:connect', async (_, params) => {
  const result = await giteaOps.connectServer(params)
  store.saveServer(result.server)
  return result
})

ipcMain.handle('gitea:listRepos', async (_, { serverId }) => {
  const servers = store.getServers()
  const server = servers.find((s) => s.id === serverId)
  if (!server) throw new Error('Sunucu bulunamadı.')
  return await giteaOps.listRepos(server)
})

ipcMain.handle('gitea:testConnection', async (_, { server }) => {
  return await giteaOps.testConnection(server)
})

// ─── IPC: SSH Operations ──────────────────────────────────────────────────────

ipcMain.handle('ssh:listKeys', async () => {
  return await sshOps.listKeys()
})

ipcMain.handle('ssh:generateKey', async (_, { name, comment, passphrase }) => {
  return await sshOps.generateKey(name, comment, passphrase)
})

ipcMain.handle('ssh:testConnection', async (_, { host, keyPath, username }) => {
  return await sshOps.testSSHConnection(host, keyPath, username)
})

ipcMain.handle('ssh:getPublicKey', async (_, { keyPath }) => {
  return sshOps.getPublicKey(keyPath)
})

// ─── IPC: File System ────────────────────────────────────────────────────────

ipcMain.handle('fs:chooseDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.handle('fs:exists', async (_, { path: p }) => {
  return fs.existsSync(p)
})

ipcMain.handle('fs:openInExplorer', async (_, { path: p }) => {
  await shell.openPath(path.dirname(p))
})

// ─── IPC: Store ───────────────────────────────────────────────────────────────

ipcMain.handle('store:get', async (_, { key }) => {
  return store.getSetting(key)
})

ipcMain.handle('store:set', async (_, { key, value }) => {
  store.setSetting(key, value)
})

ipcMain.handle('store:getAll', async () => {
  return store.getSettings()
})

ipcMain.handle('store:saveRepo', async (_, { repo }) => {
  store.saveRecentRepo(repo)
})

ipcMain.handle('store:getServers', async () => {
  return store.getServers()
})

ipcMain.handle('store:saveServer', async (_, { server }) => {
  store.saveServer(server)
})

ipcMain.handle('store:removeServer', async (_, { serverId }) => {
  store.removeServer(serverId)
})

ipcMain.handle('store:getRecentRepos', async () => {
  return store.getRecentRepos()
})

ipcMain.handle('store:removeRecentRepo', async (_, { repoId }) => {
  store.removeRecentRepo(repoId)
})

// ─── IPC: Stash / Discard ────────────────────────────────────────────────────

ipcMain.handle('git:unstageAll', async (_, { repoPath }) => {
  await gitOps.unstageAll(repoPath)
})

ipcMain.handle('git:discardAll', async (_, { repoPath }) => {
  await gitOps.discardAll(repoPath)
})

ipcMain.handle('git:forcePush', async (_, { repoPath }) => {
  await gitOps.forcePushWithCreds(repoPath, await getCredsForRepo(repoPath))
})

ipcMain.handle('git:stashSave', async (_, { repoPath, message }) => {
  await gitOps.stashSave(repoPath, message)
})

ipcMain.handle('git:stashSaveKeepIndex', async (_, { repoPath, message }) => {
  await gitOps.stashSaveKeepIndex(repoPath, message)
})

ipcMain.handle('git:stashCheckoutFile', async (_, { repoPath, index, filePath }) => {
  await gitOps.stashCheckoutFile(repoPath, index, filePath)
})

ipcMain.handle('git:stashPop', async (_, { repoPath, index }) => {
  await gitOps.stashPop(repoPath, index ?? 0)
})

ipcMain.handle('git:stashList', async (_, { repoPath }) => {
  return await gitOps.stashList(repoPath)
})

ipcMain.handle('git:stashDiff', async (_, { repoPath, index }) => {
  return await gitOps.stashDiff(repoPath, index)
})

ipcMain.handle('git:stashDrop', async (_, { repoPath, index }) => {
  await gitOps.stashDrop(repoPath, index)
})

ipcMain.handle('git:stashApply', async (_, { repoPath, index }) => {
  await gitOps.stashApply(repoPath, index)
})
