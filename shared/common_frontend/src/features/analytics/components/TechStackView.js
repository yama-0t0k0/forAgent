import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';
import { PLATFORM, DATA_TYPE } from '@shared/src/core/constants/system';
import { Company } from '@shared/src/core/models/Company';

// Enable LayoutAnimation on Android
if (Platform.OS === PLATFORM.ANDROID) {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

/**
 * Component to display the technology stack and features of a company.
 * 
 * @param {Object} props
 * @param {Object} props.features - The features of the company.
 * @param {Object} props.techStack - The technology stack of the company.
 * @returns {JSX.Element} The rendered view.
 */
export const TechStackView = ({ features, techStack }) => {
    /**
     * Renders a single technology item.
     * @param {string} label - The label of the item.
     * @param {string} main - The main technology.
     * @param {string} sub - The sub technology.
     * @param {string} iconName - The icon name.
     * @returns {JSX.Element} The rendered item.
     */
    const renderTechItem = (label, main, sub, iconName) => (
        <View style={styles.techItemContainer}>
            <View style={styles.techHeader}>
                <Ionicons name={iconName} size={14} color={THEME.subText} style={{ marginRight: 4 }} />
                <Text style={styles.techLabel}>{label}</Text>
            </View>
            <View style={styles.techBadgeContainer}>
                <View style={[styles.techBadge, styles.techBadgeMain]}>
                    <Text style={styles.techBadgeTextMain}>{String(main || '-')}</Text>
                </View>
                {sub && (
                    <View style={[styles.techBadge, styles.techBadgeSub]}>
                        <Text style={styles.techBadgeTextSub}>{String(sub)}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false); // Default collapsed

    /**
     * Toggles the visibility of the features section.
     */
    const toggleFeatures = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsFeaturesExpanded(!isFeaturesExpanded);
    };

    // Safe access helpers
    /**
     * Helper to safely access language data.
     * @param {string} type - The type of language.
     * @returns {Object} The language data.
     */
    const getLang = (type) => techStack?.languages?.[type] || {};
    /**
     * Helper to safely access other tech data.
     * @param {string} type - The type of tech.
     * @returns {Object} The tech data.
     */
    const getOther = (type) => techStack?.others?.[type] || {};

    return (
        <ScrollView contentContainerStyle={styles.tabScrollContent} bounces={false}>
            {/* 1. Tech Stack Section */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>使用技術</Text>
                <View style={styles.techGrid}>
                    <View style={styles.techColumn}>
                        <Text style={styles.subSectionTitle}>言語</Text>
                        {renderTechItem('Backend', getLang('backend').main, getLang('backend').sub, 'server-outline')}
                        {renderTechItem('Frontend', getLang('frontend').main, getLang('frontend').sub, 'desktop-outline')}
                    </View>
                    <View style={styles.techColumn}>
                        <Text style={styles.subSectionTitle}>その他</Text>
                        {renderTechItem('Framework', getOther('framework').main, getOther('framework').sub, 'layers-outline')}
                        {renderTechItem('Cloud', getOther('cloud').main, getOther('cloud').sub, 'cloud-outline')}
                        {renderTechItem('DB', getOther('database').main, getOther('database').sub, 'server-outline')}
                        {renderTechItem('Tools', getOther('tools').main, getOther('tools').sub, 'construct-outline')}
                    </View>
                </View>
            </View>

            {/* 2. Features/Accordion Section */}
            <View style={[styles.sectionContainer, { marginBottom: 80 }]}>
                <TouchableOpacity style={styles.accordionHeader} onPress={toggleFeatures}>
                    <Text style={styles.sectionTitle}>魅力/特徴</Text>
                    <Ionicons name={isFeaturesExpanded ? "chevron-up" : "chevron-down"} size={24} color={THEME.text} />
                </TouchableOpacity>

                {isFeaturesExpanded && (
                    <View style={styles.accordionContent}>
                        {Object.entries(features).map(([key, value]) => {
                            if (typeof value === DATA_TYPE.BOOLEAN) {
                                return (
                                    <View key={key} style={styles.featureItem}>
                                        <Ionicons
                                            name={value ? "checkmark-circle" : "close-circle"}
                                            size={18}
                                            color={value ? THEME.success : THEME.subText}
                                        />
                                        <Text style={[styles.featureText, !value && { color: THEME.subText }]}>{key}</Text>
                                    </View>
                                );
                            }
                            return null;
                        })}
                        {features[Company.FIELDS.APPEAL_OTHER] ? (
                            <View style={styles.featureNote}>
                                <Text style={styles.featureNoteText}>{String(features[Company.FIELDS.APPEAL_OTHER])}</Text>
                            </View>
                        ) : null}
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    tabScrollContent: {
        paddingTop: 15,
        paddingBottom: 0,
    },
    sectionContainer: {
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.text,
        marginBottom: 10,
    },
    subSectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: THEME.subText,
        marginBottom: 8,
        marginTop: 4,
    },
    techGrid: {
        flexDirection: 'row',
        gap: 15,
    },
    techColumn: {
        flex: 1,
    },
    techItemContainer: {
        marginBottom: 10,
    },
    techHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    techLabel: {
        fontSize: 11,
        color: THEME.subText,
        fontWeight: '600',
    },
    techBadgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    techBadge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 4,
        borderWidth: 1,
    },
    techBadgeMain: {
        backgroundColor: '#F0F9FF',
        borderColor: '#BAE6FD',
    },
    techBadgeSub: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    techBadgeTextMain: {
        fontSize: 11,
        color: '#0369A1',
        fontWeight: '700',
    },
    techBadgeTextSub: {
        fontSize: 10,
        color: '#64748B',
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
        paddingBottom: 10,
        marginBottom: 10,
    },
    accordionContent: {
        marginTop: 5,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        marginLeft: 10,
        fontSize: 14,
        color: THEME.text,
    },
    featureNote: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: THEME.accent,
    },
    featureNoteText: {
        fontSize: 13,
        color: THEME.subText,
        lineHeight: 18,
    },
});
