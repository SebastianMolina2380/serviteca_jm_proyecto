// ============================================================
// SERVITECA JM - ALMACENAMIENTO SEGURO
// ============================================================
// En Android/iOS la cookie de sesión y el perfil del usuario se
// guardan con expo-secure-store (Keychain / Keystore).
// En web no existe SecureStore, por lo que se usa AsyncStorage
// como respaldo; el navegador ya protege la cookie con HttpOnly.
//
// Las claves de SecureStore solo admiten letras, números, ".", "-"
// y "_", por eso no se reutilizan las claves antiguas con "@" y "/".
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const usaSecureStore = Platform.OS !== 'web';

export async function getItem(key) {
  if (!usaSecureStore) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setItem(key, value) {
  if (!usaSecureStore) {
    await AsyncStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function removeItem(key) {
  if (!usaSecureStore) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

// ------------------------------------------------------------
// Migración desde las claves antiguas de AsyncStorage
// ------------------------------------------------------------
// Las versiones anteriores guardaban todo en texto plano con
// claves "@serviteca_jm/...". Al primer arranque se copia el
// valor al almacenamiento seguro y se elimina el original.
export async function getLegacyItem(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export async function removeLegacyItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    // ignorar
  }
}
