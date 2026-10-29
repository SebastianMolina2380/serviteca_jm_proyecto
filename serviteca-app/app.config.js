// ============================================================
// SERVITECA JM - CONFIGURACIÓN DINÁMICA DE EXPO
// ============================================================
// Permite compilar la misma app para distintos backends sin
// tocar el código:
//
//   $env:EXPO_PUBLIC_API_URL = "https://api.servitecajm.com/api"
//   npx expo start
//
// La URL se expone en Constants.expoConfig.extra.apiUrl y
// src/config/env.js la usa como primera opción. Si la variable
// no está definida, la app detecta la IP de la máquina que
// ejecuta Expo (útil con Expo Go en la red local).
// ============================================================

module.exports = ({ config }) => {
  const apiUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();

  const apiPort = Number(
    process.env.EXPO_PUBLIC_API_PORT || config.extra?.apiPort || 8082
  );

  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl,
      apiPort: Number.isFinite(apiPort) ? apiPort : 8082,
    },
  };
};
