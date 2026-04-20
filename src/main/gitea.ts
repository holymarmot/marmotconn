import axios, { AxiosInstance } from 'axios'
import { GiteaRepo, GiteaServer } from '../shared/types'

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function normalizeUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) return 'https://' + url
  return url
}

function createClient(server: GiteaServer): AxiosInstance {
  const baseURL = normalizeUrl(server.url).replace(/\/$/, '') + '/api/v1'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (server.token) {
    headers['Authorization'] = `token ${server.token}`
  } else if (server.username && server.password) {
    const credentials = Buffer.from(`${server.username}:${server.password}`).toString('base64')
    headers['Authorization'] = `Basic ${credentials}`
  }

  return axios.create({
    baseURL,
    headers,
    timeout: 10000,
  })
}

export async function testConnection(server: GiteaServer): Promise<{ ok: boolean; name?: string; error?: string }> {
  try {
    const client = createClient(server)
    const response = await client.get('/user')
    return { ok: true, name: response.data.login }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return { ok: false, error: 'Kimlik doğrulama başarısız. Token veya şifrenizi kontrol edin.' }
      }
      if (error.code === 'ECONNREFUSED') {
        return { ok: false, error: 'Sunucuya bağlanılamadı. URL\'yi kontrol edin.' }
      }
      if (error.code === 'ENOTFOUND') {
        return { ok: false, error: 'Sunucu bulunamadı. URL\'yi kontrol edin.' }
      }
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Bilinmeyen bir hata oluştu.' }
  }
}

export async function listRepos(server: GiteaServer): Promise<GiteaRepo[]> {
  const client = createClient(server)
  const repos: GiteaRepo[] = []
  let page = 1
  const limit = 50

  while (true) {
    const response = await client.get('/repos/search', {
      params: {
        token: server.token,
        limit,
        page,
        sort: 'updated',
        order: 'desc',
      },
    })

    const data = response.data.data as RawRepo[]
    if (!data || data.length === 0) break

    repos.push(...data.map(mapRepo))
    if (data.length < limit) break
    page++
  }

  return repos
}

interface RawRepo {
  id: number
  name: string
  full_name: string
  description: string
  clone_url: string
  ssh_url: string
  private: boolean
  fork: boolean
  stars_count: number
  owner: { login: string; avatar_url: string }
  default_branch: string
  updated_at: string
}

function mapRepo(raw: RawRepo): GiteaRepo {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description || '',
    cloneUrl: raw.clone_url,
    sshUrl: raw.ssh_url,
    private: raw.private,
    fork: raw.fork,
    stars: raw.stars_count,
    owner: {
      login: raw.owner.login,
      avatarUrl: raw.owner.avatar_url,
    },
    defaultBranch: raw.default_branch,
    updatedAt: raw.updated_at,
  }
}

export async function connectServer(
  params: Omit<GiteaServer, 'id' | 'connected'>
): Promise<{ server: GiteaServer; repos: GiteaRepo[] }> {
  const server: GiteaServer = {
    ...params,
    url: normalizeUrl(params.url),
    id: generateId(),
    connected: false,
  }

  const result = await testConnection(server)
  if (!result.ok) {
    throw new Error(result.error)
  }

  server.connected = true
  if (result.name) {
    server.name = result.name
  }

  const repos = await listRepos(server)
  return { server, repos }
}
