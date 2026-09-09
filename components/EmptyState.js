import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { fonts } from '../lib/theme';

export default function EmptyState({ icon, title, ctaLabel, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={34} color={colors.inkSoft} />
      <Text style={styles.title}>{title}</Text>
      {ctaLabel ? (
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 20 },
    title: { fontFamily: fonts.body, fontSize: 14.5, color: colors.inkSoft, textAlign: 'center' },
    button: { marginTop: 4, backgroundColor: colors.green, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 18 },
    buttonText: { fontFamily: fonts.bodySemiBold, color: '#fff', fontSize: 14 },
  });
}
