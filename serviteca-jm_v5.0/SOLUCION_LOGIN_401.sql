-- ============================================================
-- SOLUCIÓN LOGIN 401 - SERVITECA JM v5
-- Base configurada en application.properties: DB_PRODISJM
--
-- IMPORTANTE:
-- Este script deja temporalmente al usuario Juan como ADMIN/ACTIVO
-- y le asigna la contraseña temporal: Admin123!
-- Después del primer ingreso, cámbiala desde el módulo de usuarios.
-- ============================================================

-- 1. Verificar el usuario antes de modificarlo
SELECT idusuario, nombre, correo, rol, estado,
       LENGTH(contrasena) AS longitud_contrasena
FROM usuario
WHERE LOWER(TRIM(correo)) = LOWER(TRIM('juan.perez@gmail.com'));

-- 2. Normalizar roles existentes.
-- El enum Java usa ADMIN, TECNICO y CLIENTE.
UPDATE usuario
SET rol = UPPER(TRIM(rol));

-- 3. Activar y asignar rol ADMIN al usuario de prueba.
-- Hash BCrypt para: Admin123!
UPDATE usuario
SET rol = 'ADMIN',
    estado = 'ACTIVO',
    contrasena = '$2a$10$Bv78oMaR.jOGcaGqOd9Ue.GI34zHTjohdgpKng0heE/iI6sFH9FLC'
WHERE LOWER(TRIM(correo)) = LOWER(TRIM('juan.perez@gmail.com'));

-- 4. Verificación final.
SELECT idusuario, nombre, correo, rol, estado,
       LENGTH(contrasena) AS longitud_contrasena,
       LEFT(contrasena, 4) AS tipo_hash
FROM usuario
WHERE LOWER(TRIM(correo)) = LOWER(TRIM('juan.perez@gmail.com'));

-- Debe quedar:
-- rol = ADMIN
-- estado = ACTIVO
-- longitud_contrasena = 60
-- tipo_hash = $2a$

-- Si la consulta UPDATE anterior afectó 0 filas, el correo no existe.
-- En ese caso NO ejecutes un INSERT a ciegas: primero revisa los correos
-- existentes con:
-- SELECT idusuario,nombre,correo,rol,estado FROM usuario ORDER BY idusuario;
