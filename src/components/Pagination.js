import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Pagination = ({ total, currentIndex, onSelect }) => {
  if (!total) return null;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !canGoPrev && styles.disabled]}
        onPress={() => canGoPrev && onSelect(currentIndex - 1)}
        disabled={!canGoPrev}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.indicators}>
        {Array.from({ length: total }).map((_, idx) => (
          <TouchableOpacity
            key={`dot-${idx}`}
            style={[styles.dot, idx === currentIndex && styles.activeDot]}
            onPress={() => onSelect(idx)}
          >
            <Text style={styles.dotLabel}>{idx + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !canGoNext && styles.disabled]}
        onPress={() => canGoNext && onSelect(currentIndex + 1)}
        disabled={!canGoNext}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  disabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  indicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
    flex: 1,
  },
  dot: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  activeDot: {
    backgroundColor: '#2563eb',
  },
  dotLabel: {
    color: '#2563eb',
    fontSize: 12,
  },
});

export default Pagination;

