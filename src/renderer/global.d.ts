import type {
  GiteaServer,
  GiteaRepo,
  GitStatus,
  GitCommit,
  GitBranch,
  GitDiff,
  LocalRepo,
  AppSettings,
  SSHKey,
} from '../shared/types'

interface MarmotAPI {
  platform: string
  git: {
    clone: (p: { url: string; localPath: string; sshKeyPath?: string }) => Promise<void>
    status: (p: { repoPath: string }) => Promise<GitStatus>
    fetch: (p: { repoPath: string }) => Promise<void>
    pull: (p: { repoPath: string }) => Promise<void>
    push: (p: { repoPath: string }) => Promise<void>
    commit: (p: { repoPath: string; message: string; amend?: boolean }) => Promise<void>
    log: (p: { repoPath: string; limit?: number; skip?: number }) => Promise<GitCommit[]>
    branches: (p: { repoPath: string }) => Promise<GitBranch[]>
    checkout: (p: { repoPath: string; branch: string }) => Promise<void>
    createBranch: (p: { repoPath: string; name: string; from?: string; checkout?: boolean }) => Promise<void>
    pushBranch: (p: { repoPath: string; branchName: string }) => Promise<void>
    deleteBranch: (p: { repoPath: string; name: string }) => Promise<void>
    stage: (p: { repoPath: string; paths: string[] }) => Promise<void>
    unstage: (p: { repoPath: string; paths: string[] }) => Promise<void>
    stageAll: (p: { repoPath: string }) => Promise<void>
    diff: (p: { repoPath: string; filePath: string; staged?: boolean }) => Promise<GitDiff>
    commitDiff: (p: { repoPath: string; hash: string }) => Promise<GitDiff[]>
    undoLastCommit: (p: { repoPath: string }) => Promise<void>
    discardFileChanges: (p: { repoPath: string; filePath: string }) => Promise<void>
    discardUntrackedFile: (p: { repoPath: string; filePath: string }) => Promise<void>
    revertCommit: (p: { repoPath: string; hash: string }) => Promise<void>
    addToGitignore: (p: { repoPath: string; pattern: string }) => Promise<void>
    unstageAll: (p: { repoPath: string }) => Promise<void>
    discardAll: (p: { repoPath: string }) => Promise<void>
    forcePush: (p: { repoPath: string }) => Promise<void>
    stashSave: (p: { repoPath: string; message?: string }) => Promise<void>
    stashSaveKeepIndex: (p: { repoPath: string; message?: string }) => Promise<void>
    stashCheckoutFile: (p: { repoPath: string; index: number; filePath: string }) => Promise<void>
    stashPop: (p: { repoPath: string; index?: number }) => Promise<void>
    stashList: (p: { repoPath: string }) => Promise<{ index: number; message: string; date: string }[]>
    stashDiff: (p: { repoPath: string; index: number }) => Promise<GitDiff[]>
    stashDrop: (p: { repoPath: string; index: number }) => Promise<void>
    stashApply: (p: { repoPath: string; index: number }) => Promise<void>
    onCloneProgress: (cb: (d: { stage: string; progress: number }) => void) => () => void
    cancelPull: () => void
  }
  gitea: {
    connect: (p: Omit<GiteaServer, 'id' | 'connected'>) => Promise<{ server: GiteaServer; repos: GiteaRepo[] }>
    listRepos: (p: { serverId: string }) => Promise<GiteaRepo[]>
    testConnection: (p: { server: GiteaServer }) => Promise<{ ok: boolean; name?: string; error?: string }>
  }
  ssh: {
    listKeys: () => Promise<SSHKey[]>
    generateKey: (p: { name: string; comment?: string; passphrase?: string }) => Promise<SSHKey>
    testConnection: (p: { host: string; keyPath: string; username?: string }) => Promise<{ ok: boolean; message: string }>
    getPublicKey: (p: { keyPath: string }) => Promise<string>
  }
  fs: {
    chooseDirectory: () => Promise<string | null>
    exists: (p: { path: string }) => Promise<boolean>
    openInExplorer: (p: { path: string }) => Promise<void>
  }
  store: {
    get: (p: { key: string }) => Promise<unknown>
    set: (p: { key: string; value: unknown }) => Promise<void>
    getAll: () => Promise<AppSettings>
    saveRepo: (p: { repo: LocalRepo }) => Promise<void>
    getServers: () => Promise<GiteaServer[]>
    saveServer: (p: { server: GiteaServer }) => Promise<void>
    removeServer: (p: { serverId: string }) => Promise<void>
    getRecentRepos: () => Promise<LocalRepo[]>
    removeRecentRepo: (p: { repoId: string }) => Promise<void>
  }
}

declare global {
  interface Window {
    marmot: MarmotAPI
  }
}

export {}
