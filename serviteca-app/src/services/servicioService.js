// ============================================================
// SERVITECA JM - SERVICIO DE SERVICIOS AUTOMOTRICES
// ============================================================
// Cliente  : GET  /api/mi/servicios  (servicios de su vehículo)
// Empleado : GET  /api/servicios     (todos)
//            POST /api/servicios     (ADMIN/TECNICO crean servicios)
//
// Estados del enum Servicio.Estado:
// PROGRAMADO | EN_PROCESO | COMPLETADO | CANCELADO
// ============================================================

import api from './api';

export function listarServicios(esCliente) {
  return esCliente ? api.get('/mi/servicios') : api.get('/servicios');
}

export function crearServicio(servicio) {
  return api.post('/servicios', servicio);
}
