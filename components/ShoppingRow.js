import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { fonts } from '../lib/theme';
import { formatDateTime } from '../lib/dates';

export default function ShoppingRow({ item, onToggle, onPress, onDelete, onMoveToStock }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Pressable onPress={onToggle} hitSlop={8} style={styles.checkBtn}>
        <Ionicons
          name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={item.checked ? colors.green : colors.inkSoft}
        />
      </Pressable>
      <Pressable style={styles.main} onPress={onPress}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, item.checked && styles.nameChecked]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.quantity > 1 && (
            <View style={styles.qtyPill}>
              <Text style={styles.qtyPillText}>×{item.quantity}</Text>
            </View>
          )}
        </View>
        {item.createdAt ? (
          <Text style={styles.metaText} numberOfLines={1}>
            {item.checked
              ? `Comprato il ${formatDateTime(item.boughtAt || item.createdAt)}`
              : `Aggiunto il ${formatDateTime(item.createdAt)}`}
          </Text>
        ) : null}
      </Pressable>
      {item.checked && (
        <Pressable style={styles.moveBtn} onPress={onMoveToStock}>
          <Text style={styles.moveBtnText}>In dispensa</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.ink} />
        </Pressable>
      )}
      <Pressable style={styles.iconBtn} onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={15} color={colors.inkSoft} />
      </Pressable>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    checkBtn: { padding: 2 },
    main: { flex: 1, justifyContent: 'center', gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, flexShrink: 1 },
    nameChecked: { color: colors.inkSoft, textDecorationLine: 'line-through' },
    metaText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft },
    qtyPill: { backgroundColor: colors.greenSoft, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 1 },
    qtyPillText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.green },
    moveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: colors.surface,
    },
    moveBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.ink },
    iconBtn: { padding: 6 },
  });
}
