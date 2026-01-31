import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

const VocabItem = memo(({ entry, colors, theme, onEdit, onDelete, deletingId, monthLabel }) => {
    const metaText = `${monthLabel || ''} ${entry.year || ''} • ${entry.sortType || '-'}`.trim().replace(/\s+/g, ' ');

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme === 'dark' ? colors.surface : '#fff',
                    borderColor: theme === 'dark' ? colors.borderLight || colors.border : colors.border,
                },
            ]}
        >
            {/* Header: vocab name + meta chip */}
            <View style={styles.header}>
                <Text style={[styles.vocabName, { color: colors.text }]} numberOfLines={1}>
                    {entry.name}
                </Text>
                <View style={[styles.metaChip, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : colors.filterBg || '#eef2ff' }]}>
                    <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                        {metaText}
                    </Text>
                </View>
            </View>

            {/* Meaning content */}
            <Text style={[styles.meaning, { color: colors.textSecondary }]} numberOfLines={4}>
                {entry.meaning}
            </Text>

            {/* Actions */}
            <View style={[styles.actionsRow, { borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.border }]}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.primary }]}
                    onPress={() => onEdit(entry)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.actionEdit, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.error }]}
                    onPress={() => onDelete(entry)}
                    disabled={deletingId === entry.id}
                    activeOpacity={0.7}
                >
                    {deletingId === entry.id ? (
                        <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                        <Text style={[styles.actionDelete, { color: colors.error }]}>Delete</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 6,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
    },
    vocabName: {
        fontSize: 19,
        fontWeight: '700',
        letterSpacing: 0.2,
        flex: 1,
    },
    metaChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    metaText: {
        fontSize: 11,
        fontWeight: '600',
    },
    meaning: {
        fontSize: 15,
        lineHeight: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
    },
    actionEdit: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionDelete: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default VocabItem;
