-- Ejecutar una sola vez en la misma base PostgreSQL configurada en application.properties.
CREATE TABLE IF NOT EXISTS pago_factura (
    idpago BIGSERIAL PRIMARY KEY,
    idfactura INTEGER NOT NULL,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    metodo VARCHAR(40) NOT NULL,
    fecha_pago DATE NOT NULL,
    notas VARCHAR(500),
    clave_idempotencia VARCHAR(80) NOT NULL,
    registrado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_factura FOREIGN KEY (idfactura)
        REFERENCES factura (idfactura) ON DELETE RESTRICT,
    CONSTRAINT uk_pago_factura_idempotencia UNIQUE (clave_idempotencia)
);

CREATE INDEX IF NOT EXISTS ix_pago_factura_factura_fecha
    ON pago_factura (idfactura, fecha_pago, idpago);
