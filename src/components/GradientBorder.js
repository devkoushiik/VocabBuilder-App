import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GradientBorder = ({ children, colors, style, borderRadius = 12 }) => {
  return (
    <View style={[{ borderRadius, width: '100%', alignSelf: 'stretch' }, style]}>
      <LinearGradient
        colors={colors || ['#a78bfa', '#14b8a6', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius, padding: 2, width: '100%' }}
      >
        <View style={{ borderRadius: borderRadius - 2, overflow: 'hidden', width: '100%', alignSelf: 'stretch' }}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
};

export default GradientBorder;

