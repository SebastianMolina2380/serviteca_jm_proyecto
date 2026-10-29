package com.serviteca.controladores;

import com.serviteca.modelos.Producto;
import com.serviteca.repository.ProductoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
public class ProductoController {

    private final ProductoRepository productoRepository;

    @GetMapping
    public ResponseEntity<Page<Producto>> getAllProductos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        Page<Producto> productos = productoRepository.buscarPaginado(
                patronBusqueda(q),
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.ASC, "nombreProducto")));
        return ResponseEntity.ok(productos);
    }

    /** Catálogo completo para selects (inventario, facturación). */
    @GetMapping("/catalogo")
    public ResponseEntity<List<Producto>> catalogo() {
        return ResponseEntity.ok(productoRepository.findAllByOrderByNombreProductoAsc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> getProductoById(@PathVariable Integer id) {
        return productoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Producto> createProducto(@Valid @RequestBody Producto producto) {
        Producto savedProducto = productoRepository.save(producto);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProducto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Producto> updateProducto(@PathVariable Integer id, @Valid @RequestBody Producto productoDetails) {
        return productoRepository.findById(id).map(producto -> {
            producto.setNombreProducto(productoDetails.getNombreProducto());
            producto.setPrecioProducto(productoDetails.getPrecioProducto());
            producto.setDescripcionProducto(productoDetails.getDescripcionProducto());
            producto.setServicio(productoDetails.getServicio());
            producto.setProveedor(productoDetails.getProveedor());
            return ResponseEntity.ok(productoRepository.save(producto));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProducto(@PathVariable Integer id) {
        if (!productoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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
        return "%" + limpio.toLowerCase(java.util.Locale.ROOT) + "%";
    }
}
