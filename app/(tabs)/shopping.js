import { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../../lib/HouseholdContext';
import { useTheme } from '../../lib/ThemeContext';
import { subscribeShoppingList, setShoppingItemChecked, deleteShoppingItem } from '../../lib/firestoreData';
import { fonts } from '../../lib/theme';
import ShoppingRow from '../../components/ShoppingRow';
import EmptyState from '../../components/EmptyState';

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { householdCode } = useHousehold();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!householdCode) return;
    return subscribeShoppingList(householdCode, setItems, () =>
      setError('Impossibile leggere la lista. Controlla la configurazione di Firebase (vedi README).')
    );
  }, [householdCode]);

  const toBuy = useMemo(() => items.filter((i) => !i.checked), [items]);
  const bought = useMemo(() => items.filter((i) => i.checked), [items]);
  const matches = (i) => !query.trim() || i.name.toLowerCase().includes(query.trim().toLowerCase());
  const toBuyVisible = toBuy.filter(matches);
  const boughtVisible = bought.filter(matches);

  function openEdit(item) {
    router.push({
      pathname: '/shopping-form',
      params: { id: item.id, name: item.name, quantity: String(item.quantity || 1) },
    });
  }

  function moveToStock(item) {
    router.push({
      pathname: '/product-form',
      params: { name: item.name, quantity: String(item.quantity || 1), location: 'dispensa', fromShoppingId: item.id },
    });
  }

  const rows = [
    ...toBuyVisible.map((i) => ({ ...i, _section: 'toBuy' })),
    ...(boughtVisible.length > 0 ? [{ id: '__bought_header__', _section: 'header' }] : []),
    ...boughtVisible.map((i) => ({ ...i, _section: 'bought' })),
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.heroHeader, { marginTop: insets.top + 12 }]}>
        <Ionicons name="cart" size={18} color="#fff" />
        <Text style={styles.brand}>Lista della spesa</Text>
      </View>
      <Text style={styles.subtitle}>
        {items.length === 0
          ? 'Nessun prodotto in lista'
          : `${toBuy.length} da comprare${
              bought.length ? ' · ' + bought.length + ' comprat' + (bought.length === 1 ? 'o' : 'i') : ''
            }`}
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={15} color={colors.inkSoft} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca nella lista"
          placeholderTextColor={colors.inkSoft}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title={items.length === 0 ? 'La lista della spesa è vuota' : 'Nessun risultato'}
            ctaLabel={items.length === 0 ? 'Aggiungi un prodotto' : null}
            onPress={() => router.push('/shopping-form')}
          />
        }
        renderItem={({ item }) => {
          if (item._section === 'header') {
            return (
              <View style={styles.boughtHeader}>
                <Text style={styles.boughtHeaderText}>Comprati</Text>
                <Pressable onPress={() => bought.forEach((b) => deleteShoppingItem(householdCode, b.id))}>
                  <Text style={styles.clearText}>Svuota</Text>
                </Pressable>
              </View>
            );
          }
          return (
            <ShoppingRow
              item={item}
              onToggle={() => setShoppingItemChecked(householdCode, item.id, !item.checked)}
              onPress={() => openEdit(item)}
              onDelete={() => deleteShoppingItem(householdCode, item.id)}
              onMoveToStock={() => moveToStock(item)}
            />
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/shopping-form')}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.berry,
      marginHorizontal: 20,
      marginTop: 12,
      paddingVertical: 14,
      borderRadius: 20,
      shadowColor: colors.berryDark,
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    brand: { fontFamily: fonts.displayExtraBold, fontSize: 19, color: '#fff' },
    subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 8, textAlign: 'center' },
    errorBanner: { marginHorizontal: 20, marginTop: 10, backgroundColor: colors.redSoft, borderRadius: 9, padding: 10 },
    errorText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.red },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 20,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink, padding: 0 },
    list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
    boughtHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 14,
      paddingBottom: 6,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      marginTop: 6,
    },
    boughtHeaderText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft },
    clearText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.berry },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.berry,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
  });
}
