import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, Info } from 'lucide-react-native';

export default function Notification({ notifications, removeNotification }) {
  return (
    <View style={styles.container}>
      {notifications.map((notif) => (
        <Toast
          key={notif.id}
          notification={notif}
          onClose={() => removeNotification(notif.id)}
        />
      ))}
    </View>
  );
}

function Toast({ notification, onClose }) {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
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
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.toast,
        isInfo ? styles.info : isError ? styles.error : styles.success,
      ]}
      onPress={onClose}
    >
      {isInfo ? (
        <Info size={20} color="#fff" style={styles.icon} />
      ) : (
        <CheckCircle size={20} color="#fff" style={styles.icon} />
      )}
      <Text style={styles.message}>{notification.message}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  success: {
    backgroundColor: '#10b981',
  },
  info: {
    backgroundColor: '#3b82f6',
  },
  error: {
    backgroundColor: '#ef4444',
  },
  icon: {
    marginRight: 10,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
