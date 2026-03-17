const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat routes
router.post('/', chatController.sendMessage);
router.get('/history', chatController.getChatHistory);

module.exports = router;
