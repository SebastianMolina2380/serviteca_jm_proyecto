package com.serviteca.config;

import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Bootstrap del administrador inicial: solo actúa con la tabla vacía,
 * exige las variables de entorno y guarda la contraseña con BCrypt.
 */
class InitialAdminBootstrapTest {

    private static final String CORREO = "admin@servitecajm.com";
    private static final String PASSWORD = "Clave-Inicial-2026";
    private static final String HASH = "$2a$10$hash-de-prueba";

    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);

    @Test
    @DisplayName("Crea el ADMIN cuando la base está vacía")
    void creaAdministradorEnBaseVacia() {
        when(usuarioRepository.count()).thenReturn(0L);
        when(usuarioRepository.existsByCorreo(CORREO)).thenReturn(false);
        when(usuarioRepository.existsByNumeroDoc("1000000001")).thenReturn(false);
        when(passwordEncoder.encode(PASSWORD)).thenReturn(HASH);

        InitialAdminBootstrap bootstrap = bootstrapCon(
                "INITIAL_ADMIN_NAME", "Administrador Serviteca",
                "INITIAL_ADMIN_DOCUMENT", "1000000001",
                "INITIAL_ADMIN_EMAIL", CORREO,
                "INITIAL_ADMIN_PASSWORD", PASSWORD);

        bootstrap.run(new DefaultApplicationArguments(new String[]{}));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).saveAndFlush(captor.capture());

        Usuario creado = captor.getValue();
        assertThat(creado.getRol()).isEqualTo(Usuario.Rol.ADMIN);
        assertThat(creado.getEstado()).isEqualTo(Usuario.Estado.ACTIVO);
        assertThat(creado.getCorreo()).isEqualTo(CORREO);
        assertThat(creado.getContrasena()).isEqualTo(HASH);
        assertThat(creado.getTipoDocumento()).isEqualTo("CC");
    }

    @Test
    @DisplayName("No toca la base si ya existen usuarios")
    void noHaceNadaSiYaHayUsuarios() {
        when(usuarioRepository.count()).thenReturn(3L);

        InitialAdminBootstrap bootstrap = bootstrapCon();

        bootstrap.run(new DefaultApplicationArguments(new String[]{}));

        verify(usuarioRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Falla de forma explícita si falta una variable obligatoria")
    void exigeVariablesDeEntorno() {
        when(usuarioRepository.count()).thenReturn(0L);

        InitialAdminBootstrap bootstrap = bootstrapCon(
                "INITIAL_ADMIN_NAME", "Administrador Serviteca");

        assertThatThrownBy(() -> bootstrap.run(new DefaultApplicationArguments(new String[]{})))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("INITIAL_ADMIN_DOCUMENT");
    }

    @Test
    @DisplayName("Rechaza contraseñas iniciales de menos de 16 caracteres")
    void exigeContrasenaLarga() {
        when(usuarioRepository.count()).thenReturn(0L);

        InitialAdminBootstrap bootstrap = bootstrapCon(
                "INITIAL_ADMIN_NAME", "Administrador Serviteca",
                "INITIAL_ADMIN_DOCUMENT", "1000000001",
                "INITIAL_ADMIN_EMAIL", CORREO,
                "INITIAL_ADMIN_PASSWORD", "corta");

        assertThatThrownBy(() -> bootstrap.run(new DefaultApplicationArguments(new String[]{})))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("16");
    }

    private InitialAdminBootstrap bootstrapCon(String... paresClaveValor) {
        MockEnvironment environment = new MockEnvironment();
        for (int i = 0; i + 1 < paresClaveValor.length; i += 2) {
            environment.withProperty(paresClaveValor[i], paresClaveValor[i + 1]);
        }

        InitialAdminBootstrap bootstrap =
                new InitialAdminBootstrap(usuarioRepository, passwordEncoder);
        bootstrap.setEnvironment(environment);
        return bootstrap;
    }
}
