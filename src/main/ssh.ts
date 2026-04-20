import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { SSHKey } from '../shared/types'

const execFileAsync = promisify(execFile)

const SSH_DIR = path.join(os.homedir(), '.ssh')

// ─── List Keys ────────────────────────────────────────────────────────────────

export async function listKeys(): Promise<SSHKey[]> {
  if (!fs.existsSync(SSH_DIR)) return []

  const files = fs.readdirSync(SSH_DIR)
  const keys: SSHKey[] = []
  const seen = new Set<string>()

  for (const file of files) {
    const fullPath = path.join(SSH_DIR, file)
    const pubPath = fullPath + '.pub'

    // Private key: has corresponding .pub file
    if (!file.endsWith('.pub') && fs.existsSync(pubPath) && !seen.has(file)) {
      seen.add(file)
      const pubContent = fs.readFileSync(pubPath, 'utf-8').trim()
      const parts = pubContent.split(' ')
      const type = parts[0] || 'unknown'
      const comment = parts[2] || ''

      let fingerprint = ''
      try {
        const result = await execFileAsync('ssh-keygen', ['-l', '-f', pubPath])
        fingerprint = result.stdout.trim().split(' ')[1] || ''
      } catch {
        // ignore
      }

      keys.push({
        name: file,
        path: fullPath,
        publicKeyPath: pubPath,
        type,
        comment,
        fingerprint,
      })
    }
  }

  return keys
}

// ─── Generate Key ─────────────────────────────────────────────────────────────

export async function generateKey(
  name: string,
  comment = 'marmotconn',
  passphrase = ''
): Promise<SSHKey> {
  // Reject path separators, traversal, and control chars — name is used as a filename
  if (!name || /[\\/\x00-\x1f]|^\.{1,2}$/.test(name)) {
    throw new Error('Geçersiz anahtar adı.')
  }

  const keyPath = path.join(SSH_DIR, name)

  if (path.dirname(keyPath) !== SSH_DIR) {
    throw new Error('Geçersiz anahtar adı.')
  }

  if (fs.existsSync(keyPath)) {
    throw new Error(`"${name}" adında bir anahtar zaten mevcut.`)
  }

  if (!fs.existsSync(SSH_DIR)) {
    fs.mkdirSync(SSH_DIR, { mode: 0o700 })
  }

  // Pass args as array (no shell) so user input can't break out of quoting
  await execFileAsync('ssh-keygen', [
    '-t', 'ed25519',
    '-C', comment,
    '-f', keyPath,
    '-N', passphrase,
  ])

  const pubContent = fs.readFileSync(keyPath + '.pub', 'utf-8').trim()
  const parts = pubContent.split(' ')

  return {
    name,
    path: keyPath,
    publicKeyPath: keyPath + '.pub',
    type: parts[0] || 'ed25519',
    comment,
    fingerprint: '',
  }
}

// ─── Get Public Key ───────────────────────────────────────────────────────────

export function getPublicKey(keyPath: string): string {
  const pubPath = keyPath.endsWith('.pub') ? keyPath : keyPath + '.pub'
  if (!fs.existsSync(pubPath)) {
    throw new Error('Genel anahtar dosyası bulunamadı.')
  }
  return fs.readFileSync(pubPath, 'utf-8').trim()
}

// ─── Test SSH Connection ──────────────────────────────────────────────────────

export async function testSSHConnection(
  host: string,
  keyPath: string,
  username = 'git'
): Promise<{ ok: boolean; message: string }> {
  try {
    // Extract hostname from URL like git@host:user/repo.git
    let hostname = host
    if (host.includes('@')) {
      const parts = host.split('@')
      hostname = parts[1].split(':')[0]
      username = parts[0]
    }

    // Basic sanity check — reject chars that have no business in a hostname or username
    if (!/^[A-Za-z0-9._-]+$/.test(hostname) || !/^[A-Za-z0-9._-]+$/.test(username)) {
      return { ok: false, message: 'Geçersiz sunucu adresi.' }
    }

    // Pass args as array (no shell) so host input can't break out of quoting
    const { stdout, stderr } = await execFileAsync('ssh', [
      '-i', keyPath,
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ConnectTimeout=5',
      '-T', `${username}@${hostname}`,
    ])
    const output = stdout + stderr

    if (output.toLowerCase().includes('successfully authenticated')) {
      return { ok: true, message: 'SSH bağlantısı başarılı!' }
    }
    return { ok: true, message: output.trim() || 'Bağlantı kuruldu.' }
  } catch (error: unknown) {
    // ssh -T returns exit code 1 on success for Gitea (it just closes connection)
    if (error instanceof Error && 'stderr' in error) {
      const stderr = (error as { stderr: string }).stderr || ''
      if (stderr.toLowerCase().includes('successfully authenticated')) {
        return { ok: true, message: 'SSH bağlantısı başarılı!' }
      }
      return { ok: false, message: stderr || error.message }
    }
    return { ok: false, message: 'SSH bağlantısı başarısız.' }
  }
}
