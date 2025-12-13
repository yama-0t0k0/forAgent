
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
  ActivityIndicator,
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
  // Load data from file directly via require, and deep copy to ensure no reference issues
  const [data, setData] = useState(JSON.parse(JSON.stringify(require('./assets/json/engineer-profile-template.json'))));

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

const SKILL_LEVELS = {
  0: "経験なし",
  1: "実務経験は無いが個人活動で経験あり",
  2: "実務で基礎的なタスクを遂行可能",
  3: "実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる",
  4: "専門的な知識やスキルを有し他者を育成/指導できる"
};
const SKILL_LEVEL_TEXTS = Object.values(SKILL_LEVELS);

const SkillSelector = ({ value, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  // Determine current level from the value object { "LevelText": true }
  let currentLevel = 0; // Default to 0
  if (value && typeof value === 'object') {
    // Check keys, ignoring metadata like '_displayType'
    const entry = Object.entries(value).find(([key, val]) =>
      key !== '_displayType' && val === true && SKILL_LEVEL_TEXTS.includes(key)
    );
    if (entry) {
      const levelNum = Object.keys(SKILL_LEVELS).find(num => SKILL_LEVELS[num] === entry[0]);
      if (levelNum !== undefined) currentLevel = parseInt(levelNum, 10);
    }
  }

  const handleSelect = (level) => {
    const text = SKILL_LEVELS[level];
    // Create new object with selected level set to true, preserving metadata
    const newValue = { [text]: true };
    // Preserve _displayType if it exists
    if (value && value._displayType) {
      newValue._displayType = value._displayType;
    }
    updateValue(path, newValue);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        {[0, 1, 2, 3, 4].map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => handleSelect(level)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: currentLevel === level ? THEME.accent : '#E2E8F0',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: currentLevel === level ? '#FFF' : THEME.text, fontWeight: 'bold' }}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ backgroundColor: THEME.inputBg, padding: 8, borderRadius: 6 }}>
        <Text style={{ color: THEME.text, fontSize: 12 }}>{SKILL_LEVELS[currentLevel]}</Text>
      </View>
    </View>
  );
};

// Component for exclusive selection (Single Select Group)
const SingleSelectGroup = ({ value, path }) => {
  const { data, updateValue } = useContext(DataContext);

  const handleToggle = (key) => {
    // Check if we are inside '現職種' to apply specific exclusive logic
    const rootKeyIndex = path.indexOf('現職種');

    if (rootKeyIndex !== -1) {
      // Scope update to the '現職種' root
      const rootPath = path.slice(0, rootKeyIndex + 1);

      const getAt = (obj, p) => p.reduce((o, k) => (o && o[k] ? o[k] : null), obj);
      const rootData = getAt(data, rootPath);

      if (!rootData) {
        console.warn('Root data not found for path:', rootPath);
        return;
      }

      // Deep copy the root data
      const newRootData = JSON.parse(JSON.stringify(rootData));

      const currentTargetVal = !!value[key];
      const nextVal = !currentTargetVal;

      if (nextVal) {
        // --- Toggling ON ---

        // 1. Identify the target job object within newRootData
        // The path coming in is absolute. rootPath is ['現職種'].
        // relativePath is ['技術職', 'サーバサイドエンジニア'] etc.
        const relativePath = path.slice(rootKeyIndex + 1);
        let targetJobObj = newRootData;
        for (const p of relativePath) {
          targetJobObj = targetJobObj[p];
        }

        if (targetJobObj) {
          // 2. Local Reset: Turn off ALL booleans in this job object first
          Object.keys(targetJobObj).forEach(k => {
            if (typeof targetJobObj[k] === 'boolean') {
              targetJobObj[k] = false;
            }
          });

          // 3. Global Reset: Turn off the SAME key (e.g., 'sub1') in ALL other jobs (entire '現職種' tree)
          const resetKeyGlobal = (obj, targetKey) => {
            // If this obj is a job object (has metadata or specific structure), we scan it
            // We just recursively scan everything.
            if (obj && typeof obj === 'object') {
              Object.keys(obj).forEach(k => {
                if (k === targetKey && typeof obj[k] === 'boolean') {
                  obj[k] = false;
                } else {
                  resetKeyGlobal(obj[k], targetKey);
                }
              });
            }
          };
          resetKeyGlobal(newRootData, key);

          // 4. Set the target to true
          // Note: resetKeyGlobal set targetJobObj[key] to false as well, which is fine
          // because we set it to true now.
          targetJobObj[key] = true;
        }

      } else {
        // --- Toggling OFF ---
        // Just turn it off in the target job object
        const relativePath = path.slice(rootKeyIndex + 1);
        let targetJobObj = newRootData;
        for (const p of relativePath) {
          targetJobObj = targetJobObj[p];
        }
        if (targetJobObj) {
          targetJobObj[key] = false;
        }
      }

      updateValue(rootPath, newRootData);

    } else {
      // Fallback for local exclusive group behavior (radio button style)
      const newObject = { ...value };
      const currentVal = !!newObject[key];
      const nextVal = !currentVal;

      if (nextVal) {
        Object.keys(newObject).forEach(k => {
          if (k !== '_displayType' && typeof newObject[k] === 'boolean') {
            newObject[k] = (k === key);
          }
        });
      } else {
        newObject[key] = false;
      }
      updateValue(path, newObject);
    }
  };

  return (
    <View>
      {Object.keys(value).map(key => {
        if (key === '_displayType') return null;
        // Only render boolean fields as switches
        if (typeof value[key] !== 'boolean') return null;

        return (
          <View key={key} style={styles.switchContainer}>
            <Text style={styles.label}>{key}</Text>
            <Switch
              trackColor={{ false: THEME.cardBorder, true: THEME.accent }}
              thumbColor={'#FFFFFF'}
              onValueChange={() => handleToggle(key)}
              value={!!value[key]}
            />
          </View>
        );
      })}
    </View>
  );
};

const AccordionItem = ({ label, data, depth, path }) => {
  // Determine initial expanded state:
  // Depth 0 (Root items like "スキル経験", "志向"): Open by default
  // Depth > 0 (Nested items like "OS", "Webサーバー"): Closed by default
  const [expanded, setExpanded] = useState(depth === 0);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const isEmpty = Object.keys(data).length === 0;

  return (
    <View style={[styles.card, { marginLeft: depth * 8, borderColor: depth === 0 ? THEME.accent : THEME.cardBorder }]}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7} style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.indicator, { backgroundColor: depth === 0 ? THEME.accent : THEME.secondaryAccent }]} />
          <Text style={styles.sectionTitle}>{label}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.content}>
          {isEmpty ? <Text style={styles.emptyText}>(No Data)</Text> : <RecursiveField data={data} depth={depth + 1} path={path} />}
        </View>
      )}
    </View>
  );
};

const RecursiveField = ({ data, depth = 0, path = [] }) => {
  if (!data || typeof data !== 'object') return null;

  return (
    <View style={{ width: '100%' }}>
      {Object.keys(data).map((key) => {
        // Skip metadata keys in the loop
        if (key === '_displayType') return null;

        const value = data[key];
        const currentPath = [...path, key];
        const isObject = value !== null && typeof value === 'object';
        const isBool = typeof value === 'boolean';

        // Check if 'value' is a skill level object or single select group
        let isSkillLevelObj = false;
        let isSingleSelectGroup = false;

        if (isObject) {
          // Priority check: explicit UI type
          if (value._displayType === 'skillLevelSelect') {
            isSkillLevelObj = true;
          } else if (value._displayType === 'singleSelectGroup') {
            isSingleSelectGroup = true;
          } else {
            // Fallback: Check structure if metadata is missing
            const valKeys = Object.keys(value).filter(k => k !== '_displayType');
            if (valKeys.length > 0 && valKeys.every(k => SKILL_LEVEL_TEXTS.includes(k))) {
              isSkillLevelObj = true;
            }
          }
        }

        if (isSkillLevelObj) {
          return (
            <View key={key} style={{ marginLeft: depth * 12, marginBottom: 12 }}>
              <Text style={styles.label}>{key}</Text>
              <SkillSelector value={value} path={currentPath} />
            </View>
          );
        }

        if (isSingleSelectGroup) {
          return (
            <View key={key} style={{ marginLeft: depth * 12, marginBottom: 12 }}>
              <Text style={styles.label}>{key}</Text>
              <SingleSelectGroup value={value} path={currentPath} />
            </View>
          );
        }

        if (isObject) {
          return (
            <AccordionItem
              key={key}
              label={key}
              data={value}
              depth={depth}
              path={currentPath}
            />
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

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'success' | 'error'

  const handleSave = async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');

    try {
      // 1. Generate new ID
      // Format: CyyyyMMddnnnn (e.g., C202512120001)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const datePrefix = `C${year}${month}${day}`;

      // Query solely by ID prefix is hard in Firestore without a specific field or range query. 
      // Instead, let's try to find the latest ID by sorting.
      // Since we can't easily regex-query, we will query for IDs >= datePrefix and < datePrefix + 1
      // However, document IDs are strings.
      // A simpler, robust way often used is to store a separate counter or just query recent docs.
      // Given the requirement and constraints, let's try to query the collection ordered by __name__ (doc ID)
      // This might require an index?

      // Let's optimize: Just blindly try to find if today's IDs exist.
      // Actually, we can just query for all docs starting with this prefix? Firestore doesn't support 'startsWith' natively easily.
      // We will use a range query on documentId().

      // Query for existing IDs of today
      // To avoid "Index Required" errors, we render a simple range query without sorting in Firestore.
      // We will calculate the max ID client-side.
      const q = query(
        collection(db, "individual"),
        where(documentId(), ">=", datePrefix + "0000"),
        where(documentId(), "<=", datePrefix + "9999")
      );

      const querySnapshot = await getDocs(q);

      let maxNum = 0;
      querySnapshot.forEach((doc) => {
        const id = doc.id;
        // Extract the number part (last 4 digits)
        const numPart = parseInt(id.slice(-4), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      });

      const nextNum = maxNum + 1;
      const newId = `${datePrefix}${String(nextNum).padStart(4, '0')}`;

      // 3. Prepare data for saving (clean up metadata)
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
      const dataToSave = { ...cleanedData, id_individual: newId };

      // 4. Save to Firestore
      await setDoc(doc(db, "individual", newId), dataToSave);

      // 5. Update UI state
      // Use the context helper to update the ID
      updateValue(['id_individual'], newId);

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Error saving document: ", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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
        <TouchableOpacity
          style={[
            styles.saveButton,
            saveStatus === 'success' && styles.saveButtonSuccess,
            saveStatus === 'error' && styles.saveButtonError
          ]}
          onPress={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : saveStatus === 'success' ? (
            <Text style={styles.saveButtonText}>完了</Text>
          ) : saveStatus === 'error' ? (
            <Text style={styles.saveButtonText}>エラー</Text>
          ) : (
            <Text style={styles.saveButtonText}>保存</Text>
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
  saveButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: THEME.accent, borderRadius: 6, borderWidth: 1, borderColor: THEME.accent },
  saveButtonSuccess: { backgroundColor: THEME.success, borderColor: THEME.success },
  saveButtonError: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
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

