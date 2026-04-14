/**
 * @file NotificationService.js
 * @description Service for managing user notifications in Firestore.
 */
import { 
  getFirestore, 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  serverTimestamp,
  writeBatch
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
   * Marks all notifications as read for a specific user.
   * 
   * @param {string} uid - The user's UID.
   */
  markAllAsRead: async (uid) => {
    const db = getFirestore();
    const q = query(
      collection(db, 'notifications'),
      where('uid', FIRESTORE_OP_EQUALS, uid),
      where('isRead', FIRESTORE_OP_EQUALS, false)
    );

    try {
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          isRead: true,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`[NotificationService] All notifications marked as read for user ${uid}.`);
    } catch (error) {
      console.error('[NotificationService] Batch update failed:', error);
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
  },

  /**
   * Creates a notification within a Firestore transaction.
   * 
   * @param {object} transaction - The Firestore transaction object.
   * @param {object} data - The notification data { uid, type, title, message, metadata }.
   */
  createNotificationInTransaction: (transaction, data) => {
    const db = getFirestore();
    const notificationRef = doc(collection(db, 'notifications'));
    transaction.set(notificationRef, {
      ...data,
      isRead: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
};
