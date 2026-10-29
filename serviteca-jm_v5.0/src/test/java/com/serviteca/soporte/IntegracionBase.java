package com.serviteca.soporte;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.MensajeContactoRepository;
import com.serviteca.repository.PasswordResetTokenRepository;
import com.serviteca.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Utilidades compartidas por las pruebas de integración: creación de
 * usuarios con datos únicos (la base de pruebas puede reutilizarse) e
 * inicio de sesión real contra /api/auth/login.
 */
public abstract class IntegracionBase {

    protected static final String PASSWORD = "Clave-Segura-2026";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UsuarioRepository usuarioRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected MensajeContactoRepository mensajeContactoRepository;

    @Autowired
    protected PasswordResetTokenRepository passwordResetTokenRepository;

    protected Usuario admin;
    protected Usuario tecnico;
    protected Usuario cliente;

    @BeforeEach
    void prepararUsuarios() {
        admin = crearUsuario(Usuario.Rol.ADMIN);
        tecnico = crearUsuario(Usuario.Rol.TECNICO);
        cliente = crearUsuario(Usuario.Rol.CLIENTE);
    }

    protected Usuario crearUsuario(Usuario.Rol rol) {
        String sufijo = UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        Usuario usuario = new Usuario();
        usuario.setNombre("Usuario " + rol + " " + sufijo);
        usuario.setNumeroDoc("T" + sufijo);
        usuario.setCorreo(rol.name().toLowerCase() + "." + sufijo + "@test.local");
        usuario.setContrasena(passwordEncoder.encode(PASSWORD));
        usuario.setRol(rol);
        usuario.setTipoDocumento("CC");
        usuario.setEstado(Usuario.Estado.ACTIVO);

        return usuarioRepository.saveAndFlush(usuario);
    }

    protected MockHttpSession iniciarSesion(Usuario usuario) throws Exception {
        return iniciarSesion(usuario, PASSWORD);
    }

    protected MockHttpSession iniciarSesion(Usuario usuario, String contrasena) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "correo", usuario.getCorreo(),
                                "contrasena", contrasena,
                                "rol", usuario.getRol().name()))))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession sesion = (MockHttpSession) resultado.getRequest().getSession(false);
        assertNotNull(sesion, "El login debe crear una sesión HTTP");
        return sesion;
    }
}
