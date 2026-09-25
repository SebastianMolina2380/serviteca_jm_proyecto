package com.serviteca.DTOs;

import java.math.BigDecimal;

public class ProductoDTOs {

    private Integer idproducto;
    private Integer idproveedor;
    private Integer idservicio;
    private String nombreproducto;
    private BigDecimal precioproducto;
    private String descripcionproducto;

    public ProductoDTOs() {
    }

    public ProductoDTOs(
            Integer idproducto,
            Integer idproveedor,
            Integer idservicio,
            String nombreproducto,
            BigDecimal precioproducto,
            String descripcionproducto) {

        this.idproducto = idproducto;
        this.idproveedor = idproveedor;
        this.idservicio = idservicio;
        this.nombreproducto = nombreproducto;
        this.precioproducto = precioproducto;
        this.descripcionproducto = descripcionproducto;
    }

    public Integer getIdproducto() {
        return idproducto;
    }

    public void setIdproducto(Integer idproducto) {
        this.idproducto = idproducto;
    }

    public Integer getIdproveedor() {
        return idproveedor;
    }

    public void setIdproveedor(Integer idproveedor) {
        this.idproveedor = idproveedor;
    }

    public Integer getIdservicio() {
        return idservicio;
    }

    public void setIdservicio(Integer idservicio) {
        this.idservicio = idservicio;
    }

    public String getNombreproducto() {
        return nombreproducto;
    }

    public void setNombreproducto(String nombreproducto) {
        this.nombreproducto = nombreproducto;
    }

    public BigDecimal getPrecioproducto() {
        return precioproducto;
    }

    public void setPrecioproducto(BigDecimal precioproducto) {
        this.precioproducto = precioproducto;
    }

    public String getDescripcionproducto() {
        return descripcionproducto;
    }

    public void setDescripcionproducto(String descripcionproducto) {
        this.descripcionproducto = descripcionproducto;
    }
}