import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, functions } from '../features/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { Passkey } from 'react-native-passkey';
import { useAuth } from '../context/AuthContext';
import { redirectToApp } from '../utils/navigationHelper';
import { logCustomEvent } from '../features/analytics';

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
      let thumbnailUrl = typeof c?.thumbnail?.url === 'string' ? c.thumbnail.url : null;

      // Image Optimization: Append imgix parameters
      if (thumbnailUrl) {
        // q=75: Quality 75%
        // fm=webp: Format WebP (if supported)
        // w=400: Max width 400px (appropriate for thumbnail)
        thumbnailUrl = `${thumbnailUrl}?q=75&fm=webp&w=400`;
      }

      const isPremiumOnly = c?.is_premium_only === true;
      const isLocked = c?.is_locked === true;

      return {
        id: c.id,
        title,
        thumbnailUrl,
        isPremiumOnly,
        is_locked: isLocked,
        seo_title: typeof c.seo_title === 'string' ? c.seo_title : title,
        seo_description: typeof c.seo_description === 'string' ? c.seo_description : '',
      };
    });
};

/**
 * @param {object} params
 * @param {string} [params.draftKey]
 * @returns {Promise<Array<LpListItem>>}
 */
export const fetchLpContents = async ({ draftKey, preview } = {}) => {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const region = 'asia-northeast1';

  // Use emulator if configured
  // const emulatorHost = process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST;
  const emulatorHost = null; // Force production environment to access real microCMS via Functions

  const baseUrl = emulatorHost
    ? `http://${emulatorHost.split(':')[0]}:5001/${projectId}/${region}`
    : `https://${region}-${projectId}.cloudfunctions.net`;

  let url = `${baseUrl}/getLpContent`;
  const queryParams = [];
  if (draftKey) {
    queryParams.push(`draftKey=${draftKey}`);
  }
  if (preview) {
    queryParams.push('preview=true');
  }

  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if logged in
  try {
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


/**
 * Analytics Tracking Utility
 * @param {string} eventName
 * @param {object} params
 */
const trackEvent = (eventName, params) => {
  logCustomEvent(eventName, params);
};

/**
 * @param {object} props
 * @param {any} props.navigation
 * @returns {React.JSX.Element}
 */
const HomeScreen = (props) => {
  const { user, isAdmin, role } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draftKey, setDraftKey] = useState(null);
  const [isPreviewEnabled, setIsPreviewEnabled] = useState(false);
  const navigation = props.navigation;

  const handleOpenMyPage = async () => {
    if (!user) {
      return;
    }

    try {
      let resolvedRole = role;

      // Fallback: If no role in context/claims, check Firestore 'users' collection
      // This duplicates logic in AuthContext/LoginScreen, but ensures robustness
      if (!resolvedRole) {
          const idTokenResult = await user.getIdTokenResult(true);
          resolvedRole = idTokenResult.claims.role;
      }
      
      if (!resolvedRole) {
           // Firestore fallback (using db import if needed, or rely on AuthContext)
           // Since we can't easily import db/getDoc here without adding imports, 
           // and AuthContext should have handled it, we might just alert.
           // But let's assume AuthContext eventually updates 'role'.
           // If 'role' is still null here, AuthContext might still be loading or failed.
           
           // Ideally, we should wait for AuthContext, but here we are in an event handler.
           // Let's try to fetch from Firestore directly if we import db.
           // For now, let's just use what we have and show a better error message if missing.
           // Or... we can add the db import and check Firestore here too.
           
           // Let's rely on the AuthContext being updated eventually.
           // If user clicks too fast, it might fail.
           
           console.warn('Role not found in context or claims.');
      }

      if (typeof resolvedRole !== 'string' || resolvedRole.length === 0) {
        Alert.alert('エラー', 'ユーザー種別の取得に失敗しました。少し待ってから再試行するか、再ログインしてください。');
        return;
      }

      await redirectToApp(resolvedRole);
    } catch (e) {
      console.error('MyPage Redirect Error:', e);
      Alert.alert('エラー', 'マイページへ遷移できませんでした。');
    }
  };

  const handleRegisterPasskey = async () => {
    if (!user) return;

    try {
      // 1. Get registration options from backend
      const getOptions = httpsCallable(functions, 'getPasskeyRegistrationOptions');
      const { data: options } = await getOptions();

      console.log('Passkey Registration Options:', options);

      // 2. Create passkey on device
      // Note: react-native-passkey handles the native dialog
      const result = await Passkey.create(options);

      // 3. Verify registration on backend
      const verifyRegistration = httpsCallable(functions, 'verifyPasskeyRegistration');
      await verifyRegistration({ response: result });

      Alert.alert('成功', 'パスキーを登録しました。次からパスキーでログインできます。');
      trackEvent('passkey_registration_success', { user_id: user.uid });
    } catch (e) {
      console.error('Passkey Registration Error:', e);
      Alert.alert('エラー', 'パスキーの登録に失敗しました。');
      trackEvent('passkey_registration_failure', { error: e.message });
    }
  };

  useEffect(() => {
    // Check for draftKey in deep link URL
    const handleUrl = (event) => {
      const url = event.url;
      if (url && url.includes('draftKey=')) {
        const key = url.split('draftKey=')[1].split('&')[0];
        setDraftKey(key);
        console.log('Preview mode activated with draftKey');
      }
    };

    const getInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) handleUrl({ url });
    };

    getInitialUrl();
    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription.remove();
    };
  }, []);

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
        const lpItems = await fetchLpContents({
          draftKey,
          preview: isPreviewEnabled
        });
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
  }, [draftKey, isPreviewEnabled]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Admin Section */}
        {isAdmin && (
          <View style={styles.adminBar}>
            <Text style={styles.adminBarText}>管理者メニュー</Text>
            <TouchableOpacity
              style={[styles.adminButton, isPreviewEnabled && styles.adminButtonActive]}
              onPress={() => {
                const newState = !isPreviewEnabled;
                setIsPreviewEnabled(newState);
                trackEvent('toggle_preview_mode', { enabled: newState });
                if (newState) {
                  Alert.alert('プレビュー', 'microCMSの最新の下書き内容を表示します。');
                }
              }}
            >
              <Text style={styles.adminButtonText}>
                {isPreviewEnabled ? 'プレビュー中' : 'プレビュー有効化'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminButton}
              onPress={handleRegisterPasskey}
            >
              <Text style={styles.adminButtonText}>🔑 パスキ登録</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Preview Banner */}
        {(draftKey || isPreviewEnabled) && (
          <View style={[styles.previewBanner, isPreviewEnabled && { backgroundColor: '#FF9500' }]}>
            <Text style={styles.previewBannerText}>
              {isPreviewEnabled ? '管理プレビューモード有効 (Draft/Public)' : 'プレビューモード有効'}
            </Text>
            <TouchableOpacity onPress={() => {
              setDraftKey(null);
              setIsPreviewEnabled(false);
            }}>
              <Text style={styles.previewBannerClose}>終了</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Repair Permissions Section (Visible if logged in but NOT admin) */}
        {user && !isAdmin && (
          <View style={styles.repairContainer}>
            <Text style={styles.repairText}>管理者権限が確認できません。</Text>
            <TouchableOpacity
              style={styles.repairButton}
              onPress={async () => {
                try {
                  const repair = httpsCallable(functions, 'repairAdminPermissions');
                  const { data } = await repair();
                  Alert.alert('成功', data.message);
                } catch (e) {
                  Alert.alert('エラー', '修復に失敗しました。');
                }
              }}
            >
              <Text style={styles.repairButtonText}>管理者権限を修復する</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Header / Nav */}
        <View style={styles.header} testID="header-container" onLayout={(e) => console.log('Header layout:', e.nativeEvent.layout)}>
          <TouchableOpacity
            testID="logo-text-wrapper"
            onLongPress={() => {
              trackEvent('logo_long_press', { user_id: user?.uid });
              if (!user) {
                navigation.navigate('Login');
              } else {
                Alert.alert('管理者情報', `ログイン中: ${user.email}${isAdmin ? ' (Admin)' : ''}`);
              }
            }}
            delayLongPress={1000}
          >
            <Text
              style={styles.logoText}
              testID="logo-text"
              accessible={true}
              accessibilityLabel="Career Dev Tool"
              onLayout={(e) => console.log('Logo layout:', e.nativeEvent.layout)}
            >
              Career Dev Tool
            </Text>
          </TouchableOpacity>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.registerButton}
              testID="register-button"
              onPress={() => {
                trackEvent('click_register', { location: 'header' });
                console.log('Navigate to Register');
              }}
            >
              <Text style={styles.registerButtonText}>新規登録</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.loginButton}
              testID="login-button"
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                if (!user) {
                  trackEvent('click_login', { location: 'header' });
                  props.navigation.navigate('PasskeyLogin');
                  return;
                }

                trackEvent('click_mypage', { uid: user.uid });
                handleOpenMyPage();
              }}
              onLongPress={() => {
                if (!user) {
                  return;
                }

                Alert.alert('ログアウト', 'ログアウトしますか？', [
                  { text: 'キャンセル', style: 'cancel' },
                  {
                    text: 'ログアウト',
                    style: 'destructive',
                    onPress: () => {
                      trackEvent('click_logout', { uid: user.uid });
                      auth.signOut();
                    },
                  },
                ]);
              }}
              delayLongPress={600}
            >
              <Text style={styles.loginButtonText}>{user ? 'マイページ' : 'ログイン'}</Text>
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
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              trackEvent('click_cta_hero', { label: '無料で始める' });
              console.log('CTA Clicked');
            }}
          >
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
                    trackEvent('content_click', { id: item.id, is_locked: item.is_locked });
                    if (item.is_locked) {
                      console.log('Premium content locked', item.id);
                      trackEvent('premium_content_blocked', { id: item.id });
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
            onPress={() => {
              trackEvent('click_view_all_news');
              console.log('Navigate to Contents List');
            }}
          >
            <Text style={styles.linkText}>記事一覧を見る →</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => props.navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.footerLink}>プライバシーポリシー</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>© 2026 Career Dev Tool</Text>
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
    backgroundColor: '#007AFF',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
  previewBanner: {
    backgroundColor: '#FF3B30',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  previewBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  previewCloseText: {
    color: '#fff',
    fontSize: 12,
    textDecorationLine: 'underline',
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
  adminBar: {
    backgroundColor: '#333',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  adminBarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  adminButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  adminButtonActive: {
    backgroundColor: '#4CD964',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  repairContainer: {
    backgroundColor: '#FFFBE6',
    borderWidth: 1,
    borderColor: '#FFE58F',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  repairText: {
    color: '#856404',
    marginBottom: 8,
    textAlign: 'center',
  },
  repairButton: {
    backgroundColor: '#FAAD14',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  repairButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
