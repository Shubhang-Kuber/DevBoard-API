const { getDB } = require('../db');

// GET /tags — list all tags (tags aren't owned by a user, they're shared/global)
async function getAll(req, res) {
    const db = await getDB();
    const tags = await db.all('SELECT * FROM tags ORDER BY name ASC');
    res.json(tags);
}

// POST /tags — create a new tag
async function create(req, res) {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'name is required' });
    }

    const db = await getDB();

    // Check if this tag already exists (tags.name is UNIQUE in schema)
    const existing = await db.get('SELECT * FROM tags WHERE name = ?', [name]);
    if (existing) {
        return res.status(409).json({ error: 'Tag already exists' });
    }

    const result = await db.run('INSERT INTO tags (name) VALUES (?)', [name]);
    const newTag = await db.get('SELECT * FROM tags WHERE id = ?', [result.lastID]);

    res.status(201).json(newTag);
}

// DELETE /tags/:id
async function remove(req, res) {
    const { id } = req.params;
    const db = await getDB();

    const existing = await db.get('SELECT id FROM tags WHERE id = ?', [id]);
    if (!existing) {
        return res.status(404).json({ error: 'Tag not found' });
    }

    // Because schema.sql defined task_tags/bookmark_tags with
    // ON DELETE CASCADE, deleting a tag automatically removes
    // its links in the junction tables too — no manual cleanup needed.
    await db.run('DELETE FROM tags WHERE id = ?', [id]);
    res.status(204).send();
}

// GET /tags/:id/items — all tasks AND bookmarks that have this tag
// This is the interesting one: it JOINs through the junction tables.
async function getItems(req, res) {
    const { id } = req.params;
    const db = await getDB();

    const tag = await db.get('SELECT * FROM tags WHERE id = ?', [id]);
    if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
    }

    // JOIN tasks through task_tags, but only for the requesting user's tasks
    const tasks = await db.all(
        `SELECT tasks.* FROM tasks
         JOIN task_tags ON tasks.id = task_tags.task_id
         WHERE task_tags.tag_id = ? AND tasks.user_id = ?`,
        [id, req.user.userId]
    );

    // Same pattern for bookmarks
    const bookmarks = await db.all(
        `SELECT bookmarks.* FROM bookmarks
         JOIN bookmark_tags ON bookmarks.id = bookmark_tags.bookmark_id
         WHERE bookmark_tags.tag_id = ? AND bookmarks.user_id = ?`,
        [id, req.user.userId]
    );

    res.json({ tag, tasks, bookmarks });
}

module.exports = { getAll, create, remove, getItems };