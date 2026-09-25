// ============================================================
// SERVITECA JM - API
// ============================================================
// La interfaz se sirve desde Spring Boot, por lo que utiliza
// el mismo host y puerto que el backend.
//
// Frontend:
// http://localhost:8081
//
// API:
// http://localhost:8081/api
//
// PostgreSQL NO se conecta directamente desde JavaScript.
// La comunicación es:
//
// HTML / JS
//     ↓
// Spring Boot REST API
//     ↓
// JPA / Hibernate
//     ↓
// PostgreSQL
// ============================================================

const API_URL = '/api';


// ============================================================
// FUNCIÓN GENERAL PARA PETICIONES
// ============================================================

async function request(path, options = {}) {

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {

    const message = await response.text();

    throw new Error(
        message || `Error HTTP ${response.status}`
    );
  }

  // DELETE normalmente devuelve 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}


// ============================================================
// USUARIOS
// ============================================================

async function login(correo, contrasena, rol = 'cliente') {

  const response = await fetch(
      '/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          correo,
          contrasena,
          rol
        })
      }
  );

  if (!response.ok) {

    const message = await response.text();

    throw new Error(
        message || 'Correo o contraseña incorrectos'
    );
  }

  const user = await response.json();

  // Guardar usuario para utilizarlo en dashboard y otras páginas
  localStorage.setItem(
      'user',
      JSON.stringify(user)
  );

  return user;
}


async function getUsuarios() {
  return request('/usuarios');
}


async function getUsuario(id) {
  return request(`/usuarios/${id}`);
}


async function createUsuario(usuario) {

  return request('/usuarios', {
    method: 'POST',
    body: JSON.stringify(usuario)
  });
}


async function updateUsuario(id, usuario) {

  return request(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(usuario)
  });
}


async function deleteUsuario(id) {

  return request(`/usuarios/${id}`, {
    method: 'DELETE'
  });
}


// ============================================================
// CITAS
// ============================================================

async function getCitas() {
  return request('/citas');
}


async function getCita(id) {
  return request(`/citas/${id}`);
}


async function getCitasPorUsuario(idUsuario) {

  return request(
      `/citas/usuario/${idUsuario}`
  );
}


async function getCitasPorFecha(fecha) {

  return request(
      `/citas/fecha/${fecha}`
  );
}


async function getCitasPorEstado(estado) {

  return request(
      `/citas/estado/${estado}`
  );
}


async function createCita(cita) {

  return request('/citas', {
    method: 'POST',
    body: JSON.stringify(cita)
  });
}


async function updateCita(id, cita) {

  return request(`/citas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cita)
  });
}


async function cancelarCita(id) {

  return request(
      `/citas/${id}/cancelar`,
      {
        method: 'PATCH'
      }
  );
}


async function confirmarCita(id) {

  return request(
      `/citas/${id}/confirmar`,
      {
        method: 'PATCH'
      }
  );
}


async function deleteCita(id) {

  return request(`/citas/${id}`, {
    method: 'DELETE'
  });
}


// ============================================================
// SERVICIOS
// ============================================================

async function getServicios() {

  return request('/servicios');
}


async function getServicio(id) {

  return request(`/servicios/${id}`);
}


async function createServicio(servicio) {

  return request('/servicios', {
    method: 'POST',
    body: JSON.stringify(servicio)
  });
}


async function updateServicio(id, servicio) {

  return request(`/servicios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(servicio)
  });
}


async function deleteServicio(id) {

  return request(`/servicios/${id}`, {
    method: 'DELETE'
  });
}


// ============================================================
// VEHÍCULOS
// ============================================================
// IMPORTANTE:
//
// El Controller utiliza:
//
// @RequestMapping("/api/vehiculos")
//
// Por eso aquí debe utilizarse:
//
// /vehiculos
//
// NO:
//
// /vehiculo
// ============================================================

async function getVehiculos() {

  return request('/vehiculos');
}


async function getVehiculo(id) {

  return request(`/vehiculos/${id}`);
}


async function createVehiculo(vehiculo) {

  return request('/vehiculos', {
    method: 'POST',
    body: JSON.stringify(vehiculo)
  });
}


async function updateVehiculo(id, vehiculo) {

  return request(`/vehiculos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehiculo)
  });
}


async function deleteVehiculo(id) {

  return request(`/vehiculos/${id}`, {
    method: 'DELETE'
  });
}


// ============================================================
// INVENTARIO
// ============================================================

async function getInventario() {

  return request('/inventarios');
}


async function getInventarioItem(id) {

  return request(`/inventarios/${id}`);
}


async function createInventario(item) {

  return request('/inventarios', {
    method: 'POST',
    body: JSON.stringify(item)
  });
}


async function updateInventario(id, item) {

  return request(`/inventarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  });
}


async function deleteInventario(id) {

  return request(`/inventarios/${id}`, {
    method: 'DELETE'
  });
}


// ============================================================
// FACTURAS
// ============================================================

async function getFacturas() {

  return request('/facturas');
}


async function getFactura(id) {

  return request(`/facturas/${id}`);
}


async function createFactura(factura) {

  return request('/facturas', {
    method: 'POST',
    body: JSON.stringify(factura)
  });
}


async function updateFactura(id, factura) {

  return request(`/facturas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(factura)
  });
}


async function deleteFactura(id) {

  return request(`/facturas/${id}`, {
    method: 'DELETE'
  });
}


// ============================================================
// DETALLES DE FACTURA
// ============================================================

async function getDetallesFactura() {

  return request('/detalle-factura');
}


async function getDetalleFactura(id) {

  return request(
      `/detalle-factura/${id}`
  );
}


async function createDetalleFactura(detalle) {

  return request('/detalle-factura', {
    method: 'POST',
    body: JSON.stringify(detalle)
  });
}


async function updateDetalleFactura(id, detalle) {

  return request(
      `/detalle-factura/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(detalle)
      }
  );
}


async function deleteDetalleFactura(id) {

  return request(
      `/detalle-factura/${id}`,
      {
        method: 'DELETE'
      }
  );
}


async function getDetallesPorFactura(idFactura) {

  return request(
      `/detalle-factura/factura/${idFactura}`
  );
}


async function getDetallesPorServicio(idServicio) {

  return request(
      `/detalle-factura/servicio/${idServicio}`
  );
}


// ============================================================
// EXPONER API AL RESTO DEL FRONTEND
// ============================================================

window.ServitecaApi = {

  // USUARIOS
  login,
  getUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,

  // CITAS
  getCitas,
  getCita,
  getCitasPorUsuario,
  getCitasPorFecha,
  getCitasPorEstado,
  createCita,
  updateCita,
  cancelarCita,
  confirmarCita,
  deleteCita,

  // SERVICIOS
  getServicios,
  getServicio,
  createServicio,
  updateServicio,
  deleteServicio,

  // VEHÍCULOS
  getVehiculos,
  getVehiculo,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,

  // INVENTARIO
  getInventario,
  getInventarioItem,
  createInventario,
  updateInventario,
  deleteInventario,

  // FACTURAS
  getFacturas,
  getFactura,
  createFactura,
  updateFactura,
  deleteFactura,

  // DETALLES DE FACTURA
  getDetallesFactura,
  getDetalleFactura,
  createDetalleFactura,
  updateDetalleFactura,
  deleteDetalleFactura,
  getDetallesPorFactura,
  getDetallesPorServicio
};


// ============================================================
// INFORMACIÓN DEL USUARIO EN EL SIDEBAR
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

      const user = JSON.parse(
          localStorage.getItem('user') || 'null'
      );

      if (!user) {
        return;
      }


      // ----------------------------------------------------
      // Iniciales
      // ----------------------------------------------------

      const nombreUsuario =
          user.nombre || 'Usuario';

      const initials = nombreUsuario
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(part => part[0])
          .join('')
          .toUpperCase();


      // ----------------------------------------------------
      // Roles
      // ----------------------------------------------------

      const roleLabels = {

        admin: 'Administrador',

        tecnico: 'Técnico',

        cliente: 'Cliente'

      };


      // ----------------------------------------------------
      // Elementos del sidebar
      // ----------------------------------------------------

      const avatar =
          document.getElementById('sbav');

      const name =
          document.getElementById('sbname');

      const role =
          document.getElementById('sbrole');


      if (avatar) {

        avatar.textContent =
            initials || 'JM';
      }


      if (name) {

        name.textContent =
            nombreUsuario;
      }


      if (role) {

        role.textContent =
            roleLabels[user.rol] ||
            user.rol ||
            'Usuario';
      }

    }
);