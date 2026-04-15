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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { validateInvitationCode } from '@shared/src/features/registration/services/registrationService';
import { THEME } from '@shared/src/core/theme/theme';

const PLATFORM_IOS = 'ios';
const KEYBOARD_BEHAVIOR = {
    IOS: 'padding',
    DEFAULT: 'height',
};
const MIN_INVITATION_CODE_LENGTH = 5;

/**
 * Invitation Code Input Screen (Step 1)
 * Premium Antigravity Design
 *
 * @param {object} props
 * @param {object} props.navigation
 * @returns {React.JSX.Element}
 */
const InvitationCodeScreen = ({ navigation }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    /**
     * @returns {Promise<void>}
     */
    const handleVerify = async () => {
        setErrorMessage('');
        if (code.length < MIN_INVITATION_CODE_LENGTH) {
            setErrorMessage('招待コードを入力してください。');
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
                // Use the message returned from the service
                setErrorMessage(result.message || '無効な招待コードです。');
            }
        } catch (error) {
            console.error('[UI] Verification error:', error);
            setErrorMessage('招待コードの検証中に予期せぬエラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === PLATFORM_IOS ? KEYBOARD_BEHAVIOR.IOS : KEYBOARD_BEHAVIOR.DEFAULT}
                style={styles.content}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← キャンセル</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>招待コードを入力</Text>
                    <Text style={styles.subtitle}>
                        本プラットフォームは完全招待制です。{'\n'}
                        お手元の招待コードを入力してください。
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder='6桁〜7桁のコード'
                        placeholderTextColor={THEME.textMuted}
                        value={code}
                        onChangeText={(text) => {
                            setCode(text);
                            if (errorMessage) setErrorMessage('');
                        }}
                        autoCapitalize='characters'
                        maxLength={10}
                        selectionColor={THEME.primary}
                    />
                    <Text style={styles.hint}>※英数字の組み合わせ</Text>
                    
                    {errorMessage ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}
                </View>

                <TouchableOpacity
                    style={[styles.verifyButton, isLoading && styles.disabledButton]}
                    onPress={handleVerify}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={THEME.textPrimary} />
                    ) : (
                        <Text style={styles.verifyButtonText}>確認する</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        招待コードをお持ちでない方は、{'\n'}
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
        backgroundColor: THEME.background,
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
        color: THEME.textMuted,
        fontSize: 16,
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: THEME.textInverse,
        letterSpacing: 1,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.textSecondary,
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: 40,
    },
    input: {
        height: 64,
        borderBottomWidth: 2,
        borderBottomColor: THEME.borderDefault,
        fontSize: 28,
        color: THEME.primary,
        fontWeight: '700', 
        textAlign: 'center',
        letterSpacing: 4,
    },
    hint: {
        marginTop: 12,
        color: THEME.textMuted,
        textAlign: 'center',
        fontSize: 12,
    },
    errorContainer: {
        marginTop: 15,
        backgroundColor: THEME.surfaceError,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.error,
    },
    errorText: {
        color: THEME.error,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    verifyButton: {
        backgroundColor: THEME.primary,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    verifyButtonText: {
        color: THEME.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    disabledButton: {
        backgroundColor: THEME.borderDefault,
        shadowOpacity: 0,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 40,
    },
    footerText: {
        fontSize: 13,
        color: THEME.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default InvitationCodeScreen;
