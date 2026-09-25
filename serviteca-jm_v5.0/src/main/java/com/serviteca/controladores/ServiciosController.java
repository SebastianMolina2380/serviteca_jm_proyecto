package com.serviteca.controladores;

import com.serviteca.modelos.Servicio;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.ServicioRepository;
import com.serviteca.repository.VehiculoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicios")
@RequiredArgsConstructor
@CrossOrigin(origins="*")
public class ServiciosController {
    private final ServicioRepository servicioRepository;
    private final VehiculoRepository vehiculoRepository;
    private final com.serviteca.repository.UsuarioRepository usuarioRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<List<Servicio>> listarTodos(Authentication a){
        if(a!=null && a.getAuthorities().stream().anyMatch(x->x.getAuthority().equals("ROLE_CLIENTE"))){
            Usuario u=usuarioRepository.findByCorreo(a.getName()).orElse(null);
            if(u==null)return ResponseEntity.status(401).build();
            return ResponseEntity.ok(servicioRepository.findAll().stream()
                .filter(s->s.getVehiculo()!=null&&s.getVehiculo().getUsuario()!=null
                    &&u.getIdUsuario().equals(s.getVehiculo().getUsuario().getIdUsuario())).toList());
        }
        return ResponseEntity.ok(servicioRepository.findAll());
    }

    @GetMapping("/vehiculo/{idVehiculo}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<List<Servicio>> porVehiculo(@PathVariable Integer idVehiculo, Authentication a){
        var v=vehiculoRepository.findById(idVehiculo).orElse(null);
        if(v==null)return ResponseEntity.notFound().build();
        if(a!=null && a.getAuthorities().stream().anyMatch(x->x.getAuthority().equals("ROLE_CLIENTE"))){
            Usuario u=usuarioRepository.findByCorreo(a.getName()).orElse(null);
            if(u==null||v.getUsuario()==null||!u.getIdUsuario().equals(v.getUsuario().getIdUsuario()))
                return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(servicioRepository.findAll().stream()
            .filter(s->s.getVehiculo()!=null&&idVehiculo.equals(s.getVehiculo().getIdvehiculo())).toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> crear(@Valid @RequestBody Servicio s){
        if(s.getVehiculo()==null||s.getVehiculo().getIdvehiculo()==null)
            return ResponseEntity.badRequest().body(java.util.Map.of("error","Debe indicar el vehículo."));
        var v=vehiculoRepository.findById(s.getVehiculo().getIdvehiculo()).orElse(null);
        if(v==null)return ResponseEntity.badRequest().body(java.util.Map.of("error","Vehículo no encontrado."));
        s.setVehiculo(v); if(s.getEstado()==null)s.setEstado(Servicio.Estado.PROGRAMADO);
        if(s.getProgreso()==null)s.setProgreso(0);
        return ResponseEntity.status(201).body(servicioRepository.save(s));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> actualizar(@PathVariable Integer id,@Valid @RequestBody Servicio d){
        return servicioRepository.findById(id).map(s->{
            s.setTipo(d.getTipo());s.setDescripcion(d.getDescripcion());s.setPrecio(d.getPrecio());
            s.setActivo(d.getActivo());s.setEstado(d.getEstado());s.setProgreso(d.getProgreso());
            s.setFechaServicio(d.getFechaServicio());
            if(d.getVehiculo()!=null&&d.getVehiculo().getIdvehiculo()!=null)
                vehiculoRepository.findById(d.getVehiculo().getIdvehiculo()).ifPresent(s::setVehiculo);
            return ResponseEntity.ok(servicioRepository.save(s));
        }).orElseGet(()->ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id){
        if(!servicioRepository.existsById(id))return ResponseEntity.notFound().build();
        servicioRepository.deleteById(id);return ResponseEntity.noContent().build();
    }
}