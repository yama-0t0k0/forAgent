import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Clipboard, Modal } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { styles } from '@features/dashboard/dashboardStyles';
import registrationService from '@shared/src/features/registration/services/registrationService';

const SEARCH_RESULT = {
  FOUND: 'found',
  NOT_FOUND: 'not_found',
};
const INVITATION_TYPE = {
  CORPORATE: 'corporate',
};

/**
 * Modal for issuing corporate invitations or directly granting permissions.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {Function} props.onClose
 * @returns {React.JSX.Element}
 */
export const IssueInvitationModal = ({ visible, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [foundUser, setFoundUser] = useState(null);
  const [issuedCode, setIssuedCode] = useState(null);

  /**
   * @returns {void}
   */
  const resetState = () => {
    setEmail('');
    setSearchResult(null);
    setFoundUser(null);
    setIssuedCode(null);
    setLoading(false);
  };

  /**
   * @returns {void}
   */
  const handleClose = () => {
    resetState();
    onClose();
  };

  /**
   * @returns {Promise<void>}
   */
  const handleSearch = async () => {
    if (!email || !registrationService.VALIDATION_RULES.email.test(email)) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください。');
      return;
    }

    setLoading(true);
    try {
      const result = await registrationService.searchUserByEmail(email);
      if (result.found) {
        setSearchResult(SEARCH_RESULT.FOUND);
        setFoundUser(result);
      } else {
        setSearchResult(SEARCH_RESULT.NOT_FOUND);
      }
    } catch (error) {
      Alert.alert('エラー', '検索に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  /**
   * @returns {Promise<void>}
   */
  const handleGrantPermission = async () => {
    if (!foundUser) return;
    setLoading(true);
    try {
      await registrationService.grantCorporatePermission(foundUser.uid);
      Alert.alert('成功', '法人登録権限を直接付与しました。ユーザーに通知が送信されます。');
      handleClose();
    } catch (error) {
      Alert.alert('エラー', '権限付与に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  /**
   * @returns {Promise<void>}
   */
  const handleIssueCode = async () => {
    setLoading(true);
    try {
      const result = await registrationService.createInvitationCode(INVITATION_TYPE.CORPORATE);
      setIssuedCode(result.code);
    } catch (error) {
      Alert.alert('エラー', '招待コードの発行に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {string} text
   * @returns {void}
   */
  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert('コピー完了', '招待コードをクリップボードにコピーしました。');
  };

  return (
    <Modal visible={visible} animationType='slide' transparent onRequestClose={handleClose}>
      <View style={styles.detailOverlay}>
        <View style={[styles.detailWindow, { height: 450 }]}>
          <View style={styles.detailWindowHeader}>
            <Text style={styles.detailWindowTitle}>法人招待・権限管理</Text>
            <TouchableOpacity onPress={handleClose} style={styles.detailWindowClose}>
              <Text style={styles.detailWindowCloseText}>閉じる</Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20 }}>
            {issuedCode ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 16, color: THEME.textSecondary, marginBottom: 10 }}>発行された招待コード:</Text>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: THEME.primary, letterSpacing: 4, marginBottom: 20 }}>
                  {issuedCode}
                </Text>
                <TouchableOpacity 
                   onPress={() => copyToClipboard(issuedCode)}
                   style={{ backgroundColor: THEME.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }}
                >
                  <Text style={{ color: THEME.textInverse, fontWeight: 'bold' }}>コードをコピーする</Text>
                </TouchableOpacity>
                <Text style={{ marginTop: 20, fontSize: 12, color: THEME.textMuted, textAlign: 'center' }}>
                  このコードをコピーして、対象の担当者へ送付してください。
                </Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: THEME.textPrimary, marginBottom: 8 }}>
                  招待先ユーザーのメールアドレス
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                  <TextInput
                    style={[styles.searchInput, { flex: 1, marginBottom: 0 }]}
                    placeholder='email@example.com'
                    value={email}
                    onChangeText={setEmail}
                    keyboardType='email-address'
                    autoCapitalize='none'
                  />
                  <TouchableOpacity 
                    onPress={handleSearch}
                    style={{ backgroundColor: THEME.primary, paddingHorizontal: 15, justifyContent: 'center', borderRadius: 12 }}
                  >
                    {loading ? <ActivityIndicator color={THEME.textInverse} /> : <Text style={{ color: THEME.textInverse, fontWeight: 'bold' }}>検索</Text>}
                  </TouchableOpacity>
                </View>

                {searchResult === SEARCH_RESULT.FOUND && (
                  <View style={{ backgroundColor: THEME.surfaceInfo, padding: 16, borderRadius: 12, marginBottom: 20 }}>
                    <Text style={{ color: THEME.primary, fontWeight: 'bold', marginBottom: 4 }}>
                      登録済みユーザーが見つかりました
                    </Text>
                    <Text style={{ fontSize: 12, color: THEME.textSecondary, marginBottom: 12 }}>
                      UID: {foundUser.uid}
                    </Text>
                    <TouchableOpacity 
                      onPress={handleGrantPermission}
                      style={{ backgroundColor: THEME.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                      disabled={loading}
                    >
                      <Text style={{ color: THEME.textInverse, fontWeight: 'bold' }}>直接、法人登録権限を付与する</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {searchResult === SEARCH_RESULT.NOT_FOUND && (
                  <View style={{ backgroundColor: THEME.surfaceNeutral, padding: 16, borderRadius: 12, marginBottom: 20 }}>
                    <Text style={{ color: THEME.textSecondary, fontWeight: 'bold', marginBottom: 4 }}>
                      未登録のユーザーです
                    </Text>
                    <Text style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>
                      招待コードを発行して、新規登録を案内してください。
                    </Text>
                    <TouchableOpacity 
                      onPress={handleIssueCode}
                      style={{ backgroundColor: THEME.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                      disabled={loading}
                    >
                      <Text style={{ color: THEME.textInverse, fontWeight: 'bold' }}>法人招待コードを発行する</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
