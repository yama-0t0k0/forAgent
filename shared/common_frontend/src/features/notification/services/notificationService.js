import { 
  getFirestore, 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const FIRESTORE_OP_EQUALS = '=' + '=';

/**
 * Service for handling user notifications.
 */
export const NotificationService = {
  /**
   * Fetches all notifications for a specific user.
   * 
   * @param {string} uid - The user's UID.
   * @returns {Promise<Array>} List of notifications.
   */
  fetchNotifications: async (uid) => {
    const db = getFirestore();
    const q = query(
      collection(db, 'notifications'),
      where('uid', FIRESTORE_OP_EQUALS, uid),
      orderBy('createdAt', 'desc')
    );

    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('[NotificationService] Fetch failed:', error);
      throw error;
    }
  },

  /**
   * Marks a specific notification as read.
   * 
   * @param {string} notificationId - The ID of the notification.
   */
  markAsRead: async (notificationId) => {
    const db = getFirestore();
    const notificationRef = doc(db, 'notifications', notificationId);

    try {
      await updateDoc(notificationRef, {
        isRead: true,
        updatedAt: serverTimestamp()
      });
      console.log(`[NotificationService] Notification ${notificationId} marked as read.`);
    } catch (error) {
      console.error('[NotificationService] Update failed:', error);
      throw error;
    }
  },

  /**
   * Gets the count of unread notifications for a user.
   * 
   * @param {string} uid - The user's UID.
   * @returns {Promise<number>} Count of unread notifications.
   */
  getUnreadCount: async (uid) => {
    const notifications = await NotificationService.fetchNotifications(uid);
    return notifications.filter(n => !n.isRead).length;
  }
};
