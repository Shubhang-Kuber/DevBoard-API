const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'get all bookmarks - not built yet' });
});

router.get('/:id', (req, res) => {
    res.json({ message: `get bookmark ${req.params.id} - not built yet` });
});

router.post('/', (req, res) => {
    res.json({ message: 'create bookmark - not built yet' });
});

router.patch('/:id', (req, res) => {
    res.json({ message: `update bookmark ${req.params.id} - not built yet` });
});

router.delete('/:id', (req, res) => {
    res.json({ message: `delete bookmark ${req.params.id} - not built yet` });
});

module.exports = router;