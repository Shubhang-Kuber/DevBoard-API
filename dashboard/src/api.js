const BASE = '';

function getToken() {
  return localStorage.getItem('token');
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),
  me: () => request('GET', '/auth/me'),

  getTasks: () => request('GET', '/tasks'),
  getTask: (id) => request('GET', `/tasks/${id}`),
  createTask: (body) => request('POST', '/tasks', body),
  updateTask: (id, body) => request('PATCH', `/tasks/${id}`, body),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),
  addTagToTask: (taskId, tagId) => request('POST', `/tasks/${taskId}/tags`, { tagId }),

  getBookmarks: () => request('GET', '/bookmarks'),
  createBookmark: (body) => request('POST', '/bookmarks', body),
  updateBookmark: (id, body) => request('PATCH', `/bookmarks/${id}`, body),
  deleteBookmark: (id) => request('DELETE', `/bookmarks/${id}`),

  getTags: () => request('GET', '/tags'),
  createTag: (body) => request('POST', '/tags', body),
  deleteTag: (id) => request('DELETE', `/tags/${id}`),
  getTagItems: (id) => request('GET', `/tags/${id}/items`),
};
