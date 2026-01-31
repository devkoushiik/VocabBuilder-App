import { useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, View, Text } from 'react-native';

/**
 * Modal-based picker for options. Fixes white dropdown modal in dark mode
 * by using a custom Modal with theme-aware background.
 */
const ModalPicker = ({
  selectedValue,
  onValueChange,
  items = [],
  placeholder = 'Select...',
  colors = {},
  theme = 'light',
  style,
  containerStyle,
}) => {
  const [visible, setVisible] = useState(false);

  const normalizedItems = items.map((item) =>
    typeof item === 'string' ? { label: item, value: item } : item
  );

  const selectedLabel =
    normalizedItems.find((i) => String(i.value) === String(selectedValue))?.label || placeholder;

  const modalBg = theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)';
  const contentBg = theme === 'dark' ? '#1A1A1A' : '#ffffff';
  const textColor = theme === 'dark' ? colors.text || '#FFFFFF' : colors.text || '#1f2937';
  const borderColor = theme === 'dark' ? '#2A2A2A' : '#e2e8f0';

  const handleSelect = (value) => {
    onValueChange(value);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={[
          {
            borderWidth: 1,
            borderColor: borderColor,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 8,
            backgroundColor: theme === 'dark' ? contentBg : undefined,
            minHeight: 48,
            justifyContent: 'center',
          },
          containerStyle,
        ]}
      >
        <Text style={{ color: textColor, fontSize: 16 }}>{selectedLabel}</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: modalBg,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: contentBg,
              borderRadius: 12,
              width: '100%',
              maxWidth: 320,
              maxHeight: '70%',
              overflow: 'hidden',
            }}
          >
            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ paddingVertical: 12 }}
              showsVerticalScrollIndicator={true}
            >
              {normalizedItems.map((item) => (
                <TouchableOpacity
                  key={String(item.value)}
                  onPress={() => handleSelect(item.value)}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    marginHorizontal: 8,
                    marginVertical: 2,
                    borderRadius: 8,
                    backgroundColor:
                      String(selectedValue) === String(item.value)
                        ? theme === 'dark'
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(37,99,235,0.1)'
                        : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontSize: 16,
                      fontWeight:
                        String(selectedValue) === String(item.value) ? '600' : '400',
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default ModalPicker;
