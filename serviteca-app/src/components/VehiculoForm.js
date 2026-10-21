// ============================================================
// COMPONENTE: FORMULARIO DE REGISTRO DE VEHÍCULO
// ============================================================
// Se usa en la pantalla "Solicitar" y en la pantalla
// "Vehículos" para dar de alta un vehículo del cliente.
// POST /api/mi/vehiculos
// ============================================================

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from './Button';
import Card from './Card';
import Input from './Input';
import { crearVehiculo } from '../services/vehiculoService';
import { colors } from '../theme';

export default function VehiculoForm({ onCreated, onCancel }) {
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [kilometraje, setKilometraje] = useState('');

  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setError('');

    if (!placa.trim() || !marca.trim() || !modelo.trim()) {
      setError('Placa, marca y modelo son obligatorios.');
      return;
    }

    if (kilometraje && Number.isNaN(Number(kilometraje))) {
      setError('El kilometraje debe ser un número.');
      return;
    }

    setGuardando(true);

    try {
      const vehiculo = await crearVehiculo({
        placa: placa.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        color: color.trim() || null,
        kilometraje: kilometraje ? Number(kilometraje) : null,
      });

      // Reiniciar campos
      setPlaca('');
      setMarca('');
      setModelo('');
      setColor('');
      setKilometraje('');

      if (onCreated) onCreated(vehiculo);
    } catch (e) {
      setError(e.message || 'No se pudo registrar el vehículo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Registrar vehículo</Text>

      <Input
        label="Placa *"
        placeholder="ABC123"
        value={placa}
        onChangeText={setPlaca}
        autoCapitalize="characters"
        maxLength={10}
      />

      <Input
        label="Marca *"
        placeholder="Chevrolet"
        value={marca}
        onChangeText={setMarca}
      />

      <Input
        label="Modelo *"
        placeholder="Aveo"
        value={modelo}
        onChangeText={setModelo}
      />

      <Input
        label="Color"
        placeholder="Blanco"
        value={color}
        onChangeText={setColor}
      />

      <Input
        label="Kilometraje"
        placeholder="45000"
        value={kilometraje}
        onChangeText={setKilometraje}
        keyboardType="numeric"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <Button
            title="Guardar vehículo"
            onPress={guardar}
            loading={guardando}
          />
        </View>

        {onCancel ? (
          <View style={styles.actionButton}>
            <Button title="Cancelar" variant="secondary" onPress={onCancel} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
