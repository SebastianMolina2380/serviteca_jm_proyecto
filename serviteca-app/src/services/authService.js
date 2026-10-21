// ============================================================
// SERVITECA JM - SERVICIO DE AUTENTICACIÓN
// ============================================================
// POST /api/auth/login  -> crea la sesión (cookie JSESSIONID)
// GET  /api/auth/me     -> usuario de la sesión actual
// POST /api/auth/logout -> cierra la sesión
// ============================================================

import api, { clearSession } from './api';

// Roles disponibles en el sistema (coinciden con el backend):
// CLIENTE, TECNICO, ADMIN
export async function login(correo, contrasena, rol) {
  const usuario = await api.post('/auth/login', {
    correo: correo.trim(),
    contrasena,
    rol,
  });

  return usuario;
}

export async function me() {
  return api.get('/auth/me');
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // Aunque falle el backend, se limpia la sesión local.
  }

  await clearSession();
}
