package com.serviteca.Mapper;

import com.serviteca.DTOs.VehiculoDTOs;
import com.serviteca.modelos.Vehiculo;

public final class VehiculoMapper {

    private VehiculoMapper() {
    }

    public static VehiculoDTOs toDTO(Vehiculo entity) {
        if (entity == null) {
            return null;
        }

        Integer idUsuario = null;
        if (entity.getUsuario() != null) {
            idUsuario = entity.getUsuario().getIdUsuario();
        }

        return new VehiculoDTOs(
                entity.getIdvehiculo(),
                idUsuario,
                entity.getPlaca(),
                entity.getMarca(),
                entity.getModelo(),
                entity.getColor(),
                entity.getKilometraje() // <-- Se agrega este campo
        );
    }

    public static Vehiculo toEntity(VehiculoDTOs dto) {
        if (dto == null) {
            return null;
        }

        Vehiculo entity = new Vehiculo();
        entity.setIdvehiculo(dto.getIdvehiculo());
        entity.setPlaca(dto.getPlaca());
        entity.setMarca(dto.getMarca());
        entity.setModelo(dto.getModelo());
        entity.setColor(dto.getColor());
        entity.setKilometraje(dto.getKilometraje()); // <-- Se asigna también a la entidad

        return entity;
    }
}