import simpleGit, { SimpleGit, SimpleGitProgressEvent } from 'simple-git'
import * as path from 'path'
import * as fs from 'fs'
import { GitBranch, GitCommit, GitDiff, GitStatus, FileChange, DiffHunk, DiffLine } from '../shared/types'

// Pull cancellation support
let activePullAbort: (() => void) | null = null

export function cancelActivePull(): void {
  if (activePullAbort) {
    activePullAbort()
    activePullAbort = null
  }
}

function git(repoPath: string): SimpleGit {
  return simpleGit(repoPath)
}

// ─── Clone ────────────────────────────────────────────────────────────────────

export async function cloneRepo(
  url: string,
  localPath: string,
  onProgress?: (stage: string, progress: number) => void,
  sshKeyPath?: string
): Promise<void> {
  const options: Record<string, unknown> = {}

  if (sshKeyPath) {
    options['GIT_SSH_COMMAND'] = `ssh -i "${sshKeyPath}" -o StrictHostKeyChecking=no`
  }

  const sg = simpleGit({
    progress(data: SimpleGitProgressEvent) {
      if (onProgress) {
        onProgress(data.stage, data.progress)
      }
    },
  })

  await sg.clone(url, localPath, ['--progress'])
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function getStatus(repoPath: string): Promise<GitStatus> {
  const sg = git(repoPath)
  const status = await sg.status()

  const staged: FileChange[] = []
  const unstaged: FileChange[] = []

  for (const file of status.files) {
    const index = file.index.trim()
    const working = file.working_dir.trim()

    if (index && index !== '?' && index !== ' ') {
      staged.push({
        path: file.path,
        status: mapStatus(index),
        staged: true,
        oldPath: file.from,
      })
    }
    if (working && working !== '?' && working !== ' ') {
      unstaged.push({
        path: file.path,
        status: mapStatus(working),
        staged: false,
      })
    }
  }

  const untracked = status.not_added

  let ahead = status.ahead
  const tracking = status.tracking || null

  // When no upstream is configured, count local commits not yet on origin/<branch>
  if (!tracking && status.current) {
    try {
      const raw = await sg.raw(['rev-list', '--count', `origin/${status.current}..HEAD`])
      ahead = parseInt(raw.trim(), 10) || 0
    } catch {
      // origin/<branch> doesn't exist (never pushed) — count all commits on HEAD
      try {
        const raw = await sg.raw(['rev-list', '--count', 'HEAD'])
        ahead = parseInt(raw.trim(), 10) || 0
      } catch { /* ignore */ }
    }
  }

  return {
    staged,
    unstaged,
    untracked,
    conflicted: status.conflicted,
    ahead,
    behind: status.behind,
    currentBranch: status.current || 'HEAD',
    tracking,
  }
}

function mapStatus(code: string): FileChange['status'] {
  switch (code) {
    case 'A': return 'added'
    case 'M': return 'modified'
    case 'D': return 'deleted'
    case 'R': return 'renamed'
    case 'C': return 'copied'
    case '?': return 'untracked'
    default: return 'modified'
  }
}

// ─── Credentials helper ───────────────────────────────────────────────────────

export interface GitCredentials {
  username: string
  password: string  // token or password
  serverUrl: string
}

function gitWithCreds(repoPath: string, creds?: GitCredentials) {
  if (!creds) return git(repoPath)
  const base64 = Buffer.from(`${creds.username}:${creds.password}`).toString('base64')
  return simpleGit(repoPath, {
    config: [`http.${creds.serverUrl}.extraHeader=Authorization: Basic ${base64}`],
  })
}

export async function getRemoteUrl(repoPath: string): Promise<string | null> {
  try {
    const remotes = await git(repoPath).getRemotes(true)
    const origin = remotes.find((r) => r.name === 'origin')
    return origin?.refs?.push ?? null
  } catch {
    return null
  }
}

// ─── Fetch / Pull / Push ──────────────────────────────────────────────────────

export async function fetch(repoPath: string, creds?: GitCredentials): Promise<void> {
  await gitWithCreds(repoPath, creds).fetch(['--all', '--prune'])
}

export async function pull(repoPath: string, creds?: GitCredentials): Promise<void> {
  let cancelled = false
  activePullAbort = () => { cancelled = true }
  try {
    await gitWithCreds(repoPath, creds).pull()
    if (cancelled) throw new Error('cancelled')
  } finally {
    activePullAbort = null
  }
}

export async function push(repoPath: string, creds?: GitCredentials): Promise<void> {
  await gitWithCreds(repoPath, creds).push()
}

export async function forcePushWithCreds(repoPath: string, creds?: GitCredentials): Promise<void> {
  await gitWithCreds(repoPath, creds).push(['-f'])
}

export async function pushBranchWithCreds(repoPath: string, branchName: string, creds?: GitCredentials): Promise<void> {
  await gitWithCreds(repoPath, creds).push(['--set-upstream', 'origin', branchName])
}

// ─── Stage / Unstage ──────────────────────────────────────────────────────────

export async function stage(repoPath: string, paths: string[]): Promise<void> {
  await git(repoPath).add(paths)
}

export async function unstage(repoPath: string, paths: string[]): Promise<void> {
  await git(repoPath).reset(['HEAD', '--', ...paths])
}

export async function stageAll(repoPath: string): Promise<void> {
  await git(repoPath).add('-A')
}

// ─── Commit ───────────────────────────────────────────────────────────────────

export async function commit(repoPath: string, message: string, amend = false): Promise<void> {
  const options: string[] = []
  if (amend) options.push('--amend')
  await git(repoPath).commit(message, options)
}

// ─── Log ──────────────────────────────────────────────────────────────────────

export async function log(repoPath: string, limit = 50, skip = 0): Promise<GitCommit[]> {
  const sg = git(repoPath)
  const result = await sg.log({
    '--max-count': limit.toString(),
    '--skip': skip.toString(),
  })

  return result.all.map((c) => ({
    hash: c.hash,
    shortHash: c.hash.substring(0, 7),
    message: c.message,
    author: c.author_name,
    authorEmail: c.author_email,
    date: c.date,
    body: c.body,
  }))
}

// ─── Branches ────────────────────────────────────────────────────────────────

export async function branches(repoPath: string): Promise<GitBranch[]> {
  const sg = git(repoPath)
  // Get local branches
  const localResult = await sg.branch(['-vv'])
  const localBranches: GitBranch[] = Object.values(localResult.branches).map((data) => {
    const label: string = (data as any).label || ''
    const hasUpstream = label.includes('[')
    const aheadMatch = label.match(/ahead (\d+)/)
    return {
      name: data.name,
      current: data.current,
      remote: undefined,
      lastCommit: data.commit,
      hasUpstream,
      ahead: aheadMatch ? parseInt(aheadMatch[1], 10) : 0,
    }
  })

  // Get remote branches
  let remoteBranches: GitBranch[] = []
  try {
    const remoteResult = await sg.branch(['-r', '--no-color'])
    remoteBranches = Object.values(remoteResult.branches)
      .filter((b) => !b.name.includes('HEAD'))
      .map((b) => ({
        name: b.name.replace(/^origin\//, ''),
        current: false,
        remote: 'origin',
        lastCommit: b.commit,
      }))
      .filter((rb) => !localBranches.some((lb) => lb.name === rb.name))
  } catch {}

  return [...localBranches, ...remoteBranches]
}

export async function checkout(repoPath: string, branch: string): Promise<void> {
  await git(repoPath).checkout(branch)
}

export async function createBranch(repoPath: string, name: string, from?: string, checkout = true): Promise<void> {
  if (checkout) {
    if (from) {
      await git(repoPath).checkoutBranch(name, from)
    } else {
      await git(repoPath).checkoutLocalBranch(name)
    }
  } else {
    // Create without switching — draft branch at a specific commit
    const args = from ? ['branch', name, from] : ['branch', name]
    await git(repoPath).raw(args)
  }
}

export async function pushBranch(repoPath: string, branchName: string): Promise<void> {
  await git(repoPath).push(['--set-upstream', 'origin', branchName])
}

export async function deleteBranch(repoPath: string, name: string): Promise<void> {
  await git(repoPath).deleteLocalBranch(name, true)
}

// ─── Unstage All ─────────────────────────────────────────────────────────────

export async function unstageAll(repoPath: string): Promise<void> {
  // Single atomic operation - avoids index.lock contention
  try {
    await git(repoPath).raw(['reset', 'HEAD'])
  } catch {
    // If no commits yet (initial repo), just ignore
  }
}

export async function discardAll(repoPath: string): Promise<void> {
  const sg = git(repoPath)
  // reset --hard is atomic (resets index + working tree in one step, no intermediate unstaged state)
  try { await sg.raw(['reset', '--hard', 'HEAD']) } catch {}
  try { await sg.raw(['clean', '-fd']) } catch {}
}

// ─── Force Push ───────────────────────────────────────────────────────────────

export async function forcePush(repoPath: string): Promise<void> {
  await git(repoPath).push(['-f'])
}

// ─── Stash ───────────────────────────────────────────────────────────────────

export interface StashEntry {
  index: number
  message: string
  date: string
}

export async function stashSave(repoPath: string, message?: string): Promise<void> {
  const args = ['stash', 'push', '--include-untracked']
  if (message) args.push('-m', message)
  await git(repoPath).raw(args)
}

// Stash only unstaged/untracked changes — keep staged files in the index
export async function stashSaveKeepIndex(repoPath: string, message?: string): Promise<void> {
  const args = ['stash', 'push', '--keep-index', '--include-untracked']
  if (message) args.push('-m', message)
  await git(repoPath).raw(args)
}

export async function stashPop(repoPath: string, index = 0): Promise<void> {
  try {
    await git(repoPath).raw(['stash', 'pop', `stash@{${index}}`])
    return
  } catch (err) {
    const msg = String((err as Error).message ?? err)
    // Pop fails when untracked files from stash^3 already exist in the working tree
    // (e.g. user already restored individual files with stashCheckoutFile).
    // Recovery: remove those conflicting files so the pop can succeed.
    if (!msg.includes('already exists') && !msg.includes('untracked')) throw err
  }

  // Find which untracked files are stored in stash^3
  let untrackedFiles: string[] = []
  try {
    const raw = await git(repoPath).raw(['ls-tree', '-r', '--name-only', `stash@{${index}}^3`])
    untrackedFiles = raw.trim().split('\n').filter(Boolean).map(f => f.trim().replace(/\r$/, ''))
  } catch { /* no stash^3 */ }

  if (untrackedFiles.length === 0) throw new Error('git stash pop failed and no stash^3 to recover from')

  // Remove conflicting files from index and working tree so pop can restore them
  const sg = git(repoPath)
  const status = await sg.status()
  const existingPaths = new Set(status.files.map(f => f.path.replace(/\r$/, '')))

  for (const f of untrackedFiles) {
    if (existingPaths.has(f)) {
      await sg.raw(['rm', '--cached', '--force', '--', f]).catch(() => {})
      await fs.promises.unlink(path.join(repoPath, f)).catch(() => {})
    }
  }

  // Retry pop
  await git(repoPath).raw(['stash', 'pop', `stash@{${index}}`])
}

export async function stashList(repoPath: string): Promise<StashEntry[]> {
  // Use default format (no --format flag) for maximum git version compatibility.
  // Default output: "stash@{0}: On main: message" or "stash@{0}: WIP on main: hash msg"
  // Use a separate log call to get dates.
  const result = await git(repoPath).raw(['stash', 'list'])
  if (!result.trim()) return []

  const entries: StashEntry[] = []
  for (const rawLine of result.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    // Match: stash@{N}: message
    const m = line.match(/^stash@\{(\d+)\}:\s*(.+)$/)
    if (!m) continue
    const index = parseInt(m[1], 10)
    entries.push({ index, message: m[2], date: '' })
  }

  // Fetch dates in parallel (one log call per entry)
  await Promise.all(entries.map(async (e) => {
    try {
      const d = await git(repoPath).raw(['log', '-1', '--format=%ci', `stash@{${e.index}}`])
      e.date = d.trim()
    } catch { /* date is optional */ }
  }))

  return entries
}

export async function stashDiff(repoPath: string, index: number): Promise<GitDiff[]> {
  // Diff stash parent vs stash working-tree — includes ALL staged + unstaged tracked changes.
  // Prefer `git diff stash^1 stash` over `git stash show -p` because the latter may output
  // a stat header on some git versions, which complicates parsing.
  let trackedDiff = ''
  try {
    trackedDiff = await git(repoPath).raw([
      'diff', `stash@{${index}}^1`, `stash@{${index}}`,
    ])
  } catch { /* fallback: stash might not have a parent (e.g. initial commit) */ }

  // Untracked files are stored in stash^3 when created with --include-untracked.
  // Diff against the git empty-tree SHA to get an "all-added" patch for each untracked file.
  let untrackedDiff = ''
  try {
    untrackedDiff = await git(repoPath).raw([
      'diff',
      '4b825dc642cb6eb9a060e54bf8d69288fbee4904', // git empty-tree SHA (universal constant)
      `stash@{${index}}^3`,
    ])
  } catch { /* stash^3 doesn't exist — created without --include-untracked */ }

  const combined = [trackedDiff, untrackedDiff].filter(Boolean).join('\n')
  return parseMultiDiff(combined)
}

// Restore a single file from a stash entry to the working tree
export async function stashCheckoutFile(repoPath: string, index: number, filePath: string): Promise<void> {
  // Try main stash commit first (tracked file changes)
  try {
    await git(repoPath).raw(['checkout', `stash@{${index}}`, '--', filePath])
    return
  } catch { /* may be an untracked file — try the ^3 commit */ }
  // Fall back to untracked-files commit (stash^3)
  await git(repoPath).raw(['checkout', `stash@{${index}}^3`, '--', filePath])
}

export async function stashDrop(repoPath: string, index: number): Promise<void> {
  await git(repoPath).raw(['stash', 'drop', `stash@{${index}}`])
}

export async function stashApply(repoPath: string, index: number): Promise<void> {
  await git(repoPath).raw(['stash', 'apply', `stash@{${index}}`])
}

// ─── Undo / Revert ────────────────────────────────────────────────────────────

export async function undoLastCommit(repoPath: string): Promise<void> {
  await git(repoPath).reset(['HEAD~1', '--soft'])
}

export async function discardFileChanges(repoPath: string, filePath: string): Promise<void> {
  const sg = git(repoPath)
  // Unstage first (if staged), then discard working tree changes
  try { await sg.reset(['HEAD', '--', filePath]) } catch {}
  try { await sg.checkout(['--', filePath]) } catch {}
  // If it was an untracked file, just try to delete it (git checkout -- won't work)
}

export async function discardUntrackedFile(repoPath: string, filePath: string): Promise<void> {
  const fullPath = path.join(repoPath, filePath)
  try { fs.unlinkSync(fullPath) } catch {}
}

export async function revertCommit(repoPath: string, hash: string): Promise<void> {
  // Use raw git command for revert with --no-commit
  await git(repoPath).raw(['revert', '--no-commit', hash])
}

// ─── .gitignore ───────────────────────────────────────────────────────────────

export async function addToGitignore(repoPath: string, pattern: string): Promise<void> {
  const gitignorePath = path.join(repoPath, '.gitignore')
  let content = ''
  try { content = fs.readFileSync(gitignorePath, 'utf-8') } catch {}
  if (content.split('\n').some((line) => line.trim() === pattern)) return
  const newContent = content + (content.length > 0 && !content.endsWith('\n') ? '\n' : '') + pattern + '\n'
  fs.writeFileSync(gitignorePath, newContent, 'utf-8')
}

// ─── Diff ─────────────────────────────────────────────────────────────────────

export async function getDiff(repoPath: string, filePath: string, staged: boolean): Promise<GitDiff> {
  const sg = git(repoPath)
  let rawDiff: string

  if (staged) {
    rawDiff = await sg.diff(['--cached', '--', filePath])
  } else {
    rawDiff = await sg.diff(['--', filePath])
  }

  return parseDiff(rawDiff, filePath)
}

export async function getCommitDiff(repoPath: string, hash: string): Promise<GitDiff[]> {
  const sg = git(repoPath)
  const rawDiff = await sg.show([hash, '--format=', '--patch'])
  return parseMultiDiff(rawDiff)
}

function parseDiff(raw: string, filePath: string): GitDiff {
  if (!raw) {
    return { filePath, hunks: [], isBinary: false, isNew: false, isDeleted: false }
  }

  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const hunks: DiffHunk[] = []
  let currentHunk: DiffHunk | null = null

  let isNew = false
  let isDeleted = false
  let isBinary = false
  let oldLineNum = 0
  let newLineNum = 0

  for (const line of lines) {
    if (line.startsWith('Binary files')) {
      isBinary = true
      break
    }
    if (line.startsWith('new file')) isNew = true
    if (line.startsWith('deleted file')) isDeleted = true
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (match) {
        oldLineNum = parseInt(match[1]) - 1
        newLineNum = parseInt(match[2]) - 1
        currentHunk = { header: line, lines: [] }
        hunks.push(currentHunk)
      }
      continue
    }
    if (!currentHunk) continue

    if (line.startsWith('+') && !line.startsWith('+++')) {
      newLineNum++
      currentHunk.lines.push({ type: 'add', content: line.substring(1), newLineNum })
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      oldLineNum++
      currentHunk.lines.push({ type: 'remove', content: line.substring(1), oldLineNum })
    } else if (line.startsWith(' ')) {
      oldLineNum++
      newLineNum++
      currentHunk.lines.push({ type: 'context', content: line.substring(1), oldLineNum, newLineNum })
    }
  }

  return { filePath, hunks, isBinary, isNew, isDeleted }
}

function parseMultiDiff(raw: string): GitDiff[] {
  if (!raw.trim()) return []

  // Normalize Windows line endings so all regexes work consistently
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const diffs: GitDiff[] = []
  const fileSections = normalized.split(/^diff --git /m).filter(Boolean)

  for (const section of fileSections) {
    // Git quotes paths containing special characters: "a/some file (2).txt" "b/some file (2).txt"
    // Unquoted format:  a/path b/path
    let filePath: string | null = null

    const quotedMatch = section.match(/^"a\/(.+)" "b\/(.+)"/)
    if (quotedMatch) {
      // Unescape git's octal/backslash escaping in quoted paths
      filePath = quotedMatch[2].replace(/\\([0-7]{3})/g, (_, oct) =>
        String.fromCharCode(parseInt(oct, 8))
      ).replace(/\\\\/g, '\\').replace(/\\"/g, '"')
    } else {
      const unquotedMatch = section.match(/^a\/(.*?) b\/(.*)/)
      if (unquotedMatch) {
        // Take only the first line to avoid capturing subsequent headers
        filePath = unquotedMatch[2].split('\n')[0].trimEnd()
      }
    }

    if (!filePath) continue
    const diff = parseDiff('diff --git ' + section, filePath)
    diffs.push(diff)
  }

  return diffs
}
