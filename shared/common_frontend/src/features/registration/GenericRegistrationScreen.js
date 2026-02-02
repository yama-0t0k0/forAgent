import React, { useContext, useMemo, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, Platform, UIManager, SafeAreaView } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// import { NavigationContainer } from '@react-navigation/native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { RecursiveField } from '@shared/src/core/components/RecursiveField';
import { THEME } from '@shared/src/core/theme/theme';
import { db } from '@shared/src/core/firebaseConfig';
import { collection, query, where, getDocs, setDoc, doc, documentId } from 'firebase/firestore';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomNav } from '@shared/src/core/components/BottomNav';
import { PLATFORM, DATA_TYPE, SAVE_STATUS, FIELD_NAMES, ID_CONSTANTS } from '@shared/src/core/constants';

const Tab = createMaterialTopTabNavigator();

if (Platform.OS === PLATFORM.ANDROID && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * @typedef {Object} CategoryScreenProps
 * @property {Object} route - Route object
 * @property {Object} route.params - Route parameters
 * @property {string} route.params.rootKey - Root key for data
 * @property {Object} [route.params.orderTemplateRoot] - Order template
 */

/**
 * Category Screen for Tab Navigator
 * @param {CategoryScreenProps} props
 * @param {Object} props.route - Route object
 */
const CategoryScreen = ({ route }) => {
  const { rootKey, orderTemplateRoot } = route.params;
  const { data } = useContext(DataContext);
  const rootData = data[rootKey];

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <RecursiveField data={rootData} depth={0} path={[rootKey]} orderTemplate={orderTemplateRoot} />
      </ScrollView>
    </View>
  );
};

/**
 * @typedef {Object} GenericRegistrationScreenProps
 * @property {string} collectionName - Firestore collection name
 * @property {string} idField - Field name for ID
 * @property {string} [title] - Screen title
 * @property {string} [idPrefixChar='C'] - ID prefix character
 * @property {string} [homeRouteName='MyPage'] - Route to navigate after save
 * @property {Object} [orderTemplate] - Template for field ordering
 * @property {React.ComponentType} [BottomNavComponent] - Component to render for bottom navigation
 */

/**
 * Generic Registration Screen
 * Handles multi-tab registration forms with Firestore saving.
 * 
 * @param {GenericRegistrationScreenProps} props
 */
/**
 * Removes internal fields (starting with '_') from data recursively.
 * @param {any} input - Data to clean
 * @returns {any} Cleaned data
 */
const cleanData = (input) => {
  if (input === null || typeof input !== DATA_TYPE.OBJECT) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(cleanData);
  }
  const output = {};
  Object.keys(input).forEach(key => {
    if (!key.startsWith('_')) {
      output[key] = cleanData(input[key]);
    }
  });
  return output;
};

/**
 * Helper to sort keys based on template.
 * @param {Object} data - Source data
 * @param {string} idField - ID field name to exclude
 * @param {Object} [orderTemplate] - Template defining order
 * @returns {string[]} Sorted keys
 */
const getSortedKeys = (data, idField, orderTemplate) => {
  if (!data) return [];
  /** @type {string[]} */
  const dataKeys = Object.keys(data).filter(key => key !== idField && key !== FIELD_NAMES.DISPLAY_TYPE);
  if (!orderTemplate || typeof orderTemplate !== DATA_TYPE.OBJECT) return dataKeys;
  
  /** @type {string[]} */
  const tplKeys = Object.keys(orderTemplate).filter(key => key !== idField && key !== FIELD_NAMES.DISPLAY_TYPE);
  /** @type {string[]} */
  const inTpl = dataKeys.filter(k => tplKeys.includes(k)).sort((a, b) => tplKeys.indexOf(a) - tplKeys.indexOf(b));
  /** @type {string[]} */
  const notInTpl = dataKeys.filter(k => !tplKeys.includes(k));
  
  return [...inTpl, ...notInTpl];
};

/**
 * Generic Registration Screen
 * Handles multi-tab registration forms with Firestore saving.
 * 
 * @param {GenericRegistrationScreenProps} props
 */
export const GenericRegistrationScreen = ({
  collectionName,
  idField,
  title = "Registration",
  idPrefixChar = 'C',
  homeRouteName = 'MyPage',
  orderTemplate,
  BottomNavComponent = BottomNav
}) => {
  const { data, updateValue } = useContext(DataContext);
  const navigation = useNavigation();
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);

  /**
   * Handles the save operation to Firestore.
   * Generates a new ID and saves the cleaned data.
   */
  const handleSave = async () => {
    setSaveStatus(SAVE_STATUS.SAVING);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const datePrefix = `${idPrefixChar}${year}${month}${day}`;

      const q = query(
        collection(db, collectionName),
        where(documentId(), ">=", datePrefix + ID_CONSTANTS.SUFFIX_START),
        where(documentId(), "<=", datePrefix + ID_CONSTANTS.SUFFIX_END)
      );

      const querySnapshot = await getDocs(q);

      let maxNum = 0;
      querySnapshot.forEach((doc) => {
        const id = doc.id;
        const numPart = parseInt(id.slice(-4), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      });

      const nextNum = maxNum + 1;
      const newId = `${datePrefix}${String(nextNum).padStart(4, '0')}`;

      const cleanedData = cleanData(data);
      const dataToSave = { ...cleanedData, [idField]: newId };

      await setDoc(doc(db, collectionName, newId), dataToSave);

      updateValue([idField], newId);
      setSaveStatus(SAVE_STATUS.SUCCESS);

      // Auto-navigate back to home after success
      setTimeout(() => {
        setSaveStatus(SAVE_STATUS.IDLE);
        navigation.navigate(homeRouteName);
      }, 1500);
    } catch (error) {
      console.error("Error saving document: ", error);
      setSaveStatus(SAVE_STATUS.ERROR);
      setTimeout(() => setSaveStatus(SAVE_STATUS.IDLE), 3000);
    }
  };

  /**
   * Memoized top-level keys for rendering tabs.
   * @type {string[]}
   */
  const topLevelKeys = useMemo(() => {
    return getSortedKeys(data, idField, orderTemplate);
  }, [data, idField, orderTemplate]);

  /**
   * Navigates back to the home screen.
   */
  const handleGoHome = () => {
    navigation.navigate(homeRouteName);
  };

  return (
    <View style={{ flex: 1, backgroundColor: THEME.background }}>
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.appTitle}>{String(title || 'Registration')}</Text>
          <Text style={styles.appSubtitle}>
            ID: {String(data[idField] || 'New')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saveStatus === SAVE_STATUS.SUCCESS && styles.saveButtonSuccess, saveStatus === SAVE_STATUS.ERROR && styles.saveButtonError]}
          onPress={handleSave}
          disabled={saveStatus === SAVE_STATUS.SAVING}
        >
          {saveStatus === SAVE_STATUS.SAVING ? <ActivityIndicator size="small" color="#FFF" /> : (
            <Text style={styles.saveButtonText}>{saveStatus === SAVE_STATUS.SUCCESS ? 'Saved' : saveStatus === SAVE_STATUS.ERROR ? 'Error' : 'Save'}</Text>
          )}
        </TouchableOpacity>
      </View>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: THEME.background, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: THEME.cardBorder },
          tabBarLabelStyle: { color: THEME.text, fontWeight: '600', fontSize: 13, textTransform: 'none' },
          tabBarIndicatorStyle: { backgroundColor: THEME.accent, height: 3 },
          tabBarScrollEnabled: true,
          tabBarItemStyle: { width: 'auto', minWidth: 100, paddingHorizontal: 16 },
        }}
      >
        {topLevelKeys.map((key) => (
          <Tab.Screen
            key={key}
            name={key}
            component={CategoryScreen}
            initialParams={{ rootKey: key, orderTemplateRoot: orderTemplate ? orderTemplate[key] : null }}
          />
        ))}
      </Tab.Navigator>

      <BottomNavComponent navigation={navigation} activeTab="Registration" />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: THEME.background },
  scrollContent: { padding: 16, paddingBottom: 100 },
  appHeader: {
    padding: 16,
    paddingTop: Platform.OS === PLATFORM.IOS ? 40 : 16,
    backgroundColor: THEME.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  appTitle: { color: THEME.text, fontSize: 18, fontWeight: '800' },
  appSubtitle: { color: THEME.subText, fontSize: 12, marginTop: 2 },
  saveButton: { paddingVertical: 6, paddingHorizontal: 16, backgroundColor: THEME.accent, borderRadius: 20 },
  saveButtonSuccess: { backgroundColor: THEME.success },
  saveButtonError: { backgroundColor: '#EF4444' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
