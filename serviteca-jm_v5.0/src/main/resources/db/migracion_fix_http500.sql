-- Corrección idempotente para las entidades actuales de facturación/pagos.
-- Ejecutar en pgAdmin sobre DB_PRODISJM, esquema public, con respaldo previo.
BEGIN;

-- numero_factura está mapeado por Factura.numeroFactura pero falta en la BD.
ALTER TABLE public.factura ADD COLUMN IF NOT EXISTS numero_factura varchar(40);
CREATE UNIQUE INDEX IF NOT EXISTS uk_factura_numero_factura
    ON public.factura (numero_factura) WHERE numero_factura IS NOT NULL;

-- Columnas mapeadas por DetalleFactura.
ALTER TABLE public.detalle_factura ADD COLUMN IF NOT EXISTS tarifa_iva numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.detalle_factura ADD COLUMN IF NOT EXISTS iva_valor numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.detalle_factura ADD COLUMN IF NOT EXISTS codigo_item varchar(40);
ALTER TABLE public.detalle_factura ADD COLUMN IF NOT EXISTS unidad_medida varchar(20) NOT NULL DEFAULT 'UND';

-- Columnas mapeadas por Producto y Servicio. Deben parametrizarse por catálogo.
ALTER TABLE public.producto ADD COLUMN IF NOT EXISTS tarifa_iva numeric(5,2);
ALTER TABLE public.servicio ADD COLUMN IF NOT EXISTS tarifa_iva numeric(5,2);

-- NumeracionFacturaRepository bloquea la fila id=1 para reservar consecutivos.
CREATE TABLE IF NOT EXISTS public.numeracion_factura (
    id integer PRIMARY KEY CHECK (id = 1),
    prefijo varchar(10) NOT NULL,
    numero_autorizacion varchar(80) NOT NULL,
    rango_desde bigint NOT NULL,
    rango_hasta bigint NOT NULL,
    siguiente_numero bigint NOT NULL,
    vigente_desde date NOT NULL,
    vigente_hasta date NOT NULL,
    CHECK (rango_desde <= rango_hasta),
    CHECK (rango_desde <= siguiente_numero AND siguiente_numero <= rango_hasta + 1),
    CHECK (vigente_desde <= vigente_hasta)
);

-- PagoFacturaRepository y FacturaController requieren esta tabla.
CREATE TABLE IF NOT EXISTS public.pago_factura (
    idpago bigserial PRIMARY KEY,
    idfactura integer NOT NULL,
    monto numeric(12,2) NOT NULL CHECK (monto > 0),
    metodo varchar(40) NOT NULL,
    fecha_pago date NOT NULL,
    notas varchar(500),
    clave_idempotencia varchar(80) NOT NULL,
    registrado_en timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_factura FOREIGN KEY (idfactura)
        REFERENCES public.factura (idfactura) ON DELETE RESTRICT,
    CONSTRAINT uk_pago_factura_idempotencia UNIQUE (clave_idempotencia)
);
CREATE INDEX IF NOT EXISTS ix_pago_factura_factura_fecha
    ON public.pago_factura (idfactura, fecha_pago, idpago);

COMMIT;

-- No se insertan tarifas ni rangos fiscales ficticios. Cargue valores reales antes de emitir.
