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
