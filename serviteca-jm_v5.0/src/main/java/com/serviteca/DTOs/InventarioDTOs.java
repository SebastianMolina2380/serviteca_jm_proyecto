package com.serviteca.DTOs;

import java.math.BigDecimal;

public class InventarioDTOs {

    private Integer idinventario;
    private Integer idproducto;
    private String nombre;
    private Integer cantidad;
    private BigDecimal preciounit;

    public InventarioDTOs() {
    }

    public InventarioDTOs(
            Integer idinventario,
            Integer idproducto,
            String nombre,
            Integer cantidad,
            BigDecimal preciounit) {

        this.idinventario = idinventario;
        this.idproducto = idproducto;
        this.nombre = nombre;
        this.cantidad = cantidad;
        this.preciounit = preciounit;
    }

    public Integer getIdinventario() {
        return idinventario;
    }

    public void setIdinventario(Integer idinventario) {
        this.idinventario = idinventario;
    }

    public Integer getIdproducto() {
        return idproducto;
    }

    public void setIdproducto(Integer idproducto) {
        this.idproducto = idproducto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPreciounit() {
        return preciounit;
    }

    public void setPreciounit(BigDecimal preciounit) {
        this.preciounit = preciounit;
    }
}