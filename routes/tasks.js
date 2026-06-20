const express = require('express');
const router  = express.Router();
const tasksController = require('../controllers/tasksController');
const { protect } = require('../middleware/auth');

router.get('/',     protect, tasksController.getAll);
router.get('/:id',  protect, tasksController.getOne);
router.post('/',    protect, tasksController.create);
router.patch('/:id',protect, tasksController.update);
router.delete('/:id', protect, tasksController.remove);

module.exports = router;