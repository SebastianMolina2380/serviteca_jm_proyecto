// ============================================================
// PANTALLA: SOLICITAR MANTENIMIENTO
// ============================================================
// Módulo básico de registro/solicitud de mantenimiento
// vehicular.
//
// CLIENTE:
//   1. Registra su vehículo (si aún no tiene uno).
//   2. Selecciona vehículo, fecha y hora.
//   3. Crea la solicitud -> POST /api/citas
//      (el taller la confirma y genera el servicio).
//
// EMPLEADO (TÉCNICO/ADMIN):
//   Puede crear una Cita (POST /api/citas) o directamente
//   un Servicio (POST /api/servicios).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import DatePickerField from '../components/DatePickerField';
import Input from '../components/Input';
import Loader, { EmptyState } from '../components/Loader';
import VehiculoForm from '../components/VehiculoForm';
import { useAuth } from '../context/AuthContext';
import { crearCita } from '../services/citaService';
import { crearServicio } from '../services/servicioService';
import { listarVehiculos } from '../services/vehiculoService';
import { colors } from '../theme';
import { describirVehiculo } from '../utils/format';

// ------------------------------------------------------------
// Validaciones auxiliares
// ------------------------------------------------------------
function esFechaValida(texto) {
  const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return false;

  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);

  const fecha = new Date(y, m - 1, d);

  return (
    fecha.getFullYear() === y &&
    fecha.getMonth() === m - 1 &&
    fecha.getDate() === d
  );
}

function hoyISO() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function esHoraValida(texto) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(texto);
}

export default function SolicitarMantenimientoScreen({ navigation }) {
  const { esCliente, esEmpleado } = useAuth();

  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vehiculoSel, setVehiculoSel] = useState(null);

  const [mostrarFormVehiculo, setMostrarFormVehiculo] = useState(false);

  // Modo (solo empleados): 'cita' | 'servicio'
  const [modo, setModo] = useState('cita');

  // Datos de la solicitud
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  // Datos del servicio (empleados)
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');

  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarVehiculos = useCallback(async () => {
    setError('');

    try {
      const lista = await listarVehiculos(esCliente);
      const datos = Array.isArray(lista) ? lista : [];

      setVehiculos(datos);

      // Seleccionar el primero por defecto
      if (datos.length > 0) {
        setVehiculoSel((actual) =>
          actual && datos.some((v) => v.idvehiculo === actual)
            ? actual
            : datos[0].idvehiculo
        );
      } else {
        setVehiculoSel(null);
      }
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los vehículos.');
    } finally {
      setCargando(false);
    }
  }, [esCliente]);

  useEffect(() => {
    cargarVehiculos();
  }, [cargarVehiculos]);

  async function enviarSolicitud() {
    setError('');

    // Validaciones comunes
    if (!vehiculoSel) {
      setError('Selecciona o registra un vehículo.');
      return;
    }

    if (!fecha.trim()) {
      setError('Ingresa la fecha (formato AAAA-MM-DD).');
      return;
    }

    if (!esFechaValida(fecha.trim())) {
      setError('La fecha no es válida. Usa el formato AAAA-MM-DD.');
      return;
    }

    if (fecha.trim() < hoyISO()) {
      setError('La fecha no puede ser anterior a hoy.');
      return;
    }

    if (!esHoraValida(hora.trim())) {
      setError('La hora no es válida. Usa el formato HH:MM (ej. 09:30).');
      return;
    }

    const horaNormalizada = `${hora.trim()}:00`;

    setGuardando(true);

    try {
      if (esCliente || modo === 'cita') {
        // --------------------------------------------------
        // CLIENTE (y empleados en modo cita): crear CITA
        // --------------------------------------------------
        await crearCita({
          fecha: fecha.trim(),
          hora: horaNormalizada,
          vehiculo: { idvehiculo: vehiculoSel },
        });

        Alert.alert(
          'Solicitud enviada',
          'Tu solicitud de mantenimiento fue registrada como cita. El taller la confirmará pronto.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Inicio'),
            },
          ]
        );
      } else {
        // --------------------------------------------------
        // EMPLEADO: crear SERVICIO directamente
        // --------------------------------------------------
        if (!tipo.trim()) {
          setGuardando(false);
          setError('Indica el tipo de servicio (ej. Cambio de aceite).');
          return;
        }

        if (!precio.trim() || Number.isNaN(Number(precio))) {
          setGuardando(false);
          setError('Ingresa un precio válido.');
          return;
        }

        await crearServicio({
          tipo: tipo.trim(),
          descripcion: descripcion.trim() || null,
          precio: Number(precio),
          activo: true,
          estado: 'PROGRAMADO',
          progreso: 0,
          fechaServicio: `${fecha.trim()}T${horaNormalizada}`,
          vehiculo: { idvehiculo: vehiculoSel },
        });

        Alert.alert(
          'Servicio creado',
          'El servicio automotriz fue registrado exitosamente.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Inicio'),
            },
          ]
        );
      }

      // Reiniciar formulario
      setFecha('');
      setHora('');
      setTipo('');
      setDescripcion('');
      setPrecio('');
    } catch (e) {
      setError(e.message || 'No se pudo enviar la solicitud.');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <Loader text="Cargando vehículos..." />;
  }

  const sinVehiculos = vehiculos.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.header}>
        <Text style={styles.headerTitle}>Solicitar mantenimiento</Text>
        <Text style={styles.headerSubtitle}>
          {esCliente
            ? 'Registra tu vehículo (si no lo has hecho) y agenda la cita.'
            : 'Crea una cita o un servicio para el vehículo del cliente.'}
        </Text>
      </Card>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {/* ------------------------------------------------ */}
      {/* REGISTRO DE VEHÍCULO                              */}
      {/* ------------------------------------------------ */}
      {esCliente ? (
        mostrarFormVehiculo || sinVehiculos ? (
          <VehiculoForm
            onCreated={() => {
              setMostrarFormVehiculo(false);
              cargarVehiculos();
            }}
            onCancel={sinVehiculos ? null : () => setMostrarFormVehiculo(false)}
          />
        ) : (
          <Button
            title="+ Registrar otro vehículo"
            variant="secondary"
            onPress={() => setMostrarFormVehiculo(true)}
          />
        )
      ) : null}

      {/* ------------------------------------------------ */}
      {/* SELECCIÓN DE VEHÍCULO                             */}
      {/* ------------------------------------------------ */}
      {!sinVehiculos ? (
        <Card>
          <Text style={styles.sectionTitle}>1. Selecciona el vehículo</Text>

          {vehiculos.map((vehiculo) => {
            const activo = vehiculoSel === vehiculo.idvehiculo;

            return (
              <Pressable
                key={`veh-${vehiculo.idvehiculo}`}
                onPress={() => setVehiculoSel(vehiculo.idvehiculo)}
                style={[styles.vehiculoOption, activo && styles.vehiculoActivo]}
              >
                <Text
                  style={[
                    styles.vehiculoTexto,
                    activo && styles.vehiculoTextoActivo,
                  ]}
                >
                  {describirVehiculo(vehiculo)}
                </Text>
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <EmptyState
          title="Sin vehículos registrados"
          message="Primero registra tu vehículo para poder solicitar mantenimiento."
        />
      )}

      {/* ------------------------------------------------ */}
      {/* TIPO DE SOLICITUD (solo empleados)                */}
      {/* ------------------------------------------------ */}
      {esEmpleado && !sinVehiculos ? (
        <Card>
          <Text style={styles.sectionTitle}>2. Tipo de solicitud</Text>

          <View style={styles.segment}>
            <Pressable
              onPress={() => setModo('cita')}
              style={[styles.segmentBtn, modo === 'cita' && styles.segmentActivo]}
            >
              <Text
                style={[
                  styles.segmentTexto,
                  modo === 'cita' && styles.segmentTextoActivo,
                ]}
              >
                Cita
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setModo('servicio')}
              style={[
                styles.segmentBtn,
                modo === 'servicio' && styles.segmentActivo,
              ]}
            >
              <Text
                style={[
                  styles.segmentTexto,
                  modo === 'servicio' && styles.segmentTextoActivo,
                ]}
              >
                Servicio
              </Text>
            </Pressable>
          </View>
        </Card>
      ) : null}

      {/* ------------------------------------------------ */}
      {/* FECHA Y HORA                                      */}
      {/* ------------------------------------------------ */}
      {!sinVehiculos ? (
        <Card>
          <Text style={styles.sectionTitle}>
            {esEmpleado ? '3.' : '2.'} Fecha y hora
          </Text>

          <DatePickerField
            label="Fecha"
            mode="date"
            value={fecha}
            onChange={setFecha}
            placeholder="Selecciona una fecha"
            minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
          />

          <DatePickerField
            label="Hora"
            mode="time"
            value={hora}
            onChange={setHora}
            placeholder="Selecciona una hora"
          />

          {esCliente ? (
            <Text style={styles.nota}>
              Al enviar, tu solicitud quedará como cita PENDIENTE y el
              taller la confirmará.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {/* ------------------------------------------------ */}
      {/* DATOS DEL SERVICIO (solo empleados, modo servicio) */}
      {/* ------------------------------------------------ */}
      {esEmpleado && modo === 'servicio' && !sinVehiculos ? (
        <Card>
          <Text style={styles.sectionTitle}>4. Datos del servicio</Text>

          <Input
            label="Tipo de servicio *"
            placeholder="Cambio de aceite"
            value={tipo}
            onChangeText={setTipo}
          />

          <Input
            label="Descripción"
            placeholder="Detalles del trabajo a realizar..."
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            style={styles.textarea}
          />

          <Input
            label="Precio *"
            placeholder="150000"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
          />
        </Card>
      ) : null}

      {/* ------------------------------------------------ */}
      {/* BOTÓN ENVIAR                                      */}
      {/* ------------------------------------------------ */}
      {!sinVehiculos ? (
        <Button
          title={
            esCliente || modo === 'cita'
              ? 'Enviar solicitud de cita'
              : 'Crear servicio'
          }
          onPress={enviarSolicitud}
          loading={guardando}
        />
      ) : null}
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.primaryLight,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  vehiculoOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  vehiculoActivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  vehiculoTexto: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  vehiculoTextoActivo: {
    color: colors.primaryDark,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  segmentActivo: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  segmentTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  segmentTextoActivo: {
    color: '#FFF',
  },
  nota: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
