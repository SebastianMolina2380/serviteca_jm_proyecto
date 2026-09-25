package com.serviteca.controladores;

import com.serviteca.modelos.Cita;
import com.serviteca.modelos.Servicio;
import com.serviteca.repository.CitaRepository;
import com.serviteca.repository.ServicioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
public class ReporteController {
    private final CitaRepository citaRepository;
    private final ServicioRepository servicioRepository;

    @GetMapping
    public Map<String,Object> resumen(
        @RequestParam(required=false) LocalDate desde,
        @RequestParam(required=false) LocalDate hasta){
        var citas=citaRepository.findAll().stream()
            .filter(c->desde==null||!c.getFecha().isBefore(desde))
            .filter(c->hasta==null||!c.getFecha().isAfter(hasta)).toList();
        var servicios=servicioRepository.findAll().stream()
            .filter(s->s.getFechaServicio()==null ||
                (desde==null||!s.getFechaServicio().toLocalDate().isBefore(desde)) &&
                (hasta==null||!s.getFechaServicio().toLocalDate().isAfter(hasta))).toList();
        BigDecimal ingresos=servicios.stream().filter(s->s.getEstado()==Servicio.Estado.COMPLETADO)
            .map(Servicio::getPrecio).filter(java.util.Objects::nonNull)
            .reduce(BigDecimal.ZERO,BigDecimal::add);
        Map<String,Object> r=new LinkedHashMap<>();
        r.put("citas",citas);r.put("totalCitas",citas.size());
        r.put("servicios",servicios);r.put("totalServicios",servicios.size());
        r.put("ingresosServiciosCompletados",ingresos);
        return r;
    }
}