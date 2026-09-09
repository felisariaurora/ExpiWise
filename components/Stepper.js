import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { fonts } from '../lib/theme';

export default function Stepper({ value, onChange, min = 1 }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Pressable style={styles.btn} onPress={() => onChange(Math.max(min, value - 1))} hitSlop={8}>
        <Ionicons name="remove" size={16} color={colors.ink} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable style={styles.btn} onPress={() => onChange(value + 1)} hitSlop={8}>
        <Ionicons name="add" size={16} color={colors.ink} />
      </Pressable>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
    },
    btn: { padding: 4 },
    value: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink },
  });
}
