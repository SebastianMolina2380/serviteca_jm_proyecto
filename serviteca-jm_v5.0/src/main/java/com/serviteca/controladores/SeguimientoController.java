package com.serviteca.controladores;

import com.serviteca.DTOs.SeguimientoDTOs;
import com.serviteca.modelos.Seguimiento;
import com.serviteca.modelos.Servicio;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.SeguimientoRepository;
import com.serviteca.repository.ServicioRepository;
import com.serviteca.repository.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * API de seguimiento.
 *
 * Módulo operativo reservado a ADMIN y TÉCNICO: antes permitía a cualquier
 * usuario autenticado leer, crear, modificar y borrar seguimientos de otros.
 * Las respuestas usan SeguimientoDTOs para no exponer entidades completas.
 */
@RestController
@RequestMapping("/api/seguimientos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
public class SeguimientoController {

    private final SeguimientoRepository seguimientoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicioRepository servicioRepository;

    @GetMapping
    public ResponseEntity<List<SeguimientoDTOs>> obtenerTodos() {
        return ResponseEntity.ok(seguimientoRepository.findAll().stream()
                .map(this::toDTO)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeguimientoDTOs> obtenerPorId(@PathVariable Long id) {
        return seguimientoRepository.findById(id)
                .map(s -> ResponseEntity.ok(toDTO(s)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<SeguimientoDTOs>> obtenerPorUsuario(@PathVariable Integer idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(seguimientoRepository.findByUsuario_IdUsuario(idUsuario).stream()
                .map(this::toDTO)
                .toList());
    }

    @GetMapping("/servicio/{idServicio}")
    public ResponseEntity<List<SeguimientoDTOs>> obtenerPorServicio(@PathVariable Integer idServicio) {
        if (!servicioRepository.existsById(idServicio)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(seguimientoRepository.findByServicio_IdServicio(idServicio).stream()
                .map(this::toDTO)
                .toList());
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<SeguimientoDTOs>> obtenerPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(seguimientoRepository.findByEstado(estado).stream()
                .map(this::toDTO)
                .toList());
    }

    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<SeguimientoDTOs>> obtenerPorTipo(@PathVariable String tipo) {
        return ResponseEntity.ok(seguimientoRepository.findByTipo(tipo).stream()
                .map(this::toDTO)
                .toList());
    }

    @PostMapping
    public ResponseEntity<SeguimientoDTOs> crear(@Valid @RequestBody SeguimientoDTOs dto) {
        Seguimiento nuevo = new Seguimiento();
        aplicarDatos(nuevo, dto);
        Seguimiento guardado = seguimientoRepository.save(nuevo);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(guardado));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SeguimientoDTOs> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody SeguimientoDTOs dto) {

        return seguimientoRepository.findById(id)
                .map(seguimiento -> {
                    aplicarDatos(seguimiento, dto);
                    return ResponseEntity.ok(toDTO(seguimientoRepository.save(seguimiento)));
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

    private void aplicarDatos(Seguimiento seguimiento, SeguimientoDTOs dto) {
        Usuario usuario = usuarioRepository.findById(dto.getIdusuario())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado."));

        Servicio servicio = null;
        if (dto.getIdservicio() != null) {
            servicio = servicioRepository.findById(dto.getIdservicio())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Servicio no encontrado."));
        }

        seguimiento.setUsuario(usuario);
        seguimiento.setServicio(servicio);
        seguimiento.setTipo(dto.getTipo());
        seguimiento.setTitulo(dto.getTitulo());
        seguimiento.setFlujo(dto.getFlujo());
        seguimiento.setDescripcion(dto.getDescripcion());
        seguimiento.setEstado(dto.getEstado());
        seguimiento.setMensaje(dto.getMensaje());
        seguimiento.setRemitente(dto.getRemitente());
        seguimiento.setTiempoestimado(dto.getTiempoestimado());
        if (dto.getLeida() != null) {
            seguimiento.setLeida(dto.getLeida());
        }
        if (dto.getFecha() != null) {
            seguimiento.setFecha(dto.getFecha());
        }
    }

    private SeguimientoDTOs toDTO(Seguimiento seguimiento) {
        SeguimientoDTOs dto = new SeguimientoDTOs();
        dto.setIdseguimiento(seguimiento.getIdSeguimiento());
        dto.setIdusuario(seguimiento.getUsuario() != null
                ? seguimiento.getUsuario().getIdUsuario() : null);
        dto.setIdservicio(seguimiento.getServicio() != null
                ? seguimiento.getServicio().getIdServicio() : null);
        dto.setTipo(seguimiento.getTipo());
        dto.setTitulo(seguimiento.getTitulo());
        dto.setFlujo(seguimiento.getFlujo());
        dto.setDescripcion(seguimiento.getDescripcion());
        dto.setEstado(seguimiento.getEstado());
        dto.setMensaje(seguimiento.getMensaje());
        dto.setRemitente(seguimiento.getRemitente());
        dto.setTiempoestimado(seguimiento.getTiempoestimado());
        dto.setLeida(seguimiento.getLeida());
        dto.setFecha(seguimiento.getFecha());
        return dto;
    }
}
