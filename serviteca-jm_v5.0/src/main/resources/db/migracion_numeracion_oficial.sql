-- ============================================================
-- Migracion: numeracion OFICIAL de facturacion electronica DIAN
-- Base de datos: DB_PRODISJM (PostgreSQL)
-- Fecha: 2026-10-19
-- ============================================================
-- Retira el prefijo de PRUEBA y fija el rango oficial de
-- facturacion de 1 a 1000.
--
-- MAPEO DE COLUMNAS
-- La sentencia original referenciaba dos columnas que NO existen
-- en la tabla real y habria fallado con:
--     ERROR: column "resolucion" of relation "numeracion_factura" does not exist
-- Mapeo aplicado:
--     resolucion         ->  numero_autorizacion  (varchar 80)
--     consecutivo_actual ->  siguiente_numero     (bigint)
--
-- CONSTRAINTS QUE POSTGRESQL VALIDARA AL EJECUTAR
--     CHECK rango_desde <= siguiente_numero <= rango_hasta + 1
--     CHECK rango_desde <= rango_hasta
--     CHECK vigente_desde <= vigente_hasta
--     CHECK id = 1                    (tabla de fila unica)
--
-- Nota: siguiente_numero es el proximo consecutivo a asignar.
-- FacturacionService usa  prefijo + siguiente_numero  como numero
-- de factura y luego lo incrementa, por lo que con el valor 1 la
-- primera factura emitida sera FE1.
-- ============================================================

\echo '--- ANTES ---'
SELECT id, prefijo, numero_autorizacion, rango_desde, rango_hasta,
       siguiente_numero, vigente_desde, vigente_hasta
FROM numeracion_factura;

UPDATE numeracion_factura
SET prefijo             = 'FE',
    numero_autorizacion = 'Resolución DIAN No. 18760000001 - Habilitación Software',
    rango_desde         = 1,
    rango_hasta         = 1000,
    siguiente_numero    = 1
WHERE prefijo LIKE '%PRUEBA%';

\echo '--- DESPUES ---'
SELECT id, prefijo, numero_autorizacion, rango_desde, rango_hasta,
       siguiente_numero, vigente_desde, vigente_hasta
FROM numeracion_factura;
