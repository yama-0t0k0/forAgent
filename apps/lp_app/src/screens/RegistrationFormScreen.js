import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../features/firebase/config';
import { createUserWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import registrationService, { registerUser } from '@shared/src/features/registration/services/registrationService';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * Registration Form Screen (Step 4)
 * - Step-by-step (one-by-one) input style.
 * - Branches based on invitationType.
 * - Minimalist & Premium Design.
 */
const RegistrationFormScreen = ({ navigation, route }) => {
    const { invitationInfo, authMethod } = route.params || {};
    const isCorporate = invitationInfo?.type === 'corporate';

    // Step state
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Animation
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Define steps based on type
    // Define steps
    const individualSteps = [
        { key: 'family_name', label: '姓を教えてください', placeholder: '山田', type: 'text' },
        { key: 'first_name', label: '名を教えてください', placeholder: '太郎', type: 'text' },
        { key: 'family_name_eng', label: '姓（ローマ字）', placeholder: 'Yamada', type: 'text' },
        { key: 'first_name_eng', label: '名（ローマ字）', placeholder: 'Taro', type: 'text' },
        { key: 'email', label: '連絡用メールアドレス', placeholder: 'example@lat-inc.com', type: 'email' },
        { key: 'phone', label: '電話番号', placeholder: '09012345678', type: 'phone' },
        { key: 'occupation', label: '現在の職種', placeholder: 'エンジニア / デザイナー 等', type: 'text' },
    ];

    const corporateSteps = [
        { key: 'company_name', label: '正式な会社名を教えてください', placeholder: '株式会社LaT', type: 'text' },
        { key: 'position', label: '部署名・役職を教えてください', placeholder: '人事部 採用担当', type: 'text' },
        { key: 'work_email', label: '会社用メールアドレス', placeholder: 'recruiting@company.com', type: 'email' },
        { key: 'work_phone', label: '会社の電話番号', placeholder: '0312345678', type: 'phone' },
    ];

    // Password step conditionally
    const passwordStep = authMethod === 'email' 
        ? [{ key: 'password', label: 'ログイン用パスワードを設定してください', placeholder: '8文字以上', type: 'password' }]
        : [];

    // Hybrid logic: If corporate, do BOTH. If individual, just individual.
    const steps = isCorporate 
        ? [...individualSteps, ...passwordStep, ...corporateSteps] 
        : [...individualSteps, ...passwordStep];

    const isLastIndividualStep = currentStep === (individualSteps.length + passwordStep.length - 1);

    const currentStepConfig = steps[currentStep];

    const animateTransition = (callback) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true })
        ]).start(() => {
            callback();
            slideAnim.setValue(20);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
            ]).start();
        });
    };

    const handleNext = async () => {
        const val = formData[currentStepConfig.key];
        if (!val || val.length < (currentStepConfig.key === 'password' ? 8 : (currentStepConfig.key === 'phone' ? 10 : 2))) {
            Alert.alert('入力エラー', `${currentStepConfig.label}を正しく入力してください。`);
            return;
        }

        // Logic for transition or next step
        if (isCorporate && isLastIndividualStep) {
            handleTransitionToCorporate();
        } else if (currentStep < steps.length - 1) {
            // Auto-save if we are in corporate phase (where uid exists)
            if (isCorporate && currentStep >= individualSteps.length + passwordStep.length) {
                registrationService.autoSaveDraft(formData);
            }
            animateTransition(() => setCurrentStep(currentStep + 1));
        } else {
            handleFinalSubmit();
        }
    };

    const handleTransitionToCorporate = async () => {
        setIsLoading(true);
        try {
            console.log('[Registration] Finalizing individual phase...');
            
            // 1. Auth (if email)
            let user = auth.currentUser;
            if (authMethod === 'email' && !user) {
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                user = userCredential.user;
            }

            // 2. Register as Individual first
            await registerUser(formData, 'individual', invitationInfo?.code);
            
            console.log('[Registration] Individual phase complete. Moving to corporate.');
            animateTransition(() => setCurrentStep(currentStep + 1));
        } catch (error) {
            console.error('[Registration] Transition Error:', error);
            Alert.alert('エラー', 'プロフィールの保存に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        try {
            console.log('[Registration] Starting final submission...');

            // 1. Authentication (if not already authenticated via Social)
            let user = auth.currentUser;
            
            if (authMethod === 'email' && !user) {
                const email = formData.email || formData.work_email;
                const password = formData.password;
                
                console.log(`[Registration] Creating user with email: ${email}`);
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
            }

            if (!user) {
                throw new Error('認証に失敗しました。もう一度やり直してください。');
            }

            // 2. Final Firestore Sync
            const finalRole = isCorporate ? 'corporate' : 'individual';
            const result = await registerUser(
                formData, 
                finalRole, 
                isCorporate ? null : invitationInfo?.code // Code used in transition if corporate
            );

            if (result.success) {
                // Clear draft upon success
                // registrationService.clearDraft() // Optional
                Alert.alert('登録完了', '全ての登録が完了しました。', [
                    { text: 'OK', onPress: () => navigation.navigate('Home', { registrationSuccess: true }) }
                ]);
            }
        } catch (error) {
            console.error('[Registration] Submit Error:', error);
            let message = '登録処理中にエラーが発生しました。';
            
            // Firebase Auth Errors
            if (error.code === 'auth/email-already-in-use') {
                message = 'このメールアドレスは既に登録されています。\nログイン画面からログインするか、別のメールアドレスをお試しください。';
            } else if (error.code === 'auth/invalid-email') {
                message = 'メールアドレスの形式が正しくありません。';
            } else if (error.code === 'auth/weak-password') {
                message = 'パスワードが短すぎます。8文字以上で設定してください。';
            } else if (error.code === 'auth/network-request-failed') {
                message = 'ネットワーク接続に失敗しました。通信環境を確認してください。';
            } 
            // Firestore / Generic Errors
            else if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                message = 'セキュリティ権限エラーが発生しました。\n招待コードが正しく反映されていないか、通信に問題がある可能性があります。再度お試しください。';
            } else if (error.message) {
                message = error.message;
            }

            Alert.alert('登録エラー', message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            animateTransition(() => setCurrentStep(currentStep - 1));
        } else {
            navigation.goBack();
        }
    };

    const updateValue = (text) => {
        setFormData({ ...formData, [currentStepConfig.key]: text });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← 戻る</Text>
                    </TouchableOpacity>
                    <View style={styles.progressContainer}>
                        <View 
                            style={[
                                styles.progressBar, 
                                { width: `${((currentStep + 1) / steps.length) * 100}%` }
                            ]} 
                        />
                    </View>
                </View>

                <Animated.View style={[
                    styles.formArea,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <Text style={styles.stepIndicator}>Step {currentStep + 1} / {steps.length}</Text>
                    <Text style={styles.label}>{currentStepConfig.label}</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder={currentStepConfig.placeholder}
                        placeholderTextColor="#444"
                        value={formData[currentStepConfig.key] || ''}
                        onChangeText={updateValue}
                        autoFocus={true}
                        selectionColor="#00E5FF"
                        keyboardType={currentStepConfig.type === 'phone' ? 'phone-pad' : (currentStepConfig.type === 'email' ? 'email-address' : 'default')}
                        autoCapitalize="none"
                        secureTextEntry={currentStepConfig.type === 'password'}
                    />
                </Animated.View>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[
                            styles.nextButton, 
                            !(formData[currentStepConfig.key]?.length >= 2) && styles.disabledButton
                        ]} 
                        onPress={handleNext}
                        disabled={isLoading || !(formData[currentStepConfig.key]?.length >= (currentStepConfig.key === 'password' ? 8 : 2))}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.nextButtonText}>
                                {currentStep === steps.length - 1 ? '登録を完了する' : '次へ進む'}
                            </Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.footerHint}>送信した情報は厳重に管理されます。</Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
    },
    header: {
        marginTop: 10,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        paddingVertical: 10,
        marginRight: 20,
    },
    backButtonText: {
        color: '#666',
        fontSize: 14,
    },
    progressContainer: {
        flex: 1,
        height: 4,
        backgroundColor: '#1A1A1A',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#00E5FF',
    },
    formArea: {
        flex: 1,
        justifyContent: 'center',
    },
    stepIndicator: {
        color: '#00E5FF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 12,
    },
    label: {
        color: '#FFF',
        fontSize: 26,
        fontWeight: '800',
        lineHeight: 36,
        marginBottom: 40,
    },
    input: {
        fontSize: 24,
        color: '#FFF',
        borderBottomWidth: 2,
        borderBottomColor: '#333',
        paddingVertical: 15,
        fontWeight: '600',
    },
    footer: {
        marginBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    nextButton: {
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
    disabledButton: {
        backgroundColor: '#222',
        shadowOpacity: 0,
    },
    nextButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerHint: {
        color: '#444',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 20,
    }
});

export default RegistrationFormScreen;
