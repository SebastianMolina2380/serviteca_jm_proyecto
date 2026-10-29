// ============================================================
// SERVITECA JM - CONTEXTO DE AUTENTICACIÓN
// ============================================================
// Mantiene el usuario logueado en memoria y lo persiste con
// expo-secure-store para que la sesión sobreviva al cierre de la
// app. La cookie de sesión también se restaura (ver api.js).
//
// Cuando el backend responde 401, api.js limpia la cookie y este
// contexto borra el usuario: RootNavigator muestra el login.
// ============================================================

import { createContext, useContext, useEffect, useState } from 'react';

import * as authService from '../services/authService';
import { initSession, setUnauthorizedHandler } from '../services/api';
import {
  getItem,
  getLegacyItem,
  removeItem,
  removeLegacyItem,
  setItem,
} from '../services/secureStorage';

const USER_KEY = 'serviteca_jm_user';
const LEGACY_USER_KEY = '@serviteca_jm/user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión y usuario guardados al iniciar la app
  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const cookie = await initSession();

        let guardado = await getItem(USER_KEY);

        // Migración única desde AsyncStorage (versiones anteriores).
        if (!guardado) {
          guardado = await getLegacyItem(LEGACY_USER_KEY);

          if (guardado) {
            await setItem(USER_KEY, guardado);
            await removeLegacyItem(LEGACY_USER_KEY);
          }
        }

        if (!activo) return;

        if (!guardado || !cookie) {
          // Usuario huérfano sin cookie: se descarta el perfil.
          if (guardado) await removeItem(USER_KEY);
          return;
        }

        setUser(JSON.parse(guardado));

        // Validación silenciosa de la sesión. Si el backend
        // responde 401, el manejador global limpia el usuario.
        authService
          .me()
          .then(async (usuario) => {
            if (!activo || !usuario) return;

            setUser(usuario);
            await setItem(USER_KEY, JSON.stringify(usuario));
          })
          .catch(() => {
            // Sin conexión: se conserva la sesión local.
          });
      } catch (e) {
        // ignorar
      } finally {
        if (activo) setLoading(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  // api.js avisa aquí cuando una petición devuelve HTTP 401.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      setUser(null);
      await removeItem(USER_KEY);
      await removeLegacyItem(LEGACY_USER_KEY);
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  async function login(correo, contrasena, rol) {
    const usuario = await authService.login(correo, contrasena, rol);

    setUser(usuario);
    await setItem(USER_KEY, JSON.stringify(usuario));

    return usuario;
  }

  async function logout() {
    await authService.logout();
    setUser(null);
    await removeItem(USER_KEY);
    await removeLegacyItem(LEGACY_USER_KEY);
  }

  const esCliente = user && user.rol === 'CLIENTE';
  const esEmpleado = user && (user.rol === 'TECNICO' || user.rol === 'ADMIN');

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, esCliente, esEmpleado }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
