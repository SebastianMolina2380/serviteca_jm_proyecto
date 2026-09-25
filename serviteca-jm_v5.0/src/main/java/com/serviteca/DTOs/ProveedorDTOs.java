package com.serviteca.DTOs;

public class ProveedorDTOs {

    private Integer idproveedor;
    private String nombreproveedor;
    private String nitproveedor;
    private String correoproveedor;
    private String tipoproducto;

    public ProveedorDTOs() {
    }

    public ProveedorDTOs(Integer idproveedor, String nombreproveedor, String nitproveedor, String correoproveedor, String tipoproducto) {
        this.idproveedor = idproveedor;
        this.nombreproveedor = nombreproveedor;
        this.nitproveedor = nitproveedor;
        this.correoproveedor = correoproveedor;
        this.tipoproducto = tipoproducto;
    }

    public Integer getIdproveedor() {
        return idproveedor;
    }

    public void setIdproveedor(Integer idproveedor) {
        this.idproveedor = idproveedor;
    }

    public String getNombreproveedor() {
        return nombreproveedor;
    }

    public void setNombreproveedor(String nombreproveedor) {
        this.nombreproveedor = nombreproveedor;
    }

    public String getNitproveedor() {
        return nitproveedor;
    }

    public void setNitproveedor(String nitproveedor) {
        this.nitproveedor = nitproveedor;
    }

    public String getCorreoproveedor() {
        return correoproveedor;
    }

    public void setCorreoproveedor(String correoproveedor) {
        this.correoproveedor = correoproveedor;
    }

    public String getTipoproducto() {
        return tipoproducto;
    }

    public void setTipoproducto(String tipoproducto) {
        this.tipoproducto = tipoproducto;
    }
}
