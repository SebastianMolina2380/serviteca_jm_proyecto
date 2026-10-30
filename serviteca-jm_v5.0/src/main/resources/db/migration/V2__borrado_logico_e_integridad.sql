-- ============================================================
-- V2 — BORRADO LÓGICO E INTEGRIDAD REFERENCIAL
-- Motor: PostgreSQL 15+
-- ============================================================

-- 1. Borrado lógico de vehículos
ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS estado VARCHAR(20);

UPDATE vehiculo
SET estado = 'ACTIVO'
WHERE estado IS NULL;

ALTER TABLE vehiculo ALTER COLUMN estado SET DEFAULT 'ACTIVO';
ALTER TABLE vehiculo ALTER COLUMN estado SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_vehiculo_estado'
          AND conrelid = 'vehiculo'::regclass
    ) THEN
ALTER TABLE vehiculo
    ADD CONSTRAINT ck_vehiculo_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO'));
END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_vehiculo_estado ON vehiculo (estado);

-- 1b. Estado de usuario
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS estado VARCHAR(20);

UPDATE usuario
SET estado = 'ACTIVO'
WHERE estado IS NULL;

ALTER TABLE usuario ALTER COLUMN estado SET DEFAULT 'ACTIVO';
ALTER TABLE usuario ALTER COLUMN estado SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_usuario_estado'
          AND conrelid = 'usuario'::regclass
    ) THEN
ALTER TABLE usuario
    ADD CONSTRAINT ck_usuario_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO'));
END IF;
END $$;

-- 2. Citas: validación de duplicados e índice único parcial
DO $$
DECLARE
hay_duplicados BOOLEAN;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM cita
    WHERE estado <> 'CANCELADA'
    GROUP BY idvehiculo, fecha, hora
    HAVING COUNT(1) > 1
) INTO hay_duplicados;

IF hay_duplicados THEN
        RAISE EXCEPTION
            'Migración abortada: existen combinaciones de vehículo/fecha/hora con más de una cita activa. Cancele o corrija las citas duplicadas antes de continuar.';
END IF;
END $$;

ALTER TABLE cita DROP CONSTRAINT IF EXISTS uk_cita_vehiculo_fecha_hora;
DROP INDEX IF EXISTS uk_cita_vehiculo_fecha_hora;

CREATE UNIQUE INDEX IF NOT EXISTS uk_cita_vehiculo_fecha_hora_activa
    ON cita (idvehiculo, fecha, hora)
    WHERE estado <> 'CANCELADA';

-- 3. Facturas y pagos: FKs estrictas (RESTRICT)
DO $$
DECLARE
fk RECORD;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'pago_factura'
    ) THEN
        FOR fk IN
SELECT c.conname, t.relname AS tabla
FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_class f ON f.oid = c.confrelid
WHERE c.contype = 'f'
  AND (
    (t.relname = 'factura'      AND f.relname = 'usuario')
        OR (t.relname = 'factura'      AND f.relname = 'cita')
        OR (t.relname = 'pago_factura' AND f.relname = 'factura')
    )
    LOOP
            EXECUTE format(
                'ALTER TABLE %I DROP CONSTRAINT %I',
                fk.tabla, fk.conname
            );
END LOOP;
END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'factura'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'fk_factura_usuario'
              AND conrelid = 'factura'::regclass
        ) THEN
ALTER TABLE factura
    ADD CONSTRAINT fk_factura_usuario
        FOREIGN KEY (idusuario)
            REFERENCES usuario (idusuario)
            ON DELETE RESTRICT ON UPDATE NO ACTION;
END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'fk_factura_cita'
              AND conrelid = 'factura'::regclass
        ) THEN
ALTER TABLE factura
    ADD CONSTRAINT fk_factura_cita
        FOREIGN KEY (idcita)
            REFERENCES cita (idcita)
            ON DELETE RESTRICT ON UPDATE NO ACTION;
END IF;
END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'pago_factura'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'fk_pago_factura'
              AND conrelid = 'pago_factura'::regclass
        ) THEN
ALTER TABLE pago_factura
    ADD CONSTRAINT fk_pago_factura
        FOREIGN KEY (idfactura)
            REFERENCES factura (idfactura)
            ON DELETE RESTRICT ON UPDATE NO ACTION;
END IF;
END IF;
END $$;