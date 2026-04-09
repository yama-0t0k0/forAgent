import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../features/firebase/config';
import { 
    GoogleAuthProvider, 
    GithubAuthProvider, 
    signInWithPopup, 
    signInWithRedirect 
} from 'firebase/auth';

import registrationService from '@shared/src/features/registration/services/registrationService';

const { width } = Dimensions.get('window');

/**
 * Registration Method Selection Screen (Step 3)
 * Premium Antigravity Design
 * Choice: Google, GitHub, or Email
 */
const RegistrationMethodScreen = ({ navigation, route }) => {
    const { invitationInfo } = route.params || {};
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSelectMethod = async (method) => {
        if (method === 'email') {
            navigation.navigate('RegistrationForm', { 
                invitationInfo,
                authMethod: method 
            });
            return;
        }

        setIsLoading(true);
        try {
            let provider;
            if (method === 'google') {
                provider = new GoogleAuthProvider();
            } else if (method === 'github') {
                provider = new GithubAuthProvider();
            }

            if (Platform.OS === 'web') {
                const result = await signInWithPopup(auth, provider);
                console.log(`[Method] Social Auth Success: ${result.user.email}`);
                
                // Check for draft
                const draft = await registrationService.getRegistrationDraft(result.user.uid);
                if (draft) {
                    Alert.alert(
                        '登録の再開',
                        '以前の登録データが見つかりました。中断した場所から再開しますか？',
                        [
                            { 
                                text: '最初から', 
                                style: 'cancel',
                                onPress: () => navigation.navigate('RegistrationForm', { invitationInfo, authMethod: method })
                            },
                            { 
                                text: '再開する', 
                                onPress: () => navigation.navigate('RegistrationForm', { 
                                    invitationInfo, 
                                    authMethod: method,
                                    resumeData: draft.formData
                                })
                            }
                        ]
                    );
                } else {
                    navigation.navigate('RegistrationForm', { 
                        invitationInfo,
                        authMethod: method 
                    });
                }
            } else {
                // For Native: signInWithRedirect is the standard for Expo
                // Note: Requires extra config in app.json for deep linking
                Alert.alert(
                    'Social Auth', 
                    'Mobile環境でのSocial Loginには追加設定が必要です。Emailでの登録をお試しください。',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('[Method] Auth Error:', error);
            Alert.alert('認証エラー', '外部サービスとの連携に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← 戻る</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.titleArea}>
                    <Text style={styles.welcomeText}>Welcome to LAT</Text>
                    <Text style={styles.title}>アカウント作成方法を選択</Text>
                    <Text style={styles.subtitle}>
                        {invitationInfo?.type === 'corporate' ? '法人担当者' : '個人'}アカウントとして{"\n"}
                        登録を継続します。
                    </Text>
                </View>

                <View style={styles.buttonStack}>
                    {/* Google Button */}
                    <TouchableOpacity 
                        style={[styles.methodButton, styles.googleButton]} 
                        onPress={() => handleSelectMethod('google')}
                    >
                        <View style={styles.iconPlaceholder}>
                            <Text style={styles.iconText}>G</Text>
                        </View>
                        <Text style={[styles.methodButtonText, styles.googleButtonText]}>Google で登録</Text>
                    </TouchableOpacity>

                    {/* GitHub Button */}
                    <TouchableOpacity 
                        style={[styles.methodButton, styles.githubButton]} 
                        onPress={() => handleSelectMethod('github')}
                    >
                        <View style={styles.iconPlaceholderDark}>
                            <Text style={styles.iconTextWhite}>Git</Text>
                        </View>
                        <Text style={styles.methodButtonText}>GitHub で登録</Text>
                    </TouchableOpacity>

                    <View style={styles.separator}>
                        <View style={styles.line} />
                        <Text style={styles.separatorText}>または</Text>
                        <View style={styles.line} />
                    </View>

                    {/* Email Button */}
                    <TouchableOpacity 
                        style={[styles.methodButton, styles.emailButton]} 
                        onPress={() => handleSelectMethod('email')}
                    >
                        <Text style={styles.methodButtonText}>メールアドレスで登録</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        登録を進めることで、利用規約および{"\n"}
                        個人情報保護方針に同意したものとみなされます。
                    </Text>
                </View>
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#00E5FF" />
                    </View>
                )}
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
        height: 60,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    backButton: {
        paddingVertical: 10,
    },
    backButtonText: {
        color: '#999',
        fontSize: 16,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    titleArea: {
        marginBottom: 60,
    },
    welcomeText: {
        color: '#7C4DFF', // Neon Purple
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    title: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 12,
    },
    subtitle: {
        color: '#666',
        fontSize: 16,
        lineHeight: 24,
    },
    buttonStack: {
        gap: 16,
    },
    methodButton: {
        height: 60,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#333',
    },
    googleButton: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    googleButtonText: {
        color: '#000',
    },
    githubButton: {
        backgroundColor: '#1C1C1E',
        borderColor: '#444',
    },
    emailButton: {
        backgroundColor: '#7C4DFF',
        borderColor: '#7C4DFF',
        justifyContent: 'center',
    },
    methodButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 15,
    },
    iconPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F1F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconPlaceholderDark: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4285F4', // Google Blue
    },
    iconTextWhite: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#333',
    },
    separatorText: {
        color: '#555',
        marginHorizontal: 15,
        fontSize: 14,
    },
    footer: {
        marginTop: 60,
    },
    footerText: {
        color: '#444',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RegistrationMethodScreen;
