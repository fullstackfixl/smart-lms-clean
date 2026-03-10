const express = require('express');
const userController = require('../../controllers/platformAdmin/userController');
const router = express.Router();

router.get('/', userController.list);
router.get('/:userId', userController.getDetails);
router.patch('/:userId/suspend', userController.suspend);

module.exports = router;
