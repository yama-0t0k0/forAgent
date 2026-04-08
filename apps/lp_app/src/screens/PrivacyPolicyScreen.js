import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/**
 * Privacy Policy Agreement Screen
 * - Displays the privacy policy content.
 * - Forces user to scroll to the bottom before enabling the "Agree" button.
 */
const PrivacyPolicyScreen = ({ navigation, route }) => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Invitation data from source
  const invitationInfo = route.params?.invitationInfo || {};

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Check if the user has reached the bottom
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 30;

    if (isCloseToBottom && !isScrolledToBottom) {
      setIsScrolledToBottom(true);
    }
  };

  const handleAgree = () => {
    if (!isScrolledToBottom) {
      Alert.alert('確認', '規約を最後までスクロールしてお読みください。');
      return;
    }
    // Proceed to Registration Method Selection
    navigation.navigate('RegistrationMethod', { invitationInfo });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>プライバシーポリシー</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.instruction}>
          重要：以下の内容を最後までスクロールしてご確認下さい。
        </Text>
        
        <View style={styles.policyWrapper}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.policyScrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.policyTextContainer}>
              <Text style={styles.policyHeading}>個人情報保護方針（プライバシーポリシー）</Text>
              <Text style={styles.policyParagraph}>
                株式会社LaT（以下「当社」といいます）は、個人情報保護の重要性を認識し、個人情報保護に関する法令およびその他の規範を遵守し、以下の方針に基づき、個人情報の適正な取り扱いと管理に努めます。
              </Text>

              <Text style={styles.policySection}>1. 当社サービスにおける個人情報の取り扱い</Text>
              <Text style={styles.policyParagraph}>
                当社は、当社サービスの提供にあたり、以下の個人情報を取得・利用することがあります。
                {"\n"}・ユーザー情報（氏名、メールアドレス、会社名、電話番号 等）
                {"\n"}・アカウント情報およびアクセス履歴
                {"\n"}・ユーザーが登録またはアップロードしたデータ
                {"\n"}・サービス利用状況（ログ、IPアドレス、ブラウザ情報、アクセス日時 等）
              </Text>

              <Text style={styles.policySubSection}>データの保存期間</Text>
              <Text style={styles.policyParagraph}>
                当社は、サービス利用契約終了後、ログイン履歴およびIPアドレス等を含むデータについては、最長3年間保存し、その後、適切な方法で削除します。ただし、法令に基づき保存が必要な場合はその限りではありません。
              </Text>

              <Text style={styles.policySubSection}>利用目的</Text>
              <Text style={styles.policyParagraph}>
                当社は、個人情報を適切に取得し、以下の目的のために利用します。
                {"\n"}・有料職業紹介事業における求職者と求人企業とのマッチング、および関連業務
                {"\n"}・当社サービスにおけるユーザー登録、アカウント管理、各種サービスの提供、および改善、新機能開発、運用、管理
                {"\n"}・採用活動に関する連絡、求人情報の提供
                {"\n"}・ユーザーサポート・お問い合わせ対応
                {"\n"}・当社サービス向上のためのアンケートや統計データ分析
                {"\n"}・不正アクセスやセキュリティ対策のためのログ監視・分析
                {"\n"}・法令に基づく対応およびその他正当な目的
                {"\n"}また、上記の目的を超えて利用することはありません。
              </Text>

              <Text style={styles.policySection}>2. 個人情報の適正管理</Text>
              <Text style={styles.policyParagraph}>
                当社は、取得した個人情報について適切な安全措置を講じ、不正アクセス、紛失、破壊、改ざん、漏洩の防止に努めます。当社サービスにおいては、データ暗号化やアクセス制限等の技術的・組織的安全対策を実施します。
              </Text>

              <Text style={styles.policySubSection}>セキュリティ事故時の対応</Text>
              <Text style={styles.policyParagraph}>
                万が一、個人情報の漏洩や不正アクセス等のセキュリティ事故が発生した場合、速やかに以下の対応を行います。
                {"\n"}・影響範囲の特定と被害の最小化
                {"\n"}・当該ユーザーへの速やかな通知
                {"\n"}・原因調査および再発防止策の実施
                {"\n"}・必要に応じて監督官庁への報告
              </Text>

              <Text style={styles.policySection}>3. 個人情報の第三者提供</Text>
              <Text style={styles.policyParagraph}>
                当社は、以下の場合を除き、あらかじめ本人の同意を得ることなく、個人情報を第三者に提供いたしません。
                {"\n"}・法令に基づく場合
                {"\n"}・人の生命、身体または財産の保護のために必要があり、本人の同意を得ることが困難な場合
                {"\n"}・公衆衛生の向上または児童の健全な育成に特に必要がある場合
                {"\n"}・国の機関もしくは地方公共団体、またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合
              </Text>

              <Text style={styles.policySection}>4. 個人情報の共同利用について</Text>
              <Text style={styles.policyParagraph}>
                当社は、以下の会社との間で、個人データを共同利用いたします。
                {"\n"}・共同利用する個人データの項目：氏名、生年月日、連絡先（電話番号、メールアドレス等）、職務経歴、サービス利用履歴、希望条件等
                {"\n"}・共同利用者の範囲：株式会社LaTおよび当社提携企業である株式会社ウィルオブ・ワーク(サービス名「ウィルオブテック」)
                {"\n"}・利用目的：有料職業紹介事業および当社サービスにおける適切なサービスの提供
                {"\n"}・管理責任者：株式会社LaT
                {"\n\n"}
                当社では、付加価値の高いサービスを展開するために、厳格な管理・監督のもとに個人情報を提携企業である株式会社ウィルオブ・ワーク(サービス名「ウィルオブテック」)と共同利用する場合があります。当該個人情報について、第三者への提供の停止をご希望の採用候補者は巻末の「お問い合わせ先」までその旨ご連絡ください。ご連絡いただいた場合には、本人ご自身からのご請求であることを確認の上で、第三者への提供を停止（オプトアウト）させていただきます。
              </Text>

              <Text style={styles.policySection}>5. 個人情報の開示・訂正・削除等</Text>
              <Text style={styles.policyParagraph}>
                本人から自己の個人情報について、開示、訂正、追加、削除、利用停止等の要求があった場合、当社は速やかに対応いたします。
              </Text>

              <Text style={styles.policySection}>6. Cookieおよび類似技術の利用</Text>
              <Text style={styles.policyParagraph}>
                当社は、当社サービスやウェブサイトの利便性向上のため、Cookieおよび類似技術を利用する場合があります。Cookieを無効化されたいユーザーは、ウェブブラウザの設定を変更することによりCookieを無効化することができます。但し、Cookieを無効化すると、当社のサービスの一部の機能をご利用いただけなくなる場合があります。
              </Text>

              <Text style={styles.policySection}>7. 継続的改善</Text>
              <Text style={styles.policyParagraph}>
                当社は、個人情報保護を適切に実施するため、継続的な改善に努めます。
              </Text>

              <Text style={styles.policySection}>8. お問い合わせ先</Text>
              <Text style={styles.policyParagraph}>
                個人情報に関するお問い合わせは、下記までご連絡ください。
                {"\n"}株式会社LaT
                {"\n"}住所：東京都新宿区新宿2丁目12番13号新宿アントレサロンビル2階
                {"\n"}電話番号：090-6744-7313
                {"\n"}メールアドレス：m.yamakawa@lat-inc.com
              </Text>
              
              <View style={{ height: 100 }} />
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleAgree}
          style={[
            styles.agreeButton,
            !isScrolledToBottom && styles.agreeButtonDisabled
          ]}
          disabled={!isScrolledToBottom}
        >
          <Text style={[
            styles.agreeButtonText,
            !isScrolledToBottom && styles.agreeButtonTextDisabled
          ]}>
            同意して次へ
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#999',
    fontSize: 16,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  instruction: {
    color: '#666',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  policyWrapper: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  policyScrollView: {
    flex: 1,
  },
  policyTextContainer: {
    padding: 24,
  },
  policyHeading: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 32,
  },
  policySection: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 32,
    marginBottom: 12,
  },
  policySubSection: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 6,
  },
  policyParagraph: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    backgroundColor: '#0A0A0A',
  },
  agreeButton: {
    backgroundColor: '#00E5FF',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  agreeButtonDisabled: {
    backgroundColor: '#333',
    shadowOpacity: 0,
  },
  agreeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  agreeButtonTextDisabled: {
    color: '#777',
  },
});

export default PrivacyPolicyScreen;
