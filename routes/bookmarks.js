const express = require('express');
const router  = express.Router();
const bookmarksController = require('../controllers/bookmarksController');
const { protect } = require('../middleware/auth');

router.get('/',      protect, bookmarksController.getAll);
router.get('/:id',   protect, bookmarksController.getOne);
router.post('/',     protect, bookmarksController.create);
router.patch('/:id', protect, bookmarksController.update);
router.delete('/:id',protect, bookmarksController.remove);

module.exports = router;