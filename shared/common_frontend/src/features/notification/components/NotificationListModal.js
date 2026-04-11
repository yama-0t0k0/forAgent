import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';
import { NotificationService } from '../services/notificationService';

/**
 * Modal component to display a list of notifications.
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Modal visibility.
 * @param {Function} props.onClose - Multi-purpose close handler.
 * @param {Array} props.notifications - List of notification objects.
 * @param {Function} props.onRefresh - Callback to refresh notification list.
 */
export const NotificationListModal = ({ 
  visible, 
  onClose, 
  notifications,
  onRefresh
}) => {
  const handleItemPress = async (item) => {
    if (!item.isRead) {
      try {
        await NotificationService.markAsRead(item.id);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.itemContainer, 
        !item.isRead && styles.unreadItem
      ]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemIconContainer}>
        <Ionicons 
          name={item.isRead ? "mail-open-outline" : "mail-unread-outline"} 
          size={24} 
          color={item.isRead ? THEME.textSecondary : THEME.primary} 
        />
      </View>
      <View style={styles.itemTextContainer}>
        <Text style={[styles.itemTitle, !item.isRead && styles.unreadText]}>
          {item.title || 'システム通知'}
        </Text>
        <Text style={styles.itemMessage} numberOfLines={3}>
          {item.message}
        </Text>
        <Text style={styles.itemDate}>
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Just now'}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>通知一覧</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-outline" size={30} color={THEME.textPrimary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={THEME.textSecondary} />
              <Text style={styles.emptyText}>通知はありません</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.textPrimary,
  },
  closeButton: {
    padding: 5,
  },
  listContent: {
    paddingVertical: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
    backgroundColor: THEME.surface,
  },
  unreadItem: {
    backgroundColor: THEME.primary + '08', // Very light primary tint for unread
  },
  itemIconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginBottom: 4,
  },
  unreadText: {
    color: THEME.primary,
  },
  itemMessage: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.primary,
    alignSelf: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: THEME.textSecondary,
  },
});
