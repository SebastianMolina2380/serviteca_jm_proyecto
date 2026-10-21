// ============================================================
// SERVITECA JM - CLIENTE HTTP CON SESIÓN
// ============================================================
// El backend Spring Boot autentica con SESIÓN HTTP (cookie
// JSESSIONID). React Native no persiste cookies de forma
// automática, por lo que esta capa:
//
//   1. Captura la cookie Set-Cookie devuelta en el login.
//   2. La guarda en AsyncStorage.
//   3. La envía como cabecera "Cookie" en cada petición.
//
// Se utiliza XMLHttpRequest (no fetch) porque permite leer
// todas las cabeceras de respuesta, incluida Set-Cookie.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../config/env';

const SESSION_KEY = '@serviteca_jm/session_cookie';

let sessionCookie = null;

// ------------------------------------------------------------
// Restaurar la sesión guardada al iniciar la app
// ------------------------------------------------------------
export async function initSession() {
  try {
    sessionCookie = await AsyncStorage.getItem(SESSION_KEY);
  } catch (e) {
    sessionCookie = null;
  }
  return sessionCookie;
}

export async function clearSession() {
  sessionCookie = null;
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // ignorar
  }
}

// ------------------------------------------------------------
// Extraer JSESSIONID de las cabeceras de respuesta
// ------------------------------------------------------------
function captureSessionCookie(rawHeaders) {
  if (!rawHeaders) return;

  const lines = rawHeaders.split('\n');

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.startsWith('set-cookie:')) {
      const match = line.match(/JSESSIONID=[^;]+/i);

      if (match && match[0] !== sessionCookie) {
        sessionCookie = match[0];
        AsyncStorage.setItem(SESSION_KEY, sessionCookie).catch(() => {});
      }

      return;
    }
  }
}

// ------------------------------------------------------------
// Petición general
// ------------------------------------------------------------
export function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, `${API_URL}${path}`, true);
    xhr.timeout = 20000;

    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    if (sessionCookie) {
      xhr.setRequestHeader('Cookie', sessionCookie);
    }

    xhr.onload = () => {
      captureSessionCookie(xhr.getAllResponseHeaders());

      const text = xhr.responseText;

      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text;
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
        return;
      }

      const mensaje =
        (data && typeof data === 'object' && data.error) ||
        (typeof data === 'string' && data.trim()) ||
        `Error HTTP ${xhr.status}`;

      const error = new Error(mensaje);
      error.status = xhr.status;
      reject(error);
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'No se pudo conectar con el servidor. Verifica que el backend ' +
            'esté corriendo y que la IP en src/config/env.js sea correcta.'
        )
      );
    };

    xhr.ontimeout = () => {
      reject(new Error('Tiempo de espera agotado. El servidor no responde.'));
    };

    xhr.send(body ? JSON.stringify(body) : null);
  });
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};

export default api;
