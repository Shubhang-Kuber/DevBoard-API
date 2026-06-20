const express = require('express');
const router = express.Router();

// Placeholders — real logic comes once the controller is built
router.get('/', (req, res) => {
    res.json({ message: 'get all tasks - not built yet' });
});

router.get('/:id', (req, res) => {
    res.json({ message: `get task ${req.params.id} - not built yet` });
});

router.post('/', (req, res) => {
    res.json({ message: 'create task - not built yet' });
});

router.patch('/:id', (req, res) => {
    res.json({ message: `update task ${req.params.id} - not built yet` });
});

router.delete('/:id', (req, res) => {
    res.json({ message: `delete task ${req.params.id} - not built yet` });
});

module.exports = router;