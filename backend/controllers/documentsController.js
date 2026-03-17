const Document = require('../models/Document');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { processDocument } = require('../services/documentService');

const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { originalname, filename, path: filePath, size } = req.file;

        // If no user is authenticated, find or create the default demo user
        let userId = req.user ? req.user.id : null;
        if (!userId) {
            let defaultUser = await User.findOne({ email: 'demo@opsmind.ai' }) || await User.findOne({});
            if (!defaultUser) {
                defaultUser = await User.create({
                    username: 'Demo User',
                    email: 'demo@opsmind.ai',
                    password: 'password123',
                    role: 'user'
                });
            }
            userId = defaultUser._id;
        }

        const document = new Document({
            filename: originalname,
            storedFilename: filename,
            path: filePath,
            size,
            uploadedBy: userId,
            status: 'processing'
        });

        await document.save();

        // Process document in the background
        processDocument(document._id, filePath);

        res.status(201).json({
            message: 'File uploaded successfully',
            document: {
                id: document._id,
                filename: document.filename,
                status: document.status,
                uploadedAt: document.uploadedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

const getDocuments = async (req, res, next) => {
    try {
        let userId = req.user ? req.user.id : null;
        if (!userId) {
            const defaultUser = await User.findOne({ email: 'demo@opsmind.ai' }) || await User.findOne({});
            if (!defaultUser) return res.json([]);
            userId = defaultUser._id;
        }

        const documents = await Document.find({ uploadedBy: userId })
            .sort({ uploadedAt: -1 })
            .select('-storedFilename -path -__v');

        res.json(documents);
    } catch (error) {
        next(error);
    }
};

const getDocument = async (req, res, next) => {
    try {
        let userId = req.user ? req.user.id : null;
        if (!userId) {
            const defaultUser = await User.findOne({ email: 'demo@opsmind.ai' }) || await User.findOne({});
            if (!defaultUser) return res.status(404).json({ message: 'User not found' });
            userId = defaultUser._id;
        }

        const document = await Document.findOne({
            _id: req.params.id,
            uploadedBy: userId
        });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        next(error);
    }
};

const deleteDocument = async (req, res, next) => {
    try {
        let userId = req.user ? req.user.id : null;
        if (!userId) {
            const defaultUser = await User.findOne({ email: 'demo@opsmind.ai' }) || await User.findOne({});
            if (!defaultUser) return res.status(404).json({ message: 'User not found' });
            userId = defaultUser._id;
        }

        const document = await Document.findOneAndDelete({
            _id: req.params.id,
            uploadedBy: userId
        });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Delete the file from the filesystem
        fs.unlink(document.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        next(error);
    }
};
const getKnowledgeGraph = async (req, res, next) => {
    try {
        let userId = req.user ? req.user.id : null;
        if (!userId) {
            const defaultUser = await User.findOne({ email: 'demo@opsmind.ai' }) || await User.findOne({});
            if (!defaultUser) return res.json({ nodes: [], links: [] });
            userId = defaultUser._id;
        }

        const documents = await Document.find({ uploadedBy: userId });

        const nodes = [];
        const links = [];
        const conceptSet = new Map();

        documents.forEach(doc => {
            const docNodeId = `doc_${doc._id}`;
            nodes.push({ id: docNodeId, name: doc.filename, type: 'document', size: 15 });

            if (doc.concepts && doc.concepts.length > 0) {
                doc.concepts.forEach(concept => {
                    const conceptName = concept.trim();
                    const conceptNodeId = `concept_${conceptName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

                    if (!conceptSet.has(conceptNodeId)) {
                        conceptSet.set(conceptNodeId, true);
                        nodes.push({ id: conceptNodeId, name: conceptName, type: 'concept', size: 20 });
                    }

                    links.push({ source: docNodeId, target: conceptNodeId, value: 5 });
                });
            }
        });

        res.json({ nodes, links });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    getKnowledgeGraph
};
