package com.serviteca.DTOs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * DTO de entrada y salida para /api/seguimientos.
 *
 * Evita deserializar/serializar las entidades completas Usuario y Servicio.
 */
public class SeguimientoDTOs {

    private Long idseguimiento;

    @NotNull(message = "El usuario es obligatorio")
    private Integer idusuario;

    private Integer idservicio;

    @NotBlank(message = "El tipo de seguimiento es obligatorio")
    @Size(max = 30)
    private String tipo;

    @Size(max = 100)
    private String titulo;

    @Size(max = 100)
    private String flujo;

    @Size(max = 500)
    private String descripcion;

    @Size(max = 30)
    private String estado;

    @Size(max = 500)
    private String mensaje;

    @Size(max = 30)
    private String remitente;

    private Integer tiempoestimado;

    private Boolean leida;

    private LocalDateTime fecha;

    public Long getIdseguimiento() {
        return idseguimiento;
    }

    public void setIdseguimiento(Long idseguimiento) {
        this.idseguimiento = idseguimiento;
    }

    public Integer getIdusuario() {
        return idusuario;
    }

    public void setIdusuario(Integer idusuario) {
        this.idusuario = idusuario;
    }

    public Integer getIdservicio() {
        return idservicio;
    }

    public void setIdservicio(Integer idservicio) {
        this.idservicio = idservicio;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getFlujo() {
        return flujo;
    }

    public void setFlujo(String flujo) {
        this.flujo = flujo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getRemitente() {
        return remitente;
    }

    public void setRemitente(String remitente) {
        this.remitente = remitente;
    }

    public Integer getTiempoestimado() {
        return tiempoestimado;
    }

    public void setTiempoestimado(Integer tiempoestimado) {
        this.tiempoestimado = tiempoestimado;
    }

    public Boolean getLeida() {
        return leida;
    }

    public void setLeida(Boolean leida) {
        this.leida = leida;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}
