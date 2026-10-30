-- ============================================================
-- V4 — ALINEACIÓN DE ESQUEMAS HEREDADOS (BASES PRE-FLYWAY)
-- ============================================================
-- Contexto
--   Las bases creadas antes de adoptar Flyway (scripts v5 y
--   db/schema.sql) contienen las mismas tablas que V1, pero algunas
--   columnas tienen otro tipo, otro valor por defecto o no existen.
--   Con baseline-version=1 esas bases se adoptan en la versión 1 y
--   V1 no se vuelve a ejecutar sobre ellas; esta migración cierra
--   las diferencias que sí afectan al runtime de JPA/Hibernate.
--
-- Garantías
--   · Idempotente: consulta el catálogo antes de cada cambio.
--   · No destructiva: no borra tablas, columnas ni filas.
--   · Segura en bases nuevas: si el esquema ya es canónico, todos
--     los bloques son no-ops.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. factura.idfactura: secuencia para @GeneratedValue(IDENTITY)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
generada BOOLEAN;
BEGIN
SELECT (column_default IS NOT NULL OR is_identity = 'YES')
INTO generada
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'factura'
  AND column_name  = 'idfactura';

IF generada IS NOT TRUE THEN
CREATE SEQUENCE IF NOT EXISTS factura_idfactura_seq;

ALTER TABLE factura
    ALTER COLUMN idfactura
        SET DEFAULT nextval('factura_idfactura_seq');

ALTER SEQUENCE factura_idfactura_seq
    OWNED BY factura.idfactura;

PERFORM setval(
            'factura_idfactura_seq',
            GREATEST(COALESCE((SELECT MAX(idfactura) FROM factura), 1), 1),
            true
        );
END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. factura.rango_desde / rango_hasta: VARCHAR -> BIGINT
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'factura'
           AND column_name  = 'rango_desde'
           AND data_type   <> 'bigint'
    ) THEN
ALTER TABLE factura
ALTER COLUMN rango_desde TYPE BIGINT
            USING CASE
                      WHEN rango_desde::text ~ '^\s*-?\d+\s*$'
                          THEN btrim(rango_desde::text)::BIGINT
                      ELSE NULL
END;
END IF;

    IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'factura'
           AND column_name  = 'rango_hasta'
           AND data_type   <> 'bigint'
    ) THEN
ALTER TABLE factura
ALTER COLUMN rango_hasta TYPE BIGINT
            USING CASE
                      WHEN rango_hasta::text ~ '^\s*-?\d+\s*$'
                          THEN btrim(rango_hasta::text)::BIGINT
                      ELSE NULL
END;
END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. factura: columnas NOT NULL con valor por defecto
-- ────────────────────────────────────────────────────────────
ALTER TABLE factura ADD COLUMN IF NOT EXISTS estado_validacion_dian VARCHAR(50);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS fecha_generacion TIMESTAMP;
ALTER TABLE factura ADD COLUMN IF NOT EXISTS iva_total NUMERIC(12,2);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS numero_factura VARCHAR(50);

UPDATE factura
SET estado_validacion_dian = 'PENDIENTE_CONFIGURACION_DIAN'
WHERE estado_validacion_dian IS NULL
   OR btrim(estado_validacion_dian) = '';

UPDATE factura
SET fecha_generacion = fecha::timestamp
WHERE fecha_generacion IS NULL;

UPDATE factura
SET iva_total = 0
WHERE iva_total IS NULL;

ALTER TABLE factura ALTER COLUMN estado_validacion_dian
    SET DEFAULT 'PENDIENTE_CONFIGURACION_DIAN';
ALTER TABLE factura ALTER COLUMN estado_validacion_dian SET NOT NULL;

ALTER TABLE factura ALTER COLUMN fecha_generacion
    SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE factura ALTER COLUMN fecha_generacion SET NOT NULL;

ALTER TABLE factura ALTER COLUMN iva_total SET DEFAULT 0;
ALTER TABLE factura ALTER COLUMN iva_total SET NOT NULL;

ALTER TABLE factura ALTER COLUMN fecha SET DEFAULT CURRENT_DATE;

-- ────────────────────────────────────────────────────────────
-- 4. inventario.preciounit: DOUBLE PRECISION -> NUMERIC(12,2)
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'inventario'
           AND column_name  = 'preciounit'
           AND data_type   <> 'numeric'
    ) THEN
ALTER TABLE inventario
ALTER COLUMN preciounit TYPE NUMERIC(12,2)
            USING preciounit::NUMERIC(12,2);
END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 5. usuario.tipo_documento: DEFAULT 'CC' y NOT NULL
-- ────────────────────────────────────────────────────────────
UPDATE usuario
SET tipo_documento = 'CC'
WHERE tipo_documento IS NULL
   OR btrim(tipo_documento) = '';

ALTER TABLE usuario ALTER COLUMN tipo_documento SET DEFAULT 'CC';
ALTER TABLE usuario ALTER COLUMN tipo_documento SET NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 6. Unicidad de facturas (solo si los datos y columnas lo permiten)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
has_num_factura BOOLEAN;
    has_dups BOOLEAN := FALSE;
BEGIN
    IF to_regclass('public.uk_factura_cita') IS NULL
       AND NOT EXISTS (
            SELECT 1 FROM factura
             GROUP BY idcita
            HAVING COUNT(*) > 1
       )
    THEN
ALTER TABLE factura
    ADD CONSTRAINT uk_factura_cita UNIQUE (idcita);
END IF;

SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'factura'
      AND column_name = 'numero_factura'
) INTO has_num_factura;

IF has_num_factura THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM factura WHERE numero_factura IS NOT NULL GROUP BY numero_factura HAVING COUNT(*) > 1)' INTO has_dups;
END IF;

    IF to_regclass('public.uk_factura_numero_factura') IS NULL AND NOT has_dups THEN
ALTER TABLE factura
    ADD CONSTRAINT uk_factura_numero_factura UNIQUE (numero_factura);
END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 7. Índices canónicos (comprobación de tabla previa)
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
    -- vehiculo
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vehiculo') THEN
CREATE INDEX IF NOT EXISTS ix_vehiculo_usuario ON vehiculo (idusuario);
CREATE INDEX IF NOT EXISTS ix_vehiculo_estado ON vehiculo (estado);
END IF;

    -- cita
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cita') THEN
CREATE INDEX IF NOT EXISTS ix_cita_usuario ON cita (idusuario);
CREATE INDEX IF NOT EXISTS ix_cita_vehiculo ON cita (idvehiculo);
CREATE INDEX IF NOT EXISTS ix_cita_fecha ON cita (fecha);
END IF;

    -- servicio
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='servicio') THEN
CREATE INDEX IF NOT EXISTS ix_servicio_vehiculo ON servicio (idvehiculo);
END IF;

    -- producto
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='producto') THEN
CREATE INDEX IF NOT EXISTS ix_producto_servicio ON producto (idservicio);
CREATE INDEX IF NOT EXISTS ix_producto_proveedor ON producto (idproveedor);
END IF;

    -- inventario
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='inventario') THEN
CREATE INDEX IF NOT EXISTS ix_inventario_producto ON inventario (idproducto);
END IF;

    -- factura
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='factura') THEN
CREATE INDEX IF NOT EXISTS ix_factura_usuario ON factura (idusuario);
CREATE INDEX IF NOT EXISTS ix_factura_fecha ON factura (fecha);
END IF;

    -- detalle_factura
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='detalle_factura') THEN
CREATE INDEX IF NOT EXISTS ix_detalle_factura ON detalle_factura (idfactura);
CREATE INDEX IF NOT EXISTS ix_detalle_servicio ON detalle_factura (idservicio);
CREATE INDEX IF NOT EXISTS ix_detalle_producto ON detalle_factura (idproducto);
END IF;

    -- pago_factura
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pago_factura') THEN
CREATE INDEX IF NOT EXISTS ix_pago_factura_factura_fecha ON pago_factura (idfactura, fecha_pago, idpago);
END IF;

    -- seguimiento
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='seguimiento') THEN
CREATE INDEX IF NOT EXISTS ix_seguimiento_usuario ON seguimiento (idusuario);
CREATE INDEX IF NOT EXISTS ix_seguimiento_servicio ON seguimiento (idservicio);
CREATE INDEX IF NOT EXISTS ix_seguimiento_fecha ON seguimiento (fecha);
END IF;

    -- password_reset_token
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='password_reset_token') THEN
CREATE INDEX IF NOT EXISTS ix_password_reset_usuario ON password_reset_token (idusuario);
CREATE INDEX IF NOT EXISTS ix_password_reset_expira ON password_reset_token (expira_en);
END IF;

    -- mensaje_contacto
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='mensaje_contacto') THEN
CREATE INDEX IF NOT EXISTS ix_mensaje_contacto_fecha ON mensaje_contacto (creado_en);
END IF;
END $$;