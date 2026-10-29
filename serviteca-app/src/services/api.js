// ============================================================
// SERVITECA JM - CLIENTE HTTP CON SESIÓN
// ============================================================
// El backend Spring Boot autentica con sesión HTTP. La cookie
// se llama SERVITECASESSION (configurable en application.properties)
// y se mantiene como respaldo JSESSIONID por compatibilidad.
//
// React Native no persiste cookies de forma automática, por lo
// que esta capa:
//
//   1. Captura la cookie Set-Cookie devuelta en el login.
//   2. La guarda con expo-secure-store (Keychain / Keystore).
//   3. La envía como cabecera "Cookie" en cada petición.
//   4. Ante un HTTP 401 limpia la sesión y avisa a AuthContext
//      para volver al login.
//
// Se utiliza XMLHttpRequest (no fetch) porque permite leer
// todas las cabeceras de respuesta, incluida Set-Cookie.
// ============================================================

import { API_URL } from '../config/env';
import {
  getItem,
  getLegacyItem,
  removeItem,
  removeLegacyItem,
  setItem,
} from './secureStorage';

const SESSION_KEY = 'serviteca_jm_session_cookie';
const LEGACY_SESSION_KEY = '@serviteca_jm/session_cookie';

let sessionCookie = null;
let unauthorizedHandler = null;

// ------------------------------------------------------------
// Registro del manejador de sesión expirada (AuthContext)
// ------------------------------------------------------------
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

function notificarSesionExpirada() {
  if (!unauthorizedHandler) return;

  Promise.resolve(unauthorizedHandler()).catch(() => {
    // El manejador no debe romper la petición que ya falló.
  });
}

// ------------------------------------------------------------
// Restaurar la sesión guardada al iniciar la app
// ------------------------------------------------------------
export async function initSession() {
  try {
    sessionCookie = await getItem(SESSION_KEY);

    // Migración única desde AsyncStorage (versiones anteriores).
    if (!sessionCookie) {
      const legado = await getLegacyItem(LEGACY_SESSION_KEY);

      if (legado) {
        sessionCookie = legado;
        await setItem(SESSION_KEY, legado);
        await removeLegacyItem(LEGACY_SESSION_KEY);
      }
    }
  } catch (e) {
    sessionCookie = null;
  }

  return sessionCookie;
}

export async function clearSession() {
  sessionCookie = null;

  try {
    await removeItem(SESSION_KEY);
  } catch (e) {
    // ignorar
  }

  await removeLegacyItem(LEGACY_SESSION_KEY);
}

// ------------------------------------------------------------
// Extraer la cookie de sesión de las cabeceras de respuesta
// ------------------------------------------------------------
function captureSessionCookie(rawHeaders) {
  if (!rawHeaders) return;

  const lines = rawHeaders.split('\n');

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.startsWith('set-cookie:')) {
      const match = line.match(/(?:SERVITECASESSION|JSESSIONID)=[^;]+/i);

      if (match && match[0] !== sessionCookie) {
        sessionCookie = match[0];
        setItem(SESSION_KEY, sessionCookie).catch(() => {});
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

    xhr.onload = async () => {
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

      // Sesión expirada o revocada: se borra la cookie y el
      // usuario guardado; RootNavigator vuelve al login.
      const esLogin = path === '/auth/login';

      if (xhr.status === 401 && !esLogin) {
        await clearSession();
        notificarSesionExpirada();
      }

      const mensaje =
        (data && typeof data === 'object' && data.error) ||
        (typeof data === 'string' && data.trim()) ||
        (xhr.status === 401
          ? 'Tu sesión expiró. Inicia sesión nuevamente.'
          : `Error HTTP ${xhr.status}`);

      const error = new Error(mensaje);
      error.status = xhr.status;
      reject(error);
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'No se pudo conectar con el servidor. Verifica que el backend ' +
            'esté corriendo y que EXPO_PUBLIC_API_URL apunte a la API.'
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
