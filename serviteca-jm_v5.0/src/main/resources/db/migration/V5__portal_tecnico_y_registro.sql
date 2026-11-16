-- ============================================================
-- V5 — PORTAL TÉCNICO Y REGISTRO DE CLIENTES
-- ============================================================
-- Contexto
--   El portal técnico necesita datos que hoy no existen en `cita`:
--   el servicio solicitado por el cliente, el técnico asignado y
--   las observaciones del cliente.
--
--   El registro público de clientes NO requiere cambios de esquema:
--   el rol CLIENTE y su CHECK ya existen desde V1.
--
-- Garantías
--   · Idempotente: usa IF NOT EXISTS y consulta el catálogo.
--   · No destructiva: solo agrega columnas, FK e índices.
--   · Compatible con bases existentes: las filas previas quedan
--     con valores NULL en las columnas nuevas.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. cita.servicio_solicitado
--    Texto libre porque el catálogo de servicios todavía no es
--    una tabla independiente. Coincide con las opciones de
--    nueva-cita.html (Frenos, Alineación, Mantenimiento, etc.).
-- ────────────────────────────────────────────────────────────
ALTER TABLE cita
    ADD COLUMN IF NOT EXISTS servicio_solicitado VARCHAR(80);

COMMENT ON COLUMN cita.servicio_solicitado
    IS 'Servicio o tipo de servicio solicitado por el cliente al agendar la cita.';

-- ────────────────────────────────────────────────────────────
-- 2. cita.observaciones
-- ────────────────────────────────────────────────────────────
ALTER TABLE cita
    ADD COLUMN IF NOT EXISTS observaciones TEXT;

COMMENT ON COLUMN cita.observaciones
    IS 'Observaciones del cliente o del personal sobre la cita.';

-- ────────────────────────────────────────────────────────────
-- 3. cita.idtecnico
--    Técnico asignado. Se permite NULL porque una cita recién
--    creada puede no tener técnico. ON DELETE SET NULL evita
--    perder la cita si se elimina físicamente el usuario.
-- ────────────────────────────────────────────────────────────
ALTER TABLE cita
    ADD COLUMN IF NOT EXISTS idtecnico INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conname = 'fk_cita_tecnico'
           AND conrelid = 'cita'::regclass
    ) THEN
        ALTER TABLE cita
            ADD CONSTRAINT fk_cita_tecnico
                FOREIGN KEY (idtecnico)
                    REFERENCES usuario (idusuario)
                    ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON COLUMN cita.idtecnico
    IS 'Usuario con rol TECNICO o ADMIN asignado a la cita. La validación de rol se hace en la capa de servicio.';

-- ────────────────────────────────────────────────────────────
-- 4. Índices para el portal técnico
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ix_cita_tecnico
    ON cita (idtecnico);

CREATE INDEX IF NOT EXISTS ix_cita_tecnico_fecha
    ON cita (idtecnico, fecha, hora);

CREATE INDEX IF NOT EXISTS ix_cita_estado
    ON cita (estado);
