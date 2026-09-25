package com.serviteca.Mapper;

import com.serviteca.DTOs.DetalleFacturaDTOs;
import com.serviteca.modelos.DetalleFactura;
import com.serviteca.modelos.Factura;
import com.serviteca.modelos.Producto;
import com.serviteca.modelos.Servicio;

public final class DetalleFacturaMapper {

    private DetalleFacturaMapper() {}

    public static DetalleFacturaDTOs toDTO(DetalleFactura entity) {
        if (entity == null) return null;

        Long idDetalle = entity.getIdDetalleFactura() != null
                ? entity.getIdDetalleFactura().longValue() : null;

        Long idFactura = null;
        if (entity.getFactura() != null && entity.getFactura().getIdFactura() != null) {
            idFactura = entity.getFactura().getIdFactura().longValue();
        }

        Long idServicio = null;
        if (entity.getServicio() != null && entity.getServicio().getIdServicio() != null) {
            idServicio = entity.getServicio().getIdServicio().longValue();
        }

        Long idProducto = null;
        if (entity.getProducto() != null && entity.getProducto().getIdProducto() != null) {
            idProducto = entity.getProducto().getIdProducto().longValue();
        }

        return new DetalleFacturaDTOs(
                idDetalle,
                idServicio,
                idProducto,            // Se agregó el parámetro que faltaba
                idFactura,
                null,                  // 'item'
                entity.getNombre(),
                entity.getCantidad(),
                entity.getValor(),
                entity.getSubtotal()
        );
    }

    public static DetalleFactura toEntity(DetalleFacturaDTOs dto) {
        if (dto == null) return null;

        DetalleFactura entity = new DetalleFactura();

        if (dto.getIdDetalleFactura() != null) {
            entity.setIdDetalleFactura(dto.getIdDetalleFactura().intValue());
        }
        if (dto.getIdFactura() != null) {
            Factura f = new Factura();
            f.setIdFactura(dto.getIdFactura().intValue());
            entity.setFactura(f);
        }
        if (dto.getIdServicio() != null) {
            Servicio s = new Servicio();
            s.setIdServicio(dto.getIdServicio().intValue());
            entity.setServicio(s);
        }
        if (dto.getIdProducto() != null) {
            Producto p = new Producto();
            p.setIdProducto(dto.getIdProducto().intValue());
            entity.setProducto(p);
        }
        entity.setNombre(dto.getNombre());
        entity.setCantidad(dto.getCantidad());
        entity.setValor(dto.getValor());
        entity.setSubtotal(dto.getSubtotal());

        return entity;
    }
}