import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { THEME } from '@shared/src/core/theme/theme';
import { styles } from '../../dashboardStyles';

export const UserDetailModal = ({ visible, onClose, loading, error, userDoc, userId }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <Pressable style={styles.detailOverlay} onPress={onClose}>
      <Pressable style={styles.detailWindow} onPress={(e) => e.stopPropagation()}>
        <View style={styles.detailWindowHeader}>
          <View style={{ flex: 1 }} />
          <Text style={styles.detailWindowTitle}>個人詳細</Text>
          <TouchableOpacity onPress={onClose} style={styles.detailWindowClose}>
            <Text style={styles.detailWindowCloseText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.detailWindowLoading}>
            <ActivityIndicator size="large" color={THEME.accent} />
            <Text style={styles.detailWindowLoadingText}>読み込み中...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.detailWindowLoading}>
            <Text style={styles.detailWindowErrorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && userDoc && (
          <View style={{ flex: 1 }}>
            <IndividualProfileScreen
              userId={userId}
              userDoc={userDoc}
              hideSafeArea={true}
            />
          </View>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);
