const { getDB } = require('../db');

// GET /tasks — returns only the logged-in user's tasks
async function getAll(req, res) {
    const db = await getDB();

    const tasks = await db.all(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.userId]
    );

    res.json(tasks);
}

// GET /tasks/:id — returns one task, only if it belongs to this user
async function getOne(req, res) {
    const db = await getDB();
    const { id } = req.params;

    const task = await db.get(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
    );

    // If no row matched, either the task doesn't exist OR it belongs to someone else.
    // We deliberately don't distinguish between these — same 404 either way.
    // This prevents leaking "this id exists but isn't yours" info to other users.
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
}

// POST /tasks — create a new task for the logged-in user
async function create(req, res) {
    const { title, description, status, due_date } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'title is required' });
    }

    const db = await getDB();

    const result = await db.run(
        `INSERT INTO tasks (user_id, title, description, status, due_date)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.userId, title, description || null, status || 'todo', due_date || null]
    );

    // Fetch the row we just created so we return the full object
    // (with id, created_at, etc.) instead of just guessing the shape
    const newTask = await db.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);

    res.status(201).json(newTask);
}

// PATCH /tasks/:id — update only the fields that were sent
async function update(req, res) {
    const { id } = req.params;
    const { title, description, status, due_date } = req.body;
    const db = await getDB();

    // First confirm this task exists AND belongs to this user
    const existing = await db.get(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
    );

    if (!existing) {
        return res.status(404).json({ error: 'Task not found' });
    }

    // PATCH semantics: only overwrite fields that were actually sent.
    // If a field is undefined in the request body, fall back to the existing value.
    const updated = {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        status: status !== undefined ? status : existing.status,
        due_date: due_date !== undefined ? due_date : existing.due_date
    };

    await db.run(
        `UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ?
         WHERE id = ? AND user_id = ?`,
        [updated.title, updated.description, updated.status, updated.due_date, id, req.user.userId]
    );

    const result = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(result);
}

// DELETE /tasks/:id
async function remove(req, res) {
    const { id } = req.params;
    const db = await getDB();

    // Confirm ownership before deleting
    const existing = await db.get(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
    );

    if (!existing) {
        return res.status(404).json({ error: 'Task not found' });
    }

    await db.run('DELETE FROM tasks WHERE id = ?', [id]);

    // 204 No Content — successful delete, nothing to send back
    res.status(204).send();
}

// POST /tasks/:id/tags — attach a tag to a task
async function addTag(req, res) {
    const { id } = req.params;       // task id
    const { tagId } = req.body;      // tag id to attach
    const db = await getDB();

    // Confirm the task belongs to this user
    const task = await db.get(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
    );
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    // Confirm the tag exists
    const tag = await db.get('SELECT id FROM tags WHERE id = ?', [tagId]);
    if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
    }

    // Insert into the junction table — this IS the relationship
    // INSERT OR IGNORE prevents a crash if this pair already exists
    // (task_tags has a composite PRIMARY KEY of task_id + tag_id)
    await db.run(
        'INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)',
        [id, tagId]
    );

    res.status(201).json({ message: 'Tag attached', taskId: id, tagId });
}

module.exports = { getAll, getOne, create, update, remove, addTag };

