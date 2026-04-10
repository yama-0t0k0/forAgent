import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { THEME } from '@shared/src/core/theme/theme';
import { SELECTION_LANE, SELECTION_STATUS } from '@shared/src/core/constants';

const DEFAULT_PHASES = [
    '応募_書類選考',
    'カジュアル面談',
    '1次面接',
    '2次面接',
    '最終面接',
    'その他選考',
    'オファー面談',
    '内定',
    '内定受諾',
    '入社_請求',
    '退職日確定',
    '短期離職_返金'
];

/**
 * Component for editing and visualizing the selection flow process.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.initialData - Initial selection data including phases and status
 * @param {Function} props.onSave - Callback function when data is saved
 * @returns {JSX.Element} The rendered component
 */
const SelectionFlowEditor = ({ initialData, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [phases, setPhases] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(null); // id of phase

    useEffect(() => {
        // Bridge logic: Convert initialData (object with booleans) to Array format if needed
        if (initialData && !Array.isArray(initialData.phases)) {
            const convertedPhases = DEFAULT_PHASES.map((label, index) => {
                const isActive = initialData.fase_フェイズ?.[label] || false;
                return {
                    id: `initial-${index}`,
                    label,
                    status: isActive ? SELECTION_STATUS.COMPLETED : SELECTION_STATUS.PENDING,
                    lane: SELECTION_LANE.PRIMARY,
                    date: isActive ? '2025-01-01' : null, // Placeholder for existing data
                };
            });
            // Set current status
            const currentLabel = Object.entries(initialData.status_ステータス || {}).find(([_, v]) => v)?.[0];
            if (currentLabel) {
                // Optionally mark a phase as 'current'
            }
            setPhases(convertedPhases);
        } else if (initialData?.phases) {
            setPhases(initialData.phases);
        }
    }, [initialData]);

    /**
     * Toggles edit mode and saves data if exiting edit mode.
     */
    const toggleEdit = () => {
        if (isEditing) {
            onSave && onSave(phases);
        }
        setIsEditing(!isEditing);
    };

    /**
     * Adds a new phase to the flow.
     * @param {number} lane - The lane index (1 or 2) to add the phase to
     */
    const addPhase = (lane) => {
        const newPhase = {
            id: Date.now().toString(),
            label: '新規ステップ',
            status: SELECTION_STATUS.PENDING,
            lane: lane,
            date: new Date().toISOString().split('T')[0],
        };
        setPhases([...phases, newPhase]);
    };

    /**
     * Deletes a phase by ID.
     * @param {string} id - The ID of the phase to delete
     */
    const deletePhase = (id) => {
        setPhases(phases.filter(p => p.id !== id));
    };

    /**
     * Updates specific properties of a phase.
     * @param {string} id - The ID of the phase to update
     * @param {Object} updates - The properties to update
     */
    const updatePhase = (id, updates) => {
        setPhases(phases.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    /**
     * Moves a phase up or down in the list.
     * @param {number} index - The current index of the phase
     * @param {number} direction - The direction to move (-1 for up, 1 for down)
     */
    const movePhase = (index, direction) => {
        const newPhases = [...phases];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newPhases.length) return;
        const temp = newPhases[index];
        newPhases[index] = newPhases[targetIndex];
        newPhases[targetIndex] = temp;
        setPhases(newPhases);
    };

    /**
     * Handles date change from the date picker.
     * @param {Object} event - The event object
     * @param {Date} selectedDate - The selected date
     * @param {string} id - The ID of the phase being edited
     */
    const onChangeDate = (event, selectedDate, id) => {
        setShowDatePicker(null);
        if (selectedDate) {
            updatePhase(id, { date: selectedDate.toISOString().split('T')[0] });
        }
    };

    /**
     * Renders a single phase box.
     * @param {Object} phase - The phase data object
     * @param {number} index - The index of the phase
     * @returns {JSX.Element} The rendered box component
     */
    const renderBox = (phase, index) => {
        const isToday = phase.date === new Date().toISOString().split('T')[0];

        return (
            <View key={phase.id} style={[styles.boxWrapper, phase.lane === SELECTION_LANE.SECONDARY && styles.lane2Wrapper]}>
                <TouchableOpacity
                    style={[
                        styles.box,
                        phase.status === SELECTION_STATUS.COMPLETED ? styles.boxCompleted : styles.boxPending,
                        phase.lane === SELECTION_LANE.SECONDARY && styles.boxIrregular
                    ]}
                    onPress={() => {
                        // Toggle status logic
                        const nextStatus = phase.status === SELECTION_STATUS.PENDING ? SELECTION_STATUS.COMPLETED : SELECTION_STATUS.PENDING;
                        updatePhase(phase.id, { status: nextStatus });
                    }}
                >
                    {isEditing ? (
                        <View style={styles.editControls}>
                            <TextInput
                                style={styles.boxInput}
                                value={phase.label}
                                onChangeText={(text) => updatePhase(phase.id, { label: text })}
                            />
                            <View style={styles.actionRow}>
                                <TouchableOpacity onPress={() => setShowDatePicker(phase.id)}>
                                    <Text style={[styles.dateText, isToday && styles.todayText]}>
                                        {phase.date || '日付設定'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => updatePhase(phase.id, { lane: phase.lane === SELECTION_LANE.PRIMARY ? SELECTION_LANE.SECONDARY : SELECTION_LANE.PRIMARY })}>
                                    <Ionicons name='swap-horizontal' size={16} color={THEME.textMuted} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deletePhase(phase.id)}>
                                    <Ionicons name='trash' size={16} color={THEME.error} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.reorderRow}>
                                <TouchableOpacity onPress={() => movePhase(index, -1)}>
                                    <Ionicons name='arrow-up' size={18} color={THEME.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => movePhase(index, 1)}>
                                    <Ionicons name='arrow-down' size={18} color={THEME.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.boxLabel}>{phase.label}</Text>
                            <Text style={[styles.dateTextLabel, isToday && styles.todayText]}>
                                {phase.date}
                            </Text>
                            {phase.status === SELECTION_STATUS.COMPLETED && (
                                <View style={styles.checkMark}>
                                    <Ionicons name='checkmark-circle' size={16} color={THEME.success} />
                                </View>
                            )}
                        </>
                    )}
                </TouchableOpacity>
                {showDatePicker === phase.id && (
                    <DateTimePicker
                        value={phase.date ? new Date(phase.date) : new Date()}
                        mode='date'
                        display='default'
                        onChange={(e, d) => onChangeDate(e, d, phase.id)}
                    />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>選考フロー図</Text>
                <TouchableOpacity style={styles.editButton} onPress={toggleEdit}>
                    <Text style={styles.editButtonText}>{isEditing ? '保存' : '編集'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.lanesContainer}>
                <View style={styles.lane}>
                    <Text style={styles.laneTitle}>標準フロー</Text>
                    {phases.filter(p => true).map((p, i) => p.lane === SELECTION_LANE.PRIMARY ? renderBox(p, i) : <View key={`spacer-${p.id}`} style={styles.spacer} />)}
                    {isEditing && (
                        <TouchableOpacity style={styles.addButton} onPress={() => addPhase(SELECTION_LANE.PRIMARY)}>
                            <Ionicons name='add-circle' size={32} color={THEME.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.lane}>
                    <Text style={styles.laneTitle}>イレギュラー</Text>
                    {phases.map((p, i) => p.lane === SELECTION_LANE.SECONDARY ? renderBox(p, i) : <View key={`spacer-${p.id}`} style={styles.spacer} />)}
                    {isEditing && (
                        <TouchableOpacity style={styles.addButton} onPress={() => addPhase(SELECTION_LANE.SECONDARY)}>
                            <Ionicons name='add-circle' size={32} color={THEME.secondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: THEME.spacing.lg,
        padding: THEME.spacing.sm,
        backgroundColor: THEME.background,
        borderRadius: THEME.radius.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.md,
    },
    title: {
        ...THEME.typography.h3,
        color: THEME.textPrimary,
    },
    editButton: {
        paddingHorizontal: THEME.spacing.sm,
        paddingVertical: THEME.spacing.xs,
        backgroundColor: THEME.primary,
        borderRadius: THEME.radius.sm,
    },
    editButtonText: {
        color: THEME.textInverse,
        fontSize: 12,
        fontWeight: 'bold',
    },
    lanesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    lane: {
        flex: 1,
        alignItems: 'center',
    },
    laneTitle: {
        ...THEME.typography.caption,
        color: THEME.textSecondary,
        marginBottom: THEME.spacing.sm,
        fontWeight: '600',
    },
    boxWrapper: {
        width: '90%',
        marginBottom: THEME.spacing.sm,
        alignItems: 'center',
    },
    lane2Wrapper: {
        // Additional styling for lane 2 wrappers if needed
    },
    box: {
        width: '100%',
        padding: THEME.spacing.sm,
        borderRadius: THEME.radius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
        backgroundColor: THEME.surface,
        ...THEME.shadow.sm,
    },
    boxCompleted: {
        borderColor: THEME.success,
        borderLeftWidth: 4,
    },
    boxPending: {
        borderColor: THEME.borderDefault,
    },
    boxIrregular: {
        borderColor: THEME.secondary,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    boxLabel: {
        ...THEME.typography.bodySmall,
        color: THEME.textPrimary,
        fontWeight: '600',
        textAlign: 'center',
    },
    boxInput: {
        ...THEME.typography.bodySmall,
        color: THEME.textPrimary,
        fontWeight: '600',
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderDefault,
        width: '100%',
        marginBottom: THEME.spacing.xs,
    },
    dateTextLabel: {
        ...THEME.typography.micro,
        color: THEME.textSecondary,
        marginTop: 4,
    },
    dateText: {
        ...THEME.typography.micro,
        color: THEME.primary,
        textDecorationLine: 'underline',
    },
    todayText: {
        color: THEME.error,
        fontWeight: 'bold',
    },
    checkMark: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    editControls: {
        width: '100%',
        alignItems: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: THEME.spacing.xs,
    },
    reorderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
        marginTop: THEME.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: THEME.borderLight,
        paddingTop: THEME.spacing.xs,
    },
    addButton: {
        marginTop: THEME.spacing.sm,
    },
    spacer: {
        height: 60,
        width: '100%',
    },
});

export default SelectionFlowEditor;