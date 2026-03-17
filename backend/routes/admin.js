const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin routes
router.get('/users', adminController.getAllUsers);
router.get('/stats', adminController.getStats);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
