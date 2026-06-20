import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useToast } from './Toast';

function TagItem({ tag, onDelete, selected, onSelect }) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm(`Delete tag "${tag.name}"? This will remove it from all tasks and bookmarks.`)) return;
    setDeleting(true);
    try {
      await onDelete(tag.id);
      toast(`Tag "${tag.name}" deleted`, 'info');
    } catch (err) {
      toast(err.message, 'error');
      setDeleting(false);
    }
  }

  return (
    <div
      className={`tag-chip ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(tag)}
      style={{ opacity: deleting ? 0.4 : 1 }}
    >
      # {tag.name}
      <button className="tag-delete-btn" onClick={handleDelete} title="Delete tag">✕</button>
    </div>
  );
}

function TagItemsPanel({ tag, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    api.getTagItems(tag.id)
      .then(setData)
      .catch(() => toast('Failed to load tag items', 'error'))
      .finally(() => setLoading(false));
  }, [tag.id]);

  return (
    <div className="tag-items-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}># {tag.name}</div>
        <button className="btn btn-icon" onClick={onClose} style={{ fontSize: '0.8rem' }}>✕</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Loading…</div>
      ) : (
        <>
          {data?.tasks?.length > 0 && (
            <div className="tag-items-group">
              <div className="tag-items-group-label">Tasks ({data.tasks.length})</div>
              {data.tasks.map((t) => (
                <div key={t.id} className="tag-item-row">
                  <span style={{ marginRight: 8 }}>{t.status === 'done' ? '✓' : t.status === 'in-progress' ? '◑' : '○'}</span>
                  {t.title}
                </div>
              ))}
            </div>
          )}
          {data?.bookmarks?.length > 0 && (
            <div className="tag-items-group">
              <div className="tag-items-group-label">Bookmarks ({data.bookmarks.length})</div>
              {data.bookmarks.map((b) => (
                <div key={b.id} className="tag-item-row">
                  <span style={{ marginRight: 8, color: 'var(--accent)' }}>↗</span>
                  {b.title}
                </div>
              ))}
            </div>
          )}
          {(!data?.tasks?.length && !data?.bookmarks?.length) && (
            <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
              No items tagged with #{tag.name} yet.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setTags(await api.getTags());
    } catch {
      toast('Failed to load tags', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const tag = await api.createTag({ name: newName.trim() });
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      toast(`Tag "${tag.name}" created`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    await api.deleteTag(id);
    setTags((prev) => prev.filter((t) => t.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function handleSelect(tag) {
    setSelected((prev) => (prev?.id === tag.id ? null : tag));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tags</div>
          <div className="page-subtitle">Shared labels across tasks & bookmarks</div>
        </div>
      </div>

      <form onSubmit={handleCreate} style={{ marginBottom: 24 }}>
        <div className="inline-row">
          <div className="field">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New tag name…"
              disabled={creating}
            />
          </div>
          <button className="btn btn-ghost" type="submit" disabled={creating || !newName.trim()}>
            {creating ? <span className="spinner" /> : '+ Add'}
          </button>
        </div>
      </form>

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Loading…</div>
      ) : tags.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">#</div>
          <div className="empty-title">No tags yet</div>
          <div className="empty-sub">Create tags to organise your tasks and bookmarks</div>
        </div>
      ) : (
        <>
          <div className="tags-cloud">
            {tags.map((tag) => (
              <TagItem
                key={tag.id}
                tag={tag}
                selected={selected?.id === tag.id}
                onSelect={handleSelect}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {selected && (
            <TagItemsPanel
              key={selected.id}
              tag={selected}
              onClose={() => setSelected(null)}
            />
          )}

          {!selected && tags.length > 0 && (
            <div style={{ color: 'var(--text-3)', fontSize: '0.82rem', textAlign: 'center', marginTop: 8 }}>
              Click a tag to see its linked tasks & bookmarks
            </div>
          )}
        </>
      )}
    </div>
  );
}
