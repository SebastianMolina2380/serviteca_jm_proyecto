-- Aplicar manualmente sobre PostgreSQL antes de desplegar el nuevo modelo.
-- Los datos tributarios y la autorización deben cargarse con la información real del RUT/DIAN.
ALTER TABLE factura ADD COLUMN IF NOT EXISTS numero_factura varchar(40);
CREATE UNIQUE INDEX IF NOT EXISTS uk_factura_numero_factura ON factura(numero_factura) WHERE numero_factura IS NOT NULL;
ALTER TABLE factura ADD COLUMN IF NOT EXISTS prefijo varchar(10);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS numero_autorizacion varchar(80);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS rango_desde bigint;
ALTER TABLE factura ADD COLUMN IF NOT EXISTS rango_hasta bigint;
ALTER TABLE factura ADD COLUMN IF NOT EXISTS vigencia_desde date;
ALTER TABLE factura ADD COLUMN IF NOT EXISTS vigencia_hasta date;
ALTER TABLE factura ADD COLUMN IF NOT EXISTS fecha_expedicion timestamp;
ALTER TABLE factura ADD COLUMN IF NOT EXISTS estado_validacion_dian varchar(40) NOT NULL DEFAULT 'HISTORICA_SIN_DATOS_DIAN';
ALTER TABLE factura ADD COLUMN IF NOT EXISTS razon_social_emisor varchar(160);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS nit_emisor varchar(30);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS direccion_emisor varchar(180);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS ciudad_emisor varchar(80);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS telefono_emisor varchar(30);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS correo_emisor varchar(100);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS nombre_adquirente varchar(120);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS tipo_doc_adquirente varchar(30);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS numero_doc_adquirente varchar(30);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS direccion_adquirente varchar(180);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS ciudad_adquirente varchar(80);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS telefono_adquirente varchar(30);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS correo_adquirente varchar(100);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS responsabilidades_fiscales varchar(200);
ALTER TABLE factura ADD COLUMN IF NOT EXISTS plazo_dias integer NOT NULL DEFAULT 0;
ALTER TABLE factura ADD COLUMN IF NOT EXISTS iva_total numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE detalle_factura ADD COLUMN IF NOT EXISTS tarifa_iva numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE detalle_factura ADD COLUMN IF NOT EXISTS iva_valor numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE detalle_factura ADD COLUMN IF NOT EXISTS codigo_item varchar(40);
ALTER TABLE detalle_factura ADD COLUMN IF NOT EXISTS unidad_medida varchar(20) NOT NULL DEFAULT 'UND';
ALTER TABLE servicio ADD COLUMN IF NOT EXISTS tarifa_iva numeric(5,2);
ALTER TABLE producto ADD COLUMN IF NOT EXISTS tarifa_iva numeric(5,2);

CREATE TABLE IF NOT EXISTS numeracion_factura (
    id integer PRIMARY KEY CHECK (id = 1),
    prefijo varchar(10) NOT NULL,
    numero_autorizacion varchar(80) NOT NULL,
    rango_desde bigint NOT NULL,
    rango_hasta bigint NOT NULL,
    siguiente_numero bigint NOT NULL,
    vigente_desde date NOT NULL,
    vigente_hasta date NOT NULL,
    CHECK (rango_desde <= siguiente_numero AND siguiente_numero <= rango_hasta + 1),
    CHECK (rango_desde <= rango_hasta),
    CHECK (vigente_desde <= vigente_hasta)
);

-- No insertar una fila en numeracion_factura hasta contar con la resolución de autorización vigente.
-- No asignar automáticamente tarifas IVA: deben clasificarse los productos/servicios con contabilidad.
