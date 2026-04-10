import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, functions } from '../features/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { Passkey } from 'react-native-passkey';
import { useAuth } from '../context/AuthContext';
import { redirectToApp } from '../utils/navigationHelper';
import { logCustomEvent } from '../features/analytics';
import { resolveUserRole } from '../features/firebase/authUtils';
import { THEME } from '@shared/src/core/theme/theme';

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

const NOTE_MAGAZINE_RSS_URL = 'https://note.com/lycaonpictus/m/m7f05093c60f0/rss';
const NOTE_NEWS_LIMIT = 3;

const PURPOSE_BINARY_SOURCE = '11100011 10000001 10101011 11100011 10000011 10110011 11100011 10000011 10101111 11100011 10000011 10001010 11100011 10000011 10100010 11100011 10000010 10101110 11100011 10000011 10101110 11100011 10000010 10101110 11100011 10000011 10000011 11100110 10101100 10101101 11100011 10000110 10101111 11100111 10011001 10101110 11100111 10011110 10101110 11100101 10101000 10100110 11100110 10011100 10100011 11100011 10000010 10010010 11100110 10011100 10000000 11100101 10100100 10100111 11100101 10001100 10010110 11100011 10000010 10011001 11100011 10000010 10001011 11100011 10000010 10101110 11100011 10000010 10100111 11100011 10000010 10100110 11100110 10010111 10100101 11100110 10011100 10101100 11100011 10000010 10001001 11100111 10011010 10000000 11100111 10011011 10010111 11100110 10011000 10100110 11100110 10010111 10110000 11100110 10011001 10110000 11100011 10000010 10010010 11100110 10011111 10101111 11100011 10000010 10001000 11101000 10101110 10101111 11100110 10011100 10101100 11100111 10010110 10101001 11100101 10010011 10100011 11100011 10000010 10011001 11100111 10010111 10001101 11100101 10001001 10010101 11100111 10010000 10010010 11100011 10000010 10001001 11100101 10101000 10010101 11100101 10101001 10101100 11100011 10000010 10001101 11100111 10011003 10001000 11100101 10011011 10111111 11100011 10000010 10001001';
const PURPOSE_BINARY_WALLPAPER = Array.from({ length: 8 })
  .fill(PURPOSE_BINARY_SOURCE)
  .join('\n');

const decodeXmlEntities = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
};

const escapeRegExp = (tagName) => {
  return tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getXmlTagValue = (xml, tagName) => {
  if (typeof xml !== 'string' || typeof tagName !== 'string' || tagName.length === 0) {
    return null;
  }

  const safeTagName = escapeRegExp(tagName);
  const regex = new RegExp(`<${safeTagName}[^>]*>([\\s\\S]*?)<\\/${safeTagName}>`, 'i');
  const match = xml.match(regex);
  if (!match) {
    return null;
  }

  return decodeXmlEntities(match[1].trim());
};

export const parseNoteMagazineRssItems = (rssText, limit = NOTE_NEWS_LIMIT) => {
  if (typeof rssText !== 'string' || rssText.length === 0) {
    return [];
  }

  const itemMatches = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  return itemMatches
    .map((match) => match[1])
    .map((itemXml) => {
      const title = getXmlTagValue(itemXml, 'title') || '';
      const link = getXmlTagValue(itemXml, 'link');
      const guid = getXmlTagValue(itemXml, 'guid');
      const thumbnailUrl = getXmlTagValue(itemXml, 'media:thumbnail');
      const url = link || guid;

      return {
        id: url || guid || title,
        title,
        thumbnailUrl: thumbnailUrl || null,
        isPremiumOnly: false,
        url: url || undefined,
        is_locked: false,
      };
    })
    .filter((item) => typeof item.id === 'string' && item.id.length > 0 && typeof item.title === 'string' && item.title.length > 0)
    .slice(0, typeof limit === 'number' && limit > 0 ? limit : NOTE_NEWS_LIMIT);
};

export const fetchNoteMagazineNews = async () => {
  if (Platform.OS !== 'web') {
    const response = await fetch(NOTE_MAGAZINE_RSS_URL, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rssText = await response.text();
    return parseNoteMagazineRssItems(rssText, NOTE_NEWS_LIMIT);
  }

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const region = process.env.EXPO_PUBLIC_FUNCTIONS_REGION || 'us-central1';

  // Use emulator if configured
  // const emulatorHost = process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST;
  const emulatorHost = null; // Force production environment to access Functions

  const baseUrl = emulatorHost
    ? `http://${emulatorHost.split(':')[0]}:5001/${projectId}/${region}`
    : `https://${region}-${projectId}.cloudfunctions.net`;

  const url = `${baseUrl}/getNoteMagazineNews`;
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  } catch (error) {
    console.warn('Auth check failed:', error);
  }

  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return Array.isArray(result?.items) ? result.items : [];
  } catch (error) {
    throw error;
  }
};

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
        thumbnailUrl = `${thumbnailUrl}?q = 75 & fm=webp & w=400`;
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
  const region = process.env.EXPO_PUBLIC_FUNCTIONS_REGION || 'us-central1';

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

export const LP_FOOTER_LINKS = [
  { label: '会社概要', routeName: 'CompanyOverview' },
  { label: 'パーパス', routeName: 'Purpose' },
  { label: '採用情報', routeName: 'RecruitmentInfo' },
];

const InfoHeader = ({ title, navigation }) => {
  return (
    <View style={infoStyles.header}>
      <TouchableOpacity
        style={infoStyles.headerBackButton}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="戻る"
      >
        <Text style={infoStyles.headerBackText}>←</Text>
      </TouchableOpacity>
      <Text style={infoStyles.headerTitle} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
};

const InfoCard = ({ title, children }) => {
  return (
    <View style={infoStyles.card}>
      {typeof title === 'string' && title.length > 0 && (
        <Text style={infoStyles.cardTitle}>{title}</Text>
      )}
      {children}
    </View>
  );
};

const InfoRow = ({ label, children }) => {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.rowLabel}>{label}</Text>
      <View style={infoStyles.rowValueContainer}>{children}</View>
    </View>
  );
};

const BottomMenu = ({ navigation }) => {
  return (
    <View style={infoStyles.bottomMenu}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={infoStyles.bottomMenuItem}
        accessibilityRole="button"
      >
        <Text style={infoStyles.bottomMenuText}>トップページ</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('CompanyOverview')}
        style={infoStyles.bottomMenuItem}
        accessibilityRole="button"
      >
        <Text style={infoStyles.bottomMenuText}>会社概要</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Purpose')}
        style={infoStyles.bottomMenuItem}
        accessibilityRole="button"
      >
        <Text style={infoStyles.bottomMenuText}>パーパス</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('RecruitmentInfo')}
        style={infoStyles.bottomMenuItem}
        accessibilityRole="button"
      >
        <Text style={infoStyles.bottomMenuText}>採用情報</Text>
      </TouchableOpacity>
    </View>
  );
};

export const CompanyOverviewScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={infoStyles.container}>
      <InfoHeader title="会社概要" navigation={navigation} />
      <ScrollView contentContainerStyle={infoStyles.scrollContent}>
        <View style={infoStyles.hero}>
          <View style={infoStyles.heroIconPlaceholder}>
            <Text style={infoStyles.heroIconText}>LaT</Text>
          </View>
          <Text style={infoStyles.heroTitle}>株式会社LaT</Text>
        </View>

        <InfoCard title="会社概要">
          <InfoRow label="会社名">
            <Text style={infoStyles.rowValueText}>株式会社LaT</Text>
          </InfoRow>
          <InfoRow label="代表取締役CEO">
            <Text style={infoStyles.rowValueText}>山川 真</Text>
          </InfoRow>
          <InfoRow label="所在地">
            <Text style={infoStyles.rowValueText}>
              〒160-0022 東京都新宿区{'\n'}
              新宿2丁目12番13号 新宿アントレサロンビル2階
            </Text>
          </InfoRow>
          <InfoRow label="設立">
            <Text style={infoStyles.rowValueText}>2024年8月</Text>
          </InfoRow>
          <InfoRow label="事業内容">
            <Text style={infoStyles.rowValueText}>
              ・AI技術を活用したキャリアデベロップメントツールの提供{'\n'}
              ・人材紹介事業（許可番号：13-ユ-317469）
            </Text>
          </InfoRow>
          <InfoRow label="ウェブサイト">
            <TouchableOpacity
              onPress={() => Linking.openURL('https://latcoltd.net/')}
              accessibilityRole="link"
            >
              <Text style={infoStyles.linkText}>https://latcoltd.net/</Text>
            </TouchableOpacity>
          </InfoRow>
        </InfoCard>
      </ScrollView>
    </SafeAreaView>
  );
};

export const PurposeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={infoStyles.container}>
      <InfoHeader title="パーパス" navigation={navigation} />
      <ScrollView contentContainerStyle={infoStyles.scrollContent}>
        <Text style={infoStyles.largeTitle}>LaT のパーパス</Text>

        <InfoCard>
          <View style={infoStyles.centerIconRow}>
            <View style={infoStyles.heroIconPlaceholderSmall}>
              <Text style={infoStyles.heroIconTextSmall}>LaT</Text>
            </View>
          </View>
          <Text style={infoStyles.purposeText}>
            エンジニアのキャリア実現度を最大化することで、日本の技術革新を支え、社会の豊かさの底上げを図る
          </Text>
        </InfoCard>

        <InfoCard title="ビジョン">
          <Text style={infoStyles.paragraph}>
            テクノロジーの力でエンジニアとテック企業の最適なマッチングを実現し、よりイノベーティブな社会づくりに貢献します。
          </Text>
        </InfoCard>

        <InfoCard title="ミッション">
          <Text style={infoStyles.paragraph}>
            キャリアの可視化と継続的な成長支援を通じて、エンジニア一人ひとりが納得できる選択をできる環境を提供します。
          </Text>
        </InfoCard>
      </ScrollView>
    </SafeAreaView>
  );
};

export const RecruitmentInfoScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={infoStyles.container}>
      <InfoHeader title="採用情報" navigation={navigation} />
      <ScrollView contentContainerStyle={infoStyles.scrollContent}>
        <View style={infoStyles.hero}>
          <View style={infoStyles.heroIconPlaceholder}>
            <Text style={infoStyles.heroIconText}>—</Text>
          </View>
        </View>

        <InfoCard>
          <Text style={infoStyles.recruitmentTitle}>現在採用は行なっておりません</Text>
          <Text style={infoStyles.paragraph}>
            採用を再開する際には、このページにてお知らせいたします。{'\n'}
            ご興味をお持ちいただき、誠にありがとうございます。
          </Text>
        </InfoCard>

        <BottomMenu navigation={navigation} />
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * @param {object} props
 * @param {any} props.navigation
 * @returns {React.JSX.Element}
 */
const HomeScreen = (props) => {
  const { user, isAdmin, role, needsAdminRepair } = useAuth();
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

      if (!resolvedRole) {
        resolvedRole = await resolveUserRole(user, true); // Force refresh if not in context
      }

      console.log('[HomeScreen] handleOpenMyPage resolved role:', resolvedRole);

      if (typeof resolvedRole !== 'string' || resolvedRole.length === 0) {
        Alert.alert('権限確認', '権限情報が取得できていません。再試行するか、ログアウトして再ログインしてください。', [
          {
            text: '再試行',
            onPress: () => {
              handleOpenMyPage();
            },
          },
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
      const defaultRpId = __DEV__ ? 'engineer-registration-lp-dev.web.app' : 'latcoltd.net';
      const rpId = process.env.EXPO_PUBLIC_PASSKEY_RP_ID || defaultRpId;

      // 1. Get registration options from backend
      const getOptions = httpsCallable(functions, 'getPasskeyRegistrationOptions');
      const { data: options } = await getOptions({ rpId });

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
        try {
          const noteItems = await fetchNoteMagazineNews();
          if (!isCanceled && noteItems.length > 0) {
            setItems(noteItems);
            return;
          }
        } catch (noteError) {
          console.warn('Failed to fetch Note magazine news, falling back to microCMS:', noteError);
        }

        const lpItems = await fetchLpContents({
          draftKey,
          preview: isPreviewEnabled
        });

        if (!isCanceled) {
          setItems(lpItems.length > 0 ? lpItems : FALLBACK_ITEMS);
        }
      } catch (e) {
        if (!isCanceled) {
          console.warn('Failed to fetch Note magazine and microCMS, using fallback:', e);
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
          <View style={[styles.previewBanner, isPreviewEnabled && { backgroundColor: THEME.warning }]}>
            <Text style={styles.previewBannerText}>
              {isPreviewEnabled ? '管理プレビューモード有効 (Draft/Public)' : 'プレビューモード有効'}
            </Text>
            <TouchableOpacity onPress={() => {
              setDraftKey(null);
              setIsPreviewEnabled(false);
            }}>
              <Text style={styles.previewCloseText}>終了</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Repair Permissions Section (Visible if admin uid but claims/role not verified) */}
        {user && needsAdminRepair && (
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
                props.navigation.navigate('InvitationCode');
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
          <View style={styles.heroBinaryPattern} pointerEvents="none">
            <Text style={styles.heroBinaryText}>{PURPOSE_BINARY_WALLPAPER}</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              エンジニアの未来を{'\n'}もっと自由に。
            </Text>
            <Text style={styles.heroSubtitle}>
              スキルと経験をさらなる価値に変える{'\n'}完全招待制プラットフォーム
            </Text>
          </View>
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
          <View style={styles.footerLinks}>
            {LP_FOOTER_LINKS.map((link) => (
              <TouchableOpacity
                key={link.routeName}
                onPress={() => props.navigation.navigate(link.routeName)}
                accessibilityRole="button"
              >
                <Text style={styles.footerLink}>{link.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => props.navigation.navigate('PrivacyPolicy')} accessibilityRole="button">
              <Text style={styles.footerLink}>プライバシーポリシー</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>© 2026 Career Dev Tool</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.surface,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderLight,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  registerButton: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.primary,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textInverse,
  },
  loginButton: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.primary,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textInverse,
  },
  heroSection: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
    backgroundColor: THEME.borderGlass,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 32,
  },
  heroBinaryPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: THEME.spacing.md,
    opacity: 0.34,
  },
  heroBinaryText: {
    color: THEME.textInverse,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 1.2,
    fontWeight: '300',
    width: '100%',
    fontFamily: Platform.select({
      ios: 'Avenir Next',
      android: 'sans-serif',
      web: 'ui-rounded',
      default: 'System',
    }),
  },
  heroContent: {
    width: '100%',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    color: THEME.textPrimary,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: THEME.textSecondary,
    marginBottom: THEME.spacing.xl,
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: THEME.spacing.lg,
    color: THEME.text,
  },
  featureCard: {
    backgroundColor: THEME.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.radius.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.borderDefault,
    borderColor: THEME.borderDefault,
    ...THEME.shadow.sm,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: THEME.spacing.sm,
    color: THEME.text,
  },
  featureDesc: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 22,
  },
  placeholderText: {
    fontSize: 14,
    color: THEME.textMuted,
    fontStyle: 'italic',
    marginBottom: THEME.spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: THEME.error,
    marginBottom: THEME.spacing.md,
    lineHeight: 20,
  },
  newsList: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  newsItem: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.borderDefault,
    backgroundColor: THEME.surface,
  },
  newsThumbnail: {
    width: 64,
    height: 64,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.borderLight,
  },
  newsTextBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    lineHeight: 20,
  },
  lockedNewsItem: {
    backgroundColor: THEME.surfaceMuted,
    borderColor: THEME.borderDefault,
  },
  previewBanner: {
    backgroundColor: THEME.error,
    padding: THEME.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  previewBannerText: {
    color: THEME.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  previewCloseText: {
    color: THEME.textInverse,
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
    backgroundColor: THEME.overlaySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.radius.lg,
  },
  lockIcon: {
    fontSize: 20,
  },
  lockedNewsTitle: {
    color: THEME.textMuted,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: THEME.primary,
  },
  lockedPremiumBadge: {
    color: THEME.textMuted,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 16,
    color: THEME.primary,
    fontWeight: '600',
  },
  adminBar: {
    backgroundColor: THEME.textPrimary,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  adminBarText: {
    color: THEME.textInverse,
    fontSize: 14,
    fontWeight: 'bold',
  },
  adminButton: {
    backgroundColor: THEME.primary,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.radius.pill,
  },
  adminButtonActive: {
    backgroundColor: THEME.success,
  },
  adminButtonText: {
    color: THEME.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: THEME.spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.borderLight,
    backgroundColor: THEME.surface,
  },
  footerLinks: {
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  footerLink: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  repairContainer: {
    backgroundColor: THEME.surfaceWarning,
    borderWidth: 1,
    borderColor: THEME.borderWarning,
    padding: THEME.spacing.md,
    margin: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  repairText: {
    color: THEME.textWarning,
    marginBottom: 8,
    textAlign: 'center',
  },
  repairButton: {
    backgroundColor: THEME.warning,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.radius.pill,
  },
  repairButtonText: {
    color: THEME.textInverse,
    fontWeight: 'bold',
  },
});

const infoStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.surfaceMuted,
  },
  header: {
    height: 56,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackButton: {
    position: 'absolute',
    left: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  headerBackText: {
    color: THEME.textInverse,
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitle: {
    color: THEME.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxl,
    gap: THEME.spacing.md,
  },
  hero: {
    alignItems: 'center',
    gap: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
  },
  heroIconPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: THEME.radius.lg,
    borderWidth: 2,
    borderColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.surface,
  },
  heroIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.primary,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.textPrimary,
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.textPrimary,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
  },
  centerIconRow: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  heroIconPlaceholderSmall: {
    width: 56,
    height: 56,
    borderRadius: THEME.radius.lg,
    borderWidth: 2,
    borderColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.surface,
  },
  heroIconTextSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.primary,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.borderDefault,
    borderColor: THEME.borderDefault,
    ...THEME.shadow.sm,
    gap: THEME.spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.md,
  },
  rowLabel: {
    width: 110,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },
  rowValueContainer: {
    flex: 1,
  },
  rowValueText: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '700',
  },
  purposeText: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  paragraph: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 22,
  },
  recruitmentTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.textPrimary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  bottomMenu: {
    alignSelf: 'center',
    width: '70%',
    backgroundColor: THEME.surface,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.borderDefault,
    overflow: 'hidden',
  },
  bottomMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderLight,
    alignItems: 'center',
  },
  bottomMenuText: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontWeight: '600',
  },
});

export default HomeScreen;
