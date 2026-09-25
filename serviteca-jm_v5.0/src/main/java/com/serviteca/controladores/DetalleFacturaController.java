package com.serviteca.controladores;

import com.serviteca.modelos.DetalleFactura;
import com.serviteca.repository.DetalleFacturaRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/detalle-factura")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DetalleFacturaController {

    private final DetalleFacturaRepository detalleFacturaRepository;

    @GetMapping
    public ResponseEntity<List<DetalleFactura>> listarDetalles() {
        return ResponseEntity.ok(detalleFacturaRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DetalleFactura> buscarDetalle(@PathVariable Integer id) {
        return detalleFacturaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DetalleFactura> crearDetalle(@Valid @RequestBody DetalleFactura detalleFactura) {
        DetalleFactura nuevoDetalle = detalleFacturaRepository.save(detalleFactura);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoDetalle);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DetalleFactura> actualizarDetalle(
            @PathVariable Integer id,
            @Valid @RequestBody DetalleFactura datosDetalle) {

        return detalleFacturaRepository.findById(id)
                .map(detalle -> {
                    detalle.setFactura(datosDetalle.getFactura());
                    detalle.setServicio(datosDetalle.getServicio());
                    detalle.setNombre(datosDetalle.getNombre());
                    detalle.setCantidad(datosDetalle.getCantidad());
                    detalle.setValor(datosDetalle.getValor());
                    detalle.setSubtotal(datosDetalle.getSubtotal());

                    DetalleFactura actualizado = detalleFacturaRepository.save(detalle);
                    return ResponseEntity.ok(actualizado);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarDetalle(@PathVariable Integer id) {
        if (!detalleFacturaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        detalleFacturaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/factura/{idFactura}")
    public ResponseEntity<List<DetalleFactura>> listarPorFactura(@PathVariable Integer idFactura) {
        return ResponseEntity.ok(detalleFacturaRepository.findByFacturaIdFactura(idFactura));
    }

    @GetMapping("/servicio/{idservicio}")
    public ResponseEntity<List<DetalleFactura>> listarPorServicio(@PathVariable Integer idservicio) {
        return ResponseEntity.ok(detalleFacturaRepository.findByServicioIdServicio(idservicio));
    }
}