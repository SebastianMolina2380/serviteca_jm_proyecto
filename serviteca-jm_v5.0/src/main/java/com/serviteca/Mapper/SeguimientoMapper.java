package com.serviteca.Mapper;

import com.serviteca.DTOs.SeguimientoDTOs;
import com.serviteca.modelos.Seguimiento;

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

        Long idUsuario = null;
        Long idServicio = null;

        // Usuario: Integer -> Long
        if (entity.getUsuario() != null
                && entity.getUsuario().getIdUsuario() != null) {

            idUsuario = entity.getUsuario().getIdUsuario().longValue();
        }

        // Servicio: Integer -> Long
        if (entity.getServicio() != null
                && entity.getServicio().getIdServicio() != null) {

            idServicio = entity.getServicio().getIdServicio().longValue();
        }

        return new SeguimientoDTOs(
                entity.getIdSeguimiento(),
                idUsuario,
                idServicio,
                entity.getTipo(),
                entity.getTitulo(),
                entity.getFlujo(),
                entity.getDescripcion(),
                entity.getEstado(),
                entity.getMensaje(),
                entity.getRemitente(),
                entity.getTiempoestimado(),
                entity.getLeida(),
                entity.getFecha()
        );
    }


    // =========================
    // DTO -> ENTITY
    // =========================
    public static Seguimiento toEntity(SeguimientoDTOs dto) {

        if (dto == null) {
            return null;
        }

        Seguimiento entity = new Seguimiento();

        entity.setIdSeguimiento(dto.getIdSeguimiento());

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