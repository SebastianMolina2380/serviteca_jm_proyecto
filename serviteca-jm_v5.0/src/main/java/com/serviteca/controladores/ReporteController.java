package com.serviteca.controladores;

import com.serviteca.DTOs.ReporteResumen;
import com.serviteca.servicios.ReporteExportService;
import com.serviteca.servicios.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
public class ReporteController {

    private final ReporteService reporteService;
    private final ReporteExportService reporteExportService;

    @GetMapping
    public ReporteResumen resumen(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.resumen(desde, hasta);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(defaultValue = "csv") String formato,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {

        ReporteResumen resumen = reporteService.resumen(desde, hasta);
        ReporteExportService.Exportacion exportacion =
                reporteExportService.generar(resumen, formato);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + exportacion.nombreArchivo() + "\"")
                .contentType(MediaType.parseMediaType(exportacion.contentType()))
                .body(exportacion.contenido());
    }
}
