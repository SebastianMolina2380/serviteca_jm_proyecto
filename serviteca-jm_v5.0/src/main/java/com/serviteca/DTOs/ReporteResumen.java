package com.serviteca.DTOs;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Resultado agregado del módulo de reportes. Se calcula en el servidor a
 * partir de las citas, servicios y facturas del periodo consultado.
 */
public record ReporteResumen(
        LocalDate desde,
        LocalDate hasta,
        int totalCitas,
        int totalServicios,
        int totalFacturas,
        BigDecimal ingresosServicios,
        BigDecimal ingresosFacturados,
        Map<String, Long> citasPorEstado,
        Map<String, Long> serviciosPorEstado,
        List<Map<String, Object>> topServicios,
        List<Map<String, Object>> ingresosPorPeriodo,
        List<Map<String, Object>> detalleServicios
) {
}
