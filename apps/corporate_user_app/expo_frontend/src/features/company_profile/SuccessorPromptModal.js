import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * Modal to prompt the user to select a successor Alpha.
 * Used when the last Alpha user tries to demote themselves or leave.
 * 
 * @param {boolean} visible
 * @param {Array} members - Full list of company members
 * @param {string} currentUid - UID of the current Alpha
 * @param {Function} onClose
 * @param {Function} onConfirm - Callback receiving (successorUid)
 * @param {boolean} loading
 */
export const SuccessorPromptModal = ({ 
  visible, 
  members, 
  currentUid, 
  onClose, 
  onConfirm,
  loading 
}) => {
  const [selectedUid, setSelectedUid] = useState(null);

  // Filter for potential successors (non-alphas)
  const potentialSuccessors = members.filter(m => 
    m.uid !== currentUid && m.role !== 'corporate-alpha'
  );

  const handleConfirm = () => {
    if (!selectedUid) {
      Alert.alert('確認', '後任のメンバーを一人選択してください。');
      return;
    }

    const successor = potentialSuccessors.find(s => s.uid === selectedUid);
    Alert.alert(
      '最終確認',
      `${successor.displayName || '選択したメンバー'} さんを後任の採用管理者(Alpha)に指名し、自身の権限を下げます。よろしいですか？\n\n※この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '委譲を実行する', 
          style: 'destructive',
          onPress: () => onConfirm(selectedUid) 
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.successorCard, 
        selectedUid === item.uid && styles.selectedCard
      ]}
      onPress={() => setSelectedUid(item.uid)}
    >
      <View style={styles.successorInfo}>
        <Text style={styles.successorName}>{item.displayName || 'No Name'}</Text>
        <Text style={styles.successorRole}>現在の役割: {item.role === 'corporate-beta' ? 'β：採用関係者' : 'γ：一般社員'}</Text>
      </View>
      {selectedUid === item.uid && (
        <Ionicons name='checkmark-circle' size={24} color={THEME.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='slide'
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.warningIcon}>
              <Ionicons name='warning' size={24} color={THEME.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>後任管理者の指定</Text>
              <Text style={styles.subtitle}>
                最後のAlpha（採用管理者）は降格できません。継続するためには後任を一人選んでください。
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name='close' size={24} color={THEME.textMuted} />
            </TouchableOpacity>
          </View>

          {potentialSuccessors.length > 0 ? (
            <FlatList
              data={potentialSuccessors}
              renderItem={renderItem}
              keyExtractor={(item) => item.uid}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>後任に指定可能なメンバーがいません。</Text>
              <Text style={styles.emptySubtext}>まずは新しいメンバーを招待、または登録してください。</Text>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                (!selectedUid || loading) && styles.disabledButton
              ]}
              onPress={handleConfirm}
              disabled={!selectedUid || loading}
            >
              {loading ? (
                <ActivityIndicator color={THEME.textInverse} />
              ) : (
                <Text style={styles.confirmText}>権限を委譲して完了</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.overlayDark,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: THEME.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
  },
  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surfaceWarning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  list: {
    maxHeight: 400,
  },
  listContent: {
    padding: 16,
  },
  successorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.borderDefault,
    marginBottom: 8,
  },
  selectedCard: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primary + '10',
  },
  successorInfo: {
    flex: 1,
  },
  successorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textPrimary,
  },
  successorRole: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  confirmButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: THEME.surfaceMuted,
  },
  confirmText: {
    color: THEME.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 8,
    textAlign: 'center',
  }
});
