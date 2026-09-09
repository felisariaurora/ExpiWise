import { useMemo } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { fonts } from '../lib/theme';
import { formatDate } from '../lib/dates';
import { getLocation } from '../lib/locations';

export default function ProductRow({ product, badge, onPress, onAddToList, onDelete, justAddedToList }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusColor = useMemo(
    () => ({
      ok: colors.green,
      warning: colors.amber,
      expired: colors.red,
      household: colors.inkSoft,
    }),
    [colors]
  );

  const loc = getLocation(product.location);
  const barColor = statusColor[product.status] || colors.inkSoft;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.bar, { backgroundColor: barColor }]} />
      {product.photo ? (
        <Image source={{ uri: product.photo }} style={styles.thumb} />
      ) : null}
      <View style={styles.main}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          {product.quantity > 1 && (
            <View style={styles.qtyPill}>
              <Text style={styles.qtyPillText}>×{product.quantity}</Text>
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          <Ionicons name={loc.icon} size={12} color={colors.inkSoft} />
          <Text style={styles.metaText}>{loc.label}</Text>
          {product.expiryDate ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metaText}>
                {product.days < 0 ? 'scaduto il' : 'scade il'} {formatDate(product.expiryDate)}
              </Text>
            </>
          ) : null}
        </View>
      </View>
      <View style={styles.side}>
        {badge ? (
          <View style={styles.badge}>
            <Text style={[styles.badgeBig, { color: product.status === 'ok' ? colors.ink : barColor }]}>
              {badge.big}
            </Text>
            <Text style={styles.badgeSmall}>{badge.small}</Text>
          </View>
        ) : null}
        <Pressable style={styles.iconBtn} onPress={onAddToList} hitSlop={8}>
          <Ionicons
            name={justAddedToList ? 'checkmark' : 'cart-outline'}
            size={16}
            color={justAddedToList ? colors.green : colors.inkSoft}
          />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={colors.inkSoft} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    bar: { width: 4, borderRadius: 3 },
    thumb: { width: 40, height: 40, borderRadius: 8, alignSelf: 'center' },
    main: { flex: 1, justifyContent: 'center', gap: 4 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontFamily: fonts.bodySemiBold, fontSize: 15.5, color: colors.ink, flexShrink: 1 },
    qtyPill: { backgroundColor: colors.greenSoft, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 1 },
    qtyPillText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.green },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft },
    dot: { color: colors.inkSoft, opacity: 0.6 },
    side: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    badge: { alignItems: 'center', minWidth: 38, marginRight: 4 },
    badgeBig: { fontFamily: fonts.displayExtraBold, fontSize: 18 },
    badgeSmall: { fontFamily: fonts.body, fontSize: 10, color: colors.inkSoft, marginTop: 1 },
    iconBtn: { padding: 6 },
  });
}
