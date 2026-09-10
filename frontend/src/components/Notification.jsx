import React, { useEffect, useRef } from 'react';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';

export default function Notification({ notifications = [], removeNotification }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="notification-container" style={{ pointerEvents: 'none' }}>
      {notifications.map((notif) => (
        <Toast
          key={notif.id}
          notification={notif}
          onClose={() => removeNotification && removeNotification(notif.id)}
        />
      ))}
    </div>
  );
}

function Toast({ notification, onClose }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // Exactly 5 seconds as requested by the user
    const timer = setTimeout(() => {
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id]);

  const isInfo = notification.type === 'info';
  const isError = notification.type === 'error';

  return (
    <div
      className={`toast ${notification.type || 'success'}`}
      onClick={onClose}
      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      title="Click to dismiss"
    >
      {isInfo ? (
        <Info size={20} className="toast-icon" style={{ color: 'var(--primary)', flexShrink: 0 }} />
      ) : isError ? (
        <AlertCircle size={20} className="toast-icon" style={{ color: '#ef4444', flexShrink: 0 }} />
      ) : (
        <CheckCircle size={20} className="toast-icon" style={{ color: '#10b981', flexShrink: 0 }} />
      )}
      <span className="toast-message">{notification.message}</span>
    </div>
  );
}
