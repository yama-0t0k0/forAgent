import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export const ImageEditScreen = () => {
    const { data, updateValue } = useContext(DataContext);
    const navigation = useNavigation();

    // Local state for temporary editing
    const companyInfo = data['会社概要'] || {};
    const [logoUrl, setLogoUrl] = useState(companyInfo['ロゴ画像URL'] || '');
    const [backgroundUrl, setBackgroundUrl] = useState(companyInfo['背景画像URL'] || '');
    const [saveStatus, setSaveStatus] = useState('idle');

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            // Update context (ensure '会社概要' exists or handle it)
            // Assuming '会社概要' exists as per template
            updateValue(['会社概要', 'ロゴ画像URL'], logoUrl);
            updateValue(['会社概要', '背景画像URL'], backgroundUrl);

            // Persist to Firestore
            const idField = 'id';
            const id = data[idField];

            if (id) {
                const cleanData = (input) => {
                    if (input === null || typeof input !== 'object') return input;
                    if (Array.isArray(input)) return input.map(cleanData);
                    const output = {};
                    Object.keys(input).forEach(key => {
                        if (!key.startsWith('_')) output[key] = cleanData(input[key]);
                    });
                    return output;
                };

                const cleanedData = cleanData({
                    ...data,
                    ['会社概要']: {
                        ...data['会社概要'],
                        'ロゴ画像URL': logoUrl,
                        '背景画像URL': backgroundUrl,
                    }
                });

                await setDoc(doc(db, 'company', id), cleanedData);
            }

            setSaveStatus('success');
            setTimeout(() => {
                setSaveStatus('idle');
                navigation.goBack();
            }, 1500);
        } catch (error) {
            console.error("Error saving images: ", error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>画像変更</Text>
                <TouchableOpacity
                    style={[styles.saveButton, saveStatus === 'success' && styles.saveButtonSuccess]}
                    onPress={handleSave}
                    disabled={saveStatus === 'saving'}
                >
                    {saveStatus === 'saving' ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {saveStatus === 'success' ? 'Saved' : 'Save'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Background Image Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>背景画像 URL</Text>
                    <TextInput
                        style={styles.input}
                        value={backgroundUrl}
                        onChangeText={setBackgroundUrl}
                        placeholder="https://example.com/background.jpg"
                        placeholderTextColor={THEME.subText}
                    />
                    <View style={styles.bgPreviewContainer}>
                        {backgroundUrl ? (
                            <Image source={{ uri: backgroundUrl }} style={styles.bgPreview} />
                        ) : (
                            <View style={[styles.bgPreview, styles.placeholder]}>
                                <Ionicons name="image-outline" size={40} color={THEME.subText} />
                                <Text style={styles.placeholderText}>背景プレビュー</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Logo Image Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ロゴ画像 URL</Text>
                    <TextInput
                        style={styles.input}
                        value={logoUrl}
                        onChangeText={setLogoUrl}
                        placeholder="https://example.com/logo.jpg"
                        placeholderTextColor={THEME.subText}
                    />
                    <View style={styles.profilePreviewContainer}>
                        {logoUrl ? (
                            <Image source={{ uri: logoUrl }} style={styles.profilePreview} />
                        ) : (
                            <View style={[styles.profilePreview, styles.placeholder]}>
                                <Ionicons name="business-outline" size={40} color={THEME.subText} />
                                <Text style={styles.placeholderText}>ロゴプレビュー</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Jobs')}>
                    <Ionicons name="briefcase-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>求人</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Connections')}>
                    <Ionicons name="people-circle-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>つながり</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TechStack')}>
                    <Ionicons name="code-slash-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>使用技術</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Blog')}>
                    <Ionicons name="newspaper-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>ブログ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Events')}>
                    <Ionicons name="calendar-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>イベント</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Menu')}>
                    <Ionicons name="grid-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>メニュー</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        backgroundColor: THEME.background,
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: THEME.text,
    },
    saveButton: {
        backgroundColor: THEME.accent,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    saveButtonSuccess: {
        backgroundColor: THEME.success,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 14,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.text,
        marginBottom: 10,
    },
    input: {
        backgroundColor: THEME.cardBg,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: THEME.text,
        marginBottom: 15,
    },
    bgPreviewContainer: {
        width: '100%',
        aspectRatio: 2.5,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        backgroundColor: '#F3F4F6',
    },
    bgPreview: {
        width: '100%',
        height: '100%',
    },
    profilePreviewContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: THEME.cardBorder,
        backgroundColor: '#F3F4F6',
    },
    profilePreview: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 5,
        fontSize: 12,
        color: THEME.subText,
        fontWeight: '600',
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        height: 85,
        borderTopWidth: 1,
        borderTopColor: THEME.cardBorder,
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    navText: {
        color: THEME.subText,
        fontSize: 9,
        marginTop: 4,
        fontWeight: '600',
    },
});
