import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

/**
 * LP Home Screen
 * - microCMSで管理されたコンテンツを表示するトップ画面
 * - ヒーローセクション、特徴紹介、コンテンツリストへの導線を配置
 */
/**
 * @typedef {Object} LpListItem
 * @property {string} id
 * @property {string} title
 * @property {string|null} thumbnailUrl
 * @property {boolean} isPremiumOnly
 * @property {string} [url]
 */

const FALLBACK_ITEMS = [
  {
    id: 'google-cloud-blog',
    title: 'Google Cloud ブログ | ニュース、機能、およびお知らせ',
    thumbnailUrl: null,
    isPremiumOnly: false,
    url: 'https://cloud.google.com/blog/ja',
  },
];

/**
 * @param {any} raw
 * @returns {Array<LpListItem>}
 */
export const extractLpListItems = (raw) => {
  const contents = Array.isArray(raw?.contents) ? raw.contents : [];

  return contents
    .filter((c) => c && typeof c.id === 'string')
    .map((c) => {
      const title = typeof c.title === 'string' ? c.title : '';
      const thumbnailUrl = typeof c?.thumbnail?.url === 'string' ? c.thumbnail.url : null;
      const isPremiumOnly = c?.is_premium_only === true;
      const isLocked = c?.is_locked === true;

      return { id: c.id, title, thumbnailUrl, isPremiumOnly, is_locked: isLocked };
    });
};

/**
 * @param {object} params
 * @returns {Promise<Array<LpListItem>>}
 */
export const fetchLpContents = async () => {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const region = 'asia-northeast1';

  // Use emulator if configured
  const emulatorHost = process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST;
  const baseUrl = emulatorHost
    ? `http://${emulatorHost.split(':')[0]}:5001/${projectId}/${region}`
    : `https://${region}-${projectId}.cloudfunctions.net`;

  const url = `${baseUrl}/getLpContent`;

  const headers = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if logged in
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  } catch (error) {
    console.warn('Auth check failed:', error);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return extractLpListItems(result);
};

const getFirebaseFunctions = () => {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const functions = getFunctions(app, 'asia-northeast1');

  const emulatorHost = typeof process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST === 'string'
    ? process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST.trim()
    : '';
  if (__DEV__ && emulatorHost.length > 0) {
    connectFunctionsEmulator(functions, emulatorHost, 5001);
  }

  return functions;
};

/**
 * @param {object} props
 * @param {any} props.navigation
 * @returns {React.JSX.Element}
 */
const HomeScreen = (props) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const functions = useMemo(() => getFirebaseFunctions(), []);

  useEffect(() => {
    console.log('HomeScreen mounted');
    let isCanceled = false;

    /**
     * @returns {Promise<void>}
     */
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const lpItems = await fetchLpContents();
        if (!isCanceled) {
          if (lpItems.length > 0) {
            setItems(lpItems);
          } else {
            setItems(FALLBACK_ITEMS);
          }
        }
      } catch (e) {
        if (!isCanceled) {
          console.warn('Failed to fetch LP contents, using fallback:', e);
          setError(null);
          setItems(FALLBACK_ITEMS);
        }
      } finally {
        if (!isCanceled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isCanceled = true;
    };
  }, [functions]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header / Nav */}
        <View style={styles.header} testID="header-container" onLayout={(e) => console.log('Header layout:', e.nativeEvent.layout)}>
          <View
            testID="logo-text-wrapper"
          >
            <Text
              style={styles.logoText}
              testID="logo-text"
              accessible={true}
              accessibilityLabel="Engineer Reg."
              onLayout={(e) => console.log('Logo layout:', e.nativeEvent.layout)}
            >
              Engineer Reg.
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.registerButton}
              testID="register-button"
              onPress={() => console.log('Navigate to Register')}
            >
              <Text style={styles.registerButtonText}>新規登録</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.loginButton}
              testID="login-button"
              onPress={() => console.log('Navigate to Login')}
            >
              <Text style={styles.loginButtonText}>ログイン</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            エンジニアの未来を{'\n'}もっと自由に。
          </Text>
          <Text style={styles.heroSubtitle}>
            スキルと経験を価値に変える{'\n'}新しいプラットフォーム
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>無料で始める</Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>スキル可視化</Text>
            <Text style={styles.featureDesc}>あなたの経験を自動で分析し、市場価値を可視化します。</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>スマートマッチング</Text>
            <Text style={styles.featureDesc}>AIが最適な企業やプロジェクトを提案します。</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>コミュニティ</Text>
            <Text style={styles.featureDesc}>同じ志を持つエンジニアと繋がり、情報交換できます。</Text>
          </View>
        </View>

        {/* Contents Section Placeholder (microCMS) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} testID="latest-news-section">Latest News</Text>
          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>読み込み中...</Text>
            </View>
          )}
          {!isLoading && error && (
            <Text style={styles.errorText}>
              取得に失敗しました。エミュレータ/Functionsの起動状態やネットワークを確認してください。
            </Text>
          )}
          {!isLoading && !error && items.length === 0 && (
            <Text style={styles.placeholderText}>(表示できる記事がありません)</Text>
          )}
          {!isLoading && !error && items.length > 0 && (
            <View style={styles.newsList}>
              {items.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.newsItem, item.is_locked && styles.lockedNewsItem]}
                  onPress={() => {
                    if (item.is_locked) {
                      console.log('Premium content locked', item.id);
                      // TODO: Upgrade dialog or snackbar
                    } else if (item.url) {
                      Linking.openURL(item.url);
                    } else {
                      console.log('Open content', item.id);
                    }
                  }}
                >
                  <View style={styles.newsThumbnailContainer}>
                    {item.thumbnailUrl && <Image source={{ uri: item.thumbnailUrl }} style={styles.newsThumbnail} />}
                    {item.is_locked && (
                      <View style={styles.lockOverlay}>
                        <Text style={styles.lockIcon}>🔒</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.newsTextBlock}>
                    <Text style={[styles.newsTitle, item.is_locked && styles.lockedNewsTitle]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.isPremiumOnly && (
                      <Text style={[styles.premiumBadge, item.is_locked && styles.lockedPremiumBadge]}>
                        {item.is_locked ? 'プレミアム限定' : 'プレミアム'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => console.log('Navigate to Contents List')}
          >
            <Text style={styles.linkText}>記事一覧を見る →</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => props.navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.footerLink}>プライバシーポリシー</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>© 2026 Engineer Registration App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  registerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  heroSection: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1a1a1a',
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  featureDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#d93025',
    marginBottom: 16,
    lineHeight: 20,
  },
  newsList: {
    gap: 12,
    marginBottom: 16,
  },
  newsItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  newsThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  newsTextBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    lineHeight: 20,
  },
  lockedNewsItem: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  newsThumbnailContainer: {
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  lockIcon: {
    fontSize: 20,
  },
  lockedNewsTitle: {
    color: '#999',
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
  },
  lockedPremiumBadge: {
    color: '#999',
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  footerLink: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 12,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreen;
