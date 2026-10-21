// ============================================================
// PANTALLA: LOGIN
// ============================================================
// Inicio de sesión para clientes y empleados (técnicos y
// administradores). El rol seleccionado se envía al backend:
// POST /api/auth/login { correo, contrasena, rol }
// ============================================================

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const ROLES = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'ADMIN', label: 'Administrador' },
];

export default function LoginScreen() {
  const { login } = useAuth();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rol, setRol] = useState('CLIENTE');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion() {
    setError('');

    if (!correo.trim() || !contrasena) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }

    setCargando(true);

    try {
      await login(correo, contrasena, rol);
      // Si todo sale bien, el navegador cambia al Dashboard
      // automáticamente (ver RootNavigator).
    } catch (e) {
      setError(e.message || 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" backgroundColor={colors.dark} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>JM</Text>
          </View>

          <Text style={styles.title}>Serviteca JM</Text>
          <Text style={styles.subtitle}>
            Gestión de servicios automotrices
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Iniciar sesión</Text>

          <Text style={styles.roleLabel}>¿Cómo entras?</Text>

          <View style={styles.roleContainer}>
            {ROLES.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setRol(r.value)}
                style={[
                  styles.roleButton,
                  rol === r.value && styles.roleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    rol === r.value && styles.roleTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="Correo electrónico"
            placeholder="tu@correo.com"
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            title="Ingresar"
            onPress={iniciarSesion}
            loading={cargando}
          />

          <Text style={styles.hint}>
            El cliente accede con su correo registrado. El personal debe
            seleccionar Técnico o Administrador.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.dark,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 4,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  roleTextActive: {
    color: '#FFF',
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
