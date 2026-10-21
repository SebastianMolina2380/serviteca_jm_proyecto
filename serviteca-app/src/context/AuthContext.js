// ============================================================
// SERVITECA JM - CONTEXTO DE AUTENTICACIÓN
// ============================================================
// Mantiene el usuario logueado en memoria y lo persiste en
// AsyncStorage para que la sesión sobreviva al cierre de la
// app. La cookie de sesión también se restaura (ver api.js).
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

import * as authService from '../services/authService';
import { initSession } from '../services/api';

const USER_KEY = '@serviteca_jm/user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión y usuario guardados al iniciar la app
  useEffect(() => {
    (async () => {
      try {
        await initSession();

        const guardado = await AsyncStorage.getItem(USER_KEY);

        if (guardado) {
          setUser(JSON.parse(guardado));
        }
      } catch (e) {
        // ignorar
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(correo, contrasena, rol) {
    const usuario = await authService.login(correo, contrasena, rol);

    setUser(usuario);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(usuario));

    return usuario;
  }

  async function logout() {
    await authService.logout();
    setUser(null);
    await AsyncStorage.removeItem(USER_KEY);
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
