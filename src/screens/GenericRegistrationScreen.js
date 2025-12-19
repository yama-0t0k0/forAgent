import React, { useContext, useMemo, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, Platform, UIManager } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// import { NavigationContainer } from '@react-navigation/native';
import { DataContext } from '../context/DataContext';
import { RecursiveField } from '../components/RecursiveField';
import { THEME } from '../constants/theme';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, setDoc, doc, documentId } from 'firebase/firestore';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CategoryScreen = ({ route }) => {
  const { rootKey } = route.params;
  const { data } = useContext(DataContext);
  const rootData = data[rootKey];

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <RecursiveField data={rootData} depth={0} path={[rootKey]} />
      </ScrollView>
    </View>
  );
};

export const GenericRegistrationScreen = ({ collectionName, idField, title, idPrefixChar = 'C' }) => {
  const { data, updateValue } = useContext(DataContext);
  const navigation = useNavigation();
  const [saveStatus, setSaveStatus] = useState('idle');

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const datePrefix = `${idPrefixChar}${year}${month}${day}`;

      const q = query(
        collection(db, collectionName),
        where(documentId(), ">=", datePrefix + "0000"),
        where(documentId(), "<=", datePrefix + "9999")
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
      const dataToSave = { ...cleanedData, [idField]: newId };

      await setDoc(doc(db, collectionName, newId), dataToSave);

      updateValue([idField], newId);
      setSaveStatus('success');

      // Auto-navigate back to MyPage after success
      setTimeout(() => {
        setSaveStatus('idle');
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error("Error saving document: ", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const topLevelKeys = useMemo(() => {
    if (!data) return [];
    return Object.keys(data).filter(key => key !== idField && key !== '_displayType');
  }, [data, idField]);

  const handleGoHome = () => {
    navigation.navigate('MyPage');
  };

  return (
    <View style={{ flex: 1, backgroundColor: THEME.background }}>
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
          {saveStatus === 'saving' ? <ActivityIndicator size="small" color="#FFF" /> : (
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
            initialParams={{ rootKey: key }}
          />
        ))}
      </Tab.Navigator>

      {/* Bottom Navigation (Replica of MyPageScreen) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-circle-outline" size={28} color={THEME.subText} />
          <Text style={styles.navText}>キャリア</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people-circle-outline" size={28} color={THEME.subText} />
          <Text style={styles.navText}>コネクション</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleGoHome}>
          <View style={styles.activeIconContainer}>
            <Ionicons name="home" size={26} color={THEME.background} />
          </View>
          <Text style={styles.navTextActive}>ホーム</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="book-outline" size={28} color={THEME.subText} />
          <Text style={styles.navText}>学習</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleGoHome}>
          <Ionicons name="grid-outline" size={28} color={THEME.accent} />
          <Text style={[styles.navText, { color: THEME.accent, fontWeight: '800' }]}>メニュー</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: THEME.background },
  scrollContent: { padding: 16, paddingBottom: 100 },
  appHeader: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 16,
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
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    height: 85,
    borderTopWidth: 1,
    borderTopColor: THEME.cardBorder,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeIconContainer: {
    width: 38,
    height: 38,
    backgroundColor: THEME.accent,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  navText: {
    color: THEME.subText,
    fontSize: 11,
    marginTop: 2,
  },
  navTextActive: {
    color: THEME.accent,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
});
