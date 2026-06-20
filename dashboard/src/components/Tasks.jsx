import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { Modal } from './Modal';
import { useToast } from './Toast';

const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
const STATUS_CLASS  = { todo: 'badge-todo', 'in-progress': 'badge-progress', done: 'badge-done' };

function isOverdue(due_date) {
  if (!due_date) return false;
  return new Date(due_date) < new Date() ;
}

function SkeletonCards() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="skeleton-card" style={{ marginBottom: 12 }}>
      <div className="skeleton" style={{ height: '100%' }} />
    </div>
  ));
}

function TaskForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'todo',
    due_date: initial?.due_date ?? '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Title <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input value={form.title} onChange={set('title')} placeholder="Task title" required autoFocus />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea value={form.description} onChange={set('description')} placeholder="Optional notes…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Status</label>
          <select value={form.status} onChange={set('status')}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="field">
          <label>Due date</label>
          <input type="date" value={form.due_date} onChange={set('due_date')} />
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
          {saving ? <span className="spinner" /> : null}
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  async function handleStatusChange(e) {
    const status = e.target.value;
    setChangingStatus(true);
    try {
      await onStatusChange(task.id, status);
    } catch {
      toast('Failed to update status', 'error');
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(task.id);
      toast('Task deleted', 'info');
    } catch {
      toast('Failed to delete task', 'error');
      setDeleting(false);
    }
  }

  return (
    <div className="card" style={{ opacity: deleting ? 0.4 : 1, transition: 'opacity 0.2s' }}>
      <div className="card-header">
        <div style={{ minWidth: 0 }}>
          <div className="card-title">{task.title}</div>
          {task.description && <div className="card-notes">{task.description}</div>}
        </div>
        <div className="card-actions">
          <button className="btn btn-icon btn-sm" onClick={() => onEdit(task)} title="Edit">✎</button>
          <button className="btn btn-icon btn-sm" onClick={handleDelete} disabled={deleting} title="Delete"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
            ✕
          </button>
        </div>
      </div>
      <div className="card-meta">
        <select
          className="status-select"
          value={task.status}
          onChange={handleStatusChange}
          disabled={changingStatus}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        {task.due_date && (
          <span className={`due-date ${isOverdue(task.due_date) && task.status !== 'done' ? 'overdue' : ''}`}>
            {isOverdue(task.due_date) && task.status !== 'done' ? '⚠ ' : ''}
            Due {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

export function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | task-object
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setTasks(await api.getTasks());
    } catch {
      toast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    setSaving(true);
    try {
      if (modal === 'create') {
        const t = await api.createTask(form);
        setTasks((prev) => [t, ...prev]);
        toast('Task created', 'success');
      } else {
        const t = await api.updateTask(modal.id, form);
        setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
        toast('Task updated', 'success');
      }
      setModal(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleStatusChange(id, status) {
    const t = await api.updateTask(id, { status });
    setTasks((prev) => prev.map((x) => (x.id === id ? t : x)));
  }

  const todo       = tasks.filter((t) => t.status === 'todo');
  const inProgress = tasks.filter((t) => t.status === 'in-progress');
  const done       = tasks.filter((t) => t.status === 'done');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tasks</div>
          <div className="page-subtitle">{tasks.length} total</div>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setModal('create')}>
          + New task
        </button>
      </div>

      {loading ? (
        <SkeletonCards />
      ) : tasks.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✓</div>
          <div className="empty-title">No tasks yet</div>
          <div className="empty-sub">Create your first task to get started</div>
        </div>
      ) : (
        <>
          {inProgress.length > 0 && (
            <Section label="In Progress" count={inProgress.length}>
              {inProgress.map((t) => (
                <TaskCard key={t.id} task={t} onEdit={setModal} onDelete={handleDelete} onStatusChange={handleStatusChange} />
              ))}
            </Section>
          )}
          {todo.length > 0 && (
            <Section label="To Do" count={todo.length}>
              {todo.map((t) => (
                <TaskCard key={t.id} task={t} onEdit={setModal} onDelete={handleDelete} onStatusChange={handleStatusChange} />
              ))}
            </Section>
          )}
          {done.length > 0 && (
            <Section label="Done" count={done.length} muted>
              {done.map((t) => (
                <TaskCard key={t.id} task={t} onEdit={setModal} onDelete={handleDelete} onStatusChange={handleStatusChange} />
              ))}
            </Section>
          )}
        </>
      )}

      {modal && (
        <Modal
          title={modal === 'create' ? 'New task' : 'Edit task'}
          onClose={() => setModal(null)}
        >
          <TaskForm
            initial={modal === 'create' ? null : modal}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

function Section({ label, count, children, muted }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: muted ? 'var(--text-3)' : 'var(--text-2)',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {label}
        <span style={{
          background: 'var(--surface-2)',
          borderRadius: 10,
          padding: '1px 7px',
          fontWeight: 500,
        }}>{count}</span>
      </div>
      <div className="card-grid">{children}</div>
    </div>
  );
}
