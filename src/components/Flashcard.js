import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';

const Flashcard = ({ card, theme, themeMode = 'light', onMarkDone, showMarkDone }) => {
  const [showBack, setShowBack] = useState(false);
  const [sound, setSound] = useState();

  useEffect(() => {
    let soundObj;
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3' }
        );
        soundObj = sound;
        setSound(sound);
      } catch (error) {
        console.warn('Failed to load flashcard sound:', error);
      }
    };
    loadSound();

    return () => {
      if (soundObj) {
        soundObj.unloadAsync();
      }
    };
  }, []);

  const handleToggle = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      // Ignore audio errors during interaction
    }
    setShowBack((prev) => !prev);
  };

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

  const handleMarkDone = (e) => {
    e?.stopPropagation?.();
    onMarkDone?.(card);
  };

  return (
    <TouchableOpacity style={cardStyles.card} onPress={handleToggle} activeOpacity={0.9}>
      {showMarkDone && onMarkDone && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.success || '#16a34a',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={handleMarkDone}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 20, color: '#fff' }}>✓</Text>
        </TouchableOpacity>
      )}
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

