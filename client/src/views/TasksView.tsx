import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { api, type Task } from '../api'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}
const STATUS_COLORS: Record<Task['status'], string> = {
  todo: '#64748b',
  in_progress: '#f09020',
  done: '#22c55e',
}

const BLANK: Partial<Task> = { title: '', description: '', status: 'todo' }

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState<Partial<Task>>(BLANK)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      setTasks(await api.tasks.list())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(BLANK); setFormError(''); setShowForm(true) }
  const openEdit = (t: Task) => { setEditing(t); setForm({ title: t.title, description: t.description, status: t.status }); setFormError(''); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title?.trim()) { setFormError('Title is required'); return }
    setSaving(true); setFormError('')
    try {
      if (editing) {
        const updated = await api.tasks.update(editing.id, form)
        setTasks(ts => ts.map(t => t.id === editing.id ? updated : t))
      } else {
        const created = await api.tasks.create(form)
        setTasks(ts => [created, ...ts])
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
      await api.tasks.delete(id)
      setTasks(ts => ts.filter(t => t.id !== id))
    } catch {
      setError('Delete failed')
    }
  }

  if (loading) return <Spinner />
  if (error) return <p className="text-red-400 text-sm">{error}</p>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Tasks</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-150 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #f06420, #e8a020)' }}
        >
          <Plus size={16} /> New task
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-200"
             style={{ background: 'rgba(30,20,50,0.8)', border: '1px solid rgba(240,100,30,0.3)' }}>
          <form onSubmit={save} className="space-y-3">
            <input
              autoFocus
              placeholder="Task title"
              value={form.title ?? ''}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <select
              value={form.status ?? 'todo'}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
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

      {tasks.length === 0
        ? <EmptyState message="No tasks yet. Create your first one!" />
        : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id}
                   className="group flex items-start gap-3 p-4 rounded-xl transition-all duration-150 hover:scale-[1.01]"
                   style={{ background: 'rgba(25,18,45,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">{task.title}</span>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${STATUS_COLORS[task.status]}22`, color: STATUS_COLORS[task.status] }}>
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(task)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => del(task.id)}
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
