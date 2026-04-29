import { create } from 'zustand'
import {
  AppSettings,
  GiteaServer,
  GiteaRepo,
  LocalRepo,
  GitStatus,
  GitCommit,
  GitBranch,
  GitDiff,
  FileChange,
} from '../../shared/types'

export interface StashEntry {
  index: number
  message: string
  date: string
}

interface AppStore {
  // Settings
  settings: AppSettings | null
  loadSettings: () => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>

  // Servers
  servers: GiteaServer[]
  loadServers: () => Promise<void>
  connectServer: (params: Omit<GiteaServer, 'id' | 'connected'>) => Promise<void>
  removeServer: (serverId: string) => Promise<void>

  // Repos from Gitea
  giteaRepos: Record<string, GiteaRepo[]>
  loadingRepos: Record<string, boolean>
  fetchRepos: (serverId: string) => Promise<void>

  // Local / recent repos
  recentRepos: LocalRepo[]
  loadRecentRepos: () => Promise<void>
  openRepo: (repo: LocalRepo) => void
  addRecentRepo: (repo: LocalRepo) => void
  removeRecentRepo: (repoId: string) => Promise<void>

  // Active repo
  activeRepo: LocalRepo | null
  setActiveRepo: (repo: LocalRepo | null) => void

  // Git state
  gitStatus: GitStatus | null
  commits: GitCommit[]
  branches: GitBranch[]
  activeBranch: string
  selectedFiles: Set<string>
  stagedFiles: Set<string>
  activeDiff: GitDiff | null
  activeCommit: GitCommit | null
  stashEntries: StashEntry[]
  activeStashIndex: number | null
  activeStashDiffs: GitDiff[]
  stashSelectedIndices: Set<number>
  stashRestoredFiles: Record<number, string[]>
  checkoutLoading: boolean
  afterUndo: boolean

  refreshStatus: () => Promise<void>
  refreshStatusSilent: () => Promise<void>
  refreshLog: (skip?: number) => Promise<void>
  refreshBranches: () => Promise<void>
  refreshStash: () => Promise<void>
  checkout: (branch: string) => Promise<void>
  createBranch: (name: string, from?: string, checkout?: boolean) => Promise<void>
  pushBranch: () => Promise<void>
  deleteBranch: (name: string) => Promise<void>
  stageFile: (filePath: string) => Promise<void>
  unstageFile: (filePath: string) => Promise<void>
  unstageAll: () => Promise<void>
  stageAll: () => Promise<void>
  discardAll: () => Promise<void>
  commitChanges: (message: string, amend?: boolean) => Promise<void>
  undoLastCommit: () => Promise<void>
  discardFileChanges: (filePath: string, isUntracked: boolean) => Promise<void>
  revertCommit: (hash: string) => Promise<void>
  addToGitignore: (pattern: string) => Promise<void>
  fetchRepo: () => Promise<void>
  silentFetch: () => Promise<void>
  pullRepo: () => Promise<void>
  pushRepo: () => Promise<void>
  forcePush: () => Promise<void>
  stashAndPull: () => Promise<void>
  stashSave: (message?: string) => Promise<void>
  stashSaveKeepIndex: (message?: string) => Promise<void>
  stashCheckoutFile: (index: number, filePath: string) => Promise<void>
  stashPop: (index?: number) => Promise<void>
  stashDrop: (index: number) => Promise<void>
  stashApply: (index: number) => Promise<void>
  checkoutFileFromStash: (index: number, filePath: string) => Promise<void>
  loadStashDiff: (index: number) => Promise<void>
  toggleStashSelection: (index: number) => void
  selectAllStash: () => void
  deselectAllStash: () => void
  popSelected: () => Promise<void>
  applySelected: () => Promise<void>
  dropSelected: () => Promise<void>
  selectFile: (filePath: string, staged: boolean) => Promise<void>
  selectCommit: (commit: GitCommit) => Promise<void>
  setActiveDiff: (diff: GitDiff | null) => void

  cancelPull: () => void

  // Conflict / warning state
  showPullConflictModal: boolean
  pullConflictFiles: string[]
  setPullConflictModal: (show: boolean) => void

  // UI state
  activeTab: 'changes' | 'history' | 'branches' | 'stash'
  setActiveTab: (tab: 'changes' | 'history' | 'branches' | 'stash') => void
  showCloneModal: boolean
  setShowCloneModal: (v: boolean) => void
  showSettings: boolean
  setShowSettings: (v: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  loading: Record<string, boolean>
  setLoading: (key: string, value: boolean) => void
  gitLogs: string[]
  addGitLog: (msg: string) => void
  clearGitLogs: () => void

  // Theme
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
}

const marmot = () => window.marmot

// Extract conflicted file list from pull error message
function parsePullConflictFiles(msg: string): string[] {
  const lines = msg.split('\n')
  const files: string[] = []
  let capturing = false
  for (const line of lines) {
    if (line.includes('would be overwritten') || line.includes('would be overwritten by merge')) {
      capturing = true
      continue
    }
    if (capturing && line.trim().startsWith('Assets/') || (capturing && line.trim() && !line.startsWith('error') && !line.startsWith('Please') && !line.startsWith('Aborting'))) {
      files.push(line.trim())
    }
    if (line.includes('Please commit') || line.includes('Aborting') || line.includes('Please move')) {
      capturing = false
    }
  }
  return files.slice(0, 10)
}

export const useAppStore = create<AppStore>((set, get) => ({
  settings: null,
  servers: [],
  giteaRepos: {},
  loadingRepos: {},
  recentRepos: [],
  activeRepo: null,
  gitStatus: null,
  commits: [],
  branches: [],
  activeBranch: '',
  selectedFiles: new Set(),
  stagedFiles: new Set(),
  activeDiff: null,
  activeCommit: null,
  stashEntries: [],
  activeStashIndex: null,
  activeStashDiffs: [],
  stashSelectedIndices: new Set<number>(),
  stashRestoredFiles: {},
  checkoutLoading: false,
  afterUndo: false,
  showPullConflictModal: false,
  pullConflictFiles: [],
  activeTab: 'changes',
  showCloneModal: false,
  showSettings: false,
  error: null,
  loading: {},
  gitLogs: [],
  theme: 'dark',

  // ─── Settings ─────────────────────────────────────────────────────────────

  loadSettings: async () => {
    const settings = await marmot().store.getAll()
    set({ settings, theme: settings.theme || 'dark' })
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light')
    }
  },

  updateSettings: async (patch) => {
    const current = get().settings || ({} as AppSettings)
    const updated = { ...current, ...patch }
    for (const [key, value] of Object.entries(patch)) {
      await marmot().store.set({ key, value })
    }
    set({ settings: updated })
  },

  // ─── Servers ──────────────────────────────────────────────────────────────

  loadServers: async () => {
    const servers = await marmot().store.getServers()
    set({ servers })
  },

  connectServer: async (params) => {
    set((s) => ({ loading: { ...s.loading, connect: true }, error: null }))
    try {
      const result = await marmot().gitea.connect(params)
      set((s) => ({
        servers: [...s.servers.filter((sv) => sv.id !== result.server.id), result.server],
        giteaRepos: { ...s.giteaRepos, [result.server.id]: result.repos },
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, connect: false } }))
    }
  },

  removeServer: async (serverId) => {
    await marmot().store.removeServer({ serverId })
    set((s) => ({
      servers: s.servers.filter((sv) => sv.id !== serverId),
      giteaRepos: Object.fromEntries(
        Object.entries(s.giteaRepos).filter(([k]) => k !== serverId)
      ),
    }))
  },

  fetchRepos: async (serverId) => {
    set((s) => ({ loadingRepos: { ...s.loadingRepos, [serverId]: true } }))
    try {
      const repos = await marmot().gitea.listRepos({ serverId })
      set((s) => ({ giteaRepos: { ...s.giteaRepos, [serverId]: repos } }))
    } finally {
      set((s) => ({ loadingRepos: { ...s.loadingRepos, [serverId]: false } }))
    }
  },

  // ─── Recent Repos ─────────────────────────────────────────────────────────

  loadRecentRepos: async () => {
    const repos = await marmot().store.getRecentRepos()
    const checked = await Promise.all(
      repos.map(async (r) => {
        const exists = await marmot().fs.exists({ path: r.localPath })
        return { repo: r, exists }
      })
    )
    const valid = checked.filter((c) => c.exists).map((c) => c.repo)
    const missing = checked.filter((c) => !c.exists).map((c) => c.repo)
    for (const r of missing) {
      await marmot().store.removeRecentRepo({ repoId: r.id }).catch(() => {})
    }
    set({ recentRepos: valid })
  },

  openRepo: (repo) => {
    set({ activeRepo: repo, gitStatus: null, commits: [], branches: [], activeDiff: null, activeTab: 'changes', afterUndo: false })
    get().addRecentRepo(repo)
    // Auto-stage on open: stage all unstaged/untracked so files appear pre-checked
    ;(async () => {
      try {
        const status = await marmot().git.status({ repoPath: repo.localPath })
        if (status.unstaged.length > 0 || status.untracked.length > 0) {
          await marmot().git.stageAll({ repoPath: repo.localPath })
          const staged = await marmot().git.status({ repoPath: repo.localPath })
          set({ gitStatus: staged, activeBranch: staged.currentBranch })
        } else {
          set({ gitStatus: status, activeBranch: status.currentBranch })
        }
      } catch {
        get().refreshStatus()
      }
    })()
    get().refreshLog()
    get().refreshBranches()
    get().refreshStash()
  },

  addRecentRepo: (repo) => {
    marmot().store.saveRepo({ repo })
    set((s) => ({
      recentRepos: [repo, ...s.recentRepos.filter((r) => r.id !== repo.id)].slice(0, 20),
    }))
  },

  removeRecentRepo: async (repoId) => {
    await marmot().store.removeRecentRepo({ repoId })
    set((s) => ({
      recentRepos: s.recentRepos.filter((r) => r.id !== repoId),
      activeRepo: s.activeRepo?.id === repoId ? null : s.activeRepo,
    }))
  },

  setActiveRepo: (repo) => {
    set({ activeRepo: repo, gitStatus: null, commits: [], activeDiff: null })
    if (repo) get().openRepo(repo)
  },

  // ─── Git Operations ───────────────────────────────────────────────────────

  refreshStatus: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    try {
      const status = await marmot().git.status({ repoPath: activeRepo.localPath })
      set({ gitStatus: status, activeBranch: status.currentBranch })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  // Silent refresh - no error toast, for polling. Auto-stages files that newly appeared.
  refreshStatusSilent: async () => {
    const { activeRepo, gitStatus } = get()
    if (!activeRepo) return
    try {
      const status = await marmot().git.status({ repoPath: activeRepo.localPath })

      // Auto-stage files that weren't in the previous unstaged list (newly appeared changes)
      const prevUnstagedPaths = new Set([
        ...(gitStatus?.unstaged.map((f) => f.path) ?? []),
        ...(gitStatus?.untracked ?? []),
      ])
      const newPaths = [
        ...status.unstaged.map((f) => f.path),
        ...status.untracked,
      ].filter((p) => !prevUnstagedPaths.has(p))

      if (newPaths.length > 0) {
        await marmot().git.stage({ repoPath: activeRepo.localPath, paths: newPaths })
        const updated = await marmot().git.status({ repoPath: activeRepo.localPath })
        set({ gitStatus: updated, activeBranch: updated.currentBranch })
      } else {
        set({ gitStatus: status, activeBranch: status.currentBranch })
      }
    } catch {
      // silent
    }
  },

  refreshLog: async (skip = 0) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    try {
      const commits = await marmot().git.log({ repoPath: activeRepo.localPath, limit: 100, skip })
      set((s) => ({ commits: skip === 0 ? commits : [...s.commits, ...commits] }))
    } catch { /* no commits yet */ }
  },

  refreshBranches: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    try {
      const branches = await marmot().git.branches({ repoPath: activeRepo.localPath })
      set({ branches })
    } catch { /* ignore */ }
  },

  refreshStash: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    try {
      const stashEntries = await marmot().git.stashList({ repoPath: activeRepo.localPath }) as StashEntry[]
      const liveIndices = new Set(stashEntries.map(e => e.index))
      set((s) => {
        const stashRestoredFiles = Object.fromEntries(
          Object.entries(s.stashRestoredFiles).filter(([k]) => liveIndices.has(Number(k)))
        )
        return { stashEntries, stashRestoredFiles }
      })
    } catch { /* ignore */ }
  },

  checkout: async (branch) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set({ checkoutLoading: true })
    try {
      await marmot().git.checkout({ repoPath: activeRepo.localPath, branch })
      await get().refreshStatus()
      await get().refreshLog()
      await get().refreshBranches()
    } finally {
      set({ checkoutLoading: false })
    }
  },

  createBranch: async (name, from, checkout = true) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    await marmot().git.createBranch({ repoPath: activeRepo.localPath, name, from, checkout })
    await get().refreshBranches()
    if (checkout) await get().refreshStatus()
  },

  pushBranch: async () => {
    const { activeRepo, activeBranch } = get()
    if (!activeRepo || !activeBranch) return
    set((s) => ({ loading: { ...s.loading, pushBranch: true } }))
    try {
      await marmot().git.pushBranch({ repoPath: activeRepo.localPath, branchName: activeBranch })
      await get().refreshBranches()
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set((s) => ({ loading: { ...s.loading, pushBranch: false } }))
    }
  },

  deleteBranch: async (name) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    await marmot().git.deleteBranch({ repoPath: activeRepo.localPath, name })
    await get().refreshBranches()
  },

  stageFile: async (filePath) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    await marmot().git.stage({ repoPath: activeRepo.localPath, paths: [filePath] })
    await get().refreshStatus()
  },

  unstageFile: async (filePath) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    await marmot().git.unstage({ repoPath: activeRepo.localPath, paths: [filePath] })
    const status = await marmot().git.status({ repoPath: activeRepo.localPath })
    set({ gitStatus: status, activeBranch: status.currentBranch })
  },

  unstageAll: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    // Single atomic git reset HEAD — no index.lock conflicts
    await marmot().git.unstageAll({ repoPath: activeRepo.localPath })
    const status = await marmot().git.status({ repoPath: activeRepo.localPath })
    set({ gitStatus: status, activeBranch: status.currentBranch })
  },

  stageAll: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    await marmot().git.stageAll({ repoPath: activeRepo.localPath })
    await get().refreshStatus()
  },

  discardAll: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    await marmot().git.discardAll({ repoPath: activeRepo.localPath })
    await get().refreshStatus()
  },

  commitChanges: async (message, amend = false) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, commit: true }, afterUndo: false }))
    try {
      await marmot().git.commit({ repoPath: activeRepo.localPath, message, amend })
      await get().refreshStatus()
      await get().refreshLog()
    } finally {
      set((s) => ({ loading: { ...s.loading, commit: false } }))
    }
  },

  undoLastCommit: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, undo: true } }))
    try {
      await marmot().git.undoLastCommit({ repoPath: activeRepo.localPath })
      // Refresh log but skip auto-fetch — behind indicator is expected after undo
      set({ afterUndo: true })
      await get().refreshLog()
      // Refresh status without auto-staging (files are back to staged state)
      const status = await marmot().git.status({ repoPath: activeRepo.localPath })
      set({ gitStatus: status, activeBranch: status.currentBranch })
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set((s) => ({ loading: { ...s.loading, undo: false } }))
    }
  },

  discardFileChanges: async (filePath, isUntracked) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    if (isUntracked) {
      await marmot().git.discardUntrackedFile({ repoPath: activeRepo.localPath, filePath })
    } else {
      await marmot().git.discardFileChanges({ repoPath: activeRepo.localPath, filePath })
    }
    await get().refreshStatus()
  },

  revertCommit: async (hash) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, revert: true } }))
    try {
      await marmot().git.revertCommit({ repoPath: activeRepo.localPath, hash })
      await get().refreshStatus()
      await get().refreshLog()
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set((s) => ({ loading: { ...s.loading, revert: false } }))
    }
  },

  addToGitignore: async (pattern) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    await marmot().git.addToGitignore({ repoPath: activeRepo.localPath, pattern })
    await get().refreshStatus()
  },

  fetchRepo: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, fetch: true } }))
    try {
      await marmot().git.fetch({ repoPath: activeRepo.localPath })
      await get().refreshStatusSilent()
      await get().refreshLog()
      await get().refreshBranches()
    } catch (err) {
      const msg = (err as Error).message || String(err)
      get().addGitLog(`[fetch hata] ${msg}`)
    } finally {
      set((s) => ({ loading: { ...s.loading, fetch: false } }))
    }
  },

  // Silent fetch for auto-polling — no loading indicator, no error toasts
  silentFetch: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    try {
      await marmot().git.fetch({ repoPath: activeRepo.localPath })
      // Only update behind/ahead counts — use a silent status check
      const status = await marmot().git.status({ repoPath: activeRepo.localPath })
      set((s) => ({
        gitStatus: s.gitStatus
          ? { ...s.gitStatus, ahead: status.ahead, behind: status.behind }
          : status,
        activeBranch: status.currentBranch,
      }))
    } catch { /* silent — no network, etc */ }
  },

  pullRepo: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, pull: true } }))
    try {
      await marmot().git.pull({ repoPath: activeRepo.localPath })
      set({ afterUndo: false })
      await get().refreshStatus()
      await get().refreshLog()
      await get().refreshBranches()
    } catch (err) {
      const msg = (err as Error).message || String(err)
      // Detect conflict / overwrite error
      if (msg.includes('would be overwritten') || msg.includes('local changes') || msg.includes('Aborting')) {
        const conflictFiles = parsePullConflictFiles(msg)
        set({ showPullConflictModal: true, pullConflictFiles: conflictFiles })
      } else {
        get().addGitLog(`[pull hata] ${msg}`)
        set({ error: msg })
      }
    } finally {
      set((s) => ({ loading: { ...s.loading, pull: false } }))
    }
  },

  cancelPull: () => {
    marmot().git.cancelPull()
    set((s) => ({ loading: { ...s.loading, pull: false } }))
  },

  pushRepo: async () => {
    const { activeRepo, gitStatus, afterUndo } = get()
    if (!activeRepo) return
    // Warn if behind remote (potential conflict)
    if ((gitStatus?.behind ?? 0) > 0 && !afterUndo) {
      set({ showPullConflictModal: true, pullConflictFiles: [] })
      return
    }
    set((s) => ({ loading: { ...s.loading, push: true } }))
    try {
      if (afterUndo) {
        await marmot().git.forcePush({ repoPath: activeRepo.localPath })
      } else {
        await marmot().git.push({ repoPath: activeRepo.localPath })
      }
      set({ afterUndo: false })
      await get().refreshStatusSilent()
    } catch (err) {
      const msg = (err as Error).message || String(err)
      get().addGitLog(`[push hata] ${msg}`)
      set({ error: msg })
    } finally {
      set((s) => ({ loading: { ...s.loading, push: false } }))
    }
  },

  forcePush: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, push: true } }))
    try {
      await marmot().git.forcePush({ repoPath: activeRepo.localPath })
      set({ afterUndo: false })
      await get().refreshStatusSilent()
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set((s) => ({ loading: { ...s.loading, push: false } }))
    }
  },

  stashAndPull: async () => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, pull: true }, showPullConflictModal: false }))
    try {
      await marmot().git.stashSave({ repoPath: activeRepo.localPath, message: 'auto-stash before pull' })
      await marmot().git.pull({ repoPath: activeRepo.localPath })
      await marmot().git.stashPop({ repoPath: activeRepo.localPath, index: 0 })
      set({ afterUndo: false })
      await get().refreshStatus()
      await get().refreshLog()
      await get().refreshStash()
    } catch (err) {
      const msg = (err as Error).message || String(err)
      get().addGitLog(`[stash+pull hata] ${msg}`)
      set({ error: msg })
    } finally {
      set((s) => ({ loading: { ...s.loading, pull: false } }))
    }
  },

  // ─── Stash ────────────────────────────────────────────────────────────────

  stashSave: async (message) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, stash: true } }))
    try {
      await marmot().git.stashSave({ repoPath: activeRepo.localPath, message })
      await get().refreshStatus()
      await get().refreshStash()
      // Navigate to stash tab so user immediately sees the saved entry
      set({ activeTab: 'stash' })
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set((s) => ({ loading: { ...s.loading, stash: false } }))
    }
  },

  stashSaveKeepIndex: async (message) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, stash: true } }))
    try {
      await marmot().git.stashSaveKeepIndex({ repoPath: activeRepo.localPath, message })
      await get().refreshStatus()
      await get().refreshStash()
      set({ activeTab: 'stash' })
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set((s) => ({ loading: { ...s.loading, stash: false } }))
    }
  },

  checkoutFileFromStash: async (index, filePath) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set((s) => ({ loading: { ...s.loading, stash: true } }))
    try {
      await marmot().git.stashCheckoutFile({ repoPath: activeRepo.localPath, index, filePath })
      // Auto-stage the restored file so it appears checked in changes view
      await marmot().git.stage({ repoPath: activeRepo.localPath, paths: [filePath] })
      await get().refreshStatus()
      set((s) => ({
        activeStashDiffs: s.activeStashDiffs.filter(d => d.filePath !== filePath),
        stashRestoredFiles: {
          ...s.stashRestoredFiles,
          [index]: [...(s.stashRestoredFiles[index] ?? []), filePath],
        },
      }))
      // If all files have been restored, drop the now-empty stash entry
      if (get().activeStashDiffs.length === 0) {
        await marmot().git.stashDrop({ repoPath: activeRepo.localPath, index })
        await get().refreshStash()
        const { stashEntries } = get()
        set({
          activeStashIndex: null,
          activeStashDiffs: [],
          ...(stashEntries.length === 0 ? { activeTab: 'changes' } : {}),
        })
      }
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set((s) => ({ loading: { ...s.loading, stash: false } }))
    }
  },

  stashPop: async (index = 0) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    try {
      await marmot().git.stashPop({ repoPath: activeRepo.localPath, index })
      await get().refreshStatus()
      await get().refreshStash()
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  stashDrop: async (index) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    try {
      await marmot().git.stashDrop({ repoPath: activeRepo.localPath, index })
      await get().refreshStash()
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  stashApply: async (index) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    try {
      await marmot().git.stashApply({ repoPath: activeRepo.localPath, index })
      await get().refreshStatus()
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  loadStashDiff: async (index) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set({ activeStashIndex: index, activeStashDiffs: [] })
    try {
      const diffs = await marmot().git.stashDiff({ repoPath: activeRepo.localPath, index }) as GitDiff[]
      const restored = get().stashRestoredFiles[index] ?? []
      const restoredSet = new Set(restored)
      set({ activeStashDiffs: diffs.filter(d => !restoredSet.has(d.filePath)) })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  toggleStashSelection: (index) => {
    const prev = get().stashSelectedIndices
    const next = new Set(prev)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    set({ stashSelectedIndices: next })
  },

  selectAllStash: () => {
    const { stashEntries } = get()
    set({ stashSelectedIndices: new Set(stashEntries.map((e) => e.index)) })
  },

  deselectAllStash: () => {
    set({ stashSelectedIndices: new Set() })
  },

  popSelected: async () => {
    const { activeRepo, stashSelectedIndices } = get()
    if (!activeRepo || stashSelectedIndices.size === 0) return
    set((s) => ({ loading: { ...s.loading, stash: true } }))
    try {
      // Pop from highest index to lowest to avoid index shifts
      const sorted = [...stashSelectedIndices].sort((a, b) => b - a)
      for (const idx of sorted) {
        await marmot().git.stashPop({ repoPath: activeRepo.localPath, index: idx })
      }
      // Stage all restored changes so they appear as checked in the changes view
      await marmot().git.stageAll({ repoPath: activeRepo.localPath })
      await get().refreshStatus()
      await get().refreshStash()
      const { stashEntries } = get()
      set({
        stashSelectedIndices: new Set(),
        activeStashIndex: null,
        activeStashDiffs: [],
        ...(stashEntries.length === 0 ? { activeTab: 'changes' } : {}),
      })
    } catch (err) {
      set({ error: (err as Error).message })
      await get().refreshStash()
    } finally {
      set((s) => ({ loading: { ...s.loading, stash: false } }))
    }
  },

  applySelected: async () => {
    const { activeRepo, stashSelectedIndices } = get()
    if (!activeRepo || stashSelectedIndices.size === 0) return
    set((s) => ({ loading: { ...s.loading, stash: true } }))
    try {
      // Apply from lowest index to highest (no removal, no index shift)
      const sorted = [...stashSelectedIndices].sort((a, b) => a - b)
      for (const idx of sorted) {
        await marmot().git.stashApply({ repoPath: activeRepo.localPath, index: idx })
      }
      // Stage all restored changes so they appear as checked in the changes view
      await marmot().git.stageAll({ repoPath: activeRepo.localPath })
      await get().refreshStatus()
      await get().refreshStash()
      set({ stashSelectedIndices: new Set() })
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set((s) => ({ loading: { ...s.loading, stash: false } }))
    }
  },

  dropSelected: async () => {
    const { activeRepo, stashSelectedIndices } = get()
    if (!activeRepo || stashSelectedIndices.size === 0) return
    set((s) => ({ loading: { ...s.loading, stash: true } }))
    try {
      const sorted = [...stashSelectedIndices].sort((a, b) => b - a)
      for (const idx of sorted) {
        await marmot().git.stashDrop({ repoPath: activeRepo.localPath, index: idx })
      }
      await get().refreshStash()
      const { stashEntries } = get()
      set({
        stashSelectedIndices: new Set(),
        activeStashIndex: null,
        activeStashDiffs: [],
        ...(stashEntries.length === 0 ? { activeTab: 'changes' } : {}),
      })
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set((s) => ({ loading: { ...s.loading, stash: false } }))
    }
  },

  selectFile: async (filePath, staged) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set({ activeCommit: null })
    const diff = await marmot().git.diff({ repoPath: activeRepo.localPath, filePath, staged })
    set({ activeDiff: diff })
  },

  selectCommit: async (commit) => {
    const { activeRepo } = get()
    if (!activeRepo) return
    set({ activeCommit: commit, activeDiff: null })
    const diffs = await marmot().git.commitDiff({ repoPath: activeRepo.localPath, hash: commit.hash })
    if (diffs.length > 0) set({ activeDiff: diffs[0] })
  },

  setActiveDiff: (diff) => set({ activeDiff: diff }),

  setPullConflictModal: (show) => set({ showPullConflictModal: show }),

  // ─── UI ───────────────────────────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowCloneModal: (v) => set({ showCloneModal: v }),
  setShowSettings: (v) => set({ showSettings: v }),
  setError: (error) => set({ error }),
  setLoading: (key, value) => set((s) => ({ loading: { ...s.loading, [key]: value } })),
  addGitLog: (msg) => set((s) => ({ gitLogs: [...s.gitLogs.slice(-99), `${new Date().toLocaleTimeString('tr-TR')} ${msg}`] })),
  clearGitLogs: () => set({ gitLogs: [] }),

  setTheme: (theme) => {
    set({ theme })
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    get().updateSettings({ theme })
  },
}))
