# Correcciones de roles, login y facturación

## Roles
- Se eliminó el rol `recep/recepcionista` de la interfaz y del enum de Java ya no existe.
- El login exige seleccionar uno de los roles existentes: `admin`, `tecnico`, `cliente`.
- El backend valida que el rol seleccionado coincida con el rol almacenado en PostgreSQL antes de crear la sesión.
- Spring Security protege las páginas y las APIs.

## Permisos
- **Admin:** acceso completo, gestión de usuarios/clientes/inventario/facturas.
- **Técnico:** dashboard, citas, vehículos, inventario, facturación y reportes; no gestiona usuarios ni elimina facturas.
- **Cliente:** portal propio, sus vehículos y sus citas; no accede a administración, inventario, usuarios ni facturación.

## Facturación
- La tabla de facturas ya no muestra `undefined` por utilizar nombres que no existen en la entidad JPA.
- El botón `PDF` genera una factura imprimible con número, cliente, documento/correo, fecha, vehículo, detalles y total.
- El botón `PDF` superior genera un listado de facturas.
- `Excel` exporta las facturas a CSV compatible con Excel.
- La eliminación de facturas queda limitada al administrador.
- El botón `Registrar pago` informa que la tabla `factura` actual no tiene columnas de método/estado de pago; no se inventan esos datos.

## Compatibilidad del frontend
- Se añadió `/api/auth/login`, `/api/auth/me` y logout por sesión HTTP.
- Se añadió `/api/dashboard`.
- Se añadió `/api/clientes` para trabajar con usuarios cuyo rol sea cliente.
- Se añadió `/api/mi/vehiculos` para el portal del cliente.
- El frontend de inventario usa `/api/inventarios` y los campos reales de la entidad.
- Citas, vehículos y facturas ahora consumen la estructura JSON real de las entidades JPA.

## Base de datos
El proyecto sigue apuntando a PostgreSQL `DB_PRODISJM` en `localhost:5432` mediante `application.properties`.

## Validación
Se comprobó la sintaxis de los archivos JavaScript con Node.js. No fue posible ejecutar `mvn compile` dentro del entorno porque el Maven Wrapper necesita descargar Maven desde Maven Central y el entorno de ejecución no tiene acceso de red saliente.
