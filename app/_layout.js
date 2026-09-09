import { useEffect, useCallback, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
} from '@expo-google-fonts/archivo';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from '@expo-google-fonts/work-sans';
import { HouseholdProvider } from '../lib/HouseholdContext';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import { ensureAnonymousAuth } from '../lib/firebaseConfig';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootContent({ fontsLoaded, authReady }) {
  const { colors, scheme } = useTheme();

  const hideSplash = useCallback(async () => {
    if (fontsLoaded && authReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, authReady]);

  useEffect(() => {
    hideSplash();
  }, [hideSplash]);

  if (!fontsLoaded || !authReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <HouseholdProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="product-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="shopping-form" options={{ presentation: 'modal' }} />
        </Stack>
      </HouseholdProvider>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    ensureAnonymousAuth()
      .then(() => setAuthReady(true))
      .catch(() => setAuthReady(true)); // non blocchiamo l'app: gli errori verranno mostrati dalle singole schermate
  }, []);

  return (
    <ThemeProvider>
      <RootContent fontsLoaded={fontsLoaded} authReady={authReady} />
    </ThemeProvider>
  );
}
