const BASE = ''  // Vite proxy forwards /auth, /tasks, /bookmarks, /tags → localhost:3000

function token() {
  return localStorage.getItem('token')
}

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  auth: {
    register: (name: string, email: string, password: string) =>
      req<{ id: number; name: string; email: string }>('POST', '/auth/register', { name, email, password }),
    login: (email: string, password: string) =>
      req<{ token: string }>('POST', '/auth/login', { email, password }),
    me: () => req<{ id: number; name: string; email: string; created_at: string }>('GET', '/auth/me'),
  },
  tasks: {
    list: () => req<Task[]>('GET', '/tasks'),
    create: (data: Partial<Task>) => req<Task>('POST', '/tasks', data),
    update: (id: number, data: Partial<Task>) => req<Task>('PATCH', `/tasks/${id}`, data),
    delete: (id: number) => req<void>('DELETE', `/tasks/${id}`),
  },
  bookmarks: {
    list: () => req<Bookmark[]>('GET', '/bookmarks'),
    create: (data: Partial<Bookmark>) => req<Bookmark>('POST', '/bookmarks', data),
    update: (id: number, data: Partial<Bookmark>) => req<Bookmark>('PATCH', `/bookmarks/${id}`, data),
    delete: (id: number) => req<void>('DELETE', `/bookmarks/${id}`),
  },
  tags: {
    list: () => req<Tag[]>('GET', '/tags'),
    create: (name: string) => req<Tag>('POST', '/tags', { name }),
    delete: (id: number) => req<void>('DELETE', `/tags/${id}`),
    items: (id: number) => req<{ tasks: Task[]; bookmarks: Bookmark[] }>('GET', `/tags/${id}/items`),
  },
}

export interface Task {
  id: number
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  created_at: string
}

export interface Bookmark {
  id: number
  title: string
  url: string
  notes?: string
  created_at: string
}

export interface Tag {
  id: number
  name: string
  created_at: string
}
