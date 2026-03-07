import { useState, useRef, useEffect, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';

function timeAgo(dateString) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const dropdownRef = useRef(null);

  // Fetch first page when dropdown opens
  useEffect(() => {
    if (open) {
      setPage(1);
      fetchNotifications(1);
    }
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  }, [page, fetchNotifications]);

  const handleNotificationClick = useCallback(
    (notification) => {
      const id = notification._id || notification.id;
      if (!notification.read) {
        markAsRead(id);
      }
    },
    [markAsRead]
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && !loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => {
                  const id = notification._id || notification.id;
                  return (
                    <li
                      key={id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-green-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Unread indicator */}
                        <div className="mt-1.5 flex-shrink-0">
                          {!notification.read ? (
                            <span className="block w-2 h-2 rounded-full bg-green-500" />
                          ) : (
                            <span className="block w-2 h-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-snug ${
                              !notification.read
                                ? 'font-semibold text-gray-900'
                                : 'font-normal text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">
                            {timeAgo(notification.createdAt || notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Loading spinner */}
            {loading && (
              <div className="px-4 py-3 text-center">
                <div className="inline-block w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Load more */}
            {!loading && hasMore && notifications.length > 0 && (
              <button
                onClick={handleLoadMore}
                className="w-full px-4 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
