// ============================================================
// SERVITECA JM - SERVICIO DE AUTENTICACIÓN
// ============================================================
// POST /api/auth/login    -> crea la sesión (cookie SERVITECASESSION)
// POST /api/auth/registro -> crea una cuenta de CLIENTE
// GET  /api/auth/me       -> usuario de la sesión actual
// POST /api/auth/logout   -> cierra la sesión
// ============================================================

import api, { clearSession } from './api';

// Roles disponibles en el sistema (coinciden con el backend):
// CLIENTE, TECNICO, ADMIN
export async function login(correo, contrasena, rol) {
  // Evita reutilizar una cookie de una sesión anterior.
  await clearSession();

  const usuario = await api.post('/auth/login', {
    correo: correo.trim(),
    contrasena,
    rol,
  });

  return usuario;
}

// Registro público: el backend fuerza Rol.CLIENTE y Estado.ACTIVO.
// No inicia sesión; el usuario entra después desde el login.
export async function registro({
  nombre,
  numeroDoc,
  tipoDocumento = 'CC',
  correo,
  telefono,
  ciudad,
  direccion,
  contrasena,
}) {
  return api.post('/auth/registro', {
    nombre: nombre.trim(),
    numeroDoc: numeroDoc.trim(),
    tipoDocumento,
    correo: correo.trim().toLowerCase(),
    telefono: telefono ? telefono.trim() : '',
    ciudad: ciudad ? ciudad.trim() : '',
    direccion: direccion ? direccion.trim() : '',
    contrasena,
  });
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
