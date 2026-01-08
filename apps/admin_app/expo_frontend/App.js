import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import DashboardScreen from './src/features/dashboard/DashboardScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <DashboardScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
});
