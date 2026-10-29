package com.serviteca.servicios;

import com.serviteca.modelos.PasswordResetToken;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.PasswordResetTokenRepository;
import com.serviteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Recuperación de contraseña con token de un solo uso.
 *
 * El token real solo viaja por correo; en base de datos queda su hash
 * SHA-256. La respuesta al usuario es siempre genérica para no revelar si
 * un correo está registrado.
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long ESPERA_REENVIO_SEGUNDOS = 60;

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${serviteca.app.url-base:http://localhost:8082}")
    private String urlBase;

    @Value("${serviteca.password-reset.minutos:30}")
    private long minutosExpiracion;

    @Transactional
    public void solicitar(String correo) {
        String email = correo == null ? "" : correo.trim();
        if (email.isBlank()) {
            return;
        }

        Usuario usuario = usuarioRepository.findByCorreo(email).orElse(null);
        if (usuario == null || usuario.getEstado() == Usuario.Estado.INACTIVO) {
            log.info("Solicitud de recuperación para correo no registrado o inactivo: {}", email);
            return;
        }

        LocalDateTime ahora = LocalDateTime.now();
        Optional<PasswordResetToken> ultimo =
                tokenRepository.findTopByUsuarioIdUsuarioOrderByCreadoEnDesc(usuario.getIdUsuario());
        if (ultimo.isPresent() && ultimo.get().getCreadoEn() != null
                && ultimo.get().getCreadoEn().isAfter(ahora.minusSeconds(ESPERA_REENVIO_SEGUNDOS))) {
            return;
        }

        tokenRepository.invalidarTokensActivos(usuario.getIdUsuario());
        tokenRepository.limpiarTokensAntiguos(ahora.minusDays(1));

        String tokenPlano = generarToken();
        PasswordResetToken token = new PasswordResetToken();
        token.setUsuario(usuario);
        token.setTokenHash(hash(tokenPlano));
        token.setExpiraEn(ahora.plusMinutes(Math.max(5, minutosExpiracion)));
        token.setUsado(false);
        tokenRepository.save(token);

        String enlace = quitarBarraFinal(urlBase) + "/recuperar.html?token="
                + URLEncoder.encode(tokenPlano, StandardCharsets.UTF_8);
        String cuerpo = """
                Hola %s,

                Recibimos una solicitud para restablecer la contraseña de tu cuenta en Serviteca JM.

                Abre este enlace (válido por %d minutos y de un solo uso):
                %s

                Si no solicitaste el cambio, ignora este mensaje: tu contraseña actual sigue vigente.
                """.formatted(usuario.getNombre(), Math.max(5, minutosExpiracion), enlace);

        emailService.enviar(usuario.getCorreo(),
                "Recuperación de contraseña · Serviteca JM", cuerpo);
    }

    @Transactional
    public void restablecer(String tokenPlano, String nuevaContrasena) {
        if (tokenPlano == null || tokenPlano.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El enlace de recuperación no es válido.");
        }
        if (nuevaContrasena == null || nuevaContrasena.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La nueva contraseña debe tener al menos 8 caracteres.");
        }

        PasswordResetToken token = tokenRepository
                .findByTokenHashAndUsadoFalse(hash(tokenPlano.trim()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El enlace no es válido o ya fue utilizado. Solicita uno nuevo."));

        if (token.getExpiraEn().isBefore(LocalDateTime.now())) {
            token.setUsado(true);
            tokenRepository.save(token);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El enlace expiró. Solicita uno nuevo.");
        }

        Usuario usuario = token.getUsuario();
        if (usuario == null || usuario.getEstado() == Usuario.Estado.INACTIVO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La cuenta no está disponible. Contacta a la serviteca.");
        }

        usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
        usuarioRepository.save(usuario);

        token.setUsado(true);
        tokenRepository.save(token);
        tokenRepository.invalidarTokensActivos(usuario.getIdUsuario());
    }

    private String generarToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String valor) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(valor.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo procesar el token de recuperación.", e);
        }
    }

    private String quitarBarraFinal(String url) {
        if (url == null || url.isBlank()) return "http://localhost:8082";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
