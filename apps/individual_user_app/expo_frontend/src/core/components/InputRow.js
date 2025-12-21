import React, { useContext } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { DataContext } from '../state/DataContext';
import { THEME } from '../theme/theme';

export const InputRow = ({ label, value, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { data, updateValue } = context;

  const isZipCode = label === '郵便番号';

  const handleTextChange = async (text) => {
    if (isZipCode) {
      // Allow only numbers
      const numericText = text.replace(/[^0-9]/g, '');
      updateValue(path, numericText);

      // Verify length for Japanese Zip Code
      if (numericText.length === 7) {
        // Find '国' sibling
        const parentPath = path.slice(0, -1);
        const countryPath = [...parentPath, '国'];
        const getValue = (obj, p) => p.reduce((o, k) => (o && o[k] ? o[k] : undefined), obj);
        const country = getValue(data, countryPath);

        if (country === '日本') {
          try {
            const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${numericText}`);
            const json = await response.json();
            if (json.status === 200 && json.results) {
              const result = json.results[0];
              updateValue([...parentPath, '都道府県or州など'], result.address1);
              updateValue([...parentPath, '市区町村'], result.address2);
              updateValue([...parentPath, '番地'], result.address3);
            } else {
              Alert.alert('検索エラー', '該当する郵便番号が見つかりませんでした。');
            }
          } catch (e) {
            console.error(e);
            Alert.alert('通信エラー', '住所情報の取得に失敗しました。');
          }
        }
      }
    } else {
      updateValue(path, text);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={String(value)}
        onChangeText={handleTextChange}
        placeholderTextColor={THEME.subText}
        keyboardType={isZipCode ? 'numeric' : 'default'}
        maxLength={isZipCode ? 7 : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: THEME.subText,
    marginBottom: 6,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: THEME.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
