import { contextBridge, ipcRenderer } from 'electron'

function invoke(channel: string, params?: unknown): Promise<unknown> {
  return ipcRenderer.invoke(channel, params)
}

contextBridge.exposeInMainWorld('marmot', {
  git: {
    clone: (params: unknown) => invoke('git:clone', params),
    status: (params: unknown) => invoke('git:status', params),
    fetch: (params: unknown) => invoke('git:fetch', params),
    pull: (params: unknown) => invoke('git:pull', params),
    push: (params: unknown) => invoke('git:push', params),
    commit: (params: unknown) => invoke('git:commit', params),
    log: (params: unknown) => invoke('git:log', params),
    branches: (params: unknown) => invoke('git:branches', params),
    checkout: (params: unknown) => invoke('git:checkout', params),
    createBranch: (params: unknown) => invoke('git:createBranch', params),
    pushBranch: (params: unknown) => invoke('git:pushBranch', params),
    deleteBranch: (params: unknown) => invoke('git:deleteBranch', params),
    stage: (params: unknown) => invoke('git:stage', params),
    unstage: (params: unknown) => invoke('git:unstage', params),
    stageAll: (params: unknown) => invoke('git:stageAll', params),
    diff: (params: unknown) => invoke('git:diff', params),
    commitDiff: (params: unknown) => invoke('git:commitDiff', params),
    undoLastCommit: (params: unknown) => invoke('git:undoLastCommit', params),
    discardFileChanges: (params: unknown) => invoke('git:discardFileChanges', params),
    discardUntrackedFile: (params: unknown) => invoke('git:discardUntrackedFile', params),
    revertCommit: (params: unknown) => invoke('git:revertCommit', params),
    addToGitignore: (params: unknown) => invoke('git:addToGitignore', params),
    unstageAll: (params: unknown) => invoke('git:unstageAll', params),
    discardAll: (params: unknown) => invoke('git:discardAll', params),
    forcePush: (params: unknown) => invoke('git:forcePush', params),
    stashSave: (params: unknown) => invoke('git:stashSave', params),
    stashSaveKeepIndex: (params: unknown) => invoke('git:stashSaveKeepIndex', params),
    stashCheckoutFile: (params: unknown) => invoke('git:stashCheckoutFile', params),
    stashPop: (params: unknown) => invoke('git:stashPop', params),
    stashList: (params: unknown) => invoke('git:stashList', params),
    stashDiff: (params: unknown) => invoke('git:stashDiff', params),
    stashDrop: (params: unknown) => invoke('git:stashDrop', params),
    stashApply: (params: unknown) => invoke('git:stashApply', params),
    onCloneProgress: (callback: (data: { stage: string; progress: number }) => void) => {
      const listener = (_: Electron.IpcRendererEvent, data: { stage: string; progress: number }) => callback(data)
      ipcRenderer.on('git:clone:progress', listener)
      return () => ipcRenderer.removeListener('git:clone:progress', listener)
    },
    cancelPull: () => ipcRenderer.send('git:cancelPull'),
  },
  gitea: {
    connect: (params: unknown) => invoke('gitea:connect', params),
    listRepos: (params: unknown) => invoke('gitea:listRepos', params),
    testConnection: (params: unknown) => invoke('gitea:testConnection', params),
  },
  ssh: {
    listKeys: () => invoke('ssh:listKeys'),
    generateKey: (params: unknown) => invoke('ssh:generateKey', params),
    testConnection: (params: unknown) => invoke('ssh:testConnection', params),
    getPublicKey: (params: unknown) => invoke('ssh:getPublicKey', params),
  },
  fs: {
    chooseDirectory: () => invoke('fs:chooseDirectory'),
    exists: (params: unknown) => invoke('fs:exists', params),
    openInExplorer: (params: unknown) => invoke('fs:openInExplorer', params),
  },
  store: {
    get: (params: unknown) => invoke('store:get', params),
    set: (params: unknown) => invoke('store:set', params),
    getAll: () => invoke('store:getAll'),
    saveRepo: (params: unknown) => invoke('store:saveRepo', params),
    getServers: () => invoke('store:getServers'),
    saveServer: (params: unknown) => invoke('store:saveServer', params),
    removeServer: (params: unknown) => invoke('store:removeServer', params),
    getRecentRepos: () => invoke('store:getRecentRepos'),
    removeRecentRepo: (params: unknown) => invoke('store:removeRecentRepo', params),
  },
})
