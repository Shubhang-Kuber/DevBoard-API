const { getDB } = require('../db');

// GET /bookmarks — returns only the logged-in user's bookmarks
async function getAll(req, res) {
    const db = await getDB();

    const bookmarks = await db.all(
        'SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.userId]
    );

    res.json(bookmarks);
}

// GET /bookmarks/:id
async function getOne(req, res) {
    const db = await getDB();
    const { id } = req.params;

    const bookmark = await db.get(
        'SELECT * FROM bookmarks WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
    );

    if (!bookmark) {
        return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json(bookmark);
}

// POST /bookmarks
async function create(req, res) {
    const { title, url, notes } = req.body;

    if (!title || !url) {
        return res.status(400).json({ error: 'title and url are required' });
    }

    const db = await getDB();

    const result = await db.run(
        'INSERT INTO bookmarks (user_id, title, url, notes) VALUES (?, ?, ?, ?)',
        [req.user.userId, title, url, notes || null]
    );

    const newBookmark = await db.get('SELECT * FROM bookmarks WHERE id = ?', [result.lastID]);

    res.status(201).json(newBookmark);
}

// PATCH /bookmarks/:id
async function update(req, res) {
    const { id } = req.params;
    const { title, url, notes } = req.body;
    const db = await getDB();

    const existing = await db.get(
        'SELECT * FROM bookmarks WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
    );

    if (!existing) {
        return res.status(404).json({ error: 'Bookmark not found' });
    }

    const updated = {
        title: title !== undefined ? title : existing.title,
        url: url !== undefined ? url : existing.url,
        notes: notes !== undefined ? notes : existing.notes
    };

    await db.run(
        'UPDATE bookmarks SET title = ?, url = ?, notes = ? WHERE id = ? AND user_id = ?',
        [updated.title, updated.url, updated.notes, id, req.user.userId]
    );

    const result = await db.get('SELECT * FROM bookmarks WHERE id = ?', [id]);
    res.json(result);
}

// DELETE /bookmarks/:id
async function remove(req, res) {
    const { id } = req.params;
    const db = await getDB();

    const existing = await db.get(
        'SELECT id FROM bookmarks WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
    );

    if (!existing) {
        return res.status(404).json({ error: 'Bookmark not found' });
    }

    await db.run('DELETE FROM bookmarks WHERE id = ?', [id]);
    res.status(204).send();
}

module.exports = { getAll, getOne, create, update, remove };