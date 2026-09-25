package com.serviteca.Mapper;

import com.serviteca.DTOs.CitaDTOs;
import com.serviteca.modelos.Cita;

public class CitaMapper {

    public static CitaDTOs toDTO(Cita entity) {
        if (entity == null) return null;

        Long idCita = entity.getIdCita() != null ? entity.getIdCita().longValue() : null;

        Long idUsuario = null;
        if (entity.getVehiculo() != null
                && entity.getVehiculo().getUsuario() != null
                && entity.getVehiculo().getUsuario().getIdUsuario() != null) {
            idUsuario = entity.getVehiculo().getUsuario().getIdUsuario().longValue();
        }

        return new CitaDTOs(
                idCita,
                entity.getFecha(),
                entity.getHora(),
                idUsuario,
                entity.getEstado() != null ? entity.getEstado().name() : null
        );
    }

    public static Cita toEntity(CitaDTOs dto) {
        if (dto == null) return null;

        Cita entity = new Cita();

        if (dto.getIdCita() != null) {
            entity.setIdCita(dto.getIdCita().intValue());
        }
        entity.setFecha(dto.getFecha());
        entity.setHora(dto.getHora());

        if (dto.getEstado() != null && !dto.getEstado().isEmpty()) {
            entity.setEstado(Cita.Estado.valueOf(dto.getEstado()));
        }

        // El vehículo se resuelve en el Controller/Service mediante VehiculoRepository
        return entity;
    }
}