import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
import { IndividualMenuScreen } from '@shared/src/features/profile/IndividualMenuScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
// Fix import path for JobDescriptionScreen using relative path to avoid alias issues
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { THEME } from '@shared/src/core/theme/theme';
import { styles } from '../../dashboardStyles';

const ENGINEER_TEMPLATE = require('../../../../../assets/json/engineer-profile-template.json');

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
    addListener: () => () => {},
    removeListener: () => {},
    setOptions: () => {},
    dispatch: () => {},
    isFocused: () => true,
  }), [stack]);

  const currentRoute = stack[stack.length - 1];

  if (!currentRoute) return null;

  const renderScreen = () => {
    const props = {
      route: currentRoute,
      navigation: navigation
    };

    switch (currentRoute.name) {
      case 'MyPage':
        return <IndividualProfileScreen {...props} userId={userId} userDoc={userDoc} hideSafeArea={true} />;
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
            title="エンジニア個人登録"
            collectionName="individual"
            idField="id_individual"
            idPrefixChar="C"
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

export const UserDetailModal = ({ visible, onClose, loading, error, userDoc, userId }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.detailOverlay} pointerEvents="box-none">
      <View style={styles.detailWindow} testID="user_detail_modal_view" pointerEvents="auto">
        <View style={styles.detailWindowHeader}>
          <View style={{ flex: 1 }} />
          <Text style={styles.detailWindowTitle} testID="user_detail_title">個人詳細</Text>
          <TouchableOpacity onPress={onClose} style={styles.detailWindowClose} testID="user_detail_close">
            <Text style={styles.detailWindowCloseText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.detailWindowLoading} testID="user_detail_loading">
            <ActivityIndicator size="large" color={THEME.accent} testID="loading_indicator" />
            <Text style={styles.detailWindowLoadingText}>読み込み中...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.detailWindowLoading} testID="user_detail_error_view">
            <Text style={styles.detailWindowErrorText} testID="user_detail_error_text">{error}</Text>
          </View>
        )}

        {!loading && !error && userDoc && (
          <View style={{ flex: 1 }}>
            <UserDetailContent userId={userId} userDoc={userDoc} />
          </View>
        )}
      </View>
    </View>
  </Modal>
);
