const Notification = require('../models/Notification');

// ============================================
// USER NOTIFICATIONS
// ============================================

// Get My Notifications
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        const recipientModel = userRole === 'student' ? 'Student' : 'Recruiter';

        const notifications = await Notification.find({
            recipientId: userId,
            recipientModel: recipientModel
        })
        .sort({ createdAt: -1 })
        .limit(50);

        const unreadCount = await Notification.countDocuments({
            recipientId: userId,
            recipientModel: recipientModel,
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark Notification as Read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { 
                _id: notificationId,
                recipientId: userId 
            },
            { 
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: { notification }
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark All as Read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        const recipientModel = userRole === 'student' ? 'Student' : 'Recruiter';

        await Notification.updateMany(
            {
                recipientId: userId,
                recipientModel: recipientModel,
                isRead: false
            },
            { 
                isRead: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark Notification as Clicked
exports.markAsClicked = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { 
                _id: notificationId,
                recipientId: userId 
            },
            { 
                isClicked: true,
                clickedAt: new Date()
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        console.error('Error marking notification as clicked:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipientId: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Clear All Notifications
exports.clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        const recipientModel = userRole === 'student' ? 'Student' : 'Recruiter';

        await Notification.deleteMany({
            recipientId: userId,
            recipientModel: recipientModel
        });

        res.status(200).json({
            success: true,
            message: 'All notifications cleared'
        });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Unread Count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        const recipientModel = userRole === 'student' ? 'Student' : 'Recruiter';

        const count = await Notification.countDocuments({
            recipientId: userId,
            recipientModel: recipientModel,
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// HELPER FUNCTION (for other controllers)
// ============================================

// ✅ FIXED: Create Notification with proper error handling (non-blocking)
exports.createNotification = async ({
    recipientId,
    recipientModel,
    type,
    title,
    message,
    data = {},
    priority = 'medium'
}) => {
    try {
        // Validate recipient exists (optional - non-blocking)
        try {
            const Model = recipientModel === 'Student' 
                ? require('../models/Student')
                : require('../models/Recruiter');
            
            const recipient = await Model.findById(recipientId);
            if (!recipient) {
                console.error(`⚠️ Recipient ${recipientId} not found in ${recipientModel}`);
                return null;
            }
        } catch (err) {
            console.error('⚠️ Error validating recipient:', err.message);
            // Continue anyway - don't block notification
        }

        const notification = new (require('../models/Notification'))({
            recipientId,
            recipientModel,
            type,
            title,
            message,
            data,
            priority,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        await notification.save();
        
        // TODO: Emit socket event for real-time notification
        // if (global.io) {
        //     global.io.to(`${recipientModel}_${recipientId}`).emit('notification', notification);
        // }

        return notification;
    } catch (error) {
        console.error('⚠️ Error creating notification:', error.message);
        return null; // Return null instead of throwing
    }
};