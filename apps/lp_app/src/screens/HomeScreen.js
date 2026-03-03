import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/**
 * LP Home Screen
 * - microCMSで管理されたコンテンツを表示するトップ画面
 * - ヒーローセクション、特徴紹介、コンテンツリストへの導線を配置
 */
const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header / Nav */}
        <View style={styles.header}>
          <Text style={styles.logoText}>Engineer Reg.</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => console.log('Navigate to Register')}
            >
              <Text style={styles.registerButtonText}>新規登録</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.loginButton}
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
          <Text style={styles.sectionTitle}>Latest News</Text>
          <Text style={styles.placeholderText}>
            (ここにmicroCMSから取得した記事が表示されます)
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => console.log('Navigate to Contents List')}
          >
            <Text style={styles.linkText}>記事一覧を見る →</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
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
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreen;
