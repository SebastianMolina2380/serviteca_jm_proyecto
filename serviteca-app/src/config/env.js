// ============================================================
// SERVITECA JM - CONFIGURACIÓN DE ENTORNO
// ============================================================
// Prioridad para la URL del backend:
//
//   1. EXPO_PUBLIC_API_URL  (variable de entorno de Expo)
//   2. extra.apiUrl         (app.config.js en el build)
//   3. Detección automática de la IP de la máquina que ejecuta
//      Expo (Expo Go en la red local).
//   4. http://localhost:8082/api (último recurso).
//
// La URL debe apuntar a la raíz de la API, por ejemplo:
//   https://api.servitecajm.com/api
// Si se omite el sufijo "/api", se agrega automáticamente.
// ============================================================

import Constants from 'expo-constants';

const DEFAULT_PORT = 8082;

function leerExtra() {
  return (Constants.expoConfig && Constants.expoConfig.extra) || {};
}

function normalizarApiUrl(valor) {
  const limpio = String(valor || '')
    .trim()
    .replace(/\/+$/, '');

  if (!limpio) return '';

  return /\/api$/i.test(limpio) ? limpio : `${limpio}/api`;
}

// Expo inyecta las variables EXPO_PUBLIC_* en el bundle. En los
// builds de producción también queda disponible extra.apiUrl.
const urlEntorno = normalizarApiUrl(process.env.EXPO_PUBLIC_API_URL);
const urlConfig = normalizarApiUrl(leerExtra().apiUrl);

export const API_PORT = Number(leerExtra().apiPort) || DEFAULT_PORT;

// ------------------------------------------------------------
// Detección automática de la IP de la máquina donde corre Expo.
// hostUri tiene formato: "192.168.1.15:8081".
// ------------------------------------------------------------
function detectHost() {
  try {
    const hostUri =
      (Constants.expoConfig && Constants.expoConfig.hostUri) || '';

    return hostUri.split('/')[0].split(':')[0] || '';
  } catch (e) {
    return '';
  }
}

const detectedHost = detectHost();

const urlAutomatica = detectedHost
  ? `http://${detectedHost}:${API_PORT}/api`
  : `http://localhost:${API_PORT}/api`;

export const API_URL = urlEntorno || urlConfig || urlAutomatica;

// Útil para diagnósticos: indica de dónde salió la URL activa.
export const API_URL_SOURCE = urlEntorno
  ? 'EXPO_PUBLIC_API_URL'
  : urlConfig
    ? 'app.config.js (extra.apiUrl)'
    : 'detección automática';
