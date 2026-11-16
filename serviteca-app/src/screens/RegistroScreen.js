// ============================================================
// PANTALLA: REGISTRO DE CLIENTE
// ============================================================
// Registro público para clientes. El backend fuerza Rol.CLIENTE
// y Estado.ACTIVO, y la cuenta queda lista de inmediato: no se
// envía correo de verificación. Al terminar se vuelve al login.
//
// POST /api/auth/registro
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
import * as authService from '../services/authService';
import { colors } from '../theme';

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula' },
  { value: 'CE', label: 'Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistroScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDoc, setNumeroDoc] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  async function crearCuenta() {
    setError('');

    if (!nombre.trim() || !numeroDoc.trim() || !correo.trim()) {
      setError('Completa nombre, documento y correo.');
      return;
    }
    if (nombre.trim().length < 3) {
      setError('Escribe tu nombre completo.');
      return;
    }
    if (!EMAIL.test(correo.trim())) {
      setError('El correo electrónico no es válido.');
      return;
    }
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (contrasena !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      await authService.registro({
        nombre,
        numeroDoc,
        tipoDocumento,
        correo,
        telefono,
        ciudad,
        contrasena,
      });
      setExito(true);
    } catch (e) {
      setError(e.message || 'No se pudo crear la cuenta.');
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <View style={[styles.flex, styles.exitoWrap]}>
        <StatusBar style="light" backgroundColor={colors.dark} />

        <View style={styles.form}>
          <Text style={styles.exitoIcono}>✅</Text>
          <Text style={styles.exitoTitulo}>Cuenta creada</Text>
          <Text style={styles.exitoTexto}>
            Ya puedes iniciar sesión con tu correo y contraseña.
          </Text>

          <Button
            title="Ir a iniciar sesión"
            onPress={() => navigation.navigate('Login', { registrado: true })}
          />
        </View>
      </View>
    );
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

          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Registro de clientes de Serviteca JM
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Tus datos</Text>

          <Input
            label="Nombre completo"
            placeholder="Nombre y apellido"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            autoComplete="name"
          />

          <Text style={styles.roleLabel}>Tipo de documento</Text>
          <View style={styles.roleContainer}>
            {TIPOS_DOCUMENTO.map((tipo) => (
              <Pressable
                key={tipo.value}
                onPress={() => setTipoDocumento(tipo.value)}
                style={[
                  styles.roleButton,
                  tipoDocumento === tipo.value && styles.roleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    tipoDocumento === tipo.value && styles.roleTextActive,
                  ]}
                >
                  {tipo.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="Número de documento"
            placeholder="12345678"
            value={numeroDoc}
            onChangeText={setNumeroDoc}
            keyboardType="default"
            autoCapitalize="none"
          />

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
            label="Teléfono (opcional)"
            placeholder="300 000 0000"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          <Input
            label="Ciudad (opcional)"
            placeholder="Tunja"
            value={ciudad}
            onChangeText={setCiudad}
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            autoComplete="new-password"
          />

          <Input
            label="Confirmar contraseña"
            placeholder="Repite la contraseña"
            value={confirmar}
            onChangeText={setConfirmar}
            secureTextEntry
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            title="Crear cuenta"
            onPress={crearCuenta}
            loading={cargando}
          />

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.linkWrap}
          >
            <Text style={styles.link}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.linkStrong}>Inicia sesión</Text>
            </Text>
          </Pressable>
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
    marginBottom: 24,
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
    textAlign: 'center',
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
  linkWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  link: {
    fontSize: 13,
    color: colors.textMuted,
  },
  linkStrong: {
    color: colors.primary,
    fontWeight: '700',
  },
  exitoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  exitoIcono: {
    fontSize: 42,
    textAlign: 'center',
    marginBottom: 8,
  },
  exitoTitulo: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  exitoTexto: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
});
