import React, { useState, useMemo, useEffect, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DataProvider, DataContext } from '@shared/src/core/state/DataContext';
import { doc, setDoc } from 'firebase/firestore';
import { User } from '@shared/src/core/models/User';
// 共有プロファイルスクリーンを使用（クロスアプリ依存を避ける）
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
import { AppMenuScreen } from '@shared/src/features/profile/AppMenuScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
import { grantCorporatePermission } from '@shared/src/features/registration/services/registrationService';
import { THEME } from '@shared/src/core/theme/theme';
import { Alert, TouchableOpacity } from 'react-native';
// Fix import path for JobDescriptionScreen using relative path to avoid alias issues
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { DetailModal } from '@shared/src/core/components/DetailModal';

const ENGINEER_TEMPLATE = require('@assets/json/engineer-profile-template.json');

/**
 * Inner content component for UserDetailModal to manage internal navigation.
 * @param {string} userId
 * @param {Object} userDoc
 * @returns {JSX.Element|null}
 */
const UserDetailContent = ({ userId, userDoc }) => {
  const [stack, setStack] = useState([]);

  useEffect(() => {
    setStack([{ name: 'MyPage', params: { userId, userDoc, hideSafeArea: true } }]);
  }, [userId, userDoc]);

  const navigation = useMemo(() => ({
    navigate: (name, params) => {
      setStack(prev => [...prev, { name, params }]);
    },
    goBack: () => {
      setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    },
    canGoBack: () => stack.length > 1,
    getParent: () => null,
    addListener: () => () => { },
    removeListener: () => { },
    setOptions: () => { },
    dispatch: () => { },
    isFocused: () => true,
  }), [stack]);

  const currentRoute = stack[stack.length - 1];

  if (!currentRoute) return null;

  /**
   * @returns {Promise<void>}
   */
  const handleGrantPermission = async () => {
    try {
      Alert.alert('確認', 'このユーザーに法人アカウントの作成権限を付与しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '付与する', 
          onPress: async () => {
             const result = await grantCorporatePermission(userId);
             if (result.success) {
               Alert.alert('完了', '権限を付与しました。ユーザーに通知が送信されます。');
             }
          }
        }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '権限付与に失敗しました。');
    }
  };

  /**
   * @returns {JSX.Element|null}
   */
  const renderAdminControls = () => {
    if (userDoc.isCorporateMember && userDoc.isCorporateMember()) return null;
    if (userDoc.canCreateCompany) return (
       <View style={styles.adminBannerWarning}>
         <Text style={styles.adminBannerText}>※ このユーザーは既に法人登録権限を持っています</Text>
       </View>
    );

    return (
      <View style={styles.adminBannerAction}>
        <TouchableOpacity 
          style={styles.grantButton}
          onPress={handleGrantPermission}
        >
          <Text style={styles.grantButtonText}>法人登録権限 (canCreateCompany) を付与する</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * @param {import('firebase/firestore').Firestore} db
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<void>}
   */
  const handleAdminUserSave = async (db, id, data) => {
    const { publicData, privateData } = User.splitData(data);
    await setDoc(doc(db, 'public_profile', id), publicData);
    await setDoc(doc(db, 'private_info', id), privateData, { merge: true });
  };

  /**
   * @returns {JSX.Element}
   */
  const renderScreen = () => {
    const props = {
      route: currentRoute,
      navigation: navigation,
      hideSafeArea: true,
      showBottomNav: true
    };

    switch (currentRoute.name) {
      case 'MyPage':
        return <IndividualProfileScreen {...props} userId={userId} userDoc={userDoc} />;
      case 'Connection':
        return <ConnectionScreen {...props} />;
      case 'Career':
        return <CareerScreen {...props} />;
      case 'Menu':
        return <AppMenuScreen {...props} role='individual' />;
      case 'ImageEdit':
        return <IndividualImageEditScreen {...props} />;
      case 'JobDescription':
        return <JobDescriptionScreen {...props} />;
      case 'Registration':
        return (
          <GenericRegistrationScreen
            {...props}
            title='エンジニア個人登録'
            collectionName='public_profile'
            idField='id_individual'
            idPrefixChar='C'
            orderTemplate={ENGINEER_TEMPLATE}
            customSaveLogic={handleAdminUserSave}
          />
        );
      default:
        return <View><Text>Unknown Screen: {currentRoute.name}</Text></View>;
    }
  };

  return (
    <DataProvider initialData={userDoc}>
      <NavigationContext.Provider value={navigation}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {renderAdminControls()}
          {renderScreen()}
        </GestureHandlerRootView>
      </NavigationContext.Provider>
    </DataProvider>
  );
};

/**
 * Modal component for displaying detailed user information with internal navigation.
 * @param {boolean} visible
 * @param {function(): void} onClose
 * @param {boolean} loading
 * @param {string|Error|null} error
 * @param {Object|null} userDoc
 * @param {string} userId
 * @returns {JSX.Element}
 */
export const UserDetailModal = ({ visible, onClose, loading, error, userDoc, userId }) => {
  const { data: adminData } = React.useContext(DataContext);

  const enhancedUserDoc = useMemo(() => {
    if (!userDoc) return null;
    const enhanced = { 
      ...userDoc,
      jd: adminData?.jd || [],
      users: adminData?.users || [],
      fmjs: adminData?.fmjs || []
    };
    Object.setPrototypeOf(enhanced, Object.getPrototypeOf(userDoc));
    return enhanced;
  }, [userDoc, adminData]);

  return (
    <DetailModal
      visible={visible}
      onClose={onClose}
      title='個人詳細'
      loading={loading}
      error={error}
    >
      {enhancedUserDoc && (
        <View style={{ flex: 1 }}>
          <UserDetailContent userId={userId} userDoc={enhancedUserDoc} />
        </View>
      )}
    </DetailModal>
  );
};

const styles = StyleSheet.create({
  adminBannerWarning: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.surfaceNeutral,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
  },
  adminBannerText: {
    ...THEME.typography.small,
    color: THEME.textSecondary,
  },
  adminBannerAction: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
  },
  grantButton: {
    backgroundColor: THEME.success,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  grantButtonText: {
    color: THEME.textInverse,
    fontWeight: 'bold',
    ...THEME.typography.bodySmall,
  }
});
