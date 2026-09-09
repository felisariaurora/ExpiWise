import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../../lib/HouseholdContext';
import { useTheme } from '../../lib/ThemeContext';
import {
  subscribeProducts,
  subscribeSettings,
  subscribeShoppingList,
  deleteProduct,
  addShoppingItem,
  updateShoppingItem,
  logWaste,
} from '../../lib/firestoreData';
import { daysUntil, statusFor, badgeFor } from '../../lib/dates';
import { fonts } from '../../lib/theme';
import { LOCATIONS_WITH_ALL as LOCATIONS } from '../../lib/locations';
import { ensureNotificationPermission, syncExpiryNotifications } from '../../lib/notifications';
import ProductRow from '../../components/ProductRow';
import EmptyState from '../../components/EmptyState';

export default function PantryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { householdCode } = useHousehold();
  const [products, setProducts] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [settings, setSettings] = useState({ threshold: 3 });
  const [error, setError] = useState('');
  const [filterLocation, setFilterLocation] = useState('tutti');
  const [onlyExpiring, setOnlyExpiring] = useState(false);
  const [query, setQuery] = useState('');
  const [flashId, setFlashId] = useState(null);

  useEffect(() => {
    if (!householdCode) return;
    const unsubP = subscribeProducts(householdCode, setProducts, () =>
      setError('Impossibile leggere i dati. Controlla la configurazione di Firebase (vedi README).')
    );
    const unsubS = subscribeSettings(householdCode, setSettings);
    const unsubL = subscribeShoppingList(householdCode, setShoppingList, () => {});
    return () => {
      unsubP();
      unsubS();
      unsubL();
    };
  }, [householdCode]);

  useEffect(() => {
    if (!householdCode) return;
    (async () => {
      try {
        const granted = await ensureNotificationPermission();
        if (!granted) return;
        await syncExpiryNotifications(products, settings.threshold);
      } catch (e) {
        // le notifiche sono un extra: se falliscono non deve bloccare il resto dell'app
      }
    })();
  }, [householdCode, products, settings.threshold]);

  const enriched = useMemo(() => {
    return products
      .map((p) => {
        const days = p.expiryDate ? daysUntil(p.expiryDate) : null;
        const status = p.expiryDate ? statusFor(days, settings.threshold ?? 3) : 'household';
        return { ...p, days, status };
      })
      .sort((a, b) => {
        const da = a.days === null ? Infinity : a.days;
        const db = b.days === null ? Infinity : b.days;
        if (da !== db) return da - db;
        return a.name.localeCompare(b.name);
      });
  }, [products, settings.threshold]);

  const expiringCount = useMemo(
    () => enriched.filter((p) => p.status === 'warning' || p.status === 'expired').length,
    [enriched]
  );
  const expiredCount = useMemo(() => enriched.filter((p) => p.status === 'expired').length, [enriched]);

  const visible = useMemo(() => {
    return enriched.filter((p) => {
      if (filterLocation !== 'tutti' && p.location !== filterLocation) return false;
      if (onlyExpiring && !(p.status === 'warning' || p.status === 'expired')) return false;
      if (query.trim() && !p.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [enriched, filterLocation, onlyExpiring, query]);

  const handleAddToList = useCallback(
    async (product) => {
      const existing = shoppingList.find(
        (i) => !i.checked && i.name.trim().toLowerCase() === product.name.trim().toLowerCase()
      );
      if (existing) {
        await updateShoppingItem(householdCode, existing.id, { quantity: (existing.quantity || 1) + 1 });
      } else {
        await addShoppingItem(householdCode, { name: product.name, quantity: 1, checked: false });
      }
      setFlashId(product.id);
      setTimeout(() => setFlashId(null), 1200);
    },
    [householdCode, shoppingList]
  );

  const handleDeleteProduct = useCallback(
    async (product) => {
      if (product.status === 'expired') {
        await logWaste(householdCode, {
          name: product.name,
          location: product.location,
          expiryDate: product.expiryDate,
        });
      }
      await deleteProduct(householdCode, product.id);
    },
    [householdCode]
  );

  const openAddForm = useCallback(() => {
    router.push({
      pathname: '/product-form',
      params: filterLocation !== 'tutti' ? { location: filterLocation } : {},
    });
  }, [filterLocation]);

  const activeLocationLabel = LOCATIONS.find((l) => l.id === filterLocation)?.label;

  return (
    <View style={styles.container}>
      <View style={[styles.heroHeader, { marginTop: insets.top + 12 }]}>
        <Text style={styles.brand}>La mia Expiwise</Text>
        <Ionicons name="sparkles" size={16} color={colors.gold} style={{ marginLeft: 6 }} />
      </View>
      <Text style={styles.subtitle}>
        {products.length === 0
          ? 'Nessun prodotto salvato'
          : `${products.length} prodott${products.length === 1 ? 'o' : 'i'} · avviso ${settings.threshold ?? 3} giorni prima`}
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {expiringCount > 0 && (
        <Pressable
          style={[styles.alertBanner, expiredCount > 0 && styles.alertBannerDanger]}
          onPress={() => {
            setOnlyExpiring(true);
            setFilterLocation('tutti');
          }}
        >
          <Ionicons name="warning-outline" size={16} color={expiredCount > 0 ? colors.red : colors.amber} />
          <Text style={[styles.alertText, { color: expiredCount > 0 ? colors.red : colors.amber }]}>
            {expiredCount > 0
              ? `${expiredCount} scadut${expiredCount === 1 ? 'o' : 'i'}, ${expiringCount - expiredCount} in scadenza`
              : `${expiringCount} prodott${expiringCount === 1 ? 'o' : 'i'} in scadenza`}
          </Text>
        </Pressable>
      )}

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={15} color={colors.inkSoft} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca un prodotto"
          placeholderTextColor={colors.inkSoft}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.tabs}>
        {LOCATIONS.map((loc) => {
          const active = filterLocation === loc.id && !onlyExpiring;
          const locColor = colors[loc.colorKey];
          const locSoft = colors[loc.softKey];
          return (
            <Pressable
              key={loc.id}
              onPress={() => {
                setFilterLocation(loc.id);
                setOnlyExpiring(false);
              }}
              style={[
                styles.tab,
                { backgroundColor: active ? locColor : locSoft },
              ]}
            >
              <Text style={[styles.tabText, { color: active ? '#fff' : locColor }]}>{loc.label}</Text>
            </Pressable>
          );
        })}
        {onlyExpiring && (
          <Pressable style={styles.filterChipWrap} onPress={() => setOnlyExpiring(false)}>
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>In scadenza</Text>
              <Ionicons name="close" size={12} color={colors.green} />
            </View>
          </Pressable>
        )}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Pressable style={styles.addCard} onPress={openAddForm}>
            <View style={styles.addCardIcon}>
              <Ionicons name="add" size={20} color="#fff" />
            </View>
            <View style={styles.addCardBody}>
              <Text style={styles.addCardTitle}>
                {filterLocation === 'tutti' ? 'Aggiungi prodotto' : `Aggiungi a ${activeLocationLabel}`}
              </Text>
              <Text style={styles.addCardSubtitle}>Scansiona il codice a barre o inseriscilo a mano</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
          </Pressable>
        }
        ListEmptyComponent={
          <EmptyState
            icon="file-tray-stacked-outline"
            title={products.length === 0 ? 'La tua dispensa è vuota' : 'Nessun risultato'}
            ctaLabel={products.length === 0 ? 'Aggiungi il primo prodotto' : null}
            onPress={openAddForm}
          />
        }
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            badge={item.expiryDate ? badgeFor(item.days) : null}
            justAddedToList={flashId === item.id}
            locationIcons={settings.locationIcons}
            onPress={() =>
              router.push({
                pathname: '/product-form',
                params: {
                  id: item.id,
                  name: item.name,
                  location: item.location,
                  expiryDate: item.expiryDate || '',
                  quantity: String(item.quantity || 1),
                  barcode: item.barcode || '',
                },
              })
            }
            onAddToList={() => handleAddToList(item)}
            onDelete={() => handleDeleteProduct(item)}
          />
        )}
      />

      <Pressable style={styles.fab} onPress={openAddForm}>
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
      backgroundColor: colors.teal,
      marginHorizontal: 20,
      marginTop: 12,
      paddingVertical: 14,
      borderRadius: 20,
      shadowColor: colors.tealDark,
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    brand: { fontFamily: fonts.displayExtraBold, fontSize: 19, color: '#fff' },
    subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 8, textAlign: 'center' },
    errorBanner: { marginHorizontal: 20, marginTop: 10, backgroundColor: colors.redSoft, borderRadius: 9, padding: 10 },
    errorText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.red },
    alertBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 20,
      marginTop: 10,
      backgroundColor: colors.amberSoft,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    alertBannerDanger: { backgroundColor: colors.redSoft },
    alertText: { fontFamily: fonts.bodySemiBold, fontSize: 13.5 },
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
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginTop: 14, alignItems: 'center' },
    tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14 },
    tabText: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
    filterChipWrap: { paddingVertical: 0 },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.greenSoft,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    filterChipText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.green },
    list: { paddingHorizontal: 20, paddingBottom: 100 },
    addCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 16,
      marginBottom: 6,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    addCardIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.teal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addCardBody: { flex: 1 },
    addCardTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.ink },
    addCardSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 2 },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.teal,
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
