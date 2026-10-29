package com.serviteca.controladores;

import com.serviteca.DTOs.VehiculoDTOs;
import com.serviteca.servicios.VehiculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API REST del módulo Vehículos.
 *
 * GET    /api/vehiculos       -> listado según el rol autenticado
 * GET    /api/vehiculos/{id}  -> vehículo por ID
 * POST   /api/vehiculos       -> registra un vehículo
 * PUT    /api/vehiculos/{id}  -> actualiza un vehículo existente
 * DELETE /api/vehiculos/{id}  -> elimina el vehículo si el rol tiene acceso
 *
 * El CLIENTE solo puede operar sobre sus propios vehículos; ADMIN y TÉCNICO
 * pueden indicar el propietario mediante el campo idusuario.
 */
@RestController
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VehiculoApiController {

    private final VehiculoService vehiculoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'CLIENTE')")
    public ResponseEntity<List<VehiculoDTOs>> listar(Authentication authentication) {
        return ResponseEntity.ok(vehiculoService.listarVehiculos(authentication));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'CLIENTE')")
    public ResponseEntity<VehiculoDTOs> obtenerPorId(
            @PathVariable Integer id,
            Authentication authentication) {
        return ResponseEntity.ok(vehiculoService.buscarPorId(id, authentication));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'CLIENTE')")
    public ResponseEntity<VehiculoDTOs> crear(
            @Valid @RequestBody VehiculoDTOs dto,
            Authentication authentication) {
        VehiculoDTOs creado = vehiculoService.crearVehiculo(dto, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'CLIENTE')")
    public ResponseEntity<VehiculoDTOs> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody VehiculoDTOs dto,
            Authentication authentication) {
        return ResponseEntity.ok(vehiculoService.actualizarVehiculo(id, dto, authentication));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'CLIENTE')")
    public ResponseEntity<Void> eliminar(
            @PathVariable Integer id,
            Authentication authentication) {
        vehiculoService.eliminarVehiculo(id, authentication);
        return ResponseEntity.noContent().build();
    }
}
