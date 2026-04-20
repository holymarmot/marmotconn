// ─── Gitea Types ──────────────────────────────────────────────────────────────

export interface GiteaServer {
  id: string
  name: string
  url: string
  username: string
  token?: string
  password?: string
  connected: boolean
}

export interface GiteaRepo {
  id: number
  name: string
  fullName: string
  description: string
  cloneUrl: string
  sshUrl: string
  private: boolean
  fork: boolean
  stars: number
  owner: {
    login: string
    avatarUrl: string
  }
  defaultBranch: string
  updatedAt: string
}

// ─── Local Repo Types ─────────────────────────────────────────────────────────

export interface LocalRepo {
  id: string
  name: string
  fullName: string
  localPath: string
  remoteUrl: string
  serverId?: string
  giteaRepoId?: number
  lastOpened: string
  pinned: boolean
}

export interface GitStatus {
  staged: FileChange[]
  unstaged: FileChange[]
  untracked: string[]
  conflicted: string[]
  ahead: number
  behind: number
  currentBranch: string
  tracking: string | null  // upstream tracking branch, null if branch has no upstream
}

export interface FileChange {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'untracked'
  staged: boolean
  oldPath?: string
}

export interface GitCommit {
  hash: string
  shortHash: string
  message: string
  author: string
  authorEmail: string
  date: string
  body?: string
}

export interface GitBranch {
  name: string
  current: boolean
  remote?: string
  ahead?: number
  behind?: number
  lastCommit?: string
  hasUpstream?: boolean  // local branch: true if has remote tracking, false/undefined if draft
}

export interface GitDiff {
  filePath: string
  oldPath?: string
  hunks: DiffHunk[]
  isBinary: boolean
  isNew: boolean
  isDeleted: boolean
}

export interface DiffHunk {
  header: string
  lines: DiffLine[]
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'hunk-header'
  content: string
  oldLineNum?: number
  newLineNum?: number
}

// Alias for backwards compatibility
export type GitDiffLine = DiffLine

// ─── SSH Types ────────────────────────────────────────────────────────────────

export interface SSHKey {
  name: string
  path: string
  publicKeyPath: string
  type: string
  comment?: string
  fingerprint?: string
}

// ─── IPC Types ────────────────────────────────────────────────────────────────

export interface CloneOptions {
  url: string
  localPath: string
  sshKeyPath?: string
  onProgress?: (progress: CloneProgress) => void
}

export interface CloneProgress {
  stage: string
  progress: number
  total?: number
  received?: number
}

export interface AppSettings {
  defaultClonePath: string
  theme: 'dark' | 'light'
  gitName: string
  gitEmail: string
  servers: GiteaServer[]
  recentRepos: LocalRepo[]
  sshKeys: SSHKey[]
}

// ─── IPC Channel Definitions ──────────────────────────────────────────────────

export type IpcChannels = {
  // Git
  'git:clone': { url: string; localPath: string; sshKeyPath?: string }
  'git:status': { repoPath: string }
  'git:fetch': { repoPath: string }
  'git:pull': { repoPath: string }
  'git:push': { repoPath: string }
  'git:commit': { repoPath: string; message: string; amend?: boolean }
  'git:log': { repoPath: string; limit?: number; skip?: number }
  'git:branches': { repoPath: string }
  'git:checkout': { repoPath: string; branch: string }
  'git:createBranch': { repoPath: string; name: string; from?: string }
  'git:deleteBranch': { repoPath: string; name: string }
  'git:stage': { repoPath: string; paths: string[] }
  'git:unstage': { repoPath: string; paths: string[] }
  'git:stageAll': { repoPath: string }
  'git:diff': { repoPath: string; filePath: string; staged?: boolean }
  'git:commitDiff': { repoPath: string; hash: string }
  // Gitea
  'gitea:connect': { server: Omit<GiteaServer, 'id' | 'connected'> }
  'gitea:listRepos': { serverId: string }
  'gitea:testConnection': { server: GiteaServer }
  // SSH
  'ssh:listKeys': never
  'ssh:generateKey': { name: string; comment?: string; passphrase?: string }
  'ssh:testConnection': { host: string; keyPath: string; username?: string }
  'ssh:getPublicKey': { keyPath: string }
  // FS
  'fs:chooseDirectory': never
  'fs:exists': { path: string }
  // Store
  'store:get': { key: string }
  'store:set': { key: string; value: unknown }
}
