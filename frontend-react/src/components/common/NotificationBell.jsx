// src/components/common/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../../styles/StudentDashboard.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        bellRef.current && !bellRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const response = await fetch('https://internhub-backend-d870.onrender.com/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        const newNotifications = data.data.notifications;
        
        // 🚀 REAL-TIME POPUP LOGIC:
        // If we have a new UNREAD notification that is newer than what we had, show a toast
        if (notifications.length > 0 && newNotifications.length > 0) {
          const latestOld = notifications[0];
          const latestNew = newNotifications[0];
          
          if (latestNew._id !== latestOld._id && !latestNew.isRead) {
            showToastPopup(latestNew);
          }
        } else if (notifications.length === 0 && newNotifications.length > 0) {
           // First load - maybe don't toast all, but could toast the very latest if it's very recent
           const latest = newNotifications[0];
           const createdAt = new Date(latest.createdAt);
           const now = new Date();
           if (!latest.isRead && (now - createdAt) < 60000) { // If less than 1 min old
             showToastPopup(latest);
           }
        }

        setNotifications(newNotifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  };

  const showToastPopup = (notif) => {
    toast(
      <div onClick={() => handleNotificationClick(notif)}>
        <strong>{notif.title}</strong>
        <p style={{ margin: '5px 0 0', fontSize: '13px' }}>{notif.message}</p>
      </div>,
      {
        toastId: notif._id,
        autoClose: 8000,
        pauseOnHover: true,
      }
    );
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://internhub-backend-d870.onrender.com/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://internhub-backend-d870.onrender.com/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://internhub-backend-d870.onrender.com/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        // Update unread count if the deleted notification was unread
        const deletedNotif = notifications.find(n => n._id === notificationId);
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const isStudent = userData.role === 'student';

    // Navigate based on notification type
    switch (notification.type) {
      case 'application_received':
        if (notification.data?.applicationId) {
          navigate(`/recruiter/applicants?application=${notification.data.applicationId}`);
        }
        break;
      case 'application_status_change':
        if (notification.data?.applicationId) {
          if (isStudent) {
            navigate(`/student/applications?id=${notification.data.applicationId}`);
          } else {
            navigate(`/recruiter/applicants?application=${notification.data.applicationId}`);
          }
        }
        break;
      case 'interview_scheduled':
        if (isStudent) {
          navigate('/student/dashboard'); // Or a specific interview page if exists
        } else {
          navigate('/recruiter/interviews');
        }
        break;
      case 'interview_result':
        if (isStudent) {
          navigate('/student/applications');
        } else {
          navigate('/recruiter/interviews');
        }
        break;
      case 'internship_expiring':
        if (notification.data?.internshipId) {
          navigate(`/recruiter/internships/${notification.data.internshipId}`);
        }
        break;
      default:
        // Just close dropdown
        break;
    }

    setShowDropdown(false);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-wrapper">
      <button
        ref={bellRef}
        className="notification-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className={`notification-badge ${unreadCount > 99 ? 'large-count' :
              unreadCount > 9 ? 'multi-digit' : ''
            }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div ref={dropdownRef} className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-read-btn">
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12h8"></path>
                </svg>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">{formatTime(notif.createdAt)}</div>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => deleteNotification(notif._id, e)}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;