package com.serviteca.controladores;

import com.serviteca.modelos.Cita;
import com.serviteca.modelos.Servicio;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.CitaRepository;
import com.serviteca.repository.FacturaRepository;
import com.serviteca.repository.ServicioRepository;
import com.serviteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final CitaRepository citaRepository;
    private final FacturaRepository facturaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicioRepository servicioRepository;

    @GetMapping("/api/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> dashboard() {
        LocalDate hoy = LocalDate.now();
        LocalDate primerDiaMes = hoy.withDayOfMonth(1);
        LocalDate inicioSemana = hoy.minusDays(6);

        List<Cita> citasDelDia = citaRepository.findByFechaOrderByHoraAsc(hoy);
        List<Servicio> serviciosEnProceso = servicioRepository
                .findTop5ByEstadoOrderByFechaServicioAsc(Servicio.Estado.EN_PROCESO);

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("fecha", hoy);
        respuesta.put("citasHoy", citasDelDia.size());
        respuesta.put("citasSemana", citaRepository.countByFechaBetween(inicioSemana, hoy));
        respuesta.put("enTaller", servicioRepository.countByEstado(Servicio.Estado.EN_PROCESO));
        respuesta.put("ingresosMes", facturaRepository.totalFacturadoEnPeriodo(primerDiaMes, hoy));
        respuesta.put("canceladasSemana", citaRepository.countByEstadoAndFechaBetween(
                Cita.Estado.CANCELADA, inicioSemana, hoy));
        respuesta.put("tecnicosActivos", usuarioRepository.countByRolAndEstado(
                Usuario.Rol.TECNICO, Usuario.Estado.ACTIVO));
        respuesta.put("clientesActivos", usuarioRepository.countByRolAndEstado(
                Usuario.Rol.CLIENTE, Usuario.Estado.ACTIVO));
        respuesta.put("serviciosActivos", servicioRepository.countByActivoTrue());
        respuesta.put("citasDelDia", citasDelDia.stream().map(this::citaResumen).toList());
        respuesta.put("serviciosEnProceso", serviciosEnProceso.stream()
                .map(this::servicioResumen).toList());
        return ResponseEntity.ok(respuesta);
    }

    private Map<String, Object> citaResumen(Cita cita) {
        Map<String, Object> fila = new LinkedHashMap<>();
        fila.put("idCita", cita.getIdCita());
        fila.put("cliente", cita.getUsuario() == null ? "Cliente" : cita.getUsuario().getNombre());
        fila.put("placa", cita.getVehiculo() == null ? null : cita.getVehiculo().getPlaca());
        fila.put("vehiculo", cita.getVehiculo() == null ? null
                : (cita.getVehiculo().getMarca() + " " + cita.getVehiculo().getModelo()).trim());
        fila.put("hora", cita.getHora() == null ? null : cita.getHora().toString().substring(0, 5));
        fila.put("estado", cita.getEstado() == null ? null : cita.getEstado().name());
        return fila;
    }

    private Map<String, Object> servicioResumen(Servicio servicio) {
        Map<String, Object> fila = new LinkedHashMap<>();
        fila.put("idServicio", servicio.getIdServicio());
        fila.put("tipo", servicio.getTipo());
        fila.put("placa", servicio.getVehiculo() == null ? null : servicio.getVehiculo().getPlaca());
        fila.put("progreso", servicio.getProgreso() == null ? 0 : servicio.getProgreso());
        fila.put("estado", servicio.getEstado() == null ? null : servicio.getEstado().name());
        return fila;
    }
}
