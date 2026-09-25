package com.serviteca.controladores;

import com.serviteca.modelos.Proveedor;
import com.serviteca.repository.ProveedorRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProveedorController {

    private final ProveedorRepository proveedorRepository;

    @GetMapping
    public ResponseEntity<List<Proveedor>> listarProveedores() {
        return ResponseEntity.ok(proveedorRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proveedor> buscarProveedor(@PathVariable Integer id) {
        return proveedorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> crearProveedor(@Valid @RequestBody Proveedor proveedor) {
        if (proveedorRepository.existsByNitProveedor(proveedor.getNitProveedor())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El NIT ya se encuentra registrado en el sistema.");
        }
        Proveedor nuevoProveedor = proveedorRepository.save(proveedor);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoProveedor);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> actualizarProveedor(
            @PathVariable Integer id,
            @Valid @RequestBody Proveedor datosProveedor) {

        if (proveedorRepository.existsByNitProveedorAndIdProveedorNot(datosProveedor.getNitProveedor(), id)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El NIT ya pertenece a otro proveedor registrado.");
        }

        return proveedorRepository.findById(id)
                .map(proveedor -> {
                    proveedor.setNombreProveedor(datosProveedor.getNombreProveedor());
                    proveedor.setNitProveedor(datosProveedor.getNitProveedor());
                    proveedor.setTipoProducto(datosProveedor.getTipoProducto());
                    proveedor.setCorreoProveedor(datosProveedor.getCorreoProveedor());

                    Proveedor actualizado = proveedorRepository.save(proveedor);
                    return ResponseEntity.ok(actualizado);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarProveedor(@PathVariable Integer id) {
        if (!proveedorRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        proveedorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}