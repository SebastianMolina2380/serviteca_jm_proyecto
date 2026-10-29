package com.serviteca.controladores;

import com.serviteca.modelos.Cita;
import com.serviteca.modelos.Usuario;
import com.serviteca.modelos.Vehiculo;
import com.serviteca.repository.CitaRepository;
import com.serviteca.repository.UsuarioRepository;
import com.serviteca.repository.VehiculoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CitaController {

    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;
    private final VehiculoRepository vehiculoRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<List<Cita>> listarTodas(Authentication authentication) {
        if (isCliente(authentication)) {
            Usuario usuario = requireCurrentUser(authentication);
            return ResponseEntity.ok(citaRepository.buscarPorUsuario(usuario.getIdUsuario()));
        }
        return ResponseEntity.ok(citaRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<Cita> obtenerPorId(@PathVariable Integer id, Authentication authentication) {
        Cita cita = buscarCita(id);
        validarAccesoCita(cita, authentication);
        return ResponseEntity.ok(cita);
    }

    @GetMapping("/usuario/{idUsuario}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<List<Cita>> listarPorUsuario(@PathVariable Integer idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(citaRepository.buscarPorUsuario(idUsuario));
    }

    @GetMapping("/fecha/{fecha}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<List<Cita>> listarPorFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(citaRepository.findByFecha(fecha));
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<List<Cita>> listarPorEstado(@PathVariable String estado) {
        try {
            Cita.Estado estadoEnum = Cita.Estado.valueOf(estado.toUpperCase());
            return ResponseEntity.ok(citaRepository.findByEstado(estadoEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<?> crear(@Valid @RequestBody Cita cita, Authentication authentication) {
        if (cita.getVehiculo() == null || cita.getVehiculo().getIdvehiculo() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El objeto vehículo y su ID son obligatorios.");
        }

        Vehiculo vehiculo = vehiculoRepository.findById(cita.getVehiculo().getIdvehiculo())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Vehículo no encontrado."));

        if (vehiculo.getEstado() == Vehiculo.Estado.INACTIVO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El vehículo no está disponible para agendar citas.");
        }

        if (citaRepository.existeConflicto(
                cita.getFecha(), cita.getHora(), Cita.Estado.CANCELADA)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Ya existe una cita programada para esa fecha y hora.");
        }

        boolean cliente = isCliente(authentication);
        Usuario usuarioActual = cliente ? requireCurrentUser(authentication) : null;

        if (cliente && (vehiculo.getUsuario() == null
                || !vehiculo.getUsuario().getIdUsuario().equals(usuarioActual.getIdUsuario()))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "El vehículo no pertenece al cliente autenticado.");
        }

        cita.setVehiculo(vehiculo);

        if (cliente) {
            cita.setUsuario(usuarioActual);
            // Un cliente no puede crear una cita ya confirmada o completada.
            cita.setEstado(Cita.Estado.PENDIENTE);
        } else {
            Usuario propietario;
            if (cita.getUsuario() != null && cita.getUsuario().getIdUsuario() != null) {
                propietario = usuarioRepository.findById(cita.getUsuario().getIdUsuario())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Usuario no encontrado."));
            } else {
                propietario = vehiculo.getUsuario();
            }
            if (propietario == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "No se pudo determinar el propietario de la cita.");
            }
            cita.setUsuario(propietario);
            if (cita.getEstado() == null) {
                cita.setEstado(Cita.Estado.PENDIENTE);
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(citaRepository.save(cita));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<?> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody Cita citaDetalles,
            Authentication authentication) {

        Cita cita = buscarCita(id);
        validarAccesoCita(cita, authentication);

        if (cita.getEstado() == Cita.Estado.COMPLETADA || cita.getFactura() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La cita ya está completada o facturada y no puede modificarse.");
        }

        if (citaRepository.existeConflictoExcluyendoId(
                citaDetalles.getFecha(), citaDetalles.getHora(), id, Cita.Estado.CANCELADA)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Ya existe otra cita programada para esa fecha y hora.");
        }

        boolean cliente = isCliente(authentication);
        Usuario usuarioActual = cliente ? requireCurrentUser(authentication) : null;

        cita.setFecha(citaDetalles.getFecha());
        cita.setHora(citaDetalles.getHora());

        if (cliente) {
            // El cliente solo puede cancelar; no puede confirmar, completar ni reasignar.
            if (citaDetalles.getEstado() == Cita.Estado.CANCELADA) {
                cita.setEstado(Cita.Estado.CANCELADA);
            }
        } else if (citaDetalles.getEstado() != null) {
            cita.setEstado(citaDetalles.getEstado());
        }

        if (citaDetalles.getVehiculo() != null
                && citaDetalles.getVehiculo().getIdvehiculo() != null) {
            Vehiculo vehiculo = vehiculoRepository.findById(
                            citaDetalles.getVehiculo().getIdvehiculo())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Vehículo no encontrado."));

            if (vehiculo.getEstado() == Vehiculo.Estado.INACTIVO) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "El vehículo no está disponible para agendar citas.");
            }
            if (cliente && (vehiculo.getUsuario() == null
                    || !vehiculo.getUsuario().getIdUsuario().equals(usuarioActual.getIdUsuario()))) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "El vehículo no pertenece al cliente autenticado.");
            }

            cita.setVehiculo(vehiculo);
            if (cliente) {
                cita.setUsuario(usuarioActual);
            } else if (citaDetalles.getUsuario() == null
                    || citaDetalles.getUsuario().getIdUsuario() == null) {
                cita.setUsuario(vehiculo.getUsuario());
            }
        }

        if (!cliente && citaDetalles.getUsuario() != null
                && citaDetalles.getUsuario().getIdUsuario() != null) {
            Usuario propietario = usuarioRepository.findById(
                            citaDetalles.getUsuario().getIdUsuario())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Usuario no encontrado."));
            cita.setUsuario(propietario);
        }

        return ResponseEntity.ok(citaRepository.save(cita));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id, Authentication authentication) {
        Cita cita = buscarCita(id);
        validarAccesoCita(cita, authentication);

        if (cita.getEstado() == Cita.Estado.COMPLETADA || cita.getFactura() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede cancelar una cita completada o facturada.");
        }

        // Borrado lógico: la cita se conserva como CANCELADA para auditoría.
        if (cita.getEstado() != Cita.Estado.CANCELADA) {
            cita.setEstado(Cita.Estado.CANCELADA);
            citaRepository.save(cita);
        }
        return ResponseEntity.noContent().build();
    }

    private Cita buscarCita(Integer id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El ID de la cita es obligatorio.");
        }
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Cita no encontrada con ID: " + id));
    }

    private boolean isCliente(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CLIENTE".equals(a.getAuthority()));
    }

    private Usuario requireCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado.");
        }
        return usuarioRepository.findByCorreo(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Usuario no autenticado."));
    }

    private void validarAccesoCita(Cita cita, Authentication authentication) {
        if (!isCliente(authentication)) return;

        Usuario usuario = requireCurrentUser(authentication);
        boolean propietario = (cita.getUsuario() != null
                && cita.getUsuario().getIdUsuario().equals(usuario.getIdUsuario()))
                || (cita.getVehiculo() != null && cita.getVehiculo().getUsuario() != null
                && cita.getVehiculo().getUsuario().getIdUsuario().equals(usuario.getIdUsuario()));

        if (!propietario) {
            // 404 para no revelar la existencia de citas de otros clientes.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada con ID: " + cita.getIdCita());
        }
    }
}
