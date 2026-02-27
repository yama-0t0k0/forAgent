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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
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
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'
  const navigation = useNavigation();

  /**
   * Handles the save operation for the registration data.
   */
  const handleSave = async () => {
    setSaveStatus('saving');
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

      const cleanData = (input) => {
        if (input === null || typeof input !== 'object') {
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

      setSaveStatus('success');
      setTimeout(() => {
        if (homeRouteName) {
          navigation.navigate(homeRouteName);
        } else {
          navigation.goBack();
        }
      }, 1500);
    } catch (e) {
      console.error('Error saving document: ', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const topLevelKeys = useMemo(() => {
    if (!data) return [];
    const internalKeys = [idField, '_displayType'];
    const dataKeys = Object.keys(data).filter(key => !internalKeys.includes(key));

    if (!orderTemplate || typeof orderTemplate !== 'object') return dataKeys;

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
          style={[styles.saveButton, saveStatus === 'success' && styles.saveButtonSuccess, saveStatus === 'error' && styles.saveButtonError]}
          onPress={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? <ActivityIndicator size='small' color='#FFF' /> : (
            <Text style={styles.saveButtonText}>{saveStatus === 'success' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}</Text>
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
    borderBottomColor: THEME.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  appTitle: { color: THEME.text, fontSize: 18, fontWeight: '800' },
  appSubtitle: { color: THEME.subText, fontSize: 12, marginTop: 2 },
  saveButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: THEME.accent, borderRadius: 6 },
  saveButtonSuccess: { backgroundColor: THEME.success },
  saveButtonError: { backgroundColor: '#EF4444' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
