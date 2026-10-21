package com.serviteca.configuracion;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "serviteca.facturacion")
public record DatosFiscalesProperties(Emisor emisor, Software software) {
    public record Emisor(String razonSocial, String nit, String direccion, String ciudad, String telefono, String correo,
                         String responsabilidadesFiscales) {}
    public record Software(String nombre, String fabricante, String nitFabricante, String proveedorTecnologico,
                           String nitProveedorTecnologico) {}
}
