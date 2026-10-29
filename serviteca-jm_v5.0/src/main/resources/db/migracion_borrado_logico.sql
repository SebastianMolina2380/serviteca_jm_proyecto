-- ============================================================
-- SERVITECA JM — MIGRACIÓN A BORRADO LÓGICO E INTEGRIDAD ESTRICTA
-- Motor: PostgreSQL 15+
-- ============================================================
-- Aplica los cambios de la Fase 1 sobre una base YA EXISTENTE:
--
--   1. vehiculo.estado (ACTIVO / INACTIVO) + índice.
--   2. Citas: se elimina la restricción única total y se reemplaza
--      por un índice único parcial que ignora las citas CANCELADA.
--      Así se puede reagendar el mismo vehículo/fecha/hora tras
--      cancelar la cita anterior.
--   3. Facturas y pagos: claves foráneas con ON DELETE RESTRICT
--      para impedir la destrucción accidental de registros fiscales.
--
-- Es idempotente: puede ejecutarse varias veces sin efectos adversos.
--
-- USO
--   psql -U postgres -d DB_PRODISJM -f migracion_borrado_logico.sql
--
-- ANTES DE EJECUTAR
--   Comprueba que no existan citas activas duplicadas:
--
--     SELECT idvehiculo, fecha, hora, COUNT(*)
--     FROM cita
--     WHERE estado <> 'CANCELADA'
--     GROUP BY idvehiculo, fecha, hora
--     HAVING COUNT(*) > 1;
--
--   Si hay duplicados, cancela o corrige las citas sobrantes antes
--   de ejecutar esta migración. El script aborta con un mensaje
--   claro para no dejar el esquema a medias.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Borrado lógico de vehículos
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- 1b. Estado de usuario (por compatibilidad con bases antiguas)
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- 2. Citas: índice único parcial (ignora CANCELADA)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
    duplicados INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicados
    FROM (
        SELECT idvehiculo, fecha, hora
        FROM cita
        WHERE estado <> 'CANCELADA'
        GROUP BY idvehiculo, fecha, hora
        HAVING COUNT(*) > 1
    ) d;

    IF duplicados > 0 THEN
        RAISE EXCEPTION
            'Migración abortada: existen % combinaciones de vehículo/fecha/hora con más de una cita activa. Cancele o corrija las citas duplicadas antes de continuar.',
            duplicados;
    END IF;
END $$;

ALTER TABLE cita DROP CONSTRAINT IF EXISTS uk_cita_vehiculo_fecha_hora;
DROP INDEX IF EXISTS uk_cita_vehiculo_fecha_hora;

CREATE UNIQUE INDEX IF NOT EXISTS uk_cita_vehiculo_fecha_hora_activa
    ON cita (idvehiculo, fecha, hora)
    WHERE estado <> 'CANCELADA';

-- ────────────────────────────────────────────────────────────
-- 3. Facturas y pagos: FKs estrictas (RESTRICT)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
    fk RECORD;
BEGIN
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
END $$;

DO $$
BEGIN
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
END $$;

COMMIT;
