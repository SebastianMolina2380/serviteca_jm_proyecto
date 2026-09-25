package com.serviteca.Mapper;

import com.serviteca.DTOs.InventarioDTOs;
import com.serviteca.modelos.Inventario;
import com.serviteca.modelos.Producto;

public final class InventarioMapper {

    private InventarioMapper() {}

    public static InventarioDTOs toDTO(Inventario entity) {
        if (entity == null) {
            return null;
        }

        Integer idInventario = entity.getIdInventario();
        Integer idProducto = null;

        if (entity.getProducto() != null) {
            idProducto = entity.getProducto().getIdProducto();
        }

        return new InventarioDTOs(
                idInventario,
                idProducto,
                entity.getNombre(),
                entity.getCantidad(),
                entity.getPrecioUnit()
        );
    }

    public static Inventario toEntity(InventarioDTOs dto) {
        if (dto == null) {
            return null;
        }

        Inventario entity = new Inventario();

        if (dto.getIdinventario() != null) {
            entity.setIdInventario(dto.getIdinventario());
        }

        if (dto.getIdproducto() != null) {
            Producto producto = new Producto();
            producto.setIdProducto(dto.getIdproducto());
            entity.setProducto(producto);
        }

        entity.setNombre(dto.getNombre());
        entity.setCantidad(dto.getCantidad());
        entity.setPrecioUnit(dto.getPreciounit());

        return entity;
    }
}