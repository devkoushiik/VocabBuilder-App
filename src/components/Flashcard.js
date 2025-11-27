import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Flashcard = ({ card }) => {
  const [showBack, setShowBack] = useState(false);

  const handleToggle = () => setShowBack((prev) => !prev);

  return (
    <TouchableOpacity style={styles.card} onPress={handleToggle}>
      <View>
        <Text style={styles.label}>{showBack ? 'Vocabulary' : 'Meaning'}</Text>
        <Text style={styles.value}>{showBack ? card.name : card.meaning}</Text>
      </View>
      <Text style={styles.hint}>Tap to flip</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 24,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  label: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e3a8a',
    lineHeight: 30,
  },
  hint: {
    fontSize: 12,
    color: '#3b82f6',
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
});

export default Flashcard;

