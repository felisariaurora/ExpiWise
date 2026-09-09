import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../lib/HouseholdContext';
import { useTheme } from '../lib/ThemeContext';
import { fonts } from '../lib/theme';

export default function Onboarding() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { setHouseholdCode, generateCode } = useHousehold();
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [generatedCode, setGeneratedCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  function startCreate() {
    setGeneratedCode(generateCode());
    setMode('create');
  }

  async function confirmCreate() {
    await setHouseholdCode(generatedCode);
    router.replace('/(tabs)');
  }

  async function confirmJoin() {
    if (joinCode.trim().length < 4) {
      setError('Inserisci il codice che ti ha mandato chi vive con te.');
      return;
    }
    await setHouseholdCode(joinCode);
    router.replace('/(tabs)');
  }

  if (mode === 'create') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Il vostro codice famiglia</Text>
        <Text style={styles.subtitle}>
          Condividilo con chi vive con te: dovrà inserirlo per vedere la stessa dispensa e lista della spesa.
        </Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{generatedCode}</Text>
        </View>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() =>
            Share.share({
              message: `Usa questo codice per collegarti alla nostra dispensa condivisa su Expiwise: ${generatedCode}`,
            })
          }
        >
          <Ionicons name="share-outline" size={16} color={colors.green} />
          <Text style={styles.secondaryBtnText}>Condividi il codice</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={confirmCreate}>
          <Text style={styles.primaryBtnText}>Continua</Text>
        </Pressable>
        <Pressable onPress={() => setMode(null)}>
          <Text style={styles.link}>Indietro</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === 'join') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>Inserisci il codice famiglia</Text>
        <Text style={styles.subtitle}>Chiedilo a chi ha già creato la dispensa condivisa.</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. K7M2QX"
          placeholderTextColor={colors.inkSoft}
          autoCapitalize="characters"
          autoCorrect={false}
          value={joinCode}
          onChangeText={(t) => {
            setJoinCode(t);
            setError('');
          }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.primaryBtn} onPress={confirmJoin}>
          <Text style={styles.primaryBtnText}>Continua</Text>
        </Pressable>
        <Pressable onPress={() => setMode(null)}>
          <Text style={styles.link}>Indietro</Text>
        </Pressable>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="home-outline" size={40} color={colors.green} />
      <Text style={styles.title}>Expiwise</Text>
      <Text style={styles.subtitle}>Tieni traccia di cibo e prodotti per la casa, insieme a chi vive con te.</Text>
      <Pressable style={styles.primaryBtn} onPress={startCreate}>
        <Text style={styles.primaryBtnText}>Crea una nuova dispensa</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => setMode('join')}>
        <Text style={styles.secondaryBtnText}>Ho già un codice</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.paper,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
      gap: 14,
    },
    title: { fontFamily: fonts.displayExtraBold, fontSize: 22, color: colors.ink, textAlign: 'center' },
    subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 20 },
    codeBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 30,
      marginTop: 6,
    },
    code: { fontFamily: fonts.displayBlack, fontSize: 30, letterSpacing: 4, color: colors.green },
    input: {
      width: '100%',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      padding: 12,
      fontSize: 18,
      fontFamily: fonts.displayBold,
      textAlign: 'center',
      letterSpacing: 3,
      backgroundColor: colors.surface,
      color: colors.ink,
    },
    error: { color: colors.red, fontFamily: fonts.body, fontSize: 12.5 },
    primaryBtn: {
      backgroundColor: colors.green,
      borderRadius: 10,
      paddingVertical: 13,
      paddingHorizontal: 26,
      width: '100%',
      alignItems: 'center',
      marginTop: 4,
    },
    primaryBtnText: { color: '#fff', fontFamily: fonts.bodySemiBold, fontSize: 15 },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16 },
    secondaryBtnText: { color: colors.green, fontFamily: fonts.bodySemiBold, fontSize: 14 },
    link: { color: colors.inkSoft, fontFamily: fonts.body, fontSize: 13, marginTop: 6 },
  });
}
