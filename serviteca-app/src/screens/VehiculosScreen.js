// ============================================================
// PANTALLA: VEHÍCULOS
// ============================================================
// Lista los vehículos visibles para el rol autenticado:
//   Cliente  -> GET /api/mi/vehiculos  (y puede registrar nuevos)
//   Empleado -> GET /api/vehiculos     (solo consulta)
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Card from '../components/Card';
import Loader, { EmptyState } from '../components/Loader';
import VehiculoForm from '../components/VehiculoForm';
import { useAuth } from '../context/AuthContext';
import { listarVehiculos } from '../services/vehiculoService';
import { colors } from '../theme';

export default function VehiculosScreen() {
  const { esCliente } = useAuth();

  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');

    try {
      const lista = await listarVehiculos(esCliente);
      setVehiculos(Array.isArray(lista) ? lista : []);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los vehículos.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [esCliente]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function refrescar() {
    setRefrescando(true);
    await cargar();
  }

  if (cargando) {
    return <Loader text="Cargando vehículos..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={refrescar}
          tintColor={colors.primary}
        />
      }
    >
      <Card style={styles.header}>
        <Text style={styles.headerTitle}>Mis vehículos</Text>
        <Text style={styles.headerSubtitle}>
          {esCliente
            ? 'Vehículos registrados a tu nombre.'
            : 'Vehículos registrados en el taller.'}
        </Text>
      </Card>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {vehiculos.length === 0 ? (
        <EmptyState
          title="No hay vehículos"
          message={
            esCliente
              ? 'Registra tu vehículo desde la pestaña "Solicitar".'
              : 'Aún no hay vehículos registrados por los clientes.'
          }
        />
      ) : (
        vehiculos.map((vehiculo) => (
          <Card key={`veh-${vehiculo.idvehiculo}`}>
            <View style={styles.rowBetween}>
              <Text style={styles.placa}>{vehiculo.placa}</Text>
              <Text style={styles.km}>
                {vehiculo.kilometraje !== null &&
                vehiculo.kilometraje !== undefined
                  ? `${Number(vehiculo.kilometraje).toLocaleString()} km`
                  : '— km'}
              </Text>
            </View>

            <Text style={styles.modelo}>
              {vehiculo.marca} {vehiculo.modelo}
            </Text>

            {vehiculo.color ? (
              <Text style={styles.detalle}>Color: {vehiculo.color}</Text>
            ) : null}
          </Card>
        ))
      )}

      {esCliente ? (
        <VehiculoForm onCreated={() => cargar()} />
      ) : (
        <Text style={styles.nota}>
          El alta de vehículos lo realiza el cliente desde su cuenta.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placa: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  km: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modelo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  detalle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  nota: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
