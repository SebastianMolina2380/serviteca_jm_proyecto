package com.serviteca.controladores;

import com.serviteca.modelos.Seguimiento;
import com.serviteca.repository.SeguimientoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/seguimientos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SeguimientoController {

    private final SeguimientoRepository seguimientoRepository;

    @GetMapping
    public ResponseEntity<List<Seguimiento>> obtenerTodos() {
        return ResponseEntity.ok(seguimientoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Seguimiento> obtenerPorId(@PathVariable Long id) {
        return seguimientoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Seguimiento>> obtenerPorUsuario(@PathVariable Integer idUsuario) {
        return ResponseEntity.ok(seguimientoRepository.findByUsuario_IdUsuario(idUsuario));
    }

    @GetMapping("/servicio/{idServicio}")
    public ResponseEntity<List<Seguimiento>> obtenerPorServicio(@PathVariable Integer idServicio) {
        return ResponseEntity.ok(seguimientoRepository.findByServicio_IdServicio(idServicio));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Seguimiento>> obtenerPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(seguimientoRepository.findByEstado(estado));
    }

    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<Seguimiento>> obtenerPorTipo(@PathVariable String tipo) {
        return ResponseEntity.ok(seguimientoRepository.findByTipo(tipo));
    }

    @PostMapping
    public ResponseEntity<Seguimiento> crear(@Valid @RequestBody Seguimiento seguimiento) {
        Seguimiento nuevo = seguimientoRepository.save(seguimiento);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Seguimiento> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody Seguimiento datos) {

        return seguimientoRepository.findById(id)
                .map(seguimiento -> {
                    seguimiento.setUsuario(datos.getUsuario());
                    seguimiento.setServicio(datos.getServicio());
                    seguimiento.setTipo(datos.getTipo());
                    seguimiento.setTitulo(datos.getTitulo());
                    seguimiento.setFlujo(datos.getFlujo());
                    seguimiento.setDescripcion(datos.getDescripcion());
                    seguimiento.setEstado(datos.getEstado());
                    seguimiento.setMensaje(datos.getMensaje());
                    seguimiento.setRemitente(datos.getRemitente());
                    seguimiento.setTiempoestimado(datos.getTiempoestimado());
                    seguimiento.setLeida(datos.getLeida());
                    seguimiento.setFecha(datos.getFecha());

                    Seguimiento actualizado = seguimientoRepository.save(seguimiento);
                    return ResponseEntity.ok(actualizado);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!seguimientoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        seguimientoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}