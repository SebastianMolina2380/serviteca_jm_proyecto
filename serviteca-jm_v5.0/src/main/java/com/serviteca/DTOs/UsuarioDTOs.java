package com.serviteca.DTOs;

public class UsuarioDTOs {
    private Long idusuario;
    private String nombre;
    private String numeroDoc;
    private String correo;
    private String contrasena;
    private String rol;
    private String tipoDocumento;
    private String estado;
    private String ultimoAcceso;
    private String direccion;
    private String telefono;
    private String ciudad;

    public UsuarioDTOs() {}

    public UsuarioDTOs(Long idusuario, String nombre, String numeroDoc, String correo,
                       String contrasena, String rol, String tipoDocumento,
                       String estado, String ultimoAcceso, String direccion, String telefono, String ciudad) {
        this.idusuario=idusuario; this.nombre=nombre; this.numeroDoc=numeroDoc;
        this.correo=correo; this.contrasena=contrasena; this.rol=rol;
        this.tipoDocumento=tipoDocumento; this.estado=estado; this.ultimoAcceso=ultimoAcceso;
        this.direccion=direccion; this.telefono=telefono; this.ciudad=ciudad;
    }

    public Long getIdusuario(){return idusuario;} public void setIdusuario(Long v){idusuario=v;}
    public String getNombre(){return nombre;} public void setNombre(String v){nombre=v;}
    public String getNumeroDoc(){return numeroDoc;} public void setNumeroDoc(String v){numeroDoc=v;}
    public String getNumerodoc(){return numeroDoc;} public void setNumerodoc(String v){numeroDoc=v;}
    public String getCorreo(){return correo;} public void setCorreo(String v){correo=v;}
    public String getContrasena(){return contrasena;} public void setContrasena(String v){contrasena=v;}
    public String getRol(){return rol;} public void setRol(String v){rol=v;}
    public String getTipoDocumento(){return tipoDocumento;} public void setTipoDocumento(String v){tipoDocumento=v;}
    public String getEstado(){return estado;} public void setEstado(String v){estado=v;}
    public String getUltimoAcceso(){return ultimoAcceso;} public void setUltimoAcceso(String v){ultimoAcceso=v;}
    public String getDireccion(){return direccion;} public void setDireccion(String v){direccion=v;}
    public String getTelefono(){return telefono;} public void setTelefono(String v){telefono=v;}
    public String getCiudad(){return ciudad;} public void setCiudad(String v){ciudad=v;}
}