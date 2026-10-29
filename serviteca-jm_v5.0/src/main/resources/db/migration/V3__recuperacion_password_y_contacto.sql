-- ============================================================
-- V3 — RECUPERACIÓN DE CONTRASEÑA Y CONTACTO (FASE 2)
-- ============================================================
-- Idempotente. Se conserva db/migracion_fase2.sql para ejecuciones
-- manuales sobre bases existentes.
-- ============================================================
-- ============================================================
-- SERVITECA JM — MIGRACIÓN FASE 2
-- Recuperación de contraseña + formulario de contacto
-- ============================================================
-- Ejecutar sobre una base existente que ya tenga la Fase 1 aplicada:
--     psql -U postgres -d DB_PRODISJM -f migracion_fase2.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Tokens de recuperación de contraseña
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_token (
    id          BIGSERIAL PRIMARY KEY,
    idusuario   INTEGER      NOT NULL,
    token_hash  VARCHAR(64)  NOT NULL,
    expira_en   TIMESTAMP    NOT NULL,
    usado       BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_password_reset_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_password_reset_usuario FOREIGN KEY (idusuario)
        REFERENCES usuario (idusuario) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_password_reset_usuario ON password_reset_token (idusuario);
CREATE INDEX IF NOT EXISTS ix_password_reset_expira  ON password_reset_token (expira_en);

-- ────────────────────────────────────────────────────────────
-- Mensajes del formulario de contacto de la landing
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensaje_contacto (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(120)  NOT NULL,
    correo      VARCHAR(100)  NOT NULL,
    telefono    VARCHAR(30),
    mensaje     VARCHAR(2000) NOT NULL,
    atendido    BOOLEAN       NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_mensaje_contacto_fecha ON mensaje_contacto (creado_en);

