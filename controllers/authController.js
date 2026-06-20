const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { getDB } = require('../db');

// POST /auth/register
async function register(req, res) {
    const { name, email, password } = req.body;

    // 1. Validate input exists
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const db = await getDB();

    // 2. Check if email is already taken
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
        return res.status(409).json({ error: 'Email already in use' });
    }

    // 3. Hash the password — never store it raw
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Insert the new user
    const result = await db.run(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
    );

    // 5. Respond with the created user (never send back the hash)
    res.status(201).json({
        id: result.lastID,
        name,
        email
    });
}

// POST /auth/login
async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    const db = await getDB();

    // 1. Find the user by email
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Compare submitted password against the stored hash
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Sign a JWT containing the user's id and email
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // 4. Send the token back
    res.status(200).json({ token });
}

// GET /auth/me  (protected route — req.user comes from the auth middleware)
async function me(req, res) {
    const db = await getDB();

    const user = await db.get(
        'SELECT id, name, email, created_at FROM users WHERE id = ?',
        [req.user.userId]
    );

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
}

module.exports = { register, login, me };