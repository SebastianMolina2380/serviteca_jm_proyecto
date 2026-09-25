package com.serviteca.DTOs;

public class VehiculoDTOs {

    private Integer idvehiculo;
    private Integer idusuario;
    private String placa;
    private String marca;
    private String modelo;
    private String color;
    private Integer kilometraje;

    public VehiculoDTOs() {
    }

    public VehiculoDTOs(
            Integer idvehiculo,
            Integer idusuario,
            String placa,
            String marca,
            String modelo,
            String color,
            Integer kilometraje) {

        this.idvehiculo = idvehiculo;
        this.idusuario = idusuario;
        this.placa = placa;
        this.marca = marca;
        this.modelo = modelo;
        this.color = color;
        this.kilometraje = kilometraje;
    }

    public Integer getIdvehiculo() {
        return idvehiculo;
    }

    public void setIdvehiculo(Integer idvehiculo) {
        this.idvehiculo = idvehiculo;
    }

    public Integer getIdusuario() {
        return idusuario;
    }

    public void setIdusuario(Integer idusuario) {
        this.idusuario = idusuario;
    }

    public String getPlaca() {
        return placa;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getKilometraje() {
        return kilometraje;
    }

    public void setKilometraje(Integer kilometraje) {
        this.kilometraje = kilometraje;
    }
}