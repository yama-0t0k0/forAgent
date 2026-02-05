import React, { useState, useMemo, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// 共有プロファイルスクリーンを使用（クロスアプリ依存を避ける）
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
import { IndividualMenuScreen } from '@shared/src/features/profile/IndividualMenuScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
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
    addListener: () => () => {},
    removeListener: () => {},
    setOptions: () => {},
    dispatch: () => {},
    isFocused: () => true,
  }), [stack]);

  const currentRoute = stack[stack.length - 1];

  if (!currentRoute) return null;

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
        return <IndividualMenuScreen {...props} />;
      case 'ImageEdit':
        return <IndividualImageEditScreen {...props} />;
      case 'JobDescription':
        return <JobDescriptionScreen {...props} />;
      case 'Registration':
        return (
          <GenericRegistrationScreen
            {...props}
            title='エンジニア個人登録'
            collectionName='individual'
            idField='id_individual'
            idPrefixChar='C'
            orderTemplate={ENGINEER_TEMPLATE}
          />
        );
      default:
        return <View><Text>Unknown Screen: {currentRoute.name}</Text></View>;
    }
  };

  return (
    <NavigationContext.Provider value={navigation}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {renderScreen()}
      </GestureHandlerRootView>
    </NavigationContext.Provider>
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
export const UserDetailModal = ({ visible, onClose, loading, error, userDoc, userId }) => (
  <DetailModal
    visible={visible}
    onClose={onClose}
    title='個人詳細'
    loading={loading}
    error={error}
  >
    {userDoc && (
      <View style={{ flex: 1 }}>
        <UserDetailContent userId={userId} userDoc={userDoc} />
      </View>
    )}
  </DetailModal>
);
