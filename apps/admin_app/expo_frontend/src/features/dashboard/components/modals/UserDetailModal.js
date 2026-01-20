import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
import { IndividualMenuScreen } from '@shared/src/features/profile/IndividualMenuScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
// Fix import path for JobDescriptionScreen using relative path to avoid alias issues
import { JobDescriptionScreen } from '../../../../../../../apps/job_description/expo_frontend/src/features/job_description/JobDescriptionScreen';
import { THEME } from '@shared/src/core/theme/theme';
import { styles } from '../../dashboardStyles';

const ModalStack = createNativeStackNavigator();
const ENGINEER_TEMPLATE = require('../../../../../assets/json/engineer-profile-template.json');

const ModalNavigator = ({ userId, userDoc }) => {
  return (
    <NavigationContainer independent={true}>
      <ModalStack.Navigator initialRouteName="MyPage" screenOptions={{ headerShown: false }}>
        <ModalStack.Screen 
          name="MyPage" 
          component={IndividualProfileScreen} 
          initialParams={{ userId, userDoc }} 
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
  );
};

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
            <ModalNavigator userId={userId} userDoc={userDoc} />
          </View>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);
