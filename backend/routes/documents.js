const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');
const upload = require('../middleware/upload');

// Document routes
router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/graph', documentsController.getKnowledgeGraph);
router.get('/', documentsController.getDocuments);
router.get('/:id', documentsController.getDocument);
router.delete('/:id', documentsController.deleteDocument);

module.exports = router;
