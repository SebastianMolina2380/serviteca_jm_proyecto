package com.serviteca.controladores;

import com.serviteca.modelos.DetalleFactura;
import com.serviteca.repository.DetalleFacturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/detalle-factura")
@RequiredArgsConstructor
public class DetalleFacturaController {
    private final DetalleFacturaRepository detalleRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public List<DetalleFactura> listar() { return detalleRepository.findAll(); }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<DetalleFactura> buscar(@PathVariable Integer id) {
        return ResponseEntity.ok(detalleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Detalle de factura no encontrado.")));
    }

    @GetMapping("/factura/{idFactura}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public List<DetalleFactura> listarPorFactura(@PathVariable Integer idFactura) {
        return detalleRepository.findByFacturaIdFactura(idFactura);
    }

    @GetMapping("/servicio/{idservicio}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public List<DetalleFactura> listarPorServicio(@PathVariable Integer idservicio) {
        return detalleRepository.findByServicioIdServicio(idservicio);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> crear() { return inmutable(); }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> actualizar(@PathVariable Integer id) { return inmutable(); }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> eliminar(@PathVariable Integer id) { return inmutable(); }

    private ResponseEntity<Map<String, String>> inmutable() {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Los detalles de una factura emitida son inmutables.");
    }
}
