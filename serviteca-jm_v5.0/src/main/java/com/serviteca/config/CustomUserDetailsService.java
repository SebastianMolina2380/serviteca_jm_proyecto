package com.serviteca.config;

import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(
            UsuarioRepository usuarioRepository) {

        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String correo)
            throws UsernameNotFoundException {

        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Usuario no encontrado con correo: " + correo
                        )
                );

        if (usuario.getRol() == null) {
            throw new UsernameNotFoundException(
                    "El usuario no tiene un rol asignado"
            );
        }

        String rolNombre = usuario.getRol().name();

        return User.builder()
                .username(usuario.getCorreo())
                .password(usuario.getContrasena())
                .roles(rolNombre)
                .disabled(
                        usuario.getEstado() == Usuario.Estado.INACTIVO
                )
                .build();
    }
}