// ============================================================
// SERVITECA JM - SERVICIO DE SERVICIOS AUTOMOTRICES
// ============================================================
// Cliente  : GET  /api/mi/servicios  (servicios de su vehículo)
// Empleado : GET  /api/servicios     (todos, respuesta paginada)
//            POST /api/servicios     (ADMIN/TECNICO crean servicios)
//
// Estados del enum Servicio.Estado:
// PROGRAMADO | EN_PROCESO | COMPLETADO | CANCELADO
// ============================================================

import api from './api';

/**
 * El endpoint de empleados devuelve una página de Spring Data
 * ({ content, totalElements, ... }). El dashboard solo necesita la
 * lista, así que se normaliza aquí y se pide una página amplia.
 */
export async function listarServicios(esCliente) {
  if (esCliente) {
    return api.get('/mi/servicios');
  }

  const respuesta = await api.get('/servicios?page=0&size=100');
  if (Array.isArray(respuesta)) return respuesta;
  return Array.isArray(respuesta?.content) ? respuesta.content : [];
}

export function crearServicio(servicio) {
  return api.post('/servicios', servicio);
}
