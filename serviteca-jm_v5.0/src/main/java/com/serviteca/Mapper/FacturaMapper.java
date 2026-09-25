package com.serviteca.Mapper;

import com.serviteca.DTOs.FacturaDTOs;
import com.serviteca.modelos.Factura;
import com.serviteca.modelos.Usuario;

public final class FacturaMapper {

    private FacturaMapper() {}

    public static FacturaDTOs toDTO(Factura entity) {
        if (entity == null) return null;

        Long idFactura = entity.getIdFactura() != null
                ? entity.getIdFactura().longValue() : null;

        Long idUsuario = null;
        if (entity.getUsuario() != null && entity.getUsuario().getIdUsuario() != null) {
            idUsuario = entity.getUsuario().getIdUsuario().longValue();
        }

        return new FacturaDTOs(
                idFactura,
                idUsuario,
                entity.getFecha(),
                entity.getTotal()
        );
    }

    public static Factura toEntity(FacturaDTOs dto) {
        if (dto == null) return null;

        Factura entity = new Factura();

        if (dto.getIdfactura() != null) {
            entity.setIdFactura(dto.getIdfactura().intValue());
        }
        if (dto.getIdusuario() != null) {
            Usuario u = new Usuario();
            u.setIdUsuario(dto.getIdusuario().intValue());
            entity.setUsuario(u);
        }
        entity.setFecha(dto.getFechafactura());
        entity.setTotal(dto.getTotal());

        return entity;
    }
}