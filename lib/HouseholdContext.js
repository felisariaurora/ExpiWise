import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'household-code';
// Niente 0/O/1/I per evitare ambiguità quando il codice viene detto a voce o letto.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children }) {
  const [householdCode, setHouseholdCodeState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setHouseholdCodeState(stored);
      } catch (e) {
        // nessun codice salvato: si parte dall'onboarding
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setHouseholdCode = useCallback(async (code) => {
    const normalized = code.trim().toUpperCase();
    await AsyncStorage.setItem(STORAGE_KEY, normalized);
    setHouseholdCodeState(normalized);
  }, []);

  const leaveHousehold = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setHouseholdCodeState(null);
  }, []);

  return (
    <HouseholdContext.Provider
      value={{ householdCode, setHouseholdCode, leaveHousehold, loading, generateCode }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold deve essere usato dentro <HouseholdProvider>');
  return ctx;
}
