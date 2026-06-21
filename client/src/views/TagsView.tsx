import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { api, type Tag, type Task, type Bookmark } from '../api'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

export default function TagsView() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [items, setItems] = useState<{ tasks: Task[]; bookmarks: Bookmark[] } | null>(null)
  const [itemsLoading, setItemsLoading] = useState(false)

  const load = async () => {
    try {
      setTags(await api.tags.list())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) { setCreateError('Name is required'); return }
    setCreating(true); setCreateError('')
    try {
      const tag = await api.tags.create(newName.trim())
      setTags(ts => [...ts, tag])
      setNewName('')
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  const del = async (id: number) => {
    try {
      await api.tags.delete(id)
      setTags(ts => ts.filter(t => t.id !== id))
      if (expanded === id) { setExpanded(null); setItems(null) }
    } catch {
      setError('Delete failed')
    }
  }

  const toggle = async (id: number) => {
    if (expanded === id) { setExpanded(null); setItems(null); return }
    setExpanded(id)
    setItems(null)
    setItemsLoading(true)
    try {
      setItems(await api.tags.items(id))
    } finally {
      setItemsLoading(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return <p className="text-red-400 text-sm">{error}</p>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Tags</h2>
      </div>

      {/* Create form */}
      <form onSubmit={create} className="flex gap-2 mb-6">
        <input
          placeholder="New tag name"
          value={newName}
          onChange={e => { setNewName(e.target.value); setCreateError('') }}
          className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button type="submit" disabled={creating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #f06420, #e8a020)' }}>
          <Plus size={14} /> {creating ? '…' : 'Add'}
        </button>
      </form>
      {createError && <p className="text-red-400 text-xs mb-4">{createError}</p>}

      {tags.length === 0
        ? <EmptyState message="No tags yet. Create your first tag!" />
        : (
          <div className="space-y-3">
            {tags.map(tag => (
              <div key={tag.id} className="rounded-xl overflow-hidden"
                   style={{ background: 'rgba(25,18,45,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="group flex items-center gap-3 px-4 py-3">
                  <span className="flex-1 text-sm font-medium text-white">{tag.name}</span>
                  <button onClick={() => toggle(tag.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors px-2 py-1 rounded">
                    {expanded === tag.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Items
                  </button>
                  <button onClick={() => del(tag.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {expanded === tag.id && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {itemsLoading
                      ? <p className="text-slate-500 text-xs mt-3">Loading…</p>
                      : items && (
                        <div className="mt-3 space-y-3">
                          {items.tasks.length === 0 && items.bookmarks.length === 0
                            ? <p className="text-slate-500 text-xs">No items tagged with "{tag.name}"</p>
                            : <>
                              {items.tasks.length > 0 && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Tasks</p>
                                  <div className="space-y-1.5">
                                    {items.tasks.map(t => (
                                      <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                           style={{ background: 'rgba(255,255,255,0.04)' }}>
                                        <Check size={12} className="text-green-400 shrink-0" />
                                        <span className="text-slate-200 truncate">{t.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {items.bookmarks.length > 0 && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Bookmarks</p>
                                  <div className="space-y-1.5">
                                    {items.bookmarks.map(b => (
                                      <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                           style={{ background: 'rgba(255,255,255,0.04)' }}>
                                        <X size={12} className="text-amber-400 shrink-0" />
                                        <a href={b.url} target="_blank" rel="noreferrer"
                                           className="text-amber-400 truncate hover:underline">{b.title}</a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          }
                        </div>
                      )
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
