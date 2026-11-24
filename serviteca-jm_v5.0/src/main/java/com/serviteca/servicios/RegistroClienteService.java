package com.serviteca.servicios;

import com.serviteca.DTOs.RegistroClienteRequest;
import com.serviteca.modelos.Usuario;
import com.serviteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

/**
 * Registro público de clientes.
 *
 * El rol y el estado nunca llegan desde el formulario: se fuerzan aquí
 * para impedir que alguien se registre como ADMIN o TÉCNICO. El correo se
 * normaliza a minúsculas para que el login y la detección de duplicados
 * sean consistentes.
 */
@Service
@RequiredArgsConstructor
public class RegistroClienteService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Usuario registrar(RegistroClienteRequest request) {
        String correo = normalizarCorreo(request.getCorreo());
        String documento = textoObligatorio(request.getNumeroDoc(),
                "El número de documento es obligatorio");

        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe una cuenta registrada con ese correo.");
        }
        if (usuarioRepository.existsByNumeroDocIgnoreCase(documento)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe una cuenta registrada con ese número de documento.");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(textoObligatorio(request.getNombre(), "El nombre es obligatorio"));
        usuario.setNumeroDoc(documento);
        usuario.setCorreo(correo);
        usuario.setContrasena(passwordEncoder.encode(request.getContrasena()));
        usuario.setRol(Usuario.Rol.CLIENTE);
        usuario.setEstado(Usuario.Estado.ACTIVO);
        usuario.setTipoDocumento(valorOrDefecto(request.getTipoDocumento(), "CC"));
        usuario.setTelefono(textoOpcional(request.getTelefono()));
        usuario.setCiudad(textoOpcional(request.getCiudad()));
        usuario.setDireccion(textoOpcional(request.getDireccion()));

        try {
            return usuarioRepository.save(usuario);
        } catch (DataIntegrityViolationException ex) {
            // Carrera entre la comprobación y el INSERT: la restricción
            // única de la base de datos sigue protegiendo la integridad.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El correo o número de documento ya está registrado.");
        }
    }

    private String normalizarCorreo(String correo) {
        return textoObligatorio(correo, "El correo es obligatorio")
                .toLowerCase(Locale.ROOT);
    }

    private String textoObligatorio(String valor, String mensaje) {
        String limpio = textoOpcional(valor);
        if (limpio == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
        }
        return limpio;
    }

    private String textoOpcional(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim().replaceAll("\\s+", " ");
        return limpio.isEmpty() ? null : limpio;
    }

    private String valorOrDefecto(String valor, String defecto) {
        String limpio = textoOpcional(valor);
        return limpio == null ? defecto : limpio.toUpperCase(Locale.ROOT);
    }
}
