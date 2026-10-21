package com.serviteca.DTOs;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record CrearFacturaRequest(
        @NotNull Integer idUsuario,
        @NotNull Integer idCita,
        @NotNull String formaPago,
        String medioPago,
        @Min(0) Integer plazoDias,
        @NotEmpty List<@Valid LineaRequest> detalles) {

    public record LineaRequest(Integer idServicio, Integer idProducto, @NotNull @Positive Integer cantidad) {
        public boolean tieneReferenciaUnica() { return (idServicio == null) != (idProducto == null); }
    }
}
