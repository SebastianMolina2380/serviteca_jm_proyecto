package com.serviteca.controladores;

import com.serviteca.DTOs.UsuarioDTOs;
import com.serviteca.Mapper.UsuarioMapper;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@CrossOrigin(origins="*")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<UsuarioDTOs>> listarTodos(){
        return ResponseEntity.ok(usuarioRepository.findAll().stream().map(UsuarioMapper::toDTO).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTOs> obtenerPorId(@PathVariable Integer id){
        return usuarioRepository.findById(id).map(u->ResponseEntity.ok(UsuarioMapper.toDTO(u)))
            .orElseGet(()->ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody UsuarioDTOs dto){
        if(dto.getContrasena()==null||dto.getContrasena().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error","La contraseña es obligatoria."));
        if(usuarioRepository.existsByCorreo(dto.getCorreo())||usuarioRepository.existsByNumeroDoc(dto.getNumeroDoc()))
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error","El correo o documento ya existe."));
        Usuario u=UsuarioMapper.toEntity(dto);
        u.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        if(u.getRol()==null)u.setRol(Usuario.Rol.CLIENTE);
        if(u.getTipoDocumento()==null||u.getTipoDocumento().isBlank())u.setTipoDocumento("CC");
        if(u.getEstado()==null)u.setEstado(Usuario.Estado.ACTIVO);
        return ResponseEntity.status(201).body(UsuarioMapper.toDTO(usuarioRepository.save(u)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Integer id,@Valid @RequestBody UsuarioDTOs dto,
                                        Authentication authentication){
        return usuarioRepository.findById(id).map(u->{
            boolean eraAdminActivo = u.getRol() == Usuario.Rol.ADMIN
                    && u.getEstado() == Usuario.Estado.ACTIVO;
            boolean seguiraAdminActivo = eraAdminActivo;

            if (dto.getRol() != null) {
                Usuario.Rol nuevoRol = Usuario.Rol.valueOf(dto.getRol().trim().toUpperCase());
                seguiraAdminActivo = seguiraAdminActivo && nuevoRol == Usuario.Rol.ADMIN;
            }
            if (dto.getEstado() != null) {
                Usuario.Estado nuevoEstado = Usuario.Estado.valueOf(dto.getEstado().trim().toUpperCase());
                if (nuevoEstado == Usuario.Estado.INACTIVO) {
                    if (authentication != null && u.getCorreo() != null
                            && u.getCorreo().equalsIgnoreCase(authentication.getName())) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("error", "No puede desactivar su propia cuenta."));
                    }
                    seguiraAdminActivo = false;
                }
            }

            if (eraAdminActivo && !seguiraAdminActivo
                    && usuarioRepository.countByRolAndEstado(
                            Usuario.Rol.ADMIN, Usuario.Estado.ACTIVO) <= 1) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "No puede desactivar el último administrador activo."));
            }

            if(dto.getNombre()!=null)u.setNombre(dto.getNombre());
            if(dto.getNumeroDoc()!=null)u.setNumeroDoc(dto.getNumeroDoc());
            if(dto.getCorreo()!=null)u.setCorreo(dto.getCorreo());
            if(dto.getRol()!=null)u.setRol(Usuario.Rol.valueOf(dto.getRol().trim().toUpperCase()));
            if(dto.getTipoDocumento()!=null)u.setTipoDocumento(dto.getTipoDocumento());
            if(dto.getEstado()!=null)u.setEstado(Usuario.Estado.valueOf(dto.getEstado().toUpperCase()));
            if(dto.getDireccion()!=null)u.setDireccion(dto.getDireccion());
            if(dto.getTelefono()!=null)u.setTelefono(dto.getTelefono());
            if(dto.getCiudad()!=null)u.setCiudad(dto.getCiudad());
            if(dto.getContrasena()!=null&&!dto.getContrasena().isBlank())
                u.setContrasena(passwordEncoder.encode(dto.getContrasena()));
            return ResponseEntity.ok(UsuarioMapper.toDTO(usuarioRepository.save(u)));
        }).orElseGet(()->ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Integer id, Authentication authentication){
        Usuario objetivo = usuarioRepository.findById(id).orElse(null);
        if (objetivo == null) return ResponseEntity.notFound().build();

        if (authentication != null && objetivo.getCorreo() != null
                && objetivo.getCorreo().equalsIgnoreCase(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "No puede desactivar su propia cuenta."));
        }

        if (objetivo.getRol() == Usuario.Rol.ADMIN
                && objetivo.getEstado() == Usuario.Estado.ACTIVO
                && usuarioRepository.countByRolAndEstado(Usuario.Rol.ADMIN, Usuario.Estado.ACTIVO) <= 1) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "No puede desactivar el último administrador activo."));
        }

        // Borrado lógico: evita destruir facturas, pagos y trazabilidad asociada.
        objetivo.setEstado(Usuario.Estado.INACTIVO);
        usuarioRepository.save(objetivo);
        return ResponseEntity.noContent().build();
    }
}