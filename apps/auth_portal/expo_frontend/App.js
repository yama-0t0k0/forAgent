import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@shared/src/core/firebaseConfig';
import { SignInScreen } from '@shared/src/features/auth/screens/SignInScreen';
import { SecondaryButton } from '@shared/src/core/components/SecondaryButton';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        console.log('✅ Auth Portal: User logged in:', user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaProvider style={styles.container}>
      {user ? (
        <View style={styles.successContainer}>
          <Text style={styles.title}>✨ ログイン成功</Text>
          <Text style={styles.subtitle}>Email: {user.email}</Text>
          <Text style={styles.subtitle}>UID: {user.uid}</Text>
          <Text style={styles.description}>
            認証状態が正常に検知されました。{"\n"}
            この画面は Auth Portal の検証用ダッシュボードです。
          </Text>

          <SecondaryButton
            title="ログアウトして戻る"
            onPress={handleLogout}
            style={styles.button}
          />
        </View>
      ) : (
        <SignInScreen />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F0FDFA', // Light teal
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D9488',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 40,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    maxWidth: 300,
  }
});
