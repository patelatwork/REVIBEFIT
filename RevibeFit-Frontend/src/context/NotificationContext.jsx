import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Create Notification Context
const NotificationContext = createContext();

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Add a notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      type: notification.type || 'info', // success, error, warning, info
      ...notification,
    };
    
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep only last 50
    setUnreadCount((prev) => prev + 1);
    
    // Auto-dismiss after 5 seconds if specified
    if (notification.autoDismiss) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  }, []);

  // Remove specific notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === id);
      if (notif && !notif.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);
  
  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);
  
  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    getNotificationsByType,
    getUnreadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
