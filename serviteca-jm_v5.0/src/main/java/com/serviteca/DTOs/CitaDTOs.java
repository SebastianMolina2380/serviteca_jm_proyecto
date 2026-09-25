package com.serviteca.DTOs;

import java.time.LocalDate;
import java.time.LocalTime;

public class CitaDTOs {

    // Aplicando convención camelCase correctamente
    private Long idCita;
    private LocalDate fecha;
    private LocalTime hora;
    private Long idUsuario;
    private String estado;

    public CitaDTOs() {
    }

    // Se removió 'Long idServicio' de la lista de parámetros
    public CitaDTOs(Long idCita, LocalDate fecha, LocalTime hora, Long idUsuario, String estado) {
        this.idCita = idCita;
        this.fecha = fecha;
        this.hora = hora;
        this.idUsuario = idUsuario;
        this.estado = estado;
    }

    public Long getIdCita() {
        return idCita;
    }

    public void setIdCita(Long idCita) {
        this.idCita = idCita;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public LocalTime getHora() {
        return hora;
    }

    public void setHora(LocalTime hora) {
        this.hora = hora;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}