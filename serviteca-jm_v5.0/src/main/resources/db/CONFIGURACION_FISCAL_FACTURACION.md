# Parametrización de facturación

1. Aplicar `migracion_datos_fiscales_factura.sql` sobre PostgreSQL.
2. Definir en el entorno del servidor `SERVITECA_EMISOR_RAZON_SOCIAL`, `SERVITECA_EMISOR_NIT`, `SERVITECA_EMISOR_DIRECCION`, `SERVITECA_EMISOR_CIUDAD`, `SERVITECA_EMISOR_TELEFONO`, `SERVITECA_EMISOR_CORREO` y `SERVITECA_RESPONSABILIDADES_FISCALES` con los datos del RUT.
3. Definir `SERVITECA_SOFTWARE_NOMBRE`, `SERVITECA_SOFTWARE_FABRICANTE`, `SERVITECA_SOFTWARE_NIT_FABRICANTE`, `SERVITECA_PROVEEDOR_TECNOLOGICO` y `SERVITECA_NIT_PROVEEDOR_TECNOLOGICO` según la solución real.
4. Insertar una única fila con `id = 1` en `numeracion_factura` con prefijo, número de autorización, rango, consecutivo inicial y vigencia exactamente como aparecen en la autorización DIAN vigente.
5. Clasificar `tarifa_iva` para cada producto y servicio según su tratamiento tributario. El valor se expresa como porcentaje (por ejemplo, `19.00`); no se asigna una tasa predeterminada porque puede haber exclusiones, exenciones u otros tratamientos.
6. Completar en cada registro de cliente su nombre/razón social, tipo y número de documento, dirección y ciudad.

Si faltan datos del emisor, numeración, datos del adquirente o tarifa, el backend rechaza la emisión. No use valores ficticios de prueba en producción. Las facturas existentes antes de la migración quedan identificadas como históricas sin datos DIAN y no se les inventa número autorizado ni fecha de expedición.

La implementación actual prepara una representación y numeración interna, pero no integra generación de XML, firma, CUFE, QR, transmisión, validación ni entrega DIAN. Por ello muestra `PENDIENTE_VALIDACION_DIAN` y no debe distribuirse como factura electrónica validada.
