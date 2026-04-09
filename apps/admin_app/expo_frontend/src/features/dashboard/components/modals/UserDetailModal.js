import React, { useState, useMemo, useEffect, useContext } from 'react';
import { View, Text } from 'react-native';
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
 * @param {Object} props
 * @param {string} props.userId - The user ID.
 * @param {Object} props.userDoc - The user document data.
 * @returns {JSX.Element|null} The rendered screen or null.
 */
const UserDetailContent = ({ userId, userDoc }) => {
  const [stack, setStack] = useState([]);

  useEffect(() => {
    setStack([{ name: 'MyPage', params: { userId, userDoc, hideSafeArea: true } }]);
  }, [userId, userDoc]);

  /**
   * Custom navigation object mimicking React Navigation.
   * @type {Object}
   */
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
   * Handles granting the corporate registration permission.
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
               // Refresh local user state if needed (or rely on next refresh)
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
   * Renders the administrative controls for the user.
   */
  const renderAdminControls = () => {
    // Only show if not already a corporate member and doesn't have the flag
    if (userDoc.isCorporateMember && userDoc.isCorporateMember()) return null;
    if (userDoc.canCreateCompany) return (
       <View style={{ padding: 15, backgroundColor: THEME.surfaceNeutral, borderBottomWidth: 1, borderBottomColor: THEME.borderDefault }}>
         <Text style={{ color: THEME.textSecondary, fontSize: 12 }}>※ このユーザーは既に法人登録権限を持っています</Text>
       </View>
    );

    return (
      <View style={{ padding: 15, backgroundColor: THEME.surface, borderBottomWidth: 1, borderBottomColor: THEME.borderDefault }}>
        <TouchableOpacity 
          style={{ backgroundColor: THEME.success, padding: 12, borderRadius: 8, alignItems: 'center' }}
          onPress={handleGrantPermission}
        >
          <Text style={{ color: THEME.textInverse, fontWeight: 'bold' }}>法人登録権限 (canCreateCompany) を付与する</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Custom save logic for Admin App to handle split data (public_profile + private_info).
   * @param {Object} db - Firestore instance
   * @param {string} id - Document ID
   * @param {Object} data - Full user data
   */
  const handleAdminUserSave = async (db, id, data) => {
    // 1. Split data
    const { publicData, privateData } = User.splitData(data);

    // 2. Save public profile
    await setDoc(doc(db, 'public_profile', id), publicData);

    // 3. Save private info (Admin has permission to write to private_info)
    // Use merge: true to preserve allowed_companies and other fields
    await setDoc(doc(db, 'private_info', id), privateData, { merge: true });
  };

  /**
   * Renders the current screen based on the stack state.
   * @returns {JSX.Element} The screen component.
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
            collectionName='public_profile' // Use public_profile for ID generation check
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
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {boolean} props.loading - Loading state.
 * @param {Object} props.error - Error object.
 * @param {Object} props.userDoc - The user document data.
 * @param {string} props.userId - The user ID.
 * @returns {JSX.Element} The rendered modal.
 */
export const UserDetailModal = ({ visible, onClose, loading, error, userDoc, userId }) => {
  // Access global Admin Data (contains all JDs, Users, etc.)
  const { data: adminData } = React.useContext(DataContext);

  // Merge the selected User Doc with the global lists required for matching features
  const enhancedUserDoc = useMemo(() => {
    if (!userDoc) return null;

    // Preserve the User model prototype methods (like isCorporateMember)
    // while attaching additional lists required for child components.
    const enhanced = Object.create(Object.getPrototypeOf(userDoc));
    Object.assign(enhanced, userDoc, {
      jd: adminData?.jd || [],
      users: adminData?.users || [],
      fmjs: adminData?.fmjs || []
    });

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
