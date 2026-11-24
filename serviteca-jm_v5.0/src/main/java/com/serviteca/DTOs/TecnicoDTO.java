package com.serviteca.DTOs;

import com.serviteca.modelos.Usuario;

/**
 * Datos mínimos de un técnico para los selectores de asignación.
 * No incluye información sensible como la contraseña.
 */
public record TecnicoDTO(Integer idUsuario, String nombre, String correo) {

    public static TecnicoDTO from(Usuario usuario) {
        if (usuario == null) return null;
        return new TecnicoDTO(
                usuario.getIdUsuario(),
                usuario.getNombre(),
                usuario.getCorreo()
        );
    }
}
