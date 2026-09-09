import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../lib/HouseholdContext';
import { addShoppingItem, updateShoppingItem } from '../lib/firestoreData';
import { colors, fonts } from '../lib/theme';
import Stepper from '../components/Stepper';

export default function ShoppingForm() {
  const { householdCode } = useHousehold();
  const params = useLocalSearchParams();
  const isEdit = Boolean(params.id);

  const [name, setName] = useState(params.name || '');
  const [quantity, setQuantity] = useState(Number(params.quantity) || 1);
  const [error, setError] = useState('');

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Inserisci il nome del prodotto.');
      return;
    }
    try {
      if (isEdit) {
        await updateShoppingItem(householdCode, params.id, { name: name.trim(), quantity });
      } else {
        await addShoppingItem(householdCode, { name: name.trim(), quantity, checked: false });
      }
      goBack();
    } catch (e) {
      setError('Impossibile salvare: controlla la connessione e riprova.');
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{isEdit ? 'Modifica prodotto' : 'Aggiungi alla lista'}</Text>
        <Pressable onPress={goBack} hitSlop={10}>
          <Ionicons name="close" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <Text style={styles.label}>Nome prodotto</Text>
      <TextInput
        style={styles.input}
        placeholder="Es. Uova"
        placeholderTextColor={colors.inkSoft}
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Text style={styles.label}>Quantità</Text>
      <View style={styles.stepperWrap}>
        <Stepper value={quantity} onChange={setQuantity} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable style={styles.textBtn} onPress={goBack}>
          <Text style={styles.textBtnText}>Annulla</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={handleSave}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>{isEdit ? 'Salva modifiche' : 'Aggiungi'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.displayExtraBold, fontSize: 18, color: colors.ink },
  label: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    padding: 12,
    fontSize: 14.5,
    fontFamily: fonts.body,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  stepperWrap: { maxWidth: 140 },
  error: { color: colors.red, fontFamily: fonts.body, fontSize: 12.5, marginTop: 14 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  textBtn: { paddingVertical: 11, paddingHorizontal: 14 },
  textBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.inkSoft },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.green,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: '#fff' },
});
