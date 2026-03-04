import React from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PrivacyPolicyScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← 戻る</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>プライバシーポリシー</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>個人情報保護方針（プライバシーポリシー）</Text>
                <Text style={styles.text}>
                    株式会社LaT（以下「当社」といいます）は、個人情報保護の重要性を認識し、個人情報保護に関する法令およびその他の規範を遵守し、以下の方針に基づき、個人情報の適正な取り扱いと管理に努めます。
                </Text>

                <Text style={styles.sectionTitle}>1. 当社サービスにおける個人情報の取り扱い</Text>
                <Text style={styles.text}>
                    当社は、当社サービスの提供にあたり、以下の個人情報を取得・利用することがあります。{"\n"}
                    ・ユーザー情報（氏名、メールアドレス、会社名、電話番号 等）{"\n"}
                    ・アカウント情報およびアクセス履歴{"\n"}
                    ・ユーザーが登録またはアップロードしたデータ{"\n"}
                    ・サービス利用状況（ログ、IPアドレス、ブラウザ情報、アクセス日時 等）
                </Text>

                <Text style={styles.sectionTitle}>データの保存期間</Text>
                <Text style={styles.text}>
                    当社は、サービス利用契約終了後、ログイン履歴およびIPアドレス等を含むデータについては、最長3年間保存し、その後、適切な方法で削除します。ただし、法令に基づき保存が必要な場合はその限りではありません。
                </Text>

                <Text style={styles.sectionTitle}>当社は、個人情報を適切に取得し、以下の目的のために利用します。</Text>
                <Text style={styles.subSectionTitle}>利用目的</Text>
                <Text style={styles.text}>
                    ・有料職業紹介事業における求職者と求人企業とのマッチング、および関連業務{"\n"}
                    ・当社サービスにおけるユーザー登録、アカウント管理、各種サービスの提供、および改善、新機能開発、運用、管理{"\n"}
                    ・採用活動に関する連絡、求人情報の提供{"\n"}
                    ・ユーザーサポート・お問い合わせ対応{"\n"}
                    ・当社サービス向上のためのアンケートや統計データ分析{"\n"}
                    ・不正アクセスやセキュリティ対策のためのログ監視・分析{"\n"}
                    ・法令に基づく対応およびその他正当な目的{"\n"}
                    また、上記の目的を超えて利用することはありません。
                </Text>

                <Text style={styles.sectionTitle}>2. 個人情報の適正管理</Text>
                <Text style={styles.text}>
                    当社は、取得した個人情報について適切な安全措置を講じ、不正アクセス、紛失、破壊、改ざん、漏洩の防止に努めます。当社サービスにおいては、データ暗号化やアクセス制限等の技術的・組織的安全対策を実施します。
                </Text>

                <Text style={styles.subSectionTitle}>セキュリティ事故時の対応</Text>
                <Text style={styles.text}>
                    万が一、個人情報の漏洩や不正アクセス等のセキュリティ事故が発生した場合、速やかに以下の対応を行います。{"\n"}
                    ・影響範囲의 特定と被害の最小化{"\n"}
                    ・当該ユーザーへの速やかな通知{"\n"}
                    ・原因調査および再発防止策の実施{"\n"}
                    ・必要に応じて監督官庁への報告
                </Text>

                <Text style={styles.sectionTitle}>3. 個人情報の第三者提供</Text>
                <Text style={styles.text}>
                    当社は、以下の場合を除き、あらかじめ本人の同意を得ることなく、個人情報を第三者に提供いたしません。{"\n"}
                    ・法令に基づく場合{"\n"}
                    ・人の生命、身体または財産の保護のために必要があり、本人の同意を得ることが困難な場合{"\n"}
                    ・公衆衛生の向上または児童の健全な育成に特に必要がある場合{"\n"}
                    ・国の機関もしくは地方公共団体、またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合
                </Text>

                <Text style={styles.sectionTitle}>4. 個人情報の共同利用について</Text>
                <Text style={styles.text}>
                    当社は、以下の会社との間で、個人データを共同利用いたします。{"\n"}
                    ・共同利用する個人データの項目：氏名、生年月日、連絡先（電話番号、メールアドレス等）、職務経歴、サービス利用履歴、希望条件等{"\n"}
                    ・共同利用者の範囲：株式会社LaTおよび当社提携企業である株式会社ウィルオブ・ワーク(サービス名「ウィルオブテック」){"\n"}
                    ・利用目的：有料職業紹介事業および当社サービスにおける適切なサービスの提供{"\n"}
                    ・管理責任者：株式会社LaT
                </Text>

                <Text style={styles.sectionTitle}>5. 個人情報の開示・訂正・削除等</Text>
                <Text style={styles.text}>
                    本人から自己の個人情報について、開示、訂正、追加、削除、利用停止等の要求があった場合、当社は速やかに対応いたします。
                </Text>

                <Text style={styles.sectionTitle}>6. Cookieおよび類似技術の利用</Text>
                <Text style={styles.text}>
                    当社は、当社サービスやウェブサイトの利便性向上のため、Cookieおよび類似技術を利用する場合があります。
                </Text>

                <Text style={styles.sectionTitle}>7. 継続的改善</Text>
                <Text style={styles.text}>
                    当社は、個人情報保護を適切に実施するため、継続的な改善に努めます。
                </Text>

                <Text style={styles.sectionTitle}>8. お問い合わせ先</Text>
                <Text style={styles.text}>
                    株式会社LaT{"\n"}
                    住所：東京都新宿区新宿2丁目12番13号新宿アントレサロンビル2階{"\n"}
                    電話番号：090-6744-7313{"\n"}
                    メールアドレス：m.yamakawa@lat-inc.com
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 12,
        color: '#333',
    },
    subSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        color: '#444',
    },
    text: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
});

export default PrivacyPolicyScreen;
