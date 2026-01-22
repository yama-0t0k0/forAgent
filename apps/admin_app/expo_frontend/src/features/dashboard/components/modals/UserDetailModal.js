import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const ModalStack = createNativeStackNavigator();
const ENGINEER_TEMPLATE = require('../../../../../assets/json/engineer-profile-template.json');

const ModalNavigator = ({ userId, userDoc }) => {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <ModalStack.Navigator initialRouteName="MyPage" screenOptions={{ headerShown: false }}>
          <ModalStack.Screen
            name="MyPage"
            component={IndividualProfileScreen}
            initialParams={{ userId, userDoc, hideSafeArea: true }}
          />
          <ModalStack.Screen name="Connection" component={ConnectionScreen} />
          <ModalStack.Screen name="Career" component={CareerScreen} />
          <ModalStack.Screen name="Menu" component={IndividualMenuScreen} />
          <ModalStack.Screen name="ImageEdit" component={IndividualImageEditScreen} />
          <ModalStack.Screen name="JobDescription" component={JobDescriptionScreen} />
          <ModalStack.Screen name="Registration">
            {(props) => (
              <GenericRegistrationScreen
                {...props}
                title="エンジニア個人登録"
                collectionName="individual"
                idField="id_individual"
                idPrefixChar="C"
                orderTemplate={ENGINEER_TEMPLATE}
              />
            )}
          </ModalStack.Screen>
        </ModalStack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
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
            <ModalNavigator userId={userId} userDoc={userDoc} />
          </View>
        )}
      </View>
    </View>
  </Modal>
);
