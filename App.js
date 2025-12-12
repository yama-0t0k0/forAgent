
import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Firebase imports
import { db } from './firebaseConfig';
import { collection, query, where, orderBy, limit, getDocs, setDoc, doc, documentId } from 'firebase/firestore';

// --- Theme Colors (Light Mode) ---
const THEME = {
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#1E293B',
  subText: '#64748B',
  accent: '#0EA5E9',
  secondaryAccent: '#8B5CF6',
  inputBg: '#F1F5F9',
  success: '#10B981',
};

// --- Context ---
const DataContext = createContext(null);

const DataProvider = ({ children }) => {
  // Load data from file directly via require
  const [data, setData] = useState(require('./assets/json/service-account.json'));

  const updateValue = useCallback((path, newValue) => {
    setData((prevData) => {
      const newData = JSON.parse(JSON.stringify(prevData));
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = newValue;
      return newData;
    });
  }, []);

  return (
    <DataContext.Provider value={{ data, updateValue }}>
      {children}
    </DataContext.Provider>
  );
};

const Tab = createMaterialTopTabNavigator();

// --- Components ---

const InputRow = ({ label, value, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={String(value)}
        onChangeText={(text) => updateValue(path, text)}
        placeholderTextColor={THEME.subText}
      />
    </View>
  );
};

const SwitchRow = ({ label, value, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  return (
    <View style={styles.switchContainer}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        trackColor={{ false: '#CBD5E1', true: THEME.accent }}
        thumbColor={'#FFFFFF'}
        onValueChange={(newValue) => updateValue(path, newValue)}
        value={!!value}
      />
    </View>
  );
};

const RecursiveField = ({ data, depth = 0, path = [] }) => {
  const [expanded, setExpanded] = useState(depth < 1);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  if (!data || typeof data !== 'object') return null;

  return (
    <View style={{ width: '100%' }}>
      {Object.keys(data).map((key) => {
        const value = data[key];
        const currentPath = [...path, key];
        const isObject = value !== null && typeof value === 'object';
        const isBool = typeof value === 'boolean';

        if (isObject) {
          const isEmpty = Object.keys(value).length === 0;
          return (
            <View key={key} style={[styles.card, { marginLeft: depth * 8, borderColor: depth === 0 ? THEME.accent : THEME.cardBorder }]}>
              <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7} style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={[styles.indicator, { backgroundColor: depth === 0 ? THEME.accent : THEME.secondaryAccent }]} />
                  <Text style={styles.sectionTitle}>{key}</Text>
                </View>
                <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expanded && (
                <View style={styles.content}>
                  {isEmpty ? <Text style={styles.emptyText}>(No Data)</Text> : <RecursiveField data={value} depth={depth + 1} path={currentPath} />}
                </View>
              )}
            </View>
          );
        }

        if (isBool) {
          return (
            <View key={key} style={{ marginLeft: depth * 12 }}>
              <SwitchRow label={key} value={value} path={currentPath} />
            </View>
          );
        }

        return (
          <View key={key} style={{ marginLeft: depth * 12 }}>
            <InputRow label={key} value={value} path={currentPath} />
          </View>
        );
      })}
    </View>
  );
};

const CategoryScreen = ({ route }) => {
  const { rootKey } = route.params;
  const { data } = useContext(DataContext);
  const categoryData = data[rootKey];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <RecursiveField data={categoryData} depth={0} path={[rootKey]} />
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Main App Component
const DataConsumerApp = () => {
  const { data, updateValue } = useContext(DataContext);
  // Calculate tabs from data keys (follows JSON definition order)
  const topLevelKeys = Object.keys(data).filter(key => typeof data[key] === 'object');

  const handleSave = async () => {
    try {
      Alert.alert("保存中...", "データをクラウドに保存しています");
      const start = Date.now();

      // 1. Generate Prefix: CyyyyMMdd
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const prefix = `C${yyyy}${mm}${dd}`;

      // 2. Query for existing IDs of today
      // Note: We removed orderBy and limit to avoid needing a custom index in Firestore.
      // We will filter client-side.
      const q = query(
        collection(db, "individual"),
        where(documentId(), ">=", prefix + "0000"),
        where(documentId(), "<=", prefix + "9999")
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

      const newId = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;

      console.log(`Generate ID: ${newId}`);

      // 3. Update local data object with new ID (for saving)
      const dataToSave = { ...data, id_individual: newId };

      // 4. Save to Firestore
      await setDoc(doc(db, "individual", newId), dataToSave);

      // 5. Update UI state
      // Use the context helper to update the ID
      updateValue(['id_individual'], newId);

      Alert.alert("保存完了", `ID: ${newId}\nFirestoreへの保存が完了しました。`);

    } catch (e) {
      console.error(e);
      Alert.alert("エラー", "保存に失敗しました: " + e.message);
    }
  };

  return (
    <NavigationContainer>
      <View style={styles.appHeader}>
        <View style={{ width: 60 }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.appTitle}>エンジニア個人登録</Text>
          <Text style={styles.appSubtitle}>ID: {data.id_individual || 'New'}</Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>保存</Text>
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
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <DataProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
          <StatusBar barStyle="dark-content" />
          <DataConsumerApp />
        </SafeAreaView>
      </SafeAreaProvider>
    </DataProvider>
  );
}

const styles = StyleSheet.create({
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
  saveButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: THEME.inputBg, borderRadius: 6, borderWidth: 1, borderColor: THEME.cardBorder },
  saveButtonText: { color: THEME.accent, fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: THEME.cardBg, borderRadius: 12, borderWidth: 1, borderColor: THEME.cardBorder, marginBottom: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  indicator: { width: 4, height: 16, borderRadius: 2, marginRight: 12 },
  sectionTitle: { color: THEME.text, fontSize: 15, fontWeight: '700' },
  chevron: { color: THEME.subText, fontSize: 12 },
  content: { padding: 16, paddingTop: 4, borderTopWidth: 1, borderTopColor: THEME.cardBorder },
  emptyText: { color: THEME.subText, fontStyle: 'italic', padding: 8 },
  inputContainer: { marginBottom: 16 },
  label: { color: THEME.subText, fontSize: 11, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
  textInput: { backgroundColor: THEME.inputBg, borderRadius: 8, borderWidth: 1, borderColor: THEME.cardBorder, color: THEME.text, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.cardBg, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: THEME.cardBorder },
});
