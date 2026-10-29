package com.serviteca.Mapper;

import com.serviteca.DTOs.SeguimientoDTOs;
import com.serviteca.modelos.Seguimiento;
import com.serviteca.modelos.Servicio;
import com.serviteca.modelos.Usuario;

public final class SeguimientoMapper {

    private SeguimientoMapper() {
    }

    // =========================
    // ENTITY -> DTO
    // =========================
    public static SeguimientoDTOs toDTO(Seguimiento entity) {

        if (entity == null) {
            return null;
        }

        SeguimientoDTOs dto = new SeguimientoDTOs();

        dto.setIdseguimiento(entity.getIdSeguimiento());
        dto.setIdusuario(entity.getUsuario() != null
                ? entity.getUsuario().getIdUsuario() : null);
        dto.setIdservicio(entity.getServicio() != null
                ? entity.getServicio().getIdServicio() : null);
        dto.setTipo(entity.getTipo());
        dto.setTitulo(entity.getTitulo());
        dto.setFlujo(entity.getFlujo());
        dto.setDescripcion(entity.getDescripcion());
        dto.setEstado(entity.getEstado());
        dto.setMensaje(entity.getMensaje());
        dto.setRemitente(entity.getRemitente());
        dto.setTiempoestimado(entity.getTiempoestimado());
        dto.setLeida(entity.getLeida());
        dto.setFecha(entity.getFecha());

        return dto;
    }

    // =========================
    // DTO -> ENTITY
    // =========================
    /**
     * Convierte solo los campos escalares. Las asociaciones Usuario y
     * Servicio deben resolverse con sus repositorios; para eso existe la
     * sobrecarga {@link #toEntity(SeguimientoDTOs, Usuario, Servicio)}.
     */
    public static Seguimiento toEntity(SeguimientoDTOs dto) {
        return toEntity(dto, null, null);
    }

    public static Seguimiento toEntity(SeguimientoDTOs dto, Usuario usuario, Servicio servicio) {

        if (dto == null) {
            return null;
        }

        Seguimiento entity = new Seguimiento();

        entity.setIdSeguimiento(dto.getIdseguimiento());
        entity.setUsuario(usuario);
        entity.setServicio(servicio);
        entity.setTipo(dto.getTipo());
        entity.setTitulo(dto.getTitulo());
        entity.setFlujo(dto.getFlujo());
        entity.setDescripcion(dto.getDescripcion());
        entity.setEstado(dto.getEstado());
        entity.setMensaje(dto.getMensaje());
        entity.setRemitente(dto.getRemitente());
        entity.setTiempoestimado(dto.getTiempoestimado());
        entity.setLeida(dto.getLeida());
        entity.setFecha(dto.getFecha());

        return entity;
    }
}
