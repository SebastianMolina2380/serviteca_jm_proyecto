package com.serviteca.controladores;

import com.serviteca.modelos.Usuario;
import com.serviteca.repository.CitaRepository;
import com.serviteca.repository.FacturaRepository;
import com.serviteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final CitaRepository citaRepository;
    private final FacturaRepository facturaRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/api/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> dashboard() {
        LocalDate hoy = LocalDate.now();
        LocalDate primerDia = hoy.withDayOfMonth(1);
        return ResponseEntity.ok(Map.of(
                "citas", citaRepository.count(),
                "usuarios", usuarioRepository.findByRol(Usuario.Rol.TECNICO).size(),
                "ingresosMes", facturaRepository.totalFacturadoEnPeriodo(primerDia, hoy),
                "facturas", facturaRepository.count()
        ));
    }
}
