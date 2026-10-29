package com.serviteca.controladores;

import com.serviteca.servicios.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/password")
@RequiredArgsConstructor
public class PasswordResetController {

    private static final String RESPUESTA_GENERICA =
            "Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos.";

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot")
    public ResponseEntity<?> solicitar(@RequestBody(required = false) Map<String, String> body) {
        String correo = body == null ? "" : body.getOrDefault("correo",
                body.getOrDefault("email", ""));
        if (correo.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Ingresa tu correo electrónico."));
        }
        passwordResetService.solicitar(correo);
        return ResponseEntity.ok(Map.of("mensaje", RESPUESTA_GENERICA));
    }

    @PostMapping("/reset")
    public ResponseEntity<?> restablecer(@RequestBody(required = false) Map<String, String> body) {
        if (body == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solicitud inválida."));
        }
        String token = body.getOrDefault("token", "");
        String contrasena = body.getOrDefault("contrasena",
                body.getOrDefault("password", ""));
        passwordResetService.restablecer(token, contrasena);
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada. Ya puedes iniciar sesión."));
    }
}
