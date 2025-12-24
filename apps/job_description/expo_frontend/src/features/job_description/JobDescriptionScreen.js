// 機能概要:
// - 求人詳細画面 (Job Description Screen)
// - 求職者（エンジニア）とのマッチングに使用される「スキル・志向ヒートマップ」を表示
// - jd.jsonのデータを基に、職種名やスキル要件を可視化
// - 不要な装飾（背景画像、ユーザー写真等）を排除し、求人情報にフォーカスしたUI
//
// 主要機能:
// - ポジション名（職種）の表示
// - スキル要件のヒートマップ表示
// - 求人内容編集機能（編集ボタン）
// - 求人詳細情報の閲覧（ボタン）
//
// ディレクトリ構造:
// ├── src/
// │   ├── features/
// │   │   └── job_description/
// │   │       └── JobDescriptionScreen.js (本ファイル)
//
// 依存関係:
// - @shared/src/core/theme/theme (テーマ設定)
// - assets/json/jd.json (求人データ)

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Load local JSON data directly for this screen
const jdData = require('../../../../assets/json/jd.json');

const { width } = Dimensions.get('window');

export const JobDescriptionScreen = () => {
    const navigation = useNavigation();

    // Extract data from jd.json
    // "求人基本項目" -> "ポジション名"
    const positionName = jdData['求人基本項目']?.['ポジション名'] || 'ポジション名未設定';

    // Heatmap grid (90 tiles) - Mock visualization for now
    // Ideally this would be colored based on jdData['スキル経験'] match logic
    const skillGrid = Array(90).fill(0).map((_, i) => ({
        id: i,
        color: i % 4 === 0 ? THEME.accent :
            i % 4 === 1 ? '#7DD3FC' :
                i % 4 === 2 ? '#38BDF8' : '#0369A1'
    }));

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                    
                    {/* 1. Header Area - Minimalist, no background image */}
                    <View style={styles.headerContainer}>
                        {/* Edit Button (Top Right) - Kept per instruction */}
                        <View style={styles.headerActionContainer}>
                             <TouchableOpacity 
                                style={styles.editButton} 
                                onPress={() => console.log('Edit Job Description')}
                            >
                                <Ionicons name="create-outline" size={24} color={THEME.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Position Name Plate (Reused NamePlate style) */}
                        <View style={styles.namePlateContainer}>
                            <View style={styles.namePlate}>
                                <Text style={styles.positionLabel}>募集中ポジション</Text>
                                <Text style={styles.positionNameText}>{positionName}</Text>
                            </View>
                        </View>
                    </View>

                    {/* 2. Glassmorphism Badges (Skill Requirements) */}
                    {/* Kept as per "everything ABOVE badges is deleted" implication */}
                    <View style={styles.badgeSection}>
                        <View style={styles.tradingCardRow}>
                            {['必須スキル', '歓迎スキル1', '歓迎スキル2'].map((label, index) => {
                                const skills = ['サーバサイド', 'クラウド', 'CI/CD']; // Mock data
                                const icons = ["star", "medal", "trophy"];
                                return (
                                    <View key={index} style={styles.tradingCard}>
                                        <Text style={styles.cardLabel}>{label}</Text>
                                        <View style={styles.glassBadge}>
                                            <Text style={styles.cardSkillName}>{skills[index]}</Text>
                                            <Ionicons
                                                name={icons[index]}
                                                size={18}
                                                color={THEME.accent}
                                            />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* 3. Heatmap Section */}
                    <View style={styles.heatmapSection}>
                        <View style={styles.heatmapHeader}>
                            <Text style={styles.heatmapTitle}>スキル・志向ヒートマップ</Text>
                            <View style={styles.chatBotIconSmall}>
                                <Ionicons name="chatbubble-outline" size={14} color={THEME.text} />
                            </View>
                        </View>

                        <View style={styles.heatmapGrid}>
                            {skillGrid.map((item) => (
                                <View key={item.id} style={[styles.heatmapTile, { backgroundColor: item.color }]} />
                            ))}
                        </View>

                         {/* Chatbot Callout (kept for consistency with heatmap UI?) 
                             Instruction didn't explicitly delete heatmap internal elements, 
                             but "everything above badges" was the main deletion target. 
                             I'll keep it as it's part of the heatmap "feature". 
                         */}
                        <View style={styles.chatBotCallout}>
                            <Ionicons name="chatbubble-ellipses" size={40} color={THEME.accent} />
                            <Text style={styles.labelYellow}>AI分析</Text>
                        </View>
                    </View>

                    {/* Whitespace buffer */}
                    <View style={{ height: 40 }} />

                </ScrollView>

                {/* 4. Center Button (Renamed to Job Detail) - No Footer */}
                <View style={styles.bottomButtonContainer}>
                    <TouchableOpacity style={styles.centerButton}>
                        <Text style={styles.centerButtonText}>求人詳細</Text>
                        <Ionicons name="chevron-down" size={20} color="#FFF" style={{ marginTop: -2 }} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 80, // Space for bottom button
    },
    headerContainer: {
        paddingHorizontal: 15,
        paddingTop: 10,
        marginBottom: 20,
    },
    headerActionContainer: {
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    editButton: {
        padding: 8,
        backgroundColor: '#E0F2FE', // Light blue background for visibility
        borderRadius: 20,
    },
    namePlateContainer: {
        width: '100%',
        alignItems: 'center',
    },
    namePlate: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    positionLabel: {
        fontSize: 12,
        color: THEME.subText,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    positionNameText: {
        fontSize: 20,
        fontWeight: '800',
        color: THEME.text,
        textAlign: 'center',
    },
    badgeSection: {
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    tradingCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tradingCard: {
        width: (width - 45) / 3,
        alignItems: 'center',
    },
    cardLabel: {
        color: THEME.subText, // Changed from white as background is gone
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 5,
    },
    glassBadge: {
        width: '100%',
        aspectRatio: 1.1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // More opaque since no dark bg
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardSkillName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0284C7',
        marginBottom: 4,
        textAlign: 'center',
    },
    heatmapSection: {
        marginHorizontal: 15,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    heatmapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    heatmapTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: THEME.text,
    },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 3,
    },
    heatmapTile: {
        width: (width - 30 - 30 - (3 * 8)) / 9, // Adjusted for padding and gaps
        aspectRatio: 1,
        borderRadius: 3,
    },
    chatBotCallout: {
        position: 'absolute',
        bottom: -10,
        right: -5,
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    labelYellow: {
        fontSize: 9,
        fontWeight: 'bold',
        color: THEME.accent,
        marginTop: -2,
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    centerButton: {
        backgroundColor: THEME.accent,
        width: 140,
        height: 44,
        borderRadius: 22,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: THEME.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        gap: 5,
    },
    centerButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
