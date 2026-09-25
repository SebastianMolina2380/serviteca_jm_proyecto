package com.serviteca.controladores;

import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
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
    public List<Map<String,Object>> listar(){
        return usuarioRepository.findByRol(Usuario.Rol.CLIENTE).stream().map(this::toMap).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crear(@RequestBody Map<String,String> b){
        String nombre=b.getOrDefault("nombre","").trim();
        String doc=b.getOrDefault("numeroDoc",b.getOrDefault("documento","")).trim();
        String email=b.getOrDefault("correo",b.getOrDefault("email","")).trim();
        String pass=b.getOrDefault("contrasena",b.getOrDefault("password",""));
        if(nombre.isBlank()||doc.isBlank()||email.isBlank()||pass.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error","Nombre, documento, correo y contraseña son obligatorios."));
        if(usuarioRepository.existsByCorreo(email)||usuarioRepository.existsByNumeroDoc(doc))
            return ResponseEntity.status(409).body(Map.of("error","El correo o documento ya existe."));
        Usuario u=new Usuario();
        u.setNombre(nombre);u.setNumeroDoc(doc);u.setCorreo(email);
        u.setContrasena(passwordEncoder.encode(pass));u.setRol(Usuario.Rol.CLIENTE);
        u.setTipoDocumento(b.getOrDefault("tipoDocumento",b.getOrDefault("tipo_documento","CC")));
        u.setDireccion(b.getOrDefault("direccion", ""));
        u.setTelefono(b.getOrDefault("telefono", ""));
        u.setCiudad(b.getOrDefault("ciudad", "Tunja - Colombia"));
        return ResponseEntity.status(201).body(toMap(usuarioRepository.save(u)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable Integer id,@RequestBody Map<String,String> b){
        return usuarioRepository.findById(id).map(u->{
            if(u.getRol()!=Usuario.Rol.CLIENTE)
                return ResponseEntity.badRequest().body(Map.of("error","El usuario no es cliente."));
            if(b.containsKey("nombre"))u.setNombre(b.get("nombre"));
            if(b.containsKey("numeroDoc"))u.setNumeroDoc(b.get("numeroDoc"));
            else if(b.containsKey("documento"))u.setNumeroDoc(b.get("documento"));
            if(b.containsKey("correo"))u.setCorreo(b.get("correo"));
            else if(b.containsKey("email"))u.setCorreo(b.get("email"));
            String pass=b.getOrDefault("contrasena",b.getOrDefault("password",""));
            if(!pass.isBlank())u.setContrasena(passwordEncoder.encode(pass));
            if(b.containsKey("tipoDocumento"))u.setTipoDocumento(b.get("tipoDocumento"));
            if(b.containsKey("direccion"))u.setDireccion(b.get("direccion"));
            if(b.containsKey("telefono"))u.setTelefono(b.get("telefono"));
            if(b.containsKey("ciudad"))u.setCiudad(b.get("ciudad"));
            if(b.containsKey("estado"))u.setEstado(Usuario.Estado.valueOf(b.get("estado").trim().toUpperCase()));
            return ResponseEntity.ok(toMap(usuarioRepository.save(u)));
        }).orElseGet(()->ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id){
        if(!usuarioRepository.existsById(id))return ResponseEntity.notFound().build();
        usuarioRepository.deleteById(id);return ResponseEntity.noContent().build();
    }

    private Map<String,Object> toMap(Usuario u){
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("id",u.getIdUsuario());m.put("nombre",u.getNombre());
        m.put("tipoDocumento",u.getTipoDocumento());m.put("documento",u.getNumeroDoc());
        m.put("email",u.getCorreo());m.put("estado",u.getEstado()==null?"ACTIVO":u.getEstado().name());
        m.put("ultimoAcceso",u.getUltimoAcceso());m.put("rol",u.getRol()==null?null:u.getRol().name());
        m.put("direccion",u.getDireccion());m.put("telefono",u.getTelefono());m.put("ciudad",u.getCiudad());
        return m;
    }
}