package com.serviteca.DTOs;

import java.math.BigDecimal;

public class DetalleFacturaDTOs {

    private Long idDetalleFactura;
    private Long idServicio;
    private Long idProducto;
    private Long idFactura;
    private String item;
    private String nombre;
    private Integer cantidad;
    private BigDecimal valor;
    private BigDecimal subtotal;

    public DetalleFacturaDTOs() {
    }

    public DetalleFacturaDTOs(Long idDetalleFactura, Long idServicio, Long idProducto, Long idFactura, String item, String nombre, Integer cantidad, BigDecimal valor, BigDecimal subtotal) {
        this.idDetalleFactura = idDetalleFactura;
        this.idServicio = idServicio;
        this.idProducto = idProducto;
        this.idFactura = idFactura;
        this.item = item;
        this.nombre = nombre;
        this.cantidad = cantidad;
        this.valor = valor;
        this.subtotal = subtotal;
    }

    public Long getIdDetalleFactura() {
        return idDetalleFactura;
    }

    public void setIdDetalleFactura(Long idDetalleFactura) {
        this.idDetalleFactura = idDetalleFactura;
    }

    public Long getIdServicio() {
        return idServicio;
    }

    public void setIdServicio(Long idServicio) {
        this.idServicio = idServicio;
    }

    public Long getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Long idProducto) {
        this.idProducto = idProducto;
    }

    public Long getIdFactura() {
        return idFactura;
    }

    public void setIdFactura(Long idFactura) {
        this.idFactura = idFactura;
    }

    public String getItem() {
        return item;
    }

    public void setItem(String item) {
        this.item = item;
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

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}