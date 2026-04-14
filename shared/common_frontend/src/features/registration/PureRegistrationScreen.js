import React, { useContext, useMemo, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, UIManager } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { db } from '@shared/src/core/firebaseConfig';
import { collection, query, where, getDocs, setDoc, doc, documentId } from 'firebase/firestore';
import { PureRecursiveField } from './PureRecursiveField';

const Tab = createMaterialTopTabNavigator();
const SAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SUCCESS: 'success',
  ERROR: 'error',
};

const PLATFORM_ANDROID = 'android';
const TYPEOF_OBJECT = 'object';

if (Platform.OS === PLATFORM_ANDROID && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * A screen component that displays fields for a specific category.
 * @param {Object} props - The component props.
 * @param {Object} props.route - The route object containing navigation params.
 * @returns {JSX.Element} The category screen.
 */
const CategoryScreen = ({ route }) => {
  const { rootKey, paddingBottom = 40 } = route.params;
  const { data } = useContext(DataContext);
  const rootData = data[rootKey];

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom }]}>
        <PureRecursiveField data={rootData} depth={0} path={[rootKey]} />
      </ScrollView>
    </View>
  );
};

/**
 * A specialized registration screen that bypasses complex data processing.
 * @param {Object} props - The component props.
 * @param {string} props.collectionName - The Firestore collection name.
 * @param {string} props.idField - The field name for the document ID.
 * @param {string} props.title - The title to display on the screen.
 * @param {string} [props.idPrefixChar='C'] - The prefix character for generated IDs.
 * @param {boolean} [props.useSequentialId=false] - Whether to use sequential IDs.
 * @param {number} [props.idLength=5] - The length of the sequential ID numeric part.
 * @param {Function} [props.customSaveLogic] - Optional custom save logic.
 * @param {React.ComponentType} [props.BottomNavComponent] - Optional bottom navigation component.
 * @param {boolean} [props.showBottomNav=false] - Whether to show bottom navigation.
 * @param {string} [props.homeRouteName] - Route to navigate to after successful save.
 * @param {Object} [props.orderTemplate] - Optional template for field ordering.
 * @returns {JSX.Element} The registration screen.
 */
export const PureRegistrationScreen = ({
  collectionName,
  idField,
  title,
  idPrefixChar = 'C',
  useSequentialId = false,
  idLength = 5,
  customSaveLogic,
  BottomNavComponent,
  showBottomNav = false,
  homeRouteName,
  orderTemplate
}) => {
  const { data, updateValue } = useContext(DataContext);
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);
  const navigation = useNavigation();

  /**
   * Handles the save operation for the registration data.
   */
  const handleSave = async () => {
    setSaveStatus(SAVE_STATUS.SAVING);
    try {
      let finalId = data[idField];
      let newId = null;

      if (!finalId) {
        if (useSequentialId) {
          const q = query(
            collection(db, collectionName),
            where(documentId(), '>=', idPrefixChar),
            where(documentId(), '<', String.fromCharCode(idPrefixChar.charCodeAt(0) + 1))
          );

          const querySnapshot = await getDocs(q);
          let maxNum = 0;
          const idRegex = new RegExp(`^${idPrefixChar}(\\d{${idLength}})$`);

          querySnapshot.forEach((d) => {
            const id = d.id;
            const match = id.match(idRegex);
            if (match) {
              const numPart = parseInt(match[1], 10);
              if (numPart > maxNum) {
                maxNum = numPart;
              }
            }
          });

          const nextNum = maxNum + 1;
          newId = `${idPrefixChar}${String(nextNum).padStart(idLength, '0')}`;
          finalId = newId;
        } else {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const datePrefix = `${idPrefixChar}${year}${month}${day}`;

          const q = query(
            collection(db, collectionName),
            where(documentId(), '>=', datePrefix + '0000'),
            where(documentId(), '<', datePrefix + '9999')
          );

          const querySnapshot = await getDocs(q);

          let maxNum = 0;
          querySnapshot.forEach((d) => {
            const id = d.id;
            const numPart = parseInt(id.slice(-4), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
              maxNum = numPart;
            }
          });

          const nextNum = maxNum + 1;
          newId = `${datePrefix}${String(nextNum).padStart(4, '0')}`;
          finalId = newId;
        }
        updateValue([idField], finalId);
      }

      /**
       * @param {unknown} input
       * @returns {unknown}
       */
      const cleanData = (input) => {
        if (input === null || typeof input !== TYPEOF_OBJECT) {
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

      const cleanedData = cleanData(data);
      const dataToSave = { ...cleanedData, [idField]: finalId };

      if (customSaveLogic) {
        await customSaveLogic(db, finalId, dataToSave);
      } else {
        await setDoc(doc(db, collectionName, finalId), dataToSave);
      }

      setSaveStatus(SAVE_STATUS.SUCCESS);
      setTimeout(() => {
        if (homeRouteName) {
          navigation.navigate(homeRouteName);
        } else {
          navigation.goBack();
        }
      }, 1500);
    } catch (e) {
      console.error('Error saving document: ', e);
      setSaveStatus(SAVE_STATUS.ERROR);
      setTimeout(() => setSaveStatus(SAVE_STATUS.IDLE), 3000);
    }
  };

  const topLevelKeys = useMemo(() => {
    if (!data) return [];
    const internalKeys = [idField, '_displayType'];
    const dataKeys = Object.keys(data).filter(key => !internalKeys.includes(key));

    if (!orderTemplate || typeof orderTemplate !== TYPEOF_OBJECT) return dataKeys;

    const tplKeys = Object.keys(orderTemplate).filter(key => !internalKeys.includes(key));
    const inTpl = dataKeys.filter(k => tplKeys.includes(k)).sort((a, b) => tplKeys.indexOf(a) - tplKeys.indexOf(b));
    const notInTpl = dataKeys.filter(k => !tplKeys.includes(k));

    return [...inTpl, ...notInTpl];
  }, [data, idField, orderTemplate]);

  return (
    <View style={styles.container}>
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.appTitle}>{title}</Text>
          <Text style={styles.appSubtitle}>
            ID: {data[idField] || 'New'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saveStatus === SAVE_STATUS.SUCCESS && styles.saveButtonSuccess, saveStatus === SAVE_STATUS.ERROR && styles.saveButtonError]}
          onPress={handleSave}
          disabled={saveStatus === SAVE_STATUS.SAVING}
        >
          {saveStatus === SAVE_STATUS.SAVING ? <ActivityIndicator size='small' color={THEME.textInverse} /> : (
            <Text style={styles.saveButtonText}>{saveStatus === SAVE_STATUS.SUCCESS ? 'Saved' : saveStatus === SAVE_STATUS.ERROR ? 'Error' : 'Save'}</Text>
          )}
        </TouchableOpacity>
      </View>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: THEME.background, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: THEME.borderDefault },
          tabBarLabelStyle: { color: THEME.textPrimary, fontWeight: '600', fontSize: 13, textTransform: 'none' },
          tabBarIndicatorStyle: { backgroundColor: THEME.primary, height: 3 },
          tabBarScrollEnabled: true,
          tabBarItemStyle: { width: 'auto', minWidth: 100, paddingHorizontal: 16 },
        }}
      >
        {topLevelKeys.map((key) => (
          <Tab.Screen
            key={key}
            name={key}
            component={CategoryScreen}
            initialParams={{
              rootKey: key,
              paddingBottom: showBottomNav ? 120 : 40
            }}
          />
        ))}
      </Tab.Navigator>
      {showBottomNav && BottomNavComponent && (
        <BottomNavComponent navigation={navigation} activeTab='Registration' />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenContainer: { flex: 1, backgroundColor: THEME.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  appHeader: {
    padding: 16,
    backgroundColor: THEME.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  appTitle: { color: THEME.textPrimary, fontSize: 18, fontWeight: '800' },
  appSubtitle: { color: THEME.textSecondary, fontSize: 12, marginTop: 2 },
  saveButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: THEME.primary, borderRadius: 6 },
  saveButtonSuccess: { backgroundColor: THEME.success },
  saveButtonError: { backgroundColor: THEME.error },
  saveButtonText: { color: THEME.textInverse, fontWeight: '700', fontSize: 14 },
});
