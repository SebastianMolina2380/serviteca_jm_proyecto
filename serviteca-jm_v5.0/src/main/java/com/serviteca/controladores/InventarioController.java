package com.serviteca.controladores;

import com.serviteca.modelos.Inventario;
import com.serviteca.repository.InventarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/inventarios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
public class InventarioController {

    private final InventarioRepository inventarioRepository;

    @GetMapping
    public ResponseEntity<List<Inventario>> listarTodos() {
        return ResponseEntity.ok(inventarioRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inventario> obtenerPorId(@PathVariable Integer id) {
        return inventarioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Inventario> crear(@Valid @RequestBody Inventario inventario) {
        Inventario nuevo = inventarioRepository.save(inventario);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Inventario> actualizar(@PathVariable Integer id, @Valid @RequestBody Inventario datos) {
        return inventarioRepository.findById(id)
                .map(i -> {
                    i.setNombre(datos.getNombre());
                    i.setCantidad(datos.getCantidad());
                    i.setPrecioUnit(datos.getPrecioUnit());
                    i.setProducto(datos.getProducto());
                    return ResponseEntity.ok(inventarioRepository.save(i));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        if (!inventarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        inventarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}