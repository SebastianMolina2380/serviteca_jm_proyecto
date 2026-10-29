// ============================================================
// CAMPO DE FECHA / HORA CON SELECTOR NATIVO
// ============================================================
// Usa @react-native-community/datetimepicker en Android e iOS.
// En web se resuelve DatePickerField.web.js (campos de texto),
// porque el paquete nativo no tiene implementación web.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from './Button';
import { colors } from '../theme';

function parseFecha(texto) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto || '');

  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

function parseHora(texto) {
  const match = /^(\d{2}):(\d{2})$/.exec(texto || '');
  const hora = new Date();

  if (match) {
    hora.setHours(Number(match[1]), Number(match[2]), 0, 0);
  } else {
    hora.setHours(9, 0, 0, 0);
  }

  return hora;
}

function formatear(fechaDate, modo) {
  if (modo === 'date') {
    const mes = String(fechaDate.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaDate.getDate()).padStart(2, '0');
    return `${fechaDate.getFullYear()}-${mes}-${dia}`;
  }

  const horas = String(fechaDate.getHours()).padStart(2, '0');
  const minutos = String(fechaDate.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function mostrar(texto, modo) {
  if (modo === 'date') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);

    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    return texto;
  }

  return `${texto} h`;
}

export default function DatePickerField({
  label,
  mode = 'date',
  value,
  onChange,
  placeholder,
  minimumDate,
}) {
  const [abierto, setAbierto] = useState(false);
  const [temporal, setTemporal] = useState(() =>
    mode === 'date' ? parseFecha(value) : parseHora(value)
  );

  function abrirSelector() {
    const inicial = mode === 'date' ? parseFecha(value) : parseHora(value);

    setTemporal(inicial);
    setAbierto(true);

    // Al abrir sin valor previo se propone la fecha de hoy o las
    // 09:00, para que el formulario nunca quede a medias.
    if (!value) onChange(formatear(inicial, mode));
  }

  function cambiar(evento, seleccionado) {
    // En Android el diálogo se cierra solo tras elegir o cancelar.
    if (Platform.OS === 'android') setAbierto(false);

    if (!seleccionado || (evento && evento.type === 'dismissed')) return;

    setTemporal(seleccionado);
    onChange(formatear(seleccionado, mode));
  }

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={abrirSelector}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value || placeholder || 'Sin valor' }}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? mostrar(value, mode) : placeholder || 'Selecciona un valor'}
        </Text>

        <Ionicons
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size={20}
          color={colors.textMuted}
        />
      </Pressable>

      {abierto ? (
        <View style={styles.pickerBox}>
          <DateTimePicker
            value={temporal}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={mode === 'date' ? minimumDate : undefined}
            onChange={cambiar}
            is24Hour
            locale="es-CO"
          />

          {Platform.OS === 'ios' ? (
            <Button
              title="Listo"
              variant="secondary"
              onPress={() => setAbierto(false)}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldPressed: {
    backgroundColor: colors.background,
  },
  value: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.textMuted,
  },
  pickerBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
});
