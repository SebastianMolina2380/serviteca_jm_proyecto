# Serviteca JM v5 - correcciones

## 1. Problemas encontrados
1. `UsuarioController` ya tenía GET `/api/usuarios`, pero `usuarios.js` no hacía el fetch.
2. `nuevo-usuario.html` enviaba `email/password`, mientras la entidad usa `correo/contrasena`.
3. El frontend comprobaba `localStorage.servitecaToken`, pero Spring Security está usando sesión HTTP (`JSESSIONID`).
4. `SecurityConfig` usaba `NoOpPasswordEncoder`; se cambió a BCrypt.
5. El modelo JPA usa tablas singulares (`usuario`, `vehiculo`, `cita`, `servicio`), mientras `static/db/schema.sql` crea tablas plurales. Esa mezcla puede hacer que la aplicación consulte una tabla diferente de la que pgAdmin muestra.
6. No existían en `Usuario` los campos de estado y último acceso.
7. `Servicio` no tenía estado/progreso/fecha de servicio.
8. El portal ya tenía `/api/mi/vehiculos`, pero no citas/servicios; se añadieron.

## 2. Orden de instalación
1. Haz copia de seguridad de PostgreSQL.
2. Ejecuta `src/main/resources/static/db/migracion_v5.sql` en la MISMA base de datos configurada en `application.properties`.
3. Migra las contraseñas existentes a BCrypt.
4. Revisa `application.properties`: URL, usuario y contraseña de PostgreSQL.
5. Borra `target/` y ejecuta `mvn clean package`.
6. Inicia Spring Boot desde IntelliJ.
7. En navegador, entra por `http://localhost:8080/login.html`.
8. No abras los HTML con doble clic (`file://...`), porque las llamadas fetch deben pasar por Spring.

## 3. Login
El login es por sesión HTTP. No se usa Bearer token.
`POST /api/auth/login` recibe:
`{ "correo": "...", "contrasena": "...", "rol": "admin|tecnico|cliente" }`

Después de autenticar, Spring guarda el SecurityContext en sesión y `/api/auth/me` devuelve el usuario autenticado.

## 4. Usuarios
GET `/api/usuarios` devuelve DTOs sin contraseña. La tabla se pinta desde PostgreSQL.
El formulario soporta CC, CE, NIT, PASAPORTE y TI; agrega fácilmente otros tipos.

## 5. Portal
El portal no confía en un `idUsuario` enviado por el navegador. Obtiene al usuario desde `Authentication`, y por eso un cliente solo recibe sus vehículos, citas y servicios.

## 6. Agendar
`agendar-servicio.js` contiene una función base para cargar servicios y crear una cita. La entidad `Cita` vincula vehículo, fecha, hora y usuario autenticado.

## 7. Reportes
`GET /api/reportes?desde=2026-09-01&hasta=2026-09-30` devuelve citas, servicios y suma de servicios completados.
