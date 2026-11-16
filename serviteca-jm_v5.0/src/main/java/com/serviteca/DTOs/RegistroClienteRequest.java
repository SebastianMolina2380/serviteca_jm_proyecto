package com.serviteca.DTOs;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Datos del registro público de clientes.
 *
 * No expone rol ni estado: el servicio fuerza siempre
 * {@code Rol.CLIENTE} y {@code Estado.ACTIVO}. La contraseña se
 * escribe una sola vez y nunca se devuelve al cliente.
 */
public class RegistroClienteRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
    private String nombre;

    @NotBlank(message = "El número de documento es obligatorio")
    @Size(max = 30, message = "El documento no puede superar 30 caracteres")
    private String numeroDoc;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no es válido")
    @Size(max = 100, message = "El correo no puede superar 100 caracteres")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
    private String contrasena;

    @Size(max = 30, message = "El tipo de documento no puede superar 30 caracteres")
    private String tipoDocumento;

    @Size(max = 30, message = "El teléfono no puede superar 30 caracteres")
    private String telefono;

    @Size(max = 80, message = "La ciudad no puede superar 80 caracteres")
    private String ciudad;

    @Size(max = 180, message = "La dirección no puede superar 180 caracteres")
    private String direccion;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getNumeroDoc() {
        return numeroDoc;
    }

    public void setNumeroDoc(String numeroDoc) {
        this.numeroDoc = numeroDoc;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public void setTipoDocumento(String tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }
}
