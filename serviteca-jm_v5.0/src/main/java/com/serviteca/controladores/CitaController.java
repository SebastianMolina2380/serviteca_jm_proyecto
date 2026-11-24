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
import java.util.Locale;
import java.util.Map;

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
        return ResponseEntity.ok(citaRepository.findAllParaPortal());
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
        cita.setServicioSolicitado(textoOpcional(cita.getServicioSolicitado()));
        cita.setObservaciones(textoOpcional(cita.getObservaciones()));

        if (cliente) {
            cita.setUsuario(usuarioActual);
            // Un cliente no puede crear una cita ya confirmada o completada
            // ni asignarse un técnico a sí mismo.
            cita.setEstado(Cita.Estado.PENDIENTE);
            cita.setTecnico(null);
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
            cita.setTecnico(resolverTecnico(cita.getTecnico()));
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
        if (citaDetalles.getServicioSolicitado() != null) {
            cita.setServicioSolicitado(textoOpcional(citaDetalles.getServicioSolicitado()));
        }
        if (citaDetalles.getObservaciones() != null) {
            cita.setObservaciones(textoOpcional(citaDetalles.getObservaciones()));
        }

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

        if (!cliente && citaDetalles.getTecnico() != null) {
            cita.setTecnico(resolverTecnico(citaDetalles.getTecnico()));
        }

        return ResponseEntity.ok(citaRepository.save(cita));
    }

    /** Cambia únicamente el estado de la cita (los 4 estados existentes). */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Cita> cambiarEstado(@PathVariable Integer id,
                                              @RequestBody(required = false) Map<String, String> body) {
        Cita cita = buscarCita(id);

        if (cita.getFactura() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La cita ya está facturada y no puede modificarse.");
        }

        String valor = body == null ? null : body.get("estado");
        if (valor == null || valor.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El estado de la cita es obligatorio.");
        }

        Cita.Estado nuevo;
        try {
            nuevo = Cita.Estado.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Estado de cita inválido. Use PENDIENTE, CONFIRMADO, COMPLETADA o CANCELADA.");
        }

        cita.setEstado(nuevo);
        return ResponseEntity.ok(citaRepository.save(cita));
    }

    /** Actualiza las observaciones operativas de la cita. */
    @PatchMapping("/{id}/observaciones")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Cita> actualizarObservaciones(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body) {

        Cita cita = buscarCita(id);
        if (cita.getFactura() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La cita ya está facturada y no puede modificarse.");
        }

        String observaciones = body == null ? null : body.get("observaciones");
        cita.setObservaciones(textoOpcional(observaciones));
        return ResponseEntity.ok(citaRepository.save(cita));
    }

    /**
     * Asigna o desasigna un técnico. Enviar {@code idtecnico: null} deja la
     * cita sin técnico; el usuario indicado debe tener rol TÉCNICO y estar
     * activo.
     */
    @PatchMapping("/{id}/tecnico")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Cita> asignarTecnico(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> body) {

        Cita cita = buscarCita(id);
        if (cita.getFactura() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La cita ya está facturada y no puede modificarse.");
        }

        Object valor = body == null ? null
                : (body.containsKey("idtecnico") ? body.get("idtecnico") : body.get("idTecnico"));

        if (valor == null || String.valueOf(valor).isBlank()
                || "null".equalsIgnoreCase(String.valueOf(valor))) {
            cita.setTecnico(null);
        } else {
            Integer idTecnico;
            try {
                idTecnico = Integer.valueOf(String.valueOf(valor).trim());
            } catch (NumberFormatException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El ID del técnico no es válido.");
            }
            cita.setTecnico(resolverTecnicoPorId(idTecnico));
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
        return usuarioRepository.findByCorreoIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Usuario no autenticado."));
    }

    /**
     * Resuelve el técnico recibido en el cuerpo. Devuelve null cuando no se
     * indica ninguno y valida rol/estado cuando sí llega un ID.
     */
    private Usuario resolverTecnico(Usuario tecnico) {
        if (tecnico == null || tecnico.getIdUsuario() == null) return null;
        return resolverTecnicoPorId(tecnico.getIdUsuario());
    }

    private Usuario resolverTecnicoPorId(Integer idTecnico) {
        Usuario encontrado = usuarioRepository.findById(idTecnico)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Técnico no encontrado."));

        if (encontrado.getRol() != Usuario.Rol.TECNICO
                || encontrado.getEstado() == Usuario.Estado.INACTIVO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El usuario indicado no es un técnico activo.");
        }
        return encontrado;
    }

    private String textoOpcional(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
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
