package com.serviteca.controladores;

import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
public class ClienteController {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public Page<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q) {
        Page<Usuario> clientes = usuarioRepository.buscarPorRolEstado(
                Usuario.Rol.CLIENTE,
                Usuario.Estado.ACTIVO,
                patronBusqueda(q),
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.ASC, "nombre")));
        return clientes.map(this::toMap);
    }

    /** Lista completa para selects de vehículos/citas. */
    @GetMapping("/catalogo")
    public List<Map<String, Object>> catalogo() {
        return usuarioRepository.findByRolAndEstadoOrderByNombreAsc(
                        Usuario.Rol.CLIENTE, Usuario.Estado.ACTIVO)
                .stream().map(this::toMap).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crear(@RequestBody Map<String, String> b) {
        String nombre = b.getOrDefault("nombre", "").trim();
        String doc = b.getOrDefault("numeroDoc", b.getOrDefault("documento", "")).trim();
        String email = b.getOrDefault("correo", b.getOrDefault("email", "")).trim();
        String pass = b.getOrDefault("contrasena", b.getOrDefault("password", ""));
        if (nombre.isBlank() || doc.isBlank() || email.isBlank() || pass.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Nombre, documento, correo y contraseña son obligatorios."));
        if (usuarioRepository.existsByCorreo(email) || usuarioRepository.existsByNumeroDoc(doc))
            return ResponseEntity.status(409).body(Map.of("error", "El correo o documento ya existe."));
        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setNumeroDoc(doc);
        u.setCorreo(email);
        u.setContrasena(passwordEncoder.encode(pass));
        u.setRol(Usuario.Rol.CLIENTE);
        u.setTipoDocumento(b.getOrDefault("tipoDocumento", b.getOrDefault("tipo_documento", "CC")));
        u.setDireccion(b.getOrDefault("direccion", ""));
        u.setTelefono(b.getOrDefault("telefono", ""));
        u.setCiudad(b.getOrDefault("ciudad", "Tunja - Colombia"));
        return ResponseEntity.status(201).body(toMap(usuarioRepository.save(u)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable Integer id, @RequestBody Map<String, String> b) {
        return usuarioRepository.findById(id).map(u -> {
            if (u.getRol() != Usuario.Rol.CLIENTE)
                return ResponseEntity.badRequest().body(Map.of("error", "El usuario no es cliente."));
            if (b.containsKey("nombre")) u.setNombre(b.get("nombre"));
            if (b.containsKey("numeroDoc")) u.setNumeroDoc(b.get("numeroDoc"));
            else if (b.containsKey("documento")) u.setNumeroDoc(b.get("documento"));
            if (b.containsKey("correo")) u.setCorreo(b.get("correo"));
            else if (b.containsKey("email")) u.setCorreo(b.get("email"));
            String pass = b.getOrDefault("contrasena", b.getOrDefault("password", ""));
            if (!pass.isBlank()) u.setContrasena(passwordEncoder.encode(pass));
            if (b.containsKey("tipoDocumento")) u.setTipoDocumento(b.get("tipoDocumento"));
            if (b.containsKey("direccion")) u.setDireccion(b.get("direccion"));
            if (b.containsKey("telefono")) u.setTelefono(b.get("telefono"));
            if (b.containsKey("ciudad")) u.setCiudad(b.get("ciudad"));
            if (b.containsKey("estado")) u.setEstado(Usuario.Estado.valueOf(b.get("estado").trim().toUpperCase()));
            return ResponseEntity.ok(toMap(usuarioRepository.save(u)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        return usuarioRepository.findById(id).map(u -> {
            // Borrado lógico: conserva facturas, citas y trazabilidad del cliente.
            u.setEstado(Usuario.Estado.INACTIVO);
            usuarioRepository.save(u);
            return ResponseEntity.noContent().<Void>build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Map<String, Object> toMap(Usuario u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getIdUsuario());
        m.put("nombre", u.getNombre());
        m.put("tipoDocumento", u.getTipoDocumento());
        m.put("documento", u.getNumeroDoc());
        m.put("email", u.getCorreo());
        m.put("estado", u.getEstado() == null ? "ACTIVO" : u.getEstado().name());
        m.put("ultimoAcceso", u.getUltimoAcceso());
        m.put("rol", u.getRol() == null ? null : u.getRol().name());
        m.put("direccion", u.getDireccion());
        m.put("telefono", u.getTelefono());
        m.put("ciudad", u.getCiudad());
        return m;
    }

    private String textoOpcional(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    /** Patrón LIKE no nulo: PostgreSQL no infiere el tipo de un null. */
    private String patronBusqueda(String valor) {
        String limpio = textoOpcional(valor);
        if (limpio == null) return "%%";
        return "%" + limpio.toLowerCase(Locale.ROOT) + "%";
    }
}
