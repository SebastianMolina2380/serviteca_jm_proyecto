package com.serviteca.DTOs;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FacturaDTOs {

    private Long idfactura;
    private Long idusuario;
    private LocalDate fechafactura;
    private BigDecimal total;

    public FacturaDTOs() {
    }

    public FacturaDTOs(Long idfactura, Long idusuario, LocalDate fechafactura, BigDecimal total) {
        this.idfactura = idfactura;
        this.idusuario = idusuario;
        this.fechafactura = fechafactura;
        this.total = total;
    }

    public Long getIdfactura() {
        return idfactura;
    }

    public void setIdfactura(Long idfactura) {
        this.idfactura = idfactura;
    }

    public Long getIdusuario() {
        return idusuario;
    }

    public void setIdusuario(Long idusuario) {
        this.idusuario = idusuario;
    }

    public LocalDate getFechafactura() {
        return fechafactura;
    }

    public void setFechafactura(LocalDate fechafactura) {
        this.fechafactura = fechafactura;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}