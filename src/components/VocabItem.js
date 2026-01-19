import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

const VocabItem = memo(({ entry, colors, theme, onEdit, onDelete, deletingId, monthLabel }) => {
    return (
        <View
            style={[
                styles.vocabItem,
                {
                    borderColor: colors.border,
                    backgroundColor: theme === 'dark' ? colors.surface : '#fff',
                    borderRadius: 16,
                    borderWidth: 1,
                    marginHorizontal: 10,
                    paddingHorizontal: 16,
                }
            ]}
        >
            <View style={styles.vocabInfo}>
                <Text style={[styles.vocabName, { color: colors.text }]}>{entry.name}</Text>
                <Text style={[styles.vocabMeaning, { color: colors.textSecondary }]}>{entry.meaning}</Text>
                <Text style={[styles.vocabMeta, { color: colors.textMuted }]}>
                    {monthLabel} {entry.year} • Sort {entry.sortType}
                </Text>
            </View>
            <View style={styles.vocabActions}>
                <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() => onEdit(entry)}
                >
                    <Text style={[styles.editAction, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() => onDelete(entry)}
                    disabled={deletingId === entry.id}
                >
                    {deletingId === entry.id ? (
                        <ActivityIndicator color={colors.error} />
                    ) : (
                        <Text style={[styles.deleteAction, { color: colors.error }]}>Delete</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    vocabItem: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    vocabInfo: {
        marginBottom: 12,
        gap: 4,
    },
    vocabName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    vocabMeaning: {
        color: '#475569',
    },
    vocabMeta: {
        color: '#94a3b8',
        fontSize: 13,
    },
    vocabActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#cbd5f5',
    },
    editAction: {
        color: '#2563eb',
        fontWeight: '600',
    },
    deleteAction: {
        color: '#dc2626',
        fontWeight: '600',
    },
});

export default VocabItem;
