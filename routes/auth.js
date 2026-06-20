const express = require('express');
const router = express.Router();

// We haven't built the controller yet, so this is a placeholder
// just to get the server running without crashing.
router.post('/register', (req, res) => {
    res.json({ message: 'register endpoint - not built yet' });
});

router.post('/login', (req, res) => {
    res.json({ message: 'login endpoint - not built yet' });
});

module.exports = router;