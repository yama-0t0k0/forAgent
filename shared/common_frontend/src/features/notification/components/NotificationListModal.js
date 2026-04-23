import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';
import { NotificationService } from '../services/notificationService';

const DEFAULT_NOTIFICATION_TITLE = 'システム通知';
const DEFAULT_NOTIFICATION_DATE_LABEL = 'Today';
const MAX_NOTIFICATION_LINES = 3;

/**
 * Modal component to display a list of notifications.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal visibility.
 * @param {string} props.uid - User UID for marking all as read.
 * @param {Function} props.onClose - Multi-purpose close handler.
 * @param {Array} props.notifications - List of notification objects.
 * @param {Function} props.onRefresh - Callback to refresh notification list.
 * @returns {React.JSX.Element}
 */
export const NotificationListModal = ({
  visible,
  uid,
  onClose,
  notifications,
  onRefresh,
}) => {
  /**
   * @param {Object} item
   * @returns {Promise<void>}
   */
  const handleItemPress = async (item) => {
    if (item?.isRead) return;

    try {
      await NotificationService.markAsRead(item.id);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  /**
   * @returns {Promise<void>}
   */
  const handleMarkAllAsRead = async () => {
    if (!uid) return;

    try {
      await NotificationService.markAllAsRead(uid);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  /**
   * @param {Object} info
   * @returns {React.JSX.Element}
   */
  const renderItem = (info) => {
    const item = info.item;
    return (
    <TouchableOpacity
      style={[styles.itemContainer, !item.isRead && styles.unreadItem]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.itemIconContainer, !item.isRead && styles.unreadIconBg]}>
        <Ionicons
          name={item.isRead ? 'mail-open-outline' : 'notifications'}
          size={22}
          color={item.isRead ? THEME.textMuted : THEME.primary}
        />
      </View>

      <View style={styles.itemTextContainer}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, !item.isRead && styles.unreadText]}>
            {item.title || DEFAULT_NOTIFICATION_TITLE}
          </Text>
          <Text style={styles.itemDate}>
            {item.createdAt?.toDate
              ? item.createdAt.toDate().toLocaleDateString()
              : DEFAULT_NOTIFICATION_DATE_LABEL}
          </Text>
        </View>
        <Text style={styles.itemMessage} numberOfLines={MAX_NOTIFICATION_LINES}>
          {item.message}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
    );
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const isMarkAllDisabled = unreadCount === 0;

  return (
    <Modal visible={visible} animationType='slide' transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle='dark-content' />
          <View style={styles.contentContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                <Ionicons name='chevron-down' size={28} color={THEME.textPrimary} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>通知</Text>

              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={styles.textButton}
                disabled={isMarkAllDisabled}
              >
                <Text style={[styles.markAllText, isMarkAllDisabled && styles.disabledText]}>
                  すべて既読
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name='notifications-off-outline'
                      size={40}
                      color={THEME.textMuted}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>通知はありません</Text>
                  <Text style={styles.emptySubtitle}>新しい通知が届くとここに表示されます</Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.overlayMedium,
  },
  safeArea: {
    flex: 1,
    marginTop: 60,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: THEME.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    ...THEME.shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.textPrimary,
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 4,
  },
  textButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary,
  },
  disabledText: {
    color: THEME.textMuted,
  },
  listContent: {
    paddingBottom: 40,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
    backgroundColor: THEME.background,
  },
  unreadItem: {
    backgroundColor: `${THEME.primary}05`,
  },
  itemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.surfaceInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  unreadIconBg: {
    backgroundColor: `${THEME.primary}15`,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    color: THEME.textPrimary,
  },
  itemMessage: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20,
  },
  itemDate: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.primary,
    alignSelf: 'center',
    marginLeft: 12,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.surfaceInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
