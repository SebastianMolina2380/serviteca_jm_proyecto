// ============================================================
// SERVITECA JM - SERVICIO DE CITAS
// ============================================================
// Cliente  : GET  /api/mi/citas  (sus citas)
// Empleado : GET  /api/citas     (todas)
// Ambos    : POST /api/citas     (crear solicitud de cita)
//
// Cuerpo de creación:
// {
//   "fecha": "2026-10-05",
//   "hora": "09:30:00",
//   "vehiculo": { "idvehiculo": 1 }
// }
//
// Estados del enum Cita.Estado:
// PENDIENTE | CONFIRMADO | CANCELADA | COMPLETADA
// ============================================================

import api from './api';

export function listarCitas(esCliente) {
  return esCliente ? api.get('/mi/citas') : api.get('/citas');
}

export function crearCita(cita) {
  return api.post('/citas', cita);
}
