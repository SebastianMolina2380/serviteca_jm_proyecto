package com.serviteca.controladores;

import com.serviteca.modelos.Cita;
import com.serviteca.modelos.Vehiculo;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.CitaRepository;
import com.serviteca.repository.UsuarioRepository;
import com.serviteca.repository.VehiculoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

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
    public ResponseEntity<List<Cita>> listarTodas(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CLIENTE"))) {
            return usuarioRepository.findByCorreo(authentication.getName())
                    .map(u -> ResponseEntity.ok(citaRepository.buscarPorUsuario(u.getIdUsuario())))
                    .orElseGet(() -> ResponseEntity.status(401).build());
        }
        return ResponseEntity.ok(citaRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cita> obtenerPorId(@PathVariable Integer id) {
        return citaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
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
    public ResponseEntity<?> crear(@Valid @RequestBody Cita cita, Authentication authentication) {
        if (cita.getVehiculo() == null || cita.getVehiculo().getIdvehiculo() == null) {
            return ResponseEntity.badRequest().body("El objeto vehículo y su ID son obligatorios.");
        }

        Vehiculo vehiculo = vehiculoRepository.findById(cita.getVehiculo().getIdvehiculo()).orElse(null);
        if (vehiculo == null) {
            return ResponseEntity.badRequest().body("Vehículo no encontrado.");
        }

        if (citaRepository.existeConflicto(cita.getFecha(), cita.getHora())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Ya existe una cita programada para esa fecha y hora.");
        }

        cita.setVehiculo(vehiculo);
        boolean cliente = authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CLIENTE"));
        if (cliente) {
            Usuario usuario = usuarioRepository.findByCorreo(authentication.getName()).orElse(null);
            if (usuario == null || vehiculo.getUsuario() == null || !vehiculo.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("El vehículo no pertenece al cliente autenticado.");
            }
            cita.setUsuario(usuario);
        } else if (cita.getUsuario() == null || cita.getUsuario().getIdUsuario() == null) {
            cita.setUsuario(vehiculo.getUsuario());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(citaRepository.save(cita));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Integer id, @Valid @RequestBody Cita citaDetalles) {
        return citaRepository.findById(id).map(cita -> {
            if (citaRepository.existeConflictoExcluyendoId(citaDetalles.getFecha(), citaDetalles.getHora(), id)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Ya existe otra cita programada para esa fecha y hora.");
            }

            cita.setFecha(citaDetalles.getFecha());
            cita.setHora(citaDetalles.getHora());
            cita.setEstado(citaDetalles.getEstado());

            if (citaDetalles.getVehiculo() != null && citaDetalles.getVehiculo().getIdvehiculo() != null) {
                Vehiculo vehiculo = vehiculoRepository.findById(citaDetalles.getVehiculo().getIdvehiculo()).orElse(null);
                if (vehiculo != null) {
                    cita.setVehiculo(vehiculo);
                }
            }

            return ResponseEntity.ok(citaRepository.save(cita));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        if (!citaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        citaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}