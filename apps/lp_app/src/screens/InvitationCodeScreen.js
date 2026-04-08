import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { validateInvitationCode } from '../../../shared/common_frontend/src/features/registration/services/registrationService';

const { width } = Dimensions.get('window');

/**
 * Invitation Code Input Screen (Step 1)
 * Premium Antigravity Design
 */
const InvitationCodeScreen = ({ navigation }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async () => {
        if (code.length < 5) {
            Alert.alert('入力エラー', '招待コードを入力してください。');
            return;
        }

        setIsLoading(true);
        try {
            const result = await validateInvitationCode(code);
            if (result.isValid) {
                // Navigate to Privacy Policy with the verified code info
                navigation.navigate('PrivacyPolicy', { 
                    invitationInfo: result.invitationInfo 
                });
            } else {
                Alert.alert('不整合', '無効な招待コードです。');
            }
        } catch (error) {
            Alert.alert('エラー', '招待コードの検証に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← キャンセル</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>招待コードを入力</Text>
                    <Text style={styles.subtitle}>
                        本プラットフォームは完全招待制です。{"\n"}
                        お手元の招待コードを入力してください。
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="6桁〜7桁のコード"
                        placeholderTextColor="#666"
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="characters"
                        maxLength={10}
                        selectionColor="#00E5FF"
                    />
                    <Text style={styles.hint}>※英数字の組み合わせ</Text>
                </View>

                <TouchableOpacity
                    style={[styles.verifyButton, isLoading && styles.disabledButton]}
                    onPress={handleVerify}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.verifyButtonText}>確認する</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        招待コードをお持ちでない方は、{"\n"}
                        公式サイトよりウェイトリストにご登録ください。
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A', // Deep Black
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
    },
    backButton: {
        marginTop: 20,
        paddingVertical: 10,
    },
    backButtonText: {
        color: '#999',
        fontSize: 16,
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#AAA',
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: 40,
    },
    input: {
        height: 64,
        borderBottomWidth: 2,
        borderBottomColor: '#333',
        fontSize: 28,
        color: '#00E5FF', // Neon Cyan
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 4,
    },
    hint: {
        marginTop: 12,
        color: '#555',
        textAlign: 'center',
        fontSize: 12,
    },
    verifyButton: {
        backgroundColor: '#00E5FF',
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00E5FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    verifyButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    disabledButton: {
        backgroundColor: '#333',
        shadowOpacity: 0,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 40,
    },
    footerText: {
        fontSize: 13,
        color: '#444',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default InvitationCodeScreen;
