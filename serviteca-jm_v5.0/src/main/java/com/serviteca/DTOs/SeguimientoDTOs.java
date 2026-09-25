package com.serviteca.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeguimientoDTOs {

    private Long idSeguimiento;

    private Long idUsuario;

    private Long idServicio;

    private String tipo;

    private String titulo;

    private String flujo;

    private String descripcion;

    private String estado;

    private String mensaje;

    private String remitente;

    private Integer tiempoestimado;

    private Boolean leida;

    private LocalDateTime fecha;
}