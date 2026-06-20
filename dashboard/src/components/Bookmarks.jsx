import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { Modal } from './Modal';
import { useToast } from './Toast';

function SkeletonCards() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="skeleton-card" style={{ marginBottom: 12 }}>
      <div className="skeleton" style={{ height: '100%' }} />
    </div>
  ));
}

function BookmarkForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    url:   initial?.url   ?? '',
    notes: initial?.notes ?? '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div className="field">
        <label>Title <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input value={form.title} onChange={set('title')} placeholder="Bookmark title" required autoFocus />
      </div>
      <div className="field">
        <label>URL <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input type="url" value={form.url} onChange={set('url')} placeholder="https://…" required />
      </div>
      <div className="field">
        <label>Notes</label>
        <textarea value={form.notes} onChange={set('notes')} placeholder="Why did you save this?" />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
          {saving ? <span className="spinner" /> : null}
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add bookmark'}
        </button>
      </div>
    </form>
  );
}

function domain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

function BookmarkCard({ bookmark, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  async function handleDelete() {
    if (!confirm(`Delete "${bookmark.title}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(bookmark.id);
      toast('Bookmark deleted', 'info');
    } catch {
      toast('Failed to delete', 'error');
      setDeleting(false);
    }
  }

  return (
    <div className="card" style={{ opacity: deleting ? 0.4 : 1, transition: 'opacity 0.2s' }}>
      <div className="card-header">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="card-title">{bookmark.title}</div>
          <a
            className="card-url"
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            ↗ {domain(bookmark.url)}
          </a>
          {bookmark.notes && <div className="card-notes">{bookmark.notes}</div>}
        </div>
        <div className="card-actions">
          <button className="btn btn-icon btn-sm" onClick={() => onEdit(bookmark)} title="Edit">✎</button>
          <button
            className="btn btn-icon btn-sm"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            ✕
          </button>
        </div>
      </div>
      <div className="card-meta">
        <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>
          {new Date(bookmark.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setBookmarks(await api.getBookmarks());
    } catch {
      toast('Failed to load bookmarks', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    setSaving(true);
    try {
      if (modal === 'create') {
        const b = await api.createBookmark(form);
        setBookmarks((prev) => [b, ...prev]);
        toast('Bookmark saved', 'success');
      } else {
        const b = await api.updateBookmark(modal.id, form);
        setBookmarks((prev) => prev.map((x) => (x.id === b.id ? b : x)));
        toast('Bookmark updated', 'success');
      }
      setModal(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  const filtered = search
    ? bookmarks.filter(
        (b) =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.url.toLowerCase().includes(search.toLowerCase()) ||
          (b.notes ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : bookmarks;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Bookmarks</div>
          <div className="page-subtitle">{bookmarks.length} saved</div>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setModal('create')}>
          + Add bookmark
        </button>
      </div>

      {bookmarks.length > 3 && (
        <div className="field" style={{ marginBottom: 20 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks…"
          />
        </div>
      )}

      {loading ? (
        <SkeletonCards />
      ) : bookmarks.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔖</div>
          <div className="empty-title">No bookmarks yet</div>
          <div className="empty-sub">Save links you want to revisit</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No results for "{search}"</div>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((b) => (
            <BookmarkCard key={b.id} bookmark={b} onEdit={setModal} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'create' ? 'New bookmark' : 'Edit bookmark'}
          onClose={() => setModal(null)}
        >
          <BookmarkForm
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
