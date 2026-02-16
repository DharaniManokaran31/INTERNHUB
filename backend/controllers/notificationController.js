const Notification = require('../models/Notification');

// ----------------------
// Get user's notifications
// ----------------------
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const recipientModel = userRole === 'student' ? 'Student' : 'Recruiter';

    const notifications = await Notification.find({
      recipient: userId,
      recipientModel: recipientModel
    })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to 50 most recent

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
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
      message: 'Error fetching notifications'
    });
  }
};

// ----------------------
// Mark notification as read
// ----------------------
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        recipient: userId 
      },
      { isRead: true },
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
      message: 'Error updating notification'
    });
  }
};

// ----------------------
// Mark all notifications as read
// ----------------------
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const recipientModel = userRole === 'student' ? 'Student' : 'Recruiter';

    await Notification.updateMany(
      {
        recipient: userId,
        recipientModel: recipientModel,
        isRead: false
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications'
    });
  }
};

// ----------------------
// Delete a notification
// ----------------------
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
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
      message: 'Error deleting notification'
    });
  }
};

// ----------------------
// Clear all notifications
// ----------------------
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const recipientModel = userRole === 'student' ? 'Student' : 'Recruiter';

    await Notification.deleteMany({
      recipient: userId,
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
      message: 'Error clearing notifications'
    });
  }
};

// ----------------------
// Helper function to create notification (called by other controllers)
// ----------------------
const createNotification = async ({
  recipient,
  recipientModel,
  type,
  title,
  message,
  data = {}
}) => {
  try {
    const notification = new Notification({
      recipient,
      recipientModel,
      type,
      title,
      message,
      data
    });

    await notification.save();
    
    // Here you could also emit socket event for real-time
    // We'll add socket.io later if needed
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification
};