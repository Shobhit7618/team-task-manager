const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// 🎯 Route maps cleanly to our controller logic
router.get('/:projectId/messages', chatController.getProjectMessages);

module.exports = router;