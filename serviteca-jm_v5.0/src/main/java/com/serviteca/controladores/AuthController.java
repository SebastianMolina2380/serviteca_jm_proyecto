package com.serviteca.controladores;

import com.serviteca.config.LoginRateLimiter;
import com.serviteca.config.RegistroRateLimiter;
import com.serviteca.DTOs.RegistroClienteRequest;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import com.serviteca.servicios.RegistroClienteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Set<String> ROLES_VALIDOS = Set.of("ADMIN", "TECNICO", "CLIENTE");
    private static final String CREDENCIALES_INVALIDAS =
            "Correo, contraseña o rol incorrectos.";

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final SecurityContextRepository securityContextRepository;
    private final LoginRateLimiter loginRateLimiter;
    private final RegistroClienteService registroClienteService;
    private final RegistroRateLimiter registroRateLimiter;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {

        String correo = body.getOrDefault("correo", "").trim().toLowerCase(Locale.ROOT);
        String contrasena = body.getOrDefault("contrasena", "");
        String rolSeleccionado = body.get("rol") == null
                ? ""
                : body.get("rol").trim().toUpperCase(Locale.ROOT);

        if (correo.isBlank() || contrasena.isBlank() || rolSeleccionado.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Correo, contraseña y rol son obligatorios."
            ));
        }

        if (!ROLES_VALIDOS.contains(rolSeleccionado)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "El rol indicado no es válido."
            ));
        }

        String ip = request.getRemoteAddr();
        long bloqueoSegundos = loginRateLimiter.remainingBlockSeconds(ip, correo);
        if (bloqueoSegundos > 0) {
            SecurityContextHolder.clearContext();
            long minutos = Math.max(1, (bloqueoSegundos + 59) / 60);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, Long.toString(bloqueoSegundos))
                    .body(Map.of(
                            "error", "Demasiados intentos fallidos. Intente de nuevo en "
                                    + minutos + " minuto(s)."
                    ));
        }

        try {
            // Se validan primero las credenciales. El rol se comprueba después
            // para no revelar si el correo existe o a qué rol pertenece.
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(correo, contrasena)
            );

            Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo).orElse(null);
            if (usuario == null
                    || usuario.getRol() == null
                    || !usuario.getRol().name().equals(rolSeleccionado)
                    || usuario.getEstado() == Usuario.Estado.INACTIVO) {
                loginRateLimiter.registerFailure(ip, correo);
                SecurityContextHolder.clearContext();
                return credencialesInvalidas();
            }

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            // Rotación del ID de sesión para impedir session fixation.
            HttpSession session = request.getSession(false);
            if (session != null) {
                request.changeSessionId();
            } else {
                request.getSession(true);
            }

            securityContextRepository.saveContext(context, request, response);

            usuario.setUltimoAcceso(LocalDateTime.now());
            usuarioRepository.save(usuario);
            loginRateLimiter.registerSuccess(ip, correo);

            return ResponseEntity.ok(Map.of(
                    "idUsuario", usuario.getIdUsuario(),
                    "nombre", usuario.getNombre(),
                    "correo", usuario.getCorreo(),
                    "rol", usuario.getRol().name(),
                    "tipoDocumento", usuario.getTipoDocumento() == null ? "" : usuario.getTipoDocumento(),
                    "estado", usuario.getEstado().name()
            ));

        } catch (AuthenticationException ex) {
            loginRateLimiter.registerFailure(ip, correo);
            SecurityContextHolder.clearContext();
            return credencialesInvalidas();
        }
    }

    /**
     * Registro público de clientes. No crea sesión: el usuario podrá
     * iniciar sesión inmediatamente después con el mismo correo.
     */
    @PostMapping("/registro")
    public ResponseEntity<?> registro(@Valid @RequestBody RegistroClienteRequest body,
                                      HttpServletRequest request) {

        String ip = request.getRemoteAddr();
        long esperaSegundos = registroRateLimiter.tryConsume(ip);
        if (esperaSegundos > 0) {
            long minutos = Math.max(1, (esperaSegundos + 59) / 60);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, Long.toString(esperaSegundos))
                    .body(Map.of(
                            "error", "Demasiados registros desde esta conexión. Intente de nuevo en "
                                    + minutos + " minuto(s)."
                    ));
        }

        Usuario usuario = registroClienteService.registrar(body);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "idUsuario", usuario.getIdUsuario(),
                "nombre", usuario.getNombre(),
                "correo", usuario.getCorreo(),
                "rol", usuario.getRol().name(),
                "estado", usuario.getEstado().name()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication, HttpServletRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Sesión no iniciada."
            ));
        }

        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(authentication.getName()).orElse(null);
        if (usuario == null || usuario.getEstado() == Usuario.Estado.INACTIVO) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            SecurityContextHolder.clearContext();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Sesión no válida."
            ));
        }

        return ResponseEntity.ok(Map.of(
                "idUsuario", usuario.getIdUsuario(),
                "nombre", usuario.getNombre(),
                "correo", usuario.getCorreo(),
                "rol", usuario.getRol().name(),
                "tipoDocumento", usuario.getTipoDocumento() == null ? "" : usuario.getTipoDocumento(),
                "estado", usuario.getEstado().name()
        ));
    }

    private ResponseEntity<Map<String, String>> credencialesInvalidas() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", CREDENCIALES_INVALIDAS));
    }
}
