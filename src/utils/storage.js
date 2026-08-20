import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@gatezy_token',
  GUARD: '@gatezy_guard',
  SHIFT: '@gatezy_shift',
};

// ─── Token ───────────────────────────────────────────
export const saveToken = async (token) => {
  await AsyncStorage.setItem(KEYS.TOKEN, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(KEYS.TOKEN);
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(KEYS.TOKEN);
};

// ─── Guard ───────────────────────────────────────────
export const saveGuard = async (guard) => {
  await AsyncStorage.setItem(KEYS.GUARD, JSON.stringify(guard));
};

export const getGuard = async () => {
  const data = await AsyncStorage.getItem(KEYS.GUARD);
  return data ? JSON.parse(data) : null;
};

export const removeGuard = async () => {
  await AsyncStorage.removeItem(KEYS.GUARD);
};

// ─── Shift ───────────────────────────────────────────
export const saveShift = async (shift) => {
  await AsyncStorage.setItem(KEYS.SHIFT, JSON.stringify(shift));
};

export const getShift = async () => {
  const data = await AsyncStorage.getItem(KEYS.SHIFT);
  return data ? JSON.parse(data) : null;
};

export const removeShift = async () => {
  await AsyncStorage.removeItem(KEYS.SHIFT);
};
