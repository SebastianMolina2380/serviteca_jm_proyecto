package com.serviteca.integracion;

import com.serviteca.modelos.PasswordResetToken;
import com.serviteca.modelos.Usuario;
import com.serviteca.soporte.IntegracionBase;
import com.serviteca.soporte.PruebaIntegracion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Flujos públicos de Fase 2: formulario de contacto y recuperación de
 * contraseña con token de un solo uso.
 */
@PruebaIntegracion
class ContactoYRecuperacionIntegrationTest extends IntegracionBase {

    @Test
    @DisplayName("Un contacto válido se persiste aunque no haya SMTP")
    void contactoValidoSePersiste() throws Exception {
        String correo = "contacto." + UUID.randomUUID().toString().substring(0, 8) + "@test.local";

        mockMvc.perform(post("/api/contacto")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Cliente Prueba",
                                "correo", correo,
                                "telefono", "3001234567",
                                "mensaje", "Necesito una revisión general del vehículo."))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mensaje").exists());

        boolean persistido = mensajeContactoRepository.findAll().stream()
                .anyMatch(m -> correo.equals(m.getCorreo()));
        assertThat(persistido).isTrue();
    }

    @Test
    @DisplayName("Un contacto inválido responde 400 y no se guarda")
    void contactoInvalidoDevuelve400() throws Exception {
        long antes = mensajeContactoRepository.count();

        mockMvc.perform(post("/api/contacto")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "X",
                                "correo", "no-es-correo",
                                "mensaje", "corto"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertThat(mensajeContactoRepository.count()).isEqualTo(antes);
    }

    @Test
    @DisplayName("La solicitud de recuperación no revela si el correo existe")
    void solicitudNoRevelaCorreos() throws Exception {
        long antes = passwordResetTokenRepository.count();

        mockMvc.perform(post("/api/auth/password/forgot")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "correo", "desconocido." + UUID.randomUUID() + "@test.local"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").exists());

        assertThat(passwordResetTokenRepository.count()).isEqualTo(antes);
    }

    @Test
    @DisplayName("El token restablece la contraseña una sola vez")
    void tokenDeUnSoloUsoRestableceLaContrasena() throws Exception {
        String tokenPlano = "token-" + UUID.randomUUID();
        PasswordResetToken token = new PasswordResetToken();
        token.setUsuario(cliente);
        token.setTokenHash(sha256(tokenPlano));
        token.setExpiraEn(LocalDateTime.now().plusMinutes(10));
        token.setUsado(false);
        passwordResetTokenRepository.saveAndFlush(token);

        String nuevaContrasena = "Nueva-Clave-2026";

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", tokenPlano,
                                "contrasena", nuevaContrasena))))
                .andExpect(status().isOk());

        // La nueva contraseña funciona y la sesión se crea correctamente.
        iniciarSesion(cliente, nuevaContrasena);

        // El mismo token ya no puede reutilizarse.
        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", tokenPlano,
                                "contrasena", "Otra-Clave-2026"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("Una contraseña nueva demasiado corta se rechaza")
    void contrasenaCortaDevuelve400() throws Exception {
        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", "token-inventado",
                                "contrasena", "corta"))))
                .andExpect(status().isBadRequest());
    }

    private String sha256(String valor) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(digest.digest(valor.getBytes(StandardCharsets.UTF_8)));
    }
}
