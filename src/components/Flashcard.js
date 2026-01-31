import { useState, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';

const Flashcard = ({ card, theme, themeMode = 'light', onMarkDone, showMarkDone, entranceDelay = 0 }) => {
  const [showBack, setShowBack] = useState(false);
  const [sound, setSound] = useState();
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    scaleAnim.setValue(0.92);
    const timer = setTimeout(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }, entranceDelay);
    return () => clearTimeout(timer);
  }, [card?.id, entranceDelay]);

  const handleToggle = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      // Ignore audio errors during interaction
    }
    setShowBack((prev) => {
      const next = !prev;
      Animated.spring(flipAnim, {
        toValue: next ? 1 : 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
      return next;
    });
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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableOpacity
      onPress={handleToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={{ width: '100%' }}
    >
      <Animated.View
        style={[
          cardStyles.card,
          {
            transform: [
              { perspective: 1000 },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {showMarkDone && onMarkDone && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 10,
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: colors.success || '#16a34a',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleMarkDone}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={{ fontSize: 14, color: '#fff', fontWeight: '700' }}>✓</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, position: 'relative' }}>
          <Animated.View
            style={{
              position: 'absolute',
              width: '100%',
              backfaceVisibility: 'hidden',
              transform: [{ rotateY: frontInterpolate }],
            }}
          >
            <Text style={cardStyles.label}>Meaning</Text>
            <Text style={cardStyles.value}>{card.meaning}</Text>
          </Animated.View>
          <Animated.View
            style={{
              position: 'absolute',
              width: '100%',
              backfaceVisibility: 'hidden',
              transform: [{ rotateY: backInterpolate }],
            }}
          >
            <Text style={cardStyles.label}>Vocabulary</Text>
            <Text style={cardStyles.value}>{card.name}</Text>
          </Animated.View>
        </View>
        <Text style={cardStyles.hint}>Tap to flip</Text>
      </Animated.View>
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

