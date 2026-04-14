import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { THEME } from '@shared/src/core/theme/theme';

const FIRESTORE_OP_EQUALS = '=' + '=';

/**
 * A shared Notification Bell component with real-time unread badge.
 * Includes glassmorphism and pulse animation for unread notifications.
 */
export const NotificationBell = ({ 
  uid, 
  onPress, 
  size = 24, 
  color = THEME.textInverse,
  style 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!uid) return;

    const db = getFirestore();
    const q = query(
      collection(db, 'notifications'),
      where('uid', FIRESTORE_OP_EQUALS, uid),
      where('isRead', FIRESTORE_OP_EQUALS, false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.warn('[NotificationBell] Listener error:', error);
    });

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [unreadCount, pulseAnim]);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <Ionicons name='notifications-outline' size={size} color={color} />
      
      {unreadCount > 0 && (
        <Animated.View 
          style={[
            styles.badge, 
            { transform: [{ scale: pulseAnim }] }
          ]} 
          testID='notification_badge'
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
    backgroundColor: THEME.surfaceGlassLow, // Glassmorphism base
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.overlayLight,
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
    borderColor: THEME.surfaceGlassHigh, // Glassmorphism pop
    shadowColor: THEME.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
