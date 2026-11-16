package com.serviteca.controladores;

import com.serviteca.DTOs.TecnicoDTO;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Catálogo de técnicos activos para asignar citas.
 *
 * Devuelve solo id, nombre y correo. El personal lo usa en el portal y en
 * la agenda; el cliente únicamente lo consume para mostrar el selector,
 * ya que el backend ignora cualquier técnico enviado por un CLIENTE.
 */
@RestController
@RequestMapping("/api/tecnicos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TecnicoController {

    private final UsuarioRepository usuarioRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<List<TecnicoDTO>> listarActivos() {
        List<TecnicoDTO> tecnicos = usuarioRepository
                .findByRolAndEstadoOrderByNombreAsc(Usuario.Rol.TECNICO, Usuario.Estado.ACTIVO)
                .stream()
                .map(TecnicoDTO::from)
                .toList();
        return ResponseEntity.ok(tecnicos);
    }
}
