package com.serviteca.Mapper;

import com.serviteca.DTOs.ProductoDTOs;
import com.serviteca.modelos.Producto;
import com.serviteca.modelos.Servicio;
import com.serviteca.modelos.Proveedor;

public final class ProductoMapper {

    private ProductoMapper() {}

    public static ProductoDTOs toDTO(Producto entity) {

        if (entity == null) {
            return null;
        }

        Integer idProducto = entity.getIdProducto();
        Integer idServicio = null;

        if (entity.getServicio() != null) {
            idServicio = entity.getServicio().getIdServicio();
        }

        Integer idProveedor = null;

        if (entity.getProveedor() != null) {
            // Cambiado getIdproveedor() -> getIdProveedor()
            idProveedor = entity.getProveedor().getIdProveedor();
        }

        return new ProductoDTOs(
                idProducto,
                idProveedor,
                idServicio,
                entity.getNombreProducto(),
                entity.getPrecioProducto(),
                entity.getDescripcionProducto()
        );
    }

    public static Producto toEntity(ProductoDTOs dto) {

        if (dto == null) {
            return null;
        }

        Producto entity = new Producto();

        if (dto.getIdproducto() != null) {
            entity.setIdProducto(dto.getIdproducto());
        }

        // Relación Producto → Servicio
        if (dto.getIdservicio() != null) {
            Servicio servicio = new Servicio();
            servicio.setIdServicio(dto.getIdservicio());
            entity.setServicio(servicio);
        }

        // Relación Producto → Proveedor
        if (dto.getIdproveedor() != null) {
            Proveedor proveedor = new Proveedor();
            // Cambiado setIdproveedor() -> setIdProveedor()
            proveedor.setIdProveedor(dto.getIdproveedor());
            entity.setProveedor(proveedor);
        }

        entity.setNombreProducto(dto.getNombreproducto());
        entity.setPrecioProducto(dto.getPrecioproducto());
        entity.setDescripcionProducto(dto.getDescripcionproducto());

        return entity;
    }
}