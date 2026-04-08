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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    
    // Animation
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Define steps based on type
    const individualSteps = [
        { key: 'name', label: '氏名を教えてください', placeholder: '山田 太郎', type: 'text' },
        { key: 'name_eng', label: '氏名（ローマ字）を教えてください', placeholder: 'Taro Yamada', type: 'text' },
        { key: 'email', label: '連絡用メールアドレス', placeholder: 'example@lat-inc.com', type: 'email' },
        { key: 'phone', label: '電話番号をご入力ください', placeholder: '09012345678', type: 'phone' },
        { key: 'occupation', label: '現在の主な職種は何ですか？', placeholder: 'エンジニア / デザイナー 等', type: 'text' },
    ];

    const corporateSteps = [
        { key: 'company_name', label: '正式な会社名を教えてください', placeholder: '株式会社LaT', type: 'text' },
        { key: 'position', label: '部署名・役職を教えてください', placeholder: '人事部 採用担当', type: 'text' },
        { key: 'contact_name', label: 'ご担当者様の氏名を入力してください', placeholder: '山田 太郎', type: 'text' },
        { key: 'work_email', label: '会社用メールアドレス', placeholder: 'recruiting@company.com', type: 'email' },
        { key: 'work_phone', label: '会社の電話番号', placeholder: '0312345678', type: 'phone' },
    ];

    const steps = isCorporate ? corporateSteps : individualSteps;
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

    const handleNext = () => {
        const val = formData[currentStepConfig.key];
        if (!val || val.length < 2) {
            return; // Simple validation
        }

        if (currentStep < steps.length - 1) {
            animateTransition(() => setCurrentStep(currentStep + 1));
        } else {
            // Final submission (Phase 1: Mock Success)
            navigation.navigate('Home', { registrationSuccess: true });
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
                        keyboardType={currentStepConfig.type === 'phone' ? 'phone-pad' : 'default'}
                        autoCapitalize="none"
                    />
                </Animated.View>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[
                            styles.nextButton, 
                            !(formData[currentStepConfig.key]?.length >= 2) && styles.disabledButton
                        ]} 
                        onPress={handleNext}
                        disabled={!(formData[currentStepConfig.key]?.length >= 2)}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentStep === steps.length - 1 ? '登録を完了する' : '次へ進む'}
                        </Text>
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
