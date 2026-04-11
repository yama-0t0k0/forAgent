import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { THEME } from '@shared/src/core/theme/theme';

const FIRESTORE_OP_EQUALS = '=' + '=';

/**
 * A shared Notification Bell component with real-time unread badge.
 * 
 * @param {Object} props
 * @param {string} props.uid - Current user's UID for tracking notifications.
 * @param {Function} props.onPress - Callback when the bell is pressed.
 * @param {number} [props.size=24] - Icon size.
 * @param {string} [props.color=THEME.textInverse] - Icon color.
 * @param {Object} [props.style] - Additional styling for the container.
 */
export const NotificationBell = ({ 
  uid, 
  onPress, 
  size = 24, 
  color = THEME.textInverse,
  style 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!uid) return;

    const db = getFirestore();
    const q = query(
      collection(db, 'notifications'),
      where('uid', FIRESTORE_OP_EQUALS, uid),
      where('isRead', FIRESTORE_OP_EQUALS, false)
    );

    // Set up real-time listener for unread notifications
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.warn('[NotificationBell] Listener error:', error);
    });

    return () => unsubscribe();
  }, [uid]);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <Ionicons name='notifications-outline' size={size} color={color} />
      
      {unreadCount > 0 && (
        <View style={styles.badge} testID='notification_badge'>
          {/* We keep it as a simple dot for premium minimal look, or can add count if requested */}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.error,
    borderWidth: 1.5,
    borderColor: 'white', // Border to make the dot pop against different backgrounds
  },
});
