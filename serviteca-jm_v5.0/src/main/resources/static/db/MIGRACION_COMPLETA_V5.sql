-- Ejecutar sobre la BD que usa serviteca-jm_v5.
-- IMPORTANTE: schema.sql del ZIP original crea tablas plurales (usuarios, clientes, vehiculos, etc.)
-- mientras JPA usa singular (usuario, vehiculo, servicio, cita). NO mezclar ambos esquemas.

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(30) DEFAULT 'CC';
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO';
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP NULL;

UPDATE usuario SET tipo_documento='CC' WHERE tipo_documento IS NULL OR tipo_documento='';
UPDATE usuario SET estado='ACTIVO' WHERE estado IS NULL OR estado='';

-- Asegurar roles permitidos. Primero quitar el CHECK antiguo porque puede aceptar
-- solamente minúsculas y bloquear el UPDATE a mayúsculas.
ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_rol_check;
ALTER TABLE usuario DROP CONSTRAINT IF EXISTS ck_usuario_rol;
UPDATE usuario SET rol = UPPER(TRIM(rol));
UPDATE usuario SET rol='CLIENTE' WHERE rol NOT IN ('ADMIN','TECNICO','CLIENTE');
ALTER TABLE usuario ADD CONSTRAINT usuario_rol_check CHECK (rol IN ('ADMIN','TECNICO','CLIENTE'));

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS direccion VARCHAR(180);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS ciudad VARCHAR(80);

ALTER TABLE servicio ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO';
ALTER TABLE servicio ADD COLUMN IF NOT EXISTS progreso INTEGER NOT NULL DEFAULT 0;
ALTER TABLE servicio ADD COLUMN IF NOT EXISTS fecha_servicio TIMESTAMP NULL;
ALTER TABLE servicio DROP CONSTRAINT IF EXISTS ck_servicio_progreso;
ALTER TABLE servicio ADD CONSTRAINT ck_servicio_progreso CHECK (progreso BETWEEN 0 AND 100);

-- Contraseñas: el backend ahora usa BCrypt.
-- Cada contraseña existente debe ser migrada a un hash BCrypt válido.
-- NO guardes contraseñas en texto plano.
-- Ejemplo (reemplazar por un hash generado para la contraseña real):
-- UPDATE usuario SET contrasena = '$2a$10$...' WHERE correo='admin@serviteca.com';

-- Migración Serviteca JM: datos de contacto del cliente y campos de factura.
-- Ejecutar sobre la misma BD que usa JPA (tablas singulares: usuario, factura).

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS direccion VARCHAR(180);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS ciudad VARCHAR(80);

ALTER TABLE factura ADD COLUMN IF NOT EXISTS fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE factura ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(40) DEFAULT 'Contado';
ALTER TABLE factura ADD COLUMN IF NOT EXISTS medio_pago VARCHAR(60) DEFAULT 'Efectivo';

UPDATE factura SET forma_pago = 'Contado' WHERE forma_pago IS NULL OR TRIM(forma_pago) = '';
UPDATE factura SET medio_pago = 'Efectivo' WHERE medio_pago IS NULL OR TRIM(medio_pago) = '';
