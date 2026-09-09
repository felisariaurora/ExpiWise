import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../../lib/HouseholdContext';
import { subscribeSettings, updateSettings } from '../../lib/firestoreData';
import { colors, fonts } from '../../lib/theme';

const THRESHOLDS = [1, 3, 5, 7];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { householdCode, leaveHousehold } = useHousehold();
  const [settings, setSettings] = useState({ threshold: 3 });

  useEffect(() => {
    if (!householdCode) return;
    return subscribeSettings(householdCode, setSettings);
  }, [householdCode]);

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
      <View style={[styles.heroHeader, { marginTop: insets.top + 12 }]}>
        <Ionicons name="settings" size={18} color="#fff" />
        <Text style={styles.brand}>Impostazioni</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
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
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.cream,
  },
  chipActive: { backgroundColor: colors.pillAmber, borderColor: colors.pillAmber },
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
  leaveBtn: { marginTop: 'auto', marginHorizontal: 20, marginBottom: 30, alignItems: 'center', paddingVertical: 12 },
  leaveBtnText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.red },
});
