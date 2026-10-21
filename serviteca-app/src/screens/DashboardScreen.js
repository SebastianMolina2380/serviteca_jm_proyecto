// ============================================================
// PANTALLA: DASHBOARD (Pantalla principal)
// ============================================================
// Muestra el estado de los servicios automotrices solicitados
// o en proceso, más las citas programadas.
//
// Cliente  : GET /api/mi/servicios + GET /api/mi/citas
// Empleado : GET /api/servicios    + GET /api/citas
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
import EstadoBadge from '../components/EstadoBadge';
import Loader, { EmptyState } from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { listarCitas } from '../services/citaService';
import { listarServicios } from '../services/servicioService';
import { colors } from '../theme';
import {
  describirVehiculo,
  formatearFecha,
  formatearHora,
  formatearDinero,
} from '../utils/format';

export default function DashboardScreen({ navigation }) {
  const { user, logout, esCliente } = useAuth();

  const [servicios, setServicios] = useState([]);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');

    try {
      const [srv, cts] = await Promise.all([
        listarServicios(esCliente),
        listarCitas(esCliente),
      ]);

      setServicios(Array.isArray(srv) ? srv : []);
      setCitas(Array.isArray(cts) ? cts : []);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los datos.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [esCliente]);

  // Carga inicial de datos
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function refrescar() {
    setRefrescando(true);
    await cargar();
  }

  const enProceso = servicios.filter((s) => s.estado === 'EN_PROCESO').length;
  const completados = servicios.filter(
    (s) => s.estado === 'COMPLETADO'
  ).length;
  const programados = servicios.filter(
    (s) => s.estado === 'PROGRAMADO'
  ).length;
  const citasPendientes = citas.filter(
    (c) => c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADO'
  ).length;

  if (cargando) {
    return <Loader text="Cargando dashboard..." />;
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
      {/* Saludo */}
      <Card style={styles.greeting}>
        <Text style={styles.greetingTitle}>
          Hola, {user ? user.nombre : 'usuario'}
        </Text>
        <Text style={styles.greetingSubtitle}>
          {esCliente
            ? 'Estado de tus servicios automotrices'
            : 'Servicios en curso del taller'}
        </Text>
        <Text
          style={styles.logout}
          onPress={logout}
        >
          Cerrar sesión
        </Text>
      </Card>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {/* Tarjetas de resumen */}
      <View style={styles.statsRow}>
        <StatBox valor={servicios.length} etiqueta="Servicios" />
        <StatBox valor={enProceso} etiqueta="En proceso" color={colors.warning} />
      </View>

      <View style={styles.statsRow}>
        <StatBox valor={programados} etiqueta="Programados" color={colors.info} />
        <StatBox valor={completados} etiqueta="Completados" color={colors.success} />
      </View>

      {/* Servicios */}
      <Text style={styles.sectionTitle}>
        {esCliente ? 'Mis servicios' : 'Servicios del taller'}
      </Text>

      {servicios.length === 0 ? (
        <EmptyState
          title="No hay servicios registrados"
          message={
            esCliente
              ? 'Solicita tu primer mantenimiento desde la pestaña "Solicitar".'
              : 'Aún no hay servicios creados en el sistema.'
          }
        />
      ) : (
        servicios.map((servicio) => (
          <Card key={`srv-${servicio.idServicio}`}>
            <View style={styles.rowBetween}>
              <Text style={styles.itemTitle}>{servicio.tipo}</Text>
              <EstadoBadge estado={servicio.estado} />
            </View>

            <Text style={styles.itemSubtitle}>
              {describirVehiculo(servicio.vehiculo)}
            </Text>

            {servicio.descripcion ? (
              <Text style={styles.itemText}>{servicio.descripcion}</Text>
            ) : null}

            {/* Barra de progreso */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Number(servicio.progreso) || 0}%` },
                ]}
              />
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.itemMeta}>
                Avance: {Number(servicio.progreso) || 0}%
              </Text>
              <Text style={styles.itemMeta}>
                {formatearDinero(servicio.precio)}
              </Text>
            </View>

            {servicio.fechaServicio ? (
              <Text style={styles.itemMeta}>
                Fecha: {formatearFecha(servicio.fechaServicio)}
              </Text>
            ) : null}
          </Card>
        ))
      )}

      {/* Citas */}
      <Text style={styles.sectionTitle}>Citas programadas</Text>

      {citas.length === 0 ? (
        <EmptyState
          title="No tienes citas"
          message={'Agenda una cita de mantenimiento desde la pestaña "Solicitar".'}
        />
      ) : (
        citas.map((cita) => (
          <Card key={`cita-${cita.idCita}`}>
            <View style={styles.rowBetween}>
              <Text style={styles.itemTitle}>
                {formatearFecha(cita.fecha)} · {formatearHora(cita.hora)}
              </Text>
              <EstadoBadge estado={cita.estado} />
            </View>
            <Text style={styles.itemSubtitle}>
              {describirVehiculo(cita.vehiculo)}
            </Text>
          </Card>
        ))
      )}

      <Text style={styles.footer}>
        Citas pendientes/confirmadas: {citasPendientes}
      </Text>
    </ScrollView>
  );
}

function StatBox({ valor, etiqueta, color = colors.primary }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{valor}</Text>
      <Text style={styles.statLabel}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  greeting: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  greetingTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  greetingSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  logout: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  errorCard: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  itemSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  itemText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.background,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});
