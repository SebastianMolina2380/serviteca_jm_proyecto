package com.serviteca.controladores;

import com.serviteca.DTOs.ServicioPortalDTO;
import com.serviteca.modelos.Servicio;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.ServicioRepository;
import com.serviteca.repository.UsuarioRepository;
import com.serviteca.repository.VehiculoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/servicios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServiciosController {

    private final ServicioRepository servicioRepository;
    private final VehiculoRepository vehiculoRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Listado paginado. Los filtros se resuelven en PostgreSQL; el cliente
     * solo recibe la página solicitada en lugar de todo el catálogo.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<?> listarTodos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Boolean activo,
            Authentication authentication) {

        Integer idUsuario = null;
        if (isCliente(authentication)) {
            Usuario usuario = requireCurrentUser(authentication);
            idUsuario = usuario.getIdUsuario();
        }

        Servicio.Estado estadoEnum = parseEstado(estado);
        Page<Servicio> resultado = servicioRepository.buscarPaginado(
                idUsuario,
                patronBusqueda(q),
                estadoEnum,
                activo,
                PageRequest.of(paginaSegura(page), tamanoSeguro(size),
                        Sort.by(Sort.Direction.DESC, "idServicio")));
        return ResponseEntity.ok(resultado);
    }

    /** Catálogo completo y liviano para selects de agendas. */
    @GetMapping("/catalogo")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<List<Servicio>> catalogo() {
        return ResponseEntity.ok(servicioRepository.findByActivoTrueOrderByTipoAsc());
    }

    /**
     * Listado operativo del portal técnico. Incluye placa y cliente, datos
     * que la entidad oculta al serializarse directamente.
     */
    @GetMapping("/portal")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<List<ServicioPortalDTO>> portal() {
        List<ServicioPortalDTO> servicios = servicioRepository.findAllParaPortal()
                .stream()
                .map(ServicioPortalDTO::from)
                .toList();
        return ResponseEntity.ok(servicios);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<Servicio> obtener(@PathVariable Integer id) {
        return servicioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/vehiculo/{idVehiculo}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<List<Servicio>> porVehiculo(@PathVariable Integer idVehiculo, Authentication authentication) {
        var vehiculo = vehiculoRepository.findById(idVehiculo).orElse(null);
        if (vehiculo == null) return ResponseEntity.notFound().build();
        if (isCliente(authentication)) {
            Usuario usuario = requireCurrentUser(authentication);
            if (vehiculo.getUsuario() == null
                    || !usuario.getIdUsuario().equals(vehiculo.getUsuario().getIdUsuario())) {
                return ResponseEntity.status(403).build();
            }
        }
        return ResponseEntity.ok(servicioRepository.findAll().stream()
                .filter(s -> s.getVehiculo() != null
                        && idVehiculo.equals(s.getVehiculo().getIdvehiculo())).toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> crear(@Valid @RequestBody Servicio servicio) {
        if (servicio.getVehiculo() == null || servicio.getVehiculo().getIdvehiculo() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Debe indicar el vehículo."));
        }
        var vehiculo = vehiculoRepository.findById(servicio.getVehiculo().getIdvehiculo()).orElse(null);
        if (vehiculo == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Vehículo no encontrado."));
        }
        servicio.setVehiculo(vehiculo);
        if (servicio.getEstado() == null) servicio.setEstado(Servicio.Estado.PROGRAMADO);
        if (servicio.getProgreso() == null) servicio.setProgreso(0);
        return ResponseEntity.status(201).body(servicioRepository.save(servicio));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> actualizar(@PathVariable Integer id, @Valid @RequestBody Servicio datos) {
        return servicioRepository.findById(id).map(servicio -> {
            servicio.setTipo(datos.getTipo());
            servicio.setDescripcion(datos.getDescripcion());
            servicio.setPrecio(datos.getPrecio());
            servicio.setActivo(datos.getActivo());
            servicio.setEstado(datos.getEstado());
            servicio.setProgreso(datos.getProgreso());
            servicio.setFechaServicio(datos.getFechaServicio());
            if (datos.getVehiculo() != null && datos.getVehiculo().getIdvehiculo() != null) {
                vehiculoRepository.findById(datos.getVehiculo().getIdvehiculo())
                        .ifPresent(servicio::setVehiculo);
            }
            return ResponseEntity.ok(servicioRepository.save(servicio));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Cambia solo el estado operativo del servicio. */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Servicio> cambiarEstado(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body) {

        Servicio servicio = buscarServicio(id);
        String valor = body == null ? null : body.get("estado");
        if (valor == null || valor.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El estado del servicio es obligatorio.");
        }

        Servicio.Estado nuevo;
        try {
            nuevo = Servicio.Estado.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Estado de servicio inválido. Use PROGRAMADO, EN_PROCESO, COMPLETADO o CANCELADO.");
        }

        servicio.setEstado(nuevo);
        if (nuevo == Servicio.Estado.COMPLETADO) {
            servicio.setProgreso(100);
        } else if (nuevo == Servicio.Estado.PROGRAMADO) {
            servicio.setProgreso(0);
        }

        return ResponseEntity.ok(servicioRepository.save(servicio));
    }

    /** Actualiza el avance (0-100) y sincroniza el estado operativo. */
    @PatchMapping("/{id}/progreso")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Servicio> cambiarProgreso(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> body) {

        Servicio servicio = buscarServicio(id);
        Object valor = body == null ? null : body.get("progreso");
        if (valor == null || String.valueOf(valor).isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El progreso del servicio es obligatorio.");
        }

        int progreso;
        try {
            progreso = Integer.parseInt(String.valueOf(valor).trim());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El progreso debe ser un número entero entre 0 y 100.");
        }
        if (progreso < 0 || progreso > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El progreso debe estar entre 0 y 100.");
        }

        servicio.setProgreso(progreso);
        if (servicio.getEstado() != Servicio.Estado.CANCELADO) {
            if (progreso >= 100) {
                servicio.setEstado(Servicio.Estado.COMPLETADO);
            } else if (progreso > 0 && servicio.getEstado() == Servicio.Estado.PROGRAMADO) {
                servicio.setEstado(Servicio.Estado.EN_PROCESO);
            } else if (progreso == 0 && servicio.getEstado() == Servicio.Estado.COMPLETADO) {
                servicio.setEstado(Servicio.Estado.EN_PROCESO);
            }
        }

        return ResponseEntity.ok(servicioRepository.save(servicio));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        if (!servicioRepository.existsById(id)) return ResponseEntity.notFound().build();
        servicioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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

    private Servicio buscarServicio(Integer id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El ID del servicio es obligatorio.");
        }
        return servicioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Servicio no encontrado con ID: " + id));
    }

    private Servicio.Estado parseEstado(String estado) {
        if (estado == null || estado.isBlank()) return null;
        try {
            return Servicio.Estado.valueOf(estado.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de servicio inválido.");
        }
    }

    private String textoOpcional(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    /**
     * Patrón LIKE siempre no nulo. Evita que PostgreSQL reciba un parámetro
     * sin tipo y falle con "no existe la función lower(bytea)".
     */
    private String patronBusqueda(String valor) {
        String limpio = textoOpcional(valor);
        if (limpio == null) return "%%";
        return "%" + limpio.toLowerCase(Locale.ROOT) + "%";
    }

    private int paginaSegura(int page) { return Math.max(page, 0); }

    private int tamanoSeguro(int size) { return Math.min(Math.max(size, 1), 100); }
}
