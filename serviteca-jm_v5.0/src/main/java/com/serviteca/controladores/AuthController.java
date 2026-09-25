package com.serviteca.controladores;

import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.*;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final SecurityContextRepository securityContextRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {

        String correo = body.getOrDefault("correo", "").trim();
        String contrasena = body.getOrDefault("contrasena", "");

        // 1. Normalizar el rol recibido del frontend a MAYÚSCULAS
        String rolSeleccionado = body.get("rol") == null
                ? ""
                : body.get("rol").trim().toUpperCase();

        // 2. Validar campos obligatorios
        if (correo.isBlank() || contrasena.isBlank() || rolSeleccionado.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Correo, contraseña y rol son obligatorios."
            ));
        }

        // 3. Buscar el usuario en la BD
        Usuario u = usuarioRepository.findByCorreo(correo).orElse(null);

        // 4. Validar existencia del usuario y coincidencia de rol (normalizado)
        if (u == null || u.getRol() == null || !u.getRol().name().equals(rolSeleccionado)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "El correo no pertenece al rol seleccionado o credenciales inválidas."
            ));
        }

        // 5. Validar estado del usuario
        if (u.getEstado() == Usuario.Estado.INACTIVO) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "El usuario está inactivo."
            ));
        }

        try {
            // 6. Autenticar credenciales
            Authentication a = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(correo, contrasena)
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(a);
            SecurityContextHolder.setContext(context);

            // 7. Persistir la sesión HTTP
            HttpSession session = request.getSession(true);
            securityContextRepository.saveContext(context, request, response);

            u.setUltimoAcceso(LocalDateTime.now());
            usuarioRepository.save(u);

            return ResponseEntity.ok(Map.of(
                    "idUsuario", u.getIdUsuario(),
                    "nombre", u.getNombre(),
                    "correo", u.getCorreo(),
                    "rol", u.getRol().name(),
                    "tipoDocumento", u.getTipoDocumento() == null ? "" : u.getTipoDocumento(),
                    "estado", u.getEstado().name()
            ));

        } catch (AuthenticationException ex) {
            SecurityContextHolder.clearContext();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Correo, contraseña o rol incorrectos."
            ));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Sesión no iniciada."
            ));
        }

        return usuarioRepository.findByCorreo(authentication.getName())
                .map(u -> ResponseEntity.ok(Map.of(
                        "idUsuario", u.getIdUsuario(),
                        "nombre", u.getNombre(),
                        "correo", u.getCorreo(),
                        "rol", u.getRol().name(),
                        "tipoDocumento", u.getTipoDocumento() == null ? "" : u.getTipoDocumento(),
                        "estado", u.getEstado().name()
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "error", "Usuario no encontrado."
                )));
    }
}