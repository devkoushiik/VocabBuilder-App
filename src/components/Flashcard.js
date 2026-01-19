import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Flashcard = ({ card, theme, themeMode = 'light' }) => {
  const [showBack, setShowBack] = useState(false);

  const handleToggle = () => setShowBack((prev) => !prev);

  // Use theme colors if provided
  const colors = theme || {};
  const cardStyles = {
    card: {
      backgroundColor: colors.flashcardBg || '#eff6ff',
      borderRadius: 12,
      padding: 24,
      paddingHorizontal: 20,
      minHeight: 200,
      width: '100%',
      justifyContent: 'space-between',
      shadowColor: colors.primary || '#3b82f6',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      borderWidth: 1,
      borderColor: colors.flashcardBorder || '#dbeafe',
      marginBottom: 0,
    },
    label: {
      fontSize: 14,
      color: colors.flashcardLabel || colors.primary || '#1e40af',
      marginBottom: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    value: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.flashcardValue || colors.text || '#1e3a8a',
      lineHeight: 24,
    },
    hint: {
      fontSize: 12,
      color: colors.flashcardHint || colors.primary || '#3b82f6',
      alignSelf: 'flex-end',
      fontWeight: '500',
    },
  };

  return (
    <TouchableOpacity style={cardStyles.card} onPress={handleToggle}>
      <View>
        <Text style={cardStyles.label}>{showBack ? 'Vocabulary' : 'Meaning'}</Text>
        <Text style={cardStyles.value}>{showBack ? card.name : card.meaning}</Text>
      </View>
      <Text style={cardStyles.hint}>Tap to flip</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 24,
    paddingHorizontal: 20,
    minHeight: 200,
    justifyContent: 'space-between',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  label: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
    lineHeight: 24,
  },
  hint: {
    fontSize: 12,
    color: '#3b82f6',
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
});

export default Flashcard;

