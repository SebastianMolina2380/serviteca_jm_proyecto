// ============================================================
// SERVITECA JM - SERVICIO DE VEHÍCULOS
// ============================================================
// Cliente  : GET/POST /api/mi/vehiculos  (solo sus vehículos)
// Empleado : GET       /api/vehiculos     (todos)
// ============================================================

import api from './api';

export function listarVehiculos(esCliente) {
  return esCliente ? api.get('/mi/vehiculos') : api.get('/vehiculos');
}

export function crearVehiculo(vehiculo) {
  return api.post('/mi/vehiculos', vehiculo);
}
