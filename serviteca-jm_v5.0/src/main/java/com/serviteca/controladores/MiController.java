package com.serviteca.controladores;

import com.serviteca.modelos.*;
import com.serviteca.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mi")
@RequiredArgsConstructor
public class MiController {
    private final UsuarioRepository usuarioRepository;
    private final VehiculoRepository vehiculoRepository;
    private final CitaRepository citaRepository;
    private final ServicioRepository servicioRepository;
    private final FacturaRepository facturaRepository;

    private Usuario me(Authentication a){return usuarioRepository.findByCorreo(a.getName()).orElse(null);}

    @GetMapping("/vehiculos")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<List<Vehiculo>> misVehiculos(Authentication a){
        Usuario u=me(a); return u==null?ResponseEntity.status(401).build():
            ResponseEntity.ok(vehiculoRepository.findByUsuarioIdUsuarioAndEstado(
                    u.getIdUsuario(), Vehiculo.Estado.ACTIVO));
    }

    @PostMapping("/vehiculos")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<?> crearVehiculo(@Valid @RequestBody Vehiculo v,Authentication a){
        Usuario u=me(a); if(u==null)return ResponseEntity.status(401).build();
        String placa = com.serviteca.util.PlacaUtil.normalizar(v.getPlaca());
        if (placa == null || placa.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "La placa es obligatoria."));
        }
        if (vehiculoRepository.existsByPlaca(placa)) {
            return ResponseEntity.status(409).body(java.util.Map.of(
                    "error", "Ya existe un vehículo registrado con la placa: " + placa));
        }
        v.setPlaca(placa);
        if (v.getEstado() == null) v.setEstado(Vehiculo.Estado.ACTIVO);
        v.setUsuario(u);
        return ResponseEntity.status(201).body(vehiculoRepository.save(v));
    }

    @GetMapping("/citas")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<?> misCitas(Authentication a){
        Usuario u=me(a); if(u==null)return ResponseEntity.status(401).build();
        return ResponseEntity.ok(citaRepository.buscarPorUsuario(u.getIdUsuario()));
    }

    @GetMapping("/facturas")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<?> misFacturas(Authentication a){
        Usuario u=me(a);
        if(u==null)return ResponseEntity.status(401).build();
        return ResponseEntity.ok(facturaRepository.findByUsuarioIdUsuario(u.getIdUsuario()).stream().map(f -> {
            java.util.Map<String,Object> m=new java.util.LinkedHashMap<>();
            m.put("idFactura",f.getIdFactura());
            m.put("numeroFactura","JM "+f.getIdFactura());
            m.put("fecha",f.getFecha());
            m.put("total",f.getTotal());
            m.put("subtotal",f.getSubtotal());
            m.put("formaPago",f.getFormaPago());
            m.put("medioPago",f.getMedioPago());
            if(f.getCita()!=null && f.getCita().getVehiculo()!=null){
                m.put("placa",f.getCita().getVehiculo().getPlaca());
            }
            return m;
        }).toList());
    }

    @GetMapping("/servicios")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<?> misServicios(Authentication a){
        Usuario u=me(a); if(u==null)return ResponseEntity.status(401).build();
        return ResponseEntity.ok(servicioRepository.findAll().stream()
            .filter(s->s.getVehiculo()!=null&&s.getVehiculo().getUsuario()!=null
                &&u.getIdUsuario().equals(s.getVehiculo().getUsuario().getIdUsuario())).toList());
    }
}