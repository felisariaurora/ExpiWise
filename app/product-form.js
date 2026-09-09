import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useHousehold } from '../lib/HouseholdContext';
import { useTheme } from '../lib/ThemeContext';
import { addProduct, updateProduct, deleteShoppingItem } from '../lib/firestoreData';
import { formatDate, dateToISO } from '../lib/dates';
import { fonts } from '../lib/theme';
import { LOCATIONS } from '../lib/locations';
import Stepper from '../components/Stepper';

export default function ProductForm() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { householdCode } = useHousehold();
  const params = useLocalSearchParams();
  const isEdit = Boolean(params.id);

  const [name, setName] = useState(params.name || '');
  const [location, setLocation] = useState(params.location || 'frigo');
  const [expiryDate, setExpiryDate] = useState(params.expiryDate || '');
  const [dateText, setDateText] = useState(formatDate(params.expiryDate || ''));
  const [quantity, setQuantity] = useState(Number(params.quantity) || 1);
  const [barcode, setBarcode] = useState(params.barcode || '');
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [lookup, setLookup] = useState({ loading: false, message: '', tone: '' });

  async function lookupBarcode(code) {
    const value = (code ?? barcode).trim();
    if (!value) return;
    setLookup({ loading: true, message: '', tone: '' });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(value)}.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      const foundName = data?.product?.product_name_it || data?.product?.product_name || data?.product?.generic_name;
      if (data.status === 1 && foundName) {
        setName(foundName);
        setLookup({ loading: false, message: 'Prodotto trovato.', tone: 'ok' });
      } else {
        setLookup({ loading: false, message: 'Non trovato: inserisci il nome a mano.', tone: 'warn' });
      }
    } catch (e) {
      setLookup({ loading: false, message: 'Ricerca non disponibile: inserisci il nome a mano.', tone: 'warn' });
    }
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  function selectLocation(id) {
    setLocation(id);
    if (id === 'casa') {
      setExpiryDate('');
      setDateText('');
    }
  }

  function formatDateInputText(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  function parseDateInput(text) {
    const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return dateToISO(date);
  }

  function handleDateTextChange(raw) {
    const formatted = formatDateInputText(raw);
    setDateText(formatted);
    const iso = parseDateInput(formatted);
    if (iso) setExpiryDate(iso);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Inserisci il nome del prodotto.');
      return;
    }
    let finalExpiryDate = '';
    if (location !== 'casa') {
      if (!dateText.trim()) {
        setError('Inserisci una data di scadenza.');
        return;
      }
      finalExpiryDate = parseDateInput(dateText);
      if (!finalExpiryDate) {
        setError('Data non valida: usa il formato GG/MM/AAAA.');
        return;
      }
    }
    const data = {
      name: name.trim(),
      location,
      expiryDate: finalExpiryDate,
      quantity,
      barcode: barcode.trim(),
    };
    try {
      if (isEdit) {
        await updateProduct(householdCode, params.id, data);
      } else {
        await addProduct(householdCode, data);
      }
      if (params.fromShoppingId) {
        await deleteShoppingItem(householdCode, params.fromShoppingId);
      }
      goBack();
    } catch (e) {
      setError('Impossibile salvare: controlla la connessione e riprova.');
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {params.fromShoppingId ? 'Sposta in dispensa' : isEdit ? 'Modifica prodotto' : 'Nuovo prodotto'}
          </Text>
          <Pressable onPress={goBack} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <Text style={styles.label}>Codice a barre (facoltativo)</Text>
        <View style={styles.barcodeRow}>
          <View style={styles.inputWithIcon}>
            <Ionicons name="barcode-outline" size={16} color={colors.inkSoft} />
            <TextInput
              style={styles.inputInline}
              placeholder="Es. 8001234567890"
              placeholderTextColor={colors.inkSoft}
              keyboardType="number-pad"
              value={barcode}
              onChangeText={setBarcode}
            />
          </View>
          <Pressable style={styles.scanBtn} onPress={() => setShowScanner(true)}>
            <Ionicons name="camera-outline" size={18} color={colors.ink} />
          </Pressable>
          <Pressable
            style={[styles.outlineBtn, (!barcode.trim() || lookup.loading) && styles.btnDisabled]}
            onPress={() => lookupBarcode()}
            disabled={!barcode.trim() || lookup.loading}
          >
            <Text style={styles.outlineBtnText}>{lookup.loading ? '...' : 'Cerca'}</Text>
          </Pressable>
        </View>
        {lookup.message ? (
          <Text style={[styles.lookupMsg, { color: lookup.tone === 'ok' ? colors.green : colors.amber }]}>
            {lookup.message}
          </Text>
        ) : null}

        <Text style={styles.label}>Nome prodotto</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. Latte intero"
          placeholderTextColor={colors.inkSoft}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Dove si trova</Text>
        <View style={styles.locGroup}>
          {LOCATIONS.map((loc) => {
            const active = location === loc.id;
            return (
              <Pressable
                key={loc.id}
                style={[styles.locBtn, active && styles.locBtnActive]}
                onPress={() => selectLocation(loc.id)}
              >
                <Ionicons name={loc.icon} size={17} color={active ? colors.green : colors.inkSoft} />
                <Text style={[styles.locBtnText, active && styles.locBtnTextActive]}>{loc.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.formRow}>
          {location !== 'casa' && (
            <View style={styles.formCol}>
              <Text style={styles.label}>Scadenza</Text>
              <View style={styles.dateRow}>
                <TextInput
                  style={styles.dateTextInput}
                  placeholder="GG/MM/AAAA"
                  placeholderTextColor={colors.inkSoft}
                  keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
                  value={dateText}
                  onChangeText={handleDateTextChange}
                  maxLength={10}
                />
                {Platform.OS !== 'web' && (
                  <Pressable style={styles.calendarBtn} onPress={() => setShowDatePicker(true)} hitSlop={6}>
                    <Ionicons name="calendar-outline" size={18} color={colors.ink} />
                  </Pressable>
                )}
              </View>
            </View>
          )}
          <View style={styles.formCol}>
            <Text style={styles.label}>Quantità</Text>
            <Stepper value={quantity} onChange={setQuantity} />
          </View>
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
      </ScrollView>

      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)}>
          <Pressable style={styles.datePickerSheet} onPress={(e) => e.stopPropagation()}>
            <DateTimePicker
              value={expiryDate ? new Date(`${expiryDate}T00:00:00`) : new Date()}
              mode="date"
              display="inline"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  const iso = dateToISO(selectedDate);
                  setExpiryDate(iso);
                  setDateText(formatDate(iso));
                }
              }}
            />
            <Pressable style={styles.primaryBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.primaryBtnText}>Fatto</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={(data) => {
          setShowScanner(false);
          setBarcode(data);
          lookupBarcode(data);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function ScannerModal({ visible, onClose, onScanned }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      scannedRef.current = false;
      if (!permission?.granted) requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.scannerContainer}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
            onBarcodeScanned={({ data }) => {
              if (scannedRef.current) return;
              scannedRef.current = true;
              onScanned(data);
            }}
          />
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>Serve il permesso per usare la fotocamera.</Text>
            <Pressable style={styles.primaryBtn} onPress={requestPermission}>
              <Text style={styles.primaryBtnText}>Consenti fotocamera</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.scannerFrame} pointerEvents="none" />
        <Pressable style={styles.scannerClose} onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.scannerHint}>Inquadra il codice a barre del prodotto</Text>
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.paper },
    content: { padding: 20, paddingBottom: 40 },
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
    barcodeRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
    inputWithIcon: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
    },
    inputInline: { flex: 1, paddingVertical: 12, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink },
    scanBtn: {
      width: 42,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlineBtn: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    outlineBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.ink },
    btnDisabled: { opacity: 0.5 },
    lookupMsg: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 6 },
    locGroup: { flexDirection: 'row', gap: 6 },
    locBtn: {
      flex: 1,
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      paddingVertical: 10,
      backgroundColor: colors.surface,
    },
    locBtnActive: { borderColor: colors.green, backgroundColor: colors.greenSoft },
    locBtnText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft },
    locBtnTextActive: { color: colors.green, fontFamily: fonts.bodySemiBold },
    formRow: { flexDirection: 'row', gap: 12 },
    formCol: { flex: 1 },
    dateRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
    dateTextInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      padding: 12,
      fontSize: 14,
      fontFamily: fonts.body,
      backgroundColor: colors.surface,
      color: colors.ink,
    },
    calendarBtn: {
      width: 42,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
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
    overlay: { flex: 1, backgroundColor: 'rgba(32,41,31,0.45)', justifyContent: 'flex-end' },
    datePickerSheet: { backgroundColor: colors.paper, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, gap: 14 },
    scannerContainer: { flex: 1, backgroundColor: '#000' },
    permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 30 },
    permissionText: { color: '#fff', fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
    scannerFrame: {
      position: 'absolute',
      top: '30%',
      left: '12%',
      right: '12%',
      height: '22%',
      borderWidth: 2,
      borderColor: '#fff',
      borderRadius: 16,
    },
    scannerClose: {
      position: 'absolute',
      top: 56,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scannerHint: {
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
      textAlign: 'center',
      color: '#fff',
      fontFamily: fonts.body,
      fontSize: 13,
    },
  });
}
