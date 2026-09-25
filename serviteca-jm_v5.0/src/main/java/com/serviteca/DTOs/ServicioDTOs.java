package com.serviteca.DTOs;

import java.math.BigDecimal;

public class ServicioDTOs {

    private Integer idservicio;
    private Integer idvehiculo;
    private String tipo;
    private String descripcion;
    private BigDecimal precio;

    public ServicioDTOs() {
    }

    public ServicioDTOs(
            Integer idservicio,
            Integer idvehiculo,
            String tipo,
            String descripcion,
            BigDecimal precio) {

        this.idservicio = idservicio;
        this.idvehiculo = idvehiculo;
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.precio = precio;
    }

    public Integer getIdservicio() {
        return idservicio;
    }

    public void setIdservicio(Integer idservicio) {
        this.idservicio = idservicio;
    }

    public Integer getIdvehiculo() {
        return idvehiculo;
    }

    public void setIdvehiculo(Integer idvehiculo) {
        this.idvehiculo = idvehiculo;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }
}