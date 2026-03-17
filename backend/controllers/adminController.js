const User = require('../models/User');
const Document = require('../models/Document');

const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password -__v');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

const getStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDocuments = await Document.countDocuments();
        const activeUsers = await User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
        
        res.json({
            totalUsers,
            totalDocuments,
            activeUsers,
            storageUsed: '0 MB' // This would be calculated in a real app
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        
        // Prevent deleting the last admin
        const user = await User.findById(userId);
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last admin' });
            }
        }
        
        // Delete user and their documents
        await Promise.all([
            User.findByIdAndDelete(userId),
            Document.deleteMany({ uploadedBy: userId })
        ]);
        
        res.json({ message: 'User and their documents deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getStats,
    deleteUser
};
