package com.serviteca.config;

import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.EnvironmentAware;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Crea el primer administrador únicamente en producción y si la tabla usuario
 * está vacía. La contraseña llega por variable de entorno y se guarda con BCrypt.
 */
@Component
@Profile("prod")
public class InitialAdminBootstrap implements ApplicationRunner, EnvironmentAware {

    private static final Logger log = LoggerFactory.getLogger(InitialAdminBootstrap.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private Environment environment;

    public InitialAdminBootstrap(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() > 0) {
            return;
        }

        String nombre = required("INITIAL_ADMIN_NAME");
        String documento = required("INITIAL_ADMIN_DOCUMENT");
        String correo = required("INITIAL_ADMIN_EMAIL").toLowerCase(Locale.ROOT);
        String contrasena = required("INITIAL_ADMIN_PASSWORD");
        String tipoDocumento = environment.getProperty("INITIAL_ADMIN_DOCUMENT_TYPE", "CC").trim();

        if (!EMAIL_PATTERN.matcher(correo).matches() || correo.length() > 100) {
            throw new IllegalStateException("INITIAL_ADMIN_EMAIL debe ser un correo válido de máximo 100 caracteres.");
        }
        if (nombre.length() > 120 || documento.length() > 30 || tipoDocumento.isBlank() || tipoDocumento.length() > 30) {
            throw new IllegalStateException("Revisa la longitud del nombre, documento y tipo de documento del administrador inicial.");
        }
        if (contrasena.length() < 16) {
            throw new IllegalStateException("INITIAL_ADMIN_PASSWORD debe tener al menos 16 caracteres.");
        }
        if (usuarioRepository.existsByCorreo(correo) || usuarioRepository.existsByNumeroDoc(documento)) {
            throw new IllegalStateException("El correo o documento del administrador inicial ya está registrado.");
        }

        Usuario admin = new Usuario();
        admin.setNombre(nombre);
        admin.setNumeroDoc(documento);
        admin.setCorreo(correo);
        admin.setContrasena(passwordEncoder.encode(contrasena));
        admin.setRol(Usuario.Rol.ADMIN);
        admin.setTipoDocumento(tipoDocumento);
        admin.setEstado(Usuario.Estado.ACTIVO);
        usuarioRepository.saveAndFlush(admin);

        log.warn("Se creó el administrador inicial. Tras verificar el acceso por HTTPS, retira INITIAL_ADMIN_* del entorno.");
    }

    private String required(String key) {
        String value = environment.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Configura " + key + " en el entorno para iniciar una base de producción vacía.");
        }
        return value.trim();
    }
}
