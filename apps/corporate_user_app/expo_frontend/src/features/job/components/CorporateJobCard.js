import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { JobDescriptionService } from '@shared/src/core/services/JobDescriptionService';

/**
 * Corporate Job Card Component
 * @param {Object} props
 * @param {Object} props.job - JobDescription data
 * @param {function} props.onEdit - Edit handler
 * @param {function} props.onDeleteSuccess - Callback after successful deletion
 * @param {function} props.onStatusChange - Callback after status change
 */
export const CorporateJobCard = ({ job, onEdit, onDeleteSuccess, onStatusChange }) => {
  const [isToggling, setIsToggling] = useState(false);
  const JOB_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  };
  const IONICON_NAME = {
    EDIT: 'create-outline',
    DELETE: 'trash-outline',
  };
  const isActive = job.status === JOB_STATUS.ACTIVE;

  /**
   * @returns {Promise<void>}
   */
  const handleToggleStatus = async () => {
    if (isToggling) return;
    setIsToggling(true);
    const newStatus = isActive ? JOB_STATUS.INACTIVE : JOB_STATUS.ACTIVE;
    
    try {
      await JobDescriptionService.updateJobStatus(job.companyId, job.id, newStatus);
      if (onStatusChange) onStatusChange(job.id, newStatus);
    } catch (error) {
      Alert.alert('エラー', 'ステータスの更新に失敗しました');
      console.error(error);
    } finally {
      setIsToggling(false);
    }
  };

  /**
   * @returns {void}
   */
  const handleDelete = async () => {
    Alert.alert(
      '求人の削除',
      'この求人票を削除してもよろしいですか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              // Deletion guard check
              const hasOngoing = await JobDescriptionService.hasOngoingSelections(job.companyId, job.id);
              if (hasOngoing) {
                Alert.alert(
                  '削除できません',
                  'この求人には進行中の選考があるため削除できません。代わりに「非公開」に設定してください。'
                );
                return;
              }

              await JobDescriptionService.deleteJobDescription(job.companyId, job.id);
              if (onDeleteSuccess) onDeleteSuccess(job.id);
            } catch (error) {
              Alert.alert('エラー', '削除に失敗しました');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.jdNumber}>JD No: {job.id}</Text>
          <Text style={styles.title}>{job.positionName || 'タイトル未設定'}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
            {isActive ? '公開中' : '非公開'}
          </Text>
          <Switch
            value={isActive}
            onValueChange={handleToggleStatus}
            disabled={isToggling}
            trackColor={{ false: THEME.borderDefault, true: THEME.primary }}
            thumbColor={THEME.textInverse}
            ios_backgroundColor={THEME.borderDefault}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name={IONICON_NAME.EDIT} size={18} color={THEME.primary} />
          <Text style={styles.actionText}>編集</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
          <Ionicons name={IONICON_NAME.DELETE} size={18} color={THEME.error} />
          <Text style={[styles.actionText, { color: THEME.error }]}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.surface,
    ...THEME.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jdNumber: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.textPrimary,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activeText: {
    color: THEME.primary,
  },
  inactiveText: {
    color: THEME.textMuted,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: THEME.borderDefault,
    paddingTop: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: THEME.primary,
  },
  deleteButton: {
    // Opacity handled via color
  }
});
