import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, ExternalLink } from 'lucide-react'
import { api, type Bookmark } from '../api'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

const BLANK: Partial<Bookmark> = { title: '', url: '', notes: '' }

export default function BookmarksView() {
  const [items, setItems] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Bookmark | null>(null)
  const [form, setForm] = useState<Partial<Bookmark>>(BLANK)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      setItems(await api.bookmarks.list())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load bookmarks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(BLANK); setFormError(''); setShowForm(true) }
  const openEdit = (b: Bookmark) => { setEditing(b); setForm({ title: b.title, url: b.url, notes: b.notes }); setFormError(''); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title?.trim()) { setFormError('Title is required'); return }
    if (!form.url?.trim()) { setFormError('URL is required'); return }
    setSaving(true); setFormError('')
    try {
      if (editing) {
        const updated = await api.bookmarks.update(editing.id, form)
        setItems(bs => bs.map(b => b.id === editing.id ? updated : b))
      } else {
        const created = await api.bookmarks.create(form)
        setItems(bs => [created, ...bs])
      }
      closeForm()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: number) => {
    try {
      await api.bookmarks.delete(id)
      setItems(bs => bs.filter(b => b.id !== id))
    } catch {
      setError('Delete failed')
    }
  }

  if (loading) return <Spinner />
  if (error) return <p className="text-red-400 text-sm">{error}</p>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Bookmarks</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-150 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #f06420, #e8a020)' }}
        >
          <Plus size={16} /> New bookmark
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl p-5"
             style={{ background: 'rgba(30,20,50,0.8)', border: '1px solid rgba(240,100,30,0.3)' }}>
          <form onSubmit={save} className="space-y-3">
            <input
              autoFocus
              placeholder="Title"
              value={form.title ?? ''}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <input
              placeholder="URL"
              value={form.url ?? ''}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <textarea
              placeholder="Notes (optional)"
              value={form.notes ?? ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            {formError && <p className="text-red-400 text-xs">{formError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ background: '#f06420' }}>
                <Check size={14} /> {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={closeForm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <X size={14} /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0
        ? <EmptyState message="No bookmarks yet. Save your first link!" />
        : (
          <div className="space-y-3">
            {items.map(b => (
              <div key={b.id}
                   className="group flex items-start gap-3 p-4 rounded-xl transition-all duration-150 hover:scale-[1.01]"
                   style={{ background: 'rgba(25,18,45,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white truncate">{b.title}</span>
                    <a href={b.url} target="_blank" rel="noreferrer"
                       className="shrink-0 text-slate-500 hover:text-amber-400 transition-colors">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="text-xs text-amber-500/70 truncate mb-1">{b.url}</p>
                  {b.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2">{b.notes}</p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(b)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => del(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
