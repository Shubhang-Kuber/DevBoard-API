const express = require('express');
const router  = express.Router();
const tagsController = require('../controllers/tagsController');
const { protect } = require('../middleware/auth');

router.get('/',          protect, tagsController.getAll);
router.post('/',         protect, tagsController.create);
router.delete('/:id',    protect, tagsController.remove);
router.get('/:id/items', protect, tagsController.getItems);

module.exports = router;