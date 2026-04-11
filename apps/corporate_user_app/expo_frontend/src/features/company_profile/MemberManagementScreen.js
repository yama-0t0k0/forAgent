import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '@shared/src/core/theme/theme';
import { DataContext } from '@shared/src/core/state/DataContext';
import { MemberService } from '@shared/src/features/company/services/memberService';
import { SuccessorPromptModal } from './SuccessorPromptModal';

/**
 * Screen for managing company members and their roles.
 * Supports promoting to Alpha, demoting to Beta/Gamma, and removal.
 */
export const MemberManagementScreen = () => {
  const navigation = useNavigation();
  const { data } = useContext(DataContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Successor Flow State
  const [isSuccessorModalVisible, setIsSuccessorModalVisible] = useState(false);
  const [successorLoading, setSuccessorLoading] = useState(false);

  const companyId = data?.companyId || 'B00000'; // Fallback for dev

  const fetchMembers = async () => {
    try {
      const results = await MemberService.getCompanyMembers(companyId);
      // Sort members: Alpha first, then Beta, then Gamma
      const sorted = results.sort((a, b) => {
        const order = { 'corporate-alpha': 1, 'corporate-beta': 2, 'corporate-gamma': 3 };
        return (order[a.role] || 99) - (order[b.role] || 99);
      });
      setMembers(sorted);
    } catch (error) {
      Alert.alert('エラー', 'メンバー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = (member) => {
    const options = [
      { text: 'α：採用管理者 (Alpha) に昇格', onPress: () => processUpdate(member, 'corporate-alpha') },
      { text: 'β：採用関係者 (Beta) に設定', onPress: () => processUpdate(member, 'corporate-beta') },
      { text: 'γ：一般社員 (Gamma) に設定', onPress: () => processUpdate(member, 'corporate-gamma') },
      { text: 'キャンセル', style: 'cancel' },
    ];

    if (member.role === 'corporate-alpha') {
      options.push({ 
        text: '会社から削除', 
        style: 'destructive', 
        onPress: () => processUpdate(member, null) 
      });
    }

    Alert.alert(
      '権限の変更',
      `${member.displayName || 'ユーザー'} さんの役割を変更しますか？`,
      options
    );
  };

  const processUpdate = async (member, newRole) => {
    setLoading(true);
    try {
      if (newRole === 'corporate-alpha') {
        await MemberService.promoteToAlpha(member.uid, companyId);
      } else if (member.role === 'corporate-alpha') {
        await MemberService.demoteOrRemoveAlpha(member.uid, companyId, newRole);
      } else {
        await MemberService.updateRole(member.uid, newRole);
      }
      Alert.alert('成功', '権限を更新しました');
      fetchMembers();
    } catch (error) {
      // Handle the "Last Alpha" protection error
      if (error.message.includes('last Alpha')) {
        setIsSuccessorModalVisible(true);
      } else {
        Alert.alert('エラー', error.message || '更新に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessorConfirm = async (successorUid) => {
    setSuccessorLoading(true);
    try {
      await MemberService.transferAlphaRole(data.uid, successorUid, companyId);
      setIsSuccessorModalVisible(false);
      Alert.alert('完了', '権限の委譲が完了しました。');
      fetchMembers();
    } catch (error) {
      Alert.alert('エラー', '委譲処理に失敗しました: ' + error.message);
    } finally {
      setSuccessorLoading(false);
    }
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 'corporate-alpha':
        return { label: 'α：採用管理者', color: THEME.warning, bg: THEME.surfaceWarning };
      case 'corporate-beta':
        return { label: 'β：採用関係者', color: THEME.primary, bg: THEME.primary + '10' };
      case 'corporate-gamma':
        return { label: 'γ：一般社員', color: THEME.textSecondary, bg: THEME.surfaceMuted };
      default:
        return { label: '未設定', color: THEME.textMuted, bg: THEME.surfaceMuted };
    }
  };

  const renderMemberItem = ({ item }) => {
    const roleInfo = getRoleInfo(item.role);
    const isSelf = item.uid === data?.uid;

    return (
      <TouchableOpacity 
        style={styles.memberCard} 
        onPress={() => !isSelf && handleRoleChange(item)}
        disabled={isSelf} // Self-demotion should follow successor logic carefully, handling in handleRoleChange
      >
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.displayName || 'No Name'}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
          <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
        </View>
        {!isSelf && (
          <Ionicons name='chevron-forward' size={20} color={THEME.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>メンバー管理</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size='large' color={THEME.primary} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.uid}
          renderItem={renderMemberItem}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            setRefreshing(true);
            fetchMembers();
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>メンバーがいません</Text>
            </View>
          }
        />
      )}

      <SuccessorPromptModal
        visible={isSuccessorModalVisible}
        members={members}
        currentUid={data?.uid}
        onClose={() => setIsSuccessorModalVisible(false)}
        onConfirm={handleSuccessorConfirm}
        loading={successorLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.app.corporate.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.textPrimary,
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: THEME.app.corporate.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: THEME.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textPrimary,
  },
  memberEmail: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginRight: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: THEME.textMuted,
  }
});
