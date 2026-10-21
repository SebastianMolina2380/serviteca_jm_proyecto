// ============================================================
// SERVITECA JM - CONFIGURACIÓN DE ENTORNO
// ============================================================
// Define la URL base de la API del backend Spring Boot.
//
// Backend por defecto:  http://<IP_DE_TU_PC>:8082/api
//
// Si estás probando con Expo Go desde el celular, el celular
// NO puede usar "localhost" (localhost sería el propio celular).
// Por eso la app detecta automáticamente la IP de tu PC
// (la misma que usa Expo), o puedes fijarla manualmente.
// ============================================================

import Constants from 'expo-constants';

// ------------------------------------------------------------
// OPCIONAL: fija aquí la IP de tu PC si la detección automática
// no funciona. Ejemplo: 'http://192.168.1.15:8082/api'
// Dejar vacío ('') para usar la detección automática.
// ------------------------------------------------------------
export const MANUAL_API_URL = 'https://lushly-singer-munchkin.ngrok-free.dev/api';

// Puerto del backend Spring Boot (server.port en application.properties)
export const API_PORT = 8082;

// ------------------------------------------------------------
// Detección automática de la IP de la máquina donde corre Expo.
// hostUri tiene formato: "192.168.1.15:8081"
// ------------------------------------------------------------
function detectHost() {
  try {
    const hostUri =
      (Constants.expoConfig && Constants.expoConfig.hostUri) || '';

    const host = hostUri.split('/')[0].split(':')[0];

    // Si Expo no informa la IP (por ejemplo en un build EAS),
    // se usa la IP configurada en MANUAL_API_URL.
    return host || '';
  } catch (e) {
    return '';
  }
}

const detectedHost = detectHost();

export const API_URL =
  MANUAL_API_URL ||
  (detectedHost
    ? `http://${detectedHost}:${API_PORT}/api`
    : `http://localhost:${API_PORT}/api`);
