# Ajustes solicitados - Serviteca JM

## 1. Vehículos
- `VehiculoController.java`: endpoint `/api/vehiculos/{id}/historial` devuelve vehículo, servicios y citas reales y valida propiedad para CLIENTE.
- `vehiculo.js`: elimina el contenido estático de historial/estado y lo carga desde PostgreSQL.

## 2. Usuarios / Clientes
- `/api/usuarios` sigue listando todos los roles y `usuarios.html` consume ese endpoint.
- `/api/clientes` filtra exclusivamente `Usuario.Rol.CLIENTE`; `clientes.html/js` consume ese endpoint.
- La restricción se aplica en backend con `@PreAuthorize`.

## 3. Portal Cliente
- `MiController`: `/api/mi/vehiculos`, `/api/mi/citas`, `/api/mi/servicios` y nuevo `/api/mi/facturas`.
- `portal-cliente.js`: carga datos de sesión, vehículos, citas, servicios, historial y facturas reales.
- `VehiculoController` y servicios/citas validan que CLIENTE solo consulte sus propios registros.

## 4. Facturación
- `FacturaController`: respuestas enriquecidas con cliente, vehículo, detalles y datos de pago. CLIENTE solo puede leer sus propias facturas.
- `facturacion.js`: plantilla de impresión/PDF visualmente adaptada a la imagen suministrada: encabezado, datos cliente, fechas, ítems, valor en letras, IVA 19%, total, forma/medio de pago, placa y pie legal.
- `jm-logo.png`: logo usado en la plantilla. El botón usa el diálogo de impresión del navegador, donde se puede seleccionar “Guardar como PDF”.

## Migración SQL
Ejecutar `src/main/resources/static/db/migracion_facturacion_portal.sql` sobre la BD real (tablas singulares JPA).

## Prueba
1. Ejecutar migración.
2. Levantar Spring Boot.
3. Iniciar sesión.
4. Vehículos: abrir `vehiculo.html?id=<id>` y comprobar historial real.
5. Usuarios: comprobar que aparecen ADMIN/TECNICO/CLIENTE.
6. Clientes: comprobar que solo aparecen CLIENTE.
7. CLIENTE: portal y `/api/mi/*` solo devuelven sus datos.
8. Facturación: abrir `facturacion.html` y pulsar PDF/Imprimir. En la ventana elegir “Guardar como PDF”.
