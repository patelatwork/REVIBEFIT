import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [toasts, setToasts] = useState([]);
  const currentPage = useRef(0);

  const getToken = () => localStorage.getItem('accessToken');
  const isLoggedIn = () => !!getToken();

  const authFetch = useCallback(async (path, options = {}) => {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    if (!isLoggedIn()) return;
    authFetch('/api/notifications/unread-count')
      .then((data) => {
        if (data) setUnreadCount(data.count);
      })
      .catch(() => {});
  }, [authFetch]);

  // Socket.IO: listen for real-time notifications
  const handleSocketNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  useSocket({ onNotification: handleSocketNotification });

  // Fetch paginated notifications from API
  const fetchNotifications = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const data = await authFetch(`/api/notifications?page=${page}&limit=20`);
        if (!data) return;

        const incoming = data.notifications || data.data || [];

        if (page === 1) {
          setNotifications(incoming);
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n._id || n.id));
            const unique = incoming.filter((n) => !existingIds.has(n._id || n.id));
            return [...prev, ...unique];
          });
        }

        currentPage.current = page;
        setHasMore(incoming.length >= 20);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [authFetch]
  );

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id) => {
      try {
        await authFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
        setNotifications((prev) =>
          prev.map((n) => ((n._id || n.id) === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silently fail
      }
    },
    [authFetch]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await authFetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, [authFetch]);

  // Transient toast notifications (not persisted)
  const showToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: toast.type || 'info',
      ...toast,
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    showToast,
    dismissToast,
    toasts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
