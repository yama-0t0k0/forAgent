// 役割:
// - プロフィール画像と背景画像を編集するための汎用的なスクリーンコンポーネント
// - 個人ユーザーと法人ユーザーの両方で使用可能
//
// 主要機能:
// - 画像URLの入力とプレビュー表示
// - Firestoreへのデータ保存（クリーンアップ機能付き）
// - 保存状態のフィードバック（ローディング、成功、エラー）
// - ボトムナビゲーションのカスタマイズ（render props）
//
// ディレクトリ構造:
// shared/common_frontend/src/features/profile/GenericImageEditScreen.js
//

import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

/**
 * @typedef {Object} ImageConfig
 * @property {string} key - Data key for the image URL
 * @property {string} [label] - Input field label
 * @property {string} [placeholder] - Input placeholder
 * @property {string} [icon] - Icon name for the input field
 * @property {string} [previewLabel] - Label for the image preview
 */

/**
 * @typedef {Object} GenericImageEditScreenProps
 * @property {string} dataSectionKey - Key in DataContext to access the relevant data section
 * @property {string} collectionName - Firestore collection name to save data to
 * @property {string} idFieldKey - Key for the ID field in DataContext
 * @property {ImageConfig} mainImageConfig - Configuration for the main profile image
 * @property {ImageConfig} bgImageConfig - Configuration for the background image
 * @property {function(object): React.ReactNode} [renderBottomNav] - Function to render bottom navigation
 */

/**
 * Generic Image Edit Screen
 * A generic component for editing profile and background images.
 * Supports image URL input, preview, and Firestore saving.
 * 
 * @param {GenericImageEditScreenProps} props
 */
export const GenericImageEditScreen = ({
    dataSectionKey,
    collectionName,
    idFieldKey,
    mainImageConfig,
    bgImageConfig,
    renderBottomNav
}) => {
    const { data, updateValue } = useContext(DataContext);
    const navigation = useNavigation();

    const sectionData = data[dataSectionKey] || {};

    // State
    const [mainUrl, setMainUrl] = useState(sectionData[mainImageConfig.key] || '');
    const [bgUrl, setBgUrl] = useState(sectionData[bgImageConfig.key] || '');
    const [saveStatus, setSaveStatus] = useState('idle');

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            // Update Context
            updateValue([dataSectionKey, mainImageConfig.key], mainUrl);
            updateValue([dataSectionKey, bgImageConfig.key], bgUrl);

            // Firestore Save
            const id = data[idFieldKey];
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
                    [dataSectionKey]: {
                        ...data[dataSectionKey],
                        [mainImageConfig.key]: mainUrl,
                        [bgImageConfig.key]: bgUrl,
                    }
                });

                await setDoc(doc(db, collectionName, id), cleanedData);
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
                    <Text style={styles.sectionTitle}>{String(bgImageConfig.label)}</Text>
                    <TextInput
                        style={styles.input}
                        value={bgUrl}
                        onChangeText={setBgUrl}
                        placeholder={bgImageConfig.placeholder}
                        placeholderTextColor={THEME.subText}
                    />
                    <View style={styles.bgPreviewContainer}>
                        {bgUrl ? (
                            <Image source={{ uri: bgUrl }} style={styles.bgPreview} />
                        ) : (
                            <View style={[styles.bgPreview, styles.placeholder]}>
                                <Ionicons name={bgImageConfig.icon || "image-outline"} size={40} color={THEME.subText} />
                                <Text style={styles.placeholderText}>{bgImageConfig.previewLabel}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Main Image Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{String(mainImageConfig.label)}</Text>
                    <TextInput
                        style={styles.input}
                        value={mainUrl}
                        onChangeText={setMainUrl}
                        placeholder={mainImageConfig.placeholder}
                        placeholderTextColor={THEME.subText}
                    />
                    <View style={styles.profilePreviewContainer}>
                        {mainUrl ? (
                            <Image source={{ uri: mainUrl }} style={styles.profilePreview} />
                        ) : (
                            <View style={[styles.profilePreview, styles.placeholder]}>
                                <Ionicons name={mainImageConfig.icon || "person-outline"} size={40} color={THEME.subText} />
                                <Text style={styles.placeholderText}>{mainImageConfig.previewLabel}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {renderBottomNav && renderBottomNav(navigation)}
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
});
