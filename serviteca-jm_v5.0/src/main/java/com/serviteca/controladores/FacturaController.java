package com.serviteca.controladores;

import com.serviteca.modelos.Cita;
import com.serviteca.modelos.DetalleFactura;
import com.serviteca.modelos.Factura;
import com.serviteca.modelos.Usuario;
import com.serviteca.modelos.Vehiculo;
import com.serviteca.repository.CitaRepository;
import com.serviteca.repository.FacturaRepository;
import com.serviteca.repository.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FacturaController {

    private final FacturaRepository facturaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CitaRepository citaRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<List<Map<String, Object>>> listarTodas(Authentication authentication) {
        List<Factura> facturas;
        if (isCliente(authentication)) {
            Usuario usuario = currentUser(authentication);
            if (usuario == null) return ResponseEntity.status(401).build();
            facturas = facturaRepository.findByUsuarioIdUsuario(usuario.getIdUsuario());
        } else {
            facturas = facturaRepository.findAll();
            // La colección se puede volver a cargar con un EntityGraph por factura al construir el DTO.
            // Para evitar depender de lazy loading, cada factura se transforma dentro de la sesión JPA.
        }
        return ResponseEntity.ok(facturas.stream().map(this::toView).toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<?> obtenerPorId(@PathVariable Integer id, Authentication authentication) {
        return facturaRepository.findById(id).map(f -> {
            if (isCliente(authentication) && !belongsToCurrentUser(f, authentication)) {
                return ResponseEntity.status(403).body(Map.of("error", "No puede consultar esta factura."));
            }
            return ResponseEntity.ok(toView(f));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> crear(@Valid @RequestBody Factura factura) {
        if (factura.getUsuario() == null || factura.getUsuario().getIdUsuario() == null)
            return ResponseEntity.badRequest().body(Map.of("error", "El usuario es obligatorio."));
        if (factura.getCita() == null || factura.getCita().getIdCita() == null)
            return ResponseEntity.badRequest().body(Map.of("error", "La cita es obligatoria."));

        Usuario usuario = usuarioRepository.findById(factura.getUsuario().getIdUsuario()).orElse(null);
        Cita cita = citaRepository.findById(factura.getCita().getIdCita()).orElse(null);
        if (usuario == null) return ResponseEntity.badRequest().body(Map.of("error", "Usuario no encontrado."));
        if (cita == null) return ResponseEntity.badRequest().body(Map.of("error", "Cita no encontrada."));
        if (facturaRepository.existsByCitaIdCita(cita.getIdCita()))
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "La cita ya tiene una factura."));

        factura.setUsuario(usuario);
        factura.setCita(cita);
        if (factura.getFormaPago() == null || factura.getFormaPago().isBlank()) factura.setFormaPago("Contado");
        if (factura.getMedioPago() == null || factura.getMedioPago().isBlank()) factura.setMedioPago("Efectivo");
        return ResponseEntity.status(HttpStatus.CREATED).body(toView(facturaRepository.save(factura)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> actualizar(@PathVariable Integer id, @Valid @RequestBody Factura datos) {
        return facturaRepository.findById(id).map(factura -> {
            if (datos.getUsuario() == null || datos.getUsuario().getIdUsuario() == null)
                return ResponseEntity.badRequest().body(Map.of("error", "El usuario es obligatorio."));
            if (datos.getCita() == null || datos.getCita().getIdCita() == null)
                return ResponseEntity.badRequest().body(Map.of("error", "La cita es obligatoria."));

            Usuario usuario = usuarioRepository.findById(datos.getUsuario().getIdUsuario()).orElse(null);
            Cita cita = citaRepository.findById(datos.getCita().getIdCita()).orElse(null);
            if (usuario == null) return ResponseEntity.badRequest().body(Map.of("error", "Usuario no encontrado."));
            if (cita == null) return ResponseEntity.badRequest().body(Map.of("error", "Cita no encontrada."));

            factura.setSubtotal(datos.getSubtotal());
            factura.setUsuario(usuario);
            factura.setCita(cita);
            factura.setFormaPago(datos.getFormaPago());
            factura.setMedioPago(datos.getMedioPago());
            return ResponseEntity.ok(toView(facturaRepository.save(factura)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        if (!facturaRepository.existsById(id)) return ResponseEntity.notFound().build();
        facturaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isCliente(Authentication a) {
        return a != null && a.getAuthorities().stream().anyMatch(x -> "ROLE_CLIENTE".equals(x.getAuthority()));
    }

    private Usuario currentUser(Authentication a) {
        return a == null ? null : usuarioRepository.findByCorreo(a.getName()).orElse(null);
    }

    private boolean belongsToCurrentUser(Factura f, Authentication a) {
        Usuario u = currentUser(a);
        return u != null && f.getUsuario() != null && Objects.equals(u.getIdUsuario(), f.getUsuario().getIdUsuario());
    }

    private Map<String, Object> toView(Factura f) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("idFactura", f.getIdFactura());
        m.put("numeroFactura", "JM " + (f.getIdFactura() == null ? "" : f.getIdFactura()));
        m.put("fecha", f.getFecha());
        m.put("fechaGeneracion", f.getFechaGeneracion());
        m.put("subtotal", money(f.getSubtotal()));
        m.put("total", money(f.getTotal()));
        m.put("formaPago", f.getFormaPago());
        m.put("medioPago", f.getMedioPago());

        Usuario u = f.getUsuario();
        if (u != null) {
            Map<String, Object> um = new LinkedHashMap<>();
            um.put("idUsuario", u.getIdUsuario());
            um.put("nombre", u.getNombre());
            um.put("numeroDoc", u.getNumeroDoc());
            um.put("tipoDocumento", u.getTipoDocumento());
            um.put("correo", u.getCorreo());
            um.put("direccion", u.getDireccion());
            um.put("telefono", u.getTelefono());
            um.put("ciudad", u.getCiudad());
            m.put("usuario", um);
        }

        Cita c = f.getCita();
        if (c != null) {
            Map<String, Object> cm = new LinkedHashMap<>();
            cm.put("idCita", c.getIdCita());
            cm.put("fecha", c.getFecha());
            cm.put("hora", c.getHora());
            cm.put("estado", c.getEstado() == null ? null : c.getEstado().name());
            Vehiculo v = c.getVehiculo();
            if (v != null) {
                Map<String, Object> vm = new LinkedHashMap<>();
                vm.put("idVehiculo", v.getIdvehiculo());
                vm.put("placa", v.getPlaca());
                vm.put("marca", v.getMarca());
                vm.put("modelo", v.getModelo());
                vm.put("color", v.getColor());
                cm.put("vehiculo", vm);
            }
            m.put("cita", cm);
        }

        List<Map<String, Object>> detalles = new ArrayList<>();
        if (f.getDetalles() != null) {
            int i = 1;
            for (DetalleFactura d : f.getDetalles()) {
                Map<String, Object> dm = new LinkedHashMap<>();
                dm.put("item", i++);
                dm.put("idDetalleFactura", d.getIdDetalleFactura());
                dm.put("nombre", d.getNombre());
                dm.put("cantidad", d.getCantidad());
                dm.put("valor", money(d.getValor()));
                dm.put("subtotal", money(d.getSubtotal()));
                detalles.add(dm);
            }
        }
        m.put("detalles", detalles);
        return m;
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
