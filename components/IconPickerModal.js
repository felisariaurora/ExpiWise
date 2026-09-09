import { useMemo } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { fonts } from '../lib/theme';

export const ICON_OPTIONS = [
  'nutrition-outline',
  'leaf-outline',
  'fish-outline',
  'egg-outline',
  'pizza-outline',
  'fast-food-outline',
  'ice-cream-outline',
  'restaurant-outline',
  'cafe-outline',
  'wine-outline',
  'beer-outline',
  'water-outline',
  'sparkles-outline',
  'medical-outline',
  'paw-outline',
  'shirt-outline',
];

export default function IconPickerModal({ visible, selected, onSelect, onClose, title = "Scegli un'icona" }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.grid}>
            {ICON_OPTIONS.map((name) => {
              const active = selected === name;
              return (
                <Pressable
                  key={name}
                  style={[styles.item, active && styles.itemActive]}
                  onPress={() => {
                    onSelect(name);
                    onClose();
                  }}
                >
                  <Ionicons name={name} size={22} color={active ? '#fff' : colors.ink} />
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(32,41,31,0.45)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 20,
      gap: 14,
    },
    title: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    item: {
      width: 52,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    itemActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  });
}
