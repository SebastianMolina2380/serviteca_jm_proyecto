package com.serviteca.integracion;

import com.serviteca.soporte.IntegracionBase;
import com.serviteca.soporte.PruebaIntegracion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Seguridad de la API: autenticación por sesión, autorización por rol,
 * rutas públicas de monitoreo y documentación.
 */
@PruebaIntegracion
class SeguridadIntegrationTest extends IntegracionBase {

    @Test
    @DisplayName("Sin sesión, la API responde 401 en JSON")
    void sinSesionDevuelve401() throws Exception {
        mockMvc.perform(get("/api/vehiculos"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Credenciales incorrectas no crean sesión")
    void credencialesInvalidasDevuelven401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "correo", "nadie." + System.nanoTime() + "@test.local",
                                "contrasena", "incorrecta-123",
                                "rol", "CLIENTE"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("El rol enviado debe coincidir con el de la cuenta")
    void rolIncorrectoDevuelve401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "correo", admin.getCorreo(),
                                "contrasena", PASSWORD,
                                "rol", "CLIENTE"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("ADMIN accede a reportes y a /api/auth/me")
    void adminAccedeASusRecursos() throws Exception {
        var sesion = iniciarSesion(admin);

        mockMvc.perform(get("/api/reportes").session(sesion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.desde").exists());

        mockMvc.perform(get("/api/auth/me").session(sesion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correo").value(admin.getCorreo()))
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    @Test
    @DisplayName("CLIENTE recibe 403 en un recurso exclusivo de ADMIN/TÉCNICO")
    void clienteNoAccedeAReportes() throws Exception {
        var sesion = iniciarSesion(cliente);

        mockMvc.perform(get("/api/reportes").session(sesion))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("TÉCNICO puede consultar reportes")
    void tecnicoAccedeAReportes() throws Exception {
        mockMvc.perform(get("/api/reportes").session(iniciarSesion(tecnico)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("/actuator/health es público y reporta UP")
    void healthEsPublico() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("El contrato OpenAPI está disponible en el perfil de pruebas")
    void openApiDisponible() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Serviteca JM API"))
                .andExpect(jsonPath("$.paths").exists());
    }

    @Test
    @DisplayName("Swagger UI redirige a su índice")
    void swaggerUiDisponible() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());
    }
}
