package com.serviteca.Mapper;

import com.serviteca.DTOs.ProveedorDTOs;
import com.serviteca.modelos.Proveedor;

public final class ProveedorMapper {

    private ProveedorMapper() {
    }

    public static ProveedorDTOs toDTO(Proveedor entity) {
        if (entity == null) {
            return null;
        }

        return new ProveedorDTOs(
                entity.getIdProveedor(), // Cambiado getIdproveedor() -> getIdProveedor()
                entity.getNombreProveedor(),
                entity.getNitProveedor(),
                entity.getCorreoProveedor(),
                entity.getTipoProducto()
        );
    }

    public static Proveedor toEntity(ProveedorDTOs dto) {
        if (dto == null) {
            return null;
        }

        Proveedor entity = new Proveedor();
        entity.setIdProveedor(dto.getIdproveedor()); // Cambiado setIdproveedor() -> setIdProveedor()
        entity.setNombreProveedor(dto.getNombreproveedor());
        entity.setNitProveedor(dto.getNitproveedor());
        entity.setCorreoProveedor(dto.getCorreoproveedor());
        entity.setTipoProducto(dto.getTipoproducto());
        return entity;
    }
}