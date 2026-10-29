-- ============================================================
-- V1 — ESQUEMA CANÓNICO INICIAL
-- ============================================================
-- Fuente: db/schema.sql (14 tablas alineadas con las entidades JPA).
-- Script idempotente: una base creada manualmente con el esquema
-- canónico también puede incorporarse a Flyway sin errores.
-- ============================================================
-- ────────────────────────────────────────────────────────────
-- 1. usuario
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuario (
    idusuario       SERIAL PRIMARY KEY,
    nombre          VARCHAR(120) NOT NULL,
    numero_doc      VARCHAR(30)  NOT NULL,
    correo          VARCHAR(100) NOT NULL,
    contrasena      VARCHAR(255) NOT NULL,
    rol             VARCHAR(20)  NOT NULL DEFAULT 'CLIENTE',
    tipo_documento  VARCHAR(30)  NOT NULL DEFAULT 'CC',
    estado          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    ultimo_acceso   TIMESTAMP,
    direccion       VARCHAR(180),
    telefono        VARCHAR(30),
    ciudad          VARCHAR(80),
    CONSTRAINT uk_usuario_numero_doc UNIQUE (numero_doc),
    CONSTRAINT uk_usuario_correo     UNIQUE (correo),
    CONSTRAINT ck_usuario_rol        CHECK (rol IN ('ADMIN', 'TECNICO', 'CLIENTE')),
    CONSTRAINT ck_usuario_estado     CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- ────────────────────────────────────────────────────────────
-- 2. vehiculo
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehiculo (
    idvehiculo  SERIAL PRIMARY KEY,
    placa       VARCHAR(10) NOT NULL,
    marca       VARCHAR(50) NOT NULL,
    modelo      VARCHAR(50) NOT NULL,
    color       VARCHAR(30),
    kilometraje INTEGER,
    estado      VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    idusuario   INTEGER NOT NULL,
    CONSTRAINT uk_vehiculo_placa UNIQUE (placa),
    CONSTRAINT ck_vehiculo_kilometraje CHECK (kilometraje IS NULL OR kilometraje >= 0),
    CONSTRAINT ck_vehiculo_estado CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    CONSTRAINT fk_vehiculo_usuario FOREIGN KEY (idusuario)
        REFERENCES usuario (idusuario) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_vehiculo_usuario ON vehiculo (idusuario);
CREATE INDEX IF NOT EXISTS ix_vehiculo_estado  ON vehiculo (estado);

-- ────────────────────────────────────────────────────────────
-- 3. cita
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cita (
    idcita      SERIAL PRIMARY KEY,
    fecha       DATE        NOT NULL,
    hora        TIME        NOT NULL,
    estado      VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    idusuario   INTEGER     NOT NULL,
    idvehiculo  INTEGER     NOT NULL,
    CONSTRAINT ck_cita_estado CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'CANCELADA', 'COMPLETADA')),
    CONSTRAINT fk_cita_usuario FOREIGN KEY (idusuario)
        REFERENCES usuario (idusuario) ON DELETE RESTRICT,
    CONSTRAINT fk_cita_vehiculo FOREIGN KEY (idvehiculo)
        REFERENCES vehiculo (idvehiculo) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_cita_usuario   ON cita (idusuario);
CREATE INDEX IF NOT EXISTS ix_cita_vehiculo  ON cita (idvehiculo);
CREATE INDEX IF NOT EXISTS ix_cita_fecha     ON cita (fecha);

-- Un vehículo no puede tener dos citas activas en la misma fecha/hora.
-- Las citas CANCELADA quedan fuera del índice para permitir reagendar.
CREATE UNIQUE INDEX IF NOT EXISTS uk_cita_vehiculo_fecha_hora_activa
    ON cita (idvehiculo, fecha, hora)
    WHERE estado <> 'CANCELADA';

-- ────────────────────────────────────────────────────────────
-- 4. servicio
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicio (
    idservicio       SERIAL PRIMARY KEY,
    tipo             VARCHAR(80)   NOT NULL,
    descripcion      TEXT,
    precio           NUMERIC(12,2) NOT NULL,
    tarifa_iva       NUMERIC(5,2),
    activo           BOOLEAN       NOT NULL DEFAULT TRUE,
    estado           VARCHAR(20)   NOT NULL DEFAULT 'PROGRAMADO',
    progreso         INTEGER       NOT NULL DEFAULT 0,
    fecha_servicio   TIMESTAMP,
    idvehiculo       INTEGER       NOT NULL,
    CONSTRAINT ck_servicio_precio   CHECK (precio >= 0),
    CONSTRAINT ck_servicio_progreso CHECK (progreso BETWEEN 0 AND 100),
    CONSTRAINT ck_servicio_estado   CHECK (estado IN ('PROGRAMADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO')),
    CONSTRAINT fk_servicio_vehiculo FOREIGN KEY (idvehiculo)
        REFERENCES vehiculo (idvehiculo) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_servicio_vehiculo ON servicio (idvehiculo);

-- ────────────────────────────────────────────────────────────
-- 5. proveedor
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedor (
    idproveedor        SERIAL PRIMARY KEY,
    nombre_proveedor   VARCHAR(100) NOT NULL,
    nit_proveedor      VARCHAR(20)  NOT NULL,
    tipo_producto      VARCHAR(250),
    correo_proveedor   VARCHAR(100),
    CONSTRAINT uk_proveedor_nit UNIQUE (nit_proveedor)
);

-- ────────────────────────────────────────────────────────────
-- 6. producto
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producto (
    idproducto            SERIAL PRIMARY KEY,
    nombre_producto       VARCHAR(50)   NOT NULL,
    precio_producto       NUMERIC(10,2) NOT NULL,
    descripcion_producto  VARCHAR(250),
    tarifa_iva            NUMERIC(5,2),
    idservicio            INTEGER,
    idproveedor           INTEGER,
    CONSTRAINT ck_producto_precio CHECK (precio_producto >= 0),
    CONSTRAINT fk_producto_servicio FOREIGN KEY (idservicio)
        REFERENCES servicio (idservicio) ON DELETE SET NULL,
    CONSTRAINT fk_producto_proveedor FOREIGN KEY (idproveedor)
        REFERENCES proveedor (idproveedor) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_producto_servicio  ON producto (idservicio);
CREATE INDEX IF NOT EXISTS ix_producto_proveedor ON producto (idproveedor);

-- ────────────────────────────────────────────────────────────
-- 7. inventario
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventario (
    idinventario  SERIAL PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL,
    cantidad      INTEGER      NOT NULL DEFAULT 0,
    preciounit    NUMERIC(12,2),
    idproducto    INTEGER,
    CONSTRAINT ck_inventario_cantidad CHECK (cantidad >= 0),
    CONSTRAINT ck_inventario_precio   CHECK (preciounit IS NULL OR preciounit >= 0),
    CONSTRAINT fk_inventario_producto FOREIGN KEY (idproducto)
        REFERENCES producto (idproducto) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_inventario_producto ON inventario (idproducto);

-- ────────────────────────────────────────────────────────────
-- 8. factura
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS factura (
    idfactura                 SERIAL PRIMARY KEY,
    fecha                     DATE          NOT NULL DEFAULT CURRENT_DATE,
    fecha_generacion          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    numero_factura            VARCHAR(40),
    prefijo                   VARCHAR(10),
    numero_autorizacion       VARCHAR(80),
    rango_desde               BIGINT,
    rango_hasta               BIGINT,
    vigencia_desde            DATE,
    vigencia_hasta            DATE,
    fecha_expedicion          TIMESTAMP,
    estado_validacion_dian    VARCHAR(40)   NOT NULL DEFAULT 'PENDIENTE_CONFIGURACION_DIAN',
    razon_social_emisor       VARCHAR(160),
    nit_emisor                VARCHAR(30),
    direccion_emisor          VARCHAR(180),
    ciudad_emisor             VARCHAR(80),
    telefono_emisor           VARCHAR(30),
    correo_emisor             VARCHAR(100),
    nombre_adquirente         VARCHAR(120),
    tipo_doc_adquirente       VARCHAR(30),
    numero_doc_adquirente     VARCHAR(30),
    direccion_adquirente      VARCHAR(180),
    ciudad_adquirente         VARCHAR(80),
    telefono_adquirente       VARCHAR(30),
    correo_adquirente         VARCHAR(100),
    responsabilidades_fiscales VARCHAR(200),
    plazo_dias                INTEGER,
    iva_total                 NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal                  NUMERIC(12,2) NOT NULL,
    total                     NUMERIC(12,2) NOT NULL,
    forma_pago                VARCHAR(40)   DEFAULT 'Contado',
    medio_pago                VARCHAR(60)   DEFAULT 'Efectivo',
    idusuario                 INTEGER       NOT NULL,
    idcita                    INTEGER       NOT NULL,
    CONSTRAINT uk_factura_numero_factura UNIQUE (numero_factura),
    CONSTRAINT uk_factura_cita           UNIQUE (idcita),
    CONSTRAINT ck_factura_subtotal       CHECK (subtotal >= 0),
    CONSTRAINT ck_factura_iva_total      CHECK (iva_total >= 0),
    CONSTRAINT ck_factura_total          CHECK (total >= 0),
    CONSTRAINT fk_factura_usuario FOREIGN KEY (idusuario)
        REFERENCES usuario (idusuario) ON DELETE RESTRICT,
    CONSTRAINT fk_factura_cita FOREIGN KEY (idcita)
        REFERENCES cita (idcita) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_factura_usuario ON factura (idusuario);
CREATE INDEX IF NOT EXISTS ix_factura_fecha   ON factura (fecha);

-- ────────────────────────────────────────────────────────────
-- 9. detalle_factura
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detalle_factura (
    iddetallefactura  SERIAL PRIMARY KEY,
    nombre            VARCHAR(100)  NOT NULL,
    cantidad          INTEGER       NOT NULL,
    valor             NUMERIC(12,2) NOT NULL,
    subtotal          NUMERIC(12,2) NOT NULL,
    tarifa_iva        NUMERIC(5,2)  NOT NULL DEFAULT 0,
    iva_valor         NUMERIC(12,2) NOT NULL DEFAULT 0,
    codigo_item       VARCHAR(40),
    unidad_medida     VARCHAR(20)   NOT NULL DEFAULT 'UND',
    idfactura         INTEGER       NOT NULL,
    idservicio        INTEGER,
    idproducto        INTEGER,
    CONSTRAINT ck_detalle_cantidad   CHECK (cantidad >= 1),
    CONSTRAINT ck_detalle_valor      CHECK (valor >= 0),
    CONSTRAINT ck_detalle_subtotal   CHECK (subtotal >= 0),
    CONSTRAINT ck_detalle_tarifa_iva CHECK (tarifa_iva >= 0),
    CONSTRAINT ck_detalle_iva_valor  CHECK (iva_valor >= 0),
    CONSTRAINT fk_detalle_factura FOREIGN KEY (idfactura)
        REFERENCES factura (idfactura) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_servicio FOREIGN KEY (idservicio)
        REFERENCES servicio (idservicio) ON DELETE SET NULL,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (idproducto)
        REFERENCES producto (idproducto) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_detalle_factura  ON detalle_factura (idfactura);
CREATE INDEX IF NOT EXISTS ix_detalle_servicio ON detalle_factura (idservicio);
CREATE INDEX IF NOT EXISTS ix_detalle_producto ON detalle_factura (idproducto);

-- ────────────────────────────────────────────────────────────
-- 10. pago_factura
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pago_factura (
    idpago              BIGSERIAL PRIMARY KEY,
    idfactura           INTEGER       NOT NULL,
    monto               NUMERIC(12,2) NOT NULL,
    metodo              VARCHAR(40)   NOT NULL,
    fecha_pago          DATE          NOT NULL,
    notas               VARCHAR(500),
    clave_idempotencia  VARCHAR(80)   NOT NULL,
    registrado_en       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_pago_monto CHECK (monto > 0),
    CONSTRAINT uk_pago_factura_idempotencia UNIQUE (clave_idempotencia),
    CONSTRAINT fk_pago_factura FOREIGN KEY (idfactura)
        REFERENCES factura (idfactura) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_pago_factura_factura_fecha
    ON pago_factura (idfactura, fecha_pago, idpago);

-- ────────────────────────────────────────────────────────────
-- 11. numeracion_factura (tabla de fila única: id = 1)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS numeracion_factura (
    id                    INTEGER      PRIMARY KEY,
    prefijo               VARCHAR(10)  NOT NULL,
    numero_autorizacion   VARCHAR(80)  NOT NULL,
    rango_desde           BIGINT       NOT NULL,
    rango_hasta           BIGINT       NOT NULL,
    siguiente_numero      BIGINT       NOT NULL,
    vigente_desde         DATE         NOT NULL,
    vigente_hasta         DATE         NOT NULL,
    CONSTRAINT ck_numeracion_fila_unica CHECK (id = 1),
    CONSTRAINT ck_numeracion_rango CHECK (rango_desde <= rango_hasta),
    CONSTRAINT ck_numeracion_siguiente CHECK (siguiente_numero BETWEEN rango_desde AND rango_hasta + 1),
    CONSTRAINT ck_numeracion_vigencia CHECK (vigente_desde <= vigente_hasta)
);

-- ────────────────────────────────────────────────────────────
-- 12. seguimiento
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seguimiento (
    idseguimiento   BIGSERIAL PRIMARY KEY,
    idusuario       INTEGER      NOT NULL,
    idservicio      INTEGER,
    tipo            VARCHAR(30)  NOT NULL,
    titulo          VARCHAR(100),
    flujo           VARCHAR(100),
    descripcion     VARCHAR(500),
    estado          VARCHAR(30),
    mensaje         VARCHAR(500),
    remitente       VARCHAR(30),
    tiempoestimado  INTEGER,
    leida           BOOLEAN      DEFAULT FALSE,
    fecha           TIMESTAMP,
    CONSTRAINT ck_seguimiento_tiempo CHECK (tiempoestimado IS NULL OR tiempoestimado >= 0),
    CONSTRAINT fk_seguimiento_usuario FOREIGN KEY (idusuario)
        REFERENCES usuario (idusuario) ON DELETE RESTRICT,
    CONSTRAINT fk_seguimiento_servicio FOREIGN KEY (idservicio)
        REFERENCES servicio (idservicio) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_seguimiento_usuario  ON seguimiento (idusuario);
CREATE INDEX IF NOT EXISTS ix_seguimiento_servicio ON seguimiento (idservicio);
CREATE INDEX IF NOT EXISTS ix_seguimiento_fecha    ON seguimiento (fecha);

-- ────────────────────────────────────────────────────────────
-- 13. password_reset_token (recuperación de contraseña)
-- ────────────────────────────────────────────────────────────
-- Solo se almacena el hash SHA-256 del token. El valor real viaja por
-- correo, es de un solo uso y expira según SERVITECA_RESET_MINUTOS.
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
-- 14. mensaje_contacto (formulario de la landing)
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

-- ============================================================
-- NUMERACIÓN DE DOCUMENTOS DE VENTA — CARGA MANUAL
-- ============================================================
-- No se insertan prefijos ni rangos ficticios.
-- Cuando definas la numeración interna, ejecuta algo como:
--
-- INSERT INTO numeracion_factura (
--     id, prefijo, numero_autorizacion,
--     rango_desde, rango_hasta, siguiente_numero,
--     vigente_desde, vigente_hasta
-- ) VALUES (
--     1,
--     'DVJM',                       -- prefijo interno
--     'NUMERACION_INTERNA',         -- referencia de la numeración
--     1,                            -- primer consecutivo
--     1000,                         -- último consecutivo
--     1,                            -- próximo número a emitir
--     DATE '2026-01-01',            -- vigencia desde
--     DATE '2027-12-31'             -- vigencia hasta
-- );
-- ============================================================
