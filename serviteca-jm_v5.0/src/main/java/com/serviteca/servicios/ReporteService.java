package com.serviteca.servicios;

import com.serviteca.DTOs.ReporteResumen;
import com.serviteca.modelos.Cita;
import com.serviteca.modelos.Factura;
import com.serviteca.modelos.Servicio;
import com.serviteca.repository.CitaRepository;
import com.serviteca.repository.FacturaRepository;
import com.serviteca.repository.ServicioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private static final BigDecimal CERO = new BigDecimal("0.00");

    private final CitaRepository citaRepository;
    private final ServicioRepository servicioRepository;
    private final FacturaRepository facturaRepository;

    @Transactional(readOnly = true)
    public ReporteResumen resumen(LocalDate desde, LocalDate hasta) {
        LocalDate hoy = LocalDate.now();
        LocalDate inicio = desde != null ? desde : (hasta != null ? hasta.withDayOfMonth(1) : hoy.withDayOfMonth(1));
        LocalDate fin = hasta != null ? hasta : hoy;

        if (inicio.isAfter(fin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha inicial no puede ser posterior a la fecha final.");
        }

        List<Cita> citas = citaRepository.findByFechaBetweenOrderByFechaAscHoraAsc(inicio, fin);
        List<Servicio> servicios = servicioRepository.findByFechaServicioBetween(
                inicio.atStartOfDay(), fin.plusDays(1).atStartOfDay());
        List<Factura> facturas = facturaRepository.findByFechaBetween(inicio, fin);

        Map<String, Long> citasPorEstado = new LinkedHashMap<>();
        for (Cita.Estado estado : Cita.Estado.values()) {
            citasPorEstado.put(estado.name(), 0L);
        }
        citas.forEach(c -> citasPorEstado.merge(String.valueOf(c.getEstado()), 1L, Long::sum));

        Map<String, Long> serviciosPorEstado = new LinkedHashMap<>();
        for (Servicio.Estado estado : Servicio.Estado.values()) {
            serviciosPorEstado.put(estado.name(), 0L);
        }
        servicios.forEach(s -> serviciosPorEstado.merge(String.valueOf(s.getEstado()), 1L, Long::sum));

        BigDecimal ingresosServicios = servicios.stream()
                .filter(s -> s.getEstado() == Servicio.Estado.COMPLETADO)
                .map(Servicio::getPrecio)
                .filter(java.util.Objects::nonNull)
                .reduce(CERO, BigDecimal::add);

        BigDecimal ingresosFacturados = facturas.stream()
                .map(Factura::getTotal)
                .filter(java.util.Objects::nonNull)
                .reduce(CERO, BigDecimal::add);

        return new ReporteResumen(
                inicio,
                fin,
                citas.size(),
                servicios.size(),
                facturas.size(),
                ingresosServicios,
                ingresosFacturados,
                citasPorEstado,
                serviciosPorEstado,
                topServicios(servicios),
                ingresosPorPeriodo(inicio, fin, facturas, servicios),
                detalleServicios(servicios)
        );
    }

    private List<Map<String, Object>> topServicios(List<Servicio> servicios) {
        Map<String, Long> conteo = new LinkedHashMap<>();
        for (Servicio servicio : servicios) {
            String tipo = servicio.getTipo() == null || servicio.getTipo().isBlank()
                    ? "Sin tipo" : servicio.getTipo().trim();
            conteo.merge(tipo, 1L, Long::sum);
        }

        List<Map.Entry<String, Long>> ordenados = new ArrayList<>(conteo.entrySet());
        ordenados.sort(Map.Entry.<String, Long>comparingByValue().reversed()
                .thenComparing(Map.Entry.comparingByKey(String.CASE_INSENSITIVE_ORDER)));

        long total = servicios.size();
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Map.Entry<String, Long> entrada : ordenados) {
            double porcentaje = total == 0 ? 0
                    : BigDecimal.valueOf(entrada.getValue() * 100.0 / total)
                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("tipo", entrada.getKey());
            fila.put("cantidad", entrada.getValue());
            fila.put("porcentaje", porcentaje);
            resultado.add(fila);
        }
        return resultado;
    }

    private List<Map<String, Object>> ingresosPorPeriodo(LocalDate desde, LocalDate hasta,
                                                         List<Factura> facturas,
                                                         List<Servicio> servicios) {
        long dias = ChronoUnit.DAYS.between(desde, hasta) + 1;
        boolean porSemana = dias <= 70;
        List<Map<String, Object>> periodos = new ArrayList<>();

        LocalDate cursor = desde;
        int indice = 1;
        while (!cursor.isAfter(hasta)) {
            LocalDate fin;
            String etiqueta;
            if (porSemana) {
                fin = cursor.plusDays(6);
                if (fin.isAfter(hasta)) fin = hasta;
                etiqueta = "Sem " + indice;
            } else {
                fin = cursor.withDayOfMonth(cursor.lengthOfMonth());
                if (fin.isAfter(hasta)) fin = hasta;
                etiqueta = cursor.getMonth().name().substring(0, 3) + " " + cursor.getYear();
            }

            final LocalDate inicioPeriodo = cursor;
            final LocalDate finPeriodo = fin;

            BigDecimal totalFacturas = facturas.stream()
                    .filter(f -> f.getFecha() != null
                            && !f.getFecha().isBefore(inicioPeriodo)
                            && !f.getFecha().isAfter(finPeriodo))
                    .map(Factura::getTotal)
                    .filter(java.util.Objects::nonNull)
                    .reduce(CERO, BigDecimal::add);

            BigDecimal totalServicios = servicios.stream()
                    .filter(s -> s.getEstado() == Servicio.Estado.COMPLETADO)
                    .filter(s -> s.getFechaServicio() != null
                            && !s.getFechaServicio().toLocalDate().isBefore(inicioPeriodo)
                            && !s.getFechaServicio().toLocalDate().isAfter(finPeriodo))
                    .map(Servicio::getPrecio)
                    .filter(java.util.Objects::nonNull)
                    .reduce(CERO, BigDecimal::add);

            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("etiqueta", etiqueta);
            fila.put("desde", inicioPeriodo.toString());
            fila.put("hasta", finPeriodo.toString());
            fila.put("ingresos", totalFacturas);
            fila.put("ingresosServicios", totalServicios);
            periodos.add(fila);

            cursor = fin.plusDays(1);
            indice++;
        }
        return periodos;
    }

    private List<Map<String, Object>> detalleServicios(List<Servicio> servicios) {
        List<Servicio> ordenados = new ArrayList<>(servicios);
        ordenados.sort(Comparator.comparing(
                Servicio::getFechaServicio,
                Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        List<Map<String, Object>> filas = new ArrayList<>();
        for (Servicio servicio : ordenados) {
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("idServicio", servicio.getIdServicio());
            fila.put("fecha", servicio.getFechaServicio() == null
                    ? null : servicio.getFechaServicio().toLocalDate().toString());
            fila.put("tipo", servicio.getTipo());
            fila.put("placa", servicio.getVehiculo() == null ? null : servicio.getVehiculo().getPlaca());
            fila.put("cliente", servicio.getVehiculo() == null || servicio.getVehiculo().getUsuario() == null
                    ? null : servicio.getVehiculo().getUsuario().getNombre());
            fila.put("estado", servicio.getEstado() == null ? null : servicio.getEstado().name());
            fila.put("precio", servicio.getPrecio());
            filas.add(fila);
        }
        return filas;
    }
}
