package com.serviteca.Mapper;

import com.serviteca.DTOs.ServicioDTOs;
import com.serviteca.modelos.Servicio;
import com.serviteca.modelos.Vehiculo;

public final class ServicioMapper {

    private ServicioMapper() {}

    public static ServicioDTOs toDTO(Servicio entity) {
        if (entity == null) {
            return null;
        }

        Integer idVehiculo = null;
        if (entity.getVehiculo() != null) {
            idVehiculo = entity.getVehiculo().getIdvehiculo();
        }

        return new ServicioDTOs(
                entity.getIdServicio(), // Se agregó este argumento
                idVehiculo,
                entity.getTipo(),
                entity.getDescripcion(),
                entity.getPrecio()
        );
    }

    public static Servicio toEntity(ServicioDTOs dto) {
        if (dto == null) {
            return null;
        }

        Servicio entity = new Servicio();

        if (dto.getIdservicio() != null) {
            entity.setIdServicio(dto.getIdservicio());
        }

        entity.setTipo(dto.getTipo());
        entity.setDescripcion(dto.getDescripcion());
        entity.setPrecio(dto.getPrecio());

        if (dto.getIdvehiculo() != null) {
            Vehiculo vehiculo = new Vehiculo();
            vehiculo.setIdvehiculo(dto.getIdvehiculo());
            entity.setVehiculo(vehiculo);
        }

        return entity;
    }
}