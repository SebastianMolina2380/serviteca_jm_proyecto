package com.serviteca.DTOs;

import com.serviteca.modelos.Servicio;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Vista plana de un servicio para el portal técnico.
 *
 * La entidad {@link Servicio} oculta el propietario del vehículo al
 * serializarse, por lo que el portal necesita este DTO para mostrar
 * placa y cliente sin exponer el resto de relaciones.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ServicioPortalDTO {

    private Integer idServicio;
    private String tipo;
    private String descripcion;
    private String estado;
    private Integer progreso;
    private Boolean activo;
    private LocalDateTime fechaServicio;
    private Integer idVehiculo;
    private String placa;
    private String vehiculo;
    private String cliente;

    public static ServicioPortalDTO from(Servicio servicio) {
        if (servicio == null) return null;

        ServicioPortalDTO dto = new ServicioPortalDTO();
        dto.setIdServicio(servicio.getIdServicio());
        dto.setTipo(servicio.getTipo());
        dto.setDescripcion(servicio.getDescripcion());
        dto.setEstado(servicio.getEstado() == null ? null : servicio.getEstado().name());
        dto.setProgreso(servicio.getProgreso());
        dto.setActivo(servicio.getActivo());
        dto.setFechaServicio(servicio.getFechaServicio());

        if (servicio.getVehiculo() != null) {
            dto.setIdVehiculo(servicio.getVehiculo().getIdvehiculo());
            dto.setPlaca(servicio.getVehiculo().getPlaca());
            dto.setVehiculo((texto(servicio.getVehiculo().getMarca()) + " "
                    + texto(servicio.getVehiculo().getModelo())).trim());
            if (servicio.getVehiculo().getUsuario() != null) {
                dto.setCliente(servicio.getVehiculo().getUsuario().getNombre());
            }
        }

        return dto;
    }

    private static String texto(String valor) {
        return valor == null ? "" : valor;
    }
}
