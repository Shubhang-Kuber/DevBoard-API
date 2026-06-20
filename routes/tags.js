const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'get all tags - not built yet' });
});

router.post('/', (req, res) => {
    res.json({ message: 'create tag - not built yet' });
});

router.delete('/:id', (req, res) => {
    res.json({ message: `delete tag ${req.params.id} - not built yet` });
});

router.get('/:id/items', (req, res) => {
    res.json({ message: `get items for tag ${req.params.id} - not built yet` });
});

module.exports = router;