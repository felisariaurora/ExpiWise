import { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../../lib/HouseholdContext';
import { useTheme } from '../../lib/ThemeContext';
import { subscribeSettings, updateSettings, subscribeWasteLog } from '../../lib/firestoreData';
import { fonts } from '../../lib/theme';
import { LOCATIONS } from '../../lib/locations';
import IconPickerModal from '../../components/IconPickerModal';

const THRESHOLDS = [1, 3, 5, 7];
const THEME_OPTIONS = [
  { id: 'system', label: 'Automatico', icon: 'phone-portrait-outline' },
  { id: 'light', label: 'Chiaro', icon: 'sunny-outline' },
  { id: 'dark', label: 'Scuro', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { householdCode, leaveHousehold } = useHousehold();
  const [settings, setSettings] = useState({ threshold: 3 });
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [wasteLog, setWasteLog] = useState([]);

  useEffect(() => {
    if (!householdCode) return;
    return subscribeSettings(householdCode, setSettings);
  }, [householdCode]);

  useEffect(() => {
    if (!householdCode) return;
    return subscribeWasteLog(householdCode, setWasteLog);
  }, [householdCode]);

  const wasteByLocation = useMemo(() => {
    const counts = {};
    wasteLog.forEach((w) => {
      counts[w.location] = (counts[w.location] || 0) + 1;
    });
    return LOCATIONS.map((loc) => ({
      loc: { ...loc, icon: settings.locationIcons?.[loc.id] || loc.icon },
      count: counts[loc.id] || 0,
    }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [wasteLog, settings.locationIcons]);

  function confirmLeave() {
    Alert.alert(
      'Lasciare questa dispensa?',
      'Non vedrai più i prodotti condivisi su questo telefono. Potrai rientrare in qualsiasi momento con lo stesso codice.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            await leaveHousehold();
            router.replace('/onboarding');
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroHeader, { marginTop: insets.top + 12 }]}>
        <Ionicons name="settings" size={18} color="#fff" />
        <Text style={styles.brand}>Impostazioni</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Aspetto</Text>
        <View style={styles.chips}>
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.chip, preference === opt.id && styles.chipActive]}
              onPress={() => setPreference(opt.id)}
            >
              <Ionicons
                name={opt.icon}
                size={14}
                color={preference === opt.id ? '#fff' : colors.ink}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.chipText, preference === opt.id && styles.chipTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Avvisami quando manca</Text>
        <View style={styles.chips}>
          {THRESHOLDS.map((t) => (
            <Pressable
              key={t}
              style={[styles.chip, settings.threshold === t && styles.chipActive]}
              onPress={() => updateSettings(householdCode, { ...settings, threshold: t })}
            >
              <Text style={[styles.chipText, settings.threshold === t && styles.chipTextActive]}>{t} giorni</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Icone delle zone</Text>
        {LOCATIONS.map((loc) => (
          <Pressable key={loc.id} style={styles.locationRow} onPress={() => setEditingLocationId(loc.id)}>
            <View style={styles.locationIconBox}>
              <Ionicons name={settings.locationIcons?.[loc.id] || loc.icon} size={18} color={colors.amberDark} />
            </View>
            <Text style={styles.locationRowText}>{loc.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Statistiche spreco</Text>
        {wasteLog.length === 0 ? (
          <Text style={styles.statsEmpty}>Nessun prodotto scaduto buttato finora — ottimo lavoro! 🎉</Text>
        ) : (
          <>
            <Text style={styles.statsTotal}>
              {wasteLog.length} prodott{wasteLog.length === 1 ? 'o scaduto buttato' : 'i scaduti buttati'} finora
            </Text>
            {wasteByLocation.map(({ loc, count }) => (
              <View key={loc.id} style={styles.statsRow}>
                <Ionicons name={loc.icon} size={14} color={colors.inkSoft} />
                <Text style={styles.statsRowText}>{loc.label}</Text>
                <Text style={styles.statsRowCount}>{count}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Il vostro codice famiglia</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{householdCode}</Text>
        </View>
        <Pressable
          style={styles.rowBtn}
          onPress={() =>
            Share.share({
              message: `Usa questo codice per collegarti alla nostra dispensa condivisa su Expiwise: ${householdCode}`,
            })
          }
        >
          <Ionicons name="share-outline" size={17} color={colors.amberDark} />
          <Text style={styles.rowBtnText}>Condividi il codice</Text>
        </Pressable>
      </View>

      <Pressable style={styles.leaveBtn} onPress={confirmLeave}>
        <Text style={styles.leaveBtnText}>Lascia questa dispensa</Text>
      </Pressable>
      </ScrollView>

      <IconPickerModal
        visible={Boolean(editingLocationId)}
        title={editingLocationId ? `Icona per "${LOCATIONS.find((l) => l.id === editingLocationId)?.label}"` : undefined}
        selected={editingLocationId ? settings.locationIcons?.[editingLocationId] : null}
        onSelect={(name) =>
          updateSettings(householdCode, {
            ...settings,
            locationIcons: { ...(settings.locationIcons || {}), [editingLocationId]: name },
          })
        }
        onClose={() => setEditingLocationId(null)}
      />
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    scrollContent: { paddingBottom: 40 },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.pillAmber,
      marginHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 20,
      shadowColor: colors.amberDark,
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    brand: { fontFamily: fonts.displayExtraBold, fontSize: 19, color: '#fff' },
    card: {
      marginTop: 16,
      marginHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    sectionTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.inkSoft, marginBottom: 10 },
    chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.cream,
    },
    chipActive: { backgroundColor: colors.pillAmber, borderColor: colors.pillAmber },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    locationIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.pillAmberSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationRowText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
    statsEmpty: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
    statsTotal: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink, marginBottom: 10 },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 7,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    statsRowText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.ink },
    statsRowCount: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.amberDark },
    chipText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink },
    chipTextActive: { color: '#fff', fontFamily: fonts.bodySemiBold },
    codeBox: {
      borderRadius: 12,
      backgroundColor: colors.pillAmberSoft,
      paddingVertical: 16,
      alignItems: 'center',
    },
    code: { fontFamily: fonts.displayBlack, fontSize: 24, letterSpacing: 4, color: colors.amberDark },
    rowBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingVertical: 6 },
    rowBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.amberDark },
    leaveBtn: { marginTop: 24, marginHorizontal: 20, alignItems: 'center', paddingVertical: 12 },
    leaveBtnText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.red },
  });
}
